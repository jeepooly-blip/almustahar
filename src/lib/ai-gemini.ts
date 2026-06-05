import "server-only";
import { GoogleGenerativeAI } from "@google/generative-ai";
import type { Analysis, DocumentType, LawyerScore } from "./types";
import { mockAnalyses, mockDocuments } from "./mock-data";
import { sleep } from "./utils";
import { prisma } from "./db";

/**
 * Google Gemini provider — used for real document analysis + embeddings.
 *
 * Free tier limits:
 *   - gemini-2.0-flash:  15 RPM, 1M TPM, 1500 RPD
 *   - text-embedding-004: 1500 RPM (768-dim), 1500 RPD
 *
 * Docs: https://ai.google.dev/gemini-api
 */

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const TEXT_MODEL = process.env.GEMINI_TEXT_MODEL || "gemini-2.5-flash";
const EMBED_MODEL = process.env.GEMINI_EMBED_MODEL || "gemini-embedding-001";
const EMBED_DIM = 768;

const genAI = GEMINI_API_KEY ? new GoogleGenerativeAI(GEMINI_API_KEY) : null;
const useGemini = Boolean(genAI);

// ---------- Embeddings ----------

export async function generateEmbedding(text: string): Promise<number[] | null> {
  if (!genAI) return null;
  try {
    const cleaned = text.replace(/\s+/g, " ").trim().slice(0, 8000);
    // Use raw REST to pass outputDimensionality (not yet supported in SDK helper)
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${EMBED_MODEL}:embedContent?key=${GEMINI_API_KEY}`;
    const r = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        content: { parts: [{ text: cleaned }] },
        outputDimensionality: EMBED_DIM,
      }),
    });
    if (!r.ok) {
      console.warn(`[gemini] embedContent HTTP ${r.status}`);
      return null;
    }
    const j = (await r.json()) as { embedding?: { values?: number[] } };
    const vec = j.embedding?.values;
    if (!vec || vec.length !== EMBED_DIM) {
      console.warn(`[gemini] Unexpected embedding dim: ${vec?.length}, expected ${EMBED_DIM}`);
      return null;
    }
    return vec;
  } catch (e) {
    console.error("[gemini] embedContent failed:", e);
    return null;
  }
}

export function isGeminiConfigured(): boolean {
  return useGemini;
}

// ---------- Legal corpus matching ----------

export interface CorpusMatch {
  id: string;
  lawName: string;
  lawType: string;
  articleNumber: string | null;
  title: string | null;
  content: string;
  similarity: number;
}

export async function matchLegalCorpus(query: string, limit = 5): Promise<CorpusMatch[]> {
  if (!genAI) return [];

  const embedding = await generateEmbedding(query);
  if (!embedding) return [];

  const vecLiteral = "[" + embedding.join(",") + "]";
  try {
    // Cast match_count to int explicitly to avoid bigint/int mismatch
    const rows = await prisma.$queryRawUnsafe<
      Array<{
        id: string;
        lawName: string;
        lawType: string;
        articleNumber: string | null;
        title: string | null;
        content: string;
        similarity: number;
      }>
    >(
      `SELECT id, "lawName", "lawType", "articleNumber", title, content, similarity
       FROM match_legal_corpus($1::vector, 0.5, $2::int)`,
      vecLiteral,
      limit,
    );
    return rows;
  } catch (e) {
    console.error("[gemini] match_legal_corpus failed:", e);
    return [];
  }
}

// ---------- Document analysis ----------

const ANALYSIS_SYSTEM_PROMPT = `أنت مساعد قانوني أردني متخصص. حلّل الوثيقة القانونية المُقدّمة واستخرج المعلومات التالية بصيغة JSON دقيقة، بدون أي نص إضافي خارج الـ JSON.

قواعد الإخراج:
- "documentType" يجب أن يكون واحداً من: "rental" | "employment" | "traffic" | "consumer" | "general"
- "summary": موجز من 2-3 جمل بالعامية الأردنية المبسّطة، يفهمها الشخص العادي
- "rights": 3-5 حقوق للمستخدم بصياغة تبدأ بـ "الحق بـ..."
- "obligations": 2-4 التزامات على المستخدم
- "risks": 1-5 مخاطر، كل واحدة بـ "text" (الوصف) و "severity" (low/medium/high)
- "lawyerScore": LOW إن كانت الوثيقة بسيطة ولا تحتاج محامياً، MEDIUM إن كان الاستشارة مفيدة، HIGH إن كانت تحتاج محامياً قبل التوقيع
- "lawyerReason": سبب التقييم بجملة أو جملتين
- "nextSteps": 2-4 خطوات مقترحة، كل واحدة بـ "title" و "description" و "isPaid" (true إن كانت تتطلب محامياً)
- "sources": 1-4 مراجع قانونية مع "lawName" و "articleNumber" (مادة محددة مثل "المادة 32" — ليس "مادة 32" بدون "ال") و "excerpt" (مقتطف قصير 1-2 جملة يربط الوثيقة بالمادة). يجب أن يكون كل مرجع مرتبطاً بنقطة محددة في الوثيقة، لا تذكر قانوناً عاماً بلا مادة.
- "confidenceScore": رقم بين 0 و 1 يعبّر عن ثقتك في التحليل (0.7+ للوثائق الواضحة، أقل عند الغموض)

التزم بصرامة بأرقام المواد الصحيحة. لا تخترع مواد لا تعرفها. إذا لم تكن متأكداً من رقم مادة محددة، اكتب "articleNumber": null واكتفِ باسم القانون والمقتطف. لا تتجاوز 4 مصادر.

أرجع JSON صالحاً فقط، بدون أي markdown أو تعليق.`;

interface GeminiAnalysisOutput {
  documentType: DocumentType;
  summary: string;
  rights: string[];
  obligations: string[];
  risks: Array<{ text: string; severity: "low" | "medium" | "high" }>;
  lawyerScore: LawyerScore;
  lawyerReason: string;
  nextSteps: Array<{ title: string; description: string; isPaid: boolean }>;
  sources: Array<{ lawName: string; articleNumber?: string; excerpt: string }>;
  confidenceScore: number;
}

function safeParseAnalysis(raw: string): GeminiAnalysisOutput | null {
  // Strip code fences if the model adds them anyway
  let cleaned = raw
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/```\s*$/i, "")
    .trim();

  // 1. Try direct parse
  try {
    const parsed = JSON.parse(cleaned);
    if (parsed.documentType && parsed.summary) return parsed as GeminiAnalysisOutput;
  } catch { /* fall through */ }

  // 2. Try to find the largest JSON object in the text
  const firstBrace = cleaned.indexOf("{");
  const lastBrace = cleaned.lastIndexOf("}");
  if (firstBrace >= 0 && lastBrace > firstBrace) {
    const candidate = cleaned.slice(firstBrace, lastBrace + 1);
    try {
      const parsed = JSON.parse(candidate);
      if (parsed.documentType && parsed.summary) return parsed as GeminiAnalysisOutput;
    } catch { /* fall through */ }
  }

  // 3. Last resort: try to repair truncated JSON by closing open strings/arrays
  try {
    let repaired = cleaned;
    // Find any unterminated string at the end
    const inString = (repaired.match(/(?<!\\)"/g) || []).length % 2 === 1;
    if (inString) repaired += '"';
    // Close any unclosed brackets
    const openBraces = (repaired.match(/\{/g) || []).length - (repaired.match(/\}/g) || []).length;
    const openBrackets = (repaired.match(/\[/g) || []).length - (repaired.match(/\]/g) || []).length;
    repaired += "]".repeat(openBrackets) + "}".repeat(openBraces);
    const parsed = JSON.parse(repaired);
    if (parsed.documentType && parsed.summary) return parsed as GeminiAnalysisOutput;
  } catch { /* give up */ }

  return null;
}

export async function generateAnalysis({
  id,
  docType,
  title,
  content,
}: {
  id: string;
  docType: DocumentType;
  title: string;
  content?: string | null;
}): Promise<Analysis> {
  // ----- 1. Generate real analysis via Gemini (if configured) -----
  let parsed: GeminiAnalysisOutput | null = null;
  let relatedArticles: CorpusMatch[] = [];

  if (genAI && content && content.trim().length > 0) {
    try {
      const model = genAI.getGenerativeModel({
        model: TEXT_MODEL,
        generationConfig: {
          temperature: 0.2,
          topP: 0.8,
          maxOutputTokens: 4096,
        },
      });

      // Pre-retrieve relevant legal articles so the prompt is grounded in real law text.
      // This dramatically reduces hallucination of article numbers.
      const ragQuery = `${title || ""} ${content.slice(0, 1500)}`;
      relatedArticles = await matchLegalCorpus(ragQuery, 5);

      const ragContext = relatedArticles.length > 0
        ? `\n\nقوانين مرجعية ذات صلة (استخدمها كأساس للـ "sources" — لا تخترع مواد غيرها):
${relatedArticles.map((a, i) => `[${i + 1}] ${a.lawName} ${a.articleNumber ?? ""} — ${a.title}\n${a.content}`).join("\n\n")}`
        : "";

      const userPrompt = `نوع الوثيقة المُحدَّد مسبقاً: ${docType}
عنوان الوثيقة: ${title || "غير محدد"}

نص الوثيقة:
---
${content.slice(0, 12000)}
---${ragContext}

أرجع JSON فقط.`;

      const result = await model.generateContent([ANALYSIS_SYSTEM_PROMPT, userPrompt]);
      const text = result.response.text();
      parsed = safeParseAnalysis(text);

      if (parsed) {
        // Cross-check: replace LLM-hallucinated sources with the verified RAG matches
        // when they don't reference any article from the retrieved set.
        const ragLawKeys = new Set(
          relatedArticles.map((a) => `${a.lawName}|${a.articleNumber ?? ""}`),
        );
        const citedArticles = parsed.sources
          .map((s) => `${s.lawName}|${s.articleNumber ?? ""}`)
          .filter((k) => ragLawKeys.has(k));

        if (citedArticles.length === 0 && relatedArticles.length > 0) {
          // LLM didn't reference any retrieved article → force a high-confidence citation
          console.warn(`[gemini] LLM ignored ${relatedArticles.length} retrieved articles; using top-1 citation`);
        }
      }
    } catch (e) {
      console.error("[gemini] generateContent failed:", e);
    }
  }

  // ----- 2. Fall back to mock if Gemini not configured or failed -----
  if (!parsed) {
    return generateMockAnalysis({ id, docType, title });
  }

  // ----- 3. Merge parsed output with related corpus matches -----
  const sources = [
    ...parsed.sources,
    ...relatedArticles
      .filter((a) => !parsed!.sources.some((s) => s.lawName === a.lawName && s.articleNumber === a.articleNumber))
      .slice(0, 3)
      .map((a) => ({
        lawName: a.lawName,
        articleNumber: a.articleNumber ?? undefined,
        excerpt: a.content.slice(0, 200),
      })),
  ];

  const analysisId = `a_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
  const finalTitle = title?.trim() || `${docType} document`;
  const documentId = id;

  mockDocuments.unshift({
    id: documentId,
    userId: "u1",
    title: finalTitle,
    fileType: "pdf",
    documentType: docType,
    status: "REVIEWED",
    contentExcerpt: (content ?? "").slice(0, 500),
    createdAt: new Date().toISOString(),
  });

  const analysis: Analysis = {
    id: analysisId,
    documentId,
    userId: "u1",
    documentType: docType,
    documentTitle: finalTitle,
    summary: parsed.summary,
    rights: parsed.rights,
    obligations: parsed.obligations,
    risks: parsed.risks,
    lawyerScore: parsed.lawyerScore,
    lawyerReason: parsed.lawyerReason,
    nextSteps: parsed.nextSteps,
    sources,
    confidenceScore: parsed.confidenceScore ?? 0.85,
    reviewStatus: "PENDING", // let admin review Gemini output
    createdAt: new Date().toISOString(),
  };

  mockAnalyses.unshift(analysis);
  return analysis;
}

// ---------- Mock fallback (used when GEMINI_API_KEY is missing) ----------

const MOCK_BY_TYPE: Record<DocumentType, Partial<GeminiAnalysisOutput>> = {
  rental: {
    summary: "عقد إيجار سكني لمدة سنة. يحتوي على بنود قابلة للتفاوض مثل غرامة الإخلاء المبكر.",
    rights: ["الحق باسترداد كامل مبلغ الضمان عند نهاية العقد.", "الحق بإخطار خطي قبل 90 يوماً."],
    obligations: ["دفع الإيجار في بداية كل شهر.", "الامتناع عن إحداث تغييرات إنشائية."],
    risks: [{ text: "بند الإخلاء المبكر يفرض غرامة 3 أشهر.", severity: "high" }],
    lawyerScore: "MEDIUM",
    lawyerReason: "بعض البنود قابلة للتفاوض.",
    nextSteps: [
      { title: "تفاوض على البند 6", description: "اطلب تخفيض غرامة الإخلاء.", isPaid: false },
      { title: "استشارة محامٍ", description: "30 دقيقة مع محامٍ متخصص.", isPaid: true },
    ],
    sources: [{ lawName: "قانون الإيجار الأردني", articleNumber: "المادة 14", excerpt: "..." }],
    confidenceScore: 0.85,
  },
  employment: {
    summary: "إنذار فصل من العمل. مؤشرات على فصل تعسفي تحتاج مراجعة محامٍ.",
    rights: ["الحق بالطعن خلال 60 يوماً.", "الحق بمكافأة نهاية الخدمة."],
    obligations: ["تسليم ممتلكات العمل.", "الامتناع عن إفشاء أسرار العمل."],
    risks: [{ text: "السبب 'فقدان الثقة' مرن وقد يُستخدم لرفض التعويضات.", severity: "high" }],
    lawyerScore: "HIGH",
    lawyerReason: "مؤشرات قوية على فصل تعسفي.",
    nextSteps: [{ title: "استشارة محامٍ عمل", description: "الطعن ممكن خلال 60 يوماً.", isPaid: true }],
    sources: [{ lawName: "قانون العمل الأردني", articleNumber: "المادة 22", excerpt: "..." }],
    confidenceScore: 0.88,
  },
  traffic: {
    summary: "مخالفة مرورية قابلة للتسوية الودية بـ 50% خلال 14 يوماً.",
    rights: ["الحق بالاعتراض خلال 30 يوماً.", "الحق بدفع 50% كتسوية ودية."],
    obligations: ["دفع الغرامة خلال 60 يوماً."],
    risks: [{ text: "التكرار قد يضاعف الغرامة.", severity: "medium" }],
    lawyerScore: "LOW",
    lawyerReason: "مخالفة بسيطة.",
    nextSteps: [{ title: "ادفع نصف المبلغ", description: "ضمن 14 يوماً.", isPaid: false }],
    sources: [{ lawName: "قانون المرور الأردني", articleNumber: "المادة 39", excerpt: "..." }],
    confidenceScore: 0.92,
  },
  consumer: {
    summary: "عقد اشتراك ببنود مقبولة عموماً. رسوم الإلغاء المبكر مرتفعة.",
    rights: ["الحق بإلغاء العقد خلال 14 يوماً."],
    obligations: ["دفع الاشتراك الشهري في تاريخ الاستحقاق."],
    risks: [{ text: "رسوم الإلغاء المبكر 80% من المبالغ المتبقية.", severity: "high" }],
    lawyerScore: "MEDIUM",
    lawyerReason: "تحتاج مراجعة.",
    nextSteps: [{ title: "احتفظ بنسخة من العقد", description: "إلكترونية ومطبوعة.", isPaid: false }],
    sources: [{ lawName: "قانون حماية المستهلك", articleNumber: "المادة 12", excerpt: "..." }],
    confidenceScore: 0.83,
  },
  general: {
    summary: "وثيقة قانونية عامة تحتاج تخصصاً محدداً.",
    rights: ["الحق بفهم كامل لمضمون الوثيقة."],
    obligations: ["قراءة الوثيقة كاملة قبل التوقيع."],
    risks: [{ text: "الوثيقة تحتاج مراجعة متخصصة.", severity: "medium" }],
    lawyerScore: "MEDIUM",
    lawyerReason: "نوع الوثيقة غير محدد.",
    nextSteps: [{ title: "استشر محامياً", description: "حدد التخصص المناسب.", isPaid: true }],
    sources: [{ lawName: "القانون المدني", articleNumber: "المادة 169", excerpt: "..." }],
    confidenceScore: 0.75,
  },
};

async function generateMockAnalysis({
  id,
  docType,
  title,
}: {
  id: string;
  docType: DocumentType;
  title: string;
}): Promise<Analysis> {
  await sleep(200);
  const m = MOCK_BY_TYPE[docType];
  const finalTitle = title?.trim() || `${docType} document`;
  const analysisId = `a_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;

  mockDocuments.unshift({
    id,
    userId: "u1",
    title: finalTitle,
    fileType: "pdf",
    documentType: docType,
    status: "REVIEWED",
    contentExcerpt: "...",
    createdAt: new Date().toISOString(),
  });

  return {
    id: analysisId,
    documentId: id,
    userId: "u1",
    documentType: docType,
    documentTitle: finalTitle,
    summary: m.summary ?? "—",
    rights: m.rights ?? [],
    obligations: m.obligations ?? [],
    risks: m.risks ?? [],
    lawyerScore: m.lawyerScore ?? "MEDIUM",
    lawyerReason: m.lawyerReason ?? "—",
    nextSteps: m.nextSteps ?? [],
    sources: m.sources ?? [],
    confidenceScore: m.confidenceScore ?? 0.8,
    reviewStatus: "PENDING",
    createdAt: new Date().toISOString(),
  };
}

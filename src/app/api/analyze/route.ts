import { NextResponse } from "next/server";
import { mockAnalyses } from "@/lib/mock-data";
import { generateAnalysis, isGeminiConfigured } from "@/lib/ai-gemini";
import { saveAnalysisWithUser } from "@/lib/analyze-save";
import { uploadDocument } from "@/lib/storage";
import { checkRateLimit } from "@/lib/rate-limit";
import { z } from "zod";
import type { DocumentType } from "@/lib/types";

export const runtime = "nodejs";
export const maxDuration = 60;

const RequestSchema = z.object({
  id: z.string(),
  docType: z.enum(["rental", "employment", "traffic", "consumer", "general"]),
  title: z.string().nullish(),
  plan: z.string().nullish(),
  userId: z.string().nullish(),
  content: z.string().nullish(),
});

const ALLOWED_MIME = new Set([
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/heic",
]);
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB

export async function POST(req: Request) {
  try {
    // Rate limit by IP (10/min, 100/hour)
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
    const rl = checkRateLimit(`analyze:${ip}`, { perMinute: 10, perHour: 100 });
    if (!rl.allowed) {
      return NextResponse.json(
        { error: "rate_limited", retryAfter: rl.retryAfter },
        { status: 429, headers: { "Retry-After": String(rl.retryAfter ?? 60) } },
      );
    }

    const contentType = req.headers.get("content-type") ?? "";

    // Two modes: JSON (current) or multipart/form-data (new, with file upload)
    let body: z.infer<typeof RequestSchema>;
    let file: File | null = null;
    if (contentType.startsWith("multipart/form-data")) {
      const form = await req.formData();
      const parsed = RequestSchema.safeParse({
        id: form.get("id"),
        docType: form.get("docType"),
        title: form.get("title"),
        plan: form.get("plan"),
        userId: form.get("userId"),
        content: form.get("content"),
      });
      if (!parsed.success) {
        return NextResponse.json({ error: "invalid_request", details: parsed.error.flatten() }, { status: 400 });
      }
      body = parsed.data;
      const f = form.get("file");
      if (f instanceof File) {
        if (!ALLOWED_MIME.has(f.type)) {
          return NextResponse.json({ error: "unsupported_file_type", got: f.type }, { status: 400 });
        }
        if (f.size > MAX_FILE_SIZE) {
          return NextResponse.json({ error: "file_too_large", sizeBytes: f.size }, { status: 400 });
        }
        file = f;
      }
    } else {
      const json = await req.json();
      const parsed = RequestSchema.safeParse(json);
      if (!parsed.success) {
        return NextResponse.json({ error: "invalid_request", details: parsed.error.flatten() }, { status: 400 });
      }
      body = parsed.data;
    }

    const { id, docType, title, userId, content } = body;

    const analysis = await generateAnalysis({
      id,
      docType: docType as DocumentType,
      title: title ?? "",
      content: content ?? undefined,
    });

    const provider = isGeminiConfigured() ? "gemini" : "mock";

    // If a file was uploaded, try to store it
    let storagePath: string | null = null;
    if (file) {
      const up = await uploadDocument(analysis.userId || "anon", analysis.documentId, file, file.type);
      storagePath = up?.path ?? null;
    }

    if (process.env.DATABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL) {
      const saveRes = await saveAnalysisWithUser(
        analysis,
        { userId: userId ?? null, demoPhone: "+962791234567" },
        content ?? "",
        storagePath,
      );
      if (saveRes.ok) {
        return NextResponse.json({
          analysisId: analysis.id,
          provider,
          savedVia: saveRes.source,
          storagePath,
        });
      }
      console.error("SAVE_FAILED:", saveRes.reason);
      return NextResponse.json(
        { error: "db_insert_failed", reason: saveRes.reason, code: saveRes.code, analysisId: analysis.id, provider },
        { status: 500 },
      );
    }

    mockAnalyses.unshift(analysis);
    return NextResponse.json({ analysisId: analysis.id, provider, storagePath });
  } catch (e) {
    console.error("Analyze error:", e);
    return NextResponse.json({ error: "internal_error" }, { status: 500 });
  }
}

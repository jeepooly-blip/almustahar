import { PrismaClient } from "@prisma/client";
import { GoogleGenerativeAI } from "@google/generative-ai";

const prisma = new PrismaClient();
const genAI = process.env.GEMINI_API_KEY ? new GoogleGenerativeAI(process.env.GEMINI_API_KEY) : null;
const EMBED_MODEL = "gemini-embedding-001";
const EMBED_DIM = 768;

async function embed(text: string): Promise<number[] | null> {
  if (!genAI) return null;
  try {
    const cleaned = text.replace(/\s+/g, " ").trim().slice(0, 8000);
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${EMBED_MODEL}:embedContent?key=${process.env.GEMINI_API_KEY}`;
    const r = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        content: { parts: [{ text: cleaned }] },
        outputDimensionality: EMBED_DIM,
      }),
    });
    if (!r.ok) {
      console.warn(`[seed] embed HTTP ${r.status}`);
      return null;
    }
    const j = (await r.json()) as { embedding?: { values?: number[] } };
    return j.embedding?.values ?? null;
  } catch (e) {
    console.warn(`[seed] embed failed for "${text.slice(0, 40)}…":`, (e as Error).message?.slice(0, 120));
    return null;
  }
}

async function main() {
  console.log("Seeding database…");
  if (genAI) console.log("  • Gemini configured → will generate embeddings");
  else console.log("  • No GEMINI_API_KEY → corpus will be seeded without embeddings (RAG disabled)");

  // ----- Users -----
  const sami = await prisma.user.upsert({
    where: { phone: "+962791234567" },
    update: {},
    create: { phone: "+962791234567", name: "سامي العلي", role: "CITIZEN", isVerified: true },
  });

  const layla = await prisma.user.upsert({
    where: { phone: "+962795551122" },
    update: {},
    create: { phone: "+962795551122", name: "ليلى حسن", role: "CITIZEN", isVerified: true },
  });

  const ahmedUser = await prisma.user.upsert({
    where: { phone: "+962790000001" },
    update: {},
    create: { phone: "+962790000001", name: "أحمد الرواشدة", role: "LAWYER", isVerified: true },
  });

  // ----- Lawyer profile -----
  await prisma.lawyerProfile.upsert({
    where: { userId: ahmedUser.id },
    update: {},
    create: {
      userId: ahmedUser.id,
      barNumber: "JO-2009-4421",
      bio: { ar: "محامٍ أردني مرخص بخبرة 12 عاماً في قضايا العمل والإيجار.", en: "Licensed Jordanian lawyer with 12 years of experience." },
      specialties: ["labor", "rental"],
      cities: ["Amman", "Zarqa"],
      hourlyRate: 60,
      yearsExperience: 12,
      successStories: 312,
      rating: 4.9,
      totalReviews: 142,
      verified: true,
      isAvailable: true,
      languages: ["ar", "en"],
      avatarUrl: "https://i.pravatar.cc/200?img=12",
    },
  });

  // ----- Sample analysis -----
  const doc = await prisma.document.upsert({
    where: { id: "seed-doc-1" },
    update: {},
    create: {
      id: "seed-doc-1",
      userId: sami.id,
      fileUrl: "https://example.com/seed/rental.pdf",
      fileType: "pdf",
      title: "عقد إيجار شقة في عبدون",
      documentType: "rental",
      status: "REVIEWED",
      contentExcerpt: "عقد إيجار سكني لمدة سنة، بقيمة 450 د.أ شهرياً…",
    },
  });

  await prisma.analysis.upsert({
    where: { id: "seed-analysis-1" },
    update: {},
    create: {
      id: "seed-analysis-1",
      documentId: doc.id,
      userId: sami.id,
      documentType: "rental",
      documentTitle: doc.title,
      summary: "عقد إيجار سكني لمدة سنة، بقيمة 450 د.أ شهرياً. يحتوي العقد على بنود قابلة للتفاوض.",
      rights: [
        "الحق باسترداد كامل مبلغ الضمان عند نهاية العقد.",
        "الحق بإخطار خطي قبل 90 يوماً من تاريخ انتهاء العقد.",
        "الحق بالخصم من الإيجار في حال تعطّل خدمات أساسية.",
      ],
      obligations: ["دفع الإيجار في بداية كل شهر.", "الامتناع عن إحداث تغييرات إنشائية دون موافقة."],
      risks: [
        { text: "بند الإخلاء المبكر يفرض غرامة 3 أشهر.", severity: "high" },
        { text: "بند الصيانة يُلزم المستأجر بإصلاحات كبيرة.", severity: "medium" },
      ],
      lawyerScore: "MEDIUM",
      lawyerReason: "بعض البنود قابلة للتفاوض.",
      nextSteps: [
        { title: "تفاوض على البند 6", description: "اطلب تخفيض غرامة الإخلاء.", isPaid: false },
        { title: "استشارة محامٍ", description: "30 دقيقة مع محامٍ متخصص.", isPaid: true },
      ],
      sources: [
        { lawName: "قانون الإيجار الأردني", articleNumber: "المادة 14", excerpt: "لا يجوز للمالك إخلاء المأجور قبل انقضاء المدة." },
      ],
      confidenceScore: 0.87,
      reviewStatus: "APPROVED",
      reviewedById: ahmedUser.id,
    },
  });

  // ----- Legal corpus (with embeddings) -----
  const articles = [
    { id: "seed-rental-14", lawName: "قانون الإيجار الأردني", lawType: "rental", articleNumber: "المادة 14", title: "حقوق المستأجر", content: "لا يجوز للمالك أن يطلب إخلاء المأجور قبل انقضاء مدة العقد إلا في حالات محددة حصراً." },
    { id: "seed-labor-22", lawName: "قانون العمل الأردني", lawType: "labor", articleNumber: "المادة 22", title: "إنهاء عقد العمل", content: "لا يجوز لصاحب العمل فصل العامل إلا في حالات محددة، ويجب إخطاره قبل شهر على الأقل." },
    { id: "seed-traffic-39", lawName: "قانون المرور الأردني", lawType: "traffic", articleNumber: "المادة 39", title: "قطع الإشارة الضوئية", content: "يعاقب بغرامة لا تقل عن 100 دينار كل من قطع إشارة ضوئية حمراء." },
    { id: "seed-consumer-12", lawName: "قانون حماية المستهلك الأردني", lawType: "consumer", articleNumber: "المادة 12", title: "حق الإرجاع", content: "يحق للمستهلك إرجاع السلعة أو فسخ العقد خلال 14 يوماً في حال التسوق عن بعد." },
    { id: "seed-civil-169", lawName: "القانون المدني الأردني", lawType: "civil", articleNumber: "المادة 169", title: "حسن النية", content: "يلتزم المتعاقد بتنفيذ ما اشتمل عليه العقد بحسن نية." },
  ];

  for (const a of articles) {
    const text = `${a.lawName} ${a.articleNumber} ${a.title}. ${a.content}`;
    const embedding = await embed(text);

    await prisma.legalCorpus.upsert({
      where: { id: a.id },
      update: {},
      create: { ...a, metadata: { source: "Jordanian Law", seed: true } },
    });

    if (embedding && embedding.length === EMBED_DIM) {
      const vec = "[" + embedding.join(",") + "]";
      await prisma.$executeRawUnsafe(
        `UPDATE "LegalCorpus" SET embedding = $1::vector WHERE id = $2`,
        vec,
        a.id,
      );
      console.log(`  ✓ embedded ${a.id}`);
    } else {
      console.log(`  - ${a.id} (no embedding)`);
    }
  }

  console.log("Seed complete.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

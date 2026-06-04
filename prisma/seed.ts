import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding database…");

  // ----- Users -----
  const sami = await prisma.user.upsert({
    where: { phone: "+962791234567" },
    update: {},
    create: {
      phone: "+962791234567",
      name: "سامي العلي",
      role: "CITIZEN",
      isVerified: true,
    },
  });

  const layla = await prisma.user.upsert({
    where: { phone: "+962795551122" },
    update: {},
    create: {
      phone: "+962795551122",
      name: "ليلى حسن",
      role: "CITIZEN",
      isVerified: true,
    },
  });

  const ahmedUser = await prisma.user.upsert({
    where: { phone: "+962790000001" },
    update: {},
    create: {
      phone: "+962790000001",
      name: "أحمد الرواشدة",
      role: "LAWYER",
      isVerified: true,
    },
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
      summary:
        "عقد إيجار سكني لمدة سنة، بقيمة 450 د.أ شهرياً. يحتوي العقد على بنود قابلة للتفاوض.",
      rights: [
        "الحق باسترداد كامل مبلغ الضمان عند نهاية العقد.",
        "الحق بإخطار خطي قبل 90 يوماً من تاريخ انتهاء العقد.",
        "الحق بالخصم من الإيجار في حال تعطّل خدمات أساسية.",
      ],
      obligations: [
        "دفع الإيجار في بداية كل شهر.",
        "الامتناع عن إحداث تغييرات إنشائية دون موافقة.",
      ],
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

  // ----- Legal corpus (a few articles) -----
  const articles = [
    {
      lawName: "قانون الإيجار الأردني",
      lawType: "rental",
      articleNumber: "المادة 14",
      title: "حقوق المستأجر",
      content: "لا يجوز للمالك أن يطلب إخلاء المأجور قبل انقضاء مدة العقد إلا في حالات محددة حصراً.",
    },
    {
      lawName: "قانون العمل الأردني",
      lawType: "labor",
      articleNumber: "المادة 22",
      title: "إنهاء عقد العمل",
      content: "لا يجوز لصاحب العمل فصل العامل إلا في حالات محددة، ويجب إخطاره قبل شهر على الأقل.",
    },
    {
      lawName: "قانون المرور الأردني",
      lawType: "traffic",
      articleNumber: "المادة 39",
      title: "قطع الإشارة الضوئية",
      content: "يعاقب بغرامة لا تقل عن 100 دينار كل من قطع إشارة ضوئية حمراء.",
    },
    {
      lawName: "قانون حماية المستهلك الأردني",
      lawType: "consumer",
      articleNumber: "المادة 12",
      title: "حق الإرجاع",
      content: "يحق للمستهلك إرجاع السلعة أو فسخ العقد خلال 14 يوماً في حال التسوق عن بعد.",
    },
    {
      lawName: "القانون المدني الأردني",
      lawType: "civil",
      articleNumber: "المادة 169",
      title: "حسن النية",
      content: "يلتزم المتعاقد بتنفيذ ما اشتمل عليه العقد بحسن نية.",
    },
  ];

  for (const a of articles) {
    await prisma.legalCorpus.upsert({
      where: { id: `seed-${a.lawType}-${a.articleNumber}` },
      update: {},
      create: {
        id: `seed-${a.lawType}-${a.articleNumber}`,
        ...a,
        metadata: { source: "Jordanian Law", seed: true },
      },
    });
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

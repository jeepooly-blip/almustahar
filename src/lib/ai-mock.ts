import type { Analysis, DocumentType, LawyerScore } from "./types";
import { mockAnalyses, mockDocuments } from "./mock-data";
import { sleep } from "./utils";

const SAMPLE_TEXTS: Record<DocumentType, { title: string; summary: string; rights: string[]; obligations: string[]; risks: Analysis["risks"]; nextSteps: Analysis["nextSteps"]; sources: Analysis["sources"]; reason: string; score: LawyerScore }> = {
  rental: {
    title: "عقد إيجار سكني",
    summary:
      "عقد إيجار سكني لمدة سنة، بقيمة 450 د.أ شهرياً، مع وديعة شهرين كضمان. يحتوي العقد على شروط معقولة بشكل عام مع وجود بند إخلاء مبكر يحتاج إلى إعادة نظر.",
    rights: [
      "الحق باسترداد كامل مبلغ الضمان عند نهاية العقد إذا سُلِّمت الشقة بحالتها الطبيعية.",
      "الحق بإخطار خطي قبل 90 يوماً من تاريخ انتهاء العقد إن رغبت بعدم التجديد.",
      "الحق بالخصم من الإيجار في حال تعطّل خدمات أساسية (مياه/كهرباء) أكثر من 48 ساعة.",
    ],
    obligations: [
      "دفع الإيجار في بداية كل شهر بشكل مُسبَق.",
      "الامتناع عن إحداث أي تغييرات إنشائية دون موافقة خطية.",
      "إبلاغ المالك فوراً بأي عطل يحتاج صيانة.",
    ],
    risks: [
      {
        text: "بند الإخلاء المبكر يفرض غرامة 3 أشهر إيجار، وهو أعلى من المعتاد.",
        severity: "high",
      },
      {
        text: "بند الصيانة يُلزم المستأجر بالإصلاحات الكبيرة (أكثر من 200 د.أ).",
        severity: "medium",
      },
    ],
    nextSteps: [
      { title: "تفاوض على البند 6", description: "اطلب تخفيض غرامة الإخلاء المبكر إلى شهر واحد.", isPaid: false },
      { title: "استشارة محامٍ إيجار", description: "30 دقيقة مع محامٍ متخصص بـ 60 د.أ/ساعة.", isPaid: true },
      { title: "حفظ نسخة موقّعة", description: "احتفظ بنسختين موقّعتين (واحدة لكل طرف).", isPaid: false },
    ],
    sources: [
      { lawName: "قانون الإيجار الأردني", articleNumber: "المادة 14", excerpt: "لا يجوز للمالك إخلاء المأجور قبل انقضاء مدة العقد إلا في حالات محددة." },
      { lawName: "القانون المدني الأردني", articleNumber: "المادة 169", excerpt: "يلتزم المتعاقد بتنفيذ ما اشتمل عليه العقد بحسن نية." },
    ],
    reason: "بعض البنود قابلة للتفاوض. التوقيع دون مراجعة محامٍ مقبول لكن لا يُنصح به.",
    score: "MEDIUM",
  },
  employment: {
    title: "إنذار فصل من العمل",
    summary:
      "إنذار كتابي بإنهاء خدمات الموظف وفقاً للمادة 22 من قانون العمل. مدة الإشعار شهر واحد، مع الإشارة إلى فقدان الثقة كسبب.",
    rights: [
      "الحق بالطعن بقرار الفصل أمام محكمة العمل خلال 60 يوماً.",
      "الحق بمكافأة نهاية الخدمة وفق المادة 32.",
      "الحق بشهادة خدمة تذكر سبب إنهاء العقد فقط بموافقتك.",
    ],
    obligations: [
      "تسليم ممتلكات العمل خلال 7 أيام.",
      "الامتناع عن إفشاء أسرار العمل.",
    ],
    risks: [
      { text: "مدة الإشعار شهر واحد فقط، بينما يحق لك بثلاثة أشهر إن كانت خدمتك أكثر من 5 سنوات.", severity: "high" },
      { text: "السبب \"فقدان الثقة\" مرن وقد يستعمل لرفض التعويضات.", severity: "high" },
    ],
    nextSteps: [
      { title: "لا توقّع أي وثيقة إنهاء", description: "توقيعها يعني تنازل غالباً عن حقك.", isPaid: false },
      { title: "استشارة محامٍ عمل", description: "الطعن ممكن خلال 60 يوماً، لكن البدء مبكراً يقوّي موقفك.", isPaid: true },
    ],
    sources: [
      { lawName: "قانون العمل الأردني", articleNumber: "المادة 22", excerpt: "لا يجوز فصل العامل إلا في حالات محددة، مع إخطار قبل شهر على الأقل." },
      { lawName: "قانون العمل الأردني", articleNumber: "المادة 32", excerpt: "مكافأة نهاية الخدمة: أجر شهر عن كل سنة." },
    ],
    reason: "مؤشرات قوية على فصل تعسفي. مراجعة محامٍ ضرورية قبل التوقيع.",
    score: "HIGH",
  },
  traffic: {
    title: "مخالفة مرورية",
    summary:
      "مخالفة مرورية بقطع إشارة ضوئية حمراء بقيمة 150 د.أ. المخالفة قابلة للاعتراض خلال 30 يوماً، مع خيار تسوية ودية بـ 50% خلال 14 يوماً.",
    rights: [
      "الحق بالاعتراض خلال 30 يوماً من التبليغ.",
      "الحق بطلب صور وأدلة المخالفة.",
      "الحق بدفع 50% كتسوية ودية خلال 14 يوماً.",
    ],
    obligations: [
      "دفع الغرامة خلال 60 يوماً لتفادي تعليق الرخصة.",
    ],
    risks: [
      { text: "تكرار المخالفة خلال سنة قد يؤدي لمضاعفة الغرامة وسحب الرخصة مؤقتاً.", severity: "medium" },
    ],
    nextSteps: [
      { title: "ادفع نصف المبلغ كتسوية", description: "75 د.أ خلال 14 يوماً.", isPaid: false },
      { title: "اعترض إن كانت الأدلة غير كافية", description: "تقدّم بقسم المرور بطلب اعتراض.", isPaid: false },
    ],
    sources: [
      { lawName: "قانون المرور الأردني", articleNumber: "المادة 39", excerpt: "يعاقب بغرامة لا تقل عن 100 د.أ كل من قطع إشارة حمراء." },
    ],
    reason: "مخالفة بسيطة يمكن تسويتها ودّياً دون الحاجة لمحامٍ.",
    score: "LOW",
  },
  consumer: {
    title: "عقد استهلاكي مع مزود خدمة",
    summary:
      "عقد اشتراك في خدمة اتصالات لمدة 12 شهراً، مع رسوم إلغاء مبكر مرتفعة نسبياً. العقد يحتوي على بنود مقبولة عموماً لكن سياسة الاسترجاع تحتاج مراجعة.",
    rights: [
      "الحق بإلغاء العقد خلال 14 يوماً (التسوق عن بُعد) وفقاً لقانون حماية المستهلك.",
      "الحق بخدمة عملاء واضحة باللغة العربية.",
    ],
    obligations: [
      "دفع الاشتراك الشهري في تاريخ الاستحقاق.",
      "إبلاغ المزود بأي عطل خلال 48 ساعة.",
    ],
    risks: [
      { text: "رسوم الإلغاء المبكر 80% من المبالغ المتبقية، وهي مرتفعة.", severity: "high" },
      { text: "البند 7 يحدّ من مسؤولية المزود في حال انقطاع الخدمة.", severity: "medium" },
    ],
    nextSteps: [
      { title: "احتفظ بنسخة من العقد", description: "احتفظ بنسخة إلكترونية ومطبوعة.", isPaid: false },
      { title: "تواصل مع حماية المستهلك", description: "إن فشل التسوية، قدّم شكوى لدى مؤسسة حماية المستهلك.", isPaid: false },
    ],
    sources: [
      { lawName: "قانون حماية المستهلك الأردني", articleNumber: "المادة 12", excerpt: "يحق للمستهلك إرجاع السلعة أو فسخ العقد خلال 14 يوماً في حال التسوق عن بعد." },
    ],
    reason: "بعض البنود تحتاج مراجعة، لكن يمكن حلّها غالباً عبر التسوية الودية.",
    score: "MEDIUM",
  },
  general: {
    title: "وثيقة قانونية عامة",
    summary:
      "وثيقة قانونية عامة تتطلب مراجعة متخصصة. النظام سيقدّم تحليلاً عاماً مع توجيه نحو التخصص المناسب.",
    rights: [
      "الحق بفهم كامل لمضمون الوثيقة قبل التوقيع.",
      "الحق باستشارة محامٍ متخصص قبل الالتزام.",
    ],
    obligations: [
      "قراءة الوثيقة كاملة قبل التوقيع.",
    ],
    risks: [
      { text: "الوثيقة تحتاج مراجعة متخصصة في القانون العام/التجاري.", severity: "medium" },
    ],
    nextSteps: [
      { title: "استشر محامياً", description: "حدد نوع الوثيقة بدقة لاختيار التخصص المناسب.", isPaid: true },
    ],
    sources: [
      { lawName: "القانون المدني الأردني", articleNumber: "المادة 169", excerpt: "يلتزم المتعاقد بتنفيذ ما اشتمل عليه العقد بحسن نية." },
    ],
    reason: "نوع الوثيقة غير محدد بوضوح. مراجعة محامٍ ضرورة لتحديد الالتزامات بدقة.",
    score: "MEDIUM",
  },
};

export async function generateAnalysis({
  id,
  docType,
  title,
}: {
  id: string;
  docType: DocumentType;
  title: string;
}): Promise<Analysis> {
  await sleep(200);
  const sample = SAMPLE_TEXTS[docType];
  const finalTitle = title?.trim() || sample.title;

  const analysisId = `a_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
  const documentId = id;

  mockDocuments.unshift({
    id: documentId,
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
    documentId,
    userId: "u1",
    documentType: docType,
    documentTitle: finalTitle,
    summary: sample.summary,
    rights: sample.rights,
    obligations: sample.obligations,
    risks: sample.risks,
    lawyerScore: sample.score,
    lawyerReason: sample.reason,
    nextSteps: sample.nextSteps,
    sources: sample.sources,
    confidenceScore: 0.85 + Math.random() * 0.1,
    reviewStatus: "APPROVED",
    reviewedBy: "u4",
    createdAt: new Date().toISOString(),
  };
}

import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Card, CardBody } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert } from "@/components/ui/alert";
import { LocaleProviderClient } from "./locale-client";
import {
  Upload,
  ScanSearch,
  FileCheck2,
  Scale,
  ShieldCheck,
  Languages,
  GavelIcon,
  Sparkles,
  TrendingUp,
  Star,
  CheckCircle2,
  ArrowLeft,
  ArrowRight,
  Quote,
} from "lucide-react";
import { mockLawyers, mockAnalyses, specialtyLabels, cityLabels } from "@/lib/mock-data";
import { StarRating } from "@/components/star-rating";

const featureIcons = [ShieldCheck, Languages, GavelIcon, TrendingUp];

export default function HomePage() {
  return (
    <LocaleProviderClient>
      <HomeContent />
    </LocaleProviderClient>
  );
}

function HomeContent() {
  return (
    <>
      <HeroSection />
      <TrustStrip />
      <StepsSection />
      <FeaturesSection />
      <AnalysesPreview />
      <LawyersPreview />
      <PricingTeaser />
      <FinalCta />
    </>
  );
}

function HeroSection() {
  return (
    <section className="hero-gradient relative overflow-hidden">
      <div className="container-page relative grid items-center gap-12 py-16 md:grid-cols-2 md:py-24">
        <div className="relative z-10">
          <Badge tone="info" icon={<Sparkles className="h-3.5 w-3.5" />} className="mb-5">
            مبني خصيصاً للأردن والمنطقة
          </Badge>
          <h1 className="text-3xl font-extrabold leading-[1.2] tracking-tight text-ink-900 sm:text-4xl lg:text-5xl">
            ارفع وثيقتك القانونية،{" "}
            <span className="bg-gradient-to-l from-brand-700 via-accent-600 to-accent-500 bg-clip-text text-transparent">
              احصل على شرح واضح
            </span>{" "}
            بالعربية في دقائق.
          </h1>
          <p className="mt-4 max-w-xl text-sm leading-7 text-ink-600 sm:text-base">
            منصة قانونية ذكية موجَّهة للمواطن الأردني — تحلّل العقود، الإنذارات، عقود
            الإيجار والمخالفات المرورية، وتقدّم توصية صادقة: هل تحتاج محامياً أم لا.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Link href="/upload">
              <Button size="lg" iconEnd={<ArrowLeft className="h-4 w-4" />}>
                ابدأ تحليل وثيقة
              </Button>
            </Link>
            <Link href="/lawyers">
              <Button size="lg" variant="outline" iconEnd={<ArrowLeft className="h-4 w-4" />}>
                استكشف المحامين
              </Button>
            </Link>
          </div>
          <div className="mt-8 flex items-center gap-6 text-xs text-ink-500">
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
              3 تحليلات مجانية/ساعة
            </div>
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
              بدون تسجيل
            </div>
          </div>
        </div>

        <div className="relative">
          <div className="absolute -inset-4 -z-10 rounded-[2.5rem] bg-gradient-to-br from-brand-200/40 via-accent-200/30 to-emerald-200/30 blur-2xl" />
          <HeroCardMock />
        </div>
      </div>
    </section>
  );
}

function HeroCardMock() {
  return (
    <Card className="relative overflow-hidden">
      <div className="flex items-center justify-between border-b border-ink-100 px-5 py-3">
        <div className="flex items-center gap-2">
          <div className="grid h-8 w-8 place-items-center rounded-lg bg-emerald-50 text-emerald-700">
            <FileCheck2 className="h-4 w-4" />
          </div>
          <div>
            <div className="text-xs font-semibold text-ink-900">عقد إيجار — عبدون</div>
            <div className="text-[10px] text-ink-500">مراجَع من محامٍ · قبل دقيقتين</div>
          </div>
        </div>
        <Badge tone="success">✓ مكتمل</Badge>
      </div>
      <CardBody className="space-y-4">
        <div>
          <div className="text-xs font-semibold text-ink-500">الملخص</div>
          <p className="mt-1 text-sm leading-7 text-ink-800">
            عقد إيجار سكني لمدة سنة بقيمة 450 د.أ شهرياً. يحتوي على بعض البنود غير
            المتوازنة التي يمكن التفاوض عليها قبل التوقيع.
          </p>
        </div>
        <div className="grid grid-cols-3 gap-2 text-center">
          <StatPill label="حقوق" value="4" tone="emerald" />
          <StatPill label="التزامات" value="4" tone="brand" />
          <StatPill label="مخاطر" value="3" tone="rose" />
        </div>
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-amber-900">هل تحتاج محامياً؟</span>
            <Badge tone="warning">متوسطة</Badge>
          </div>
          <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-amber-100">
            <div className="h-full w-1/2 rounded-full bg-amber-500" />
          </div>
        </div>
        <div className="flex gap-2">
          <Button className="flex-1" size="sm">
            تواصل مع محامٍ
          </Button>
          <Button variant="outline" size="sm">
            تحميل PDF
          </Button>
        </div>
      </CardBody>
    </Card>
  );
}

function StatPill({ label, value, tone }: { label: string; value: string; tone: string }) {
  const tones: Record<string, string> = {
    emerald: "border-emerald-200 bg-emerald-50 text-emerald-800",
    brand: "border-brand-200 bg-brand-50 text-brand-800",
    rose: "border-rose-200 bg-rose-50 text-rose-800",
  };
  return (
    <div className={`rounded-xl border p-2.5 ${tones[tone]}`}>
      <div className="text-xl font-extrabold">{value}</div>
      <div className="text-[10px] font-medium opacity-80">{label}</div>
    </div>
  );
}

function TrustStrip() {
  const items = [
    { icon: Languages, label: "تحليل بالعربية الفصحى" },
    { icon: ShieldCheck, label: "مراجعة بشرية لكل تحليل" },
    { icon: Scale, label: "مدعوم بالقانون الأردني" },
    { icon: FileCheck2, label: "تشفير من الطرف إلى الطرف" },
  ];
  return (
    <section className="border-y border-ink-200 bg-white">
      <div className="container-page grid grid-cols-2 gap-6 py-8 md:grid-cols-4">
        {items.map((it) => (
          <div key={it.label} className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-brand-50 text-brand-700">
              <it.icon className="h-5 w-5" />
            </div>
            <span className="text-sm font-semibold text-ink-800">{it.label}</span>
          </div>
        ))}
      </div>
    </section>
  );
}

function StepsSection() {
  const steps = [
    {
      icon: Upload,
      title: "ارفع الوثيقة",
      desc: "اسحب ملف PDF أو التقط صورة بالكاميرا. ندعم العقود، عقود الإيجار، الإنذارات، المخالفات.",
    },
    {
      icon: ScanSearch,
      title: "تحليل ذكي ومراجعة بشرية",
      desc: "يستخرج النظام النص، يستعين بالقانون الأردني عبر RAG، ويُولّد تحليلاً يراجعه محامٍ مرخص قبل التسليم.",
    },
    {
      icon: FileCheck2,
      title: "اعرف خطوتك التالية",
      desc: "ملخص واضح بحقوقك والتزاماتك ومخاطر الوثيقة، مع تقدير صادق إن كنت تحتاج محامياً.",
    },
  ];
  return (
    <section className="container-page py-14 sm:py-20">
      <div className="mx-auto max-w-2xl text-center">
        <Badge tone="info">كيف تعمل المنصة</Badge>
        <h2 className="mt-3 text-2xl font-extrabold tracking-tight text-ink-900 sm:text-3xl">
          ثلاث خطوات بسيطة
        </h2>
        <p className="mt-3 text-base text-ink-600">
          من الرفع إلى الفهم الكامل في أقل من 5 دقائق.
        </p>
      </div>
      <div className="mt-12 grid gap-6 md:grid-cols-3">
        {steps.map((s, i) => (
          <Card key={i} className="relative">
            <div className="absolute end-4 top-4 grid h-7 w-7 place-items-center rounded-full bg-ink-100 text-xs font-bold text-ink-700">
              {i + 1}
            </div>
            <CardBody>
              <div className="grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-br from-brand-600 to-brand-500 text-white shadow-md">
                <s.icon className="h-6 w-6" />
              </div>
              <h3 className="mt-3 text-base font-bold text-ink-900">{s.title}</h3>
              <p className="mt-2 text-sm leading-7 text-ink-600">{s.desc}</p>
            </CardBody>
          </Card>
        ))}
      </div>
    </section>
  );
}

function FeaturesSection() {
  const features = [
    { icon: ShieldCheck, title: "موثوق", desc: "كل تحليل يمر بمراجعة بشرية قبل النشر." },
    { icon: Languages, title: "بالعربية أولاً", desc: "واجهة RTL متكاملة بلغة بسيطة ومفهومة." },
    { icon: GavelIcon, title: "مرتبط بالقانون الأردني", desc: "مدعوم بقوانين العمل والإيجار والمدني والمرور والمستهلك." },
    { icon: TrendingUp, title: "تكلفة معقولة", desc: "نسخة مجانية + تقارير من 8 دنانير فقط." },
  ];
  return (
    <section className="bg-ink-50/60 py-14 sm:py-20">
      <div className="container-page">
        <div className="mx-auto max-w-2xl text-center">
          <Badge tone="info">لماذا نحن؟</Badge>
        <h2 className="mt-3 text-2xl font-extrabold tracking-tight text-ink-900 sm:text-3xl">
          ليجال نافيغيتور برو
        </h2>
          <p className="mt-3 text-base text-ink-600">
            مبني على مبادئ الشفافية، الخصوصية، والوصول العادل للعدالة.
          </p>
        </div>
        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {features.map((f, i) => {
            const Icon = f.icon;
            return (
              <div
                key={f.title}
                className="group rounded-2xl border border-ink-200 bg-white p-6 transition-all hover:-translate-y-1 hover:shadow-md"
              >
                <div className="grid h-12 w-12 place-items-center rounded-xl bg-gradient-to-br from-brand-50 to-brand-100 text-brand-700 transition-colors group-hover:from-brand-600 group-hover:to-brand-500 group-hover:text-white">
                  <Icon className="h-6 w-6" />
                </div>
                <h3 className="mt-3 text-sm font-bold text-ink-900">{f.title}</h3>
                <p className="mt-1.5 text-sm leading-7 text-ink-600">{f.desc}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function AnalysesPreview() {
  return (
    <section className="container-page py-14 sm:py-20">
        <div className="flex items-end justify-between gap-4">
          <div>
            <Badge tone="info">نماذج تحليل</Badge>
            <h2 className="mt-3 text-xl font-extrabold text-ink-900 sm:text-2xl">
              تحليلات حقيقية لوثائق شائعة
            </h2>
          </div>
          <Link href="/analyses" className="hidden text-sm font-semibold text-brand-700 hover:underline sm:inline">
            عرض كل النماذج ←
          </Link>
        </div>
      <div className="mt-8 grid gap-6 md:grid-cols-3">
        {mockAnalyses.slice(0, 3).map((a) => (
          <Card key={a.id} className="flex flex-col">
            <CardBody className="flex-1">
              <div className="flex items-center justify-between">
                <Badge
                  tone={
                    a.documentType === "rental"
                      ? "info"
                      : a.documentType === "employment"
                        ? "warning"
                        : a.documentType === "traffic"
                          ? "danger"
                          : "neutral"
                  }
                >
                  {a.documentType === "rental"
                    ? "عقد إيجار"
                    : a.documentType === "employment"
                      ? "إنذار عمل"
                      : a.documentType === "traffic"
                        ? "مخالفة مرورية"
                        : "وثيقة"}
                </Badge>
                <Badge tone={a.lawyerScore === "HIGH" ? "danger" : a.lawyerScore === "MEDIUM" ? "warning" : "success"}>
                  محامي: {a.lawyerScore === "HIGH" ? "عالية" : a.lawyerScore === "MEDIUM" ? "متوسطة" : "منخفضة"}
                </Badge>
              </div>
              <h3 className="mt-3 text-base font-bold text-ink-900">{a.documentTitle}</h3>
              <p className="mt-2 line-clamp-3 text-sm leading-7 text-ink-600">{a.summary}</p>
            </CardBody>
            <div className="border-t border-ink-100 p-4">
              <Link href={`/analyses/${a.id}`}>
                <Button variant="outline" size="sm" className="w-full" iconEnd={<ArrowLeft className="h-3.5 w-3.5" />}>
                  اقرأ التحليل الكامل
                </Button>
              </Link>
            </div>
          </Card>
        ))}
      </div>
    </section>
  );
}

function LawyersPreview() {
  return (
    <section className="bg-gradient-to-b from-white to-ink-50/60 py-14 sm:py-20">
      <div className="container-page">
        <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <Badge tone="info">محامون موثوقون</Badge>
            <h2 className="mt-3 text-xl font-extrabold text-ink-900 sm:text-2xl">
              محامون مرخّصون قريبون منك
            </h2>
            <p className="mt-2 max-w-2xl text-sm text-ink-600">
              تصفّح دليل المحامين، صفِّ حسب التخصص والموقع والأتعاب، وأرسل طلباً مع
              سياق وثيقتك جاهزاً.
            </p>
          </div>
          <Link href="/lawyers">
            <Button variant="outline" size="sm" iconEnd={<ArrowLeft className="h-3.5 w-3.5" />}>
              تصفّح كل المحامين
            </Button>
          </Link>
        </div>
        <div className="mt-8 grid gap-6 md:grid-cols-3">
          {mockLawyers.slice(0, 3).map((l) => (
            <Card key={l.id} className="overflow-hidden">
              <div className="flex items-center gap-3 border-b border-ink-100 p-5">
                <Image
                  src={l.avatar}
                  alt={l.name}
                  width={56}
                  height={56}
                  className="h-14 w-14 rounded-full border-2 border-white object-cover shadow-sm"
                />
                <div className="flex-1">
                  <div className="flex items-center gap-1.5">
                    <h3 className="text-sm font-bold text-ink-900">{l.name}</h3>
                    {l.verified && <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />}
                  </div>
                  <div className="mt-0.5 flex items-center gap-1 text-xs text-ink-500">
                    <StarRating value={l.rating} />
                    <span>({l.totalReviews})</span>
                  </div>
                </div>
              </div>
              <CardBody className="space-y-3">
                <div className="flex flex-wrap gap-1.5">
                  {l.specialties.slice(0, 3).map((s) => (
                    <Badge key={s} tone="info">
                      {specialtyLabels[s]?.ar ?? s}
                    </Badge>
                  ))}
                </div>
                <p className="line-clamp-2 text-xs leading-6 text-ink-600">{l.bio.ar}</p>
                <div className="flex items-center justify-between border-t border-ink-100 pt-3">
                  <div>
                    <div className="text-xs text-ink-500">أتعاب/ساعة</div>
                    <div className="text-base font-extrabold text-ink-900">{l.hourlyRate} د.أ</div>
                  </div>
                  <Link href={`/lawyers/${l.id}`}>
                    <Button size="sm" variant="outline">
                      الملف
                    </Button>
                  </Link>
                </div>
              </CardBody>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}

function PricingTeaser() {
  const tiers = [
    {
      name: "مجاني",
      price: "0",
      suffix: "للأبد",
      desc: "لتجربة المنصة بحدودها الأساسية.",
      features: ["3 تحليلات/ساعة", "ملخص + حقوق + التزامات", "الوصول لمركز المعرفة"],
      cta: "ابدأ مجاناً",
      href: "/upload",
      featured: false,
    },
    {
      name: "تقرير مدفوع",
      price: "8",
      suffix: "د.أ / تقرير",
      desc: "تحليل كامل قابل للتصدير مع توصية المحامي.",
      features: ["كل مزايا المجاني", "تصدير PDF", "قوالب رسائل ومستندات", "توصية محامي مفصّلة"],
      cta: "جرّب التقرير",
      href: "/upload?plan=report",
      featured: true,
    },
    {
      name: "اشتراك شهري",
      price: "29",
      suffix: "د.أ / شهر",
      desc: "تحليلات غير محدودة للمحامين والمستقلين.",
      features: ["تحليلات غير محدودة", "أولوية المراجعة", "حفظ غير محدود", "تقديم طلبات للمحامين"],
      cta: "اشترك الآن",
      href: "/upload?plan=monthly",
      featured: false,
    },
  ];
  return (
    <section className="container-page py-14 sm:py-20">
      <div className="mx-auto max-w-2xl text-center">
        <Badge tone="info">الأسعار</Badge>
        <h2 className="mt-3 text-2xl font-extrabold text-ink-900 sm:text-3xl">
          نموذج بسيط وشفاف
        </h2>
        <p className="mt-3 text-base text-ink-600">
          ادفع مقابل ما تحتاج فقط. لا اشتراكات مخفية.
        </p>
      </div>
      <div className="mt-12 grid gap-6 lg:grid-cols-3">
        {tiers.map((t) => (
          <Card
            key={t.name}
            className={t.featured ? "ring-2 ring-brand-600 shadow-lg" : ""}
          >
            <CardBody>
              {t.featured && (
                <Badge tone="info" className="mb-3">
                  الأكثر شعبية
                </Badge>
              )}
              <h3 className="text-lg font-bold text-ink-900">{t.name}</h3>
              <div className="mt-3 flex items-baseline gap-1">
                <span className="text-3xl font-extrabold text-ink-900">{t.price}</span>
                <span className="text-sm text-ink-500">{t.suffix}</span>
              </div>
              <p className="mt-2 text-sm text-ink-600">{t.desc}</p>
              <ul className="mt-4 space-y-2">
                {t.features.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-sm text-ink-700">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                    {f}
                  </li>
                ))}
              </ul>
            </CardBody>
            <div className="border-t border-ink-100 p-4">
              <Link href={t.href}>
                <Button className="w-full" variant={t.featured ? "primary" : "outline"}>
                  {t.cta}
                </Button>
              </Link>
            </div>
          </Card>
        ))}
      </div>
    </section>
  );
}

function FinalCta() {
  return (
    <section className="container-page py-14 sm:py-20">
      <div className="relative overflow-hidden rounded-3xl bg-navy-gradient p-8 text-white sm:p-12">
        <div className="absolute -bottom-24 -end-24 h-72 w-72 rounded-full bg-accent-400/15 blur-3xl" />
        <div className="absolute -top-16 -start-16 h-56 w-56 rounded-full bg-accent-300/20 blur-3xl" />
        <div className="relative grid items-center gap-8 md:grid-cols-2">
          <div>
            <Badge tone="success" className="bg-white/10 text-white ring-white/20">
              ابدأ مجاناً اليوم
            </Badge>
            <h2 className="mt-3 text-2xl font-extrabold leading-tight sm:text-3xl">
              جاهز تفهم وثيقتك؟
            </h2>
            <p className="mt-3 text-base leading-8 text-white/85">
              3 تحليلات مجانية في الساعة — بدون تسجيل، بدون بطاقة بنكية.
            </p>
          </div>
          <div className="flex flex-wrap gap-3 md:justify-end">
            <Link href="/upload">
              <Button size="lg" className="bg-white text-brand-700 hover:bg-white/90" iconEnd={<ArrowLeft className="h-4 w-4" />}>
                حلِّل وثيقتي الآن
              </Button>
            </Link>
            <Link href="/lawyers">
              <Button size="lg" variant="ghost" className="text-white hover:bg-white/10">
                تصفّح المحامين
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}



import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Sparkles, X, Building2, Crown, Briefcase } from "lucide-react";
import Link from "next/link";

export default function PricingPage() {
  return (
    <div className="container-page py-12">
      <div className="mx-auto max-w-3xl text-center">
        <Badge tone="info" icon={<Sparkles className="h-3.5 w-3.5" />}>
          أسعار شفافة وبسيطة
        </Badge>
        <h1 className="mt-3 text-2xl font-extrabold text-ink-900 sm:text-3xl">
          اختر الخطة المناسبة لك
        </h1>
        <p className="mt-3 text-base text-ink-600">
          أسعار بالدينار الأردني. لا رسوم خفية. ألغِ في أي وقت.
        </p>
      </div>

      <div className="mt-12 grid gap-6 lg:grid-cols-3">
        <PlanCard
          name="مجاني"
          icon={<Sparkles className="h-5 w-5" />}
          price="0"
          suffix="للأبد"
          desc="ابدأ تجربة المنصة واطّلع على القيمة بدون التزام."
          cta="ابدأ مجاناً"
          ctaHref="/upload"
          features={[
            "3 تحليلات في الساعة",
            "ملخص + حقوق + التزامات",
            "الوصول لمركز المعرفة",
            "قوالب أساسية",
          ]}
          notIncluded={[
            "تصدير PDF",
            "أولوية في المراجعة",
            "تقديم طلبات للمحامين",
          ]}
        />
        <PlanCard
          name="تقرير مدفوع"
          icon={<Crown className="h-5 w-5" />}
          price="8"
          suffix="د.أ / تقرير"
          desc="تحليل مفصّل قابل للتصدير مع توصية محامٍ واضحة."
          cta="جرّب التقرير"
          ctaHref="/upload?plan=report"
          popular
          features={[
            "كل مزايا المجاني",
            "تقرير PDF قابل للتصدير",
            "قوالب متقدمة (رسائل، إنذارات)",
            "توصية محامٍ مفصّلة مع السبب",
            "إمكانية إرفاقه بطلب محامٍ",
          ]}
        />
        <PlanCard
          name="اشتراك شهري"
          icon={<Building2 className="h-5 w-5" />}
          price="29"
          suffix="د.أ / شهر"
          desc="للأشخاص الذين يحتاجون تحليلات متكررة (مستأجرون، موظفون، تجار)."
          cta="اشترك الآن"
          ctaHref="/upload?plan=monthly"
          features={[
            "تحليلات غير محدودة",
            "أولوية المراجعة (خلال ساعة)",
            "حفظ غير محدود للوثائق",
            "تقديم طلبات غير محدودة للمحامين",
            "الوصول للأرشيف الكامل",
            "دعم أولوية عبر البريد",
          ]}
        />
      </div>

      <div className="mt-16">
        <h2 className="text-center text-2xl font-extrabold text-ink-900">
          للمحامين والمكاتب
        </h2>
        <p className="mt-2 text-center text-sm text-ink-600">
          احصل على عملاء مؤهلين وادِر عيادتك القانونية رقمياً.
        </p>
        <div className="mt-8 grid gap-6 lg:grid-cols-3">
          <LawyerPlan
            name="Basic"
            price="79"
            desc="للبداية في استقبال العملاء الجدد."
            features={[
              "ملف شخصي قابل للبحث",
              "استقبال طلبات العملاء",
              "رسائل داخل التطبيق",
              "إحصائيات أساسية",
            ]}
          />
          <LawyerPlan
            name="Pro"
            price="149"
            popular
            desc="للمحامين النشطين الذين يريدون التميّز."
            features={[
              "كل مزايا Basic",
              "ظهور مميّز في نتائج البحث",
              "لوحة تحليلات متقدمة",
              "نماذج استقبال عملاء مخصصة",
              "تنظيم ملفات العملاء",
            ]}
          />
          <LawyerPlan
            name="Enterprise"
            price="تواصل معنا"
            desc="للمكاتب الكبيرة والعيادات المتخصصة."
            features={[
              "ملفات محامين متعددين",
              "خيارات العلامة البيضاء",
              "API للوصول إلى المنصة",
              "مدير حساب مخصص",
              "تقارير مالية شهرية",
            ]}
          />
        </div>
      </div>

      <div className="mt-16">
        <h2 className="text-center text-2xl font-extrabold text-ink-900">
          الأسئلة الشائعة
        </h2>
        <div className="mx-auto mt-8 max-w-3xl space-y-3">
          <FaqItem
            q="هل التقرير المدفوع يشمل استشارة محامٍ فعلية؟"
            a="لا. التقرير المدفوع هو تحليل آلي مراجَع بشرياً. للحصول على استشارة شخصية، يمكنك تصفح دليل المحامين وإرسال طلب مباشرة مع إرفاق التحليل."
          />
          <FaqItem
            q="هل يمكنني إلغاء اشتراكي الشهري في أي وقت؟"
            a="نعم، يمكنك الإلغاء من صفحة حسابك في أي وقت. تستمر الخدمة حتى نهاية دورة الفوترة الحالية."
          />
          <FaqItem
            q="ما هي طرق الدفع المتاحة؟"
            a="نقبل بطاقات Visa وMastercard، مدى، Apple Pay، وPayPal. في الأردن، ندعم HyperPay للدفع بالدينار الأردني."
          />
          <FaqItem
            q="هل وثائقي آمنة؟"
            a="نعم. كل الوثائق مشفّرة تشفيراً من الطرف إلى الطرف (AES-256) ولا يمكن لأي طرف ثالث — بما في ذلك نحن — قراءتها. الوثائق المجانية تُحذف تلقائياً بعد 90 يوماً."
          />
        </div>
      </div>
    </div>
  );
}

function PlanCard({
  name,
  icon,
  price,
  suffix,
  desc,
  features,
  notIncluded,
  cta,
  ctaHref,
  popular,
}: {
  name: string;
  icon: React.ReactNode;
  price: string;
  suffix: string;
  desc: string;
  features: string[];
  notIncluded?: string[];
  cta: string;
  ctaHref: string;
  popular?: boolean;
}) {
  return (
    <Card className={popular ? "ring-2 ring-brand-600 shadow-lg" : ""}>
      {popular && (
        <div className="rounded-t-2xl bg-gradient-to-l from-brand-600 to-accent-500 px-5 py-2 text-center text-xs font-bold text-white">
          الأكثر شعبية
        </div>
      )}
      <CardBody>
        <div className="flex items-center gap-2">
          <div className="grid h-9 w-9 place-items-center rounded-xl bg-brand-50 text-brand-700">
            {icon}
          </div>
          <h3 className="text-lg font-bold text-ink-900">{name}</h3>
        </div>
        <div className="mt-4 flex items-baseline gap-1">
                <span className="text-3xl font-extrabold text-ink-900">{price}</span>
          <span className="text-sm text-ink-500">{suffix}</span>
        </div>
        <p className="mt-2 text-sm text-ink-600">{desc}</p>
        <ul className="mt-4 space-y-2">
          {features.map((f) => (
            <li key={f} className="flex items-start gap-2 text-sm text-ink-700">
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
              {f}
            </li>
          ))}
          {notIncluded?.map((f) => (
            <li key={f} className="flex items-start gap-2 text-sm text-ink-400">
              <X className="mt-0.5 h-4 w-4 shrink-0" />
              {f}
            </li>
          ))}
        </ul>
        <Link href={ctaHref} className="mt-6 block">
          <Button className="w-full" variant={popular ? "primary" : "outline"} size="lg">
            {cta}
          </Button>
        </Link>
      </CardBody>
    </Card>
  );
}

function LawyerPlan({
  name,
  price,
  desc,
  features,
  popular,
}: {
  name: string;
  price: string;
  desc: string;
  features: string[];
  popular?: boolean;
}) {
  return (
    <Card className={popular ? "ring-2 ring-brand-600" : ""}>
      <CardHeader
        icon={<Briefcase className="h-5 w-5" />}
        title={name}
        action={popular ? <Badge tone="info">الأكثر شعبية</Badge> : null}
      />
      <CardBody>
        <div className="text-2xl font-extrabold text-ink-900">
          {price}
          {price !== "تواصل معنا" && (
            <span className="ms-1 text-sm font-normal text-ink-500">د.أ / شهر</span>
          )}
        </div>
        <p className="mt-1 text-sm text-ink-600">{desc}</p>
        <ul className="mt-4 space-y-2">
          {features.map((f) => (
            <li key={f} className="flex items-start gap-2 text-sm text-ink-700">
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
              {f}
            </li>
          ))}
        </ul>
      </CardBody>
    </Card>
  );
}

function FaqItem({ q, a }: { q: string; a: string }) {
  return (
    <div className="rounded-2xl border border-ink-200 bg-white p-5">
      <h3 className="text-sm font-semibold text-ink-900">{q}</h3>
      <p className="mt-2 text-sm leading-7 text-ink-600">{a}</p>
    </div>
  );
}


import Link from "next/link";
import { Card, CardBody } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  BookOpen,
  Home,
  Briefcase,
  Car,
  ShoppingBag,
  Users,
  Play,
  Clock,
  ChevronLeft,
  Sparkles,
  ShieldCheck,
} from "lucide-react";

const CATEGORIES = [
  { icon: Home, key: "rental", ar: "حقوق المستأجر", en: "Tenant Rights", count: 18, color: "from-brand-500 to-accent-500" },
  { icon: Briefcase, key: "labor", ar: "قانون العمل", en: "Labor Law", count: 24, color: "from-amber-500 to-orange-500" },
  { icon: Car, key: "traffic", ar: "المرور والمخالفات", en: "Traffic Law", count: 12, color: "from-rose-500 to-pink-500" },
  { icon: ShoppingBag, key: "consumer", ar: "حماية المستهلك", en: "Consumer Protection", count: 9, color: "from-emerald-500 to-teal-500" },
  { icon: Users, key: "family", ar: "قانون الأسرة", en: "Family Law", count: 15, color: "from-violet-500 to-purple-500" },
];

const ARTICLES = [
  {
    cat: "rental",
    title: "دليلك الشامل لحقوقك كمستأجر في الأردن",
    excerpt: "تعرّف على حقوقك الأساسية، مدد العقد، الإخلاء، ومتى يحق للمالك طلب الإخلاء.",
    readTime: 8,
  },
  {
    cat: "labor",
    title: "إنذار الفصل: كيف تتصرف في 5 خطوات",
    excerpt: "دليل عملي عند استلامك إنذار فصل من العمل، ومتى يحق لك الطعن.",
    readTime: 6,
  },
  {
    cat: "traffic",
    title: "كل ما تحتاج معرفته عن المخالفات المرورية",
    excerpt: "كيف تتعامل مع المخالفات، الاعتراضات، التسوية الودية، ونقاط السوابق.",
    readTime: 5,
  },
  {
    cat: "consumer",
    title: "حقوقك عند الشراء الإلكتروني",
    excerpt: "الاسترجاع، الضمان، والدفع عند الاستلام — كل ما يحميك كمستهلك.",
    readTime: 7,
  },
  {
    cat: "family",
    title: "الحضانة بعد الطلاق في القانون الأردني",
    excerpt: "شروط الحضانة، حقوق الأم، ومتى يحق للأب طلب الحضانة.",
    readTime: 9,
  },
  {
    cat: "labor",
    title: "مكافأة نهاية الخدمة: كيف تُحتسب؟",
    excerpt: "صيغة الحساب، الاستثناءات، وكيفية المطالبة بها عند التأخير.",
    readTime: 5,
  },
];

export default function LearnPage() {
  return (
    <div className="container-page py-10">
      <div className="mb-10 text-center">
        <Badge tone="info" icon={<BookOpen className="h-3.5 w-3.5" />}>
          مركز المعرفة القانونية
        </Badge>
        <h1 className="mt-3 text-2xl font-extrabold text-ink-900 sm:text-3xl">
          تعلّم عن حقوقك بالعربية
        </h1>
        <p className="mt-2 text-sm text-ink-600">
          مقالات وفيديوهات قصيرة تشرح لك حقوقك بطريقة بسيطة وعملية.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {CATEGORIES.map((c) => (
          <Link
            key={c.key}
            href={`/learn/${c.key}`}
            className="group"
          >
            <div className={`relative overflow-hidden rounded-2xl bg-gradient-to-br ${c.color} p-5 text-white shadow-md transition-transform group-hover:-translate-y-1`}>
              <c.icon className="h-7 w-7 opacity-90" />
              <h3 className="mt-3 text-base font-bold">{c.ar}</h3>
              <p className="text-xs opacity-85">{c.en}</p>
              <div className="mt-3 text-[10px] font-semibold opacity-75">
                {c.count} مقال
              </div>
            </div>
          </Link>
        ))}
      </div>

      <div className="mt-12">
        <div className="flex items-end justify-between gap-2">
          <h2 className="text-2xl font-extrabold text-ink-900">أحدث المقالات</h2>
          <Link href="#" className="text-sm font-semibold text-brand-700 hover:underline">
            عرض الكل ←
          </Link>
        </div>
        <div className="mt-6 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {ARTICLES.map((a, i) => (
            <Card key={i} className="group flex flex-col">
              <div className="relative aspect-[16/9] overflow-hidden rounded-t-2xl bg-gradient-to-br from-brand-100 to-accent-100">
                <div className="absolute inset-0 grid place-items-center">
                  <div className="grid h-14 w-14 place-items-center rounded-full bg-white/90 text-brand-700 shadow-lg transition-transform group-hover:scale-110">
                    <Play className="h-6 w-6 fill-current" />
                  </div>
                </div>
                <Badge tone="info" className="absolute top-3 end-3 bg-white/90">
                  {CATEGORIES.find((c) => c.key === a.cat)?.ar}
                </Badge>
              </div>
              <CardBody className="flex-1">
                <h3 className="text-base font-bold text-ink-900 group-hover:text-brand-700">
                  {a.title}
                </h3>
                <p className="mt-2 line-clamp-2 text-sm leading-7 text-ink-600">
                  {a.excerpt}
                </p>
                <div className="mt-3 flex items-center gap-1 text-xs text-ink-500">
                  <Clock className="h-3 w-3" />
                  {a.readTime} دقائق قراءة
                </div>
              </CardBody>
            </Card>
          ))}
        </div>
      </div>

      <div className="mt-12">
        <Card>
          <CardBody>
            <div className="grid items-center gap-6 md:grid-cols-2">
              <div>
                <Badge tone="info" icon={<Sparkles className="h-3.5 w-3.5" />}>
                  موارد مجانية
                </Badge>
                <h3 className="mt-3 text-2xl font-extrabold text-ink-900">
                  قوالب جاهزة: رسائل، إنذارات، طلبات
                </h3>
                <p className="mt-2 text-sm leading-7 text-ink-600">
                  حمّل نماذج مستندات قانونية شائعة بصيغة قابلة للتعديل، واستخدمها في
                  مراسلاتك مع المالك، صاحب العمل، أو الجهات الرسمية.
                </p>
                <div className="mt-4 flex flex-wrap gap-2">
                  <Button size="sm" iconEnd={<ChevronLeft className="h-3.5 w-3.5 flip-rtl" />}>
                    تصفح القوالب
                  </Button>
                  <Button size="sm" variant="outline">
                    الأسئلة الشائعة
                  </Button>
                </div>
              </div>
              <div className="rounded-2xl bg-gradient-to-br from-brand-50 to-accent-50 p-6 ring-1 ring-brand-100">
                <div className="flex items-start gap-3">
                  <ShieldCheck className="h-6 w-6 text-emerald-600" />
                  <div>
                    <h4 className="text-sm font-semibold text-ink-900">
                      ملاحظة مهمة
                    </h4>
                    <p className="mt-1 text-xs leading-6 text-ink-600">
                      المقالات والقوالب على هذا الموقع لأغراض تثقيفية فقط ولا تُعد
                      استشارة قانونية. للحصول على نصيحة مخصصة، استشر محامياً مرخصاً.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </CardBody>
        </Card>
      </div>
    </div>
  );
}



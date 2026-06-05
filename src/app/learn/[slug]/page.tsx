import Link from "next/link";
import { notFound } from "next/navigation";
import { Card, CardBody } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  ArrowRight,
  Clock,
  CalendarDays,
  User2,
  Scale,
  ScrollText,
  HelpCircle,
  Sparkles,
  Share2,
  ShieldCheck,
} from "lucide-react";
import {
  ARTICLES,
  getArticleBySlug,
  getCategoryByKey,
  getArticlesByCategory,
} from "@/lib/learn-data";
import { LearnContent } from "@/components/learn-content";

export function generateStaticParams() {
  return ARTICLES.map((a) => ({ slug: a.slug }));
}

const fmtDate = (iso: string) =>
  new Date(iso).toLocaleDateString("ar", { year: "numeric", month: "long", day: "numeric" });

export default async function LearnArticlePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const article = getArticleBySlug(slug);
  if (!article) notFound();

  const cat = getCategoryByKey(article.category);
  const related = getArticlesByCategory(article.category)
    .filter((a) => a.slug !== article.slug)
    .slice(0, 3);

  return (
    <div className="container-page max-w-4xl py-10">
      <nav className="mb-4 flex flex-wrap items-center gap-2 text-xs text-ink-500">
        <Link href="/learn" className="hover:text-brand-700">مركز المعرفة</Link>
        <span>/</span>
        {cat && (
          <>
            <Link
              href={`/learn?cat=${cat.key}`}
              className="hover:text-brand-700"
            >
              {cat.ar}
            </Link>
            <span>/</span>
          </>
        )}
        <span className="truncate text-ink-700">{article.title.ar}</span>
      </nav>

      <header className="mb-8">
        {cat && (
          <Badge tone="info" className="mb-3">
            {cat.ar}
          </Badge>
        )}
        <h1 className="text-3xl font-extrabold leading-tight text-ink-900 sm:text-4xl">
          {article.title.ar}
        </h1>
        <p className="mt-3 text-lg text-ink-600">{article.excerpt.ar}</p>

        <div className="mt-5 flex flex-wrap items-center gap-4 border-y border-ink-100 py-3 text-xs text-ink-500">
          <span className="inline-flex items-center gap-1.5">
            <User2 className="h-3.5 w-3.5" />
            {article.author.name}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <CalendarDays className="h-3.5 w-3.5" />
            {fmtDate(article.publishedAt)}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <Clock className="h-3.5 w-3.5" />
            {article.readTime} دقائق قراءة
          </span>
          <button
            type="button"
            className="ms-auto inline-flex items-center gap-1.5 text-ink-500 transition-colors hover:text-brand-700"
            title="مشاركة"
          >
            <Share2 className="h-3.5 w-3.5" />
            مشاركة
          </button>
        </div>
      </header>

      <div className="grid gap-8 lg:grid-cols-[1fr_280px]">
        <article>
          <LearnContent blocks={article.content} />

          {article.lawReferences.length > 0 && (
            <section className="mt-10 rounded-2xl border border-brand-100 bg-brand-50/40 p-5">
              <h2 className="flex items-center gap-2 text-base font-extrabold text-ink-900">
                <Scale className="h-4 w-4 text-brand-700" />
                المراجع القانونية
              </h2>
              <ul className="mt-3 space-y-2">
                {article.lawReferences.map((l, i) => (
                  <li
                    key={i}
                    className="flex items-start gap-2 rounded-lg bg-white p-3 text-sm"
                  >
                    <ScrollText className="mt-0.5 h-4 w-4 shrink-0 text-brand-600" />
                    <div>
                      <div className="font-semibold text-ink-900">
                        {l.name} رقم {l.number} لسنة {l.year}
                      </div>
                      {l.article && (
                        <div className="text-xs text-ink-500">{l.article}</div>
                      )}
                      {l.url && (
                        <a
                          href={l.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="mt-0.5 inline-flex items-center gap-0.5 text-xs font-semibold text-brand-700 hover:underline"
                        >
                          المصدر الرسمي
                          <ArrowRight className="h-3 w-3 rtl:rotate-180" />
                        </a>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {article.keyQuestions.length > 0 && (
            <section className="mt-8">
              <h2 className="flex items-center gap-2 text-base font-extrabold text-ink-900">
                <HelpCircle className="h-4 w-4 text-brand-700" />
                الأسئلة التي يجيب عليها هذا المقال
              </h2>
              <ul className="mt-3 space-y-2">
                {article.keyQuestions.map((q, i) => (
                  <li
                    key={i}
                    className="flex items-start gap-2 rounded-lg bg-ink-50 px-3 py-2 text-sm text-ink-700"
                  >
                    <span className="mt-1 inline-block h-1.5 w-1.5 shrink-0 rounded-full bg-brand-500" />
                    {q}
                  </li>
                ))}
              </ul>
            </section>
          )}

          <section className="mt-10 rounded-2xl border border-amber-200 bg-amber-50/60 p-5">
            <div className="flex items-start gap-3">
              <ShieldCheck className="h-5 w-5 shrink-0 text-amber-700" />
              <div>
                <h3 className="text-sm font-bold text-ink-900">إخلاء مسؤولية</h3>
                <p className="mt-1 text-xs leading-6 text-ink-600">
                  هذا المقال لأغراض تثقيفية فقط ولا يُعد استشارة قانونية. القوانين
                  قد تُعدَّل، وحالتك قد تستلزم تحليلاً خاصاً. للحصول على نصيحة مخصصة،
                  استشر محامياً مرخصاً.
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Link href="/lawyers">
                    <Button size="sm" iconEnd={<ArrowRight className="h-3.5 w-3.5 rtl:rotate-180" />}>
                      تصفح المحامين
                    </Button>
                  </Link>
                  <Link href="/upload">
                    <Button size="sm" variant="outline">
                      حلّل وثيقتي
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          </section>
        </article>

        <aside className="space-y-4 lg:sticky lg:top-20 lg:self-start">
          <Card>
            <CardBody>
              <h3 className="text-sm font-extrabold text-ink-900">
                {cat?.ar ?? "تصنيف"}
              </h3>
              {cat && (
                <p className="mt-1 text-xs text-ink-500">{cat.description.ar}</p>
              )}
              <Link
                href={`/learn?cat=${article.category}`}
                className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-brand-700 hover:text-brand-800"
              >
                عرض كل مقالات {cat?.ar}
                <ArrowRight className="h-3 w-3 rtl:rotate-180" />
              </Link>
            </CardBody>
          </Card>

          {article.tags.length > 0 && (
            <Card>
              <CardBody>
                <h3 className="text-sm font-extrabold text-ink-900">الوسوم</h3>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {article.tags.map((t) => (
                    <Badge key={t} tone="neutral">#{t}</Badge>
                  ))}
                </div>
              </CardBody>
            </Card>
          )}

          <Card>
            <CardBody>
              <h3 className="text-sm font-extrabold text-ink-900">هل تحتاج محامياً؟</h3>
              <p className="mt-2 text-xs leading-6 text-ink-600">
                ابحث عن محامٍ متخصص في {cat?.ar ?? "هذا المجال"} من دليلنا الموثّق.
              </p>
              <Link href="/lawyers" className="mt-3 inline-block">
                <Button size="sm" variant="outline" className="w-full">
                  ابحث عن محامٍ
                </Button>
              </Link>
            </CardBody>
          </Card>
        </aside>
      </div>

      {related.length > 0 && (
        <section className="mt-12">
          <h2 className="text-2xl font-extrabold text-ink-900">مقالات ذات صلة</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {related.map((a) => (
              <Link key={a.slug} href={`/learn/${a.slug}`} className="group">
                <Card className="h-full transition-shadow group-hover:shadow-md">
                  <CardBody>
                    <h3 className="text-sm font-bold text-ink-900 group-hover:text-brand-700">
                      {a.title.ar}
                    </h3>
                    <p className="mt-1 line-clamp-2 text-xs text-ink-500">
                      {a.excerpt.ar}
                    </p>
                    <div className="mt-3 flex items-center gap-1 text-[11px] text-ink-500">
                      <Clock className="h-3 w-3" />
                      {a.readTime} د قراءة
                    </div>
                  </CardBody>
                </Card>
              </Link>
            ))}
          </div>
        </section>
      )}

      <div className="mt-12 text-center">
        <Link
          href="/learn"
          className="inline-flex items-center gap-1 text-sm font-semibold text-brand-700 hover:text-brand-800"
        >
          <ArrowRight className="h-4 w-4 rtl:rotate-180" />
          العودة إلى مركز المعرفة
        </Link>
      </div>
    </div>
  );
}

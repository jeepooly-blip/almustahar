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
  Search,
  Clock,
  ArrowRight,
  Sparkles,
  ShieldCheck,
  ChevronLeft,
  Scale,
  ScrollText,
} from "lucide-react";
import { ARTICLES, CATEGORIES, getCategoryByKey, type LearnCategory } from "@/lib/learn-data";

const ICONS: Record<LearnCategory, typeof Home> = {
  rental: Home,
  labor: Briefcase,
  traffic: Car,
  consumer: ShoppingBag,
  family: Users,
};

type SP = { [key: string]: string | string[] | undefined };
function asArray(v: string | string[] | undefined): string[] {
  if (!v) return [];
  return Array.isArray(v) ? v : [v];
}

function toggleParam(current: string[], value: string): string {
  const set = new Set(current);
  if (set.has(value)) set.delete(value);
  else set.add(value);
  return Array.from(set).join(",");
}

function buildHref(sp: SP, changes: Record<string, string | undefined>): string {
  const next = new URLSearchParams();
  const merged: Record<string, string[]> = {};
  for (const [k, v] of Object.entries(sp)) {
    if (changes[k] !== undefined) continue;
    const arr = asArray(v);
    if (arr.length) merged[k] = arr;
  }
  for (const [k, v] of Object.entries(changes)) {
    if (v === undefined) continue;
    if (v) merged[k] = [v];
  }
  for (const [k, arr] of Object.entries(merged)) {
    for (const item of arr) next.append(k, item);
  }
  const s = next.toString();
  return s ? `/learn?${s}` : "/learn";
}

const fmtDate = (iso: string) =>
  new Date(iso).toLocaleDateString("ar", { year: "numeric", month: "long", day: "numeric" });

export default async function LearnPage({
  searchParams,
}: {
  searchParams: Promise<SP>;
}) {
  const sp = await searchParams;
  const cat = asArray(sp.cat);
  const q = (asArray(sp.q)[0] ?? "").toLowerCase().trim();
  const hasFilter = cat.length > 0 || q.length > 0;

  let filtered = ARTICLES;
  if (cat.length) {
    filtered = filtered.filter((a) => cat.includes(a.category));
  }
  if (q) {
    filtered = filtered.filter((a) => {
      const blob = [
        a.title.ar,
        a.title.en,
        a.excerpt.ar,
        a.excerpt.en,
        a.tags.join(" "),
        a.lawReferences.map((l) => `${l.name} ${l.number}/${l.year}`).join(" "),
        a.keyQuestions.join(" "),
      ]
        .join(" ")
        .toLowerCase();
      return blob.includes(q);
    });
  }

  const featured = ARTICLES.slice(0, 3);

  return (
    <div className="container-page py-10">
      <div className="mb-10 text-center">
        <Badge tone="info" icon={<BookOpen className="h-3.5 w-3.5" />}>
          مركز المعرفة القانونية
        </Badge>
        <h1 className="mt-3 text-2xl font-extrabold text-ink-900 sm:text-3xl">
          تعلّم عن حقوقك بالعربية
        </h1>
        <p className="mt-2 max-w-2xl mx-auto text-sm text-ink-600">
          مقالات تفصيلية تشرح حقوقك في مجالات الإيجار والعمل والمرور وحماية المستهلك والأسرة،
          مدعومة بإحالات إلى القوانين الأردنية النافذة.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {CATEGORIES.map((c) => {
          const Icon = ICONS[c.key];
          const count = ARTICLES.filter((a) => a.category === c.key).length;
          return (
            <Link
              key={c.key}
              href={`/learn?cat=${c.key}`}
              className="group"
            >
              <div className={`relative overflow-hidden rounded-2xl bg-gradient-to-br ${c.color} p-5 text-white shadow-md transition-transform group-hover:-translate-y-1`}>
                <Icon className="h-7 w-7 opacity-90" />
                <h3 className="mt-3 text-base font-bold">{c.ar}</h3>
                <p className="text-xs opacity-85">{c.en}</p>
                <div className="mt-3 text-[10px] font-semibold opacity-75">
                  {count} مقال
                </div>
              </div>
            </Link>
          );
        })}
      </div>

      <div className="mt-10">
        <Card>
          <CardBody>
            <form action="/learn" method="get" className="mb-4">
              <div className="relative">
                <Search className="pointer-events-none absolute end-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" />
                <input
                  type="search"
                  name="q"
                  defaultValue={q}
                  placeholder="ابحث في المقالات، الوسوم، أو أسماء القوانين..."
                  className="w-full rounded-xl border border-ink-200 bg-white px-4 py-2.5 pe-10 text-sm text-ink-900 outline-none transition-colors placeholder:text-ink-400 focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
                />
                {cat.map((c) => (
                  <input key={c} type="hidden" name="cat" value={c} />
                ))}
              </div>
            </form>

            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-semibold text-ink-500">التصفية:</span>
              {CATEGORIES.map((c) => {
                const Icon = ICONS[c.key];
                const active = cat.includes(c.key);
                return (
                  <Link
                    key={c.key}
                    href={buildHref(sp, { cat: toggleParam(cat, c.key) })}
                    scroll={false}
                    className={
                      "inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold transition-colors " +
                      (active
                        ? "border-brand-500 bg-brand-500 text-white shadow-sm"
                        : "border-ink-200 bg-white text-ink-700 hover:border-brand-300 hover:bg-brand-50 hover:text-brand-700")
                    }
                  >
                    <Icon className="h-3 w-3" />
                    {c.ar}
                  </Link>
                );
              })}
              {hasFilter && (
                <Link
                  href="/learn"
                  className="ms-auto text-xs font-semibold text-brand-700 hover:text-brand-800"
                >
                  مسح الفلاتر
                </Link>
              )}
            </div>
          </CardBody>
        </Card>
      </div>

      {!hasFilter && (
        <div className="mt-10">
          <div className="mb-4 flex items-end justify-between gap-2">
            <h2 className="text-2xl font-extrabold text-ink-900">مقالات مختارة</h2>
          </div>
          <div className="grid gap-6 md:grid-cols-3">
            {featured.map((a) => {
              const cat = getCategoryByKey(a.category);
              return (
                <Link key={a.slug} href={`/learn/${a.slug}`} className="group">
                  <Card className="h-full transition-shadow group-hover:shadow-md">
                    <CardBody className="flex h-full flex-col">
                      {cat && (
                        <Badge tone="info" className="self-start">
                          {cat.ar}
                        </Badge>
                      )}
                      <h3 className="mt-3 text-base font-bold text-ink-900 group-hover:text-brand-700">
                        {a.title.ar}
                      </h3>
                      <p className="mt-2 line-clamp-3 text-sm leading-7 text-ink-600">
                        {a.excerpt.ar}
                      </p>
                      <div className="mt-auto flex items-center justify-between pt-3 text-xs text-ink-500">
                        <span className="inline-flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {a.readTime} د قراءة
                        </span>
                        <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:-translate-x-1 rtl:rotate-180" />
                      </div>
                    </CardBody>
                  </Card>
                </Link>
              );
            })}
          </div>
        </div>
      )}

      <div className="mt-10">
        <div className="mb-4 flex items-end justify-between gap-2">
          <h2 className="text-2xl font-extrabold text-ink-900">
            {hasFilter ? `${filtered.length} نتيجة` : "جميع المقالات"}
          </h2>
        </div>

        {filtered.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-ink-300 bg-white py-16 text-center">
            <p className="text-base font-semibold text-ink-800">
              لا توجد مقالات تطابق بحثك.
            </p>
            <p className="mt-1 text-sm text-ink-500">
              جرّب كلمات بحث أخرى أو أزل بعض الفلاتر.
            </p>
            <Link
              href="/learn"
              className="mt-4 inline-block text-sm font-semibold text-brand-700 hover:text-brand-800"
            >
              عرض جميع المقالات
            </Link>
          </div>
        ) : (
          <ul className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filtered.map((a) => {
              const cat = getCategoryByKey(a.category);
              const Icon = ICONS[a.category];
              return (
                <li key={a.slug}>
                  <Link href={`/learn/${a.slug}`} className="group block h-full">
                    <Card className="h-full transition-shadow group-hover:shadow-md">
                      <CardBody className="flex h-full flex-col space-y-3">
                        <div className="flex items-center gap-2">
                          {cat && (
                            <Badge tone="info" icon={<Icon className="h-3 w-3" />}>
                              {cat.ar}
                            </Badge>
                          )}
                        </div>
                        <h3 className="text-base font-bold text-ink-900 group-hover:text-brand-700">
                          {a.title.ar}
                        </h3>
                        <p className="line-clamp-3 text-sm leading-7 text-ink-600">
                          {a.excerpt.ar}
                        </p>
                        {a.lawReferences.length > 0 && (
                          <div className="flex flex-wrap items-center gap-1.5 text-[11px] text-ink-500">
                            <Scale className="h-3 w-3" />
                            {a.lawReferences.slice(0, 2).map((l, i) => (
                              <span key={i} className="rounded-md bg-ink-100 px-1.5 py-0.5">
                                {l.name} {l.number}/{l.year}
                              </span>
                            ))}
                          </div>
                        )}
                        <div className="mt-auto flex items-center justify-between border-t border-ink-100 pt-3 text-xs text-ink-500">
                          <span className="inline-flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {a.readTime} د قراءة
                          </span>
                          <span>{fmtDate(a.publishedAt)}</span>
                        </div>
                      </CardBody>
                    </Card>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      <div className="mt-12 grid gap-6 md:grid-cols-2">
        <Card>
          <CardBody>
            <Badge tone="info" icon={<ScrollText className="h-3.5 w-3.5" />}>
              المرجع القانوني
            </Badge>
            <h3 className="mt-3 text-xl font-extrabold text-ink-900">
              قوانين أردنية نافذة
            </h3>
            <p className="mt-2 text-sm leading-7 text-ink-600">
              تستند المقالات إلى نصوص قانونية أردنية سارية المفعول، بما في ذلك:
            </p>
            <ul className="mt-3 space-y-1.5 text-sm text-ink-700">
              <li>• قانون المالكين والمستأجرين رقم 22 لسنة 1974</li>
              <li>• قانون العمل رقم 8 لسنة 1996 وتعديلاته</li>
              <li>• قانون المرور رقم 9 لسنة 1984</li>
              <li>• قانون حماية المستهلك رقم 7 لسنة 2017</li>
              <li>• قانون الأحوال الشخصية رقم 36 لسنة 2010</li>
            </ul>
            <p className="mt-3 text-xs text-ink-500">
              <a
                href="https://www.lob.gov.jo"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-brand-700 hover:underline"
              >
                <ChevronLeft className="h-3 w-3 rtl:rotate-180" />
                دائرة التشريع والرأي (المصدر الرسمي)
              </a>
            </p>
          </CardBody>
        </Card>
        <Card>
          <CardBody>
            <div className="flex items-start gap-3">
              <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-emerald-100 text-emerald-700">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-ink-900">ملاحظة مهمة</h3>
                <p className="mt-1 text-sm leading-7 text-ink-600">
                  المقالات على هذا الموقع لأغراض تثقيفية فقط ولا تُعد استشارة قانونية.
                  للحصول على نصيحة مخصصة لحالتك، استشر محامياً مرخصاً.
                </p>
                <Link
                  href="/lawyers"
                  className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-brand-700 hover:text-brand-800"
                >
                  تصفح دليل المحامين
                  <ArrowRight className="h-3.5 w-3.5 rtl:rotate-180" />
                </Link>
              </div>
            </div>
          </CardBody>
        </Card>
      </div>
    </div>
  );
}

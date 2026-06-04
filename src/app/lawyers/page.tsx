import Link from "next/link";
import { mockLawyers, specialtyLabels, cityLabels } from "@/lib/mock-data";
import { Card, CardBody } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { StarRating } from "@/components/star-rating";
import { CheckCircle2, Gavel, MapPin, Globe2, Sparkles } from "lucide-react";

export default function LawyersPage() {
  return (
    <div className="container-page py-10">
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <Badge tone="info" icon={<Sparkles className="h-3.5 w-3.5" />}>
            دليل محامين موثّق
          </Badge>
          <h1 className="mt-3 text-2xl font-extrabold text-ink-900 sm:text-3xl">
            محامون مرخّصون في الأردن
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-ink-600">
            تصفّح دليل المحامين، صفِّ حسب التخصص والموقع والأتعاب. جميع المحامين تم
            التحقق من رقم نقابتهم.
          </p>
        </div>
          <div className="text-end">
          <div className="text-2xl font-extrabold text-brand-700">
            {mockLawyers.length}
          </div>
          <div className="text-xs text-ink-500">محامٍ متاح</div>
        </div>
      </div>

      <LawyerFilters />

      <div className="mt-8 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {mockLawyers.map((l) => (
          <Card key={l.id} className="group flex flex-col overflow-hidden">
            <div className="flex items-start gap-3 border-b border-ink-100 p-5">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={l.avatar}
                alt={l.name}
                className="h-14 w-14 rounded-full border-2 border-white object-cover shadow-sm"
              />
              <div className="flex-1">
                <div className="flex items-center gap-1.5">
                  <h3 className="text-base font-bold text-ink-900">{l.name}</h3>
                  {l.verified && <CheckCircle2 className="h-4 w-4 text-emerald-600" />}
                </div>
                <div className="mt-1 flex items-center gap-2 text-xs text-ink-500">
                  <StarRating value={l.rating} />
                  <span className="font-semibold text-ink-700">{l.rating}</span>
                  <span>({l.totalReviews} تقييم)</span>
                </div>
                <div className="mt-1 flex items-center gap-1 text-xs text-ink-500">
                  <Gavel className="h-3 w-3" />
                  نقابة: {l.barNumber}
                </div>
              </div>
            </div>

            <CardBody className="flex-1 space-y-3">
              <p className="line-clamp-2 text-sm leading-7 text-ink-600">{l.bio.ar}</p>
              <div className="flex flex-wrap gap-1.5">
                {l.specialties.map((s) => (
                  <Badge key={s} tone="info">
                    {specialtyLabels[s]?.ar ?? s}
                  </Badge>
                ))}
              </div>
              <div className="flex items-center gap-3 text-xs text-ink-600">
                <span className="inline-flex items-center gap-1">
                  <MapPin className="h-3 w-3" />
                  {l.cities.map((c) => cityLabels[c]?.ar ?? c).join("، ")}
                </span>
                <span className="inline-flex items-center gap-1">
                  <Globe2 className="h-3 w-3" />
                  {l.languages.includes("ar") ? "عربي" : ""}
                  {l.languages.includes("en") ? "، English" : ""}
                </span>
              </div>
              <div className="grid grid-cols-3 gap-2 border-t border-ink-100 pt-3 text-center">
                <div>
                  <div className="text-sm font-bold text-ink-900">
                    {l.yearsExperience}
                  </div>
                  <div className="text-[10px] text-ink-500">سنة خبرة</div>
                </div>
                <div>
                  <div className="text-sm font-bold text-ink-900">
                    {l.successStories}
                  </div>
                  <div className="text-[10px] text-ink-500">قضية ناجحة</div>
                </div>
                <div>
                  <div className="text-sm font-bold text-ink-900">
                    {l.hourlyRate} د.أ
                  </div>
                  <div className="text-[10px] text-ink-500">للساعة</div>
                </div>
              </div>
            </CardBody>

            <div className="flex gap-2 border-t border-ink-100 p-4">
              <Link href={`/lawyers/${l.id}`} className="flex-1">
                <Button variant="outline" size="sm" className="w-full">
                  عرض الملف
                </Button>
              </Link>
              <Link href={`/lawyers/${l.id}#contact`} className="flex-1">
                <Button size="sm" className="w-full" disabled={!l.isAvailable}>
                  {l.isAvailable ? "إرسال طلب" : "غير متاح"}
                </Button>
              </Link>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

function LawyerFilters() {
  const allSpecialties = Array.from(
    new Set(mockLawyers.flatMap((l) => l.specialties)),
  );
  const allCities = Array.from(new Set(mockLawyers.flatMap((l) => l.cities)));
  return (
    <Card>
      <CardBody>
        <div className="grid gap-4 md:grid-cols-4">
          <FilterGroup label="التخصص" options={allSpecialties.map((s) => ({ v: s, l: specialtyLabels[s]?.ar ?? s }))} />
          <FilterGroup label="المدينة" options={allCities.map((c) => ({ v: c, l: cityLabels[c]?.ar ?? c }))} />
          <FilterGroup
            label="الحد الأقصى للأتعاب"
            options={[
              { v: "60", l: "≤ 60 د.أ" },
              { v: "100", l: "≤ 100 د.أ" },
              { v: "150", l: "≤ 150 د.أ" },
            ]}
          />
          <FilterGroup
            label="التقييم"
            options={[
              { v: "4.5", l: "≥ 4.5 ⭐" },
              { v: "4.0", l: "≥ 4.0 ⭐" },
            ]}
          />
        </div>
      </CardBody>
    </Card>
  );
}

function FilterGroup({
  label,
  options,
}: {
  label: string;
  options: { v: string; l: string }[];
}) {
  return (
    <div>
      <div className="mb-1.5 text-sm font-medium text-ink-700">{label}</div>
      <div className="flex flex-wrap gap-1.5">
        {options.map((o) => (
          <button
            key={o.v}
            type="button"
            className="rounded-full border border-ink-200 bg-white px-3 py-1 text-xs font-semibold text-ink-700 transition-colors hover:border-brand-300 hover:bg-brand-50 hover:text-brand-700"
          >
            {o.l}
          </button>
        ))}
      </div>
    </div>
  );
}


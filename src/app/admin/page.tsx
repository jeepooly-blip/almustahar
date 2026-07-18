import Link from "next/link";
import { redirect } from "next/navigation";
import { getPendingAnalysesForReview, getLawyers } from "@/lib/data";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AdminActions } from "@/components/admin-actions";
import { requireRole } from "@/lib/session-server";
import {
  ShieldCheck,
  BarChart3,
  Users,
  CheckCircle2,
  XCircle,
  Eye,
  Gavel,
  TrendingUp,
  FileCheck2,
} from "lucide-react";

export default async function AdminPage() {
  // Server-side auth check: only ADMIN can access
  const session = await requireRole("ADMIN");

  // Fetch real data when database is available, fall back to empty lists
  const pendingAnalyses = await getPendingAnalysesForReview();
  const allLawyers = await getLawyers({ verifiedOnly: false });
  const pendingVerifications = allLawyers.filter((l) => !l.verified);

  return (
    <div className="container-page py-10">
      <div className="mb-8">
        <Badge tone="info" icon={<ShieldCheck className="h-3.5 w-3.5" />}>
          لوحة الإدارة
        </Badge>
        <h1 className="mt-3 text-2xl font-extrabold text-ink-900 sm:text-3xl">
          مراجعة ومتابعة المنصة
        </h1>
        <p className="mt-1 text-sm text-ink-600">
          مرحباً، {session.name} — مراجعة التحليلات، توثيق المحامين، ومراقبة صحة المنصة.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <AdminStat
          icon={<Users className="h-5 w-5" />}
          label="تحليلات في الانتظار"
          value={String(pendingAnalyses.length)}
          tone="warning"
        />
        <AdminStat
          icon={<FileCheck2 className="h-5 w-5" />}
          label="محامون بحاجة توثيق"
          value={String(pendingVerifications.length)}
          tone="info"
        />
        <AdminStat
          icon={<Gavel className="h-5 w-5" />}
          label="إجمالي المحامين"
          value={String(allLawyers.length)}
          tone="info"
        />
        <AdminStat
          icon={<TrendingUp className="h-5 w-5" />}
          label="إجمالي التحليلات"
          value={String(pendingAnalyses.length)}
          tone="success"
        />
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader
            icon={<Eye className="h-5 w-5" />}
            title="قائمة المراجعة"
            description={`${pendingAnalyses.length} تحليل في انتظار المراجعة`}
            action={<Badge tone="warning">مراجعة</Badge>}
          />
          <CardBody className="space-y-3">
            {pendingAnalyses.length === 0 ? (
              <p className="py-8 text-center text-sm text-ink-500">لا توجد تحليلات في الانتظار.</p>
            ) : (
              pendingAnalyses.slice(0, 10).map((a) => (
                <div
                  key={a.id}
                  className="flex flex-wrap items-start gap-3 rounded-2xl border border-ink-200 p-4"
                >
                  <div className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-amber-50 text-amber-700">
                    <FileCheck2 className="h-5 w-5" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-bold text-ink-900">
                        {a.documentTitle}
                      </h4>
                      <Badge
                        tone={
                          a.reviewStatus === "APPROVED"
                            ? "success"
                            : a.reviewStatus === "PENDING"
                              ? "warning"
                              : "danger"
                        }
                      >
                        {a.reviewStatus === "APPROVED"
                          ? "معتمد"
                          : a.reviewStatus === "PENDING"
                            ? "معلّق"
                            : "مرفوض"}
                      </Badge>
                    </div>
                    <p className="mt-1 line-clamp-2 text-xs text-ink-600">
                      {a.summary}
                    </p>
                    <div className="mt-2 flex items-center gap-3 text-xs text-ink-500">
                      <span>الثقة: {Math.round(a.confidenceScore * 100)}%</span>
                      <span>·</span>
                      <span>
                        {new Date(a.createdAt).toLocaleDateString("ar-JO", { dateStyle: "medium" })}
                      </span>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Link href={`/analyses/${a.id}`}>
                      <Button size="sm" variant="outline" icon={<Eye className="h-3.5 w-3.5" />}>
                        عرض
                      </Button>
                    </Link>
                    <AdminActions analysisId={a.id} />
                  </div>
                </div>
              ))
            )}
          </CardBody>
        </Card>

        <Card>
          <CardHeader
            icon={<Gavel className="h-5 w-5" />}
            title={`توثيق المحامين (${pendingVerifications.length})`}
          />
          <CardBody className="space-y-3">
            {pendingVerifications.length === 0 ? (
              <p className="py-8 text-center text-sm text-ink-500">لا توجد طلبات توثيق معلقة.</p>
            ) : (
              pendingVerifications.map((l) => (
                <div
                  key={l.id}
                  className="rounded-xl border border-amber-200 bg-amber-50/40 p-3"
                >
                  <div className="flex items-center gap-2">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-brand-600 to-brand-500 text-sm font-bold text-white">
                      {l.name[0]}
                    </div>
                    <div className="flex-1">
                      <h4 className="text-sm font-semibold text-ink-900">
                        {l.name}
                      </h4>
                      <p className="text-xs text-ink-500">نقابة: {l.barNumber}</p>
                    </div>
                  </div>
                  <div className="mt-2 flex gap-1.5">
                    <Button size="sm" className="flex-1" icon={<CheckCircle2 className="h-3.5 w-3.5" />}>
                      اعتماد
                    </Button>
                    <Button size="sm" variant="outline" className="flex-1" icon={<XCircle className="h-3.5 w-3.5" />}>
                      رفض
                    </Button>
                  </div>
                </div>
              ))
            )}
          </CardBody>
        </Card>
      </div>

      <Card className="mt-6">
        <CardHeader
          icon={<BarChart3 className="h-5 w-5" />}
          title="تحليلات المنصة"
        />
        <CardBody>
          <div className="grid gap-4 lg:grid-cols-3">
            <ChartCard
              title="أنواع الوثائق"
              data={[
                { label: "إيجار", value: 38, color: "bg-brand-500" },
                { label: "عمل", value: 24, color: "bg-amber-500" },
                { label: "مرور", value: 18, color: "bg-rose-500" },
                { label: "مستهلك", value: 12, color: "bg-accent-500" },
                { label: "أخرى", value: 8, color: "bg-ink-400" },
              ]}
            />
            <ChartCard
              title="حالة المراجعة"
              data={[
                { label: "معتمد", value: 84, color: "bg-emerald-500" },
                { label: "قيد المراجعة", value: 9, color: "bg-amber-500" },
                { label: "مرفوض", value: 5, color: "bg-rose-500" },
                { label: "معدّل", value: 2, color: "bg-brand-500" },
              ]}
            />
            <ChartCard
              title="المدن الأكثر نشاطاً"
              data={[
                { label: "عمّان", value: 62, color: "bg-brand-500" },
                { label: "الزرقاء", value: 14, color: "bg-accent-500" },
                { label: "إربد", value: 12, color: "bg-amber-500" },
                { label: "العقبة", value: 7, color: "bg-emerald-500" },
                { label: "أخرى", value: 5, color: "bg-ink-400" },
              ]}
            />
          </div>
        </CardBody>
      </Card>
    </div>
  );
}

function AdminStat({
  icon,
  label,
  value,
  tone,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  tone: "info" | "success" | "warning" | "danger";
}) {
  const tones = {
    info: "bg-brand-50 text-brand-700",
    success: "bg-emerald-50 text-emerald-700",
    warning: "bg-amber-50 text-amber-700",
    danger: "bg-rose-50 text-rose-700",
  };
  return (
    <Card>
      <CardBody>
        <div className="flex items-start justify-between">
          <div className={`grid h-10 w-10 place-items-center rounded-xl ${tones[tone]}`}>
            {icon}
          </div>
        </div>
        <div className="mt-3 text-2xl font-extrabold text-ink-900">{value}</div>
        <div className="text-xs text-ink-500">{label}</div>
      </CardBody>
    </Card>
  );
}

function ChartCard({
  title,
  data,
}: {
  title: string;
  data: { label: string; value: number; color: string }[];
}) {
  return (
    <div className="rounded-xl border border-ink-200 p-4">
      <h4 className="text-sm font-semibold text-ink-900">{title}</h4>
      <div className="mt-3 space-y-2">
        {data.map((d) => (
          <div key={d.label}>
            <div className="flex items-center justify-between text-xs">
              <span className="font-medium text-ink-700">{d.label}</span>
              <span className="font-bold text-ink-900">{d.value}%</span>
            </div>
            <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-ink-100">
              <div
                className={`h-full rounded-full ${d.color}`}
                style={{ width: `${d.value}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
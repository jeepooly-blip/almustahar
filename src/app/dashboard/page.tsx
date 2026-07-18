import Link from "next/link";
import { getServerSession } from "@/lib/session-server";
import { getAnalyses, getDocuments, getLeadsForUser } from "@/lib/data";
import { mockAnalyses, mockDocuments, mockLeads } from "@/lib/mock-data";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  FileText,
  FileCheck2,
  Send,
  Activity,
  Plus,
  ArrowLeft,
  TrendingUp,
  Calendar,
  CheckCircle2,
  Upload as UploadIcon,
} from "lucide-react";

export default async function DashboardPage() {
  const session = await getServerSession();
  const userId = session?.id ?? "u1"; // Fallback for demo without DB
  const userName = session?.name ?? "زائر";

  // Try real data first, fall back to mock
  let docs = mockDocuments.filter((d) => d.userId === userId);
  let analyses = mockAnalyses.filter((a) => a.userId === userId);
  let leads = mockLeads.filter((l) => l.userId === userId);

  if (session) {
    try {
      const [realDocs, realAnalyses, realLeads] = await Promise.all([
        getDocuments(userId),
        getAnalyses(userId),
        getLeadsForUser(userId),
      ]);
      if (realDocs.length > 0) docs = realDocs;
      if (realAnalyses.length > 0) analyses = realAnalyses;
      if (realLeads.length > 0) leads = realLeads;
    } catch {
      // Use mock data as fallback
    }
  }

  return (
    <DashboardContent
      userName={userName}
      docs={docs}
      analyses={analyses}
      leads={leads}
    />
  );
}

function DashboardContent({
  userName,
  docs,
  analyses,
  leads,
}: {
  userName: string;
  docs: typeof mockDocuments;
  analyses: typeof mockAnalyses;
  leads: typeof mockLeads;
}) {
  return (
    <div className="container-page py-10">
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-ink-900 sm:text-3xl">
            مرحباً، {userName.split(" ")[0]}
          </h1>
          <p className="mt-1 text-sm text-ink-600">
            إليك آخر نشاطاتك وتحليلاتك على المنصة.
          </p>
        </div>
        <Link href="/upload">
          <Button icon={<Plus className="h-4 w-4" />} size="md">
            تحليل وثيقة جديدة
          </Button>
        </Link>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          icon={<FileText className="h-5 w-5" />}
          label="وثائقي"
          value={docs.length}
          tone="info"
        />
        <StatCard
          icon={<FileCheck2 className="h-5 w-5" />}
          label="تحليلاتي"
          value={analyses.length}
          tone="success"
        />
        <StatCard
          icon={<Send className="h-5 w-5" />}
          label="طلباتي للمحامين"
          value={leads.length}
          tone="warning"
        />
        <StatCard
          icon={<Activity className="h-5 w-5" />}
          label="استخدام هذا الشهر"
          value="3 / 3"
          tone="neutral"
        />
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader
            icon={<FileCheck2 className="h-5 w-5" />}
            title="آخر التحليلات"
            action={
              <Link href="/analyses" className="text-xs font-semibold text-brand-700 hover:underline">
                عرض الكل
              </Link>
            }
          />
          <CardBody className="space-y-3">
            {analyses.length === 0 ? (
              <EmptyState
                icon={<UploadIcon className="h-8 w-8" />}
                title="لم ترفع أي وثيقة بعد"
                action={
                  <Link href="/upload">
                    <Button size="sm" icon={<Plus className="h-4 w-4" />}>
                      ارفع وثيقتك الأولى
                    </Button>
                  </Link>
                }
              />
            ) : (
              analyses.slice(0, 5).map((a) => (
                <Link
                  key={a.id}
                  href={`/analyses/${a.id}`}
                  className="flex items-center gap-3 rounded-xl border border-ink-200 p-3 transition-colors hover:border-brand-300 hover:bg-brand-50/30"
                >
                  <div className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-brand-50 text-brand-700">
                    <FileText className="h-5 w-5" />
                  </div>
                  <div className="flex-1 overflow-hidden">
                    <div className="flex items-center gap-2">
                      <h4 className="truncate text-sm font-semibold text-ink-900">
                        {a.documentTitle}
                      </h4>
                      <Badge
                        tone={a.lawyerScore === "HIGH" ? "danger" : a.lawyerScore === "MEDIUM" ? "warning" : "success"}
                      >
                        محامي: {a.lawyerScore === "HIGH" ? "عالية" : a.lawyerScore === "MEDIUM" ? "متوسطة" : "منخفضة"}
                      </Badge>
                    </div>
                    <div className="mt-1 flex items-center gap-3 text-xs text-ink-500">
                      <span className="inline-flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {new Date(a.createdAt).toLocaleDateString("ar-JO", { dateStyle: "medium" })}
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <CheckCircle2 className="h-3 w-3 text-emerald-600" />
                        مكتمل
                      </span>
                    </div>
                  </div>
                  <ArrowLeft className="h-3.5 w-3.5 text-ink-400 flip-rtl" />
                </Link>
              ))
            )}
          </CardBody>
        </Card>

        <Card>
          <CardHeader
            icon={<Send className="h-5 w-5" />}
            title="طلباتي للمحامين"
          />
          <CardBody className="space-y-3">
            {leads.length === 0 ? (
              <p className="text-sm text-ink-500">لا توجد طلبات بعد.</p>
            ) : (
              leads.slice(0, 5).map((l) => (
                <div key={l.id} className="rounded-xl border border-ink-200 p-3">
                  <div className="flex items-center justify-between">
                    <Badge
                      tone={
                        l.status === "ACCEPTED"
                          ? "success"
                          : l.status === "REJECTED"
                            ? "danger"
                            : l.status === "CONVERTED"
                              ? "info"
                              : "warning"
                      }
                    >
                      {l.status === "PENDING"
                        ? "قيد المراجعة"
                        : l.status === "ACCEPTED"
                          ? "مقبول"
                          : l.status === "REJECTED"
                            ? "مرفوض"
                            : "تم التحويل"}
                    </Badge>
                    <span className="text-xs text-ink-500">
                      {new Date(l.createdAt).toLocaleDateString("ar-JO", { dateStyle: "medium" })}
                    </span>
                  </div>
                  <p className="mt-2 line-clamp-2 text-xs text-ink-600">
                    {l.analysisSummary}
                  </p>
                </div>
              ))
            )}
          </CardBody>
        </Card>
      </div>

      <Card className="mt-6">
        <CardHeader
          icon={<TrendingUp className="h-5 w-5" />}
          title="الاستخدام الشهري"
          description="حدّك الحالي: 3 تحليلات مجانية في الساعة"
        />
        <CardBody>
          <div className="grid gap-3 sm:grid-cols-3">
            <UsageItem label="تحليلات" used={analyses.length} total={3} />
            <UsageItem label="صفحات PDF مُصدَّرة" used={docs.filter((d) => d.fileType === "pdf").length} total={5} />
            <UsageItem label="طلبات محامين" used={leads.length} total={10} />
          </div>
        </CardBody>
      </Card>
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  tone,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  tone: "info" | "success" | "warning" | "danger" | "neutral";
}) {
  const tones = {
    info: "bg-brand-50 text-brand-700",
    success: "bg-emerald-50 text-emerald-700",
    warning: "bg-amber-50 text-amber-700",
    danger: "bg-rose-50 text-rose-700",
    neutral: "bg-ink-100 text-ink-700",
  };
  return (
    <Card>
      <CardBody>
        <div className="flex items-center gap-3">
          <div className={`grid h-10 w-10 place-items-center rounded-xl ${tones[tone]}`}>
            {icon}
          </div>
          <div>
            <div className="text-2xl font-extrabold text-ink-900">{value}</div>
            <div className="text-xs text-ink-500">{label}</div>
          </div>
        </div>
      </CardBody>
    </Card>
  );
}

function UsageItem({ label, used, total }: { label: string; used: number; total: number }) {
  const pct = Math.min(100, (used / total) * 100);
  return (
    <div className="rounded-xl border border-ink-200 p-3">
      <div className="flex items-center justify-between text-sm">
        <span className="font-medium text-ink-700">{label}</span>
        <span className="font-bold text-ink-900">
          {used} / {total}
        </span>
      </div>
      <div className="mt-2 h-2 overflow-hidden rounded-full bg-ink-100">
        <div
          className="h-full rounded-full bg-gradient-to-l from-brand-500 to-accent-500"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

function EmptyState({
  icon,
  title,
  action,
}: {
  icon: React.ReactNode;
  title: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-12 text-center">
      <div className="grid h-14 w-14 place-items-center rounded-2xl bg-ink-100 text-ink-500">
        {icon}
      </div>
      <p className="text-sm text-ink-600">{title}</p>
      {action}
    </div>
  );
}
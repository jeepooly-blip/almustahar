import Link from "next/link";
import { mockLeads, mockLawyers, mockUsers, specialtyLabels } from "@/lib/mock-data";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { StarRating } from "@/components/star-rating";
import {
  Inbox,
  TrendingUp,
  Clock,
  CheckCircle2,
  X,
  MessageSquare,
  Calendar,
  DollarSign,
  User,
  BarChart3,
  Gavel,
} from "lucide-react";

export default function LawyerDashboardPage() {
  const lawyer = mockLawyers[0];
  const lawyerLeads = mockLeads.filter((l) => l.lawyerId === lawyer.id);

  return (
    <div className="container-page py-10">
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <Badge tone="info" icon={<Gavel className="h-3.5 w-3.5" />}>
            لوحة المحامي
          </Badge>
          <h1 className="mt-3 text-2xl font-extrabold text-ink-900 sm:text-3xl">
            مرحباً، {lawyer.name}
          </h1>
          <p className="mt-1 text-sm text-ink-600">
            إدارة طلبات الاستشارة، ملفك، وإحصائيات أدائك.
          </p>
        </div>
        <Link href={`/lawyers/${lawyer.id}`}>
          <Button variant="outline" size="md" iconEnd={<ArrowLeft className="h-4 w-4" />}>
            عرض ملفي العام
          </Button>
        </Link>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          icon={<CheckCircle2 className="h-5 w-5" />}
          label="طلبات مقبولة"
          value={lawyerLeads.filter((l) => l.status === "ACCEPTED").length.toString()}
          delta="+12%"
          deltaTone="success"
        />
        <KpiCard
          icon={<Inbox className="h-5 w-5" />}
          label="طلبات معلقة"
          value={lawyerLeads.filter((l) => l.status === "PENDING").length.toString()}
          delta="+3"
          deltaTone="warning"
        />
        <KpiCard
          icon={<TrendingUp className="h-5 w-5" />}
          label="نسبة التحويل"
          value="68%"
          delta="+5%"
          deltaTone="success"
        />
        <KpiCard
          icon={<Clock className="h-5 w-5" />}
          label="متوسط زمن الرد"
          value="1.4 س"
          delta="-12 دقيقة"
          deltaTone="success"
        />
      </div>

      <Card className="mt-8">
        <CardHeader
          icon={<Inbox className="h-5 w-5" />}
          title="صندوق الطلبات الواردة"
          description="راجع طلبات العملاء وقرر قبولها أو رفضها"
        />
        <CardBody className="space-y-3">
          {lawyerLeads.map((l) => (
            <LeadRow key={l.id} lead={l} />
          ))}
        </CardBody>
      </Card>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader
            icon={<BarChart3 className="h-5 w-5" />}
            title="أداؤك هذا الأسبوع"
          />
          <CardBody>
            <ChartMock />
          </CardBody>
        </Card>

        <Card>
          <CardHeader
            icon={<User className="h-5 w-5" />}
            title="ملخص ملفي العام"
          />
          <CardBody className="space-y-3">
            <ProfileItem label="التقييم العام" value={
              <span className="flex items-center gap-2">
                <StarRating value={lawyer.rating} />
                <span className="font-bold">{lawyer.rating}</span>
                <span className="text-xs text-ink-500">({lawyer.totalReviews} تقييم)</span>
              </span>
            } />
            <ProfileItem label="التخصصات" value={
              <div className="flex flex-wrap gap-1.5">
                {lawyer.specialties.map((s) => (
                  <Badge key={s} tone="info">{specialtyLabels[s]?.ar}</Badge>
                ))}
              </div>
            } />
            <ProfileItem label="أتعاب الساعة" value={
              <span className="font-bold text-ink-900">{lawyer.hourlyRate} د.أ</span>
            } />
            <ProfileItem label="نسبة التحويل" value={
              <span className="font-bold text-emerald-700">68%</span>
            } />
          </CardBody>
        </Card>
      </div>
    </div>
  );
}

function LeadRow({ lead }: { lead: (typeof mockLeads)[number] }) {
  return (
    <div className="rounded-2xl border border-ink-200 bg-white p-4 transition-colors hover:border-brand-300">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-gradient-to-br from-brand-600 to-brand-500 text-sm font-bold text-white">
            {lead.userName[0]}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="text-sm font-bold text-ink-900">{lead.userName}</h4>
              <Badge
                tone={
                  lead.status === "ACCEPTED"
                    ? "success"
                    : lead.status === "REJECTED"
                      ? "danger"
                      : lead.status === "CONVERTED"
                        ? "info"
                        : "warning"
                }
              >
                {lead.status === "PENDING"
                  ? "معلّق"
                  : lead.status === "ACCEPTED"
                    ? "مقبول"
                    : lead.status === "REJECTED"
                      ? "مرفوض"
                      : "تم التحويل"}
              </Badge>
            </div>
            <p className="mt-1 text-xs text-ink-500">
              {new Date(lead.createdAt).toLocaleDateString("ar-JO", { dateStyle: "medium" })}
              {lead.feeOffered && (
                <>
                  {" · "}
                  <span className="inline-flex items-center gap-1">
                    <DollarSign className="h-3 w-3" />
                    عرض الأتعاب: {lead.feeOffered} د.أ
                  </span>
                </>
              )}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {lead.status === "PENDING" && (
            <>
              <Button size="sm" icon={<CheckCircle2 className="h-3.5 w-3.5" />}>
                قبول
              </Button>
              <Button size="sm" variant="outline">
                عرض مضاد
              </Button>
              <Button size="sm" variant="danger" icon={<X className="h-3.5 w-3.5" />}>
                رفض
              </Button>
            </>
          )}
          {lead.status !== "PENDING" && (
            <Button size="sm" variant="outline" icon={<MessageSquare className="h-3.5 w-3.5" />}>
              محادثة
            </Button>
          )}
        </div>
      </div>
      <div className="mt-3 rounded-xl bg-ink-50/60 p-3">
        <p className="line-clamp-2 text-sm text-ink-700">{lead.message}</p>
        {lead.analysisSummary && (
          <p className="mt-2 text-xs text-ink-500">
            <span className="font-semibold">سياق الوثيقة:</span> {lead.analysisSummary}
          </p>
        )}
      </div>
    </div>
  );
}

function KpiCard({
  icon,
  label,
  value,
  delta,
  deltaTone,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  delta?: string;
  deltaTone?: "success" | "warning" | "danger";
}) {
  return (
    <Card>
      <CardBody>
        <div className="flex items-start justify-between">
          <div className="grid h-10 w-10 place-items-center rounded-xl bg-brand-50 text-brand-700">
            {icon}
          </div>
          {delta && (
            <Badge tone={deltaTone ?? "neutral"}>{delta}</Badge>
          )}
        </div>
        <div className="mt-3 text-2xl font-extrabold text-ink-900">{value}</div>
        <div className="text-xs text-ink-500">{label}</div>
      </CardBody>
    </Card>
  );
}

function ProfileItem({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between border-b border-ink-100 pb-2 last:border-0">
      <span className="text-xs font-medium text-ink-500">{label}</span>
      {value}
    </div>
  );
}

function ChartMock() {
  const days = ["السبت", "الأحد", "الاثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة"];
  const values = [12, 18, 9, 22, 15, 27, 14];
  const max = Math.max(...values);
  return (
    <div className="space-y-3">
      <div className="flex items-end gap-2 h-32">
        {values.map((v, i) => (
          <div key={i} className="flex flex-1 flex-col items-center gap-1">
            <div
              className="w-full rounded-t-md bg-gradient-to-t from-brand-600 to-accent-400"
              style={{ height: `${(v / max) * 100}%` }}
            />
            <div className="text-[10px] font-medium text-ink-500">{days[i]}</div>
          </div>
        ))}
      </div>
      <div className="grid grid-cols-3 gap-2 text-center">
        <ChartStat label="طلبات واردة" value="117" />
        <ChartStat label="مقبولة" value="79" />
        <ChartStat label="محوّلة" value="68" />
      </div>
    </div>
  );
}

function ChartStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-ink-50 p-2">
      <div className="text-sm font-bold text-ink-900">{value}</div>
      <div className="text-[10px] text-ink-500">{label}</div>
    </div>
  );
}

function ArrowLeft(props: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={props.className}
    >
      <path d="M19 12H5M12 19l-7-7 7-7" />
    </svg>
  );
}



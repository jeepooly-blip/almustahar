"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useLocale } from "@/lib/locale-provider";
import { useSession } from "@/lib/session-provider";
import { Card, CardBody } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert } from "@/components/ui/alert";
import { showToast } from "@/components/ui/toast";
import {
  Scale,
  Inbox,
  CheckCircle2,
  XCircle,
  Flag,
  ChevronLeft,
  Loader2,
  FileText,
  RefreshCw,
} from "lucide-react";
import { cn } from "@/lib/utils";

type PendingItem = {
  id: string;
  documentId: string;
  documentTitle: string;
  documentType: string;
  lawyerScore?: string;
  confidenceScore?: number;
  reviewStatus: string;
  createdAt: string;
  userId: string;
  summary?: string;
};

const TABS = [
  { key: "PENDING_REVIEW", label: { ar: "في الانتظار", en: "Pending" }, icon: Inbox },
  { key: "APPROVED", label: { ar: "مُوافق عليها", en: "Approved" }, icon: CheckCircle2 },
  { key: "REJECTED", label: { ar: "مرفوضة", en: "Rejected" }, icon: XCircle },
  { key: "FLAGGED", label: { ar: "موسومة", en: "Flagged" }, icon: Flag },
];

const SCORE_TONE: Record<string, "success" | "warning" | "danger"> = {
  LOW: "success",
  MEDIUM: "warning",
  HIGH: "danger",
};

export default function LawyerDashboard() {
  const { locale } = useLocale();
  const { user } = useSession();
  const router = useRouter();
  const [tab, setTab] = useState<string>("PENDING_REVIEW");
  const [items, setItems] = useState<PendingItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isAuthorized = user?.role === "ADMIN" || user?.role === "LAWYER";

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/analyses/pending?status=${tab}&limit=50`);
      if (res.status === 401) {
        router.push("/login?next=/dashboard/lawyer");
        return;
      }
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j?.reason || j?.error || `HTTP ${res.status}`);
      }
      const j = await res.json();
      setItems(j.analyses ?? []);
    } catch (e: any) {
      setError(e?.message ?? "Failed to load");
    } finally {
      setLoading(false);
    }
  }, [tab, router]);

  useEffect(() => {
    if (isAuthorized) load();
  }, [load, isAuthorized]);

  if (!user) {
    return (
      <div className="container-page max-w-3xl py-16">
        <Alert variant="info" title={locale === "ar" ? "يلزم تسجيل الدخول" : "Sign-in required"}>
          {locale === "ar"
            ? "يجب تسجيل الدخول كمحامٍ أو مشرف للوصول إلى هذه اللوحة."
            : "You must be signed in as a lawyer or admin to view this dashboard."}
        </Alert>
        <div className="mt-4">
          <Link href="/login?next=/dashboard/lawyer">
            <Button>{locale === "ar" ? "تسجيل الدخول" : "Sign in"}</Button>
          </Link>
        </div>
      </div>
    );
  }

  if (!isAuthorized) {
    return (
      <div className="container-page max-w-3xl py-16">
        <Alert variant="danger" title={locale === "ar" ? "غير مصرّح" : "Unauthorized"}>
          {locale === "ar"
            ? "هذه الصفحة مخصصة للمحامين والمشرفين فقط."
            : "This page is restricted to lawyers and admins."}
        </Alert>
      </div>
    );
  }

  return (
    <div className="container-page max-w-5xl py-10">
      <div className="mb-8 flex items-start justify-between gap-4">
        <div>
          <Badge tone="info" icon={<Scale className="h-3.5 w-3.5" />}>
            {locale === "ar" ? "لوحة المحامي" : "Lawyer dashboard"}
          </Badge>
          <h1 className="mt-3 text-2xl font-extrabold text-ink-900 sm:text-3xl">
            {locale === "ar" ? "مراجعة التحليلات" : "Review analyses"}
          </h1>
          <p className="mt-2 text-sm text-ink-600">
            {locale === "ar"
              ? "راجع التحليلات المعلّقة وافق عليها أو ارفضها أو وسّمها للمراجعة الإضافية."
              : "Review pending analyses. Approve, reject, or flag for further review."}
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={load}
          icon={<RefreshCw className="h-3.5 w-3.5" />}
          disabled={loading}
        >
          {locale === "ar" ? "تحديث" : "Refresh"}
        </Button>
      </div>

      <div className="mb-4 flex flex-wrap gap-2">
        {TABS.map((t) => {
          const Icon = t.icon;
          const active = tab === t.key;
          return (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={cn(
                "flex items-center gap-2 rounded-xl border px-3 py-2 text-sm font-semibold transition-colors",
                active
                  ? "border-brand-500 bg-brand-50 text-brand-800"
                  : "border-ink-200 bg-white text-ink-700 hover:bg-ink-50",
              )}
            >
              <Icon className="h-4 w-4" />
              {locale === "ar" ? t.label.ar : t.label.en}
            </button>
          );
        })}
      </div>

      {error && (
        <Alert variant="danger" title={locale === "ar" ? "خطأ" : "Error"}>
          {error}
        </Alert>
      )}

      {loading ? (
        <Card>
          <CardBody className="flex items-center justify-center gap-2 py-16 text-ink-500">
            <Loader2 className="h-5 w-5 animate-spin" />
            {locale === "ar" ? "جاري التحميل..." : "Loading..."}
          </CardBody>
        </Card>
      ) : items.length === 0 ? (
        <Card>
          <CardBody className="py-16 text-center text-ink-500">
            {locale === "ar" ? "لا توجد عناصر في هذه القائمة." : "Nothing in this queue."}
          </CardBody>
        </Card>
      ) : (
        <ul className="space-y-3">
          {items.map((it) => (
            <li key={it.id}>
              <Link href={`/dashboard/lawyer/review/${it.id}`}>
                <Card className="transition-shadow hover:shadow-md">
                  <CardBody className="flex items-center gap-4">
                    <div className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-brand-50 text-brand-700">
                      <FileText className="h-6 w-6" />
                    </div>
                    <div className="flex-1 overflow-hidden">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="truncate text-sm font-bold text-ink-900">
                          {it.documentTitle || (locale === "ar" ? "بدون عنوان" : "Untitled")}
                        </h3>
                        {it.lawyerScore && (
                          <Badge tone={SCORE_TONE[it.lawyerScore] ?? "warning"}>
                            {it.lawyerScore}
                          </Badge>
                        )}
                        {typeof it.confidenceScore === "number" && (
                          <Badge tone="neutral">
                            {Math.round(it.confidenceScore * 100)}%
                          </Badge>
                        )}
                      </div>
                      {it.summary && (
                        <p className="mt-1 line-clamp-2 text-xs text-ink-600">{it.summary}</p>
                      )}
                      <div className="mt-1 text-xs text-ink-400">
                        {new Date(it.createdAt).toLocaleString(locale === "ar" ? "ar" : "en")}
                      </div>
                    </div>
                    <ChevronLeft className="h-5 w-5 text-ink-400" />
                  </CardBody>
                </Card>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

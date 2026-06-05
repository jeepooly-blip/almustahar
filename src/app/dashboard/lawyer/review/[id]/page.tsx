"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useLocale } from "@/lib/locale-provider";
import { useSession } from "@/lib/session-provider";
import { Card, CardBody } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/input";
import { Alert } from "@/components/ui/alert";
import { showToast } from "@/components/ui/toast";
import {
  ArrowRight,
  CheckCircle2,
  XCircle,
  Flag,
  Loader2,
  FileText,
  AlertTriangle,
  BookOpen,
  ListChecks,
  Gavel,
  Shield,
} from "lucide-react";
import { cn } from "@/lib/utils";

type FullAnalysis = {
  id: string;
  documentId: string;
  documentTitle: string;
  documentType: string;
  summary?: string;
  rights?: string[];
  obligations?: string[];
  risks?: string[];
  nextSteps?: string[];
  sources?: { title: string; ref?: string; excerpt?: string }[];
  lawyerScore?: string;
  lawyerReason?: string;
  confidenceScore?: number;
  reviewStatus?: string;
  createdAt: string;
  userId: string;
};

const SCORE_TONE: Record<string, "success" | "warning" | "danger"> = {
  LOW: "success",
  MEDIUM: "warning",
  HIGH: "danger",
};

export default function ReviewDetail() {
  const { locale } = useLocale();
  const { user } = useSession();
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const id = params.id;

  const [analysis, setAnalysis] = useState<FullAnalysis | null>(null);
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState<"approve" | "reject" | "flag" | null>(null);
  const [error, setError] = useState<string | null>(null);

  const isAuthorized = user?.role === "ADMIN" || user?.role === "LAWYER";

  const load = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/analyses/${id}`);
      if (res.status === 401) {
        router.push(`/login?next=/dashboard/lawyer/review/${id}`);
        return;
      }
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j?.reason || j?.error || `HTTP ${res.status}`);
      }
      const j = await res.json();
      setAnalysis(j.analysis ?? null);
    } catch (e: any) {
      setError(e?.message ?? "Failed to load");
    } finally {
      setLoading(false);
    }
  }, [id, router]);

  useEffect(() => {
    if (isAuthorized) load();
  }, [load, isAuthorized]);

  const submit = async (action: "approve" | "reject" | "flag") => {
    if (!analysis) return;
    setSubmitting(action);
    try {
      const res = await fetch(`/api/admin/analyses/${analysis.id}/review`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, notes: notes || undefined, reviewerId: user?.id }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j?.error ?? `HTTP ${res.status}`);
      }
      showToast({
        variant: "success",
        title:
          action === "approve"
            ? (locale === "ar" ? "تمت الموافقة" : "Approved")
            : action === "reject"
              ? (locale === "ar" ? "تم الرفض" : "Rejected")
              : (locale === "ar" ? "تم الوسم" : "Flagged"),
      });
      router.push("/dashboard/lawyer");
    } catch (e: any) {
      showToast({
        variant: "danger",
        title: locale === "ar" ? "فشل" : "Failed",
        description: e?.message,
      });
    } finally {
      setSubmitting(null);
    }
  };

  if (!user) {
    return (
      <div className="container-page max-w-3xl py-16">
        <Alert variant="info">{locale === "ar" ? "يلزم تسجيل الدخول." : "Sign-in required."}</Alert>
      </div>
    );
  }
  if (!isAuthorized) {
    return (
      <div className="container-page max-w-3xl py-16">
        <Alert variant="danger">{locale === "ar" ? "غير مصرّح." : "Unauthorized."}</Alert>
      </div>
    );
  }

  if (loading || !analysis) {
    return (
      <div className="container-page max-w-3xl py-16 text-center text-ink-500">
        <Loader2 className="mx-auto h-6 w-6 animate-spin" />
        <p className="mt-2 text-sm">{locale === "ar" ? "جاري التحميل..." : "Loading..."}</p>
        {error && (
          <Alert variant="danger" className="mt-4 text-start">
            {error}
          </Alert>
        )}
      </div>
    );
  }

  return (
    <div className="container-page max-w-4xl py-10">
      <Link
        href="/dashboard/lawyer"
        className="mb-4 inline-flex items-center gap-1 text-sm font-semibold text-brand-700 hover:text-brand-800"
      >
        <ArrowRight className="h-4 w-4 rtl:rotate-180" />
        {locale === "ar" ? "العودة للقائمة" : "Back to queue"}
      </Link>

      <Card>
        <CardBody className="space-y-6">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <Badge tone="info" icon={<FileText className="h-3.5 w-3.5" />}>
                {analysis.documentType}
              </Badge>
              {analysis.lawyerScore && (
                <Badge tone={SCORE_TONE[analysis.lawyerScore] ?? "warning"}>
                  {locale === "ar" ? "درجة المخاطرة:" : "Risk:"} {analysis.lawyerScore}
                </Badge>
              )}
              {typeof analysis.confidenceScore === "number" && (
                <Badge tone="neutral">
                  {locale === "ar" ? "الثقة:" : "Confidence:"} {Math.round(analysis.confidenceScore * 100)}%
                </Badge>
              )}
              {analysis.reviewStatus && (
                <Badge tone="warning">{analysis.reviewStatus}</Badge>
              )}
            </div>
            <h1 className="mt-3 text-2xl font-extrabold text-ink-900">
              {analysis.documentTitle || (locale === "ar" ? "بدون عنوان" : "Untitled")}
            </h1>
            <p className="mt-1 text-xs text-ink-500">
              {new Date(analysis.createdAt).toLocaleString(locale === "ar" ? "ar" : "en")}
            </p>
          </div>

          {analysis.summary && (
            <section>
              <h2 className="mb-2 text-sm font-bold text-ink-800">
                {locale === "ar" ? "الملخص" : "Summary"}
              </h2>
              <p className="text-sm leading-7 text-ink-700">{analysis.summary}</p>
            </section>
          )}

          {analysis.lawyerReason && (
            <Alert variant="info" title={locale === "ar" ? "مبرر الدرجة" : "Score rationale"}>
              {analysis.lawyerReason}
            </Alert>
          )}

          {analysis.risks && analysis.risks.length > 0 && (
            <section>
              <h2 className="mb-2 flex items-center gap-2 text-sm font-bold text-ink-800">
                <AlertTriangle className="h-4 w-4 text-rose-600" />
                {locale === "ar" ? "المخاطر" : "Risks"}
              </h2>
              <ul className="list-disc space-y-1 ps-5 text-sm text-ink-700">
                {analysis.risks.map((r, i) => (
                  <li key={i}>{r}</li>
                ))}
              </ul>
            </section>
          )}

          {analysis.rights && analysis.rights.length > 0 && (
            <section>
              <h2 className="mb-2 flex items-center gap-2 text-sm font-bold text-ink-800">
                <Shield className="h-4 w-4 text-emerald-600" />
                {locale === "ar" ? "الحقوق" : "Rights"}
              </h2>
              <ul className="list-disc space-y-1 ps-5 text-sm text-ink-700">
                {analysis.rights.map((r, i) => (
                  <li key={i}>{r}</li>
                ))}
              </ul>
            </section>
          )}

          {analysis.obligations && analysis.obligations.length > 0 && (
            <section>
              <h2 className="mb-2 flex items-center gap-2 text-sm font-bold text-ink-800">
                <Gavel className="h-4 w-4 text-amber-600" />
                {locale === "ar" ? "الالتزامات" : "Obligations"}
              </h2>
              <ul className="list-disc space-y-1 ps-5 text-sm text-ink-700">
                {analysis.obligations.map((o, i) => (
                  <li key={i}>{o}</li>
                ))}
              </ul>
            </section>
          )}

          {analysis.nextSteps && analysis.nextSteps.length > 0 && (
            <section>
              <h2 className="mb-2 flex items-center gap-2 text-sm font-bold text-ink-800">
                <ListChecks className="h-4 w-4 text-brand-600" />
                {locale === "ar" ? "الخطوات التالية" : "Next steps"}
              </h2>
              <ul className="list-disc space-y-1 ps-5 text-sm text-ink-700">
                {analysis.nextSteps.map((s, i) => (
                  <li key={i}>{s}</li>
                ))}
              </ul>
            </section>
          )}

          {analysis.sources && analysis.sources.length > 0 && (
            <section>
              <h2 className="mb-2 flex items-center gap-2 text-sm font-bold text-ink-800">
                <BookOpen className="h-4 w-4 text-indigo-600" />
                {locale === "ar" ? "المصادر القانونية" : "Legal sources"}
              </h2>
              <ul className="space-y-2 text-sm">
                {analysis.sources.map((s, i) => (
                  <li key={i} className="rounded-lg border border-ink-200 bg-ink-50/50 p-2">
                    <div className="font-semibold text-ink-800">{s.title}</div>
                    {s.ref && <div className="text-xs text-ink-500">{s.ref}</div>}
                    {s.excerpt && (
                      <div className="mt-1 text-xs text-ink-600">{s.excerpt}</div>
                    )}
                  </li>
                ))}
              </ul>
            </section>
          )}

          <hr className="border-ink-200" />

          <section>
            <label
              htmlFor="notes"
              className="mb-2 block text-sm font-semibold text-ink-800"
            >
              {locale === "ar" ? "ملاحظات المراجعة (اختياري)" : "Review notes (optional)"}
            </label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={4}
              placeholder={
                locale === "ar"
                  ? "أضف ملاحظاتك للمحامي أو العميل..."
                  : "Add notes for the lawyer or client..."
              }
            />
          </section>

          <div className="flex flex-wrap items-center gap-2">
            <Button
              size="lg"
              onClick={() => submit("approve")}
              disabled={submitting !== null}
              className="bg-emerald-600 hover:bg-emerald-700"
              icon={
                submitting === "approve" ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <CheckCircle2 className="h-4 w-4" />
                )
              }
            >
              {locale === "ar" ? "موافقة" : "Approve"}
            </Button>
            <Button
              size="lg"
              variant="outline"
              onClick={() => submit("flag")}
              disabled={submitting !== null}
              icon={
                submitting === "flag" ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Flag className="h-4 w-4" />
                )
              }
            >
              {locale === "ar" ? "وسم للمراجعة" : "Flag"}
            </Button>
            <Button
              size="lg"
              variant="outline"
              onClick={() => submit("reject")}
              disabled={submitting !== null}
              className="text-rose-700 hover:bg-rose-50"
              icon={
                submitting === "reject" ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <XCircle className="h-4 w-4" />
                )
              }
            >
              {locale === "ar" ? "رفض" : "Reject"}
            </Button>
          </div>
        </CardBody>
      </Card>
    </div>
  );
}

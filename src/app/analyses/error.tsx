"use client";

export default function AnalysesError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="container-page flex min-h-[40vh] flex-col items-center justify-center gap-4 text-center">
      <h2 className="text-xl font-bold text-ink-900">خطأ في تحميل التحليلات</h2>
      <p className="text-sm text-ink-600">{error.message}</p>
      <button onClick={reset} className="rounded-xl bg-brand-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-brand-700">
        إعادة المحاولة
      </button>
    </div>
  );
}
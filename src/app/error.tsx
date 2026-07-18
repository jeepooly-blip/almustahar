"use client";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 px-4 text-center">
      <div className="grid h-16 w-16 place-items-center rounded-2xl bg-rose-50 text-rose-600">
        <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" x2="12" y1="8" y2="12"/><line x1="12" x2="12.01" y1="16" y2="16"/></svg>
      </div>
      <h2 className="text-xl font-bold text-ink-900">حدث خطأ غير متوقع</h2>
      <p className="max-w-md text-sm text-ink-600">
        {error.message || "نعتذر عن هذا الخطأ. يرجى المحاولة مرة أخرى."}
      </p>
      <button
        onClick={reset}
        className="rounded-xl bg-brand-600 px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand-700"
      >
        إعادة المحاولة
      </button>
    </div>
  );
}
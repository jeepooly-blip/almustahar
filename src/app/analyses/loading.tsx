export default function AnalysesLoading() {
  return (
    <div className="container-page py-10">
      <div className="mb-6">
        <div className="h-3 w-20 animate-pulse rounded bg-ink-200" />
        <div className="mt-3 h-8 w-48 animate-pulse rounded bg-ink-200" />
      </div>
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-28 animate-pulse rounded-2xl bg-ink-100" />
        ))}
      </div>
    </div>
  );
}
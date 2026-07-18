export default function DashboardLoading() {
  return (
    <div className="container-page py-10">
      <div className="mb-8">
        <div className="h-3 w-24 animate-pulse rounded bg-ink-200" />
        <div className="mt-3 h-8 w-64 animate-pulse rounded bg-ink-200" />
        <div className="mt-2 h-4 w-48 animate-pulse rounded bg-ink-100" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-24 animate-pulse rounded-2xl bg-ink-100" />
        ))}
      </div>
      <div className="mt-8 h-64 animate-pulse rounded-2xl bg-ink-100" />
    </div>
  );
}
// components/dashboard/DashboardSkeleton.jsx

function Pulse({ className = "" }) {
  return (
    <div
      className={`animate-pulse rounded-lg bg-[var(--border)] ${className}`}
    />
  );
}

function CardSkeleton({ height = "h-64" }) {
  return (
    <div
      className={`rounded-xl border border-[var(--border)] bg-[var(--card)] p-4 ${height}`}
    >
      <div className="flex items-center justify-between mb-4">
        <Pulse className="h-5 w-32" />
        <Pulse className="h-4 w-20" />
      </div>
      <div className="space-y-3">
        <Pulse className="h-4 w-full" />
        <Pulse className="h-4 w-3/4" />
        <Pulse className="h-4 w-1/2" />
        <Pulse className="h-20 w-full mt-4" />
      </div>
    </div>
  );
}

export default function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <Pulse className="h-8 w-40 mb-2" />
          <Pulse className="h-4 w-64" />
        </div>
        <Pulse className="h-10 w-28 rounded-lg" />
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-5"
          >
            <div className="flex items-start gap-4">
              <Pulse className="w-12 h-12 rounded-lg" />
              <div className="flex-1 space-y-2">
                <Pulse className="h-3 w-20" />
                <Pulse className="h-7 w-16" />
                <Pulse className="h-3 w-24" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Row 1 */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2">
          <CardSkeleton height="h-[420px]" />
        </div>
        <CardSkeleton height="h-[420px]" />
      </div>

      {/* Row 2 */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <CardSkeleton height="h-80" />
        <CardSkeleton height="h-80" />
      </div>

      {/* Row 3 */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <CardSkeleton height="h-96" />
        <CardSkeleton height="h-96" />
      </div>

      {/* Row 4 */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <CardSkeleton height="h-80" />
        <CardSkeleton height="h-80" />
      </div>

      {/* Row 5 */}
      <CardSkeleton height="h-72" />
    </div>
  );
}

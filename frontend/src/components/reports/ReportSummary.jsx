const formatLabel = (key) =>
  key.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

const formatValue = (val) => {
  if (typeof val === "number") {
    return val.toLocaleString(undefined, { maximumFractionDigits: 2 });
  }
  return val;
};

export default function ReportSummary({ summary, extraBlocks }) {
  if (!summary) return null;

  const scalarEntries = Object.entries(summary).filter(
    ([, v]) => typeof v !== "object" || v === null,
  );

  return (
    <div className="mb-6">
      <div className="grid gap-3.5 grid-cols-[repeat(auto-fill,minmax(200px,1fr))]">
        {scalarEntries.map(([key, value]) => (
          <div
            key={key}
            className="bg-card border border-border rounded-xl p-4 flex flex-col gap-1.5"
          >
            <span className="text-xs font-semibold text-muted uppercase tracking-wide">
              {formatLabel(key)}
            </span>
            <span className="text-2xl font-bold text-text">
              {formatValue(value)}
            </span>
          </div>
        ))}
      </div>

      {extraBlocks}
    </div>
  );
}

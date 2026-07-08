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
    <div className="space-y-6">
      <div className="grid gap-4 grid-cols-[repeat(auto-fill,minmax(200px,1fr))]">
        {scalarEntries.map(([key, value]) => (
          <div
            key={key}
            className="bg-card border border-border rounded-lg p-4"
          >
            <p className="text-xs font-medium text-muted mb-2">
              {formatLabel(key)}
            </p>
            <p className="text-2xl font-semibold text-text">
              {formatValue(value)}
            </p>
          </div>
        ))}
      </div>

      {extraBlocks}
    </div>
  );
}

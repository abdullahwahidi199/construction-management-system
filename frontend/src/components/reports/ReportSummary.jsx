import { useLanguage } from "../../hooks/useLanguage";
import { formatLabel, formatValue, translateReportKey } from "./reportUtils";

export default function ReportSummary({ summary }) {
  const { t } = useLanguage();
  if (!summary) return null;

  const scalarEntries = Object.entries(summary).filter(
    ([, v]) => typeof v !== "object" || v === null,
  );

  if (scalarEntries.length === 0) return null;

  return (
    <section className="grid gap-4 grid-cols-[repeat(auto-fit,minmax(210px,1fr))]">
      {scalarEntries.map(([key, value], index) => (
        <div
          key={key}
          className="relative overflow-hidden rounded-lg bg-card p-5 shadow-sm shadow-black/5"
        >
          <div
            className={`absolute inset-x-0 top-0 h-1 ${
              index % 4 === 0
                ? "bg-[var(--primary)]"
                : index % 4 === 1
                  ? "bg-success"
                  : index % 4 === 2
                    ? "bg-warning"
                    : "bg-muted"
            }`}
          />
          <p className="text-xs font-semibold text-muted uppercase tracking-wide">
            {translateReportKey(t, "metrics", key, formatLabel(key))}
          </p>
          <div className="mt-3 flex items-end justify-between gap-3">
            <p className="text-2xl font-semibold text-text break-words">
              {formatValue(value)}
            </p>
            <div className="h-9 w-1 flex-shrink-0 rounded-full bg-hover" aria-hidden="true" />
          </div>
        </div>
      ))}
    </section>
  );
}

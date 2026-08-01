import { Download, FileBarChart2 } from "lucide-react";

import { useLanguage } from "../../hooks/useLanguage";
import { translateOrFallback } from "./reportUtils";

export default function ReportToolbar({
  report,
  onExportPdf,
  exporting,
  generatedAt,
}) {
  const { t } = useLanguage();
  const label = translateOrFallback(
    t,
    `reports.reportTypes.${report.key}.label`,
    report.label,
  );
  const description = report.description
    ? translateOrFallback(
        t,
        `reports.reportTypes.${report.key}.description`,
        report.description,
      )
    : "";

  return (
    <div className="mb-5 flex flex-wrap items-start justify-between gap-4 border-b border-[color:color-mix(in_srgb,var(--border)_70%,transparent)] pb-5">
      <div className="flex min-w-0 items-start gap-3">
        <div className="hidden h-10 w-10 items-center justify-center rounded-md bg-[color:color-mix(in_srgb,var(--primary)_12%,transparent)] text-[var(--primary)] sm:flex">
          <FileBarChart2 size={20} />
        </div>
        <div className="min-w-0">
          <p className="text-xs font-semibold text-[var(--primary)] uppercase tracking-wide">
            {translateOrFallback(t, "reports.executiveReport", "Executive Report")}
          </p>
          <h1 className="mt-1 break-words text-2xl font-semibold leading-tight text-text">
            {label}
          </h1>
          {description && (
            <p className="mt-1 max-w-3xl text-sm leading-6 text-muted">{description}</p>
          )}
          {generatedAt && (
            <p className="text-xs text-muted mt-2">
              {translateOrFallback(t, "reports.generated", "Generated {{date}}", {
                date: generatedAt,
              })}
            </p>
          )}
        </div>
      </div>

      <button
        onClick={onExportPdf}
        disabled={exporting}
        className="inline-flex min-h-12 items-center justify-center gap-2 rounded-md border border-[color:color-mix(in_srgb,var(--border)_82%,transparent)] bg-card px-4 text-sm font-medium text-text transition-colors hover:bg-hover disabled:cursor-not-allowed disabled:opacity-50 sm:min-h-0 sm:h-10"
      >
        <Download size={16} />
        {exporting
          ? translateOrFallback(t, "reports.actions.exporting", "Exporting...")
          : translateOrFallback(t, "reports.actions.exportPdf", "Export PDF")}
      </button>
    </div>
  );
}

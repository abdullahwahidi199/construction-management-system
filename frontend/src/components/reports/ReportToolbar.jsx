import { Download, FileBarChart2 } from "lucide-react";

import { useLanguage } from "../../hooks/useLanguage";
import { translateOrFallback } from "./reportUtils";
import { pdfButtonClass } from "../ui/formStyles.jsx";

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
    <div className="mb-5 flex flex-wrap items-start justify-between gap-4">
      <div className="flex items-start gap-4">
        <div className="hidden h-12 w-12 items-center justify-center rounded-lg bg-[color:color-mix(in_srgb,var(--primary)_14%,transparent)] text-[var(--primary)] sm:flex">
          <FileBarChart2 size={22} />
        </div>
        <div>
          <p className="text-xs font-semibold text-[var(--primary)] uppercase tracking-wide">
            {translateOrFallback(t, "reports.executiveReport", "Executive Report")}
          </p>
          <h1 className="mt-1 text-2xl font-semibold text-text">
            {label}
          </h1>
          {description && (
            <p className="text-sm text-muted mt-1">{description}</p>
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
        className={pdfButtonClass}
      >
        <Download size={16} />
        {exporting
          ? translateOrFallback(t, "reports.actions.exporting", "Exporting...")
          : translateOrFallback(t, "reports.actions.exportPdf", "Export PDF")}
      </button>
    </div>
  );
}

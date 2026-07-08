export default function ReportToolbar({
  report,
  onExportPdf,
  exporting,
  generatedAt,
}) {
  return (
    <div className="flex flex-wrap justify-between items-center gap-4 mb-6">
      <div>
        <h1 className="text-xl font-semibold text-text">
          {report.label} Report
        </h1>
        {report.description && (
          <p className="text-sm text-muted mt-0.5">{report.description}</p>
        )}
        {generatedAt && (
          <p className="text-xs text-muted mt-1.5">Generated {generatedAt}</p>
        )}
      </div>

      <button
        onClick={onExportPdf}
        disabled={exporting}
        className="px-3.5 py-2 rounded-md border border-border bg-card text-text text-sm font-medium transition-colors hover:bg-hover disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {exporting ? "Exporting…" : "Export PDF"}
      </button>
    </div>
  );
}

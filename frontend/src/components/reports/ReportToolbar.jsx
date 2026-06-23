export default function ReportToolbar({
  report,
  onExportPdf,
  exporting,
  generatedAt,
}) {
  return (
    <div className="flex flex-wrap justify-between items-start gap-4 pb-4 mb-5 border-b border-border">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2.5 text-text">
          <span>{report.icon}</span>
          {report.label} Report
        </h1>
        <p className="text-muted text-sm mt-1">{report.description}</p>
        {generatedAt && (
          <span className="inline-block mt-2 text-xs text-muted">
            Generated: {generatedAt}
          </span>
        )}
      </div>

      <button
        onClick={onExportPdf}
        disabled={exporting}
        className="px-4 py-2.5 rounded-lg bg-danger text-white text-sm font-semibold transition active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed"
      >
        {exporting ? "Exporting..." : "⬇ Export PDF"}
      </button>
    </div>
  );
}

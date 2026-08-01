import { useEffect, useState } from "react";

import { REPORTS } from "../../../config/reportConfig";
import useReport from "../../../hooks/useReport";
import { useLanguage } from "../../../hooks/useLanguage";
import useRealtimeEvents from "../../../hooks/useRealtimeEvents";
import ReportBreakdowns from "../../reports/ReportBreakdowns";
import ReportFilters from "../../reports/ReportFilters";
import ReportSidebar from "../../reports/ReportSidebar";
import ReportSummary from "../../reports/ReportSummary";
import ReportTable from "../../reports/ReportTable";
import ReportToolbar from "../../reports/ReportToolbar";
import ReportVisuals from "../../reports/ReportVisuals";
import { getReportRows, translateOrFallback } from "../../reports/reportUtils";

const CONTENT_KEYS_TO_IGNORE = new Set([
  "rows",
  "preview",
  "summary",
  "generated_at",
  "report_name",
  "filters",
]);

function ReportLoadingState() {
  return (
    <div className="space-y-5" aria-live="polite">
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div
            key={index}
            className="h-32 animate-pulse rounded-md border border-[color:color-mix(in_srgb,var(--border)_70%,transparent)] bg-card p-4"
          >
            <div className="h-3 w-2/5 rounded-full bg-hover" />
            <div className="mt-6 h-8 w-3/4 rounded-full bg-hover" />
            <div className="mt-5 h-3 w-1/2 rounded-full bg-hover" />
          </div>
        ))}
      </div>
      <div className="grid gap-5 xl:grid-cols-[minmax(0,1.35fr)_minmax(320px,0.9fr)]">
        {Array.from({ length: 2 }).map((_, index) => (
          <div
            key={index}
            className="h-96 animate-pulse rounded-md border border-[color:color-mix(in_srgb,var(--border)_70%,transparent)] bg-card p-5"
          >
            <div className="h-4 w-44 rounded-full bg-hover" />
            <div className="mt-3 h-3 w-64 max-w-full rounded-full bg-hover" />
            <div className="mt-10 h-56 rounded-md bg-hover/70" />
          </div>
        ))}
      </div>
    </div>
  );
}

function ReportStatePanel({ tone = "neutral", children }) {
  const toneClass =
    tone === "danger" ? "text-danger" : tone === "warning" ? "text-warning" : "text-muted";

  return (
    <div
      className={`rounded-md border border-[color:color-mix(in_srgb,var(--border)_72%,transparent)] bg-card px-5 py-12 text-center text-sm ${toneClass}`}
    >
      {children}
    </div>
  );
}

const hasReportContent = (data, rows) => {
  if (!data) return false;
  if (rows.length > 0) return true;

  const summaryHasContent = Object.values(data.summary || {}).some((value) => {
    if (Array.isArray(value)) return value.length > 0;
    return value !== null && value !== undefined && value !== "";
  });

  if (summaryHasContent) return true;

  return Object.entries(data).some(
    ([key, value]) =>
      !CONTENT_KEYS_TO_IGNORE.has(key) && Array.isArray(value) && value.length > 0,
  );
};

export default function ReportsPage() {
  const [activeKey, setActiveKey] = useState("projects");
  const [filterValues, setFilterValues] = useState({});
  const { t } = useLanguage();

  const report = REPORTS[activeKey];
  const { data, loading, exporting, error, fetchReport, exportPdf } = useReport(
    report.endpoint,
  );

  useEffect(() => {
    fetchReport({});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeKey]);

  useRealtimeEvents((message) => {
    if (message.event?.startsWith("expense.")) {
      fetchReport(filterValues);
    }
  });

  const handleSelectReport = (key) => {
    setActiveKey(key);
    setFilterValues({});
  };

  const handleApply = () => fetchReport(filterValues);
  const handleReset = () => {
    setFilterValues({});
    fetchReport({});
  };
  const handleExport = () =>
    exportPdf(filterValues, `${report.key}_report.pdf`);

  const rows = getReportRows(data);
  const hasContent = hasReportContent(data, rows);

  return (
    <div className="min-h-0 bg-[color:color-mix(in_srgb,var(--bg)_94%,var(--card))] text-text">
      <main className="mx-auto w-full max-w-[1500px] px-3 py-5 sm:px-6 lg:py-8">
        <ReportToolbar
          report={report}
          onExportPdf={handleExport}
          exporting={exporting}
          generatedAt={data?.generated_at}
        />

        <ReportSidebar activeKey={activeKey} onSelect={handleSelectReport} />

        <ReportFilters
          filters={report.filters}
          values={filterValues}
          onChange={setFilterValues}
          onApply={handleApply}
          onReset={handleReset}
        />

        {loading && <ReportLoadingState />}

        {error && (
          <ReportStatePanel tone="danger">
            {translateOrFallback(
              t,
              "reports.states.error",
              "Failed to load report. Please try again.",
            )}
          </ReportStatePanel>
        )}

        {!loading && !error && data && !hasContent && (
          <ReportStatePanel>
            {translateOrFallback(
              t,
              "reports.states.noRecords",
              "No records found for the selected filters.",
            )}
          </ReportStatePanel>
        )}

        {!loading && !error && data && hasContent && (
          <div className="space-y-6">
            <ReportSummary summary={data.summary} />
            <ReportVisuals reportKey={activeKey} data={data} rows={rows} />
            <ReportBreakdowns data={data} />
            {report.columns.length > 0 && (
              <ReportTable columns={report.columns} rows={rows} />
            )}
          </div>
        )}
      </main>
    </div>
  );
}

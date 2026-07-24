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

  return (
    <div className="min-h-screen bg-bg text-text">
      <main className="mx-auto w-full max-w-[1500px] px-4 py-6 sm:px-6 lg:py-10">
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

        {loading && (
          <div className="rounded-lg bg-card p-12 text-center text-sm text-muted shadow-sm shadow-black/5">
            {translateOrFallback(t, "reports.states.loading", "Loading report...")}
          </div>
        )}

        {error && (
          <div className="rounded-lg bg-card p-12 text-center text-sm text-danger shadow-sm shadow-black/5">
            {translateOrFallback(
              t,
              "reports.states.error",
              "Failed to load report. Please try again.",
            )}
          </div>
        )}

        {!loading && !error && data && (
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

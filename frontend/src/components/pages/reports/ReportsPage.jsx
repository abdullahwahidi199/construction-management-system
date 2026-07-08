import { useEffect, useState } from "react";
import { REPORTS } from "../../../config/reportConfig";
import useReport from "../../../hooks/useReport";

import ReportSidebar from "../../reports/ReportSidebar";
import ReportFilters from "../../reports/ReportFilters";
import ReportToolbar from "../../reports/ReportToolbar";
import ReportSummary from "../../reports/ReportSummary";
import ReportBreakdowns from "../../reports/ReportBreakdowns";
import ReportTable from "../../reports/ReportTable";

export default function ReportsPage() {
  const [activeKey, setActiveKey] = useState("projects");
  const [filterValues, setFilterValues] = useState({});

  const report = REPORTS[activeKey];
  const { data, loading, exporting, error, fetchReport, exportPdf } = useReport(
    report.endpoint,
  );

  useEffect(() => {
    setFilterValues({});
    fetchReport({});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeKey]);

  const handleApply = () => fetchReport(filterValues);
  const handleReset = () => {
    setFilterValues({});
    fetchReport({});
  };
  const handleExport = () =>
    exportPdf(filterValues, `${report.key}_report.pdf`);

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-bg text-text">
      <ReportSidebar activeKey={activeKey} onSelect={setActiveKey} />

      <main className="flex-1 px-6 py-8 max-w-[1400px] w-full mx-auto">
        <ReportToolbar
          report={report}
          onExportPdf={handleExport}
          exporting={exporting}
          generatedAt={data?.generated_at}
        />

        <ReportFilters
          filters={report.filters}
          values={filterValues}
          onChange={setFilterValues}
          onApply={handleApply}
          onReset={handleReset}
        />

        {loading && (
          <div className="p-12 text-center text-sm text-muted bg-card border border-border rounded-lg">
            Loading report…
          </div>
        )}

        {error && (
          <div className="p-12 text-center text-sm text-danger bg-card border border-border rounded-lg">
            Failed to load report. Please try again.
          </div>
        )}

        {!loading && !error && data && (
          <div className="space-y-8">
            <ReportSummary
              summary={data.summary}
              extraBlocks={<ReportBreakdowns summary={data.summary} />}
            />
            <ReportTable columns={report.columns} rows={data.rows} />
          </div>
        )}
      </main>
    </div>
  );
}

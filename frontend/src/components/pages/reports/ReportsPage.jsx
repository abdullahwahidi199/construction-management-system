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

      <main className="flex-1 px-5 md:px-7 py-6 overflow-x-hidden">
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
          <div className="p-10 text-center text-muted bg-card border border-dashed border-border rounded-xl">
            Loading report...
          </div>
        )}

        {error && (
          <div className="p-10 text-center text-danger bg-card border border-dashed border-danger rounded-xl">
            Failed to load report. Please try again.
          </div>
        )}

        {!loading && !error && data && (
          <>
            <ReportSummary
              summary={data.summary}
              extraBlocks={<ReportBreakdowns summary={data.summary} />}
            />
            <ReportTable columns={report.columns} rows={data.rows} />
          </>
        )}
      </main>
    </div>
  );
}

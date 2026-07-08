import { REPORT_LIST } from "../../config/reportConfig";

export default function ReportSidebar({ activeKey, onSelect }) {
  return (
    <aside className="w-full md:w-60 flex-shrink-0 bg-card border-b md:border-b-0 md:border-r border-border">
      <div className="p-6">
        <h2 className="text-xs font-semibold text-muted uppercase tracking-wider mb-4">
          Reports
        </h2>

        <nav className="flex md:flex-col gap-0.5 overflow-x-auto">
          {REPORT_LIST.map((report) => {
            const active = activeKey === report.key;
            return (
              <button
                key={report.key}
                onClick={() => onSelect(report.key)}
                className={`flex items-center gap-2.5 px-3 py-2 rounded-md text-sm text-left whitespace-nowrap flex-shrink-0 transition-colors
                  ${
                    active
                      ? "bg-hover text-text font-medium"
                      : "text-muted hover:text-text hover:bg-hover"
                  }`}
              >
                <span className="text-base">{report.icon}</span>
                <span>{report.label}</span>
              </button>
            );
          })}
        </nav>
      </div>
    </aside>
  );
}

import { REPORT_LIST } from "../../config/reportConfig";

export default function ReportSidebar({ activeKey, onSelect }) {
  return (
    <aside className="w-full md:w-60 flex-shrink-0 bg-card border-b md:border-b-0 md:border-r border-border p-4 md:p-6">
      <h2 className="text-lg font-bold text-text mb-5">Reports</h2>

      <nav className="flex md:flex-col gap-1.5 overflow-x-auto">
        {REPORT_LIST.map((report) => {
          const active = activeKey === report.key;
          return (
            <button
              key={report.key}
              onClick={() => onSelect(report.key)}
              className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium text-left whitespace-nowrap transition-all flex-shrink-0
                ${
                  active
                    ? "bg-primary text-white shadow"
                    : "text-text hover:bg-hover"
                }`}
            >
              <span className="text-lg">{report.icon}</span>
              <span>{report.label}</span>
            </button>
          );
        })}
      </nav>
    </aside>
  );
}

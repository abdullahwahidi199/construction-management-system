import {
  BarChart3,
  BriefcaseBusiness,
  Building2,
  CalendarCheck,
  ChevronDown,
  FileText,
  ReceiptText,
  Users,
} from "lucide-react";

import { REPORT_LIST } from "../../config/reportConfig";
import { useLanguage } from "../../hooks/useLanguage";
import { translateOrFallback } from "./reportUtils";

const ICONS = {
  projects: Building2,
  expenses: ReceiptText,
  payroll: BriefcaseBusiness,
  attendance: CalendarCheck,
  employees: Users,
  contracts: FileText,
  financial: BarChart3,
};

export default function ReportSidebar({ activeKey, onSelect }) {
  const { t } = useLanguage();
  const activeReport = REPORT_LIST.find((report) => report.key === activeKey);
  const activeLabel = activeReport
    ? translateOrFallback(
        t,
        `reports.reportTypes.${activeReport.key}.label`,
        activeReport.label,
      )
    : translateOrFallback(t, "reports.title", "Reports");

  return (
    <section className="mb-6 rounded-lg bg-card p-3 shadow-sm shadow-black/5">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex min-w-0 items-center gap-3 px-1">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-[color:color-mix(in_srgb,var(--primary)_12%,transparent)] text-[var(--primary)]">
            <BarChart3 size={19} strokeWidth={2} />
          </span>
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted">
              {translateOrFallback(t, "reports.center", "Report Center")}
            </p>
            <p className="truncate text-sm font-medium text-text">
              {activeLabel}
            </p>
          </div>
        </div>

        <div className="relative lg:hidden">
          <select
            value={activeKey}
            onChange={(event) => onSelect(event.target.value)}
            className="h-11 w-full appearance-none rounded-md bg-bg px-3 pr-10 text-sm font-medium text-text shadow-inner outline-none transition-colors focus:ring-2 focus:ring-[var(--primary)]/25"
            aria-label={translateOrFallback(t, "reports.selectReport", "Select report")}
          >
            {REPORT_LIST.map((report) => (
              <option key={report.key} value={report.key}>
                {translateOrFallback(
                  t,
                  `reports.reportTypes.${report.key}.label`,
                  report.label,
                )}
              </option>
            ))}
          </select>
          <ChevronDown
            className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted"
            strokeWidth={2}
          />
        </div>

        <nav
          className="hidden min-w-0 rounded-md bg-bg p-1 lg:flex"
          aria-label="Report navigation"
        >
          {REPORT_LIST.map((report) => {
            const active = activeKey === report.key;
            const Icon = ICONS[report.key] || BarChart3;
            return (
              <button
                key={report.key}
                type="button"
                onClick={() => onSelect(report.key)}
                aria-current={active ? "page" : undefined}
                className={`inline-flex h-10 items-center gap-2 rounded-md px-3 text-sm font-medium whitespace-nowrap transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)]/35
                  ${
                    active
                      ? "bg-card text-[var(--primary)] shadow-sm shadow-black/5"
                      : "text-muted hover:bg-hover hover:text-text"
                  }`}
              >
                <Icon size={16} strokeWidth={2} />
                <span className="truncate">
                  {translateOrFallback(
                    t,
                    `reports.reportTypes.${report.key}.label`,
                    report.label,
                  )}
                </span>
              </button>
            );
          })}
        </nav>
      </div>
    </section>
  );
}

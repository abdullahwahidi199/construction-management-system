import { useCalendar } from "../../hooks/useCalendar";
import { useLanguage } from "../../hooks/useLanguage";
import {
  EMPTY_VALUE,
  formatValue,
  translateOrFallback,
  translateReportKey,
} from "./reportUtils";

const formatCell = (row, column, formatDate, t) => {
  const value = row[`formatted_${column.key}`] ?? row[column.key];
  if (value === null || value === undefined || value === "") return EMPTY_VALUE;

  switch (column.type) {
    case "date":
      return row[`formatted_${column.key}`] || formatDate(value) || EMPTY_VALUE;
    case "currency":
    case "number":
      return formatValue(value, {
        minimumFractionDigits: column.type === "currency" ? 2 : 0,
        maximumFractionDigits: 2,
      });
    case "bool":
      return value
        ? translateOrFallback(t, "reports.values.yes", "Yes")
        : translateOrFallback(t, "reports.values.no", "No");
    default:
      return value;
  }
};

const badgeClass = (value) => {
  const v = String(value).toLowerCase();
  if (["completed", "active", "present", "paid"].some((s) => v.includes(s)))
    return "bg-success/10 text-success";
  if (["employee"].some((s) => v === s))
    return "bg-[color:color-mix(in_srgb,var(--primary)_12%,transparent)] text-[var(--primary)]";
  if (["daily worker"].some((s) => v === s))
    return "bg-warning/10 text-warning";
  if (["cancelled", "terminated", "absent"].some((s) => v.includes(s)))
    return "bg-danger/10 text-danger";
  if (["on hold", "pending", "draft", "leave", "overtime"].some((s) => v.includes(s)))
    return "bg-warning/10 text-warning";
  return "bg-hover text-muted";
};

export default function ReportTable({ columns, rows }) {
  const { formatDate } = useCalendar("reports");
  const { t } = useLanguage();

  if (!columns || columns.length === 0) return null;

  if (!rows || rows.length === 0) {
    return (
      <div className="rounded-lg bg-card p-12 text-center text-sm text-muted shadow-sm shadow-black/5">
        {translateOrFallback(t, "reports.states.noRecords", "No records found.")}
      </div>
    );
  }

  return (
    <section className="overflow-hidden rounded-lg bg-card shadow-sm shadow-black/5">
      <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-4">
        <div>
          <h3 className="text-sm font-semibold text-text">
            {translateOrFallback(t, "reports.table.detailedRecords", "Detailed Records")}
          </h3>
          <p className="mt-1 text-xs text-muted">
            {translateOrFallback(
              t,
              "reports.table.recordCount",
              "{{count}} records in this report view",
              { count: formatValue(rows.length) },
            )}
          </p>
        </div>
      </div>

      <div className="overflow-x-auto max-h-[640px]">
        <table className="w-full text-sm">
          <thead className="sticky top-0 z-10 bg-[color:color-mix(in_srgb,var(--hover)_70%,var(--card))]">
            <tr>
              {columns.map((col) => (
                <th
                  key={col.key}
                  className="text-left px-4 py-3 text-xs font-medium text-muted uppercase tracking-wider whitespace-nowrap"
                >
                  {translateReportKey(t, "columns", col.key, col.label)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, idx) => (
              <tr
                key={row.id ?? idx}
                className="border-b border-[color:color-mix(in_srgb,var(--border)_55%,transparent)] last:border-0 odd:bg-bg/35 transition-colors hover:bg-hover"
              >
                {columns.map((col) => (
                  <td
                    key={col.key}
                    className="px-4 py-3 text-text whitespace-nowrap"
                  >
                    {col.type === "badge" ? (
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium capitalize ${badgeClass(
                          row[col.key],
                        )}`}
                      >
                        {row[col.key] ?? EMPTY_VALUE}
                      </span>
                    ) : (
                      formatCell(row, col, formatDate, t)
                    )}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

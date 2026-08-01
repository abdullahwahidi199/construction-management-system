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
      <div className="rounded-md border border-dashed border-[color:color-mix(in_srgb,var(--border)_75%,transparent)] bg-card px-5 py-12 text-center text-sm text-muted">
        {translateOrFallback(t, "reports.states.noRecords", "No records found.")}
      </div>
    );
  }

  return (
    <section className="overflow-hidden rounded-md border border-[color:color-mix(in_srgb,var(--border)_72%,transparent)] bg-card">
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

      <div className="hidden overflow-x-auto overflow-y-visible md:block mobile-scrollbar">
        <table className="w-full text-sm">
          <thead className="bg-bg">
            <tr>
              {columns.map((col) => (
                <th
                  key={col.key}
                  className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted"
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
                className="border-b border-[color:color-mix(in_srgb,var(--border)_55%,transparent)] last:border-0 transition-colors hover:bg-hover/70"
              >
                {columns.map((col) => (
                  <td
                    key={col.key}
                    className="max-w-64 break-words px-4 py-3 align-top text-text"
                  >
                    {col.type === "badge" ? (
                      <span
                        className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium capitalize ${badgeClass(
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
      <div className="divide-y divide-[color:color-mix(in_srgb,var(--border)_55%,transparent)] md:hidden">
        {rows.map((row, idx) => {
          const titleColumn = columns[0];
          const subtitleColumn = columns[1];
          const title = titleColumn
            ? formatCell(row, titleColumn, formatDate, t)
            : `#${idx + 1}`;
          const subtitle = subtitleColumn
            ? formatCell(row, subtitleColumn, formatDate, t)
            : "";

          return (
            <article key={row.id ?? idx} className="grid gap-4 p-4">
              <div className="min-w-0">
                <h3 className="break-words text-base font-semibold text-text">
                  {title}
                </h3>
                {subtitleColumn && (
                  <p className="mt-1 break-words text-sm text-muted">
                    {subtitle}
                  </p>
                )}
              </div>
              <dl className="grid grid-cols-1 gap-3 min-[380px]:grid-cols-2">
                {columns.slice(1).map((col) => (
                  <div key={col.key} className="min-w-0">
                    <dt className="text-[11px] font-semibold uppercase tracking-wide text-muted">
                      {translateReportKey(t, "columns", col.key, col.label)}
                    </dt>
                    <dd className="mt-1 break-words text-sm font-medium text-text">
                      {col.type === "badge" ? (
                        <span
                          className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium capitalize ${badgeClass(
                            row[col.key],
                          )}`}
                        >
                          {row[col.key] ?? EMPTY_VALUE}
                        </span>
                      ) : (
                        formatCell(row, col, formatDate, t)
                      )}
                    </dd>
                  </div>
                ))}
              </dl>
            </article>
          );
        })}
      </div>
    </section>
  );
}

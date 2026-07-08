const formatCell = (value, type) => {
  if (value === null || value === undefined || value === "") return "—";

  switch (type) {
    case "currency":
      return Number(value).toLocaleString(undefined, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      });
    case "number":
      return Number(value).toLocaleString(undefined, {
        maximumFractionDigits: 2,
      });
    case "bool":
      return value ? "Yes" : "No";
    default:
      return value;
  }
};

const badgeClass = (value) => {
  const v = String(value).toLowerCase();
  if (["completed", "active", "present", "paid"].some((s) => v.includes(s)))
    return "bg-success/10 text-success";
  if (["cancelled", "terminated", "absent"].some((s) => v.includes(s)))
    return "bg-danger/10 text-danger";
  if (["on hold", "pending", "draft", "leave"].some((s) => v.includes(s)))
    return "bg-warning/10 text-warning";
  return "bg-hover text-muted";
};

export default function ReportTable({ columns, rows }) {
  if (!columns || columns.length === 0) return null;

  if (!rows || rows.length === 0) {
    return (
      <div className="p-12 text-center text-sm text-muted bg-card border border-border rounded-lg">
        No records found.
      </div>
    );
  }

  return (
    <div className="bg-card border border-border rounded-lg overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border">
              {columns.map((col) => (
                <th
                  key={col.key}
                  className="text-left px-4 py-3 text-xs font-medium text-muted uppercase tracking-wider whitespace-nowrap"
                >
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, idx) => (
              <tr
                key={row.id ?? idx}
                className="border-b border-border last:border-0 hover:bg-hover transition-colors"
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
                        {row[col.key] ?? "—"}
                      </span>
                    ) : (
                      formatCell(row[col.key], col.type)
                    )}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

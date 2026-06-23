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
    return "bg-success/15 text-success";
  if (["cancelled", "terminated", "absent"].some((s) => v.includes(s)))
    return "bg-danger/15 text-danger";
  if (["on hold", "pending", "draft", "leave"].some((s) => v.includes(s)))
    return "bg-warning/15 text-warning";
  return "bg-hover text-muted";
};

export default function ReportTable({ columns, rows }) {
  if (!columns || columns.length === 0) return null;

  if (!rows || rows.length === 0) {
    return (
      <div className="p-10 text-center text-muted bg-card border border-dashed border-border rounded-xl">
        No records found.
      </div>
    );
  }

  return (
    <div className="bg-card border border-border rounded-xl overflow-x-auto">
      <table className="w-full border-collapse text-[13px]">
        <thead>
          <tr>
            {columns.map((col) => (
              <th
                key={col.key}
                className="bg-primary text-white text-left px-3.5 py-3 font-semibold whitespace-nowrap"
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
              className="hover:bg-hover transition-colors"
            >
              {columns.map((col) => (
                <td
                  key={col.key}
                  className="px-3.5 py-2.5 border-b border-border text-text"
                >
                  {col.type === "badge" ? (
                    <span
                      className={`inline-block px-2.5 py-1 rounded-full text-[11px] font-semibold capitalize ${badgeClass(
                        row[col.key],
                      )}`}
                    >
                      {row[col.key]}
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
  );
}

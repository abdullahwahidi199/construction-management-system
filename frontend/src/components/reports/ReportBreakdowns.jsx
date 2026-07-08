export default function ReportBreakdowns({ summary }) {
  if (!summary) return null;

  const lists = Object.entries(summary).filter(
    ([, v]) => Array.isArray(v) && v.length > 0,
  );

  if (lists.length === 0) return null;

  return (
    <div className="grid gap-4 grid-cols-[repeat(auto-fill,minmax(320px,1fr))]">
      {lists.map(([name, arr]) => (
        <div
          key={name}
          className="bg-card border border-border rounded-lg overflow-hidden"
        >
          <div className="px-4 py-3 border-b border-border">
            <h4 className="text-sm font-medium capitalize text-text">
              {name.replace(/_/g, " ")}
            </h4>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  {Object.keys(arr[0]).map((k) => (
                    <th
                      key={k}
                      className="text-left px-4 py-2.5 text-xs font-medium text-muted capitalize"
                    >
                      {k.replace(/_/g, " ")}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {arr.map((item, i) => (
                  <tr key={i} className="border-b border-border last:border-0">
                    {Object.values(item).map((val, j) => (
                      <td key={j} className="px-4 py-2.5 text-text capitalize">
                        {typeof val === "number"
                          ? val.toLocaleString()
                          : String(val ?? "—")}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ))}
    </div>
  );
}

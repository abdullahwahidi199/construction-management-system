export default function ReportBreakdowns({ summary }) {
  if (!summary) return null;

  const lists = Object.entries(summary).filter(
    ([, v]) => Array.isArray(v) && v.length > 0,
  );

  if (lists.length === 0) return null;

  return (
    <div className="grid gap-4 grid-cols-[repeat(auto-fill,minmax(320px,1fr))] mt-5">
      {lists.map(([name, arr]) => (
        <div key={name} className="bg-card border border-border rounded-xl p-4">
          <h4 className="mb-3 text-sm font-bold capitalize text-text">
            {name.replace(/_/g, " ")}
          </h4>
          <table className="w-full border-collapse text-[13px]">
            <thead>
              <tr>
                {Object.keys(arr[0]).map((k) => (
                  <th
                    key={k}
                    className="text-left px-2.5 py-2 border-b border-border text-muted font-semibold capitalize"
                  >
                    {k.replace(/_/g, " ")}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {arr.map((item, i) => (
                <tr key={i}>
                  {Object.values(item).map((val, j) => (
                    <td
                      key={j}
                      className="px-2.5 py-2 border-b border-border text-text capitalize"
                    >
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
      ))}
    </div>
  );
}

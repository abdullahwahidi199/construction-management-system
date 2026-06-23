export default function ReportFilters({
  filters,
  values,
  onChange,
  onApply,
  onReset,
}) {
  if (!filters || filters.length === 0) return null;

  const handleField = (name, value) => {
    onChange({ ...values, [name]: value });
  };

  const inputClass =
    "px-3 py-2 border border-border rounded-lg bg-bg text-text text-sm outline-none focus:border-primary transition";

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onApply();
      }}
      className="bg-card border border-border rounded-xl p-4 mb-6"
    >
      <div className="grid gap-3.5 grid-cols-[repeat(auto-fill,minmax(180px,1fr))]">
        {filters.map((field) => (
          <div className="flex flex-col gap-1.5" key={field.name}>
            <label className="text-xs font-semibold text-muted">
              {field.label}
            </label>

            {field.type === "select" ? (
              <select
                value={values[field.name] ?? ""}
                onChange={(e) => handleField(field.name, e.target.value)}
                className={inputClass}
              >
                {field.options.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            ) : (
              <input
                type={field.type}
                value={values[field.name] ?? ""}
                onChange={(e) => handleField(field.name, e.target.value)}
                placeholder={field.label}
                className={inputClass}
              />
            )}
          </div>
        ))}
      </div>

      <div className="flex gap-2.5 mt-4">
        <button
          type="submit"
          className="px-4 py-2.5 rounded-lg bg-primary text-white text-sm font-semibold transition active:scale-95"
        >
          Apply Filters
        </button>
        <button
          type="button"
          onClick={onReset}
          className="px-4 py-2.5 rounded-lg border border-border text-text text-sm font-semibold transition hover:bg-hover active:scale-95"
        >
          Reset
        </button>
      </div>
    </form>
  );
}

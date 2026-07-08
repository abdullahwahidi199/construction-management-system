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
    "h-9 px-3 border border-border rounded-md bg-bg text-text text-sm outline-none transition-colors focus:border-primary";

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onApply();
      }}
      className="bg-card border border-border rounded-lg p-4 mb-6"
    >
      <div className="grid gap-4 grid-cols-[repeat(auto-fill,minmax(180px,1fr))]">
        {filters.map((field) => (
          <div className="flex flex-col gap-1.5" key={field.name}>
            <label className="text-xs font-medium text-muted">
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

      <div className="flex gap-2 mt-4 pt-4 border-t border-border">
        <button
          type="submit"
          className="h-9 px-4 rounded-md bg-primary text-white text-sm font-medium transition-colors hover:opacity-90"
        >
          Apply
        </button>
        <button
          type="button"
          onClick={onReset}
          className="h-9 px-4 rounded-md border border-border text-text text-sm font-medium transition-colors hover:bg-hover"
        >
          Reset
        </button>
      </div>
    </form>
  );
}

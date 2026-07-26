import { Filter, RotateCcw, Search } from "lucide-react";

import { useLanguage } from "../../hooks/useLanguage";
import CalendarDatePicker from "../common/CalendarDatePicker";
import { translateOrFallback, translateReportKey } from "./reportUtils";

export default function ReportFilters({
  filters,
  values,
  onChange,
  onApply,
  onReset,
}) {
  const { t } = useLanguage();
  if (!filters || filters.length === 0) return null;

  const handleField = (name, value) => {
    onChange({ ...values, [name]: value });
  };

  const inputClass =
    "min-h-12 rounded-md bg-bg px-3 py-3 text-base text-text shadow-inner outline-none transition-colors focus:ring-2 focus:ring-[var(--primary)]/20 sm:min-h-0 sm:py-2 sm:text-sm";

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onApply();
      }}
      className="mb-6 rounded-lg bg-card p-4 shadow-sm shadow-black/5"
    >
      <div className="flex items-center gap-2 mb-4">
        <Filter size={16} className="text-[var(--primary)]" />
        <h2 className="text-sm font-semibold text-text">
          {translateOrFallback(t, "reports.filtersTitle", "Report Filters")}
        </h2>
      </div>

      <div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,180px),1fr))] gap-4">
        {filters.map((field) => (
          <div className="flex flex-col gap-1.5" key={field.name}>
            <label className="text-xs font-medium text-muted">
              {translateReportKey(t, "filters", field.name, field.label)}
            </label>

            {field.type === "select" ? (
              <select
                value={values[field.name] ?? ""}
                onChange={(e) => handleField(field.name, e.target.value)}
                className={inputClass}
              >
                {field.options.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {translateReportKey(t, "options", opt.value, opt.label)}
                  </option>
                ))}
              </select>
            ) : field.type === "date" ? (
              <CalendarDatePicker
                value={values[field.name] ?? ""}
                onChange={(value) => handleField(field.name, value)}
                module="reports"
              />
            ) : (
              <input
                type={field.type}
                value={values[field.name] ?? ""}
                onChange={(e) => handleField(field.name, e.target.value)}
                placeholder={translateReportKey(
                  t,
                  "filters",
                  field.name,
                  field.label,
                )}
                className={inputClass}
              />
            )}
          </div>
        ))}
      </div>

      <div className="mt-4 flex flex-col gap-2 pt-1 sm:flex-row">
        <button
          type="submit"
          className="inline-flex min-h-12 items-center justify-center gap-2 rounded-md bg-[var(--primary)] px-4 text-sm font-medium text-white shadow-sm shadow-black/10 transition-colors hover:opacity-90 sm:min-h-0 sm:h-9"
        >
          <Search size={15} />
          {translateOrFallback(t, "reports.actions.apply", "Apply")}
        </button>
        <button
          type="button"
          onClick={onReset}
          className="inline-flex min-h-12 items-center justify-center gap-2 rounded-md bg-bg px-4 text-sm font-medium text-text transition-colors hover:bg-hover sm:min-h-0 sm:h-9"
        >
          <RotateCcw size={15} />
          {translateOrFallback(t, "reports.actions.reset", "Reset")}
        </button>
      </div>
    </form>
  );
}

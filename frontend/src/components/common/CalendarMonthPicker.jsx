import { useMemo } from "react";
import { useCalendar } from "../../hooks/useCalendar";
import {
  AFGHAN_MONTH_NAMES,
  CALENDAR_TYPES,
  currentMonthKey,
  normalizeDigits,
} from "../../utils/calendar";

function pad(value) {
  return String(value).padStart(2, "0");
}

function parseMonthKey(value) {
  const match = normalizeDigits(value || "")
    .trim()
    .replace(/\//g, "-")
    .match(/^(-?\d{1,4})-(\d{1,2})$/);
  if (!match) return null;
  const month = Number(match[2]);
  if (month < 1 || month > 12) return null;
  return { year: Number(match[1]), month };
}

export default function CalendarMonthPicker({
  label,
  value,
  onChange,
  required = false,
  error,
  name,
  module = "dashboard",
  calendar: calendarOverride,
  className = "",
  style,
  ...props
}) {
  const { calendar: moduleCalendar } = useCalendar(module);
  const calendar = calendarOverride || moduleCalendar;
  const selected = parseMonthKey(value) || parseMonthKey(currentMonthKey(calendar));

  const years = useMemo(() => {
    const base = selected?.year || parseMonthKey(currentMonthKey(calendar))?.year;
    if (!base) return [];
    return Array.from({ length: 11 }, (_, index) => base - 5 + index);
  }, [calendar, selected?.year]);

  const fieldClass = `min-h-12 w-full rounded-lg border bg-[var(--bg)] px-4 py-3 text-base text-[var(--text)] focus:border-[var(--primary)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/20 sm:min-h-0 sm:py-2.5 sm:text-sm ${error ? "border-red-500" : "border-[var(--border)]"} ${className}`;

  const commit = (year, month) => {
    if (!year || !month) {
      onChange?.("");
      return;
    }
    onChange?.(`${Number(year)}-${pad(month)}`);
  };

  return (
    <div className="w-full">
      {label && <div className="mb-1.5 text-sm font-medium text-[var(--text)]">{label}</div>}

      {calendar === CALENDAR_TYPES.SHAMSI ? (
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-[1fr_1.3fr]">
          <select
            aria-label={`${label || "Payroll month"} year`}
            value={selected?.year || ""}
            onChange={(event) => commit(event.target.value, selected?.month)}
            className={fieldClass}
            style={style}
            required={required}
            {...props}
          >
            {years.map((year) => (
              <option key={year} value={year}>
                {year}
              </option>
            ))}
          </select>
          <select
            aria-label={`${label || "Payroll month"} month`}
            name={name}
            value={selected?.month || ""}
            onChange={(event) => commit(selected?.year, event.target.value)}
            className={fieldClass}
            style={style}
            required={required}
            {...props}
          >
            {AFGHAN_MONTH_NAMES.en.map((monthName, index) => (
              <option key={monthName} value={index + 1}>
                {monthName}
              </option>
            ))}
          </select>
        </div>
      ) : (
        <input
          name={name}
          type="month"
          value={value || currentMonthKey(calendar)}
          onChange={(event) => onChange?.(event.target.value)}
          className={fieldClass}
          style={style}
          required={required}
          {...props}
        />
      )}

      {error && <p className="mt-1 text-xs text-[var(--danger)]">{error}</p>}
    </div>
  );
}

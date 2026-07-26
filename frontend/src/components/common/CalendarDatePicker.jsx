import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { useMemo, useState } from "react";
import { useCalendar } from "../../hooks/useCalendar";
import {
  AFGHAN_MONTH_NAMES,
  CALENDAR_TYPES,
  formatDate,
  normalizeDigits,
  parseDate,
  shamsiMonthLength,
  todayIso,
  toGregorian,
  toShamsi,
} from "../../utils/calendar";

const WEEK_DAYS = ["Sat", "Sun", "Mon", "Tue", "Wed", "Thu", "Fri"];

function pad(value) {
  return String(value).padStart(2, "0");
}

function todayForCalendar(calendar) {
  const today = todayIso();
  if (calendar === CALENDAR_TYPES.SHAMSI) {
    const shamsi = toShamsi(today);
    return `${shamsi.year}-${pad(shamsi.month)}-${pad(shamsi.day)}`;
  }
  return today;
}

function startWeekOffset(year, month) {
  const gregorian = toGregorian(`${year}-${pad(month)}-01`);
  const [gy, gm, gd] = gregorian.split("-").map(Number);
  return (new Date(gy, gm - 1, gd).getDay() + 1) % 7;
}

export default function CalendarDatePicker({
  label,
  value,
  onChange,
  required = false,
  error,
  name,
  module = "dashboard",
  className = "",
  placeholder = "YYYY-MM-DD",
  ...props
}) {
  const { calendar } = useCalendar(module);
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");

  const displayValue = useMemo(() => {
    if (text) return text;
    return value ? formatDate(value, calendar) : "";
  }, [calendar, text, value]);

  const visibleMonth = useMemo(() => {
    const [year, month] = (displayValue || todayForCalendar(calendar)).split("-").map(Number);
    return { year, month };
  }, [calendar, displayValue]);

  if (calendar === CALENDAR_TYPES.GREGORIAN) {
    return (
      <div className="w-full">
        {label && <div className="mb-1.5 text-sm font-medium text-[var(--text)]">{label}</div>}
        <input
          name={name}
          type="date"
          value={value || ""}
          required={required}
          onChange={(event) => onChange?.(event.target.value)}
          {...props}
          className={`min-h-12 w-full rounded-lg border bg-[var(--bg)] px-4 py-3 text-base text-[var(--text)] focus:border-[var(--primary)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/20 sm:min-h-0 sm:py-2.5 sm:text-sm ${error ? "border-red-500" : "border-[var(--border)]"} ${className}`}
        />
        {error && <p className="mt-1 text-xs text-[var(--danger)]">{error}</p>}
      </div>
    );
  }

  const days = Array.from({ length: shamsiMonthLength(visibleMonth.year, visibleMonth.month) }, (_, index) => index + 1);
  const blanks = Array.from({ length: startWeekOffset(visibleMonth.year, visibleMonth.month) });

  const commitManual = (raw) => {
    const normalized = normalizeDigits(raw).replace(/\//g, "-");
    setText(normalized);
    const gregorian = parseDate(normalized, CALENDAR_TYPES.SHAMSI);
    if (gregorian) onChange?.(gregorian);
  };

  const changeMonth = (delta) => {
    let year = visibleMonth.year;
    let month = visibleMonth.month + delta;
    if (month < 1) {
      month = 12;
      year -= 1;
    }
    if (month > 12) {
      month = 1;
      year += 1;
    }
    setText(`${year}-${pad(month)}-01`);
  };

  const selectDay = (day) => {
    const shamsi = `${visibleMonth.year}-${pad(visibleMonth.month)}-${pad(day)}`;
    setText("");
    onChange?.(toGregorian(shamsi));
    setOpen(false);
  };

  return (
    <div className="relative w-full">
      {label && <div className="mb-1.5 text-sm font-medium text-[var(--text)]">{label}</div>}
      <div className="flex gap-2">
        <input
          name={name}
          type="text"
          value={displayValue}
          required={required}
          onFocus={() => setOpen(true)}
          onChange={(event) => commitManual(event.target.value)}
          placeholder={placeholder}
          {...props}
          className={`min-h-12 w-full rounded-lg border bg-[var(--bg)] px-4 py-3 text-base text-[var(--text)] placeholder:text-[var(--muted)] focus:border-[var(--primary)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/20 sm:min-h-0 sm:py-2.5 sm:text-sm ${error ? "border-red-500" : "border-[var(--border)]"} ${className}`}
        />
        {value && (
          <button type="button" title="Clear" onClick={() => { setText(""); onChange?.(""); }} className="h-12 w-12 shrink-0 rounded-lg border border-[var(--border)] text-[var(--muted)] hover:bg-[var(--hover)] sm:h-10 sm:w-10">
            <X className="mx-auto h-4 w-4" />
          </button>
        )}
      </div>
      {open && (
        <div className="absolute left-0 right-0 z-50 mt-2 max-w-[calc(100vw-2rem)] rounded-lg border border-[var(--border)] bg-[var(--bg)] p-3 shadow-xl sm:right-auto sm:w-80">
          <div className="mb-3 flex items-center justify-between">
            <button type="button" title="Previous month" onClick={() => changeMonth(-1)} className="h-10 w-10 rounded-lg hover:bg-[var(--hover)] sm:h-8 sm:w-8">
              <ChevronLeft className="mx-auto h-4 w-4" />
            </button>
            <div className="text-sm font-semibold text-[var(--text)]">
              {AFGHAN_MONTH_NAMES.en[visibleMonth.month - 1]} {visibleMonth.year}
            </div>
            <button type="button" title="Next month" onClick={() => changeMonth(1)} className="h-10 w-10 rounded-lg hover:bg-[var(--hover)] sm:h-8 sm:w-8">
              <ChevronRight className="mx-auto h-4 w-4" />
            </button>
          </div>
          <div className="grid grid-cols-7 gap-1 text-center text-xs text-[var(--muted)]">
            {WEEK_DAYS.map((day) => <div key={day} className="py-1">{day}</div>)}
            {blanks.map((_, index) => <div key={`blank-${index}`} />)}
            {days.map((day) => (
              <button key={day} type="button" onClick={() => selectDay(day)} className="min-h-10 rounded-md text-sm text-[var(--text)] hover:bg-[var(--primary)] hover:text-white sm:min-h-8">
                {day}
              </button>
            ))}
          </div>
          <div className="mt-3 flex justify-between gap-2 border-t border-[var(--border)] pt-3">
            <button type="button" onClick={() => { setText(""); onChange?.(todayIso()); setOpen(false); }} className="rounded-lg px-3 py-1.5 text-sm hover:bg-[var(--hover)]">Today</button>
            <button type="button" onClick={() => setOpen(false)} className="rounded-lg px-3 py-1.5 text-sm hover:bg-[var(--hover)]">Close</button>
          </div>
        </div>
      )}
      {error && <p className="mt-1 text-xs text-[var(--danger)]">{error}</p>}
    </div>
  );
}

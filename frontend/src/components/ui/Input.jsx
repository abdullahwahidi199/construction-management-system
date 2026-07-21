import CalendarDatePicker from "../common/CalendarDatePicker";

function inferCalendarModule(name, fallback) {
  if (fallback && fallback !== "dashboard") return fallback;
  const field = String(name || "").toLowerCase();
  if (field.includes("payroll") || field.includes("period")) return "payroll";
  if (field.includes("expense")) return "expenses";
  if (field.includes("hire") || field.includes("termination")) return "employees";
  if (field.includes("joining")) return "daily_workers";
  if (field.includes("invoice") || field.includes("due")) return "invoices";
  if (field.includes("payment")) return "payments";
  if (field.includes("contract")) return "contracts";
  if (field.includes("attendance")) return "attendance";
  if (field.includes("start") || field.includes("completion")) return "projects";
  return fallback;
}

export default function Input({
  label,
  placeholder,
  value,
  onChange,
  type = "text",
  error,
  name,
  className = "",
  module = "dashboard",
}) {
  if (type === "date") {
    return (
      <CalendarDatePicker
        label={label}
        name={name}
        value={value}
        onChange={onChange}
        error={error}
        module={inferCalendarModule(name, module)}
        className={className}
        placeholder={placeholder}
      />
    );
  }

  return (
    <div className="w-full">
      {label && (
        <div className="mb-1.5 text-sm font-medium text-[var(--text)]">
          {label}
        </div>
      )}

      <input
        name={name}
        type={type}
        value={value ?? ""}
        onChange={(e) => onChange?.(e.target.value)}
        placeholder={placeholder}
        className={`
          w-full px-4 py-2.5 rounded-lg border 
          bg-[var(--bg)] text-[var(--text)] 
          placeholder:text-[var(--muted)]
          transition-colors duration-200
          focus:outline-none focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary)]/20
          ${error ? "border-red-500" : "border-[var(--border)]"}
          ${className}
        `}
      />

      {error && <p className="mt-1 text-xs text-[var(--danger)]">{error}</p>}
    </div>
  );
}

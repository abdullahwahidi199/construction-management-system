import CalendarDatePicker from "../common/CalendarDatePicker";
import {
  fieldControlClass,
  fieldControlErrorClass,
  fieldErrorClass,
  fieldLabelClass,
  RequiredMark,
} from "./formStyles.jsx";

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
  required = false,
  ...props
}) {
  if (type === "date") {
    return (
      <CalendarDatePicker
        label={
          label ? (
            <>
              {label} {required && <RequiredMark />}
            </>
          ) : (
            label
          )
        }
        name={name}
        value={value}
        onChange={onChange}
        error={error}
        module={inferCalendarModule(name, module)}
        className={className}
        placeholder={placeholder}
        required={required}
        {...props}
      />
    );
  }

  return (
    <div className="w-full">
      {label && (
        <div className={fieldLabelClass}>
          {label} {required && <RequiredMark />}
        </div>
      )}

      <input
        name={name}
        type={type}
        value={value ?? ""}
        onChange={(e) => onChange?.(e.target.value)}
        placeholder={placeholder}
        required={required}
        {...props}
        className={`
          ${fieldControlClass}
          ${error ? fieldControlErrorClass : ""}
          ${className}
        `}
      />

      {error && <p className={fieldErrorClass}>{error}</p>}
    </div>
  );
}

import {
  fieldControlClass,
  fieldControlErrorClass,
  fieldErrorClass,
  fieldLabelClass,
  RequiredMark,
} from "./formStyles.jsx";

export default function Select({
  label,
  value,
  onChange,
  options = [],
  className = "",
  placeholder,
  disabled = false,
  error,
  required = false,
}) {
  return (
    <label className={`block ${className}`}>
      {label && (
        <div className={fieldLabelClass}>
          {label} {required && <RequiredMark />}
        </div>
      )}

      <select
        value={value ?? ""}
        disabled={disabled}
        required={required}
        onChange={(e) => onChange?.(e.target.value)}
        className={`${fieldControlClass} ${error ? fieldControlErrorClass : ""}`}
      >
        {placeholder && <option value="">{placeholder}</option>}

        {options.map((o) => (
          <option
            key={o.value}
            value={o.value}
            className="
              bg-[var(--card)]
              text-[var(--text)]
            "
          >
            {o.label}
          </option>
        ))}
      </select>
      {error && <p className={fieldErrorClass}>{error}</p>}
    </label>
  );
}

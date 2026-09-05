import { useId } from "react";
import ReactSelect from "react-select";
import {
  fieldErrorClass,
  fieldLabelClass,
  RequiredMark,
} from "./formStyles.jsx";

export default function SearchableSelect({
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
  const generatedId = useId();
  const inputId = `searchable-select-${generatedId.replace(/:/g, "")}`;
  const selectedOption =
    options.find((option) => String(option.value) === String(value)) || null;

  return (
    <div className={`block ${className}`}>
      {label && (
        <label htmlFor={inputId} className={fieldLabelClass}>
          {label} {required && <RequiredMark />}
        </label>
      )}

      <ReactSelect
        inputId={inputId}
        value={selectedOption}
        onChange={(option) => onChange?.(option?.value ?? "")}
        options={options}
        placeholder={placeholder}
        isDisabled={disabled}
        isSearchable
        aria-invalid={!!error}
        menuPosition="fixed"
        menuPortalTarget={typeof document === "undefined" ? null : document.body}
        noOptionsMessage={() => "No subcontractors found"}
        styles={{
          control: (base, state) => ({
            ...base,
            minHeight: "42px",
            borderColor: error
              ? "var(--danger)"
              : state.isFocused
                ? "var(--primary)"
                : "var(--border)",
            backgroundColor: "var(--bg)",
            boxShadow: state.isFocused
              ? `0 0 0 2px color-mix(in srgb, ${error ? "var(--danger)" : "var(--primary)"} 20%, transparent)`
              : "none",
            "&:hover": {
              borderColor: error ? "var(--danger)" : "var(--primary)",
            },
          }),
          input: (base) => ({ ...base, color: "var(--text)" }),
          singleValue: (base) => ({ ...base, color: "var(--text)" }),
          placeholder: (base) => ({ ...base, color: "var(--muted)" }),
          menu: (base) => ({
            ...base,
            zIndex: 60,
            backgroundColor: "var(--card)",
          }),
          menuPortal: (base) => ({ ...base, zIndex: 60 }),
          option: (base, state) => ({
            ...base,
            color: "var(--text)",
            backgroundColor: state.isSelected
              ? "var(--primary)"
              : state.isFocused
                ? "var(--hover)"
                : "var(--card)",
            cursor: "pointer",
          }),
        }}
      />
      {error && <p className={fieldErrorClass}>{error}</p>}
    </div>
  );
}

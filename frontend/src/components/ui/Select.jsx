export default function Select({
  label,
  value,
  onChange,
  options = [],
  className = "",
  placeholder,
  disabled = false,
}) {
  return (
    <label className={`block ${className}`}>
      {label && <div className="mb-1 text-sm text-[var(--text)]">{label}</div>}

      <select
        value={value ?? ""}
        disabled={disabled}
        onChange={(e) => onChange?.(e.target.value)}
        className="
          w-full
          rounded-lg
          border
          px-3
          py-2
          text-sm
          outline-none
          transition-colors
          bg-[var(--bg)]
          text-[var(--text)]
          border-[var(--border)]
          focus:ring-2
          focus:ring-[var(--primary)]
          disabled:opacity-50
          disabled:cursor-not-allowed
        "
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
    </label>
  );
}

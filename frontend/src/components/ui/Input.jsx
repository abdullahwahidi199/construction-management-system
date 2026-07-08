export default function Input({
  label,
  placeholder,
  value,
  onChange,
  type = "text",
  error,
  name,
  className = "",
}) {
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

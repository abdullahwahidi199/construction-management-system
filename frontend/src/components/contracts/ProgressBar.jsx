// src/components/contracts/ProgressBar.jsx
export default function ProgressBar({
  value = 0,
  size = "md",
  showLabel = true,
}) {
  const clamped = Math.min(100, Math.max(0, Number(value) || 0));

  const sizeClasses = {
    sm: "h-1.5",
    md: "h-3",
    lg: "h-5",
  };

  let barColor = "bg-[var(--primary)]";
  if (clamped >= 100) barColor = "bg-[var(--success)]";
  else if (clamped >= 70) barColor = "bg-[var(--primary)]";
  else if (clamped >= 40) barColor = "bg-yellow-500";
  else barColor = "bg-[var(--danger)]";

  return (
    <div className="w-full flex items-center gap-3">
      <div
        className={`w-full rounded-full bg-[var(--border)] overflow-hidden ${sizeClasses[size]}`}
      >
        <div
          className={`${barColor} h-full rounded-full transition-all duration-500 ease-out`}
          style={{ width: `${clamped}%` }}
        />
      </div>
      {showLabel && (
        <span className="text-sm font-medium text-[var(--text)] min-w-[40px] text-right">
          {clamped}%
        </span>
      )}
    </div>
  );
}

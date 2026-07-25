export default function Card({
  title,
  right,
  children,
  className = "",
  contentClassName = "p-4 sm:p-5",
}) {
  return (
    <div
      className={`overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--card)] shadow-sm shadow-black/5 ${className}`}
    >
      {(title || right) && (
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--border)] px-4 py-3 sm:px-5">
          <div className="min-w-0 break-words font-semibold text-[var(--text)]">
            {title}
          </div>
          {right && <div className="shrink-0">{right}</div>}
        </div>
      )}
      <div className={contentClassName}>{children}</div>
    </div>
  );
}

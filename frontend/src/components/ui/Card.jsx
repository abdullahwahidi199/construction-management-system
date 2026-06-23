export default function Card({ title, right, children, className = "" }) {
  return (
    <div className={`rounded-xl border border-border bg-card ${className}`}>
      {(title || right) && (
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <div className="font-semibold">{title}</div>
          <div>{right}</div>
        </div>
      )}
      <div className="p-4">{children}</div>
    </div>
  );
}

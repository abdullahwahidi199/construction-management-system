export default function Header({ title, subtitle, children }) {
  return (
    <div className="mb-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold" style={{ color: "var(--text)" }}>
            {title}
          </h1>
          {subtitle && (
            <p className="mt-2 text-sm" style={{ color: "var(--muted)" }}>
              {subtitle}
            </p>
          )}
        </div>
        {children && <div className="flex gap-3">{children}</div>}
      </div>
    </div>
  );
}

export default function Header({ title, subtitle, children }) {
  return (
    <div className="mb-6 sm:mb-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <h1
            className="break-words text-2xl font-bold leading-tight sm:text-3xl"
            style={{ color: "var(--text)" }}
          >
            {title}
          </h1>
          {subtitle && (
            <p className="mt-2 break-words text-sm leading-6" style={{ color: "var(--muted)" }}>
              {subtitle}
            </p>
          )}
        </div>
        {children && (
          <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center sm:justify-end sm:gap-3">
            {children}
          </div>
        )}
      </div>
    </div>
  );
}

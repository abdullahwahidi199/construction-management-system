function cx(...classes) {
  return classes.filter(Boolean).join(" ");
}

const emptyRender = (value) =>
  value === null || value === undefined || value === "" ? "-" : value;

function MobileField({ label, children, align = "start" }) {
  return (
    <div className={cx("min-w-0", align === "end" && "text-end")}>
      <dt className="text-[11px] font-semibold uppercase tracking-wide text-[var(--muted)]">
        {label}
      </dt>
      <dd className="mt-1 break-words text-sm font-medium text-[var(--text)]">
        {children}
      </dd>
    </div>
  );
}

export default function ResponsiveTable({
  columns = [],
  rows = [],
  getRowKey,
  empty,
  loading,
  loadingLabel = "Loading...",
  cardTitle,
  cardSubtitle,
  cardBadge,
  cardActions,
  onRowClick,
  className = "",
  desktopClassName = "",
  mobileClassName = "",
  tableClassName = "",
  minWidth = "",
}) {
  const visibleColumns = columns.filter((column) => !column.hidden);
  const mobileColumns = visibleColumns.filter((column) => column.mobile !== false);

  if (loading) {
    return (
      <div
        className={cx(
          "rounded-xl border border-[var(--border)] bg-[var(--card)] px-4 py-12 text-center text-sm text-[var(--muted)]",
          className,
        )}
      >
        {loadingLabel}
      </div>
    );
  }

  if (!rows.length) {
    return empty || null;
  }

  return (
    <div className={cx("overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--card)]", className)}>
      <div className={cx("hidden overflow-x-auto md:block mobile-scrollbar", desktopClassName)}>
        <table className={cx("w-full text-sm", tableClassName)} style={minWidth ? { minWidth } : undefined}>
          <thead>
            <tr className="border-b border-[var(--border)] bg-[var(--bg)]/50">
              {visibleColumns.map((column) => (
                <th
                  key={column.key}
                  className={cx(
                    "px-4 py-3 text-xs font-semibold uppercase tracking-wide text-[var(--muted)]",
                    column.align === "end"
                      ? "text-end"
                      : column.align === "center"
                        ? "text-center"
                        : "text-start",
                    column.headerClassName,
                  )}
                >
                  {column.header ?? column.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--border)]">
            {rows.map((row, index) => {
              const rowKey = getRowKey?.(row, index) ?? row.id ?? index;
              return (
                <tr
                  key={rowKey}
                  onClick={onRowClick ? () => onRowClick(row) : undefined}
                  className={cx(
                    "transition-colors hover:bg-[var(--hover)]",
                    onRowClick && "cursor-pointer",
                  )}
                >
                  {visibleColumns.map((column) => {
                    const content =
                      column.render?.(row, index) ?? emptyRender(row[column.key]);
                    return (
                      <td
                        key={column.key}
                        className={cx(
                          "px-4 py-3 align-top text-[var(--text)]",
                          column.align === "end"
                            ? "text-end"
                            : column.align === "center"
                              ? "text-center"
                              : "text-start",
                          column.cellClassName,
                        )}
                      >
                        {content}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className={cx("divide-y divide-[var(--border)] md:hidden", mobileClassName)}>
        {rows.map((row, index) => {
          const rowKey = getRowKey?.(row, index) ?? row.id ?? index;
          return (
            <article
              key={rowKey}
              onClick={onRowClick ? () => onRowClick(row) : undefined}
              className={cx(
                "grid gap-4 p-4 transition-colors active:bg-[var(--hover)]",
                onRowClick && "cursor-pointer",
              )}
            >
              <div className="flex min-w-0 items-start justify-between gap-3">
                <div className="min-w-0">
                  {cardTitle ? (
                    <h3 className="break-words text-base font-semibold leading-6 text-[var(--text)]">
                      {cardTitle(row, index)}
                    </h3>
                  ) : null}
                  {cardSubtitle ? (
                    <p className="mt-1 break-words text-sm text-[var(--muted)]">
                      {cardSubtitle(row, index)}
                    </p>
                  ) : null}
                </div>
                {cardBadge ? <div className="shrink-0">{cardBadge(row, index)}</div> : null}
              </div>

              {mobileColumns.length ? (
                <dl className="grid grid-cols-1 gap-3 min-[380px]:grid-cols-2">
                  {mobileColumns.map((column) => (
                    <MobileField
                      key={column.key}
                      label={column.mobileLabel || column.label || column.header}
                      align={column.align}
                    >
                      {column.mobileRender?.(row, index) ??
                        column.render?.(row, index) ??
                        emptyRender(row[column.key])}
                    </MobileField>
                  ))}
                </dl>
              ) : null}

              {cardActions ? (
                <div
                  className="flex flex-wrap items-center justify-end gap-2 border-t border-[var(--border)] pt-3"
                  onClick={(event) => event.stopPropagation()}
                >
                  {cardActions(row, index)}
                </div>
              ) : null}
            </article>
          );
        })}
      </div>
    </div>
  );
}


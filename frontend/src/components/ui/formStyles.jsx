export function RequiredMark() {
  return (
    <span className="text-[var(--danger)]" aria-hidden="true">
      *
    </span>
  );
}

export const fieldLabelClass =
  "mb-1.5 block text-sm font-medium text-[var(--text)]";

export const fieldControlClass =
  "w-full rounded-lg border border-[var(--border)] bg-[var(--bg)] px-4 py-2.5 text-sm text-[var(--text)] placeholder:text-[var(--muted)] transition-colors duration-200 focus:outline-none focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary)]/20 disabled:cursor-not-allowed disabled:opacity-50";

export const fieldControlErrorClass =
  "border-[var(--danger)] focus:border-[var(--danger)] focus:ring-[var(--danger)]/20";

export const fieldErrorClass = "mt-1 text-xs text-[var(--danger)]";

export const textareaControlClass = `${fieldControlClass} resize-none`;

export const pdfButtonClass =
  "inline-flex items-center justify-center gap-2 rounded-lg border border-[var(--border)] bg-[var(--card)] px-4 py-2 text-sm font-medium text-[var(--text)] shadow-sm transition-colors hover:bg-[var(--hover)] disabled:cursor-not-allowed disabled:opacity-50";

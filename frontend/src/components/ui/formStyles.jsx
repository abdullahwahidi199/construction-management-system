export function RequiredMark() {
  return (
    <span className="text-[var(--danger)]" aria-hidden="true">
      *
    </span>
  );
}

export const fieldLabelClass =
  "mb-1.5 block break-words text-sm font-medium leading-5 text-[var(--text)]";

export const fieldControlClass =
  "min-h-12 w-full rounded-lg border border-[var(--border)] bg-[var(--bg)] px-4 py-3 text-base text-[var(--text)] placeholder:text-[var(--muted)] transition-colors duration-200 focus:border-[var(--primary)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/20 disabled:cursor-not-allowed disabled:opacity-50 sm:min-h-0 sm:py-2.5 sm:text-sm";

export const fieldControlErrorClass =
  "border-[var(--danger)] focus:border-[var(--danger)] focus:ring-[var(--danger)]/20";

export const fieldErrorClass = "mt-1.5 break-words text-xs leading-5 text-[var(--danger)]";

export const textareaControlClass = `${fieldControlClass} min-h-28 resize-y`;

export const pdfButtonClass =
  "inline-flex min-h-12 items-center justify-center gap-2 rounded-lg border border-[var(--border)] bg-[var(--card)] px-4 py-2 text-sm font-medium text-[var(--text)] shadow-sm transition-colors hover:bg-[var(--hover)] disabled:cursor-not-allowed disabled:opacity-50 sm:min-h-0";

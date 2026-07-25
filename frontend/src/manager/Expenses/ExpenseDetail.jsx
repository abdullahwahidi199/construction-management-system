import {
  X,
  Calendar,
  DollarSign,
  User,
  FileText,
  RefreshCw,
} from "lucide-react";
import { useLanguage } from "../../hooks/useLanguage";
import { useCalendar } from "../../hooks/useCalendar";

const RTL_LANGS = ["dr", "ps", "fa", "dar", "prs"];

const approvalStyles = {
  pending: "bg-amber-500/10 text-amber-700 dark:text-amber-300",
  approved: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
  rejected: "bg-red-500/10 text-red-700 dark:text-red-300",
};

export default function ExpenseDetail({ expense, isOpen, onClose, onEdit }) {
  const { t, lang } = useLanguage();
  const { formatDate, formatDateTime } = useCalendar("expenses");
  const isRTL = RTL_LANGS.includes(lang);

  if (!isOpen || !expense) return null;

  const displayDate = (dateString, fallback) => {
    return formatDate(dateString) || fallback || "-";
  };

  const displayDateTime = (dateString, fallback) => {
    return formatDateTime(dateString) || fallback || "-";
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 z-40 transition-opacity"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="mobile-modal-surface fixed inset-0 z-50 flex">
        <div
          dir={isRTL ? "rtl" : "ltr"}
          className="mobile-modal-panel relative w-full max-w-2xl overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--card)] shadow-2xl"
        >
          {/* Header */}
          <div className="mobile-modal-header sticky top-0 z-10 flex items-center justify-between gap-3 border-b border-[var(--border)] bg-[var(--bg)]/80 backdrop-blur-sm px-6 py-4">
            <div className="min-w-0">
              <h2 className="text-xl font-semibold text-[var(--text)]">
                {t("ExpenseDetail.title")}
              </h2>
              <p className="mt-0.5 break-words text-sm text-[var(--muted)]">
                #{expense.serial_number} • {expense.project_name}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => onEdit?.(expense)}
                className="hidden items-center gap-2 rounded-lg bg-[var(--primary)] px-4 py-2 text-sm font-medium text-white hover:bg-[var(--primary)]/90 transition-colors sm:inline-flex"
              >
                <FileText className="h-4 w-4" />
                {t("ExpenseDetail.edit")}
              </button>
              <button
                onClick={onClose}
                className="inline-flex h-11 w-11 items-center justify-center rounded-lg text-[var(--muted)] hover:bg-[var(--hover)] hover:text-[var(--text)] transition-colors sm:h-10 sm:w-10"
                aria-label="Close"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="mobile-modal-content p-6 space-y-6">
            {/* Status & Type Badge */}
            <div className="flex items-center gap-3">
              <span className="inline-flex items-center gap-1.5 rounded-lg bg-blue-500/10 px-3 py-1.5 text-sm font-medium text-blue-600">
                {expense.expense_type || t("ExpenseDetail.general")}
              </span>
              <span
                className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium capitalize ${
                  approvalStyles[expense.approval_status] ||
                  approvalStyles.approved
                }`}
              >
                {expense.approval_status || "approved"}
              </span>
            </div>

            {/* Description */}
            <div className="rounded-xl bg-[var(--bg)] p-4">
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[var(--primary)]/10">
                  <FileText className="h-5 w-5 text-[var(--primary)]" />
                </div>
                <div>
                  <p className="text-sm font-medium text-[var(--muted)] mb-1">
                    {t("ExpenseDetail.description")}
                  </p>
                  <p className="text-[var(--text)] leading-relaxed">
                    {expense.description || t("ExpenseDetail.noDescription")}
                  </p>
                </div>
              </div>
            </div>

            {/* Financial Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="rounded-xl border border-[var(--border)] p-4">
                <p className="text-sm font-medium text-[var(--muted)] mb-3">
                  {t("ExpenseDetail.amountUsd")}
                </p>
                <p className="text-2xl font-bold text-[var(--text)]">
                  ${parseFloat(expense.amount_usd || 0).toLocaleString()}
                </p>
                <div className="mt-2 flex items-center gap-2 text-sm text-[var(--muted)]">
                  <DollarSign className="h-4 w-4" />
                  <span>
                    {t("ExpenseDetail.exchangeRate")}: {expense.exchange_rate}
                  </span>
                </div>
              </div>

              <div className="rounded-xl border border-[var(--border)] p-4">
                <p className="text-sm font-medium text-[var(--muted)] mb-3">
                  {t("ExpenseDetail.amountAfn")}
                </p>
                <p className="text-2xl font-bold text-[var(--text)]">
                  ؋{parseFloat(expense.amount_afn || 0).toLocaleString()}
                </p>
              </div>
            </div>

            {/* Totals */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="rounded-xl bg-[var(--primary)]/5 border border-[var(--primary)]/20 p-4">
                <p className="text-sm font-medium text-[var(--primary)] mb-1">
                  {t("ExpenseDetail.totalUsd")}
                </p>
                <p className="text-xl font-bold text-[var(--primary)]">
                  ${parseFloat(expense.total_usd || 0).toLocaleString()}
                </p>
              </div>

              <div className="rounded-xl bg-emerald-500/5 border border-emerald-500/20 p-4">
                <p className="text-sm font-medium text-emerald-600 mb-1">
                  {t("ExpenseDetail.totalAfn")}
                </p>
                <p className="text-xl font-bold text-emerald-600">
                  ؋{parseFloat(expense.total_afn || 0).toLocaleString()}
                </p>
              </div>
            </div>

            {/* Dates & Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-3">
                <div className="flex items-center gap-3 text-sm">
                  <Calendar className="h-4 w-4 text-[var(--muted)]" />
                  <div>
                    <p className="text-[var(--muted)]">
                      {t("ExpenseDetail.expenseDate")}
                    </p>
                    <p className="text-[var(--text)] font-medium">
                      {displayDate(
                        expense.expense_date,
                        expense.formatted_expense_date,
                      )}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 text-sm">
                  <Calendar className="h-4 w-4 text-[var(--muted)]" />
                  <div>
                    <p className="text-[var(--muted)]">
                      {t("ExpenseDetail.created")}
                    </p>
                    <p className="text-[var(--text)] font-medium">
                      {displayDateTime(
                        expense.created_at,
                        expense.formatted_created_at,
                      )}
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center gap-3 text-sm">
                  <User className="h-4 w-4 text-[var(--muted)]" />
                  <div>
                    <p className="text-[var(--muted)]">
                      {t("ExpenseDetail.paidTo")}
                    </p>
                    <p className="text-[var(--text)] font-medium">
                      {expense.paid_to || t("ExpenseDetail.notAvailable")}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 text-sm">
                  <RefreshCw className="h-4 w-4 text-[var(--muted)]" />
                  <div>
                    <p className="text-[var(--muted)]">
                      {t("ExpenseDetail.updated")}
                    </p>
                    <p className="text-[var(--text)] font-medium">
                      {displayDateTime(
                        expense.updated_at,
                        expense.formatted_updated_at,
                      )}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Remarks */}
            {expense.remarks && (
              <div className="rounded-xl bg-yellow-500/5 border border-yellow-500/20 p-4">
                <div className="flex items-start gap-3">
                  <FileText className="h-5 w-5 text-yellow-600 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-yellow-600 mb-1">
                      {t("ExpenseDetail.remarks")}
                    </p>
                    <p className="text-sm text-[var(--text)]">
                      {expense.remarks}
                    </p>
                  </div>
                </div>
              </div>
            )}

            <div className="rounded-xl border border-[var(--border)] p-4">
              <p className="mb-3 text-sm font-medium text-[var(--muted)]">
                Approval History
              </p>
              <div className="space-y-3">
                {(expense.approval_history || []).map((entry, index) => (
                  <div key={`${entry.status}-${index}`} className="border-l-2 border-[var(--border)] pl-3">
                    <p className="text-sm font-semibold capitalize text-[var(--text)]">
                      {entry.status}
                    </p>
                    <p className="text-xs text-[var(--muted)]">
                      {displayDateTime(entry.at)} · {entry.by || "-"}
                    </p>
                    {entry.notes && (
                      <p className="mt-1 text-sm text-[var(--text)]">
                        {entry.notes}
                      </p>
                    )}
                  </div>
                ))}
                {expense.approval_status === "rejected" && expense.approval_notes && (
                  <div className="rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-2 text-sm text-red-600">
                    {expense.approval_notes}
                  </div>
                )}
              </div>
            </div>
          </div>
          <div className="mobile-modal-footer flex items-center justify-end gap-3 border-t border-[var(--border)] px-6 py-4 sm:hidden">
            <button
              type="button"
              onClick={onClose}
              className="inline-flex min-h-12 items-center justify-center rounded-lg border border-[var(--border)] px-4 text-sm font-medium text-[var(--text)]"
            >
              Close
            </button>
            <button
              type="button"
              onClick={() => onEdit?.(expense)}
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-lg bg-[var(--primary)] px-4 text-sm font-medium text-white"
            >
              <FileText className="h-4 w-4" />
              {t("ExpenseDetail.edit")}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

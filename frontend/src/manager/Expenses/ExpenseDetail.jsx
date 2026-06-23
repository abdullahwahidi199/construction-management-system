import { useState, useEffect } from "react";
import {
  X,
  Calendar,
  DollarSign,
  User,
  FileText,
  RefreshCw,
  Copy,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

export default function ExpenseDetail({ expense, isOpen, onClose, onEdit }) {
  if (!isOpen || !expense) return null;

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const formatDateTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 z-40 transition-opacity"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl border border-[var(--border)] bg-[var(--card)] shadow-2xl">
          {/* Header */}
          <div className="sticky top-0 z-10 flex items-center justify-between border-b border-[var(--border)] bg-[var(--bg)]/80 backdrop-blur-sm px-6 py-4">
            <div>
              <h2 className="text-xl font-semibold text-[var(--text)]">
                Expense Details
              </h2>
              <p className="text-sm text-[var(--muted)] mt-0.5">
                #{expense.serial_number} • {expense.project_name}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => onEdit?.(expense)}
                className="inline-flex items-center gap-2 rounded-lg bg-[var(--primary)] px-4 py-2 text-sm font-medium text-white hover:bg-[var(--primary)]/90 transition-colors"
              >
                <FileText className="h-4 w-4" />
                Edit
              </button>
              <button
                onClick={onClose}
                className="inline-flex h-10 w-10 items-center justify-center rounded-lg text-[var(--muted)] hover:bg-[var(--hover)] hover:text-[var(--text)] transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="p-6 space-y-6">
            {/* Status & Type Badge */}
            <div className="flex items-center gap-3">
              <span className="inline-flex items-center gap-1.5 rounded-lg bg-blue-500/10 px-3 py-1.5 text-sm font-medium text-blue-600">
                {expense.expense_type || "General"}
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-500/10 px-3 py-1.5 text-sm font-medium text-emerald-600">
                Active
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
                    Description
                  </p>
                  <p className="text-[var(--text)] leading-relaxed">
                    {expense.description || "No description provided"}
                  </p>
                </div>
              </div>
            </div>

            {/* Financial Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="rounded-xl border border-[var(--border)] p-4">
                <p className="text-sm font-medium text-[var(--muted)] mb-3">
                  Amount in USD
                </p>
                <p className="text-2xl font-bold text-[var(--text)]">
                  ${parseFloat(expense.amount_usd || 0).toLocaleString()}
                </p>
                <div className="mt-2 flex items-center gap-2 text-sm text-[var(--muted)]">
                  <DollarSign className="h-4 w-4" />
                  <span>Exchange Rate: {expense.exchange_rate}</span>
                </div>
              </div>

              <div className="rounded-xl border border-[var(--border)] p-4">
                <p className="text-sm font-medium text-[var(--muted)] mb-3">
                  Amount in AFN
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
                  Total in USD
                </p>
                <p className="text-xl font-bold text-[var(--primary)]">
                  ${parseFloat(expense.total_usd || 0).toLocaleString()}
                </p>
              </div>

              <div className="rounded-xl bg-emerald-500/5 border border-emerald-500/20 p-4">
                <p className="text-sm font-medium text-emerald-600 mb-1">
                  Total in AFN
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
                    <p className="text-[var(--muted)]">Expense Date</p>
                    <p className="text-[var(--text)] font-medium">
                      {formatDate(expense.expense_date)}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 text-sm">
                  <Calendar className="h-4 w-4 text-[var(--muted)]" />
                  <div>
                    <p className="text-[var(--muted)]">Created</p>
                    <p className="text-[var(--text)] font-medium">
                      {formatDateTime(expense.created_at)}
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center gap-3 text-sm">
                  <User className="h-4 w-4 text-[var(--muted)]" />
                  <div>
                    <p className="text-[var(--muted)]">Paid To</p>
                    <p className="text-[var(--text)] font-medium">
                      {expense.paid_to || "N/A"}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 text-sm">
                  <RefreshCw className="h-4 w-4 text-[var(--muted)]" />
                  <div>
                    <p className="text-[var(--muted)]">Updated</p>
                    <p className="text-[var(--text)] font-medium">
                      {formatDateTime(expense.updated_at)}
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
                      Remarks
                    </p>
                    <p className="text-sm text-[var(--text)]">
                      {expense.remarks}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

// src/components/contracts/PaymentTable.jsx
import { Edit, Trash2, DollarSign } from "lucide-react";

const TYPE_LABELS = {
  advance: "Advance",
  progress: "Progress",
  retention_release: "Retention Release",
  final: "Final",
  other: "Other",
};

const TYPE_COLORS = {
  advance: "bg-blue-500/15 text-blue-500",
  progress: "bg-[var(--primary)]/15 text-[var(--primary)]",
  retention_release: "bg-amber-500/15 text-amber-500",
  final: "bg-[var(--success)]/15 text-[var(--success)]",
  other: "bg-[var(--muted)]/20 text-[var(--muted)]",
};

const formatter = new Intl.NumberFormat("en-US", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

export default function PaymentTable({
  payments = [],
  onEdit,
  onDelete,
  loading,
  currency,
}) {
  if (loading) {
    return (
      <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl p-12 text-center">
        <div className="animate-spin w-8 h-8 border-2 border-[var(--border)] border-t-[var(--primary)] rounded-full mx-auto" />
        <p className="text-[var(--muted)] mt-4">Loading payments...</p>
      </div>
    );
  }

  if (!payments.length) {
    return (
      <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl p-12 text-center">
        <DollarSign size={40} className="mx-auto text-[var(--muted)] mb-3" />
        <p className="text-[var(--muted)]">No payments recorded yet.</p>
      </div>
    );
  }

  return (
    <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl overflow-hidden">
      {/* Desktop */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[var(--border)]">
              <th className="text-left px-4 py-3 font-semibold text-[var(--muted)]">
                Date
              </th>
              <th className="text-left px-4 py-3 font-semibold text-[var(--muted)]">
                Type
              </th>
              <th className="text-right px-4 py-3 font-semibold text-[var(--muted)]">
                Amount
              </th>
              <th className="text-left px-4 py-3 font-semibold text-[var(--muted)]">
                Reference
              </th>
              <th className="text-left px-4 py-3 font-semibold text-[var(--muted)]">
                Notes
              </th>
              <th className="text-right px-4 py-3 font-semibold text-[var(--muted)]">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {payments.map((payment) => (
              <tr
                key={payment.id}
                className="border-b border-[var(--border)] last:border-0 hover:bg-[var(--hover)] transition-colors"
              >
                <td className="px-4 py-3 text-[var(--text)]">
                  {payment.payment_date}
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium ${
                      TYPE_COLORS[payment.payment_type] || TYPE_COLORS.other
                    }`}
                  >
                    {TYPE_LABELS[payment.payment_type] || payment.payment_type}
                  </span>
                </td>
                <td className="px-4 py-3 text-right font-semibold text-[var(--text)]">
                  {currency}
                  {formatter.format(payment.amount)}
                </td>
                <td className="px-4 py-3 text-[var(--muted)] font-mono text-xs">
                  {payment.reference_number || "—"}
                </td>
                <td className="px-4 py-3 text-[var(--muted)] max-w-[200px] truncate">
                  {payment.notes || "—"}
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-end gap-1">
                    <button
                      onClick={() => onEdit(payment)}
                      className="p-1.5 rounded-lg hover:bg-[var(--hover)] text-[var(--muted)] hover:text-[var(--primary)] transition-colors"
                    >
                      <Edit size={16} />
                    </button>
                    <button
                      onClick={() => onDelete(payment)}
                      className="p-1.5 rounded-lg hover:bg-[var(--hover)] text-[var(--muted)] hover:text-[var(--danger)] transition-colors"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile */}
      <div className="md:hidden divide-y divide-[var(--border)]">
        {payments.map((payment) => (
          <div key={payment.id} className="p-4 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-[var(--muted)]">
                {payment.payment_date}
              </span>
              <span
                className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium ${
                  TYPE_COLORS[payment.payment_type] || TYPE_COLORS.other
                }`}
              >
                {TYPE_LABELS[payment.payment_type]}
              </span>
            </div>
            <p className="text-[var(--text)] font-semibold text-lg">
              ${formatter.format(payment.amount)}
            </p>
            {payment.reference_number && (
              <p className="text-xs text-[var(--muted)] font-mono">
                Ref: {payment.reference_number}
              </p>
            )}
            <div className="flex items-center justify-end gap-2">
              <button
                onClick={() => onEdit(payment)}
                className="p-2 rounded-lg hover:bg-[var(--hover)] text-[var(--muted)] hover:text-[var(--primary)]"
              >
                <Edit size={16} />
              </button>
              <button
                onClick={() => onDelete(payment)}
                className="p-2 rounded-lg hover:bg-[var(--hover)] text-[var(--muted)] hover:text-[var(--danger)]"
              >
                <Trash2 size={16} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

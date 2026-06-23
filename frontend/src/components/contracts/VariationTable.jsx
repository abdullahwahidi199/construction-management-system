// src/components/contracts/VariationTable.jsx
import { Edit, Trash2, CheckCircle, XCircle, GitBranch } from "lucide-react";

const formatter = new Intl.NumberFormat("en-US", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

export default function VariationTable({
  variations = [],
  onEdit,
  onDelete,
  onApprove,
  loading,
  currency,
}) {
  if (loading) {
    return (
      <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl p-12 text-center">
        <div className="animate-spin w-8 h-8 border-2 border-[var(--border)] border-t-[var(--primary)] rounded-full mx-auto" />
        <p className="text-[var(--muted)] mt-4">Loading variations...</p>
      </div>
    );
  }

  if (!variations.length) {
    return (
      <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl p-12 text-center">
        <GitBranch size={40} className="mx-auto text-[var(--muted)] mb-3" />
        <p className="text-[var(--muted)]">No variations recorded yet.</p>
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
                Variation #
              </th>
              <th className="text-left px-4 py-3 font-semibold text-[var(--muted)]">
                Date
              </th>
              <th className="text-left px-4 py-3 font-semibold text-[var(--muted)]">
                Description
              </th>
              <th className="text-right px-4 py-3 font-semibold text-[var(--muted)]">
                Amount Change
              </th>
              <th className="text-center px-4 py-3 font-semibold text-[var(--muted)]">
                Days
              </th>
              <th className="text-center px-4 py-3 font-semibold text-[var(--muted)]">
                Status
              </th>
              <th className="text-right px-4 py-3 font-semibold text-[var(--muted)]">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {variations.map((v) => (
              <tr
                key={v.id}
                className="border-b border-[var(--border)] last:border-0 hover:bg-[var(--hover)] transition-colors"
              >
                <td className="px-4 py-3 font-mono text-xs text-[var(--text)]">
                  {v.variation_number}
                </td>
                <td className="px-4 py-3 text-[var(--text)]">{v.date}</td>
                <td className="px-4 py-3 text-[var(--text)] max-w-[250px] truncate">
                  {v.description}
                </td>
                <td
                  className={`px-4 py-3 text-right font-semibold ${
                    v.amount_change >= 0
                      ? "text-[var(--success)]"
                      : "text-[var(--danger)]"
                  }`}
                >
                  {v.amount_change >= 0 ? "+" : ""}
                  {formatter.format(v.amount_change)} {currency}
                </td>
                <td
                  className={`px-4 py-3 text-center ${
                    v.days_added >= 0
                      ? "text-[var(--text)]"
                      : "text-[var(--danger)]"
                  }`}
                >
                  {v.days_added >= 0 ? "+" : ""}
                  {v.days_added}d
                </td>
                <td className="px-4 py-3 text-center">
                  {v.approved ? (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-[var(--success)]/15 text-[var(--success)]">
                      <CheckCircle size={12} /> Approved
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-500/15 text-amber-500">
                      <XCircle size={12} /> Pending
                    </span>
                  )}
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-end gap-1">
                    {!v.approved && onApprove && (
                      <button
                        onClick={() => onApprove(v)}
                        className="p-1.5 rounded-lg hover:bg-[var(--hover)] text-[var(--muted)] hover:text-[var(--success)] transition-colors"
                        title="Approve"
                      >
                        <CheckCircle size={16} />
                      </button>
                    )}
                    <button
                      onClick={() => onEdit(v)}
                      className="p-1.5 rounded-lg hover:bg-[var(--hover)] text-[var(--muted)] hover:text-[var(--primary)] transition-colors"
                    >
                      <Edit size={16} />
                    </button>
                    <button
                      onClick={() => onDelete(v)}
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
        {variations.map((v) => (
          <div key={v.id} className="p-4 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-mono text-xs text-[var(--muted)]">
                {v.variation_number}
              </span>
              {v.approved ? (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-[var(--success)]/15 text-[var(--success)]">
                  <CheckCircle size={12} /> Approved
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-500/15 text-amber-500">
                  <XCircle size={12} /> Pending
                </span>
              )}
            </div>
            <p className="text-sm text-[var(--text)]">{v.description}</p>
            <div className="flex items-center justify-between">
              <span
                className={`font-semibold ${
                  v.amount_change >= 0
                    ? "text-[var(--success)]"
                    : "text-[var(--danger)]"
                }`}
              >
                {v.amount_change >= 0 ? "+" : ""}$
                {formatter.format(v.amount_change)}
              </span>
              <span className="text-sm text-[var(--muted)]">
                {v.days_added >= 0 ? "+" : ""}
                {v.days_added} days
              </span>
            </div>
            <div className="flex items-center justify-end gap-2">
              {!v.approved && onApprove && (
                <button
                  onClick={() => onApprove(v)}
                  className="p-2 rounded-lg hover:bg-[var(--hover)] text-[var(--muted)] hover:text-[var(--success)]"
                >
                  <CheckCircle size={16} />
                </button>
              )}
              <button
                onClick={() => onEdit(v)}
                className="p-2 rounded-lg hover:bg-[var(--hover)] text-[var(--muted)] hover:text-[var(--primary)]"
              >
                <Edit size={16} />
              </button>
              <button
                onClick={() => onDelete(v)}
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

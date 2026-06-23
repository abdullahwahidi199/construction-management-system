// src/components/contracts/ContractTable.jsx
import { Eye, Edit, Trash2 } from "lucide-react";
import Button from "../ui/Button";
import ContractStatusBadge from "./ContractStatusBadge";
import ProgressBar from "./ProgressBar";

const formatter = new Intl.NumberFormat("en-US", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

export default function ContractTable({
  contracts = [],
  onView,
  onEdit,
  onDelete,
  loading,
}) {
  if (loading) {
    return (
      <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl p-12 text-center">
        <div className="animate-spin w-8 h-8 border-2 border-[var(--border)] border-t-[var(--primary)] rounded-full mx-auto" />
        <p className="text-[var(--muted)] mt-4">Loading contracts...</p>
      </div>
    );
  }

  if (!contracts.length) {
    return (
      <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl p-12 text-center">
        <p className="text-[var(--muted)]">No contracts found.</p>
      </div>
    );
  }

  return (
    <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl overflow-hidden">
      {/* Desktop Table */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[var(--border)]">
              <th className="text-left px-4 py-3 font-semibold text-[var(--muted)]">
                Contract #
              </th>
              <th className="text-left px-4 py-3 font-semibold text-[var(--muted)]">
                Title
              </th>
              <th className="text-left px-4 py-3 font-semibold text-[var(--muted)]">
                Subcontractor
              </th>
              <th className="text-left px-4 py-3 font-semibold text-[var(--muted)]">
                Project
              </th>
              <th className="text-right px-4 py-3 font-semibold text-[var(--muted)]">
                Value
              </th>
              <th className="text-left px-4 py-3 font-semibold text-[var(--muted)]">
                Status
              </th>
              <th className="text-left px-4 py-3 font-semibold text-[var(--muted)]">
                Progress
              </th>
              <th className="text-right px-4 py-3 font-semibold text-[var(--muted)]">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {contracts.map((contract) => (
              <tr
                key={contract.id}
                className="border-b border-[var(--border)] last:border-0 hover:bg-[var(--hover)] transition-colors"
              >
                <td className="px-4 py-3 font-mono text-xs text-[var(--text)]">
                  {contract.contract_number}
                </td>
                <td className="px-4 py-3 text-[var(--text)] font-medium max-w-[200px] truncate">
                  {contract.title}
                </td>
                <td className="px-4 py-3 text-[var(--text)]">
                  {contract.subcontractor_name}
                </td>
                <td className="px-4 py-3 text-[var(--text)]">
                  {contract.project_name}
                </td>
                <td className="px-4 py-3 text-right text-[var(--text)] font-medium">
                  {formatter.format(contract.adjusted_contract_value)}
                  {contract.currency}
                </td>
                <td className="px-4 py-3">
                  <ContractStatusBadge status={contract.status} />
                </td>
                <td className="px-4 py-3 min-w-[140px]">
                  <ProgressBar
                    value={contract.completion_percentage}
                    size="sm"
                  />
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-end gap-1">
                    <button
                      onClick={() => onView(contract)}
                      className="p-1.5 rounded-lg hover:bg-[var(--hover)] text-[var(--muted)] hover:text-[var(--primary)] transition-colors"
                      title="View Details"
                    >
                      <Eye size={16} />
                    </button>
                    <button
                      onClick={() => onEdit(contract)}
                      className="p-1.5 rounded-lg hover:bg-[var(--hover)] text-[var(--muted)] hover:text-[var(--primary)] transition-colors"
                      title="Edit"
                    >
                      <Edit size={16} />
                    </button>
                    <button
                      onClick={() => onDelete(contract)}
                      className="p-1.5 rounded-lg hover:bg-[var(--hover)] text-[var(--muted)] hover:text-[var(--danger)] transition-colors"
                      title="Delete"
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

      {/* Mobile Cards */}
      <div className="md:hidden divide-y divide-[var(--border)]">
        {contracts.map((contract) => (
          <div key={contract.id} className="p-4 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-mono text-xs text-[var(--muted)]">
                {contract.contract_number}
              </span>
              <ContractStatusBadge status={contract.status} />
            </div>
            <p className="text-[var(--text)] font-medium">{contract.title}</p>
            <p className="text-sm text-[var(--muted)]">
              {contract.subcontractor_name} &middot; {contract.project_name}
            </p>
            <div className="flex items-center justify-between">
              <span className="text-[var(--text)] font-semibold">
                {formatter.format(contract.contract_value)}
                {contract.currency}
              </span>
              <span className="text-sm text-[var(--muted)]">
                {contract.completion_percentage}%
              </span>
            </div>
            <ProgressBar value={contract.completion_percentage} size="sm" />
            <div className="flex items-center justify-end gap-2 pt-1">
              <button
                onClick={() => onView(contract)}
                className="p-2 rounded-lg hover:bg-[var(--hover)] text-[var(--muted)] hover:text-[var(--primary)]"
              >
                <Eye size={16} />
              </button>
              <button
                onClick={() => onEdit(contract)}
                className="p-2 rounded-lg hover:bg-[var(--hover)] text-[var(--muted)] hover:text-[var(--primary)]"
              >
                <Edit size={16} />
              </button>
              <button
                onClick={() => onDelete(contract)}
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

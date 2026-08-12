import { Eye, Edit, Trash2 } from "lucide-react";
import Button from "../ui/Button";
import ContractStatusBadge from "./ContractStatusBadge";
import ProgressBar from "./ProgressBar";
import PermissionWrapper from "../../auth/PermissionWrapper";
import { useLanguage } from "../../hooks/useLanguage";

const formatter = new Intl.NumberFormat("en-US", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

function formatContractValue(value, currency) {
  if (value === null || value === undefined || value === "") return "-";
  return `${formatter.format(value)}${currency}`;
}

export default function ContractTable({
  contracts = [],
  onView,
  onEdit,
  onDelete,
  loading,
}) {
  const { t } = useLanguage();

  if (loading) {
    return (
      <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl p-12 text-center">
        <div className="animate-spin w-8 h-8 border-2 border-[var(--border)] border-t-[var(--primary)] rounded-full mx-auto" />
        <p className="text-[var(--muted)] mt-4">
          {t("ContractTable.states.loading")}
        </p>
      </div>
    );
  }

  if (!contracts.length) {
    return (
      <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl p-12 text-center">
        <p className="text-[var(--muted)]">{t("ContractTable.states.empty")}</p>
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
              <th className="text-start px-4 py-3 font-semibold text-[var(--muted)]">
                {t("ContractTable.columns.contract_number")}
              </th>
              <th className="text-start px-4 py-3 font-semibold text-[var(--muted)]">
                {t("ContractTable.columns.title")}
              </th>
              <th className="text-start px-4 py-3 font-semibold text-[var(--muted)]">
                {t("ContractTable.columns.subcontractor")}
              </th>
              <th className="text-start px-4 py-3 font-semibold text-[var(--muted)]">
                {t("ContractTable.columns.project")}
              </th>
              <th className="text-end px-4 py-3 font-semibold text-[var(--muted)]">
                {t("ContractTable.columns.value")}
              </th>
              <th className="text-start px-4 py-3 font-semibold text-[var(--muted)]">
                {t("ContractTable.columns.status")}
              </th>
              <th className="text-start px-4 py-3 font-semibold text-[var(--muted)]">
                {t("ContractTable.columns.progress")}
              </th>
              <th className="text-end px-4 py-3 font-semibold text-[var(--muted)]">
                {t("ContractTable.columns.actions")}
              </th>
            </tr>
          </thead>
          <tbody>
            {contracts.map((contract) => (
              <tr
                key={contract.id}
                className="border-b border-[var(--border)] last:border-0 hover:bg-[var(--hover)] transition-colors"
              >
                <td className="px-4 py-3 font-mono text-xs text-[var(--text)] text-start">
                  {contract.contract_number}
                </td>
                <td className="px-4 py-3 text-[var(--text)] font-medium max-w-[200px] truncate text-start">
                  {contract.title}
                </td>
                <td className="px-4 py-3 text-[var(--text)] text-start">
                  {contract.subcontractor_name}
                </td>
                <td className="px-4 py-3 text-[var(--text)] text-start">
                  {contract.project_name}
                </td>
                <td className="px-4 py-3 text-end text-[var(--text)] font-medium">
                  {formatContractValue(
                    contract.adjusted_contract_value,
                    contract.currency,
                  )}
                </td>
                <td className="px-4 py-3 text-start">
                  <ContractStatusBadge status={contract.status} />
                </td>
                <td className="px-4 py-3 min-w-[140px] text-start">
                  <ProgressBar
                    value={contract.completion_percentage}
                    size="sm"
                  />
                </td>
                <td className="px-4 py-3 text-end">
                  <div className="flex items-center justify-end gap-1">
                    <button
                      onClick={() => onView(contract)}
                      className="p-1.5 rounded-lg hover:bg-[var(--hover)] text-[var(--muted)] hover:text-[var(--primary)] transition-colors"
                      title={t("ContractTable.actions.view")}
                    >
                      <Eye size={16} />
                    </button>
                    <button
                      onClick={() => onEdit(contract)}
                      className="p-1.5 rounded-lg hover:bg-[var(--hover)] text-[var(--muted)] hover:text-[var(--primary)] transition-colors"
                      title={t("ContractTable.actions.edit")}
                    >
                      <Edit size={16} />
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
                {formatContractValue(contract.contract_value, contract.currency)}
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

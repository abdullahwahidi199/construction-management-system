import { Eye, Edit, Trash2, Building2 } from "lucide-react";
import Button from "../ui/Button";
import PermissionWrapper from "../../auth/PermissionWrapper";
import { useLanguage } from "../../hooks/useLanguage";

export default function SubcontractorTable({
  subcontractors = [],
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
          {t("SubcontractorTable.states.loading")}
        </p>
      </div>
    );
  }

  if (!subcontractors.length) {
    return (
      <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl p-12 text-center">
        <Building2 size={40} className="mx-auto text-[var(--muted)] mb-3" />
        <p className="text-[var(--muted)]">
          {t("SubcontractorTable.states.empty")}
        </p>
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
              <th className="text-start px-4 py-3 font-semibold text-[var(--muted)]">
                {t("SubcontractorTable.columns.name")}
              </th>
              <th className="text-start px-4 py-3 font-semibold text-[var(--muted)]">
                {t("SubcontractorTable.columns.contact")}
              </th>
              <th className="text-start px-4 py-3 font-semibold text-[var(--muted)]">
                {t("SubcontractorTable.columns.phone")}
              </th>
              <th className="text-start px-4 py-3 font-semibold text-[var(--muted)]">
                {t("SubcontractorTable.columns.specialization")}
              </th>
              <th className="text-center px-4 py-3 font-semibold text-[var(--muted)]">
                {t("SubcontractorTable.columns.contracts")}
              </th>
              <th className="text-center px-4 py-3 font-semibold text-[var(--muted)]">
                {t("SubcontractorTable.columns.status")}
              </th>
              <th className="text-end px-4 py-3 font-semibold text-[var(--muted)]">
                {t("SubcontractorTable.columns.actions")}
              </th>
            </tr>
          </thead>
          <tbody>
            {subcontractors.map((sub) => (
              <tr
                key={sub.id}
                className="border-b border-[var(--border)] last:border-0 hover:bg-[var(--hover)] transition-colors"
              >
                <td className="px-4 py-3 text-[var(--text)] font-medium text-start">
                  {sub.name}
                </td>
                <td className="px-4 py-3 text-[var(--text)] text-start">
                  {sub.contact_person || "—"}
                </td>
                <td className="px-4 py-3 text-[var(--text)] text-sm text-start">
                  {sub.phone || "—"}
                </td>
                <td className="px-4 py-3 text-start">
                  <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-[var(--primary)]/10 text-[var(--primary)]">
                    {t(
                      `SubcontractorTable.specializations.${sub.specialization}`,
                    ) || sub.specialization}
                  </span>
                </td>
                <td className="px-4 py-3 text-center text-[var(--text)]">
                  {sub.contract_count ?? 0}
                </td>
                <td className="px-4 py-3 text-center">
                  <span
                    className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${
                      sub.is_active
                        ? "bg-[var(--success)]/15 text-[var(--success)]"
                        : "bg-[var(--muted)]/20 text-[var(--muted)]"
                    }`}
                  >
                    {sub.is_active
                      ? t("SubcontractorTable.labels.active")
                      : t("SubcontractorTable.labels.inactive")}
                  </span>
                </td>
                <td className="px-4 py-3 text-end">
                  <div className="flex items-center justify-end gap-1">
                    <button
                      onClick={() => onView(sub)}
                      className="p-1.5 rounded-lg hover:bg-[var(--hover)] text-[var(--muted)] hover:text-[var(--primary)] transition-colors"
                      title={t("SubcontractorTable.actions.view")}
                    >
                      <Eye size={16} />
                    </button>
                    <button
                      onClick={() => onEdit(sub)}
                      className="p-1.5 rounded-lg hover:bg-[var(--hover)] text-[var(--muted)] hover:text-[var(--primary)] transition-colors"
                      title={t("SubcontractorTable.actions.edit")}
                    >
                      <Edit size={16} />
                    </button>
                    <PermissionWrapper permissions={["subcontractors.delete"]}>
                      <button
                        onClick={() => onDelete(sub)}
                        className="p-1.5 rounded-lg hover:bg-[var(--hover)] text-[var(--muted)] hover:text-[var(--danger)] transition-colors"
                        title={t("SubcontractorTable.actions.delete")}
                      >
                        <Trash2 size={16} />
                      </button>
                    </PermissionWrapper>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile */}
      <div className="md:hidden divide-y divide-[var(--border)]">
        {subcontractors.map((sub) => (
          <div key={sub.id} className="p-4 space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-[var(--text)] font-medium">{sub.name}</p>
              <span
                className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${
                  sub.is_active
                    ? "bg-[var(--success)]/15 text-[var(--success)]"
                    : "bg-[var(--muted)]/20 text-[var(--muted)]"
                }`}
              >
                {sub.is_active
                  ? t("SubcontractorTable.labels.active")
                  : t("SubcontractorTable.labels.inactive")}
              </span>
            </div>
            <p className="text-sm text-[var(--muted)]">
              {t(`SubcontractorTable.specializations.${sub.specialization}`) ||
                sub.specialization}
            </p>
            <p className="text-sm text-[var(--muted)]">
              {sub.contact_person} &middot; {sub.phone}
            </p>
            <div className="flex items-center justify-end gap-2 pt-1">
              <button
                onClick={() => onView(sub)}
                className="p-2 rounded-lg hover:bg-[var(--hover)] text-[var(--muted)] hover:text-[var(--primary)]"
              >
                <Eye size={16} />
              </button>
              <button
                onClick={() => onEdit(sub)}
                className="p-2 rounded-lg hover:bg-[var(--hover)] text-[var(--muted)] hover:text-[var(--primary)]"
              >
                <Edit size={16} />
              </button>
              <button
                onClick={() => onDelete(sub)}
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

// src/components/contracts/SubcontractorTable.jsx
import { Eye, Edit, Trash2, Building2 } from "lucide-react";
import Button from "../ui/Button";

const SPECIALIZATION_LABELS = {
  concrete: "Concrete Works",
  steel: "Steel Works",
  electrical: "Electrical Works",
  plumbing: "Plumbing Works",
  finishing: "Finishing Works",
  excavation: "Excavation Works",
  hvac: "HVAC",
  landscaping: "Landscaping",
  other: "Other",
};

export default function SubcontractorTable({
  subcontractors = [],
  onView,
  onEdit,
  onDelete,
  loading,
}) {
  if (loading) {
    return (
      <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl p-12 text-center">
        <div className="animate-spin w-8 h-8 border-2 border-[var(--border)] border-t-[var(--primary)] rounded-full mx-auto" />
        <p className="text-[var(--muted)] mt-4">Loading subcontractors...</p>
      </div>
    );
  }

  if (!subcontractors.length) {
    return (
      <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl p-12 text-center">
        <Building2 size={40} className="mx-auto text-[var(--muted)] mb-3" />
        <p className="text-[var(--muted)]">No subcontractors found.</p>
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
                Name
              </th>
              <th className="text-left px-4 py-3 font-semibold text-[var(--muted)]">
                Contact
              </th>
              <th className="text-left px-4 py-3 font-semibold text-[var(--muted)]">
                Phone
              </th>
              <th className="text-left px-4 py-3 font-semibold text-[var(--muted)]">
                Specialization
              </th>
              <th className="text-center px-4 py-3 font-semibold text-[var(--muted)]">
                Contracts
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
            {subcontractors.map((sub) => (
              <tr
                key={sub.id}
                className="border-b border-[var(--border)] last:border-0 hover:bg-[var(--hover)] transition-colors"
              >
                <td className="px-4 py-3 text-[var(--text)] font-medium">
                  {sub.name}
                </td>
                <td className="px-4 py-3 text-[var(--text)]">
                  {sub.contact_person || "—"}
                </td>
                <td className="px-4 py-3 text-[var(--text)] text-sm">
                  {sub.phone || "—"}
                </td>
                <td className="px-4 py-3">
                  <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-[var(--primary)]/10 text-[var(--primary)]">
                    {SPECIALIZATION_LABELS[sub.specialization] ||
                      sub.specialization}
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
                    {sub.is_active ? "Active" : "Inactive"}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-end gap-1">
                    <button
                      onClick={() => onView(sub)}
                      className="p-1.5 rounded-lg hover:bg-[var(--hover)] text-[var(--muted)] hover:text-[var(--primary)] transition-colors"
                      title="View Details"
                    >
                      <Eye size={16} />
                    </button>
                    <button
                      onClick={() => onEdit(sub)}
                      className="p-1.5 rounded-lg hover:bg-[var(--hover)] text-[var(--muted)] hover:text-[var(--primary)] transition-colors"
                      title="Edit"
                    >
                      <Edit size={16} />
                    </button>
                    <button
                      onClick={() => onDelete(sub)}
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
                {sub.is_active ? "Active" : "Inactive"}
              </span>
            </div>
            <p className="text-sm text-[var(--muted)]">
              {SPECIALIZATION_LABELS[sub.specialization] || sub.specialization}
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

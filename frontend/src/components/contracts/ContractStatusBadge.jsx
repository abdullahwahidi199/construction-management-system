// src/components/contracts/ContractStatusBadge.jsx
const STATUS_STYLES = {
  draft: "bg-[var(--muted)] text-[var(--text)]",
  active: "bg-[var(--primary)] text-white",
  completed: "bg-[var(--success)] text-white",
  terminated: "bg-[var(--danger)] text-white",
  cancelled: "bg-[var(--muted)] text-[var(--text)] opacity-60",
};

const STATUS_LABELS = {
  draft: "Draft",
  active: "Active",
  completed: "Completed",
  terminated: "Terminated",
  cancelled: "Cancelled",
};

export default function ContractStatusBadge({ status }) {
  const styles = STATUS_STYLES[status] || STATUS_STYLES.draft;
  const label = STATUS_LABELS[status] || status;

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold capitalize ${styles}`}
    >
      {label}
    </span>
  );
}

import Modal from "./Modal";

export default function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  loading = false,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  destructive = true,
}) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} size="sm">
      <p className="mb-6 break-words text-sm leading-6" style={{ color: "var(--muted)" }}>
        {message}
      </p>
      <div className="sticky bottom-0 -mx-4 -mb-4 flex flex-col gap-3 border-t border-[var(--border)] bg-[var(--card)] px-4 py-4 sm:static sm:m-0 sm:flex-row sm:justify-end sm:border-0 sm:bg-transparent sm:p-0">
        <button
          type="button"
          onClick={onClose}
          disabled={loading}
          className="min-h-12 rounded-lg px-4 py-2 text-sm font-medium transition-colors sm:min-h-0"
          style={{
            backgroundColor: "var(--hover)",
            color: "var(--text)",
          }}
        >
          {cancelLabel}
        </button>
        <button
          type="button"
          onClick={onConfirm}
          disabled={loading}
          className="min-h-12 rounded-lg px-4 py-2 text-sm font-medium text-white transition-colors disabled:opacity-50 sm:min-h-0"
          style={{ backgroundColor: destructive ? "var(--danger)" : "var(--primary)" }}
        >
          {loading ? "Processing..." : confirmLabel}
        </button>
      </div>
    </Modal>
  );
}

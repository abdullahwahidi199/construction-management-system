import React from "react";
import { Loader2 } from "lucide-react";
import Button from "./Button";

export default function DeleteConfirmModal({
  open,
  onClose,
  onConfirm,
  itemName = "this item",
  loading = false,
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity duration-300"
      ></div>

      {/* Modal Panel */}
      <div className="relative w-full max-w-sm bg-(--card) rounded-xl shadow-2xl p-6 border border-(--border) transform transition-all duration-300 scale-100 animate-in fade-in zoom-in-95">
        <h2 className="text-xl font-bold text-(--text) mb-2">
          Confirm Deletion
        </h2>

        <p className="text-sm text-(--muted) mb-6 leading-relaxed">
          Are you absolutely sure? This action cannot be undone. This will
          permanently delete{" "}
          <span className="font-semibold text-(--text)">{itemName}</span>.
        </p>

        <div className="flex justify-end gap-3 mt-4">
          <Button variant="ghost" onClick={onClose} disabled={loading}>
            Cancel
          </Button>

          <Button
            variant="danger"
            onClick={onConfirm}
            disabled={loading}
            className="min-w-80px"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Deleting...
              </>
            ) : (
              "Delete"
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}

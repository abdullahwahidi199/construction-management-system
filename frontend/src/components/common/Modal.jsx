import { useEffect } from "react";
import { X } from "lucide-react";

export default function Modal({
  isOpen,
  onClose,
  title,
  children,
  size = "md",
}) {
  useEffect(() => {
    document.body.style.overflow = isOpen ? "hidden" : "unset";

    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const sizeClasses = {
    sm: "max-w-md",
    md: "max-w-lg",
    lg: "max-w-2xl",
    xl: "max-w-4xl",
  };

  return (
    <div
      className="mobile-bottom-sheet fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby={title ? "modal-title" : undefined}
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div
        className={`mobile-bottom-sheet-panel relative flex w-full ${sizeClasses[size]} max-h-[92dvh] flex-col overflow-hidden rounded-xl border shadow-2xl animate-slide-up sm:max-h-[86vh]`}
        style={{
          backgroundColor: "var(--card)",
          borderColor: "var(--border)",
          color: "var(--text)",
        }}
      >
        {/* Header */}
        <div
          className="sticky top-0 z-10 flex items-center justify-between gap-3 border-b p-4 sm:p-6"
          style={{ borderColor: "var(--border)" }}
        >
          <h2
            id={title ? "modal-title" : undefined}
            className="min-w-0 break-words text-lg font-semibold sm:text-xl"
            style={{ color: "var(--text)" }}
          >
            {title}
          </h2>

          <button
            type="button"
            onClick={onClose}
            className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border transition-colors sm:h-10 sm:w-10"
            style={{
              color: "var(--text)",
              borderColor: "var(--border)",
              backgroundColor: "var(--card)",
            }}
          >
            <X size={22} strokeWidth={3.5} />
          </button>
        </div>

        {/* Body */}
        <div
          className="min-h-0 flex-1 overflow-y-auto p-4 sm:p-6 mobile-scrollbar"
          style={{ color: "var(--text)" }}
        >
          {children}
        </div>
      </div>
    </div>
  );
}

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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div
        className={`relative w-full ${sizeClasses[size]} rounded-xl border shadow-2xl animate-slide-up`}
        style={{
          backgroundColor: "var(--card)",
          borderColor: "var(--border)",
          color: "var(--text)",
        }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between p-6 border-b"
          style={{ borderColor: "var(--border)" }}
        >
          <h2
            className="text-xl font-semibold"
            style={{ color: "var(--text)" }}
          >
            {title}
          </h2>

          <button
            onClick={onClose}
            className="flex items-center justify-center w-10 h-10 rounded-lg border transition-colors"
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
          className="p-6 max-h-[70vh] overflow-y-auto"
          style={{ color: "var(--text)" }}
        >
          {children}
        </div>
      </div>
    </div>
  );
}

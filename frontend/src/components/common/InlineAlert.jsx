import { AlertCircle, CheckCircle2, Info, TriangleAlert } from "lucide-react";

const styles = {
  error: {
    icon: AlertCircle,
    className: "border-[var(--danger)]/20 bg-[var(--danger)]/10 text-[var(--danger)]",
  },
  warning: {
    icon: TriangleAlert,
    className: "border-amber-500/25 bg-amber-500/10 text-amber-700 dark:text-amber-300",
  },
  success: {
    icon: CheckCircle2,
    className: "border-[var(--success)]/20 bg-[var(--success)]/10 text-[var(--success)]",
  },
  info: {
    icon: Info,
    className: "border-[var(--primary)]/20 bg-[var(--primary)]/10 text-[var(--primary)]",
  },
};

export default function InlineAlert({
  type = "info",
  title,
  children,
  className = "",
}) {
  const config = styles[type] || styles.info;
  const Icon = config.icon;

  return (
    <div
      role={type === "error" ? "alert" : "status"}
      className={`rounded-lg border px-4 py-3 text-sm ${config.className} ${className}`}
    >
      <div className="flex items-start gap-3">
        <Icon className="mt-0.5 h-4 w-4 shrink-0" />
        <div className="min-w-0">
          {title && <p className="font-semibold">{title}</p>}
          <div className={`${title ? "mt-1 " : ""}leading-5`}>{children}</div>
        </div>
      </div>
    </div>
  );
}

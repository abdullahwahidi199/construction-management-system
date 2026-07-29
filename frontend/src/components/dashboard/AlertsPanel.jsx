// components/dashboard/AlertsPanel.jsx

import { useLanguage } from "../../hooks/useLanguage";
import Card from "../ui/Card";

const SEVERITY_CONFIG = {
  high: {
    bg: "bg-red-50 dark:bg-red-500/10",
    border: "border-red-200 dark:border-red-500/20",
    icon: "🔴",
    text: "text-[var(--danger)]",
  },
  medium: {
    bg: "bg-yellow-50 dark:bg-yellow-500/10",
    border: "border-yellow-200 dark:border-yellow-500/20",
    icon: "🟡",
    text: "text-[var(--warning)]",
  },
  low: {
    bg: "bg-blue-50 dark:bg-blue-500/10",
    border: "border-blue-200 dark:border-blue-500/20",
    icon: "🔵",
    text: "text-[var(--primary)]",
  },
};

const TYPE_ICONS = {
  project_overdue: "🏗️",
  over_budget: "💸",
  near_budget: "⚠️",
  contract_overdue: "📋",
  contract_ending_soon: "⏰",
  low_attendance: "👷",
};

export default function AlertsPanel({ alerts, compact = false }) {
  const { t } = useLanguage();
  if (!alerts || alerts.total_alerts === 0) {
    if (compact) return null;
    return (
      <Card title="Alerts & Notifications">
        <div className="flex flex-col items-center justify-center py-8 text-[var(--muted)]">
          <span className="text-4xl mb-2">✅</span>
          <p className="text-sm">{t("alerts.empty")}</p>
        </div>
      </Card>
    );
  }

  const displayAlerts = compact
    ? alerts.alerts.filter((a) => a.severity === "high").slice(0, 3)
    : alerts.alerts;

  if (compact) {
    return (
      <div className="rounded-xl border border-[var(--danger)]/30 bg-[var(--danger)]/5 p-4">
        <div className="flex items-center gap-2 mb-3">
          <span className="text-lg">🚨</span>
          <span className="text-sm font-semibold text-[var(--danger)]">
            {alerts.high_count}{" "}
            {alerts.high_count === 1
              ? t("alerts.criticalAlert")
              : t("alerts.criticalAlerts")}
          </span>
        </div>
        <div className="space-y-2">
          {displayAlerts.map((alert, i) => (
            <div key={i} className="flex items-start gap-2">
              <span className="text-sm mt-0.5">
                {TYPE_ICONS[alert.type] || "⚠️"}
              </span>
              <div>
                <p className="text-sm font-medium text-[var(--text)]">
                  {alert.title}
                </p>
                <p className="text-xs text-[var(--muted)]">{alert.message}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <Card
      title={t("alerts.title")}
      right={
        <div className="flex items-center gap-2">
          {alerts.high_count > 0 && (
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-[var(--danger)]/10 text-[var(--danger)]">
              {alerts.high_count} {t("alerts.high")}
            </span>
          )}
          {alerts.medium_count > 0 && (
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-[var(--warning)]/10 text-[var(--warning)]">
              {alerts.medium_count} {t("alerts.medium")}
            </span>
          )}
          {alerts.low_count > 0 && (
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-[var(--primary)]/10 text-[var(--primary)]">
              {alerts.low_count} {t("alerts.low")}
            </span>
          )}
        </div>
      }
    >
      <div className="space-y-3">
        {displayAlerts.map((alert, i) => {
          const config = SEVERITY_CONFIG[alert.severity] || SEVERITY_CONFIG.low;
          return (
            <div
              key={i}
              className={`rounded-lg border p-3 ${config.bg} ${config.border} transition-colors hover:opacity-90`}
            >
              <div className="flex items-start gap-3">
                <span className="text-lg mt-0.5">
                  {TYPE_ICONS[alert.type] || config.icon}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <p className={`text-sm font-semibold ${config.text}`}>
                      {alert.title}
                    </p>
                    <span
                      className={`shrink-0 inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium uppercase ${config.text}`}
                      style={{
                        backgroundColor: `${config.icon === "🔴" ? "var(--danger)" : config.icon === "🟡" ? "var(--warning)" : "var(--primary)"}10`,
                      }}
                    >
                      {alert.severity === "high"
                        ? t("alerts.high")
                        : alert.severity === "medium"
                          ? t("alerts.medium")
                          : t("alerts.low")}
                    </span>
                  </div>
                  <p className="text-xs text-[var(--muted)] mt-1">
                    {alert.message}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}

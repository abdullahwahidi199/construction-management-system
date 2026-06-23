// components/dashboard/KPICards.jsx

import { useLanguage } from "../../hooks/useLanguage";

const formatCurrency = (val, currency = "USD") => {
  if (val === null || val === undefined) return "$0";
  const num = parseFloat(val);
  if (num >= 1000000) return `${(num / 1000000).toFixed(2)}M`;
  if (num >= 1000) return `${(num / 1000).toFixed(2)}K`;
  return num.toLocaleString("en-US", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });
};

function KPICard({
  icon,
  label,
  value,
  sub,
  trend,
  trendValue,
  color = "primary",
}) {
  const colorMap = {
    primary: "var(--primary)",
    success: "var(--success)",
    warning: "var(--warning)",
    danger: "var(--danger)",
  };

  const bgColor = colorMap[color] || colorMap.primary;

  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-5 flex items-start gap-4 hover:shadow-md transition-shadow">
      <div
        className="w-12 h-12 rounded-lg flex items-center justify-center shrink-0"
        style={{ backgroundColor: `${bgColor}15` }}
      >
        <span className="text-2xl" style={{ color: bgColor }}>
          {icon}
        </span>
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm text-[var(--muted)] truncate">{label}</p>
        <p className="text-2xl font-bold text-[var(--text)] mt-0.5">{value}</p>
        <div className="flex items-center gap-2 mt-1">
          {trend && (
            <span
              className={`inline-flex items-center text-xs font-medium px-1.5 py-0.5 rounded ${
                trend === "up"
                  ? "bg-[var(--success)]/10 text-[var(--success)]"
                  : trend === "down"
                    ? "bg-[var(--danger)]/10 text-[var(--danger)]"
                    : "bg-[var(--muted)]/10 text-[var(--muted)]"
              }`}
            >
              {trend === "up" ? "↑" : trend === "down" ? "↓" : "→"} {trendValue}
            </span>
          )}
          {sub && (
            <span className="text-xs text-[var(--muted)] whitespace-pre-line">
              {sub}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

export default function KPICards({
  projects,
  financial,
  workforce,
  contracts,
  expenseMonth,
}) {
  const { t } = useLanguage();
  const cards = [
    {
      icon: "🏗️",
      label: t("kpi.totalProjects"),
      value: projects?.total_projects || 0,
      sub: `${projects?.status_breakdown?.ongoing || 0} ${t("kpi.ongoing")} · ${
        projects?.status_breakdown?.completed || 0
      } ${t("kpi.completed")}`,
      color: "primary",
    },
    {
      icon: "💰",
      label: t("kpi.totalOutflow"),
      value: `$${formatCurrency(financial?.grand_total_outflow?.usd)}`,
      sub: `USD: ${formatCurrency(financial?.grand_total_outflow?.usd)}
AFN: ${formatCurrency(financial?.grand_total_outflow?.afn)}`,
      color: "warning",
    },
    {
      icon: "📋",
      label: t("kpi.activeContracts"),
      value: contracts?.status_breakdown?.active || 0,
      sub: `USD: ${formatCurrency(
        financial?.contracts?.total_contract_value_usd,
      )}
AFN: ${formatCurrency(financial?.contracts?.total_contract_value_afn)}`,
      color: "primary",
    },
    {
      icon: "👷",
      label: t("kpi.activeEmployees"),
      value: workforce?.active_employees || 0,
      color: "success",
    },
    {
      icon: "📊",
      label: t("kpi.thisMonthExpenses"),
      value: `$${formatCurrency(expenseMonth?.current_month?.total_usd)}`,
      trend: expenseMonth?.trend,
      trendValue: `${Math.abs(expenseMonth?.change_percentage || 0)}%`,
      sub: `USD: ${formatCurrency(expenseMonth?.current_month?.total_usd)}
AFN: ${formatCurrency(expenseMonth?.current_month?.total_afn)}`,
      color:
        expenseMonth?.trend === "up"
          ? "danger"
          : expenseMonth?.trend === "down"
            ? "success"
            : "primary",
    },
    {
      icon: "🚨",
      label: t("kpi.overdueProjects"),
      value: projects?.overdue_projects_count || 0,
      sub:
        projects?.overdue_projects_count > 0
          ? t("kpi.needAttention")
          : t("kpi.allOnTrack"),
      color: projects?.overdue_projects_count > 0 ? "danger" : "success",
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
      {cards.map((card, i) => (
        <KPICard key={i} {...card} />
      ))}
    </div>
  );
}

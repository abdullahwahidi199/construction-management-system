// components/dashboard/BudgetComparison.jsx

import { useLanguage } from "../../hooks/useLanguage";
import Card from "../ui/Card";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
  Legend,
} from "recharts";

const formatCurrency = (val) => {
  if (!val) return "$0";
  const num = parseFloat(val);
  if (num >= 1000000) return `$${(num / 1000000).toFixed(1)}M`;
  if (num >= 1000) return `$${(num / 1000).toFixed(0)}K`;
  return `$${num.toFixed(0)}`;
};

export default function BudgetComparison({ data }) {
  const { t } = useLanguage();
  if (!data || data.length === 0) {
    return (
      <Card title={t("budgetComparison.emptyTitle")}>
        <div className="h-[300px] flex items-center justify-center text-[var(--muted)]">
          <div className="text-center">
            <p className="text-4xl mb-2">📊</p>
            <p>{t("budgetComparison.noData")}</p>
          </div>
        </div>
      </Card>
    );
  }

  const chartData = data.slice(0, 8).map((p) => ({
    name: p.name.length > 15 ? p.name.substring(0, 15) + "…" : p.name,
    fullName: p.name,
    budget: parseFloat(p.estimated_budget),
    spent: parseFloat(p.total_spent_usd),
    isOver: p.is_over_budget,
    utilization: p.budget_utilization_pct,
  }));

  const CustomTooltip = ({ active, payload }) => {
    if (!active || !payload?.length) return null;
    const d = payload[0]?.payload;
    return (
      <div className="rounded-lg border border-[var(--border)] bg-[var(--card)] p-3 shadow-lg">
        <p className="text-sm font-semibold text-[var(--text)] mb-2">
          {d.fullName}
        </p>
        <p className="text-xs text-[var(--muted)]">
          {t("budgetComparison.budget")}:
          <span className="font-medium text-[var(--text)]">
            {formatCurrency(d.budget)}
          </span>
        </p>
        <p className="text-xs text-[var(--muted)]">
          {t("budgetComparison.spent")}:
          <span
            className="font-medium"
            style={{ color: d.isOver ? "var(--danger)" : "var(--success)" }}
          >
            {formatCurrency(d.spent)}
          </span>
        </p>
        <p className="text-xs text-[var(--muted)]">
          {t("budgetComparison.utilization")}:
          <span
            className="font-medium"
            style={{
              color:
                d.utilization > 90
                  ? "var(--danger)"
                  : d.utilization > 70
                    ? "var(--warning)"
                    : "var(--success)",
            }}
          >
            {d.utilization}%
          </span>
        </p>
      </div>
    );
  };

  return (
    <Card
      title={t("budgetComparison.title")}
      right={
        <span className="text-xs text-[var(--muted)]">
          {data.filter((p) => p.is_over_budget).length} over budget
        </span>
      }
    >
      <ResponsiveContainer width="100%" height={300}>
        <BarChart
          data={chartData}
          margin={{ top: 5, right: 10, left: 10, bottom: 5 }}
        >
          <XAxis
            dataKey="name"
            tick={{ fill: "var(--muted)", fontSize: 11 }}
            axisLine={{ stroke: "var(--border)" }}
            tickLine={false}
          />
          <YAxis
            tickFormatter={formatCurrency}
            tick={{ fill: "var(--muted)", fontSize: 11 }}
            axisLine={{ stroke: "var(--border)" }}
            tickLine={false}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend
            formatter={(value) => (
              <span style={{ color: "var(--text)", fontSize: "12px" }}>
                {value}
              </span>
            )}
          />
          <Bar
            dataKey="budget"
            name={t("budgetComparison.budget")}
            radius={[4, 4, 0, 0]}
            fill="var(--primary)"
            opacity={0.3}
          />
          <Bar
            dataKey="spent"
            name={t("budgetComparison.spent")}
            radius={[4, 4, 0, 0]}
          >
            {chartData.map((entry, i) => (
              <Cell
                key={i}
                fill={
                  entry.isOver
                    ? "var(--danger)"
                    : entry.utilization > 70
                      ? "var(--warning)"
                      : "var(--success)"
                }
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>

      {/* Over-budget projects list */}
      {data.filter((p) => p.is_over_budget).length > 0 && (
        <div className="mt-4 pt-4 border-t border-[var(--border)]">
          <p className="text-xs font-semibold text-[var(--danger)] mb-2">
            {t("budgetComparison.overBudget")}
          </p>
          <div className="space-y-1.5">
            {data
              .filter((p) => p.is_over_budget)
              .map((p) => (
                <div key={p.id} className="flex justify-between text-xs">
                  <span className="text-[var(--text)]">{p.name}</span>
                  <span className="text-[var(--danger)] font-medium">
                    {p.budget_utilization_pct}% {t("budgetComparison.used")}
                  </span>
                </div>
              ))}
          </div>
        </div>
      )}
    </Card>
  );
}

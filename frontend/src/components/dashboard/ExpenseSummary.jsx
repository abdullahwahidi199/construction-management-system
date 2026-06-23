// components/dashboard/ExpenseSummary.jsx

import { useLanguage } from "../../hooks/useLanguage";
import Card from "../ui/Card";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";

const EXPENSE_TYPE_COLORS = {
  general: "#6366f1",
  material: "#f59e0b",
  staff_salary: "#10b981",
  daily_wage: "#ec4899",
  contract_payment: "#8b5cf6",
  equipment: "#14b8a6",
  utility: "#f97316",
  other: "#6b7280",
};

const formatCurrency = (val) => {
  if (!val) return "$0";
  const num = parseFloat(val);
  if (num >= 1000000) return `$${(num / 1000000).toFixed(1)}M`;
  if (num >= 1000) return `$${(num / 1000).toFixed(0)}K`;
  return `$${num.toFixed(0)}`;
};

export default function ExpenseSummary({ data }) {
  if (!data) return null;
  const { t } = useLanguage();

  const EXPENSE_TYPE_LABELS = {
    general: t("expenseSummary.general"),
    material: t("expenseSummary.materials"),
    staff_salary: t("expenseSummary.staffSalary"),
    daily_wage: t("expenseSummary.dailyWages"),
    contract_payment: t("expenseSummary.contracts"),
    equipment: t("expenseSummary.equipment"),
    utility: t("expenseSummary.utilities"),
    other: t("expenseSummary.other"),
  };

  const trendData = (data.monthly_trend || []).map((m) => ({
    month: m.month,
    usd: parseFloat(m.total_usd),
    afn: parseFloat(m.total_afn),
    count: m.count,
  }));

  const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null;
    return (
      <div className="rounded-lg border border-[var(--border)] bg-[var(--card)] p-3 shadow-lg">
        <p className="text-xs font-semibold text-[var(--text)] mb-1">{label}</p>
        {payload.map((p, i) => (
          <p key={i} className="text-xs text-[var(--muted)]">
            {p.name}:{" "}
            <span className="font-medium" style={{ color: p.color }}>
              {formatCurrency(p.value)}
            </span>
          </p>
        ))}
      </div>
    );
  };

  return (
    <Card
      title={t("expenseSummary.title")}
      right={
        <div className="text-right">
          <span className="text-sm font-semibold text-[var(--text)]">
            ${parseFloat(data.total_expenses_usd).toLocaleString()}
          </span>
          <span className="text-xs text-[var(--muted)] ml-2">
            ({data.total_expense_count} {t("expenseSummary.entries")})
          </span>
        </div>
      }
    >
      {/* Monthly Trend Chart */}
      <div className="mb-6">
        <h4 className="text-sm font-medium text-[var(--muted)] mb-3">
          {t("expenseSummary.monthlyTrend")}
        </h4>
        {trendData.length > 0 ? (
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart
              data={trendData}
              margin={{ top: 5, right: 10, left: 10, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis
                dataKey="month"
                tick={{ fill: "var(--muted)", fontSize: 11 }}
                axisLine={{ stroke: "var(--border)" }}
                tickLine={false}
                tickFormatter={(val) => {
                  const [y, m] = val.split("-");
                  const months = [
                    t("expenseSummary.jan"),
                    t("expenseSummary.feb"),
                    t("expenseSummary.mar"),
                    t("expenseSummary.apr"),
                    t("expenseSummary.may"),
                    t("expenseSummary.jun"),
                    t("expenseSummary.jul"),
                    t("expenseSummary.aug"),
                    t("expenseSummary.sep"),
                    t("expenseSummary.oct"),
                    t("expenseSummary.nov"),
                    t("expenseSummary.dec"),
                  ];
                  return months[parseInt(m) - 1];
                }}
              />
              <YAxis
                tickFormatter={formatCurrency}
                tick={{ fill: "var(--muted)", fontSize: 11 }}
                axisLine={{ stroke: "var(--border)" }}
                tickLine={false}
              />
              <Tooltip content={<CustomTooltip />} />
              <Area
                type="monotone"
                dataKey="usd"
                name="USD"
                stroke="var(--primary)"
                fill="var(--primary)"
                fillOpacity={0.1}
                strokeWidth={2}
              />
              <Area
                type="monotone"
                dataKey="afn"
                name="AFN"
                stroke="var(--warning)"
                fill="var(--warning)"
                fillOpacity={0.05}
                strokeWidth={2}
                strokeDasharray="5 5"
              />
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-[220px] flex items-center justify-center text-[var(--muted)]">
            {t("expenseSummary.noData")}
          </div>
        )}
      </div>

      {/* Bottom: By Type + By Project */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* By Type */}
        <div>
          <h4 className="text-sm font-medium text-[var(--muted)] mb-3">
            By Category
          </h4>
          <div className="space-y-2">
            {(data.by_expense_type || []).slice(0, 6).map((item) => {
              const maxVal = Math.max(
                ...(data.by_expense_type || []).map((i) =>
                  parseFloat(i.total_usd),
                ),
              );
              const pct =
                maxVal > 0 ? (parseFloat(item.total_usd) / maxVal) * 100 : 0;

              return (
                <div key={item.expense_type}>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-[var(--text)]">
                      {EXPENSE_TYPE_LABELS[item.expense_type] ||
                        item.expense_type}
                    </span>
                    <span className="text-[var(--muted)] font-medium">
                      {formatCurrency(item.total_usd)} ({item.count})
                    </span>
                  </div>
                  <div className="w-full h-1.5 bg-[var(--border)] rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${pct}%`,
                        backgroundColor:
                          EXPENSE_TYPE_COLORS[item.expense_type] || "#6b7280",
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* By Project */}
        <div>
          <h4 className="text-sm font-medium text-[var(--muted)] mb-3">
            By Project
          </h4>
          <div className="space-y-2">
            {(data.by_project || []).slice(0, 6).map((item) => {
              const maxVal = Math.max(
                ...(data.by_project || []).map((i) => parseFloat(i.total_usd)),
              );
              const pct =
                maxVal > 0 ? (parseFloat(item.total_usd) / maxVal) * 100 : 0;

              return (
                <div key={item.project__id}>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-[var(--text)] truncate mr-2">
                      {item.project__name}
                    </span>
                    <span className="text-[var(--muted)] font-medium whitespace-nowrap">
                      {formatCurrency(item.total_usd)}
                    </span>
                  </div>
                  <div className="w-full h-1.5 bg-[var(--border)] rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500 bg-[var(--primary)]"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </Card>
  );
}

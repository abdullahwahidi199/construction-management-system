// components/dashboard/ProjectOverview.jsx

import { useLanguage } from "../../hooks/useLanguage";
import Card from "../ui/Card";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from "recharts";

const STATUS_COLORS = {
  planning: "var(--primary)",
  ongoing: "var(--warning)",
  completed: "var(--success)",
  on_hold: "var(--danger)",
};

const PROPERTY_COLORS = {
  residential: "#6366f1",
  commercial: "#ec4899",
  mixed: "#14b8a6",
};

export default function ProjectOverview({ data }) {
  if (!data) return null;
  const { t } = useLanguage();

  const STATUS_LABELS = {
    planning: t("projectOverview.planning"),
    ongoing: t("projectOverview.ongoing"),
    completed: t("projectOverview.completed"),
    on_hold: t("projectOverview.onHold"),
  };

  const statusData = Object.entries(data.status_breakdown || {})
    .filter(([, count]) => count > 0)
    .map(([key, count]) => ({
      name: STATUS_LABELS[key] || key,
      value: count,
      color: STATUS_COLORS[key] || "#6b7280",
    }));

  const PROPERTY_LABELS = {
    residential: t("projectOverview.residential"),
    commercial: t("projectOverview.commercial"),
    mixed: t("projectOverview.mixed"),
  };

  const propertyData = Object.entries(data.property_type_breakdown || {})
    .filter(([, count]) => count > 0)
    .map(([key, count]) => ({
      name: PROPERTY_LABELS[key] || key,
      value: count,
      color: PROPERTY_COLORS[key] || "#6b7280",
    }));

  return (
    <Card
      title={t("projectOverview.title")}
      right={
        <span className="text-sm text-[var(--muted)]">
          {data.total_projects} {t("projectOverview.total")}
        </span>
      }
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Status Pie Chart */}
        <div>
          <h4 className="text-sm font-medium text-[var(--muted)] mb-3">
            {t("projectOverview.byStatus")}
          </h4>
          {statusData.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={statusData}
                  cx="50%"
                  cy="50%"
                  innerRadius={45}
                  outerRadius={80}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {statusData.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: "var(--card)",
                    border: "1px solid var(--border)",
                    borderRadius: "8px",
                    color: "var(--text)",
                  }}
                />
                <Legend
                  formatter={(value) => (
                    <span style={{ color: "var(--text)", fontSize: "12px" }}>
                      {value}
                    </span>
                  )}
                />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[200px] flex items-center justify-center text-[var(--muted)]">
              {t("projectOverview.noProjects")}
            </div>
          )}
        </div>

        {/* Status List + Property Types */}
        <div className="space-y-4">
          <div>
            <h4 className="text-sm font-medium text-[var(--muted)] mb-3">
              {t("projectOverview.statusBreakdown")}
            </h4>
            <div className="space-y-2">
              {Object.entries(data.status_breakdown || {}).map(
                ([status, count]) => (
                  <div
                    key={status}
                    className="flex items-center justify-between"
                  >
                    <div className="flex items-center gap-2">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: STATUS_COLORS[status] }}
                      />
                      <span className="text-sm text-[var(--text)]">
                        {STATUS_LABELS[status]}
                      </span>
                    </div>
                    <span className="text-sm font-semibold text-[var(--text)]">
                      {count}
                    </span>
                  </div>
                ),
              )}
            </div>
          </div>

          <div className="border-t border-[var(--border)] pt-4">
            <h4 className="text-sm font-medium text-[var(--muted)] mb-3">
              {t("projectOverview.byPropertyType")}
            </h4>
            <div className="space-y-2">
              {propertyData.map((item) => (
                <div
                  key={item.name}
                  className="flex items-center justify-between"
                >
                  <div className="flex items-center gap-2">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: item.color }}
                    />
                    <span className="text-sm text-[var(--text)]">
                      {item.name}
                    </span>
                  </div>
                  <span className="text-sm font-semibold text-[var(--text)]">
                    {item.value}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Overdue alert */}
          {data.overdue_projects_count > 0 && (
            <div className="border-t border-[var(--border)] pt-4">
              <div className="bg-[var(--danger)]/10 border border-[var(--danger)]/20 rounded-lg p-3">
                <p className="text-sm font-medium text-[var(--danger)]">
                  ⚠️ {data.overdue_projects_count}{" "}
                  {data.overdue_projects_count > 1
                    ? t("projectOverview.overdueProjects")
                    : t("projectOverview.overdueProject")}
                </p>
                <div className="mt-2 space-y-1">
                  {data.overdue_projects?.slice(0, 3).map((p) => (
                    <p key={p.id} className="text-xs text-[var(--muted)]">
                      • <span>{p.name}</span>
                      <span>
                        {t("projectOverview.due")}: {p.expected_completion_date}
                      </span>
                    </p>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}

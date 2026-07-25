// components/dashboard/WorkforceSection.jsx

import { useLanguage } from "../../hooks/useLanguage";
import Card from "../ui/Card";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

const DEPT_COLORS = {
  management: "#6366f1",
  engineering: "#3b82f6",
  construction: "#f59e0b",
  administration: "#10b981",
  finance: "#8b5cf6",
  hr: "#ec4899",
  procurement: "#14b8a6",
  safety: "#ef4444",
};

export default function WorkforceSection({ workforce, attendance }) {
  if (!workforce) return null;
  const { t, language } = useLanguage();

  const attendanceToday = attendance?.today;
  const weeklyTrend = attendance?.weekly_trend || [];

  const DEPARTMENT_LABELS = {
    management: t("workforceSection.management"),
    engineering: t("workforceSection.engineering"),
    construction: t("workforceSection.construction"),
    administration: t("workforceSection.administration"),
    finance: t("workforceSection.finance"),
    hr: t("workforceSection.hr"),
    procurement: t("workforceSection.procurement"),
    safety: t("workforceSection.safety"),
  };
  return (
    <Card
      title={t("workforceSection.title")}
      right={
        <span className="text-sm text-[var(--muted)]">
          {workforce.active_employees} {t("workforceSection.active")}
        </span>
      }
    >
      <div className="space-y-6">
        {/* Top stats row */}
        <div className="grid grid-cols-1 gap-3 min-[380px]:grid-cols-3">
          <div className="text-center p-3 rounded-lg bg-[var(--bg)]">
            <p className="text-2xl font-bold text-[var(--text)]">
              {workforce.total_employees}
            </p>
            <p className="text-xs text-[var(--muted)]">
              {t("workforceSection.total")}
            </p>
          </div>
          <div className="text-center p-3 rounded-lg bg-[var(--bg)]">
            <p className="text-2xl font-bold text-[var(--success)]">
              {workforce.active_employees}
            </p>
            <p className="text-xs text-[var(--muted)]">
              {t("workforceSection.activeEmployees")}
            </p>
          </div>
          <div className="text-center p-3 rounded-lg bg-[var(--bg)]">
            <p className="text-2xl font-bold text-[var(--danger)]">
              {workforce.inactive_employees}
            </p>
            <p className="text-xs text-[var(--muted)]">
              {t("workforceSection.inactiveEmployees")}
            </p>
          </div>
        </div>

        {/* Today's Attendance */}
        {attendanceToday && (
          <div>
            <h4 className="text-sm font-medium text-[var(--muted)] mb-3">
              {t("workforceSection.todayAttendance")}
            </h4>
            <div className="mb-3 grid grid-cols-2 gap-2 min-[380px]:grid-cols-3 sm:grid-cols-5">
              {[
                {
                  label: t("workforceSection.present"),
                  val: attendanceToday.present,
                  color: "var(--success)",
                },
                {
                  label: t("workforceSection.absent"),
                  val: attendanceToday.absent,
                  color: "var(--danger)",
                },
                {
                  label: t("workforceSection.halfDay"),
                  val: attendanceToday.half_day,
                  color: "var(--warning)",
                },
                {
                  label: t("workforceSection.leave"),
                  val: attendanceToday.leave,
                  color: "var(--primary)",
                },
                {
                  label: t("workforceSection.unmarked"),
                  val: attendanceToday.not_marked,
                  color: "var(--muted)",
                },
              ].map((item) => (
                <div key={item.label} className="rounded-lg bg-[var(--bg)] px-2 py-2 text-center sm:bg-transparent sm:p-0">
                  <p
                    className="text-lg font-bold"
                    style={{ color: item.color }}
                  >
                    {item.val}
                  </p>
                  <p className="text-[10px] text-[var(--muted)]">
                    {item.label}
                  </p>
                </div>
              ))}
            </div>

            {/* Attendance rate bar */}
            <div className="flex items-center gap-3">
              <div className="flex-1 h-3 bg-[var(--border)] rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${attendanceToday.attendance_rate}%`,
                    backgroundColor:
                      attendanceToday.attendance_rate >= 80
                        ? "var(--success)"
                        : attendanceToday.attendance_rate >= 60
                          ? "var(--warning)"
                          : "var(--danger)",
                  }}
                />
              </div>
              <span className="text-sm font-semibold text-[var(--text)] whitespace-nowrap">
                {attendanceToday.attendance_rate}%
              </span>
            </div>
          </div>
        )}

        {/* Weekly Attendance Trend */}
        {weeklyTrend.length > 0 && (
          <div>
            <h4 className="text-sm font-medium text-[var(--muted)] mb-3">
              {t("workforceSection.weeklyTrend")}
            </h4>
            <ResponsiveContainer width="100%" height={140}>
              <BarChart
                data={weeklyTrend}
                margin={{ top: 0, right: 0, left: -20, bottom: 0 }}
              >
                <XAxis
                  dataKey="date"
                  tick={{ fill: "var(--muted)", fontSize: 10 }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(val) => {
                    return String(val || "").slice(0, 10);
                  }}
                />
                <YAxis hide />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "var(--card)",
                    border: "1px solid var(--border)",
                    borderRadius: "8px",
                    color: "var(--text)",
                    fontSize: "12px",
                  }}
                />
                <Bar
                  dataKey="present"
                  name={t("workforceSection.present")}
                  fill="var(--success)"
                  radius={[3, 3, 0, 0]}
                  stackId="a"
                />
                <Bar
                  dataKey="half_day"
                  name={t("workforceSection.halfDay")}
                  fill="var(--warning)"
                  radius={[0, 0, 0, 0]}
                  stackId="a"
                />
                <Bar
                  dataKey="absent"
                  name={t("workforceSection.absent")}
                  fill="var(--danger)"
                  radius={[0, 0, 0, 0]}
                  stackId="a"
                />
                <Bar
                  dataKey="leave"
                  name={t("workforceSection.leave")}
                  fill="var(--primary)"
                  radius={[0, 0, 3, 3]}
                  stackId="a"
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Department Distribution */}
        <div>
          <h4 className="text-sm font-medium text-[var(--muted)] mb-3">
            {t("workforceSection.byDepartment")}
          </h4>
          <div className="space-y-2">
            {(workforce.department_breakdown || []).map((dept) => {
              const maxCount = Math.max(
                ...(workforce.department_breakdown || []).map((d) => d.count),
              );
              const pct = maxCount > 0 ? (dept.count / maxCount) * 100 : 0;

              return (
                <div key={dept.department}>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-[var(--text)] capitalize">
                      {DEPARTMENT_LABELS[dept.department] || dept.department}
                    </span>
                    <span className="text-[var(--muted)]">{dept.count}</span>
                  </div>
                  <div className="w-full h-1.5 bg-[var(--border)] rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{
                        width: `${pct}%`,
                        backgroundColor:
                          DEPT_COLORS[dept.department] || "var(--primary)",
                      }}
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

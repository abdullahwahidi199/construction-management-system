import React, { useState, useEffect } from "react";
import useAttendance from "../../../hooks/useAttendance";
import instance from "../../../api/axiosInstance";
import { useLanguage } from "../../../hooks/useLanguage";
import { getFriendlyErrorMessage } from "../../../utils/apiErrors";
import { useCalendar } from "../../../hooks/useCalendar";
import {
  AFGHAN_MONTH_NAMES,
  CALENDAR_TYPES,
  todayIso,
  toShamsi,
} from "../../../utils/calendar";

function currentCalendarParts(calendar) {
  if (calendar === CALENDAR_TYPES.SHAMSI) {
    const today = toShamsi(todayIso());
    return { month: today.month, year: today.year };
  }

  const today = new Date();
  return { month: today.getMonth() + 1, year: today.getFullYear() };
}

function MonthlySummary() {
  const { fetchMonthlySummary, loading, error } = useAttendance();

  const { t, language } = useLanguage();
  const { calendar } = useCalendar("attendance");

  // RTL languages (Dari / Pashto)
  const isRTL = ["fa", "ps", "dari", "pashto"].includes(language);

  const [employees, setEmployees] = useState([]);
  const [selectedEmployee, setSelectedEmployee] = useState("");
  const initialDate = currentCalendarParts(calendar);
  const [month, setMonth] = useState(initialDate.month);
  const [year, setYear] = useState(initialDate.year);
  const [summary, setSummary] = useState(null);
  const [localError, setLocalError] = useState("");

  const yearOptions = Array.from(
    { length: 7 },
    (_, index) => Number(year || currentCalendarParts(calendar).year) - 3 + index,
  );
  const monthOptions = Array.from({ length: 12 }, (_, index) => ({
    value: index + 1,
    label:
      calendar === CALENDAR_TYPES.SHAMSI
        ? AFGHAN_MONTH_NAMES.en[index]
        : new Intl.DateTimeFormat("en-US", { month: "long" }).format(
            new Date(2024, index, 1),
          ),
  }));

  const getMonthLabel = (value) =>
    monthOptions.find((option) => Number(option.value) === Number(value))
      ?.label || value;

  useEffect(() => {
    loadEmployees();
  }, []);

  useEffect(() => {
    const current = currentCalendarParts(calendar);
    setMonth(current.month);
    setYear(current.year);
    setSummary(null);
  }, [calendar]);

  useEffect(() => {
    if (selectedEmployee) {
      loadSummary();
    }
  }, [selectedEmployee, month, year]);

  const loadEmployees = async () => {
    try {
      const res = await instance.get("/employees");
      setEmployees(res.data.results || res.data);
    } catch (err) {
      setLocalError(getFriendlyErrorMessage(err, "Unable to load employees."));
    }
  };

  const loadSummary = async () => {
    try {
      const data = await fetchMonthlySummary(selectedEmployee, month, year);
      setSummary(data);
    } catch (err) {
      setLocalError(getFriendlyErrorMessage(err, "Unable to load monthly summary."));
    }
  };

  const getStatusBadge = (status) => {
    const styles = {
      present: {
        bg: "#dcfce7",
        color: "#16a34a",
        darkBg: "#14532d",
        darkColor: "#22c55e",
      },
      absent: {
        bg: "#fee2e2",
        color: "#dc2626",
        darkBg: "#7f1d1d",
        darkColor: "#ef4444",
      },
      half_day: {
        bg: "#fef3c7",
        color: "#d97706",
        darkBg: "#78350f",
        darkColor: "#f59e0b",
      },
      leave: {
        bg: "#dbeafe",
        color: "#2563eb",
        darkBg: "#1e3a8a",
        darkColor: "#3b82f6",
      },
    };
    const style = styles[status] || styles.present;
    const isDark = document.documentElement.classList.contains("dark");
    return (
      <span
        className="px-3 py-1 rounded-full text-xs font-semibold capitalize"
        style={{
          backgroundColor: isDark ? style.darkBg : style.bg,
          color: isDark ? style.darkColor : style.color,
        }}
      >
        {status}
      </span>
    );
  };

  return (
    <div className="space-y-6" dir={isRTL ? "rtl" : "ltr"}>
      <div
        className="rounded-lg border p-6"
        style={{ backgroundColor: "var(--card)", borderColor: "var(--border)" }}
      >
        <h2 className="text-xl font-semibold mb-6">
          {t("MonthlySummary.title")}
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div>
            <label
              className="block text-sm font-medium mb-2"
              style={{ color: "var(--muted)" }}
            >
              {t("MonthlySummary.selectEmployee")}
            </label>
            <select
              value={selectedEmployee}
              onChange={(e) => setSelectedEmployee(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg"
              style={{
                borderColor: "var(--border)",
                backgroundColor: "var(--bg)",
                color: "var(--text)",
              }}
            >
              <option value="">{t("MonthlySummary.selectEmployee")}</option>
              {employees.map((emp) => (
                <option key={emp.id} value={emp.id}>
                  {emp.full_name} ({emp.employee_id})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label
              className="block text-sm font-medium mb-2"
              style={{ color: "var(--muted)" }}
            >
              {t("MonthlySummary.selectMonth")}
            </label>
            <select
              value={month}
              onChange={(e) => setMonth(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg"
              style={{
                borderColor: "var(--border)",
                backgroundColor: "var(--bg)",
                color: "var(--text)",
              }}
            >
              {monthOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label
              className="block text-sm font-medium mb-2"
              style={{ color: "var(--muted)" }}
            >
              {t("MonthlySummary.selectYear")}
            </label>
            <select
              value={year}
              onChange={(e) => setYear(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg"
              style={{
                borderColor: "var(--border)",
                backgroundColor: "var(--bg)",
                color: "var(--text)",
              }}
            >
              {yearOptions.map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
          </div>
        </div>

        {(localError || error) && (
          <div className="mb-4 p-4 rounded-lg bg-red-50 border border-red-200 text-red-700">
            {localError || error}
          </div>
        )}

        {loading ? (
          <div className="text-center py-12" style={{ color: "var(--muted)" }}>
            {t("MonthlySummary.loading")}
          </div>
        ) : summary ? (
          <div>
            {/* Employee Info */}
            <div
              className="p-6 rounded-lg border mb-6"
              style={{
                backgroundColor: "var(--bg)",
                borderColor: "var(--border)",
              }}
            >
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-2xl font-bold">
                    {summary.employee.name}
                  </h3>
                  <p className="text-sm" style={{ color: "var(--muted)" }}>
                    {t("MonthlySummary.employeeInfo.id")}:{" "}
                    {summary.employee.employee_id} •{" "}
                    {getMonthLabel(summary.month)} {summary.year}
                  </p>
                </div>
                <div className="text-end">
                  <div className="text-sm" style={{ color: "var(--muted)" }}>
                    {t("MonthlySummary.employeeInfo.effectiveWorkingDays")}
                  </div>
                  <div
                    className="text-3xl font-bold"
                    style={{ color: "var(--primary)" }}
                  >
                    {summary.effective_working_days}
                  </div>
                </div>
              </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
              <div
                className="p-4 rounded-lg border text-center"
                style={{
                  backgroundColor: "var(--bg)",
                  borderColor: "var(--border)",
                }}
              >
                <div className="text-sm" style={{ color: "var(--muted)" }}>
                  {t("MonthlySummary.stats.totalDays")}
                </div>
                <div className="text-2xl font-bold">
                  {summary.total_records}
                </div>
              </div>
              <div
                className="p-4 rounded-lg border text-center"
                style={{
                  backgroundColor: "var(--bg)",
                  borderColor: "var(--border)",
                }}
              >
                <div className="text-sm" style={{ color: "var(--muted)" }}>
                  {t("MonthlySummary.stats.present")}
                </div>
                <div
                  className="text-2xl font-bold"
                  style={{ color: "var(--success)" }}
                >
                  {summary.present}
                </div>
              </div>
              <div
                className="p-4 rounded-lg border text-center"
                style={{
                  backgroundColor: "var(--bg)",
                  borderColor: "var(--border)",
                }}
              >
                <div className="text-sm" style={{ color: "var(--muted)" }}>
                  {t("MonthlySummary.stats.absent")}
                </div>
                <div
                  className="text-2xl font-bold"
                  style={{ color: "var(--danger)" }}
                >
                  {summary.absent}
                </div>
              </div>
              <div
                className="p-4 rounded-lg border text-center"
                style={{
                  backgroundColor: "var(--bg)",
                  borderColor: "var(--border)",
                }}
              >
                <div className="text-sm" style={{ color: "var(--muted)" }}>
                  {t("MonthlySummary.stats.halfDay")}
                </div>
                <div
                  className="text-2xl font-bold"
                  style={{ color: "#d97706" }}
                >
                  {summary.half_day}
                </div>
              </div>
              <div
                className="p-4 rounded-lg border text-center"
                style={{
                  backgroundColor: "var(--bg)",
                  borderColor: "var(--border)",
                }}
              >
                <div className="text-sm" style={{ color: "var(--muted)" }}>
                  {t("MonthlySummary.stats.leave")}
                </div>
                <div
                  className="text-2xl font-bold"
                  style={{ color: "var(--primary)" }}
                >
                  {summary.leave}
                </div>
              </div>
              <div
                className="p-4 rounded-lg border text-center"
                style={{
                  backgroundColor: "var(--bg)",
                  borderColor: "var(--border)",
                }}
              >
                <div className="text-sm" style={{ color: "var(--muted)" }}>
                  {t("MonthlySummary.stats.overtime")}
                </div>
                <div
                  className="text-2xl font-bold"
                  style={{ color: "#d97706" }}
                >
                  {summary.overtime_hours}h
                </div>
              </div>
            </div>

            {/* Visual Bar Chart */}
            <div
              className="p-6 rounded-lg border"
              style={{
                backgroundColor: "var(--card)",
                borderColor: "var(--border)",
              }}
            >
              <h3 className="text-lg font-semibold mb-4">
                {t("MonthlySummary.attendanceBreakdown")}
              </h3>
              <div className="space-y-4">
                {[
                  {
                    label: t("MonthlySummary.stats.present"),
                    count: summary.present,
                    color: "#16a34a",
                  },
                  {
                    label: t("MonthlySummary.stats.absent"),
                    count: summary.absent,
                    color: "#dc2626",
                  },
                  {
                    label: t("MonthlySummary.stats.halfDay"),
                    count: summary.half_day,
                    color: "#d97706",
                  },
                  {
                    label: t("MonthlySummary.stats.leave"),
                    count: summary.leave,
                    color: "#2563eb",
                  },
                ].map((item) => (
                  <div key={item.label}>
                    <div className="flex justify-between text-sm mb-1">
                      <span style={{ color: "var(--text)" }}>{item.label}</span>
                      <span style={{ color: "var(--muted)" }}>
                        {item.count} days
                      </span>
                    </div>
                    <div
                      className="w-full h-3 rounded-full overflow-hidden"
                      style={{ backgroundColor: "var(--hover)" }}
                    >
                      <div
                        className="h-full rounded-full transition-all"
                        style={{
                          width: `${summary.total_records > 0 ? (item.count / summary.total_records) * 100 : 0}%`,
                          backgroundColor: item.color,
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-12" style={{ color: "var(--muted)" }}>
            {t("MonthlySummary.emptyState")}
          </div>
        )}
      </div>
    </div>
  );
}

export default MonthlySummary;

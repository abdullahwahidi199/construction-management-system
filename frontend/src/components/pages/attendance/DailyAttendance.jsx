import React, { useState, useEffect } from "react";
import useAttendance from "../../../hooks/useAttendance";
import { useLanguage } from "../../../hooks/useLanguage";
import { getFriendlyErrorMessage } from "../../../utils/apiErrors";

function DailyAttendance() {
  const { fetchDailyAttendance, loading, error } = useAttendance();

  const { t, language } = useLanguage();

  // RTL languages (Dari / Pashto)
  const isRTL = ["fa", "ps", "dari", "pashto"].includes(language);

  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split("T")[0],
  );
  const [data, setData] = useState(null);
  const [localError, setLocalError] = useState("");

  useEffect(() => {
    loadDailyAttendance();
  }, [selectedDate]);

  const loadDailyAttendance = async () => {
    try {
      setLocalError("");
      const result = await fetchDailyAttendance(selectedDate);
      setData(result);
    } catch (err) {
      setLocalError(getFriendlyErrorMessage(err, "Unable to load daily attendance."));
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

    const statusLabels = {
      present: t("DailyAttendance.status.present"),
      absent: t("DailyAttendance.status.absent"),
      half_day: t("DailyAttendance.status.halfDay"),
      leave: t("DailyAttendance.status.leave"),
    };

    return (
      <span
        className="px-3 py-1 rounded-full text-xs font-semibold capitalize"
        style={{
          backgroundColor: isDark ? style.darkBg : style.bg,
          color: isDark ? style.darkColor : style.color,
        }}
      >
        {statusLabels[status] || status}
      </span>
    );
  };

  return (
    <div className="space-y-6" dir={isRTL ? "rtl" : "ltr"}>
      <div
        className="rounded-lg border p-6"
        style={{ backgroundColor: "var(--card)", borderColor: "var(--border)" }}
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold">
            {t("DailyAttendance.title")}
          </h2>
          <div>
            <label
              className="block text-sm font-medium mb-2"
              style={{ color: "var(--muted)" }}
            >
              {t("DailyAttendance.selectDate")}
            </label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="px-3 py-2 border rounded-lg"
              style={{
                borderColor: "var(--border)",
                backgroundColor: "var(--bg)",
                color: "var(--text)",
              }}
            />
          </div>
        </div>

        {(localError || error) && (
          <div className="mb-4 p-4 rounded-lg bg-red-50 border border-red-200 text-red-700">
            {localError || error}
          </div>
        )}

        {loading ? (
          <div className="text-center py-12" style={{ color: "var(--muted)" }}>
            {t("DailyAttendance.loading")}
          </div>
        ) : data ? (
          <div>
            {/* Summary Cards */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
              <div
                className="p-4 rounded-lg border"
                style={{
                  backgroundColor: "var(--bg)",
                  borderColor: "var(--border)",
                }}
              >
                <div className="text-sm" style={{ color: "var(--muted)" }}>
                  {t("DailyAttendance.totalMarked")}
                </div>
                <div className="text-3xl font-bold">{data.total_marked || 0}</div>
              </div>
              <div
                className="p-4 rounded-lg border"
                style={{
                  backgroundColor: "var(--bg)",
                  borderColor: "var(--border)",
                }}
              >
                <div className="text-sm" style={{ color: "var(--muted)" }}>
                  {t("DailyAttendance.unmarked")}
                </div>
                <div
                  className="text-3xl font-bold"
                  style={{ color: "var(--danger)" }}
                >
                  {data.total_unmarked || 0}
                </div>
              </div>
              <div
                className="p-4 rounded-lg border"
                style={{
                  backgroundColor: "var(--bg)",
                  borderColor: "var(--border)",
                }}
              >
                <div className="text-sm" style={{ color: "var(--muted)" }}>
                  {t("DailyAttendance.present")}
                </div>
                <div
                  className="text-3xl font-bold"
                  style={{ color: "var(--success)" }}
                >
                  {data.status_counts?.present || 0}
                </div>
              </div>
              <div
                className="p-4 rounded-lg border"
                style={{
                  backgroundColor: "var(--bg)",
                  borderColor: "var(--border)",
                }}
              >
                <div className="text-sm" style={{ color: "var(--muted)" }}>
                  {t("DailyAttendance.absent")}
                </div>
                <div
                  className="text-3xl font-bold"
                  style={{ color: "var(--danger)" }}
                >
                  {data.status_counts?.absent || 0}
                </div>
              </div>
              <div
                className="p-4 rounded-lg border"
                style={{
                  backgroundColor: "var(--bg)",
                  borderColor: "var(--border)",
                }}
              >
                <div className="text-sm" style={{ color: "var(--muted)" }}>
                  {t("DailyAttendance.leave")}
                </div>
                <div
                  className="text-3xl font-bold"
                  style={{ color: "var(--primary)" }}
                >
                  {data.status_counts?.leave || 0}
                </div>
              </div>
            </div>

            {/* Marked Employees */}
            <div className="mb-6">
              <h3 className="text-lg font-semibold mb-4">
                {t("DailyAttendance.markedEmployees")}
              </h3>
              <div
                className="rounded-lg border overflow-hidden"
                style={{ borderColor: "var(--border)" }}
                dir={isRTL ? "rtl" : "ltr"}
              >
                <table className="w-full">
                  <thead>
                    <tr style={{ backgroundColor: "var(--card)" }}>
                      <th
                        className="px-6 py-3 text-start text-xs font-medium uppercase"
                        style={{ color: "var(--muted)" }}
                      >
                        {t("DailyAttendance.employee")}
                      </th>
                      <th
                        className="px-6 py-3 text-start text-xs font-medium uppercase"
                        style={{ color: "var(--muted)" }}
                      >
                        {t("DailyAttendance.status.present") &&
                          t("DailyAttendance.employee")}
                      </th>
                      <th
                        className="px-6 py-3 text-start text-xs font-medium uppercase"
                        style={{ color: "var(--muted)" }}
                      >
                        {t("DailyAttendance.checkIn")}
                      </th>
                      <th
                        className="px-6 py-3 text-start text-xs font-medium uppercase"
                        style={{ color: "var(--muted)" }}
                      >
                        {t("DailyAttendance.checkOut")}
                      </th>
                      <th
                        className="px-6 py-3 text-start text-xs font-medium uppercase"
                        style={{ color: "var(--muted)" }}
                      >
                        {t("DailyAttendance.overtime")}
                      </th>
                      <th
                        className="px-6 py-3 text-start text-xs font-medium uppercase"
                        style={{ color: "var(--muted)" }}
                      >
                        {t("DailyAttendance.note")}
                      </th>
                    </tr>
                  </thead>
                  <tbody
                    className="divide-y"
                    style={{ divideColor: "var(--border)" }}
                  >
                    {(data.records || []).map((record) => (
                      <tr
                        key={record.id}
                        style={{ backgroundColor: "var(--bg)" }}
                      >
                        <td className="px-6 py-4">
                          <div className="font-medium">
                            {record.employee_name}
                          </div>
                          <div
                            className="text-sm"
                            style={{ color: "var(--muted)" }}
                          >
                            {record.employee_identifier}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          {getStatusBadge(record.status)}
                        </td>
                        <td className="px-6 py-4 text-sm">
                          {record.check_in || t("DailyAttendance.empty")}
                        </td>
                        <td className="px-6 py-4 text-sm">
                          {record.check_out || t("DailyAttendance.empty")}
                        </td>
                        <td className="px-6 py-4 text-sm">
                          {record.overtime_hours || 0}h
                        </td>
                        <td className="px-6 py-4 text-sm max-w-xs truncate">
                          {record.note || t("DailyAttendance.empty")}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Unmarked Employees */}
            {(data.unmarked_employees || []).length > 0 && (
              <div>
                <h3 className="text-lg font-semibold mb-4">
                  {t("DailyAttendance.unmarkedCount", {
                    count: (data.unmarked_employees || []).length,
                  })}
                </h3>
                <div
                  className="rounded-lg border overflow-hidden"
                  style={{ borderColor: "var(--border)" }}
                  dir={isRTL ? "rtl" : "ltr"}
                >
                  <table className="w-full">
                    <thead>
                      <tr style={{ backgroundColor: "var(--card)" }}>
                        <th
                          className="px-6 py-3 text-start text-xs font-medium uppercase"
                          style={{ color: "var(--muted)" }}
                        >
                          {t("DailyAttendance.employeeId")}
                        </th>
                        <th
                          className="px-6 py-3 text-start text-xs font-medium uppercase"
                          style={{ color: "var(--muted)" }}
                        >
                          {t("DailyAttendance.name")}
                        </th>
                        <th
                          className="px-6 py-3 text-start text-xs font-medium uppercase"
                          style={{ color: "var(--muted)" }}
                        >
                          {t("DailyAttendance.department")}
                        </th>
                      </tr>
                    </thead>
                    <tbody
                      className="divide-y"
                      style={{ divideColor: "var(--border)" }}
                    >
                      {(data.unmarked_employees || []).map((emp) => (
                        <tr
                          key={emp.id}
                          style={{ backgroundColor: "var(--bg)" }}
                        >
                          <td className="px-6 py-4 text-sm">
                            {emp.employee_id}
                          </td>
                          <td className="px-6 py-4 text-sm font-medium">
                            {emp.first_name} {emp.last_name}
                          </td>
                          <td
                            className="px-6 py-4 text-sm"
                            style={{ color: "var(--muted)" }}
                          >
                            {emp.department}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        ) : null}
      </div>
    </div>
  );
}

export default DailyAttendance;

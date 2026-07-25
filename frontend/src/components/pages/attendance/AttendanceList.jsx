import React, { useState, useEffect } from "react";
import useAttendance from "../../../hooks/useAttendance";
import { Download } from "lucide-react";
import instance from "../../../api/axiosInstance";
import { useLanguage } from "../../../hooks/useLanguage";
import ConfirmDialog from "../../common/ConfirmDialog";
import toast from "react-hot-toast";
import { pdfButtonClass } from "../../ui/formStyles.jsx";
import CalendarDatePicker from "../../common/CalendarDatePicker";
import { useCalendar } from "../../../hooks/useCalendar";
import {
  AFGHAN_MONTH_NAMES,
  CALENDAR_TYPES,
  todayIso,
  toShamsi,
} from "../../../utils/calendar";

function AttendanceList() {
  const { loading, error, setError, fetchAttendance, updateAttendance, deleteAttendance } =
    useAttendance();

  const [attendance, setAttendance] = useState([]);
  const [filters, setFilters] = useState({
    employee: "",
    status: "",
    date: "",
    month: "",
    year: "",
    search: "",
  });
  const [showFilters, setShowFilters] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [deleteTarget, setDeleteTarget] = useState(null);

  const { t, language, lang, isRTL: isRtlHook } = useLanguage();
  const currentLang = (language || lang || "").toLowerCase();
  const isRTL =
    isRtlHook ??
    ["dari", "pashto", "fa", "ps", "dr", "ar"].includes(currentLang);
  const textAlignment = isRTL ? "text-right" : "text-left";
  const { calendar, formatDate } = useCalendar("attendance");

  const currentCalendarYear =
    calendar === CALENDAR_TYPES.SHAMSI
      ? toShamsi(todayIso()).year
      : new Date().getFullYear();
  const yearOptions = Array.from(
    { length: 7 },
    (_, index) => currentCalendarYear - 3 + index,
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

  useEffect(() => {
    loadAttendance();
  }, [filters]);

  const loadAttendance = async () => {
    try {
      const data = await fetchAttendance(filters);
      setAttendance(data.results || data);
    } catch (err) {
      // Central axios handling shows the user-facing error.
    }
  };
  const handleDownloadAttendancePDF = async () => {
    try {
      const params = new URLSearchParams();

      Object.entries(filters).forEach(([key, value]) => {
        if (value) {
          params.append(key, value);
        }
      });

      const response = await instance.get(
        `employees/attendance/export-pdf/?${params.toString()}`,
        {
          responseType: "blob",
        },
      );

      const url = window.URL.createObjectURL(
        new Blob([response.data], { type: "application/pdf" }),
      );

      const link = document.createElement("a");
      link.href = url;
      link.download = `attendance-report-${new Date()
        .toISOString()
        .slice(0, 10)}.pdf`;

      document.body.appendChild(link);
      link.click();
      link.remove();

      window.URL.revokeObjectURL(url);
      toast.success("Attendance report exported.");
    } catch (error) {
      toast.error(t("AttendanceList.pdfDownloadFailed"));
    }
  };

  const handleDelete = async (id) => {
    setDeleteTarget(id);
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteAttendance(deleteTarget);
      toast.success("Attendance record deleted.");
      setDeleteTarget(null);
      loadAttendance();
    } catch (err) {
      // Central axios handling shows the user-facing error.
    }
  };

  const handleEdit = (record) => {
    setEditingId(record.id);
    setEditForm({
      status: record.status,
      check_in: record.check_in || "",
      check_out: record.check_out || "",
      overtime_hours: record.overtime_hours || 0,
      note: record.note || "",
    });
  };

  const handleSaveEdit = async (id) => {
    try {
      await updateAttendance(id, editForm);
      setEditingId(null);
      toast.success("Attendance updated.");
      loadAttendance();
    } catch (err) {
      // Central axios handling shows the user-facing error.
    }
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditForm({});
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

    const badgeLabels = {
      present: t("AttendanceList.present"),
      absent: t("AttendanceList.absent"),
      half_day: t("AttendanceList.halfDay"),
      leave: t("AttendanceList.leave"),
    };

    return (
      <span
        className="px-3 py-1 rounded-full text-xs font-semibold capitalize"
        style={{
          backgroundColor: isDark ? style.darkBg : style.bg,
          color: isDark ? style.darkColor : style.color,
        }}
      >
        {badgeLabels[status] || status}
      </span>
    );
  };

  return (
    <div className="space-y-6">
      <ConfirmDialog
        isOpen={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={confirmDelete}
        title="Delete attendance record"
        message={t("AttendanceList.deleteConfirmation")}
        loading={loading}
        confirmLabel="Delete"
      />
      <button
        onClick={handleDownloadAttendancePDF}
        className={pdfButtonClass}
      >
        <Download className="h-4 w-4" />
        {t("AttendanceList.exportPdf")}
      </button>
      {/* Filters */}
      <div
        className="rounded-lg border p-6"
        style={{ backgroundColor: "var(--card)", borderColor: "var(--border)" }}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">
            {t("AttendanceList.filters")}
          </h2>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="text-sm px-4 py-2 rounded-lg border"
            style={{ borderColor: "var(--border)", color: "var(--text)" }}
          >
            {showFilters
              ? t("AttendanceList.hideFilters")
              : t("AttendanceList.showFilters")}
          </button>
        </div>

        {showFilters && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label
                className="block text-sm font-medium mb-2"
                style={{ color: "var(--muted)" }}
              >
                {t("AttendanceList.employeeId")}
              </label>
              <input
                type="text"
                value={filters.employee}
                onChange={(e) =>
                  setFilters({ ...filters, employee: e.target.value })
                }
                className="w-full px-3 py-2 border rounded-lg"
                style={{
                  borderColor: "var(--border)",
                  backgroundColor: "var(--bg)",
                  color: "var(--text)",
                }}
                placeholder={t("AttendanceList.enterEmployeeId")}
              />
            </div>

            <div>
              <label
                className="block text-sm font-medium mb-2"
                style={{ color: "var(--muted)" }}
              >
                {t("AttendanceList.status")}
              </label>
              <select
                value={filters.status}
                onChange={(e) =>
                  setFilters({ ...filters, status: e.target.value })
                }
                className="w-full px-3 py-2 border rounded-lg"
                style={{
                  borderColor: "var(--border)",
                  backgroundColor: "var(--bg)",
                  color: "var(--text)",
                }}
              >
                <option value="">{t("AttendanceList.allStatuses")}</option>
                <option value="present">{t("AttendanceList.present")}</option>
                <option value="absent">{t("AttendanceList.absent")}</option>
                <option value="half_day">{t("AttendanceList.halfDay")}</option>
                <option value="leave">{t("AttendanceList.leave")}</option>
              </select>
            </div>

            <div>
              <label
                className="block text-sm font-medium mb-2"
                style={{ color: "var(--muted)" }}
              >
                {t("AttendanceList.date")}
              </label>
              <CalendarDatePicker
                value={filters.date}
                onChange={(value) => setFilters({ ...filters, date: value })}
                module="attendance"
                className="w-full px-3 py-2 border rounded-lg"
                style={{
                  borderColor: "var(--border)",
                  backgroundColor: "var(--bg)",
                  color: "var(--text)",
                }}
              />
            </div>

            <div>
              <label
                className="block text-sm font-medium mb-2"
                style={{ color: "var(--muted)" }}
              >
                {t("AttendanceList.month")}
              </label>
              <select
                value={filters.month}
                onChange={(e) =>
                  setFilters({ ...filters, month: e.target.value })
                }
                className="w-full px-3 py-2 border rounded-lg"
                style={{
                  borderColor: "var(--border)",
                  backgroundColor: "var(--bg)",
                  color: "var(--text)",
                }}
              >
                <option value="">{t("AttendanceList.allMonths")}</option>
                {monthOptions.map((month) => (
                  <option key={month.value} value={month.value}>
                    {month.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label
                className="block text-sm font-medium mb-2"
                style={{ color: "var(--muted)" }}
              >
                {t("AttendanceList.year")}
              </label>
              <select
                value={filters.year}
                onChange={(e) =>
                  setFilters({ ...filters, year: e.target.value })
                }
                className="w-full px-3 py-2 border rounded-lg"
                style={{
                  borderColor: "var(--border)",
                  backgroundColor: "var(--bg)",
                  color: "var(--text)",
                }}
              >
                <option value="">{t("AttendanceList.allYears")}</option>
                {yearOptions.map((year) => (
                  <option key={year} value={year}>
                    {year}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label
                className="block text-sm font-medium mb-2"
                style={{ color: "var(--muted)" }}
              >
                {t("AttendanceList.search")}
              </label>
              <input
                type="text"
                value={filters.search}
                onChange={(e) =>
                  setFilters({ ...filters, search: e.target.value })
                }
                className="w-full px-3 py-2 border rounded-lg"
                style={{
                  borderColor: "var(--border)",
                  backgroundColor: "var(--bg)",
                  color: "var(--text)",
                }}
                placeholder={t("AttendanceList.searchPlaceholder")}
              />
            </div>

            <div className="md:col-span-2 lg:col-span-3 flex justify-end">
              <button
                onClick={() =>
                  setFilters({
                    employee: "",
                    status: "",
                    date: "",
                    month: "",
                    year: "",
                    search: "",
                  })
                }
                className="px-4 py-2 rounded-lg border"
                style={{ borderColor: "var(--border)", color: "var(--text)" }}
              >
                {t("AttendanceList.clearFilters")}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Error Message */}
      {error && (
        <div className="p-4 rounded-lg bg-red-50 border border-red-200 text-red-700">
          {error}
        </div>
      )}

      {/* Table */}
      <div
        className="rounded-lg border overflow-hidden"
        style={{ borderColor: "var(--border)" }}
        dir={isRTL ? "rtl" : "ltr"}
      >
        <div className="hidden overflow-x-auto md:block mobile-scrollbar">
          <table className="w-full">
            <thead>
              <tr style={{ backgroundColor: "var(--card)" }}>
                <th
                  className={`px-6 py-3 ${textAlignment} text-xs font-medium uppercase tracking-wider`}
                  style={{ color: "var(--muted)" }}
                >
                  {t("AttendanceList.employee")}
                </th>
                <th
                  className={`px-6 py-3 ${textAlignment} text-xs font-medium uppercase tracking-wider`}
                  style={{ color: "var(--muted)" }}
                >
                  {t("AttendanceList.date")}
                </th>
                <th
                  className={`px-6 py-3 ${textAlignment} text-xs font-medium uppercase tracking-wider`}
                  style={{ color: "var(--muted)" }}
                >
                  {t("AttendanceList.status")}
                </th>
                <th
                  className={`px-6 py-3 ${textAlignment} text-xs font-medium uppercase tracking-wider`}
                  style={{ color: "var(--muted)" }}
                >
                  {t("AttendanceList.checkIn")}
                </th>
                <th
                  className={`px-6 py-3 ${textAlignment} text-xs font-medium uppercase tracking-wider`}
                  style={{ color: "var(--muted)" }}
                >
                  {t("AttendanceList.checkOut")}
                </th>
                <th
                  className={`px-6 py-3 ${textAlignment} text-xs font-medium uppercase tracking-wider`}
                  style={{ color: "var(--muted)" }}
                >
                  {t("AttendanceList.overtime")}
                </th>
                <th
                  className={`px-6 py-3 ${textAlignment} text-xs font-medium uppercase tracking-wider`}
                  style={{ color: "var(--muted)" }}
                >
                  {t("AttendanceList.note")}
                </th>
              </tr>
            </thead>
            <tbody
              className="divide-y"
              style={{ divideColor: "var(--border)" }}
            >
              {loading ? (
                <tr>
                  <td
                    colSpan="7"
                    className="px-6 py-8 text-center"
                    style={{ color: "var(--muted)" }}
                  >
                    {t("AttendanceList.loading")}
                  </td>
                </tr>
              ) : attendance.length === 0 ? (
                <tr>
                  <td
                    colSpan="7"
                    className="px-6 py-8 text-center"
                    style={{ color: "var(--muted)" }}
                  >
                    {t("AttendanceList.noAttendanceRecords")}
                  </td>
                </tr>
              ) : (
                attendance.map((record) => (
                  <tr
                    key={record.id}
                    style={{ backgroundColor: "var(--bg)" }}
                    className="hover:opacity-80 transition-opacity"
                  >
                    <td className={`px-6 py-4 ${textAlignment}`}>
                      <div>
                        <div className="font-medium">
                          {record.employee_name}
                        </div>
                        <div
                          className="text-sm"
                          style={{ color: "var(--muted)" }}
                        >
                          {record.employee_identifier}
                        </div>
                      </div>
                    </td>
                    <td className={`px-6 py-4 text-sm ${textAlignment}`}>
                      {formatDate(record.date) || record.date}
                    </td>
                    <td className={`px-6 py-4 ${textAlignment}`}>
                      {getStatusBadge(record.status)}
                    </td>
                    <td className={`px-6 py-4 text-sm ${textAlignment}`}>
                      {record.check_in || "-"}
                    </td>
                    <td className={`px-6 py-4 text-sm ${textAlignment}`}>
                      {record.check_out || "-"}
                    </td>
                    <td className={`px-6 py-4 text-sm ${textAlignment}`}>
                      {record.overtime_hours || 0}h
                    </td>
                    <td
                      className={`px-6 py-4 text-sm max-w-xs truncate ${textAlignment}`}
                    >
                      {record.note || "-"}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <div className="divide-y divide-[var(--border)] md:hidden">
          {loading ? (
            <div className="px-6 py-8 text-center text-sm" style={{ color: "var(--muted)" }}>
              {t("AttendanceList.loading")}
            </div>
          ) : attendance.length === 0 ? (
            <div className="px-6 py-8 text-center text-sm" style={{ color: "var(--muted)" }}>
              {t("AttendanceList.noAttendanceRecords")}
            </div>
          ) : (
            attendance.map((record) => (
              <article key={record.id} className="grid gap-4 p-4">
                <div className="flex min-w-0 items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h3 className="break-words text-base font-semibold text-[var(--text)]">
                      {record.employee_name}
                    </h3>
                    <p className="mt-1 text-sm text-[var(--muted)]">
                      {record.employee_identifier}
                    </p>
                  </div>
                  <div className="shrink-0">{getStatusBadge(record.status)}</div>
                </div>

                <dl className="grid grid-cols-1 gap-3 min-[380px]:grid-cols-2">
                  <div>
                    <dt className="text-[11px] font-semibold uppercase tracking-wide text-[var(--muted)]">
                      {t("AttendanceList.date")}
                    </dt>
                    <dd className="mt-1 text-sm font-medium text-[var(--text)]">
                      {formatDate(record.date) || record.date}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-[11px] font-semibold uppercase tracking-wide text-[var(--muted)]">
                      {t("AttendanceList.checkIn")}
                    </dt>
                    <dd className="mt-1 text-sm font-medium text-[var(--text)]">
                      {record.check_in || "-"}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-[11px] font-semibold uppercase tracking-wide text-[var(--muted)]">
                      {t("AttendanceList.checkOut")}
                    </dt>
                    <dd className="mt-1 text-sm font-medium text-[var(--text)]">
                      {record.check_out || "-"}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-[11px] font-semibold uppercase tracking-wide text-[var(--muted)]">
                      {t("AttendanceList.overtime")}
                    </dt>
                    <dd className="mt-1 text-sm font-medium text-[var(--text)]">
                      {record.overtime_hours || 0}h
                    </dd>
                  </div>
                  <div className="min-[380px]:col-span-2">
                    <dt className="text-[11px] font-semibold uppercase tracking-wide text-[var(--muted)]">
                      {t("AttendanceList.note")}
                    </dt>
                    <dd className="mt-1 break-words text-sm font-medium text-[var(--text)]">
                      {record.note || "-"}
                    </dd>
                  </div>
                </dl>
              </article>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

export default AttendanceList;

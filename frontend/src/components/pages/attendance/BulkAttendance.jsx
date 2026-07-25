import React, { useState, useEffect, useCallback, useMemo } from "react";
import toast from "react-hot-toast";
import useAttendance from "../../../hooks/useAttendance";
import instance from "../../../api/axiosInstance";
import PermissionWrapper from "../../../auth/PermissionWrapper";
import Button from "../../ui/Button";
import { useLanguage } from "../../../hooks/useLanguage";
import { getFriendlyErrorMessage } from "../../../utils/apiErrors";
import CalendarDatePicker from "../../common/CalendarDatePicker";
import { todayIso } from "../../../utils/calendar";

// Compact status indicator dot
const StatusDot = ({ status }) => {
  const colors = {
    present: "bg-green-500",
    half_day: "bg-yellow-500",
    leave: "bg-blue-500",
    absent: "bg-red-500",
  };
  return (
    <span
      className={`inline-block h-2 w-2 rounded-full ${colors[status] || "bg-gray-300"}`}
      title={status}
    />
  );
};

function BulkAttendance() {
  const { bulkMarkAttendance, loading, error, setError } = useAttendance();

  const [employees, setEmployees] = useState([]);
  const [selectedDate, setSelectedDate] = useState(todayIso());
  const [attendanceData, setAttendanceData] = useState({});
  const [isLoadingExisting, setIsLoadingExisting] = useState(false);
  const [result, setResult] = useState(null);
  const [activeDepartment, setActiveDepartment] = useState("all");

  const { t, language, lang, isRTL: isRtlHook } = useLanguage();
  const currentLang = (language || lang || "").toLowerCase();
  const isRTL =
    isRtlHook ??
    ["dari", "pashto", "fa", "ps", "dr", "ar"].includes(currentLang);
  const textAlignment = isRTL ? "text-right" : "text-left";

  // Extract unique departments from employees
  const departments = useMemo(() => {
    const depts = new Set(employees.map((e) => e.department || "unassigned"));
    return ["all", ...Array.from(depts).sort()];
  }, [employees]);

  // Filter employees by department
  const filteredEmployees = useMemo(() => {
    if (activeDepartment === "all") return employees;
    return employees.filter(
      (e) => (e.department || "unassigned") === activeDepartment,
    );
  }, [employees, activeDepartment]);

  // Group employees by department for counts
  const departmentCounts = useMemo(() => {
    const counts = {};
    employees.forEach((emp) => {
      const dept = emp.department || "unassigned";
      counts[dept] = (counts[dept] || 0) + 1;
    });
    return counts;
  }, [employees]);

  const loadEmployees = useCallback(async () => {
    try {
      const res = await instance.get("/employees");
      const data = res?.data?.results ?? res?.data ?? [];
      // Sort by name
      data.sort((a, b) => {
        const nameA = (
          a.full_name || `${a.first_name} ${a.last_name}`
        ).toLowerCase();
        const nameB = (
          b.full_name || `${b.first_name} ${b.last_name}`
        ).toLowerCase();
        return nameA.localeCompare(nameB);
      });
      setEmployees(data);
    } catch (err) {
      setError(getFriendlyErrorMessage(err, t("BulkAttendance.failedLoadEmployees")));
    }
  }, [setError, t]);

  const loadExistingAttendance = useCallback(async () => {
    setIsLoadingExisting(true);
    setError(null);
    try {
      const res = await instance.get("/attendance/", {
        params: { date: selectedDate },
      });
      const records = res?.data?.results ?? res?.data ?? [];
      const mapped = records.reduce((acc, record) => {
        const employeeId =
          typeof record.employee === "object"
            ? record.employee.id
            : record.employee;
        if (!employeeId) return acc;
        acc[employeeId] = {
          employee: employeeId,
          status: record.status || "",
          check_in: record.check_in || "",
          check_out: record.check_out || "",
          overtime_hours:
            record.overtime_hours === 0 || record.overtime_hours
              ? Number(record.overtime_hours)
              : "",
          note: record.note || "",
          isExisting: true,
        };
        return acc;
      }, {});
      setAttendanceData(mapped);
    } catch (err) {
      setError(getFriendlyErrorMessage(err, t("BulkAttendance.failedLoadAttendance")));
    } finally {
      setIsLoadingExisting(false);
    }
  }, [selectedDate, setError, t]);

  useEffect(() => {
    loadEmployees();
  }, [loadEmployees]);

  useEffect(() => {
    loadExistingAttendance();
  }, [loadExistingAttendance]);

  const handleFieldChange = (employeeId, field, value) => {
    setAttendanceData((prev) => {
      const current = prev[employeeId] || { employee: employeeId };
      return {
        ...prev,
        [employeeId]: {
          ...current,
          [field]: value,
          isModified: true,
        },
      };
    });
  };

  const handleStatusChange = (employeeId, status) => {
    handleFieldChange(employeeId, "status", status);
    if (status === "absent") {
      handleFieldChange(employeeId, "check_in", "");
      handleFieldChange(employeeId, "check_out", "");
      handleFieldChange(employeeId, "overtime_hours", "");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setResult(null);

    const records = Object.values(attendanceData).filter((record) => {
      return record?.status && record.status.trim() !== "";
    });

    if (records.length === 0) {
      setError(t("BulkAttendance.markAtLeastOne"));
      return;
    }

    const normalized = records.map((record) => ({
      employee: record.employee,
      status: record.status,
      check_in: record.check_in || null,
      check_out: record.check_out || null,
      overtime_hours:
        record.overtime_hours === "" || record.overtime_hours === null
          ? 0
          : Number(record.overtime_hours) || 0,
      note: record.note?.trim() || "",
    }));

    try {
      const response = await bulkMarkAttendance({
        date: selectedDate,
        records: normalized,
      });
      setResult(response);
      toast.success("Attendance saved.");
      await loadExistingAttendance();
    } catch (err) {
      setError(getFriendlyErrorMessage(err, "Unable to save attendance."));
    }
  };

  // Stats for current view
  const stats = useMemo(() => {
    const data = filteredEmployees.map((e) => attendanceData[e.id]);
    return {
      total: filteredEmployees.length,
      marked: data.filter((d) => d?.status).length,
      existing: data.filter((d) => d?.isExisting && !d?.isModified).length,
      modified: data.filter((d) => d?.isModified).length,
    };
  }, [filteredEmployees, attendanceData]);

  const getDisplayDept = (dept) => {
    if (dept === "all")
      return t("BulkAttendance.allDepartments", { count: employees.length });
    if (dept === "unassigned")
      return t("BulkAttendance.unassigned", {
        count: departmentCounts[dept] || 0,
      });
    return t("BulkAttendance.departmentWithCount", {
      department: dept.charAt(0).toUpperCase() + dept.slice(1),
      count: departmentCounts[dept] || 0,
    });
  };

  return (
    <div className="space-y-4" style={{ backgroundColor: "var(--card)" }}>
      {/* Header Section */}
      <div
        className="rounded-lg border p-4"
        style={{ borderColor: "var(--border)" }}
      >
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-lg font-semibold">
              {t("BulkAttendance.title")}
            </h2>
            <p className="text-xs" style={{ color: "var(--muted)" }}>
              {t("BulkAttendance.markedStats", {
                marked: stats.marked,
                total: stats.total,
                modified: stats.modified,
              })}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <CalendarDatePicker
              value={selectedDate}
              onChange={setSelectedDate}
              module="attendance"
              className="rounded border px-3 py-1.5 text-sm"
              style={{
                borderColor: "var(--border)",
                backgroundColor: "var(--bg)",
                color: "var(--text)",
              }}
            />
            <PermissionWrapper
              permissions={["attendance.create"]}
              fallback={
                <Button
                  type="submit"
                  variant="primary"
                  disabled
                  title={t("BulkAttendance.noPermission")}
                >
                  {t("BulkAttendance.save")}
                </Button>
              }
            >
              <button
                type="button"
                onClick={handleSubmit}
                disabled={loading || isLoadingExisting}
                className="rounded px-4 py-1.5 text-sm font-medium text-white disabled:opacity-60"
                style={{ backgroundColor: "var(--primary)" }}
              >
                {loading
                  ? t("BulkAttendance.saving")
                  : t("BulkAttendance.saveAll")}
              </button>
            </PermissionWrapper>
          </div>
        </div>

        {error && (
          <div className="mt-3 rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </div>
        )}

        {result && (
          <div
            className="mt-3 rounded border px-3 py-2 text-sm"
            style={{
              borderColor: "var(--border)",
              backgroundColor: "var(--hover)",
            }}
          >
            <span className="font-medium" style={{ color: "var(--success)" }}>
              {result.created_count || 0} {t("BulkAttendance.created")}
            </span>
            ,{" "}
            <span className="font-medium" style={{ color: "var(--primary)" }}>
              {result.updated_count || 0} {t("BulkAttendance.updated")}
            </span>
            {result.error_count > 0 && (
              <span
                className="ml-2 font-medium"
                style={{ color: "var(--danger)" }}
              >
                {result.error_count} {t("BulkAttendance.errors")}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Department Tabs */}
      <div className="border-b" style={{ borderColor: "var(--border)" }}>
        <div className="flex gap-1 overflow-x-auto pb-1">
          {departments.map((dept) => (
            <button
              key={dept}
              onClick={() => setActiveDepartment(dept)}
              className="whitespace-nowrap rounded-t-lg px-4 py-2 text-sm font-medium transition-colors"
              style={{
                backgroundColor:
                  activeDepartment === dept ? "var(--bg)" : "transparent",
                color:
                  activeDepartment === dept ? "var(--primary)" : "var(--muted)",
                borderBottom:
                  activeDepartment === dept
                    ? "2px solid var(--primary)"
                    : "none",
              }}
            >
              {getDisplayDept(dept)}
            </button>
          ))}
        </div>
      </div>

      {/* Compact Table */}
      <div
        className="rounded-lg border"
        style={{ borderColor: "var(--border)", backgroundColor: "var(--bg)" }}
        dir={isRTL ? "rtl" : "ltr"}
      >
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead
              className={`sticky top-0 ${textAlignment} text-xs uppercase`}
              style={{ backgroundColor: "var(--hover)", color: "var(--muted)" }}
            >
              <tr>
                <th className={`px-3 py-2 font-medium ${textAlignment}`}>
                  {t("BulkAttendance.employee")}
                </th>
                <th className={`px-3 py-2 font-medium w-28 ${textAlignment}`}>
                  {t("BulkAttendance.status")}
                </th>
                <th className={`px-3 py-2 font-medium w-24 ${textAlignment}`}>
                  {t("BulkAttendance.in")}
                </th>
                <th className={`px-3 py-2 font-medium w-24 ${textAlignment}`}>
                  {t("BulkAttendance.out")}
                </th>
                <th className={`px-3 py-2 font-medium w-20 ${textAlignment}`}>
                  {t("BulkAttendance.ot")}
                </th>
                <th className={`px-3 py-2 font-medium ${textAlignment}`}>
                  {t("BulkAttendance.note")}
                </th>
                <th className="px-3 py-2 font-medium w-8"></th>
              </tr>
            </thead>
            <tbody
              className="divide-y"
              style={{ borderColor: "var(--border)" }}
            >
              {filteredEmployees.length === 0 ? (
                <tr>
                  <td
                    colSpan={7}
                    className="px-3 py-8 text-center text-sm"
                    style={{ color: "var(--muted)" }}
                  >
                    {t("BulkAttendance.noEmployees")}
                  </td>
                </tr>
              ) : (
                filteredEmployees.map((emp) => {
                  const data = attendanceData[emp.id] || {};
                  const isAbsent = data.status === "absent";
                  const hasData = !!data.status;
                  const isExisting = data.isExisting && !data.isModified;
                  const isModified = data.isModified;

                  return (
                    <tr
                      key={emp.id}
                      className="hover:opacity-80 transition-opacity"
                      style={{
                        backgroundColor: isModified
                          ? "rgba(251, 191, 36, 0.1)" // Light amber for modified
                          : isExisting
                            ? "rgba(34, 197, 94, 0.05)" // Very light green for existing
                            : "transparent",
                      }}
                    >
                      <td className={`px-3 py-2 ${textAlignment}`}>
                        <div className="font-medium text-sm">
                          {emp.full_name ||
                            `${emp.first_name} ${emp.last_name}`}
                        </div>
                        <div
                          className="text-xs"
                          style={{ color: "var(--muted)" }}
                        >
                          {emp.employee_id}
                        </div>
                      </td>

                      <td className={`px-3 py-2 ${textAlignment}`}>
                        <select
                          value={data.status || ""}
                          onChange={(e) =>
                            handleStatusChange(emp.id, e.target.value)
                          }
                          className="w-full rounded border px-2 py-1 text-xs"
                          style={{
                            borderColor: "var(--border)",
                            backgroundColor: "var(--bg)",
                            color: "var(--text)",
                          }}
                        >
                          <option value="">
                            {t("BulkAttendance.statusOptions.empty")}
                          </option>
                          <option value="present">
                            {t("BulkAttendance.statusOptions.present")}
                          </option>
                          <option value="absent">
                            {t("BulkAttendance.statusOptions.absent")}
                          </option>
                          <option value="half_day">
                            {t("BulkAttendance.statusOptions.halfDay")}
                          </option>
                          <option value="leave">
                            {t("BulkAttendance.statusOptions.leave")}
                          </option>
                        </select>
                      </td>

                      <td className={`px-3 py-2 ${textAlignment}`}>
                        <input
                          type="time"
                          value={data.check_in || ""}
                          onChange={(e) =>
                            handleFieldChange(
                              emp.id,
                              "check_in",
                              e.target.value,
                            )
                          }
                          disabled={!hasData || isAbsent}
                          className="w-full rounded border px-1 py-1 text-xs disabled:opacity-40"
                          style={{
                            borderColor: "var(--border)",
                            backgroundColor: "var(--bg)",
                            color: "var(--text)",
                          }}
                        />
                      </td>

                      <td className={`px-3 py-2 ${textAlignment}`}>
                        <input
                          type="time"
                          value={data.check_out || ""}
                          onChange={(e) =>
                            handleFieldChange(
                              emp.id,
                              "check_out",
                              e.target.value,
                            )
                          }
                          disabled={!hasData || isAbsent || !data.check_in}
                          className="w-full rounded border px-1 py-1 text-xs disabled:opacity-40"
                          style={{
                            borderColor: "var(--border)",
                            backgroundColor: "var(--bg)",
                            color: "var(--text)",
                          }}
                        />
                      </td>

                      <td className={`px-3 py-2 ${textAlignment}`}>
                        <input
                          type="number"
                          step="0.5"
                          min="0"
                          value={data.overtime_hours ?? ""}
                          onChange={(e) =>
                            handleFieldChange(
                              emp.id,
                              "overtime_hours",
                              e.target.value,
                            )
                          }
                          disabled={!hasData || isAbsent}
                          className="w-full rounded border px-1 py-1 text-xs disabled:opacity-40"
                          style={{
                            borderColor: "var(--border)",
                            backgroundColor: "var(--bg)",
                            color: "var(--text)",
                          }}
                          placeholder={t("BulkAttendance.placeholderOvertime")}
                        />
                      </td>

                      <td className={`px-3 py-2 ${textAlignment}`}>
                        <input
                          type="text"
                          value={data.note || ""}
                          onChange={(e) =>
                            handleFieldChange(emp.id, "note", e.target.value)
                          }
                          className="w-full rounded border px-2 py-1 text-xs"
                          style={{
                            borderColor: "var(--border)",
                            backgroundColor: "var(--bg)",
                            color: "var(--text)",
                          }}
                          placeholder={t("BulkAttendance.placeholderNote")}
                        />
                      </td>

                      <td className="px-3 py-2 text-center">
                        {isExisting && <StatusDot status={data.status} />}
                        {isModified && (
                          <span
                            className="text-xs text-amber-600 font-bold"
                            title={t("BulkAttendance.modified")}
                          >
                            *
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Legend */}
      <div
        className="flex flex-wrap gap-4 text-xs"
        style={{ color: "var(--muted)" }}
      >
        <span className="flex items-center gap-1">
          <span className="h-2 w-2 rounded-full bg-green-500"></span>{" "}
          {t("BulkAttendance.present")}
        </span>
        <span className="flex items-center gap-1">
          <span className="h-2 w-2 rounded-full bg-red-500"></span>{" "}
          {t("BulkAttendance.absent")}
        </span>
        <span className="flex items-center gap-1">
          <span className="h-2 w-2 rounded-full bg-yellow-500"></span>{" "}
          {t("BulkAttendance.halfDay")}
        </span>
        <span className="flex items-center gap-1">
          <span className="h-2 w-2 rounded-full bg-blue-500"></span>{" "}
          {t("BulkAttendance.leave")}
        </span>
        <span className="flex items-center gap-1">
          <span className="h-2 w-2 rounded-full bg-gray-300"></span>{" "}
          {t("BulkAttendance.notMarked")}
        </span>
        <span className="ml-auto">* {t("BulkAttendance.modified")}</span>
      </div>
    </div>
  );
}

export default BulkAttendance;

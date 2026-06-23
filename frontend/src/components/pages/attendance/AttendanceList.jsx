import React, { useState, useEffect } from "react";
import useAttendance from "../../../hooks/useAttendance";

function AttendanceList() {
  const { loading, error, setError, fetchAttendance, deleteAttendance } =
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

  useEffect(() => {
    loadAttendance();
  }, [filters]);

  const loadAttendance = async () => {
    try {
      const data = await fetchAttendance(filters);
      setAttendance(data.results || data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this record?")) {
      try {
        await deleteAttendance(id);
        loadAttendance();
      } catch (err) {
        console.error(err);
      }
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
      await fetchAttendance.updateAttendance(id, editForm);
      setEditingId(null);
      loadAttendance();
    } catch (err) {
      console.error(err);
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
    <div className="space-y-6">
      {/* Filters */}
      <div
        className="rounded-lg border p-6"
        style={{ backgroundColor: "var(--card)", borderColor: "var(--border)" }}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Filters</h2>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="text-sm px-4 py-2 rounded-lg border"
            style={{ borderColor: "var(--border)", color: "var(--text)" }}
          >
            {showFilters ? "Hide Filters" : "Show Filters"}
          </button>
        </div>

        {showFilters && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label
                className="block text-sm font-medium mb-2"
                style={{ color: "var(--muted)" }}
              >
                Employee ID
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
                placeholder="Enter employee ID"
              />
            </div>

            <div>
              <label
                className="block text-sm font-medium mb-2"
                style={{ color: "var(--muted)" }}
              >
                Status
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
                <option value="">All Statuses</option>
                <option value="present">Present</option>
                <option value="absent">Absent</option>
                <option value="half_day">Half Day</option>
                <option value="leave">Leave</option>
              </select>
            </div>

            <div>
              <label
                className="block text-sm font-medium mb-2"
                style={{ color: "var(--muted)" }}
              >
                Date
              </label>
              <input
                type="date"
                value={filters.date}
                onChange={(e) =>
                  setFilters({ ...filters, date: e.target.value })
                }
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
                Month
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
                <option value="">All Months</option>
                {Array.from({ length: 12 }, (_, i) => (
                  <option key={i + 1} value={i + 1}>
                    {new Date(2024, i).toLocaleString("default", {
                      month: "long",
                    })}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label
                className="block text-sm font-medium mb-2"
                style={{ color: "var(--muted)" }}
              >
                Year
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
                <option value="">All Years</option>
                {[2024, 2025, 2026].map((year) => (
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
                Search
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
                placeholder="Search by name or ID"
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
                Clear Filters
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
      >
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr style={{ backgroundColor: "var(--card)" }}>
                <th
                  className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider"
                  style={{ color: "var(--muted)" }}
                >
                  Employee
                </th>
                <th
                  className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider"
                  style={{ color: "var(--muted)" }}
                >
                  Date
                </th>
                <th
                  className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider"
                  style={{ color: "var(--muted)" }}
                >
                  Status
                </th>
                <th
                  className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider"
                  style={{ color: "var(--muted)" }}
                >
                  Check In
                </th>
                <th
                  className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider"
                  style={{ color: "var(--muted)" }}
                >
                  Check Out
                </th>
                <th
                  className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider"
                  style={{ color: "var(--muted)" }}
                >
                  Overtime
                </th>
                <th
                  className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider"
                  style={{ color: "var(--muted)" }}
                >
                  Note
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
                    colSpan="8"
                    className="px-6 py-8 text-center"
                    style={{ color: "var(--muted)" }}
                  >
                    Loading...
                  </td>
                </tr>
              ) : attendance.length === 0 ? (
                <tr>
                  <td
                    colSpan="8"
                    className="px-6 py-8 text-center"
                    style={{ color: "var(--muted)" }}
                  >
                    No attendance records found
                  </td>
                </tr>
              ) : (
                attendance.map((record) => (
                  <tr
                    key={record.id}
                    style={{ backgroundColor: "var(--bg)" }}
                    className="hover:opacity-80 transition-opacity"
                  >
                    <td className="px-6 py-4">
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
                    <td className="px-6 py-4 text-sm">{record.date}</td>
                    <td className="px-6 py-4">
                      {getStatusBadge(record.status)}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      {record.check_in || "-"}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      {record.check_out || "-"}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      {record.overtime_hours || 0}h
                    </td>
                    <td className="px-6 py-4 text-sm max-w-xs truncate">
                      {record.note || "-"}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default AttendanceList;

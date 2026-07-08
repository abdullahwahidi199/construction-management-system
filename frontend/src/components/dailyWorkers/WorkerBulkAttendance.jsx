import React, { useState, useEffect, useMemo } from "react";
import { useDailyWorkers } from "../../hooks/useDailyWorkers";
import { useLanguage } from "../../hooks/useLanguage";

function WorkerBulkAttendance() {
  const { fetchDailyStatus, bulkMarkAttendance, loading, error } =
    useDailyWorkers();
  const { t, language } = useLanguage();
  const isRTL = ["fa", "ps", "dari", "pashto"].includes(language);
  const textAlignment = isRTL ? "text-right" : "text-left";

  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [projectSite, setProjectSite] = useState("");
  const [workersData, setWorkersData] = useState([]);
  const [stats, setStats] = useState(null);

  useEffect(() => {
    loadStatus();
  }, [date]);

  const loadStatus = async () => {
    try {
      const data = await fetchDailyStatus(date);
      setStats(data);

      // Combine unmarked and marked into one editable list
      const combined = [
        ...data.unmarked_workers.map((w) => ({
          workerId: w.id,
          name: w.full_name,
          trade: w.trade,
          status: "present", // default to present for quick marking
          overtime_hours: "",
          notes: "",
          isMarked: false,
        })),
        ...data.marked_records.map((r) => ({
          workerId: r.worker,
          name: r.worker_name,
          trade: r.trade,
          status: r.status,
          overtime_hours: r.overtime_hours || "",
          notes: r.notes || "",
          isMarked: true,
        })),
      ];
      setWorkersData(combined);
    } catch (err) {
      console.error(err);
    }
  };

  const handleUpdate = (workerId, field, value) => {
    setWorkersData((prev) =>
      prev.map((w) => (w.workerId === workerId ? { ...w, [field]: value } : w)),
    );
  };

  const handleSaveAll = async () => {
    const payload = {
      date,
      project_site: projectSite,
      records: workersData.map((w) => ({
        worker: w.workerId,
        status: w.status,
        overtime_hours: Number(w.overtime_hours) || 0,
        notes: w.notes,
      })),
    };

    try {
      await bulkMarkAttendance(payload);
      alert("Attendance Saved!");
      loadStatus();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-4" dir={isRTL ? "rtl" : "ltr"}>
      <div
        className="rounded-lg border p-4 flex flex-wrap gap-4 items-center justify-between"
        style={{ backgroundColor: "var(--card)", borderColor: "var(--border)" }}
      >
        <div className="flex gap-4 items-center">
          <div>
            <label className="text-xs" style={{ color: "var(--muted)" }}>
              Date
            </label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="block rounded border px-3 py-1.5 text-sm"
              style={{
                borderColor: "var(--border)",
                backgroundColor: "var(--bg)",
                color: "var(--text)",
              }}
            />
          </div>
          <div>
            <label className="text-xs" style={{ color: "var(--muted)" }}>
              Project / Site
            </label>
            <input
              type="text"
              value={projectSite}
              onChange={(e) => setProjectSite(e.target.value)}
              placeholder="e.g. Block A"
              className="block rounded border px-3 py-1.5 text-sm"
              style={{
                borderColor: "var(--border)",
                backgroundColor: "var(--bg)",
                color: "var(--text)",
              }}
            />
          </div>
        </div>
        <button
          onClick={handleSaveAll}
          disabled={loading}
          className="rounded px-6 py-2 text-sm font-medium text-white transition disabled:opacity-50"
          style={{ backgroundColor: "var(--primary)" }}
        >
          {loading ? "Saving..." : "Save All Attendance"}
        </button>
      </div>

      <div
        className="rounded-lg border"
        style={{ borderColor: "var(--border)", backgroundColor: "var(--bg)" }}
      >
        <table className="w-full text-sm">
          <thead
            className="uppercase text-xs"
            style={{ backgroundColor: "var(--hover)", color: "var(--muted)" }}
          >
            <tr>
              <th className={`px-4 py-3 font-medium ${textAlignment}`}>
                Worker
              </th>
              <th className={`px-4 py-3 font-medium ${textAlignment}`}>
                Trade
              </th>
              <th className={`px-4 py-3 font-medium ${textAlignment}`}>
                Status
              </th>
              <th className={`px-4 py-3 font-medium ${textAlignment}`}>
                Overtime (Hrs)
              </th>
              <th className={`px-4 py-3 font-medium ${textAlignment}`}>
                Notes
              </th>
            </tr>
          </thead>
          <tbody className="divide-y" style={{ borderColor: "var(--border)" }}>
            {workersData.map((w) => (
              <tr
                key={w.workerId}
                style={{
                  backgroundColor: w.isMarked
                    ? "rgba(34, 197, 94, 0.05)"
                    : "transparent",
                }}
              >
                <td className={`px-4 py-3 font-medium ${textAlignment}`}>
                  {w.name}
                </td>
                <td
                  className={`px-4 py-3 ${textAlignment}`}
                  style={{ color: "var(--muted)" }}
                >
                  <span className="px-2 py-1 rounded bg-gray-100 dark:bg-gray-800 text-xs capitalize">
                    {w.trade.replace("_", " ")}
                  </span>
                </td>
                <td className={`px-4 py-3 ${textAlignment}`}>
                  <select
                    value={w.status}
                    onChange={(e) =>
                      handleUpdate(w.workerId, "status", e.target.value)
                    }
                    className="rounded border px-2 py-1"
                    style={{
                      borderColor: "var(--border)",
                      backgroundColor: "var(--bg)",
                      color: "var(--text)",
                    }}
                  >
                    <option value="present">Present (Full Day)</option>
                    <option value="half_day">Half Day</option>
                    <option value="absent">Absent</option>
                  </select>
                </td>
                <td className={`px-4 py-3 ${textAlignment}`}>
                  <input
                    type="number"
                    step="0.5"
                    disabled={w.status === "absent"}
                    value={w.overtime_hours}
                    onChange={(e) =>
                      handleUpdate(w.workerId, "overtime_hours", e.target.value)
                    }
                    className="w-20 rounded border px-2 py-1 disabled:opacity-50"
                    style={{
                      borderColor: "var(--border)",
                      backgroundColor: "var(--bg)",
                      color: "var(--text)",
                    }}
                  />
                </td>
                <td className={`px-4 py-3 ${textAlignment}`}>
                  <input
                    type="text"
                    value={w.notes}
                    onChange={(e) =>
                      handleUpdate(w.workerId, "notes", e.target.value)
                    }
                    className="w-full rounded border px-2 py-1"
                    placeholder="Optional note..."
                    style={{
                      borderColor: "var(--border)",
                      backgroundColor: "var(--bg)",
                      color: "var(--text)",
                    }}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default WorkerBulkAttendance;

import React, { useState, useEffect } from "react";
import { useDailyWorkers } from "../../hooks/useDailyWorkers";
import { useLanguage } from "../../hooks/useLanguage";
import AddWorkerModal from "./AddWorkerModal";

function WorkersList() {
  const { fetchWorkers, loading } = useDailyWorkers();
  const { t, language } = useLanguage();
  const isRTL = ["fa", "ps", "dari", "pashto"].includes(language);
  const textAlignment = isRTL ? "text-right" : "text-left";

  const [workers, setWorkers] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    loadWorkers();
  }, []);

  const loadWorkers = async () => {
    try {
      const data = await fetchWorkers();
      setWorkers(data);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-4" dir={isRTL ? "rtl" : "ltr"}>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold">Construction Workers</h2>
        {/* Placeholder for "Add Worker" Modal Trigger */}
        <AddWorkerModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onSuccess={loadWorkers}
        />

        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">Construction Workers</h2>

          {/* 4. Fix the fucking button ;) */}
          <button
            onClick={() => setIsModalOpen(true)}
            className="rounded px-4 py-2 text-sm text-white"
            style={{ backgroundColor: "var(--primary)" }}
          >
            + Add Worker
          </button>
        </div>
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
                ID & Name
              </th>
              <th className={`px-4 py-3 font-medium ${textAlignment}`}>
                Trade
              </th>
              <th className={`px-4 py-3 font-medium ${textAlignment}`}>
                Daily Rate
              </th>
              <th className={`px-4 py-3 font-medium ${textAlignment}`}>
                Status
              </th>
            </tr>
          </thead>
          <tbody className="divide-y" style={{ borderColor: "var(--border)" }}>
            {loading ? (
              <tr>
                <td colSpan="4" className="text-center py-6">
                  Loading...
                </td>
              </tr>
            ) : (
              workers.map((w) => (
                <tr key={w.id} className="hover:opacity-80">
                  <td className={`px-4 py-3 ${textAlignment}`}>
                    <div className="font-medium">{w.full_name}</div>
                    <div className="text-xs" style={{ color: "var(--muted)" }}>
                      {w.worker_id}
                    </div>
                  </td>
                  <td className={`px-4 py-3 capitalize ${textAlignment}`}>
                    {w.trade.replace("_", " ")}
                  </td>
                  <td className={`px-4 py-3 ${textAlignment}`}>
                    <div className="font-medium">
                      {w.daily_rate} {w.currency}
                    </div>
                    <div className="text-xs" style={{ color: "var(--muted)" }}>
                      OT: {w.overtime_hourly_rate} {w.currency}/h
                    </div>
                  </td>
                  <td className={`px-4 py-3 ${textAlignment}`}>
                    {w.is_active ? (
                      <span className="h-2 w-2 rounded-full bg-green-500 inline-block mr-2"></span>
                    ) : (
                      <span className="h-2 w-2 rounded-full bg-red-500 inline-block mr-2"></span>
                    )}
                    {w.is_active ? "Active" : "Inactive"}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default WorkersList;

import React, { useState, useEffect } from "react";
import { Edit2, Plus, RefreshCw, Trash2 } from "lucide-react";
import { useDailyWorkers } from "../../hooks/useDailyWorkers";
import { useLanguage } from "../../hooks/useLanguage";
import { useAuth } from "../../auth/AuthContext";
import AddWorkerModal from "./AddWorkerModal";
import useFetch from "../../hooks/useFetch";
import { hasAnyPermission } from "../../../utils/permissions";
import ConfirmDialog from "../common/ConfirmDialog";
import toast from "react-hot-toast";

function WorkersList() {
  const { fetchWorkers, fetchWorkerDetail, deleteWorker, loading } =
    useDailyWorkers();
  const { data: projects = [] } = useFetch("projects/");

  const { t, language } = useLanguage();
  const { permissions } = useAuth();
  const canCreate = hasAnyPermission(permissions, ["daily_workers.create"]);
  const canUpdate = hasAnyPermission(permissions, ["daily_workers.update"]);
  const canDelete = hasAnyPermission(permissions, ["daily_workers.delete"]);
  const canManage = canUpdate || canDelete;
  const isRTL = ["fa", "ps", "dari", "pashto"].includes(language);
  const textAlignment = isRTL ? "text-right" : "text-left";

  const [workers, setWorkers] = useState([]);
  const [search, setSearch] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedWorker, setSelectedWorker] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);

  useEffect(() => {
    loadWorkers();
  }, [search]);

  const loadWorkers = async () => {
    try {
      const data = await fetchWorkers({ search });
      setWorkers(data);
    } catch (err) {
      // Central axios handling shows the user-facing error.
    }
  };

  const handleAdd = () => {
    setSelectedWorker(null);
    setIsModalOpen(true);
  };

  const handleEdit = async (workerId) => {
    try {
      const data = await fetchWorkerDetail(workerId);
      setSelectedWorker(data.worker);
      setIsModalOpen(true);
    } catch (err) {
      toast.error(t("workersList.couldNotLoadWorkerDetails"));
    }
  };

  const handleDelete = async (worker) => {
    setDeleteTarget(worker);
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteWorker(deleteTarget.id);
      toast.success("Worker deleted.");
      setDeleteTarget(null);
      await loadWorkers();
    } catch (err) {
      toast.error(t("workersList.couldNotDeleteWorker"));
    }
  };

  return (
    <div className="space-y-4" dir={isRTL ? "rtl" : "ltr"}>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <h2 className="text-xl font-bold">{t("constructionWorkers")}</h2>
        <div className="flex flex-wrap items-center gap-2">
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t("workersList.searchWorkersPlaceholder")}
            className="rounded border px-3 py-2 text-sm outline-none"
            style={{
              borderColor: "var(--border)",
              backgroundColor: "var(--bg)",
              color: "var(--text)",
            }}
          />
          <button
            onClick={loadWorkers}
            className="rounded border p-2"
            style={{ borderColor: "var(--border)" }}
            title={t("refresh")}
            aria-label={t("refresh")}
          >
            <RefreshCw className="h-4 w-4" />
          </button>
          {canCreate && (
            <button
              onClick={handleAdd}
              className="inline-flex items-center gap-2 rounded px-4 py-2 text-sm text-white"
              style={{ backgroundColor: "var(--primary)" }}
            >
              <Plus className="h-4 w-4" />
              {t("workersList.addWorker")}
            </button>
          )}
        </div>
      </div>

      <AddWorkerModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={loadWorkers}
        worker={selectedWorker}
        projects={projects}
      />
      <ConfirmDialog
        isOpen={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={confirmDelete}
        title={t("workersList.deleteWorker")}
        message={t("workersList.deleteConfirmation", {
          name: deleteTarget?.full_name || "",
        })}
        loading={loading}
        confirmLabel="Delete"
      />

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
                {t("workersList.idAndName")}
              </th>
              <th className={`px-4 py-3 font-medium ${textAlignment}`}>
                {t("workersList.trade")}
              </th>
              <th className={`px-4 py-3 font-medium ${textAlignment}`}>
                {t("workersList.dailyRate")}
              </th>
              <th className={`px-4 py-3 font-medium ${textAlignment}`}>
                {t("workersList.status")}
              </th>
              {canManage && (
                <th className={`px-4 py-3 font-medium ${textAlignment}`}>
                  {t("workersList.actions")}
                </th>
              )}
            </tr>
          </thead>
          <tbody className="divide-y" style={{ borderColor: "var(--border)" }}>
            {loading ? (
              <tr>
                <td colSpan={canManage ? 5 : 4} className="text-center py-6">
                  {t("workersList.loading")}
                </td>
              </tr>
            ) : workers.length === 0 ? (
              <tr>
                <td
                  colSpan={canManage ? 5 : 4}
                  className="text-center py-6"
                  style={{ color: "var(--muted)" }}
                >
                  {t("workersList.noWorkersFound")}
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
                    {(w.trade || w.skill_type || "").replace("_", " ")}
                    {w.assigned_project_name && (
                      <div
                        className="text-xs normal-case"
                        style={{ color: "var(--muted)" }}
                      >
                        {w.assigned_project_name}
                      </div>
                    )}
                  </td>
                  <td className={`px-4 py-3 ${textAlignment}`}>
                    <div className="font-medium">
                      {w.daily_rate} {w.currency}
                    </div>
                    <div className="text-xs" style={{ color: "var(--muted)" }}>
                      {t("workersList.overtimeRate", {
                        rate: w.overtime_hourly_rate,
                        currency: w.currency,
                      })}
                    </div>
                  </td>
                  <td className={`px-4 py-3 ${textAlignment}`}>
                    {w.status === "active" ? (
                      <span className="h-2 w-2 rounded-full bg-green-500 inline-block me-2"></span>
                    ) : (
                      <span className="h-2 w-2 rounded-full bg-red-500 inline-block me-2"></span>
                    )}
                    {w.status === "active" ? t("active") : t("inactive")}
                  </td>
                  {canManage && (
                    <td className={`px-4 py-3 ${textAlignment}`}>
                      <div className="flex items-center gap-2">
                        {canUpdate && (
                          <button
                            onClick={() => handleEdit(w.id)}
                            className="rounded border p-2"
                            style={{ borderColor: "var(--border)" }}
                            title={t("editWorker")}
                            aria-label={t("editWorkerAria", { name: w.full_name })}
                          >
                            <Edit2 className="h-4 w-4" />
                          </button>
                        )}
                        {canDelete && (
                          <button
                            onClick={() => handleDelete(w)}
                            className="rounded border p-2 text-red-600"
                            style={{ borderColor: "var(--border)" }}
                            title={t("deleteWorker")}
                            aria-label={t("deleteWorkerAria", {
                              name: w.full_name,
                            })}
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  )}
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

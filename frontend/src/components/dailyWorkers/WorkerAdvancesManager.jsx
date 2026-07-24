import React, { useEffect, useMemo, useState } from "react";
import { Edit2, Plus, RefreshCw, Trash2 } from "lucide-react";
import { useAuth } from "../../auth/AuthContext";
import { useDailyWorkers } from "../../hooks/useDailyWorkers";
import { hasAnyPermission } from "../../../utils/permissions";
import ConfirmDialog from "../common/ConfirmDialog";
import { getFriendlyErrorMessage } from "../../utils/apiErrors";
import toast from "react-hot-toast";

const blankAdvance = {
  worker: "",
  amount: "",
  currency: "AFN",
  date: new Date().toISOString().slice(0, 10),
  description: "",
  remaining_balance: "",
};

function money(value, currency) {
  return `${currency} ${Number(value || 0).toLocaleString("en-US", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })}`;
}

export default function WorkerAdvancesManager() {
  const {
    fetchWorkers,
    fetchAdvances,
    createAdvance,
    updateAdvance,
    deleteAdvance,
    loading,
  } = useDailyWorkers();
  const { permissions } = useAuth();

  const canCreate = hasAnyPermission(permissions, ["worker_advances.create"]);
  const canUpdate = hasAnyPermission(permissions, ["worker_advances.update"]);
  const canDelete = hasAnyPermission(permissions, ["worker_advances.delete"]);
  const canManage = canUpdate || canDelete;

  const [workers, setWorkers] = useState([]);
  const [advances, setAdvances] = useState([]);
  const [workerFilter, setWorkerFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedAdvance, setSelectedAdvance] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const load = async () => {
    const params = {};
    if (workerFilter) params.worker = workerFilter;
    if (statusFilter) params.status = statusFilter;
    const [workerData, advanceData] = await Promise.all([
      fetchWorkers(),
      fetchAdvances(params),
    ]);
    setWorkers(workerData);
    setAdvances(advanceData);
  };

  useEffect(() => {
    load().catch(() => {});
  }, [workerFilter, statusFilter]);

  const summary = useMemo(
    () =>
      advances.reduce(
        (acc, advance) => {
          const currency = advance.currency || "AFN";
          acc[currency].total += Number(advance.amount || 0);
          acc[currency].remaining += Number(advance.remaining_balance || 0);
          acc[currency].count += 1;
          return acc;
        },
        {
          AFN: { total: 0, remaining: 0, count: 0 },
          USD: { total: 0, remaining: 0, count: 0 },
        },
      ),
    [advances],
  );

  const handleSubmit = async (payload) => {
    if (selectedAdvance?.id) {
      await updateAdvance(selectedAdvance.id, payload);
      toast.success("Advance updated.");
    } else {
      await createAdvance(payload);
      toast.success("Advance created.");
    }
    setModalOpen(false);
    setSelectedAdvance(null);
    await load();
  };

  const handleDelete = async (advance) => {
    setDeleteTarget(advance);
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteAdvance(deleteTarget.id);
      toast.success("Advance deleted.");
      setDeleteTarget(null);
      await load();
    } catch {
      // Central axios handling shows the user-facing error.
    }
  };

  return (
    <div className="space-y-5">
      <AdvanceModal
        open={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setSelectedAdvance(null);
        }}
        onSubmit={handleSubmit}
        advance={selectedAdvance}
        workers={workers}
        loading={loading}
      />
      <ConfirmDialog
        isOpen={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={confirmDelete}
        title="Delete advance"
        message={`Delete advance for ${deleteTarget?.worker_name || "this worker"}? This action cannot be undone.`}
        loading={loading}
        confirmLabel="Delete"
      />

      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold">Worker Advances</h2>
          <p className="text-sm" style={{ color: "var(--muted)" }}>
            Track advance payments and remaining balances for daily workers.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <select
            value={workerFilter}
            onChange={(e) => setWorkerFilter(e.target.value)}
            className="rounded border px-3 py-2 text-sm"
            style={{
              borderColor: "var(--border)",
              backgroundColor: "var(--bg)",
              color: "var(--text)",
            }}
          >
            <option value="">All workers</option>
            {workers.map((worker) => (
              <option key={worker.id} value={worker.id}>
                {worker.full_name}
              </option>
            ))}
          </select>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded border px-3 py-2 text-sm"
            style={{
              borderColor: "var(--border)",
              backgroundColor: "var(--bg)",
              color: "var(--text)",
            }}
          >
            <option value="">All statuses</option>
            <option value="open">Open</option>
            <option value="paid">Paid</option>
          </select>
          <button
            onClick={load}
            className="rounded border p-2"
            style={{ borderColor: "var(--border)" }}
            title="Refresh"
            aria-label="Refresh advances"
          >
            <RefreshCw className="h-4 w-4" />
          </button>
          {canCreate && (
            <button
              onClick={() => {
                setSelectedAdvance(null);
                setModalOpen(true);
              }}
              className="inline-flex items-center gap-2 rounded px-4 py-2 text-sm text-white"
              style={{ backgroundColor: "var(--primary)" }}
            >
              <Plus className="h-4 w-4" />
              Add Advance
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {["AFN", "USD"].map((currency) => (
          <div
            key={currency}
            className="rounded-lg border p-4"
            style={{
              borderColor: "var(--border)",
              backgroundColor: "var(--card)",
            }}
          >
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">{currency}</h3>
              <span className="text-xs" style={{ color: "var(--muted)" }}>
                {summary[currency].count} records
              </span>
            </div>
            <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
              <div>
                <p style={{ color: "var(--muted)" }}>Total advanced</p>
                <p className="font-semibold">{money(summary[currency].total, currency)}</p>
              </div>
              <div>
                <p style={{ color: "var(--muted)" }}>Remaining</p>
                <p className="font-semibold">{money(summary[currency].remaining, currency)}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div
        className="overflow-x-auto rounded-lg border"
        style={{ borderColor: "var(--border)", backgroundColor: "var(--bg)" }}
      >
        <table className="w-full text-sm">
          <thead
            className="uppercase text-xs"
            style={{ backgroundColor: "var(--hover)", color: "var(--muted)" }}
          >
            <tr>
              <th className="px-4 py-3 text-left font-medium">Worker</th>
              <th className="px-4 py-3 text-left font-medium">Date</th>
              <th className="px-4 py-3 text-left font-medium">Amount</th>
              <th className="px-4 py-3 text-left font-medium">Remaining</th>
              <th className="px-4 py-3 text-left font-medium">Status</th>
              <th className="px-4 py-3 text-left font-medium">Description</th>
              {canManage && <th className="px-4 py-3 text-left font-medium">Actions</th>}
            </tr>
          </thead>
          <tbody className="divide-y" style={{ borderColor: "var(--border)" }}>
            {loading ? (
              <tr>
                <td colSpan={canManage ? 7 : 6} className="py-6 text-center">
                  Loading...
                </td>
              </tr>
            ) : advances.length === 0 ? (
              <tr>
                <td
                  colSpan={canManage ? 7 : 6}
                  className="py-6 text-center"
                  style={{ color: "var(--muted)" }}
                >
                  No advances found.
                </td>
              </tr>
            ) : (
              advances.map((advance) => (
                <tr key={advance.id}>
                  <td className="px-4 py-3">
                    <div className="font-medium">{advance.worker_name}</div>
                    <div className="text-xs" style={{ color: "var(--muted)" }}>
                      {advance.worker_code}
                    </div>
                  </td>
                  <td className="px-4 py-3">{advance.date}</td>
                  <td className="px-4 py-3 font-medium">
                    {money(advance.amount, advance.currency)}
                  </td>
                  <td className="px-4 py-3">
                    {money(advance.remaining_balance, advance.currency)}
                  </td>
                  <td className="px-4 py-3 capitalize">{advance.status}</td>
                  <td className="px-4 py-3">{advance.description || "-"}</td>
                  {canManage && (
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        {canUpdate && (
                          <button
                            onClick={() => {
                              setSelectedAdvance(advance);
                              setModalOpen(true);
                            }}
                            className="rounded border p-2"
                            style={{ borderColor: "var(--border)" }}
                            title="Edit advance"
                          >
                            <Edit2 className="h-4 w-4" />
                          </button>
                        )}
                        {canDelete && (
                          <button
                            onClick={() => handleDelete(advance)}
                            className="rounded border p-2 text-red-600"
                            style={{ borderColor: "var(--border)" }}
                            title="Delete advance"
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

function AdvanceModal({ open, onClose, onSubmit, advance, workers, loading }) {
  const [formData, setFormData] = useState(blankAdvance);
  const [error, setError] = useState("");

  useEffect(() => {
    if (advance) {
      setFormData({
        ...blankAdvance,
        ...advance,
        worker: advance.worker || "",
      });
    } else {
      setFormData(blankAdvance);
    }
    setError("");
  }, [advance, open]);

  if (!open) return null;

  const inputClass = "w-full rounded border px-3 py-2 text-sm outline-none";
  const inputStyle = {
    borderColor: "var(--border)",
    backgroundColor: "var(--bg)",
    color: "var(--text)",
  };

  const handleChange = (event) => {
    const { name, value } = event.target;
    if (name === "amount" && !advance) {
      setFormData((prev) => ({
        ...prev,
        amount: value,
        remaining_balance: prev.remaining_balance || value,
      }));
      return;
    }
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    const payload = {
      ...formData,
      remaining_balance: formData.remaining_balance || formData.amount,
    };
    try {
      await onSubmit(payload);
    } catch (err) {
      setError(getFriendlyErrorMessage(err, "Please check the advance details and try again."));
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div
        className="w-full max-w-2xl rounded-lg border shadow-lg"
        style={{
          backgroundColor: "var(--card)",
          borderColor: "var(--border)",
          color: "var(--text)",
        }}
      >
        <div
          className="flex items-center justify-between border-b p-4"
          style={{ borderColor: "var(--border)" }}
        >
          <h2 className="text-lg font-semibold">
            {advance ? "Edit Advance" : "Add Advance"}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded border px-3 py-1 text-sm"
            style={{ borderColor: "var(--border)" }}
          >
            Close
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 p-4">
          {error && (
            <p className="rounded bg-red-500/10 px-3 py-2 text-sm text-red-600">
              {error}
            </p>
          )}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Field label="Worker *">
              <select
                required
                name="worker"
                value={formData.worker}
                onChange={handleChange}
                className={inputClass}
                style={inputStyle}
              >
                <option value="">Select worker</option>
                {workers.map((worker) => (
                  <option key={worker.id} value={worker.id}>
                    {worker.full_name}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Date *">
              <input
                required
                type="date"
                name="date"
                value={formData.date}
                onChange={handleChange}
                className={inputClass}
                style={inputStyle}
              />
            </Field>
            <Field label="Amount *">
              <input
                required
                type="number"
                min="0.01"
                step="0.01"
                name="amount"
                value={formData.amount}
                onChange={handleChange}
                className={inputClass}
                style={inputStyle}
              />
            </Field>
            <Field label="Remaining Balance">
              <input
                type="number"
                min="0"
                step="0.01"
                name="remaining_balance"
                value={formData.remaining_balance}
                onChange={handleChange}
                className={inputClass}
                style={inputStyle}
              />
            </Field>
            <Field label="Currency">
              <select
                name="currency"
                value={formData.currency}
                onChange={handleChange}
                className={inputClass}
                style={inputStyle}
              >
                <option value="AFN">AFN</option>
                <option value="USD">USD</option>
              </select>
            </Field>
            <div className="md:col-span-2">
              <Field label="Description">
                <textarea
                  name="description"
                  value={formData.description || ""}
                  onChange={handleChange}
                  rows={3}
                  className={inputClass}
                  style={inputStyle}
                />
              </Field>
            </div>
          </div>

          <div
            className="flex justify-end gap-3 border-t pt-4"
            style={{ borderColor: "var(--border)" }}
          >
            <button
              type="button"
              onClick={onClose}
              className="rounded border px-4 py-2 text-sm"
              style={{ borderColor: "var(--border)" }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="rounded px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
              style={{ backgroundColor: "var(--primary)" }}
            >
              {loading ? "Saving..." : "Save Advance"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <label className="block">
      <span
        className="mb-1 block text-xs font-medium"
        style={{ color: "var(--muted)" }}
      >
        {label}
      </span>
      {children}
    </label>
  );
}

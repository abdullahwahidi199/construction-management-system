import React, { useState, useEffect } from "react";
import { Edit2, Plus, Trash2 } from "lucide-react";
import { useDailyWorkers } from "../../hooks/useDailyWorkers";
import { useLanguage } from "../../hooks/useLanguage";
import { useAuth } from "../../auth/AuthContext";
import { hasAnyPermission } from "../../../utils/permissions";
import ConfirmDialog from "../common/ConfirmDialog";
import { getFriendlyErrorMessage } from "../../utils/apiErrors";
import toast from "react-hot-toast";

function WorkerPayrollManager() {
  const {
    fetchPayrolls,
    fetchWorkers,
    fetchProjects,
    createPayroll,
    updatePayroll,
    deletePayroll,
    generatePayrolls,
    approvePayroll,
    markPayrollPaid,
    loading,
    error,
  } = useDailyWorkers();
  const { t, language } = useLanguage();
  const { permissions } = useAuth();
  const canCreate = hasAnyPermission(permissions, ["daily_worker_payroll.create"]);
  const canUpdate = hasAnyPermission(permissions, ["daily_worker_payroll.update"]);
  const canDelete = hasAnyPermission(permissions, ["daily_worker_payroll.delete"]);
  const canManage = canUpdate || canDelete;
  const isRTL = ["fa", "ps", "dari", "pashto"].includes(language);
  const textAlignment = isRTL ? "text-right" : "text-left";

  const [payrolls, setPayrolls] = useState([]);
  const [workers, setWorkers] = useState([]);
  const [projects, setProjects] = useState([]);
  const [selectedPayroll, setSelectedPayroll] = useState(null);
  const [isFormOpen, setIsFormOpen] = useState(false);

  const [periodStart, setPeriodStart] = useState("");
  const [periodEnd, setPeriodEnd] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [generationProject, setGenerationProject] = useState("");
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [markPaidTarget, setMarkPaidTarget] = useState(null);

  useEffect(() => {
    loadPayrolls();
    loadFormData();
  }, []);

  const loadPayrolls = async () => {
    try {
      const data = await fetchPayrolls();
      setPayrolls(data);
    } catch (err) {
      // Central axios handling shows the user-facing error.
    }
  };

  const loadFormData = async () => {
    try {
      const [workerData, projectData] = await Promise.all([
        fetchWorkers({ status: "active" }),
        fetchProjects(),
      ]);
      setWorkers(workerData);
      setProjects(projectData);
    } catch (err) {
      // Central axios handling shows the user-facing error.
    }
  };

  const handleFormSubmit = async (payload) => {
    if (selectedPayroll?.id) {
      await updatePayroll(selectedPayroll.id, payload);
      toast.success("Payroll updated.");
    } else {
      await createPayroll(payload);
      toast.success("Payroll created.");
    }
    setIsFormOpen(false);
    setSelectedPayroll(null);
    await loadPayrolls();
  };

  const handleEdit = (payroll) => {
    setSelectedPayroll(payroll);
    setIsFormOpen(true);
  };

  const handleDelete = async (payroll) => {
    setDeleteTarget(payroll);
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deletePayroll(deleteTarget.id);
      toast.success("Payroll deleted.");
      setDeleteTarget(null);
      await loadPayrolls();
    } catch (err) {
      toast.error(t("WorkerPayrollManager.couldNotDeletePayroll"));
    }
  };

  const handleApprove = async (id) => {
    try {
      await approvePayroll(id);
      toast.success("Payroll approved.");
      await loadPayrolls();
    } catch {
      // Central axios handling shows the user-facing error.
    }
  };

  const handleGenerate = async (e) => {
    e.preventDefault();
    if (!periodStart || !periodEnd)
      return toast.error(t("WorkerPayrollManager.selectDateRange"));

    try {
      const res = await generatePayrolls({
        period_start: periodStart,
        period_end: periodEnd,
        payment_method: paymentMethod,
        project: generationProject || null,
      });
      toast.success(res.message || "Payroll generated.");
      loadPayrolls();
    } catch (err) {
      // Central axios handling shows the user-facing error.
    }
  };

  const handleMarkPaid = async (id) => {
    setMarkPaidTarget(payrolls.find((payroll) => payroll.id === id) || { id });
  };

  const confirmMarkPaid = async () => {
    if (!markPaidTarget) return;
    try {
      await markPayrollPaid(markPaidTarget.id, new Date().toISOString().split("T")[0]);
      toast.success("Payroll marked as paid.");
      setMarkPaidTarget(null);
      loadPayrolls();
    } catch {
      // Central axios handling shows the user-facing error.
    }
  };

  return (
    <div className="space-y-6" dir={isRTL ? "rtl" : "ltr"}>
      <PayrollFormModal
        isOpen={isFormOpen}
        onClose={() => {
          setIsFormOpen(false);
          setSelectedPayroll(null);
        }}
        onSubmit={handleFormSubmit}
        payroll={selectedPayroll}
        workers={workers}
        projects={projects}
        loading={loading}
      />
      <ConfirmDialog
        isOpen={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={confirmDelete}
        title={t("WorkerPayrollManager.deletePayroll")}
        message={t("WorkerPayrollManager.deleteConfirmation", {
          name: deleteTarget?.worker_name || "",
        })}
        loading={loading}
        confirmLabel="Delete"
      />
      <ConfirmDialog
        isOpen={Boolean(markPaidTarget)}
        onClose={() => setMarkPaidTarget(null)}
        onConfirm={confirmMarkPaid}
        title="Mark payroll paid"
        message={t("WorkerPayrollManager.confirmPayment")}
        loading={loading}
        confirmLabel="Mark paid"
        destructive={false}
      />

      <div
        className="rounded-lg border p-6"
        style={{ backgroundColor: "var(--card)", borderColor: "var(--border)" }}
      >
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-lg font-semibold">
            {t("WorkerPayrollManager.title")}
          </h2>
          {canCreate && (
            <button
              type="button"
              onClick={() => {
                setSelectedPayroll(null);
                setIsFormOpen(true);
              }}
              className="inline-flex items-center gap-2 rounded px-4 py-2 text-sm font-medium text-white"
              style={{ backgroundColor: "var(--primary)" }}
            >
              <Plus className="h-4 w-4" />
              {t("WorkerPayrollManager.addPayroll")}
            </button>
          )}
        </div>
        <h3 className="text-sm font-semibold mb-2">
          {t("WorkerPayrollManager.autoGeneratePayroll")}
        </h3>
        <p className="text-sm mb-4" style={{ color: "var(--muted)" }}>
          {t("WorkerPayrollManager.autoGenerateDescription")}
        </p>

        <form
          onSubmit={handleGenerate}
          className="flex flex-wrap gap-4 items-end"
        >
          <div>
            <label
              htmlFor="worker-payroll-period-start"
              className="block text-sm mb-1"
              style={{ color: "var(--muted)" }}
            >
              {t("WorkerPayrollManager.periodStart")}
            </label>
            <input
              id="worker-payroll-period-start"
              type="date"
              required
              value={periodStart}
              onChange={(e) => setPeriodStart(e.target.value)}
              className="rounded border px-3 py-2"
              style={{
                borderColor: "var(--border)",
                backgroundColor: "var(--bg)",
                color: "var(--text)",
              }}
            />
          </div>
          <div>
            <label
              htmlFor="worker-payroll-period-end"
              className="block text-sm mb-1"
              style={{ color: "var(--muted)" }}
            >
              {t("WorkerPayrollManager.periodEnd")}
            </label>
            <input
              id="worker-payroll-period-end"
              type="date"
              required
              value={periodEnd}
              onChange={(e) => setPeriodEnd(e.target.value)}
              className="rounded border px-3 py-2"
              style={{
                borderColor: "var(--border)",
                backgroundColor: "var(--bg)",
                color: "var(--text)",
              }}
            />
          </div>
          <div>
            <label
              htmlFor="worker-payroll-payment-method"
              className="block text-sm mb-1"
              style={{ color: "var(--muted)" }}
            >
              {t("WorkerPayrollManager.defaultMethod")}
            </label>
            <select
              id="worker-payroll-payment-method"
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value)}
              className="rounded border px-3 py-2"
              style={{
                borderColor: "var(--border)",
                backgroundColor: "var(--bg)",
                color: "var(--text)",
              }}
            >
              <option value="cash">
                {t("WorkerPayrollManager.cashOnSite")}
              </option>
              <option value="bank_transfer">
                {t("WorkerPayrollManager.bankTransfer")}
              </option>
              <option value="mobile_money">
                {t("WorkerPayrollManager.mobileMoney")}
              </option>
            </select>
          </div>
          <div>
            <label
              htmlFor="worker-payroll-project"
              className="block text-sm mb-1"
              style={{ color: "var(--muted)" }}
            >
              Project
            </label>
            <select
              id="worker-payroll-project"
              value={generationProject}
              onChange={(e) => setGenerationProject(e.target.value)}
              className="rounded border px-3 py-2"
              style={{
                borderColor: "var(--border)",
                backgroundColor: "var(--bg)",
                color: "var(--text)",
              }}
            >
              <option value="">General / no project</option>
              {projects.map((project) => (
                <option key={project.id} value={project.id}>
                  {project.name}
                </option>
              ))}
            </select>
          </div>
          {canCreate && (
            <button
              type="submit"
              disabled={loading}
              className="rounded px-6 py-2 font-medium text-white transition disabled:opacity-50"
              style={{ backgroundColor: "var(--primary)" }}
            >
              {loading
                ? t("WorkerPayrollManager.generating")
                : t("WorkerPayrollManager.generatePayroll")}
            </button>
          )}
        </form>
        {error && <p className="text-red-500 mt-2 text-sm">{error}</p>}
      </div>

      <div
        className="rounded-lg border"
        style={{ borderColor: "var(--border)", backgroundColor: "var(--bg)" }}
      >
        <div
          className="p-4 border-b"
          style={{
            borderColor: "var(--border)",
            backgroundColor: "var(--card)",
          }}
        >
          <h3 className="font-semibold">
            {t("WorkerPayrollManager.generatedPayrollHistory")}
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead
              className="uppercase text-xs"
              style={{ backgroundColor: "var(--hover)", color: "var(--muted)" }}
            >
              <tr>
                <th className={`px-4 py-3 font-medium ${textAlignment}`}>
                  {t("WorkerPayrollManager.worker")}
                </th>
                <th className={`px-4 py-3 font-medium ${textAlignment}`}>
                  {t("WorkerPayrollManager.period")}
                </th>
                <th className={`px-4 py-3 font-medium ${textAlignment}`}>
                  {t("WorkerPayrollManager.daysWorked")}
                </th>
                <th className={`px-4 py-3 font-medium ${textAlignment}`}>
                  {t("WorkerPayrollManager.grossNet")}
                </th>
                <th className={`px-4 py-3 font-medium ${textAlignment}`}>
                  {t("WorkerPayrollManager.status")}
                </th>
                {canManage && (
                  <th className={`px-4 py-3 font-medium ${textAlignment}`}>
                    {t("WorkerPayrollManager.actions")}
                  </th>
                )}
              </tr>
            </thead>
            <tbody
              className="divide-y"
              style={{ borderColor: "var(--border)" }}
            >
              {payrolls.length === 0 && (
                <tr>
                  <td
                    colSpan={canManage ? 6 : 5}
                    className="text-center py-6"
                    style={{ color: "var(--muted)" }}
                  >
                    {t("WorkerPayrollManager.noPayrolls")}
                  </td>
                </tr>
              )}
              {payrolls.map((pay) => (
                <tr key={pay.id}>
                  <td className={`px-4 py-3 ${textAlignment}`}>
                    <div className="font-medium">{pay.worker_name}</div>
                    <div className="text-xs" style={{ color: "var(--muted)" }}>
                      {pay.worker_id_code}
                    </div>
                  </td>
                  <td className={`px-4 py-3 ${textAlignment}`}>
                    {pay.period_start} {t("to")} {pay.period_end}
                  </td>
                  <td className={`px-4 py-3 ${textAlignment}`}>
                    {pay.total_days_worked} {t("WorkerPayrollManager.days")}
                    <br />
                    <span className="text-xs" style={{ color: "var(--muted)" }}>
                      + {pay.total_overtime_hours}{" "}
                      {t("WorkerPayrollManager.overtime")}
                    </span>
                  </td>
                  <td className={`px-4 py-3 ${textAlignment}`}>
                    <div>
                      {pay.gross_amount} {pay.currency}
                    </div>
                    <div
                      className="font-bold"
                      style={{ color: "var(--success)" }}
                    >
                      {pay.net_pay} {pay.currency}
                    </div>
                    {(Number(pay.advances) > 0 ||
                      Number(pay.deductions) > 0) && (
                      <div
                        className="text-xs"
                        style={{ color: "var(--muted)" }}
                      >
                        {t("WorkerPayrollManager.deductions")}:{" "}
                        {(
                          Number(pay.advances) + Number(pay.deductions)
                        ).toFixed(2)}
                      </div>
                    )}
                  </td>
                  <td className={`px-4 py-3 ${textAlignment}`}>
                    {pay.is_paid ? (
                      <span className="px-2 py-1 rounded bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300 text-xs">
                        {t("WorkerPayrollManager.paidOn")} {pay.payment_date}
                      </span>
                    ) : (
                      <span className="px-2 py-1 rounded bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300 text-xs">
                        {t(`WorkerPayrollManager.modal.${pay.status}`)}
                      </span>
                    )}
                  </td>
                  {canManage && (
                    <td className={`px-4 py-3 ${textAlignment}`}>
                      <div className="flex flex-wrap items-center gap-2">
                        {canUpdate && !pay.is_paid && pay.status === "draft" && (
                          <button
                            onClick={() => handleApprove(pay.id)}
                            className="rounded border px-2 py-1 text-xs font-medium"
                            style={{ borderColor: "var(--border)" }}
                          >
                            {t("WorkerPayrollManager.approve")}
                          </button>
                        )}
                        {canUpdate && !pay.is_paid && (
                          <button
                            onClick={() => handleMarkPaid(pay.id)}
                            className="rounded border px-2 py-1 text-xs font-medium text-blue-600"
                            style={{ borderColor: "var(--border)" }}
                          >
                            {t("WorkerPayrollManager.markPaid")}
                          </button>
                        )}
                        {canUpdate && (
                          <button
                            onClick={() => handleEdit(pay)}
                            className="rounded border p-2"
                            style={{ borderColor: "var(--border)" }}
                            title={t("WorkerPayrollManager.editPayroll")}
                            aria-label={t("WorkerPayrollManager.editPayroll")}
                          >
                            <Edit2 className="h-4 w-4" />
                          </button>
                        )}
                        {canDelete && (
                          <button
                            onClick={() => handleDelete(pay)}
                            className="rounded border p-2 text-red-600"
                            style={{ borderColor: "var(--border)" }}
                            title={t("WorkerPayrollManager.deletePayroll")}
                            aria-label={t("WorkerPayrollManager.deletePayroll")}
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

const emptyPayroll = {
  worker: "",
  project: "",
  period_start: "",
  period_end: "",
  daily_rate_applied: "",
  overtime_rate_applied: "",
  deductions: "0",
  status: "draft",
  payment_method: "cash",
  payment_date: "",
  notes: "",
};

function PayrollFormModal({
  isOpen,
  onClose,
  onSubmit,
  payroll,
  workers,
  projects,
  loading,
}) {
  const { t } = useLanguage();
  const [formData, setFormData] = useState(emptyPayroll);
  const [error, setError] = useState("");

  useEffect(() => {
    if (payroll) {
      setFormData({
        ...emptyPayroll,
        ...payroll,
        project: payroll.project || "",
        payment_date: payroll.payment_date || "",
      });
    } else {
      setFormData(emptyPayroll);
    }
    setError("");
  }, [payroll, isOpen]);

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === "worker" && !payroll) {
      const worker = workers.find((item) => String(item.id) === value);
      setFormData((prev) => ({
        ...prev,
        worker: value,
        daily_rate_applied: worker?.daily_rate || prev.daily_rate_applied,
        overtime_rate_applied:
          worker?.overtime_hourly_rate || prev.overtime_rate_applied,
        currency: worker?.currency || prev.currency,
      }));
      return;
    }
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    const payload = {
      ...formData,
      project: formData.project || null,
      payment_date: formData.payment_date || null,
      daily_rate_applied: formData.daily_rate_applied || undefined,
      overtime_rate_applied: formData.overtime_rate_applied || undefined,
    };
    try {
      await onSubmit(payload);
    } catch (err) {
      setError(getFriendlyErrorMessage(err, t("WorkerPayrollManager.modal.errorMessage")));
    }
  };

  const inputClass = "w-full rounded border px-3 py-2 text-sm outline-none";
  const inputStyle = {
    borderColor: "var(--border)",
    backgroundColor: "var(--bg)",
    color: "var(--text)",
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div
        className="max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-lg border shadow-lg"
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
            {payroll
              ? t("WorkerPayrollManager.modal.editPayroll")
              : t("WorkerPayrollManager.modal.addPayroll")}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded border px-3 py-1 text-sm"
            style={{ borderColor: "var(--border)" }}
          >
            {t("WorkerPayrollManager.modal.close")}
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 p-4">
          {error && (
            <p className="rounded bg-red-500/10 px-3 py-2 text-sm text-red-600">
              {error}
            </p>
          )}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Field label={t("WorkerPayrollManager.modal.worker")}>
              <select
                required
                name="worker"
                value={formData.worker}
                onChange={handleChange}
                disabled={Boolean(payroll)}
                className={inputClass}
                style={inputStyle}
              >
                <option value="">
                  {t("WorkerPayrollManager.modal.selectWorker")}
                </option>
                {workers.map((worker) => (
                  <option key={worker.id} value={worker.id}>
                    {worker.full_name}
                  </option>
                ))}
              </select>
            </Field>
            <Field label={t("WorkerPayrollManager.modal.project")}>
              <select
                name="project"
                value={formData.project || ""}
                onChange={handleChange}
                className={inputClass}
                style={inputStyle}
              >
                <option value="">
                  {t("WorkerPayrollManager.modal.noProject")}
                </option>
                {projects.map((project) => (
                  <option key={project.id} value={project.id}>
                    {project.name}
                  </option>
                ))}
              </select>
            </Field>
            <Field label={t("WorkerPayrollManager.modal.periodStart")}>
              <input
                required
                type="date"
                name="period_start"
                value={formData.period_start}
                onChange={handleChange}
                className={inputClass}
                style={inputStyle}
              />
            </Field>
            <Field label={t("WorkerPayrollManager.modal.periodEnd")}>
              <input
                required
                type="date"
                name="period_end"
                value={formData.period_end}
                onChange={handleChange}
                className={inputClass}
                style={inputStyle}
              />
            </Field>
            <Field label={t("WorkerPayrollManager.modal.dailyRate")}>
              <input
                type="number"
                min="0"
                step="0.01"
                name="daily_rate_applied"
                value={formData.daily_rate_applied}
                onChange={handleChange}
                className={inputClass}
                style={inputStyle}
              />
            </Field>
            <Field label={t("WorkerPayrollManager.modal.overtimeRate")}>
              <input
                type="number"
                min="0"
                step="0.01"
                name="overtime_rate_applied"
                value={formData.overtime_rate_applied}
                onChange={handleChange}
                className={inputClass}
                style={inputStyle}
              />
            </Field>
            <Field label={t("WorkerPayrollManager.modal.deductions")}>
              <input
                type="number"
                min="0"
                step="0.01"
                name="deductions"
                value={formData.deductions}
                onChange={handleChange}
                className={inputClass}
                style={inputStyle}
              />
            </Field>
            <Field label={t("WorkerPayrollManager.modal.status")}>
              <select
                name="status"
                value={formData.status}
                onChange={handleChange}
                className={inputClass}
                style={inputStyle}
              >
                <option value="draft">
                  {t("WorkerPayrollManager.modal.draft")}
                </option>
                <option value="approved">
                  {t("WorkerPayrollManager.modal.approved")}
                </option>
                <option value="paid">
                  {t("WorkerPayrollManager.modal.paid")}
                </option>
              </select>
            </Field>
            <Field label={t("WorkerPayrollManager.modal.paymentMethod")}>
              <select
                name="payment_method"
                value={formData.payment_method}
                onChange={handleChange}
                className={inputClass}
                style={inputStyle}
              >
                <option value="cash">
                  {t("WorkerPayrollManager.modal.cash")}
                </option>
                <option value="bank_transfer">
                  {t("WorkerPayrollManager.modal.bankTransfer")}
                </option>
                <option value="mobile_money">
                  {t("WorkerPayrollManager.modal.mobileMoney")}
                </option>
                <option value="check">
                  {t("WorkerPayrollManager.modal.check")}
                </option>
              </select>
            </Field>
            <Field label={t("WorkerPayrollManager.modal.paymentDate")}>
              <input
                type="date"
                name="payment_date"
                value={formData.payment_date || ""}
                onChange={handleChange}
                className={inputClass}
                style={inputStyle}
              />
            </Field>
            <div className="md:col-span-2">
              <Field label={t("WorkerPayrollManager.modal.notes")}>
                <textarea
                  name="notes"
                  value={formData.notes || ""}
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
              {t("WorkerPayrollManager.modal.cancel")}
            </button>
            <button
              type="submit"
              disabled={loading}
              className="rounded px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
              style={{ backgroundColor: "var(--primary)" }}
            >
              {loading
                ? t("WorkerPayrollManager.modal.saving")
                : t("WorkerPayrollManager.modal.savePayroll")}
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

export default WorkerPayrollManager;

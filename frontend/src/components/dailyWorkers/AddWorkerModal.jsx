import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { useDailyWorkers } from "../../hooks/useDailyWorkers";
import { useLanguage } from "../../hooks/useLanguage";
import { getFriendlyErrorMessage } from "../../utils/apiErrors";
import toast from "react-hot-toast";
import CalendarDatePicker from "../common/CalendarDatePicker";
import { todayIso } from "../../utils/calendar";

const blankForm = {
  full_name: "",
  father_name: "",
  phone: "",
  national_id: "",
  address: "",
  emergency_contact: "",
  daily_rate: "",
  overtime_hourly_rate: "0",
  currency: "AFN",
  skill_type: "helper",
  specialization: "",
  status: "active",
  joining_date: todayIso(),
  assigned_project: "",
  notes: "",
};

const skillOptions = [
  ["mason", "mason"],
  ["carpenter", "carpenter"],
  ["electrician", "electrician"],
  ["painter", "painter"],
  ["plumber", "plumber"],
  ["steel_fixer", "steel_fixer"],
  ["driver", "driver"],
  ["excavator_operator", "excavator_operator"],
  ["helper", "helper"],
  ["other", "other"],
];

function AddWorkerModal({ isOpen, onClose, onSuccess, worker, projects = [] }) {
  const { createWorker, updateWorker, loading } = useDailyWorkers();
  const [formData, setFormData] = useState(blankForm);
  const [error, setError] = useState("");
  const { t } = useLanguage();

  useEffect(() => {
    if (worker) {
      setFormData({
        ...blankForm,
        ...worker,
        assigned_project: worker.assigned_project || "",
      });
    } else {
      setFormData(blankForm);
    }
    setError("");
  }, [worker, isOpen]);

  if (!isOpen) return null;

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleDateChange = (name, value) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    const payload = {
      ...formData,
      assigned_project: formData.assigned_project || null,
    };
    try {
      if (worker?.id) {
        await updateWorker(worker.id, payload);
        toast.success("Worker updated.");
      } else {
        await createWorker(payload);
        toast.success("Worker created.");
      }
      onSuccess();
      onClose();
    } catch (err) {
      setError(getFriendlyErrorMessage(err, t("AddWorkerModal.errorMessage")));
    }
  };

  const inputClass =
    "min-h-12 w-full rounded-lg border px-3 py-3 text-base outline-none focus:ring-2 focus:ring-(--primary)/30 sm:text-sm";
  const inputStyle = {
    borderColor: "var(--border)",
    backgroundColor: "var(--bg)",
    color: "var(--text)",
  };

  return (
    <div className="mobile-modal-surface fixed inset-0 z-50 flex bg-black/50">
      <div
        className="mobile-modal-panel flex w-full max-w-4xl flex-col overflow-hidden rounded-lg border shadow-lg"
        style={{
          backgroundColor: "var(--card)",
          borderColor: "var(--border)",
          color: "var(--text)",
        }}
      >
        <div
          className="mobile-modal-header flex items-center justify-between border-b p-4"
          style={{ borderColor: "var(--border)" }}
        >
          <h2 className="text-lg font-semibold">
            {worker
              ? t("AddWorkerModal.editWorker")
              : t("AddWorkerModal.addWorker")}
          </h2>
          <button
            onClick={onClose}
            className="inline-flex h-11 w-11 items-center justify-center rounded-lg hover:bg-(--hover)"
            aria-label={t("AddWorkerModal.close")}
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col">
          <div className="mobile-modal-content space-y-5 p-4">
            {error && (
              <p className="rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-600">
                {error}
              </p>
            )}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <Field label={t("AddWorkerModal.fullName")}>
              <input
                required
                name="full_name"
                value={formData.full_name}
                onChange={handleChange}
                className={inputClass}
                style={inputStyle}
              />
            </Field>
            <Field label={t("AddWorkerModal.fatherName")}>
              <input
                name="father_name"
                value={formData.father_name}
                onChange={handleChange}
                className={inputClass}
                style={inputStyle}
              />
            </Field>
            <Field label={t("AddWorkerModal.phone")}>
              <input
                required
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                className={inputClass}
                style={inputStyle}
              />
            </Field>
            <Field label={t("AddWorkerModal.nationalId")}>
              <input
                name="national_id"
                value={formData.national_id || ""}
                onChange={handleChange}
                className={inputClass}
                style={inputStyle}
              />
            </Field>
            <Field label={t("AddWorkerModal.emergencyContact")}>
              <input
                name="emergency_contact"
                value={formData.emergency_contact}
                onChange={handleChange}
                className={inputClass}
                style={inputStyle}
              />
            </Field>
            <Field label={t("AddWorkerModal.joiningDate")}>
              <CalendarDatePicker
                required
                name="joining_date"
                value={formData.joining_date}
                onChange={(value) => handleDateChange("joining_date", value)}
                module="daily_workers"
                className={inputClass}
                style={inputStyle}
              />
            </Field>
            <Field label={t("AddWorkerModal.skillType")}>
              <select
                name="skill_type"
                value={formData.skill_type}
                onChange={handleChange}
                className={inputClass}
                style={inputStyle}
              >
                {skillOptions.map(([value, key]) => (
                  <option key={value} value={value}>
                    {t(`AddWorkerModal.skills.${key}`)}
                  </option>
                ))}
              </select>
            </Field>
            <Field label={t("AddWorkerModal.specialization")}>
              <input
                name="specialization"
                value={formData.specialization}
                onChange={handleChange}
                className={inputClass}
                style={inputStyle}
              />
            </Field>
            <Field label={t("AddWorkerModal.status")}>
              <select
                name="status"
                value={formData.status}
                onChange={handleChange}
                className={inputClass}
                style={inputStyle}
              >
                <option value="active">{t("AddWorkerModal.active")}</option>
                <option value="inactive">{t("AddWorkerModal.inactive")}</option>
              </select>
            </Field>
            <Field label={t("AddWorkerModal.dailyRate")}>
              <input
                required
                type="number"
                min="0"
                step="0.01"
                name="daily_rate"
                value={formData.daily_rate}
                onChange={handleChange}
                className={inputClass}
                style={inputStyle}
              />
            </Field>
            <Field label={t("AddWorkerModal.overtimeRate")}>
              <input
                type="number"
                min="0"
                step="0.01"
                name="overtime_hourly_rate"
                value={formData.overtime_hourly_rate}
                onChange={handleChange}
                className={inputClass}
                style={inputStyle}
              />
            </Field>
            <Field label={t("AddWorkerModal.currency")}>
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
            <Field label={t("AddWorkerModal.assignedProject")}>
              <select
                name="assigned_project"
                value={formData.assigned_project || ""}
                onChange={handleChange}
                className={inputClass}
                style={inputStyle}
              >
                <option value="">{t("AddWorkerModal.unassigned")}</option>
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </Field>
            <div className="md:col-span-2">
              <Field label={t("AddWorkerModal.address")}>
                <input
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  className={inputClass}
                  style={inputStyle}
                />
              </Field>
            </div>
            <div className="md:col-span-3">
              <Field label={t("AddWorkerModal.notes")}>
                <textarea
                  name="notes"
                  value={formData.notes}
                  onChange={handleChange}
                  rows={3}
                  className={inputClass}
                  style={inputStyle}
                />
              </Field>
            </div>
            </div>
          </div>

          <div
            className="mobile-modal-footer flex justify-end gap-3 border-t px-4 py-4"
            style={{ borderColor: "var(--border)" }}
          >
            <button
              type="button"
              onClick={onClose}
              className="min-h-12 rounded-lg border px-4 py-2 text-sm"
              style={{ borderColor: "var(--border)" }}
            >
              {t("AddWorkerModal.cancel")}
            </button>
            <button
              type="submit"
              disabled={loading}
              className="min-h-12 rounded-lg px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
              style={{ backgroundColor: "var(--primary)" }}
            >
              {loading
                ? t("AddWorkerModal.saving")
                : t("AddWorkerModal.saveWorker")}
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

export default AddWorkerModal;

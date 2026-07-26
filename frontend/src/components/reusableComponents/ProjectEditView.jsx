import { useEffect, useState } from "react";
import {
  Pencil,
  X,
  Loader2,
  Save,
  AlertCircle,
  RotateCcw,
  Info,
} from "lucide-react";
import toast from "react-hot-toast";
import instance from "../../api/axiosInstance";
import Input from "../ui/Input";
import PermissionWrapper from "../../auth/PermissionWrapper";
import Button from "../ui/Button";
import { useLanguage } from "../../hooks/useLanguage";
import { getFriendlyErrorMessage } from "../../utils/apiErrors";
import {
  fieldControlClass,
  fieldLabelClass,
  textareaControlClass,
} from "../ui/formStyles.jsx";

export default function ProjectEditView({ projectId, open, onClose, onSaved }) {
  const [form, setForm] = useState({
    name: "",
    description: "",
    property_type: "residential",
    location: "",
    total_floors: 1,
    start_date: "",
    expected_completion_date: "",
    estimated_budget: 0,
    status: "planning",
    notes: "",
  });

  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(false);
  const [error, setError] = useState(null);
  const [hasChanges, setHasChanges] = useState(false);
  const [originalForm, setOriginalForm] = useState(null);

  const { t } = useLanguage();

  const PROPERTY_TYPE_OPTIONS = [
    {
      value: "residential",
      label: t("ProjectEditView.propertyTypeOptions.residential"),
    },
    {
      value: "commercial",
      label: t("ProjectEditView.propertyTypeOptions.commercial"),
    },
    { value: "mixed", label: t("ProjectEditView.propertyTypeOptions.mixed") },
  ];

  const STATUS_OPTIONS = [
    { value: "planning", label: t("ProjectEditView.statusOptions.planning") },
    { value: "ongoing", label: t("ProjectEditView.statusOptions.ongoing") },
    { value: "completed", label: t("ProjectEditView.statusOptions.completed") },
    { value: "on_hold", label: t("ProjectEditView.statusOptions.onHold") },
  ];
  /* ── Sanitize form before sending to API ──────── */
  const sanitizeForm = (formData) => {
    const sanitized = { ...formData };

    const dateFields = [
      "start_date",
      "expected_completion_date",
      "actual_completion_date",
    ];

    dateFields.forEach((field) => {
      if (sanitized[field] === "" || sanitized[field] === undefined) {
        sanitized[field] = null;
      }
    });

    sanitized.total_floors = Number(sanitized.total_floors) || 1;
    sanitized.estimated_budget = Number(sanitized.estimated_budget) || 0;

    return sanitized;
  };

  /* ── Format date from API to input value ──────── */
  const formatDateForInput = (dateString) => {
    if (!dateString) return "";
    return String(dateString).split("T")[0];
  };

  /* ── Fetch project details ────────────────────── */
  const fetchProjectDetails = async () => {
    try {
      setFetching(true);
      setError(null);
      const response = await instance.get(`/projects/${projectId}/`);
      const data = response.data;

      const populated = {
        name: data.name || "",
        description: data.description || "",
        property_type: data.property_type || "residential",
        location: data.location || "",
        total_floors: data.total_floors || 1,
        start_date: formatDateForInput(data.start_date),
        expected_completion_date: formatDateForInput(
          data.expected_completion_date,
        ),
        estimated_budget: parseFloat(data.estimated_budget) || 0,
        status: data.status || "planning",
        notes: data.notes || "",
      };

      setForm(populated);
      setOriginalForm(populated);
      setHasChanges(false);
    } catch (err) {
      setError(
        getFriendlyErrorMessage(err, "The requested item could not be found."),
      );
    } finally {
      setFetching(false);
    }
  };

  useEffect(() => {
    if (open && projectId) {
      fetchProjectDetails();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, projectId]);

  /* ── Track changes ────────────────────────────── */
  useEffect(() => {
    if (!originalForm) return;
    const changed = Object.keys(form).some(
      (key) => String(form[key]) !== String(originalForm[key]),
    );
    setHasChanges(changed);
  }, [form, originalForm]);

  if (!open) return null;

  /* ── Handlers ─────────────────────────────────── */
  const handleChange = (name, value) => {
    setForm((prev) => {
      let nextValue = value;
      if (name === "total_floors" || name === "estimated_budget") {
        // Keep as string while editing; sanitize on submit
        nextValue = value;
      }
      return { ...prev, [name]: nextValue };
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      setError(null);

      const payload = sanitizeForm(form);
      await instance.put(`/projects/${projectId}/`, payload);
      toast.success("Project updated.");
      onSaved && onSaved();
    } catch (err) {
      setError(getFriendlyErrorMessage(err, "Unable to save changes."));
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    if (originalForm) {
      setForm(originalForm);
      setHasChanges(false);
      setError(null);
    }
  };

  const handleClose = () => {
    setError(null);
    onClose();
  };

  /* ── Shared styles ────────────────────────────── */
  const baseControl = fieldControlClass;
  const labelClass = fieldLabelClass;
  const helperClass = "text-xs text-[var(--muted)] mt-1";
  const sectionTitleClass =
    "text-xs font-semibold text-[var(--muted)] uppercase tracking-wider mb-3 flex items-center gap-2";

  const isChanged = (fieldName) => {
    if (!originalForm) return false;
    return String(form[fieldName]) !== String(originalForm[fieldName]);
  };

  // Use theme variable instead of hardcoded amber for changed field indicator
  const fieldHighlight = (fieldName) =>
    isChanged(fieldName)
      ? "!border-[var(--warning)] !ring-2 !ring-[var(--warning)]/20"
      : "";

  return (
    <div
      className="mobile-modal-surface fixed inset-0 z-50 flex bg-black/60 backdrop-blur-sm animate-in fade-in"
      onClick={handleClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="edit-project-title"
    >
      <div
        className="mobile-modal-panel bg-[var(--bg)] text-[var(--text)] w-full max-w-2xl rounded-2xl shadow-2xl border border-[var(--border)] overflow-hidden flex flex-col animate-in zoom-in-95"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ── Header ─────────────────────────────── */}
        <div className="mobile-modal-header px-7 py-5 border-b border-[var(--border)] bg-[var(--card)]">
          <div className="flex min-w-0 items-start justify-between gap-3">
            <div className="flex min-w-0 items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[var(--primary)]/10">
                <Pencil
                  className="w-5 h-5 text-[var(--primary)]"
                  strokeWidth={2}
                />
              </div>
              <div className="min-w-0">
                <h2
                  id="edit-project-title"
                  className="break-words text-lg font-semibold leading-6 text-[var(--text)]"
                >
                  {t("ProjectEditView.title")}
                </h2>
                <p className="mt-0.5 break-words text-xs text-[var(--muted)]">
                  {fetching
                    ? t("ProjectEditView.loading")
                    : hasChanges
                      ? t("ProjectEditView.unsavedChanges")
                      : t("ProjectEditView.updateInfo")}
                </p>
              </div>
            </div>

            <div className="flex shrink-0 items-center gap-2">
              {hasChanges && (
                <span className="hidden items-center gap-1.5 rounded-full border border-[var(--warning)]/30 bg-[var(--warning)]/10 px-2.5 py-1 text-xs font-medium text-[var(--warning)] min-[380px]:inline-flex">
                  <span className="h-1.5 w-1.5 rounded-full bg-[var(--warning)] animate-pulse" />
                  {t("ProjectEditView.modified")}
                </span>
              )}

              <button
                type="button"
                onClick={handleClose}
                disabled={loading}
                className="w-9 h-9 rounded-lg flex items-center justify-center text-[var(--muted)] hover:text-[var(--text)] hover:bg-[var(--hover)] transition-colors disabled:opacity-50"
                aria-label="Close"
              >
                <X className="w-5 h-5" strokeWidth={2} />
              </button>
            </div>
          </div>
        </div>

        {/* ── Body ───────────────────────────────── */}
        {fetching ? (
          <div className="flex-1 flex items-center justify-center py-20">
            <div className="flex flex-col items-center gap-3">
              <Loader2 className="h-8 w-8 animate-spin text-[var(--primary)]" />
              <p className="text-sm text-[var(--muted)]">
                {t("ProjectEditView.loading")}
              </p>
            </div>
          </div>
        ) : (
          <form
            id="project-edit-form"
            onSubmit={handleSubmit}
            className="mobile-modal-content flex-1 overflow-y-auto px-7 py-6"
          >
            {/* Error Alert */}
            {error && (
              <div className="mb-5 p-3.5 rounded-lg flex items-start gap-2.5 border border-[var(--danger)]/30 bg-[var(--danger)]/10">
                <AlertCircle className="w-5 h-5 text-[var(--danger)] flex-shrink-0 mt-0.5" />
                <p className="text-sm text-[var(--danger)] leading-relaxed">
                  {error}
                </p>
              </div>
            )}

            {/* Section: Basic Information */}
            <section className="mb-6">
              <h3 className={sectionTitleClass}>
                <Info size={12} className="text-[var(--primary)]" />
                {t("ProjectEditView.basicInfo")}
              </h3>
              <div className="space-y-4">
                <Input
                  label={t("ProjectEditView.projectName")}
                  name="name"
                  placeholder="e.g., Skyline Towers"
                  value={form.name}
                  onChange={(v) => handleChange("name", v)}
                  className={fieldHighlight("name")}
                  required
                />

                <div className="w-full">
                  <label className={labelClass} htmlFor="description">
                    {t("ProjectEditView.description")}
                  </label>
                  <textarea
                    id="description"
                    name="description"
                    placeholder={t("ProjectEditView.projectDescription")}
                    value={form.description}
                    onChange={(e) =>
                      handleChange("description", e.target.value)
                    }
                    rows={3}
                    className={`${textareaControlClass} ${fieldHighlight(
                      "description",
                    )}`}
                  />
                  <p className={helperClass}>
                    {t("ProjectEditView.briefOverview")}
                  </p>
                </div>
              </div>
            </section>

            {/* Section: Property Details */}
            <section className="mb-6">
              <h3 className={sectionTitleClass}>
                <Info size={12} className="text-[var(--primary)]" />
                {t("ProjectEditView.propertyDetails")}
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="w-full">
                  <label className={labelClass} htmlFor="property_type">
                    {t("ProjectEditView.propertyType")}
                  </label>
                  <select
                    id="property_type"
                    name="property_type"
                    value={form.property_type}
                    onChange={(e) =>
                      handleChange("property_type", e.target.value)
                    }
                    className={`${baseControl} cursor-pointer ${fieldHighlight(
                      "property_type",
                    )}`}
                  >
                    {PROPERTY_TYPE_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="w-full">
                  <label className={labelClass} htmlFor="status">
                    {t("ProjectEditView.status")}
                  </label>
                  <select
                    id="status"
                    name="status"
                    value={form.status}
                    onChange={(e) => handleChange("status", e.target.value)}
                    className={`${baseControl} cursor-pointer ${fieldHighlight(
                      "status",
                    )}`}
                  >
                    {STATUS_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>

                <Input
                  label={t("ProjectEditView.location")}
                  name="location"
                  placeholder="City, State"
                  value={form.location}
                  onChange={(v) => handleChange("location", v)}
                  className={fieldHighlight("location")}
                  required
                />

                <Input
                  label={t("ProjectEditView.totalFloors")}
                  name="total_floors"
                  type="number"
                  min="1"
                  value={form.total_floors}
                  onChange={(v) => handleChange("total_floors", v)}
                  className={fieldHighlight("total_floors")}
                />
              </div>
            </section>

            {/* Section: Timeline & Budget */}
            <section className="mb-6">
              <h3 className={sectionTitleClass}>
                <Info size={12} className="text-[var(--primary)]" />
                {t("ProjectEditView.timelineBudget")}
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label={t("ProjectEditView.startDate")}
                  name="start_date"
                  type="date"
                  value={form.start_date}
                  onChange={(v) => handleChange("start_date", v)}
                  className={fieldHighlight("start_date")}
                  required
                />

                <Input
                  label={t("ProjectEditView.expectedCompletion")}
                  name="expected_completion_date"
                  type="date"
                  value={form.expected_completion_date}
                  onChange={(v) => handleChange("expected_completion_date", v)}
                  className={fieldHighlight("expected_completion_date")}
                />

                <div className="w-full sm:col-span-2">
                  <label className={labelClass} htmlFor="estimated_budget">
                    {t("ProjectEditView.estimatedBudget")}
                  </label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--muted)] text-sm font-medium pointer-events-none">
                      $
                    </span>
                    <input
                      id="estimated_budget"
                      name="estimated_budget"
                      type="number"
                      min="0"
                      step="0.01"
                      placeholder="0.00"
                      value={form.estimated_budget}
                      onChange={(e) =>
                        handleChange("estimated_budget", e.target.value)
                      }
                      className={`${baseControl} pl-7 ${fieldHighlight(
                        "estimated_budget",
                      )}`}
                    />
                  </div>
                  <p className={helperClass}>In USD</p>
                </div>
              </div>
            </section>

            {/* Section: Notes */}
            <section className="mb-2">
              <h3 className={sectionTitleClass}>
                <Info size={12} className="text-[var(--primary)]" />
                {t("ProjectEditView.additionalNotes")}
              </h3>
              <div className="w-full">
                <textarea
                  name="notes"
                  placeholder={t("ProjectEditView.notesPlaceholder")}
                  value={form.notes}
                  onChange={(e) => handleChange("notes", e.target.value)}
                  rows={3}
                  className={`${textareaControlClass} ${fieldHighlight(
                    "notes",
                  )}`}
                />
              </div>
            </section>
          </form>
        )}

        {/* ── Footer ─────────────────────────────── */}
        {!fetching && (
          <div className="mobile-modal-footer px-7 py-4 border-t border-[var(--border)] bg-[var(--card)] flex items-center justify-between gap-3">
            <div className="flex min-w-0 flex-wrap items-center gap-3 max-sm:justify-center">
              <p className="break-words text-xs text-[var(--muted)]">
                <span className="text-[var(--danger)]">*</span>
                {t("ProjectEditView.requiredFields")}
              </p>

              {hasChanges && (
                <button
                  type="button"
                  onClick={handleReset}
                  disabled={loading}
                  className="text-xs font-medium text-[var(--muted)] hover:text-[var(--primary)] underline underline-offset-2 transition-colors inline-flex items-center gap-1 disabled:opacity-50"
                >
                  <RotateCcw size={12} />
                  {t("ProjectEditView.resetChanges")}
                </button>
              )}
            </div>

            <div className="flex shrink-0 items-center gap-2.5 max-sm:w-full max-sm:flex-col-reverse">
              <button
                type="button"
                onClick={handleClose}
                disabled={loading}
                className="min-h-12 px-4 py-2 text-sm font-medium text-[var(--text)] bg-[var(--bg)] border border-[var(--border)] rounded-lg hover:bg-[var(--hover)] transition-all disabled:opacity-50 max-sm:w-full"
              >
                {t("ProjectEditView.cancel")}
              </button>

              <PermissionWrapper
                permissions={["projects.update"]}
                fallback={
                  <Button
                    type="submit"
                    variant="primary"
                    disabled
                    title="You do not have permission for this action"
                  >
                    {t("ProjectEditView.saveChanges")}
                  </Button>
                }
              >
                <button
                  type="submit"
                  form="project-edit-form"
                  disabled={loading || !hasChanges}
                  className={`flex min-h-12 items-center justify-center gap-2 px-5 py-2 text-sm font-medium text-white rounded-lg shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed max-sm:w-full ${
                    hasChanges
                      ? "bg-[var(--primary)] hover:opacity-90 shadow-[var(--primary)]/25"
                      : "bg-[var(--muted)] shadow-none"
                  }`}
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Saving…
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" strokeWidth={2} />
                      {t("ProjectEditView.saveChanges")}
                    </>
                  )}
                </button>
              </PermissionWrapper>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

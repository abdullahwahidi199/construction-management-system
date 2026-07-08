import { useState } from "react";
import { Building2, X, Plus, Loader2, AlertCircle, Info } from "lucide-react";
import Input from "../ui/Input";
import PermissionWrapper from "../../auth/PermissionWrapper";
import Button from "../ui/Button";
import { useLanguage } from "../../hooks/useLanguage";

const INITIAL_FORM = {
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
};

export default function ProjectCreateModal({
  open,
  onClose,
  onSubmit,
  loading,
  error,
}) {
  const [form, setForm] = useState(INITIAL_FORM);
  const { t } = useLanguage();

  const PROPERTY_TYPE_OPTIONS = [
    {
      value: "residential",
      label: t("ProjectCreateModal.options.property_type.residential"),
    },
    {
      value: "commercial",
      label: t("ProjectCreateModal.options.property_type.commercial"),
    },
    {
      value: "mixed",
      label: t("ProjectCreateModal.options.property_type.mixed"),
    },
  ];

  const STATUS_OPTIONS = [
    {
      value: "planning",
      label: t("ProjectCreateModal.options.status.planning"),
    },
    { value: "ongoing", label: t("ProjectCreateModal.options.status.ongoing") },
    {
      value: "completed",
      label: t("ProjectCreateModal.options.status.completed"),
    },
    { value: "on_hold", label: t("ProjectCreateModal.options.status.on_hold") },
  ];

  if (!open) return null;

  const handleChange = (name, value) => {
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const sanitizeForm = (formData) => {
    const sanitized = { ...formData };
    [
      "start_date",
      "expected_completion_date",
      "actual_completion_date",
    ].forEach((field) => {
      if (sanitized[field] === "" || sanitized[field] === undefined) {
        sanitized[field] = null;
      }
    });
    sanitized.total_floors = Number(sanitized.total_floors) || 1;
    sanitized.estimated_budget = Number(sanitized.estimated_budget) || 0;
    return sanitized;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(sanitizeForm(form));
  };

  const handleClose = () => {
    onClose();
  };

  // Shared select/textarea styles (Input handles its own)
  const baseControl =
    "w-full px-4 py-2.5 rounded-lg border bg-[var(--bg)] text-[var(--text)] placeholder:text-[var(--muted)] transition-all duration-200 focus:outline-none focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary)]/20 border-[var(--border)] disabled:opacity-50 disabled:cursor-not-allowed";

  const labelClass = "block text-sm font-medium text-[var(--text)] mb-1.5";
  const helperClass = "text-xs text-[var(--muted)] mt-1";
  const sectionTitleClass =
    "text-xs font-semibold text-[var(--muted)] uppercase tracking-wider mb-3 flex items-center gap-2";

  const errorMessage =
    typeof error === "string" ? error : t("ProjectCreateModal.errors.default");

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in"
      onClick={handleClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="create-project-title"
    >
      <div
        className="bg-[var(--bg)] text-[var(--text)] w-full max-w-2xl max-h-[90vh] rounded-2xl shadow-2xl border border-[var(--border)] overflow-hidden flex flex-col animate-in zoom-in-95"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-7 py-5 border-b border-[var(--border)] bg-[var(--card)]">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[var(--primary)]/10 flex items-center justify-center">
                <Building2
                  className="w-5 h-5 text-[var(--primary)]"
                  strokeWidth={2}
                />
              </div>
              <div>
                <h2
                  id="create-project-title"
                  className="text-lg font-semibold text-[var(--text)]"
                >
                  {t("ProjectCreateModal.title")}
                </h2>
                <p className="text-xs text-[var(--muted)] mt-0.5">
                  {t("ProjectCreateModal.subtitle")}
                </p>
              </div>
            </div>
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

        {/* Form Body */}
        <form
          id="project-create-form"
          onSubmit={handleSubmit}
          className="flex-1 overflow-y-auto px-7 py-6"
          noValidate
        >
          {error && (
            <div className="mb-5 p-3.5 rounded-lg flex items-start gap-2.5 border border-[var(--danger)]/30 bg-[var(--danger)]/10">
              <AlertCircle className="w-5 h-5 text-[var(--danger)] flex-shrink-0 mt-0.5" />
              <p className="text-sm text-[var(--danger)] leading-relaxed">
                {errorMessage}
              </p>
            </div>
          )}

          {/* Section: Basic Information */}
          <section className="mb-6">
            <h3 className={sectionTitleClass}>
              <Info size={12} className="text-[var(--primary)]" />
              {t("ProjectCreateModal.sections.basic_information")}
            </h3>
            <div className="space-y-4">
              <Input
                label={t("ProjectCreateModal.fields.name.label")}
                name="name"
                placeholder={t("ProjectCreateModal.fields.name.placeholder")}
                value={form.name}
                onChange={(v) => handleChange("name", v)}
                required
              />

              <div className="w-full">
                <label className={labelClass} htmlFor="description">
                  {t("ProjectCreateModal.fields.description.label")}
                </label>
                <textarea
                  id="description"
                  name="description"
                  placeholder={t(
                    "ProjectCreateModal.fields.description.placeholder",
                  )}
                  value={form.description}
                  onChange={(e) => handleChange("description", e.target.value)}
                  rows={3}
                  className={`${baseControl} resize-none`}
                />
                <p className={helperClass}>
                  {t("ProjectCreateModal.fields.description.helper")}
                </p>
              </div>
            </div>
          </section>

          {/* Section: Property Details */}
          <section className="mb-6">
            <h3 className={sectionTitleClass}>
              <Info size={12} className="text-[var(--primary)]" />
              {t("ProjectCreateModal.sections.property_details")}
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="w-full">
                <label className={labelClass} htmlFor="property_type">
                  {t("ProjectCreateModal.fields.property_type")}
                </label>
                <select
                  id="property_type"
                  name="property_type"
                  value={form.property_type}
                  onChange={(e) =>
                    handleChange("property_type", e.target.value)
                  }
                  className={`${baseControl} cursor-pointer`}
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
                  {t("ProjectCreateModal.fields.status")}
                </label>
                <select
                  id="status"
                  name="status"
                  value={form.status}
                  onChange={(e) => handleChange("status", e.target.value)}
                  className={`${baseControl} cursor-pointer`}
                >
                  {STATUS_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>

              <Input
                label={t("ProjectCreateModal.fields.location.label")}
                name="location"
                placeholder={t(
                  "ProjectCreateModal.fields.location.placeholder",
                )}
                value={form.location}
                onChange={(v) => handleChange("location", v)}
                required
              />

              <Input
                label={t("ProjectCreateModal.fields.total_floors")}
                name="total_floors"
                type="number"
                min="1"
                value={form.total_floors}
                onChange={(v) => handleChange("total_floors", v)}
              />
            </div>
          </section>

          {/* Section: Timeline & Budget */}
          <section className="mb-6">
            <h3 className={sectionTitleClass}>
              <Info size={12} className="text-[var(--primary)]" />
              {t("ProjectCreateModal.sections.timeline_budget")}
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label={t("ProjectCreateModal.fields.start_date")}
                name="start_date"
                type="date"
                value={form.start_date}
                onChange={(v) => handleChange("start_date", v)}
                required
              />

              <Input
                label={t("ProjectCreateModal.fields.expected_completion_date")}
                name="expected_completion_date"
                type="date"
                value={form.expected_completion_date}
                onChange={(v) => handleChange("expected_completion_date", v)}
              />

              <div className="w-full sm:col-span-2">
                <label className={labelClass} htmlFor="estimated_budget">
                  {t("ProjectCreateModal.fields.estimated_budget.label")}
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
                    className={`${baseControl} pl-7`}
                  />
                </div>
                <p className={helperClass}>
                  {t("ProjectCreateModal.fields.estimated_budget.helper")}
                </p>
              </div>
            </div>
          </section>

          {/* Section: Notes */}
          <section className="mb-2">
            <h3 className={sectionTitleClass}>
              <Info size={12} className="text-[var(--primary)]" />
              {t("ProjectCreateModal.sections.additional_notes")}
            </h3>
            <div className="w-full">
              <textarea
                name="notes"
                placeholder={t("ProjectCreateModal.fields.notes.placeholder")}
                value={form.notes}
                onChange={(e) => handleChange("notes", e.target.value)}
                rows={3}
                className={`${baseControl} resize-none`}
              />
            </div>
          </section>
        </form>

        {/* Footer */}
        <div className="px-7 py-4 border-t border-[var(--border)] bg-[var(--card)] flex items-center justify-between gap-3">
          <p className="text-xs text-[var(--muted)]">
            <span className="text-[var(--danger)]">*</span> Required fields
          </p>
          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={handleClose}
              disabled={loading}
              className="px-4 py-2 text-sm font-medium text-[var(--text)] bg-[var(--bg)] border border-[var(--border)] rounded-lg hover:bg-[var(--hover)] transition-all disabled:opacity-50"
            >
              {t("ProjectCreateModal.buttons.cancel")}
            </button>

            <PermissionWrapper
              permissions={["projects.create"]}
              fallback={
                <Button
                  type="submit"
                  variant="primary"
                  disabled
                  title="You do not have permission for this action"
                >
                  {t("ProjectCreateModal.buttons.create")}
                </Button>
              }
            >
              <button
                type="submit"
                form="project-create-form"
                disabled={loading}
                className="px-5 py-2 text-sm font-medium text-white bg-[var(--primary)] rounded-lg hover:opacity-90 shadow-lg shadow-[var(--primary)]/25 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    {t("ProjectCreateModal.buttons.creating")}
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4" strokeWidth={2} />
                    {t("ProjectCreateModal.buttons.create")}
                  </>
                )}
              </button>
            </PermissionWrapper>
          </div>
        </div>
      </div>
    </div>
  );
}

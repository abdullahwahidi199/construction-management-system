import React, { useEffect, useState } from "react";
import { Pencil, X, Loader2, Save, AlertCircle } from "lucide-react";
import instance from "../../api/axiosInstance";
import Input from "../ui/Input";

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

  /* ── Sanitize form before sending to API ──────── */
  const sanitizeForm = (formData) => {
    const sanitized = { ...formData };

    // Convert empty date strings to null
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

    // Convert empty strings to null for optional text fields
    const optionalTextFields = ["description", "notes"];
    optionalTextFields.forEach((field) => {
      if (sanitized[field] === "") {
        sanitized[field] = "";
      }
    });

    // Ensure numeric fields are numbers
    sanitized.total_floors = Number(sanitized.total_floors) || 1;
    sanitized.estimated_budget = Number(sanitized.estimated_budget) || 0;

    return sanitized;
  };

  /* ── Format date from API to input value ──────── */
  const formatDateForInput = (dateString) => {
    if (!dateString) return "";
    // Handle full ISO datetime strings like "2026-06-13T16:09:11.557832Z"
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return "";
    // Return YYYY-MM-DD format
    return date.toISOString().split("T")[0];
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
      setError(err.response?.data?.message || "Failed to load project details");
    } finally {
      setFetching(false);
    }
  };

  useEffect(() => {
    if (open && projectId) {
      fetchProjectDetails();
    }
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
  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]:
        name === "total_floors" || name === "estimated_budget"
          ? Number(value)
          : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      setError(null);

      // Sanitize before sending
      const payload = sanitizeForm(form);
      await instance.put(`/projects/${projectId}/`, payload);
      onSaved && onSaved();
    } catch (err) {
      const data = err.response?.data;
      if (data && typeof data === "object" && !Array.isArray(data)) {
        const messages = Object.entries(data)
          .map(
            ([key, val]) =>
              `${key}: ${Array.isArray(val) ? val.join(", ") : val}`,
          )
          .join(" | ");
        setError(messages);
      } else {
        setError("Failed to update project. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    if (originalForm) {
      setForm(originalForm);
      setHasChanges(false);
    }
  };

  /* ── Shared styles ────────────────────────────── */
  const controlClass =
    "w-full px-4 py-2.5 rounded-lg border bg-[var(--bg)] text-[var(--text)] placeholder:text-[var(--muted)] transition-colors duration-200 focus:outline-none focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary)]/20 border-[var(--border)]";

  const labelClass = "block text-sm font-medium text-[var(--text)] mb-1.5";

  const sectionTitleClass =
    "text-xs font-semibold text-[var(--muted)] uppercase tracking-wider mb-3";

  const isChanged = (fieldName) => {
    if (!originalForm) return false;
    return String(form[fieldName]) !== String(originalForm[fieldName]);
  };

  const fieldHighlight = (fieldName) =>
    isChanged(fieldName) ? "ring-2 ring-amber-400/30 border-amber-400/50" : "";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in"
      onClick={onClose}
    >
      <div
        className="bg-[var(--bg)] text-[var(--text)] w-full max-w-2xl max-h-[90vh] rounded-2xl shadow-2xl border border-[var(--border)] overflow-hidden flex flex-col animate-in zoom-in-95"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ── Header ─────────────────────────────── */}
        <div className="px-7 py-5 border-b border-[var(--border)] flex items-center justify-between bg-[var(--card)]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/15 flex items-center justify-center shadow-lg shadow-amber-500/20">
              <Pencil className="w-5 h-5 text-amber-500" strokeWidth={2} />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-[var(--text)]">
                Edit Project
              </h2>
              <p className="text-xs text-[var(--muted)]">
                {fetching
                  ? "Loading project details…"
                  : hasChanges
                    ? "You have unsaved changes"
                    : "Update project information"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {hasChanges && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/10 border border-amber-500/20 px-2.5 py-1 text-xs font-medium text-amber-600 dark:text-amber-400">
                <span className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse" />
                Modified
              </span>
            )}

            <button
              type="button"
              onClick={onClose}
              className="w-9 h-9 rounded-lg flex items-center justify-center text-[var(--muted)] hover:text-[var(--text)] hover:bg-[var(--hover)] transition-colors"
            >
              <X className="w-5 h-5" strokeWidth={2} />
            </button>
          </div>
        </div>

        {/* ── Body ───────────────────────────────── */}
        {fetching ? (
          <div className="flex-1 flex items-center justify-center py-20">
            <div className="flex flex-col items-center gap-3">
              <Loader2 className="h-8 w-8 animate-spin text-[var(--primary)]" />
              <p className="text-sm text-[var(--muted)]">
                Loading project details…
              </p>
            </div>
          </div>
        ) : (
          <form
            onSubmit={handleSubmit}
            className="flex-1 overflow-y-auto px-7 py-6"
          >
            {/* Error Alert */}
            {error && (
              <div className="mb-5 p-3.5 rounded-lg flex items-start gap-2.5 border border-[var(--danger)]/30 bg-[var(--danger)]/10">
                <AlertCircle className="w-5 h-5 text-[var(--danger)] flex-shrink-0 mt-0.5" />
                <p className="text-sm text-[var(--danger)]">{error}</p>
              </div>
            )}

            {/* Section: Basic Information */}
            <div className="mb-6">
              <h3 className={sectionTitleClass}>Basic Information</h3>
              <div className="space-y-4">
                <div>
                  <Input
                    label="Project Name *"
                    name="name"
                    placeholder="e.g., Skyline Towers"
                    value={form.name}
                    onChange={handleChange}
                    className={fieldHighlight("name")}
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className={labelClass}>Description</label>
                  <textarea
                    name="description"
                    placeholder="What's this project about?"
                    value={form.description}
                    onChange={handleChange}
                    rows={3}
                    className={`${controlClass} resize-none ${fieldHighlight(
                      "description",
                    )}`}
                  />
                  <span className="text-xs text-[var(--muted)]">
                    A brief overview of the project
                  </span>
                </div>
              </div>
            </div>

            {/* Section: Property Details */}
            <div className="mb-6">
              <h3 className={sectionTitleClass}>Property Details</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className={labelClass}>Property Type</label>
                  <select
                    name="property_type"
                    value={form.property_type}
                    onChange={handleChange}
                    className={`${controlClass} cursor-pointer ${fieldHighlight(
                      "property_type",
                    )}`}
                  >
                    <option value="residential">Residential</option>
                    <option value="commercial">Commercial</option>
                    <option value="mixed">Mixed Use</option>
                  </select>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className={labelClass}>Status</label>
                  <select
                    name="status"
                    value={form.status}
                    onChange={handleChange}
                    className={`${controlClass} cursor-pointer ${fieldHighlight(
                      "status",
                    )}`}
                  >
                    <option value="planning">Planning</option>
                    <option value="ongoing">Ongoing</option>
                    <option value="completed">Completed</option>
                    <option value="on_hold">On Hold</option>
                  </select>
                </div>

                <Input
                  label="Location *"
                  name="location"
                  placeholder="City, State"
                  value={form.location}
                  onChange={handleChange}
                  className={fieldHighlight("location")}
                />

                <Input
                  label="Total Floors"
                  name="total_floors"
                  type="number"
                  value={form.total_floors}
                  onChange={handleChange}
                  className={fieldHighlight("total_floors")}
                />
              </div>
            </div>

            {/* Section: Timeline & Budget */}
            <div className="mb-6">
              <h3 className={sectionTitleClass}>Timeline & Budget</h3>
              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Start Date *"
                  name="start_date"
                  type="date"
                  value={form.start_date}
                  onChange={handleChange}
                  className={fieldHighlight("start_date")}
                />

                <Input
                  label="Expected Completion"
                  name="expected_completion_date"
                  type="date"
                  value={form.expected_completion_date}
                  onChange={handleChange}
                  className={fieldHighlight("expected_completion_date")}
                />

                <div className="flex flex-col gap-1.5 col-span-2 sm:col-span-1">
                  <label className={labelClass}>Estimated Budget</label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--muted)] text-sm z-10">
                      $
                    </span>
                    <input
                      name="estimated_budget"
                      type="number"
                      placeholder="0.00"
                      value={form.estimated_budget}
                      onChange={handleChange}
                      className={`${controlClass} pl-7 ${fieldHighlight(
                        "estimated_budget",
                      )}`}
                    />
                  </div>
                  <span className="text-xs text-[var(--muted)]">In USD</span>
                </div>
              </div>
            </div>

            {/* Section: Notes */}
            <div className="mb-2">
              <h3 className={sectionTitleClass}>Additional Notes</h3>
              <div className="flex flex-col gap-1.5">
                <textarea
                  name="notes"
                  placeholder="Any additional notes, remarks, or important details…"
                  value={form.notes}
                  onChange={handleChange}
                  rows={3}
                  className={`${controlClass} resize-none ${fieldHighlight(
                    "notes",
                  )}`}
                />
              </div>
            </div>
          </form>
        )}

        {/* ── Footer ─────────────────────────────── */}
        {!fetching && (
          <div className="px-7 py-4 border-t border-[var(--border)] bg-[var(--card)] flex items-center justify-between">
            <div className="flex items-center gap-3">
              <p className="text-xs text-[var(--muted)]">
                <span className="text-[var(--danger)]">*</span> Required fields
              </p>

              {hasChanges && (
                <button
                  type="button"
                  onClick={handleReset}
                  className="text-xs font-medium text-[var(--muted)] hover:text-[var(--text)] underline underline-offset-2 transition-colors"
                >
                  Reset changes
                </button>
              )}
            </div>

            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={onClose}
                disabled={loading}
                className="px-4 py-2 text-sm font-medium text-[var(--text)] bg-[var(--bg)] border border-[var(--border)] rounded-lg hover:bg-[var(--hover)] transition-all disabled:opacity-50"
              >
                Cancel
              </button>

              <button
                type="submit"
                onClick={handleSubmit}
                disabled={loading || !hasChanges}
                className={`px-5 py-2 text-sm font-medium text-white rounded-lg shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 ${
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
                    Save Changes
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

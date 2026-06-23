import { useState } from "react";
import Input from "../ui/Input";

export default function ProjectCreateModal({
  open,
  onClose,
  onSubmit,
  loading,
  error,
}) {
  const [form, setForm] = useState({
    name: "",
    description: "",
    property_type: "residential",
    location: "",
    total_floors: 1,
    start_date: "",
    estimated_budget: 0,
    status: "planning",
  });

  if (!open) return null;

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
    onSubmit(form);
  };

  // Shared select/textarea styles (Input handles its own)
  const controlClass =
    "w-full px-4 py-2.5 rounded-lg border bg-[var(--bg)] text-[var(--text)] placeholder:text-[var(--muted)] transition-colors duration-200 focus:outline-none focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary)]/20 border-[var(--border)]";

  const labelClass = "block text-sm font-medium text-[var(--text)] mb-1.5";

  const sectionTitleClass =
    "text-xs font-semibold text-[var(--muted)] uppercase tracking-wider mb-3";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in"
      onClick={onClose}
    >
      <div
        className="bg-[var(--bg)] text-[var(--text)] w-full max-w-2xl max-h-[90vh] rounded-2xl shadow-2xl border border-[var(--border)] overflow-hidden flex flex-col animate-in zoom-in-95"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-7 py-5 border-b border-[var(--border)] flex items-center justify-between bg-[var(--card)]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[var(--primary)] flex items-center justify-center shadow-lg shadow-[var(--primary)]/30">
              <svg
                className="w-5 h-5 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                />
              </svg>
            </div>
            <div>
              <h2 className="text-lg font-semibold text-[var(--text)]">
                Create New Project
              </h2>
              <p className="text-xs text-[var(--muted)]">Add a new project</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 rounded-lg flex items-center justify-center text-[var(--muted)] hover:text-[var(--text)] hover:bg-[var(--hover)] transition-colors"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Form Body */}
        <form
          onSubmit={handleSubmit}
          className="flex-1 overflow-y-auto px-7 py-6"
        >
          {error && (
            <div className="mb-5 p-3.5 rounded-lg flex items-start gap-2.5 border border-[var(--danger)]/30 bg-[var(--danger)]/10">
              <svg
                className="w-5 h-5 text-[var(--danger)] flex-shrink-0 mt-0.5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <p className="text-sm text-[var(--danger)]">
                {typeof error === "string"
                  ? error
                  : "Failed to create project. Please try again."}
              </p>
            </div>
          )}

          {/* Section: Basic Information */}
          <div className="mb-6">
            <h3 className={sectionTitleClass}>Basic Information</h3>
            <div className="space-y-4">
              <Input
                label="Project Name *"
                name="name"
                placeholder="e.g., Skyline Towers"
                value={form.name}
                onChange={handleChange}
              />

              <div className="flex flex-col gap-1.5">
                <label className={labelClass}>Description</label>
                <textarea
                  name="description"
                  placeholder="What's this project about?"
                  value={form.description}
                  onChange={handleChange}
                  rows={3}
                  className={`${controlClass} resize-none`}
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
                  className={`${controlClass} cursor-pointer`}
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
                  className={`${controlClass} cursor-pointer`}
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
              />

              <Input
                label="Total Floors"
                name="total_floors"
                type="number"
                value={form.total_floors}
                onChange={handleChange}
              />
            </div>
          </div>

          {/* Section: Timeline & Budget */}
          <div className="mb-2">
            <h3 className={sectionTitleClass}>Timeline & Budget</h3>
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Start Date *"
                name="start_date"
                type="date"
                value={form.start_date}
                onChange={handleChange}
              />

              <div className="flex flex-col gap-1.5">
                <label className={labelClass}>Estimated Budget</label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--muted)] text-sm z-10">
                    $
                  </span>
                  <Input
                    name="estimated_budget"
                    type="number"
                    placeholder="0.00"
                    value={form.estimated_budget}
                    onChange={handleChange}
                    className="[&>input]:pl-7"
                  />
                </div>
                <span className="text-xs text-[var(--muted)]">In USD</span>
              </div>
            </div>
          </div>
        </form>

        {/* Footer */}
        <div className="px-7 py-4 border-t border-[var(--border)] bg-[var(--card)] flex items-center justify-between">
          <p className="text-xs text-[var(--muted)]">
            <span className="text-[var(--danger)]">*</span> Required fields
          </p>
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
              disabled={loading}
              className="px-5 py-2 text-sm font-medium text-white bg-[var(--primary)] rounded-lg hover:opacity-90 shadow-lg shadow-[var(--primary)]/25 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {loading ? (
                <>
                  <svg
                    className="animate-spin w-4 h-4"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                  Creating...
                </>
              ) : (
                <>
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 4v16m8-8H4"
                    />
                  </svg>
                  Create Project
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

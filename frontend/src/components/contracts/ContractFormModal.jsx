// src/components/contracts/ContractFormModal.jsx
import { useState, useEffect } from "react";
import { X } from "lucide-react";
import Card from "../ui/Card";
import Button from "../ui/Button";
import Input from "../ui/Input";
import Select from "../ui/Select";
import useFetch from "../../hooks/useFetch";

const STATUS_OPTIONS = [
  { value: "draft", label: "Draft" },
  { value: "active", label: "Active" },
  { value: "completed", label: "Completed" },
  { value: "terminated", label: "Terminated" },
  { value: "cancelled", label: "Cancelled" },
];

const emptyForm = {
  project: "",
  subcontractor: "",
  title: "",
  scope_of_work: "",
  currency: "",
  contract_value: "",
  retention_percentage: "5",
  start_date: "",
  end_date: "",
  completion_percentage: "0",
  status: "draft",
  notes: "",
};

export default function ContractFormModal({
  isOpen,
  onClose,
  onSubmit,
  contract = null,
  loading: submitLoading,
}) {
  const isEdit = !!contract;

  const { data: projectsData } = useFetch("projects/");
  const { data: subcontractorsData } = useFetch("subcontractors/");

  const projects = projectsData?.results || projectsData || [];
  const subcontractors =
    subcontractorsData?.results || subcontractorsData || [];

  const [form, setForm] = useState(emptyForm);
  const [errors, setErrors] = useState({});

  const CURRENCY_OPTIONS = [
    {
      value: "AFN",
      label: "AFN (Afghan Afghani)",
    },
    {
      value: "USD",
      label: "USD (US Dollar)",
    },
  ];

  useEffect(() => {
    if (contract) {
      setForm({
        project: contract.project || "",
        subcontractor: contract.subcontractor || "",
        title: contract.title || "",
        scope_of_work: contract.scope_of_work || "",
        currency: contract.currency || "AFN",
        contract_value: contract.contract_value || "",
        retention_percentage: contract.retention_percentage || "5",
        start_date: contract.start_date || "",
        end_date: contract.end_date || "",
        completion_percentage: contract.completion_percentage || "0",
        status: contract.status || "draft",
        notes: contract.notes || "",
      });
    } else {
      setForm(emptyForm);
    }
    setErrors({});
  }, [contract, isOpen]);

  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }));
    }
  };

  const validate = () => {
    const newErrors = {};

    if (!form.project) newErrors.project = "Project is required";
    if (!form.subcontractor)
      newErrors.subcontractor = "Subcontractor is required";
    if (!form.title.trim()) newErrors.title = "Title is required";
    if (!form.currency) newErrors.currency = "Currency is required";
    if (!form.contract_value || Number(form.contract_value) <= 0)
      newErrors.contract_value = "Contract value must be positive";
    if (!form.start_date) newErrors.start_date = "Start date is required";
    if (!form.end_date) newErrors.end_date = "End date is required";
    if (form.start_date && form.end_date && form.start_date > form.end_date)
      newErrors.end_date = "End date must be after start date";
    if (
      form.completion_percentage !== "" &&
      (Number(form.completion_percentage) < 0 ||
        Number(form.completion_percentage) > 100)
    )
      newErrors.completion_percentage = "Must be between 0 and 100";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    console.log("SUBMIT CLICKED");
    console.log(form);

    if (!validate()) {
      console.log("VALIDATION FAILED");
      return;
    }

    console.log("VALIDATION PASSED");

    const payload = {
      ...form,
      contract_value: Number(form.contract_value),
      retention_percentage: Number(form.retention_percentage),
      completion_percentage: Number(form.completion_percentage),
    };

    console.log("PAYLOAD", payload);

    await onSubmit(payload);
  };

  const projectOptions = projects.map((p) => ({
    value: p.id,
    label: p.name || `Project ${p.id}`,
  }));

  const subcontractorOptions = subcontractors.map((s) => ({
    value: s.id,
    label: s.name,
  }));

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <Card className="p-0">
          <form onSubmit={handleSubmit}>
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border)]">
              <h2 className="text-lg font-semibold text-[var(--text)]">
                {isEdit ? "Edit Contract" : "Create Contract"}
              </h2>
              <button
                type="button"
                onClick={onClose}
                className="p-1 rounded-lg hover:bg-[var(--hover)] text-[var(--text)]"
              >
                <X size={20} />
              </button>
            </div>

            {/* Body */}
            <div className="px-6 py-4 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Select
                  label="Project"
                  value={form.project}
                  onChange={(val) => handleChange("project", val)}
                  options={projectOptions}
                  placeholder="Select project"
                  disabled={isEdit}
                  error={errors.project}
                />
                <Select
                  label="Subcontractor"
                  value={form.subcontractor}
                  onChange={(val) => handleChange("subcontractor", val)}
                  options={subcontractorOptions}
                  placeholder="Select subcontractor"
                  disabled={isEdit}
                  error={errors.subcontractor}
                />
              </div>

              <Input
                label="Title"
                value={form.title}
                onChange={(val) => handleChange("title", val)}
                placeholder="Contract title"
                error={errors.title}
              />

              <div>
                <label className="block text-sm font-medium text-[var(--text)] mb-1">
                  Scope of Work
                </label>
                <textarea
                  value={form.scope_of_work}
                  onChange={(e) =>
                    handleChange("scope_of_work", e.target.value)
                  }
                  rows={3}
                  placeholder="Describe the scope of work"
                  className="w-full px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--card)] text-[var(--text)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)] resize-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                <Select
                  label="Currency"
                  value={form.currency}
                  onChange={(value) => handleChange("currency", value)}
                  options={CURRENCY_OPTIONS}
                  error={errors.currency}
                />
                <Input
                  label="Contract Value ($)"
                  type="number"
                  value={form.contract_value}
                  onChange={(val) => handleChange("contract_value", val)}
                  placeholder="0.00"
                  min="0"
                  step="0.01"
                  error={errors.contract_value}
                />
                <Input
                  label="Retention %"
                  type="number"
                  value={form.retention_percentage}
                  onChange={(val) => handleChange("retention_percentage", val)}
                  placeholder="5"
                  min="0"
                  max="100"
                  step="0.01"
                />
                <Input
                  label="Progress %"
                  type="number"
                  value={form.completion_percentage}
                  onChange={(val) => handleChange("completion_percentage", val)}
                  placeholder="0"
                  min="0"
                  max="100"
                  step="0.01"
                  error={errors.completion_percentage}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Start Date"
                  type="date"
                  value={form.start_date}
                  onChange={(val) => handleChange("start_date", val)}
                  error={errors.start_date}
                />
                <Input
                  label="End Date"
                  type="date"
                  value={form.end_date}
                  onChange={(val) => handleChange("end_date", val)}
                  error={errors.end_date}
                />
              </div>

              <Select
                label="Status"
                value={form.status}
                onChange={(val) => handleChange("status", val)}
                options={STATUS_OPTIONS}
              />

              <div>
                <label className="block text-sm font-medium text-[var(--text)] mb-1">
                  Notes
                </label>
                <textarea
                  value={form.notes}
                  onChange={(e) => handleChange("notes", e.target.value)}
                  rows={2}
                  placeholder="Additional notes..."
                  className="w-full px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--card)] text-[var(--text)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)] resize-none"
                />
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-[var(--border)]">
              <Button
                type="button"
                variant="secondary"
                onClick={onClose}
                disabled={submitLoading}
              >
                Cancel
              </Button>
              <Button type="submit" variant="primary" disabled={submitLoading}>
                {submitLoading
                  ? "Saving..."
                  : isEdit
                    ? "Update Contract"
                    : "Create Contract"}
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </div>
  );
}

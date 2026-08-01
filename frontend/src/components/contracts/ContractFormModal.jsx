// src/components/contracts/ContractFormModal.jsx
import { useState, useEffect } from "react";
import { X } from "lucide-react";
import Card from "../ui/Card";
import Button from "../ui/Button";
import Input from "../ui/Input";
import Select from "../ui/Select";
import { fieldLabelClass, textareaControlClass } from "../ui/formStyles.jsx";
import useFetch from "../../hooks/useFetch";
import PermissionWrapper from "../../auth/PermissionWrapper";
import { useLanguage } from "../../hooks/useLanguage";

const DEFAULT_CURRENCY = "AFN";

const emptyForm = {
  project: "",
  subcontractor: "",
  title: "",
  scope_of_work: "",
  currency: DEFAULT_CURRENCY,
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
  const { t } = useLanguage();

  const STATUS_OPTIONS = [
    { value: "draft", label: t("ContractFormModal.statusOptions.draft") },
    { value: "active", label: t("ContractFormModal.statusOptions.active") },
    {
      value: "completed",
      label: t("ContractFormModal.statusOptions.completed"),
    },
    {
      value: "terminated",
      label: t("ContractFormModal.statusOptions.terminated"),
    },
    {
      value: "cancelled",
      label: t("ContractFormModal.statusOptions.cancelled"),
    },
  ];

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

  const normalizeValue = (value) => {
    if (value && typeof value === "object" && "target" in value) {
      return value.target.value;
    }
    return value ?? "";
  };

  const normalizedForm = () => ({
    ...form,
    project: normalizeValue(form.project),
    subcontractor: normalizeValue(form.subcontractor),
    title: String(normalizeValue(form.title)).trim(),
    scope_of_work: String(normalizeValue(form.scope_of_work)).trim(),
    currency: String(normalizeValue(form.currency) || DEFAULT_CURRENCY).trim(),
    contract_value: normalizeValue(form.contract_value),
    retention_percentage: normalizeValue(form.retention_percentage),
    start_date: String(normalizeValue(form.start_date)).trim(),
    end_date: String(normalizeValue(form.end_date)).trim(),
    completion_percentage: normalizeValue(form.completion_percentage),
    status: normalizeValue(form.status),
    notes: String(normalizeValue(form.notes)).trim(),
  });

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
    setForm((prev) => ({ ...prev, [field]: normalizeValue(value) }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }));
    }
  };

  const validate = () => {
    const newErrors = {};
    const values = normalizedForm();

    if (!values.project)
      newErrors.project = t("ContractFormModal.validation.projectRequired");
    if (!values.subcontractor)
      newErrors.subcontractor = t(
        "ContractFormModal.validation.subcontractorRequired",
      );
    if (!values.title)
      newErrors.title = t("ContractFormModal.validation.titleRequired");
    if (!values.currency)
      newErrors.currency = t("ContractFormModal.validation.currencyRequired");
    if (!values.contract_value || Number(values.contract_value) <= 0)
      newErrors.contract_value = t(
        "ContractFormModal.validation.contractValuePositive",
      );
    if (!values.start_date)
      newErrors.start_date = t(
        "ContractFormModal.validation.startDateRequired",
      );
    // if (!form.end_date) newErrors.end_date = "End date is required";
    if (values.start_date && values.end_date && values.start_date > values.end_date)
      newErrors.end_date = t("ContractFormModal.validation.endDateInvalid");
    if (
      values.completion_percentage !== "" &&
      (Number(values.completion_percentage) < 0 ||
        Number(values.completion_percentage) > 100)
    )
      newErrors.completion_percentage = t(
        "ContractFormModal.validation.progressRange",
      );

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validate()) {
      return;
    }

    const values = normalizedForm();
    const payload = {
      ...values,
      contract_value: Number(values.contract_value),
      retention_percentage: Number(values.retention_percentage),
      completion_percentage: Number(values.completion_percentage),
    };

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
  const contractValuePlaceholder =
    form.currency === "USD"
      ? "$0.00"
      : form.currency
        ? `${form.currency} 0.00`
        : "0.00";

  if (!isOpen) return null;

  return (
    <div className="mobile-modal-surface fixed inset-0 z-50 flex">
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="mobile-modal-panel relative w-full max-w-2xl overflow-hidden rounded-2xl">
        <Card
          className="flex h-full min-h-0 flex-col p-0"
          contentClassName="flex min-h-0 flex-1 flex-col p-0"
        >
          <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col">
            {/* Header */}
            <div className="mobile-modal-header flex items-center justify-between px-6 py-4 border-b border-[var(--border)]">
              <h2 className="text-lg font-semibold text-[var(--text)]">
                {isEdit
                  ? t("ContractFormModal.titleEdit")
                  : t("ContractFormModal.titleCreate")}
              </h2>
              <button
                type="button"
                onClick={onClose}
                className="inline-flex h-11 w-11 items-center justify-center rounded-lg hover:bg-[var(--hover)] text-[var(--text)] sm:h-9 sm:w-9"
                aria-label={t("common.close")}
              >
                <X size={20} />
              </button>
            </div>

            {/* Body */}
            <div className="mobile-modal-content px-6 py-4 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Select
                  label={t("ContractFormModal.fields.project")}
                  value={form.project}
                  onChange={(val) => handleChange("project", val)}
                  options={projectOptions}
                  placeholder={t("ContractFormModal.placeholders.project")}
                  // disabled={isEdit}
                  error={errors.project}
                  required
                />
                <Select
                  label={t("ContractFormModal.fields.subcontractor")}
                  value={form.subcontractor}
                  onChange={(val) => handleChange("subcontractor", val)}
                  options={subcontractorOptions}
                  placeholder={t(
                    "ContractFormModal.placeholders.subcontractor",
                  )}
                  // disabled={isEdit}
                  error={errors.subcontractor}
                  required
                />
              </div>

              <Input
                label={t("ContractFormModal.fields.title")}
                value={form.title}
                onChange={(val) => handleChange("title", val)}
                placeholder={t("ContractFormModal.placeholders.title")}
                error={errors.title}
                required
              />

              <div>
                <label className={fieldLabelClass}>
                  {t("ContractFormModal.fields.scopeOfWork")}
                </label>
                <textarea
                  value={form.scope_of_work}
                  onChange={(e) =>
                    handleChange("scope_of_work", e.target.value)
                  }
                  rows={3}
                  placeholder={t("ContractFormModal.placeholders.scopeOfWork")}
                  className={textareaControlClass}
                />
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <Select
                  label={t("ContractFormModal.fields.currency")}
                  value={form.currency}
                  onChange={(value) => handleChange("currency", value)}
                  options={CURRENCY_OPTIONS}
                  error={errors.currency}
                  required
                />
                <Input
                  label={t("ContractFormModal.fields.contractValue")}
                  type="number"
                  value={form.contract_value}
                  onChange={(val) => handleChange("contract_value", val)}
                  placeholder={contractValuePlaceholder}
                  min="0"
                  step="0.01"
                  error={errors.contract_value}
                  required
                />
                <Input
                  label={t("ContractFormModal.fields.retentionPercentage")}
                  type="number"
                  value={form.retention_percentage}
                  onChange={(val) => handleChange("retention_percentage", val)}
                  placeholder={t(
                    "ContractFormModal.placeholders.retentionPercentage",
                  )}
                  min="0"
                  max="100"
                  step="0.01"
                />
                <Input
                  label={t("ContractFormModal.fields.completionPercentage")}
                  type="number"
                  value={form.completion_percentage}
                  onChange={(val) => handleChange("completion_percentage", val)}
                  placeholder={t(
                    "ContractFormModal.placeholders.completionPercentage",
                  )}
                  min="0"
                  max="100"
                  step="0.01"
                  error={errors.completion_percentage}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label={t("ContractFormModal.fields.startDate")}
                  name="start_date"
                  type="date"
                  value={form.start_date}
                  onChange={(val) => handleChange("start_date", val)}
                  error={errors.start_date}
                  module="contracts"
                  required
                />
                <Input
                  label={t("ContractFormModal.fields.endDate")}
                  name="end_date"
                  type="date"
                  value={form.end_date}
                  onChange={(val) => handleChange("end_date", val)}
                  error={errors.end_date}
                  module="contracts"
                />
              </div>

              <Select
                label={t("ContractFormModal.fields.status")}
                value={form.status}
                onChange={(val) => handleChange("status", val)}
                options={STATUS_OPTIONS}
              />

              <div>
                <label className={fieldLabelClass}>
                  {t("ContractFormModal.fields.notes")}
                </label>
                <textarea
                  value={form.notes}
                  onChange={(e) => handleChange("notes", e.target.value)}
                  rows={2}
                  placeholder={t("ContractFormModal.placeholders.notes")}
                  className={textareaControlClass}
                />
              </div>
            </div>

            {/* Footer */}
            <div className="mobile-modal-footer flex items-center justify-end gap-3 px-6 py-4 border-t border-[var(--border)]">
              <Button
                type="button"
                variant="secondary"
                onClick={onClose}
                disabled={submitLoading}
              >
                {t("ContractFormModal.buttons.cancel")}
              </Button>
              <PermissionWrapper
                permissions={[isEdit ? "contracts.update" : "contracts.create"]}
                fallback={
                  <Button
                    type="submit"
                    variant="primary"
                    disabled
                    title="You do not have permission for this action"
                  >
                    {isEdit
                      ? t("ContractFormModal.buttons.update")
                      : t("ContractFormModal.buttons.create")}
                  </Button>
                }
              >
                <Button
                  type="submit"
                  variant="primary"
                  disabled={submitLoading}
                >
                  {submitLoading
                    ? t("ContractFormModal.buttons.saving")
                    : isEdit
                      ? t("ContractFormModal.buttons.update")
                      : t("ContractFormModal.buttons.create")}
                </Button>
              </PermissionWrapper>
            </div>
          </form>
        </Card>
      </div>
    </div>
  );
}

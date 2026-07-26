import { useState, useEffect } from "react";
import { X, Save, DollarSign, User, Calendar, Building2 } from "lucide-react";
import PermissionWrapper from "../../auth/PermissionWrapper";
import Button from "../../components/ui/Button";
import { useLanguage } from "../../hooks/useLanguage";
import { getFriendlyErrorMessage } from "../../utils/apiErrors";
import {
  fieldControlClass,
  fieldControlErrorClass,
  fieldErrorClass,
  fieldLabelClass,
  RequiredMark,
  textareaControlClass,
} from "../../components/ui/formStyles.jsx";
import CalendarDatePicker from "../../components/common/CalendarDatePicker";
import { todayIso } from "../../utils/calendar";

const RTL_LANGS = ["dr", "ps", "fa", "dar", "prs"];

const PROJECT_EXPENSE_CATEGORIES = [
  ["general", "general"],
  ["construction", "construction"],
  ["material", "material"],
  ["staff_salary", "staffSalary"],
  ["daily_wage", "dailyWage"],
  ["equipment", "equipment"],
  ["utility", "utility"],
  ["contract_payment", "contractPayment"],
  ["other", "other"],
];

const OFFICE_EXPENSE_CATEGORIES = [
  ["office_rent", "officeRent"],
  ["utilities", "utilities"],
  ["internet", "internet"],
  ["office_supplies", "officeSupplies"],
  ["staff_meals", "staffMeals"],
  ["transportation", "transportation"],
  ["fuel", "fuel"],
  ["cleaning", "cleaning"],
  ["maintenance", "maintenance"],
  ["equipment", "equipment"],
  ["miscellaneous", "miscellaneous"],
];

export default function ExpenseCreateModal({
  isOpen,
  onClose,
  onCreate,
  projects = [],
}) {
  const { t, lang } = useLanguage();
  const isRTL = RTL_LANGS.includes(lang);

  const [formData, setFormData] = useState({
    description: "",
    expense_date: "",
    amount_usd: "",
    amount_afn: "",
    exchange_rate: "",
    paid_to: "",
    expense_scope: "project",
    expense_type: "general",
    remarks: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (isOpen) {
      setFormData({
        description: "",
        expense_date: todayIso(),
        amount_usd: "",
        amount_afn: "",
        exchange_rate: "68.2",
        paid_to: "",
        expense_scope: "project",
        expense_type: "general",
        remarks: "",
        project: "",
      });

      setErrors({});
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const controlClass = (hasError = false, extra = "") =>
    `${fieldControlClass} ${hasError ? fieldControlErrorClass : ""} ${extra}`;

  const handleChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
      ...(field === "expense_scope" && value === "office"
        ? { project: "", expense_type: "office_rent" }
        : {}),
      ...(field === "expense_scope" && value === "project"
        ? { expense_type: "general" }
        : {}),
    }));
    // Clear error for this field
    if (errors[field]) {
      setErrors((prev) => ({
        ...prev,
        [field]: null,
        ...(field === "expense_scope" ? { project: null } : {}),
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.description?.trim()) {
      newErrors.description = t("ExpenseCreateModal.descriptionRequired");
    }
    if (!formData.expense_date) {
      newErrors.expense_date = t("ExpenseCreateModal.dateRequired");
    }
    if (!formData.amount_usd && !formData.amount_afn) {
      newErrors.amount = t("ExpenseCreateModal.amountRequired");
    }
    if (formData.expense_scope === "project" && !formData.project) {
      newErrors.project = t("ExpenseCreateModal.projectRequired");
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) return;

    setIsSubmitting(true);

    try {
      const usd = parseFloat(formData.amount_usd) || 0;
      const afn = parseFloat(formData.amount_afn) || 0;
      const rate = parseFloat(formData.exchange_rate) || 68.2;

      const payload = {
        ...formData,
        project: formData.expense_scope === "office" ? null : formData.project,
        amount_usd: usd,
        amount_afn: afn,
        exchange_rate: rate,
      };

      await onCreate(payload);

      onClose();
    } catch (error) {
      setErrors({
        submit: getFriendlyErrorMessage(
          error,
          t("ExpenseCreateModal.createFailed"),
        ),
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 z-40 transition-opacity"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="mobile-modal-surface fixed inset-0 z-50 flex">
        <div
          dir={isRTL ? "rtl" : "ltr"}
          className="mobile-modal-panel relative w-full max-w-2xl overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--card)] shadow-2xl"
        >
          {/* Header */}
          <div className="mobile-modal-header sticky top-0 z-10 flex items-center justify-between border-b border-[var(--border)] bg-[var(--bg)]/80 backdrop-blur-sm px-6 py-4">
            <div>
              <h2 className="text-xl font-semibold text-[var(--text)]">
                {t("ExpenseCreateModal.title")}
              </h2>
              <p className="text-sm text-[var(--muted)] mt-0.5">
                {t("ExpenseCreateModal.subtitle")}
              </p>
            </div>
            <button
              onClick={onClose}
              className="inline-flex h-11 w-11 items-center justify-center rounded-lg text-[var(--muted)] hover:bg-[var(--hover)] hover:text-[var(--text)] transition-colors sm:h-10 sm:w-10"
              aria-label="Close"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Form */}
          <form
            onSubmit={handleSubmit}
            className="flex min-h-0 flex-1 flex-col"
          >
            <div className="mobile-modal-content p-6 space-y-6">
              {/* Description */}
              <div>
                <label className={fieldLabelClass}>
                  {t("ExpenseCreateModal.description")} <RequiredMark />
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => handleChange("description", e.target.value)}
                  rows={3}
                  className={`${textareaControlClass} ${
                    errors.description ? fieldControlErrorClass : ""
                  }`}
                  placeholder={t("ExpenseCreateModal.enterDescription")}
                />
                {errors.description && (
                  <p className={fieldErrorClass}>{errors.description}</p>
                )}
              </div>

              {/* Date */}
              <div>
                <label className={fieldLabelClass}>
                  {t("ExpenseCreateModal.expenseDate")} <RequiredMark />
                </label>
                <div className="relative">
                  <Calendar className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--muted)]" />
                  <CalendarDatePicker
                    value={formData.expense_date}
                    onChange={(value) => handleChange("expense_date", value)}
                    module="expenses"
                    className="ps-10"
                  />
                </div>
                {errors.expense_date && (
                  <p className={fieldErrorClass}>{errors.expense_date}</p>
                )}
              </div>

              {/* Amounts */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className={fieldLabelClass}>
                    {t("ExpenseCreateModal.amountUsd")} <RequiredMark />
                  </label>
                  <div className="relative">
                    <DollarSign className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--muted)]" />
                    <input
                      type="number"
                      step="0.01"
                      value={formData.amount_usd}
                      onChange={(e) =>
                        handleChange("amount_usd", e.target.value)
                      }
                      className={controlClass(errors.amount, "ps-10")}
                      placeholder="0.00"
                    />
                  </div>
                </div>

                <div>
                  <label className={fieldLabelClass}>
                    {t("ExpenseCreateModal.amountAfn")} <RequiredMark />
                  </label>
                  <div className="relative">
                    <span className="absolute start-3 top-1/2 -translate-y-1/2 text-[var(--muted)] font-medium">
                      ؋
                    </span>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.amount_afn}
                      onChange={(e) =>
                        handleChange("amount_afn", e.target.value)
                      }
                      className={controlClass(errors.amount, "ps-10")}
                      placeholder="0.00"
                    />
                  </div>
                </div>
              </div>
              {errors.amount && (
                <p className={fieldErrorClass}>{errors.amount}</p>
              )}

              {/* Exchange Rate */}
              <div>
                <label className={fieldLabelClass}>
                  {t("ExpenseCreateModal.exchangeRate")}
                </label>
                <input
                  type="number"
                  step="0.0001"
                  value={formData.exchange_rate}
                  onChange={(e) =>
                    handleChange("exchange_rate", e.target.value)
                  }
                  className={fieldControlClass}
                  placeholder="68.2000"
                />
              </div>

              {/* Paid To */}
              <div>
                <label className={fieldLabelClass}>
                  {t("ExpenseCreateModal.paidTo")}
                </label>
                <div className="relative">
                  <User className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--muted)]" />
                  <input
                    type="text"
                    value={formData.paid_to}
                    onChange={(e) => handleChange("paid_to", e.target.value)}
                    className={`${fieldControlClass} ps-10`}
                    placeholder={t("ExpenseCreateModal.paidToPlaceholder")}
                  />
                </div>
              </div>

              {/* Expense Scope */}
              <div>
                <label className={fieldLabelClass}>
                  {t("ExpenseCreateModal.expenseType")}
                </label>
                <div className="relative">
                  <Building2 className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--muted)]" />
                  <select
                    value={formData.expense_scope}
                    onChange={(e) =>
                      handleChange("expense_scope", e.target.value)
                    }
                    className={`${fieldControlClass} ps-10`}
                  >
                    <option value="project">
                      {t("ExpenseCreateModal.projectExpense")}
                    </option>
                    <option value="office">
                      {t("ExpenseCreateModal.officeExpense")}
                    </option>
                  </select>
                </div>
              </div>

              {/* Category */}
              <div>
                <label className={fieldLabelClass}>
                  {t("ExpenseCreateModal.category")}
                </label>
                <select
                  value={formData.expense_type}
                  onChange={(e) => handleChange("expense_type", e.target.value)}
                  className={fieldControlClass}
                >
                  {(formData.expense_scope === "office"
                    ? OFFICE_EXPENSE_CATEGORIES
                    : PROJECT_EXPENSE_CATEGORIES
                  ).map(([value, labelKey]) => (
                    <option key={value} value={value}>
                      {t(`ExpenseCreateModal.${labelKey}`)}
                    </option>
                  ))}
                </select>
              </div>

              {/* Project */}
              {formData.expense_scope === "project" && (
                <div>
                  <label className={fieldLabelClass}>
                    {t("ExpenseCreateModal.project")} <RequiredMark />
                  </label>

                  <select
                    value={formData.project}
                    onChange={(e) => handleChange("project", e.target.value)}
                    className={controlClass(errors.project)}
                  >
                    <option value="">
                      {t("ExpenseCreateModal.selectProject")}
                    </option>

                    {projects.map((project) => (
                      <option key={project.id} value={project.id}>
                        {project.name}
                      </option>
                    ))}
                  </select>

                  {errors.project && (
                    <p className={fieldErrorClass}>{errors.project}</p>
                  )}
                </div>
              )}

              {/* Remarks */}
              <div>
                <label className={fieldLabelClass}>
                  {t("ExpenseCreateModal.remarks")}
                </label>
                <textarea
                  value={formData.remarks}
                  onChange={(e) => handleChange("remarks", e.target.value)}
                  rows={2}
                  className={textareaControlClass}
                  placeholder={t("ExpenseCreateModal.remarksPlaceholder")}
                />
              </div>

              {/* Error Message */}
              {errors.submit && (
                <div className="rounded-lg border border-[var(--danger)]/20 bg-[var(--danger)]/10 p-4">
                  <p className="text-sm text-[var(--danger)]">
                    {errors.submit}
                  </p>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="mobile-modal-footer flex items-center justify-end gap-3 border-t border-[var(--border)] px-6 py-4">
              <button
                type="button"
                onClick={onClose}
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-lg border border-[var(--border)] bg-[var(--card)] px-6 py-2.5 text-sm font-medium text-[var(--text)] hover:bg-[var(--hover)] transition-colors"
              >
                {t("ExpenseCreateModal.cancel")}
              </button>
              <PermissionWrapper
                permissions={["expenses.create"]}
                fallback={
                  <Button
                    type="submit"
                    variant="primary"
                    disabled
                    title={t("ExpenseCreateModal.noPermission")}
                  >
                    {t("ExpenseCreateModal.createExpense")}
                  </Button>
                }
              >
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="inline-flex min-h-12 items-center justify-center gap-2 rounded-lg bg-[var(--primary)] px-6 py-2.5 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <Save className="h-4 w-4" />
                  {isSubmitting
                    ? t("ExpenseCreateModal.creating")
                    : t("ExpenseCreateModal.createExpense")}
                </button>
              </PermissionWrapper>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}

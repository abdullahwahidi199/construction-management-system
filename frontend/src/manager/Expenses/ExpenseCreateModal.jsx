import { useState, useEffect } from "react";
import { X, Save, DollarSign, User, FileText, Calendar } from "lucide-react";
import PermissionWrapper from "../../auth/PermissionWrapper";
import Button from "../../components/ui/Button";
import { useLanguage } from "../../hooks/useLanguage";

const RTL_LANGS = ["dr", "ps", "fa", "dar", "prs"];

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
    expense_type: "general",
    remarks: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (isOpen) {
      setFormData({
        description: "",
        expense_date: new Date().toISOString().split("T")[0],
        amount_usd: "",
        amount_afn: "",
        exchange_rate: "68.2",
        paid_to: "",
        expense_type: "general",
        remarks: "",
        project: "",
      });

      setErrors({});
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
    // Clear error for this field
    if (errors[field]) {
      setErrors((prev) => ({
        ...prev,
        [field]: null,
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
    if (!formData.project) {
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
        amount_usd: usd,
        amount_afn: afn,
        exchange_rate: rate,
      };

      await onCreate(payload);

      onClose();
    } catch (error) {
      console.error(error);
      setErrors({
        submit: t("ExpenseCreateModal.createFailed"),
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
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div
          dir={isRTL ? "rtl" : "ltr"}
          className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl border border-[var(--border)] bg-[var(--card)] shadow-2xl"
        >
          {/* Header */}
          <div className="sticky top-0 z-10 flex items-center justify-between border-b border-[var(--border)] bg-[var(--bg)]/80 backdrop-blur-sm px-6 py-4">
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
              className="inline-flex h-10 w-10 items-center justify-center rounded-lg text-[var(--muted)] hover:bg-[var(--hover)] hover:text-[var(--text)] transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-[var(--text)] mb-2">
                {t("ExpenseCreateModal.description")}{" "}
                <span className="text-red-500">*</span>
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => handleChange("description", e.target.value)}
                rows={3}
                className={`w-full rounded-xl border ${
                  errors.description
                    ? "border-red-500"
                    : "border-[var(--border)]"
                } bg-[var(--bg)] px-4 py-3 text-sm text-[var(--text)] placeholder-[var(--muted)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)] transition-colors`}
                placeholder={t("ExpenseCreateModal.enterDescription")}
              />
              {errors.description && (
                <p className="mt-1 text-xs text-red-500">
                  {errors.description}
                </p>
              )}
            </div>

            {/* Date */}
            <div>
              <label className="block text-sm font-medium text-[var(--text)] mb-2">
                {t("ExpenseCreateModal.expenseDate")}{" "}
                <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Calendar className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--muted)]" />
                <input
                  type="date"
                  value={formData.expense_date}
                  onChange={(e) => handleChange("expense_date", e.target.value)}
                  className={`w-full rounded-xl border ${
                    errors.expense_date
                      ? "border-red-500"
                      : "border-[var(--border)]"
                  } bg-[var(--bg)] ps-10 pe-4 py-3 text-sm text-[var(--text)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)] transition-colors`}
                />
              </div>
              {errors.expense_date && (
                <p className="mt-1 text-xs text-red-500">
                  {errors.expense_date}
                </p>
              )}
            </div>

            {/* Amounts */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-[var(--text)] mb-2">
                  {t("ExpenseCreateModal.amountUsd")}
                </label>
                <div className="relative">
                  <DollarSign className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--muted)]" />
                  <input
                    type="number"
                    step="0.01"
                    value={formData.amount_usd}
                    onChange={(e) => handleChange("amount_usd", e.target.value)}
                    className={`w-full rounded-xl border ${
                      errors.amount
                        ? "border-red-500"
                        : "border-[var(--border)]"
                    } bg-[var(--bg)] ps-10 pe-4 py-3 text-sm text-[var(--text)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)] transition-colors`}
                    placeholder="0.00"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-[var(--text)] mb-2">
                  {t("ExpenseCreateModal.amountAfn")}
                </label>
                <div className="relative">
                  <span className="absolute start-3 top-1/2 -translate-y-1/2 text-[var(--muted)] font-medium">
                    ؋
                  </span>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.amount_afn}
                    onChange={(e) => handleChange("amount_afn", e.target.value)}
                    className={`w-full rounded-xl border ${
                      errors.amount
                        ? "border-red-500"
                        : "border-[var(--border)]"
                    } bg-[var(--bg)] ps-10 pe-4 py-3 text-sm text-[var(--text)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)] transition-colors`}
                    placeholder="0.00"
                  />
                </div>
              </div>
            </div>
            {errors.amount && (
              <p className="text-xs text-red-500">{errors.amount}</p>
            )}

            {/* Exchange Rate */}
            <div>
              <label className="block text-sm font-medium text-[var(--text)] mb-2">
                {t("ExpenseCreateModal.exchangeRate")}
              </label>
              <input
                type="number"
                step="0.0001"
                value={formData.exchange_rate}
                onChange={(e) => handleChange("exchange_rate", e.target.value)}
                className="w-full rounded-xl border border-[var(--border)] bg-[var(--bg)] px-4 py-3 text-sm text-[var(--text)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)] transition-colors"
                placeholder="68.2000"
              />
            </div>

            {/* Paid To */}
            <div>
              <label className="block text-sm font-medium text-[var(--text)] mb-2">
                {t("ExpenseCreateModal.paidTo")}
              </label>
              <div className="relative">
                <User className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--muted)]" />
                <input
                  type="text"
                  value={formData.paid_to}
                  onChange={(e) => handleChange("paid_to", e.target.value)}
                  className="w-full rounded-xl border border-[var(--border)] bg-[var(--bg)] ps-10 pe-4 py-3 text-sm text-[var(--text)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)] transition-colors"
                  placeholder={t("ExpenseCreateModal.paidToPlaceholder")}
                />
              </div>
            </div>

            {/* Expense Type */}
            <div>
              <label className="block text-sm font-medium text-[var(--text)] mb-2">
                {t("ExpenseCreateModal.expenseType")}
              </label>
              <select
                value={formData.expense_type}
                onChange={(e) => handleChange("expense_type", e.target.value)}
                className="w-full rounded-xl border border-[var(--border)] bg-[var(--bg)] px-4 py-3 text-sm text-[var(--text)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)] transition-colors"
              >
                <option value="general">
                  {t("ExpenseCreateModal.general")}
                </option>
                <option value="construction">
                  {t("ExpenseCreateModal.construction")}
                </option>
                <option value="material">
                  {t("ExpenseCreateModal.material")}
                </option>
                <option value="daily_wage">
                  {t("ExpenseCreateModal.dailyWage")}
                </option>
                <option value="equipment">
                  {t("ExpenseCreateModal.equipment")}
                </option>
                <option value="utility">
                  {t("ExpenseCreateModal.utility")}
                </option>
                <option value="contract_payment">
                  {t("ExpenseCreateModal.contractPayment")}
                </option>
                <option value="other">{t("ExpenseCreateModal.other")}</option>
              </select>
            </div>

            {/* Project */}
            <div>
              <label className="block text-sm font-medium text-[var(--text)] mb-2">
                {t("ExpenseCreateModal.project")}{" "}
                <span className="text-red-500">*</span>
              </label>

              <select
                value={formData.project}
                onChange={(e) => handleChange("project", e.target.value)}
                className={`w-full rounded-xl border ${
                  errors.project ? "border-red-500" : "border-[var(--border)]"
                } bg-[var(--bg)] px-4 py-3 text-sm text-[var(--text)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]`}
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
                <p className="mt-1 text-xs text-red-500">{errors.project}</p>
              )}
            </div>

            {/* Remarks */}
            <div>
              <label className="block text-sm font-medium text-[var(--text)] mb-2">
                {t("ExpenseCreateModal.remarks")}
              </label>
              <textarea
                value={formData.remarks}
                onChange={(e) => handleChange("remarks", e.target.value)}
                rows={2}
                className="w-full rounded-xl border border-[var(--border)] bg-[var(--bg)] px-4 py-3 text-sm text-[var(--text)] placeholder-[var(--muted)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)] transition-colors"
                placeholder={t("ExpenseCreateModal.remarksPlaceholder")}
              />
            </div>

            {/* Error Message */}
            {errors.submit && (
              <div className="rounded-xl bg-red-500/10 border border-red-500/20 p-4">
                <p className="text-sm text-red-600">{errors.submit}</p>
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-[var(--border)]">
              <button
                type="button"
                onClick={onClose}
                className="inline-flex items-center gap-2 rounded-xl border border-[var(--border)] px-6 py-2.5 text-sm font-medium text-[var(--text)] hover:bg-[var(--hover)] transition-colors"
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
                  className="inline-flex items-center gap-2 rounded-xl bg-[var(--primary)] px-6 py-2.5 text-sm font-medium text-white hover:bg-[var(--primary)]/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
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

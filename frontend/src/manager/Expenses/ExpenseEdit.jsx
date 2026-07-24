import { useState, useEffect } from "react";
import { X, Save, DollarSign, User, FileText, Calendar } from "lucide-react";
import PermissionWrapper from "../../auth/PermissionWrapper";
import Button from "../../components/ui/Button";
import { useLanguage } from "../../hooks/useLanguage";
import { getFriendlyErrorMessage } from "../../utils/apiErrors";

const RTL_LANGS = ["dr", "ps", "fa", "dar", "prs"];

export default function ExpenseEdit({ expense, isOpen, onClose, onSave }) {
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

  // Initialize form when expense changes
  useEffect(() => {
    if (expense) {
      setFormData({
        description: expense.description || "",
        expense_date: expense.expense_date?.split("T")[0] || "",
        amount_usd: expense.amount_usd || "0.00",
        amount_afn: expense.amount_afn || "0.00",
        exchange_rate: expense.exchange_rate || "68.20",
        paid_to: expense.paid_to || "",
        expense_type: expense.expense_type || "general",
        remarks: expense.remarks || "",
      });
      setErrors({});
    }
  }, [expense]);

  if (!isOpen || !expense) return null;

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
      newErrors.description = t("ExpenseEdit.descriptionRequired");
    }
    if (!formData.expense_date) {
      newErrors.expense_date = t("ExpenseEdit.dateRequired");
    }
    if (!formData.amount_usd && !formData.amount_afn) {
      newErrors.amount = t("ExpenseEdit.amountRequired");
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) return;

    setIsSubmitting(true);

    try {
      // Calculate totals based on exchange rate
      const usd = parseFloat(formData.amount_usd) || 0;
      const afn = parseFloat(formData.amount_afn) || 0;
      const rate = parseFloat(formData.exchange_rate) || 68.2;

      const totalUsd = usd + afn / rate;
      const totalAfn = afn + usd * rate;

      const updatedExpense = {
        ...expense,
        ...formData,
        amount_usd: usd.toFixed(2),
        amount_afn: afn.toFixed(2),
        exchange_rate: rate.toFixed(4),
        total_usd: totalUsd.toFixed(2),
        total_afn: totalAfn.toFixed(2),
      };

      await onSave?.(updatedExpense);
      onClose();
    } catch (error) {
      setErrors({
        submit: getFriendlyErrorMessage(error, t("ExpenseEdit.saveFailed")),
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
                {t("ExpenseEdit.title")}
              </h2>
              <p className="text-sm text-[var(--muted)] mt-0.5">
                #{expense.serial_number} • {expense.project_name}
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
                {t("ExpenseEdit.description")}{" "}
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
                placeholder={t("ExpenseEdit.enterDescription")}
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
                {t("ExpenseEdit.expenseDate")}{" "}
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
                  {t("ExpenseEdit.amountUsd")}
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
                  {t("ExpenseEdit.amountAfn")}
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
                {t("ExpenseEdit.exchangeRate")}
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
                {t("ExpenseEdit.paidTo")}
              </label>
              <div className="relative">
                <User className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--muted)]" />
                <input
                  type="text"
                  value={formData.paid_to}
                  onChange={(e) => handleChange("paid_to", e.target.value)}
                  className="w-full rounded-xl border border-[var(--border)] bg-[var(--bg)] ps-10 pe-4 py-3 text-sm text-[var(--text)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)] transition-colors"
                  placeholder={t("ExpenseEdit.paidToPlaceholder")}
                />
              </div>
            </div>

            {/* Expense Type */}
            <div>
              <label className="block text-sm font-medium text-[var(--text)] mb-2">
                {t("ExpenseEdit.expenseType")}
              </label>
              <select
                value={formData.expense_type}
                onChange={(e) => handleChange("expense_type", e.target.value)}
                className="w-full rounded-xl border border-[var(--border)] bg-[var(--bg)] px-4 py-3 text-sm text-[var(--text)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)] transition-colors"
              >
                <option value="general">{t("ExpenseEdit.general")}</option>
                <option value="material">{t("ExpenseEdit.material")}</option>
                <option value="daily_wage">{t("ExpenseEdit.dailyWage")}</option>
                <option value="equipment">{t("ExpenseEdit.equipment")}</option>
                <option value="utility">{t("ExpenseEdit.utility")}</option>
                <option value="contract_payment">
                  {t("ExpenseEdit.contractPayment")}
                </option>
                <option value="other">{t("ExpenseEdit.other")}</option>
              </select>
            </div>

            {/* Remarks */}
            <div>
              <label className="block text-sm font-medium text-[var(--text)] mb-2">
                {t("ExpenseEdit.remarks")}
              </label>
              <textarea
                value={formData.remarks}
                onChange={(e) => handleChange("remarks", e.target.value)}
                rows={2}
                className="w-full rounded-xl border border-[var(--border)] bg-[var(--bg)] px-4 py-3 text-sm text-[var(--text)] placeholder-[var(--muted)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)] transition-colors"
                placeholder={t("ExpenseEdit.remarksPlaceholder")}
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
                {t("ExpenseEdit.cancel")}
              </button>
              <PermissionWrapper
                permissions={["expenses.update"]}
                fallback={
                  <Button
                    type="submit"
                    variant="primary"
                    disabled
                    title={t("ExpenseEdit.noPermission")}
                  >
                    {t("ExpenseEdit.updateExpense")}
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
                    ? t("ExpenseEdit.saving")
                    : t("ExpenseEdit.saveChanges")}
                </button>
              </PermissionWrapper>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}

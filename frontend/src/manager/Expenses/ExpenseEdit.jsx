import { useState, useEffect } from "react";
import { X, Save, DollarSign, User, FileText, Calendar } from "lucide-react";

export default function ExpenseEdit({ expense, isOpen, onClose, onSave }) {
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
      newErrors.description = "Description is required";
    }
    if (!formData.expense_date) {
      newErrors.expense_date = "Date is required";
    }
    if (!formData.amount_usd && !formData.amount_afn) {
      newErrors.amount = "At least one amount is required";
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
      console.error("Failed to save expense:", error);
      setErrors({ submit: "Failed to save expense. Please try again." });
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
        <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl border border-[var(--border)] bg-[var(--card)] shadow-2xl">
          {/* Header */}
          <div className="sticky top-0 z-10 flex items-center justify-between border-b border-[var(--border)] bg-[var(--bg)]/80 backdrop-blur-sm px-6 py-4">
            <div>
              <h2 className="text-xl font-semibold text-[var(--text)]">
                Edit Expense
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
                Description <span className="text-red-500">*</span>
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
                placeholder="Enter expense description"
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
                Expense Date <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--muted)]" />
                <input
                  type="date"
                  value={formData.expense_date}
                  onChange={(e) => handleChange("expense_date", e.target.value)}
                  className={`w-full rounded-xl border ${
                    errors.expense_date
                      ? "border-red-500"
                      : "border-[var(--border)]"
                  } bg-[var(--bg)] pl-10 pr-4 py-3 text-sm text-[var(--text)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)] transition-colors`}
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
                  Amount in USD
                </label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--muted)]" />
                  <input
                    type="number"
                    step="0.01"
                    value={formData.amount_usd}
                    onChange={(e) => handleChange("amount_usd", e.target.value)}
                    className={`w-full rounded-xl border ${
                      errors.amount
                        ? "border-red-500"
                        : "border-[var(--border)]"
                    } bg-[var(--bg)] pl-10 pr-4 py-3 text-sm text-[var(--text)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)] transition-colors`}
                    placeholder="0.00"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-[var(--text)] mb-2">
                  Amount in AFN
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted)] font-medium">
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
                    } bg-[var(--bg)] pl-10 pr-4 py-3 text-sm text-[var(--text)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)] transition-colors`}
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
                Exchange Rate
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
                Paid To
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--muted)]" />
                <input
                  type="text"
                  value={formData.paid_to}
                  onChange={(e) => handleChange("paid_to", e.target.value)}
                  className="w-full rounded-xl border border-[var(--border)] bg-[var(--bg)] pl-10 pr-4 py-3 text-sm text-[var(--text)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)] transition-colors"
                  placeholder="Who was this paid to?"
                />
              </div>
            </div>

            {/* Expense Type */}
            <div>
              <label className="block text-sm font-medium text-[var(--text)] mb-2">
                Expense Type
              </label>
              <select
                value={formData.expense_type}
                onChange={(e) => handleChange("expense_type", e.target.value)}
                className="w-full rounded-xl border border-[var(--border)] bg-[var(--bg)] px-4 py-3 text-sm text-[var(--text)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)] transition-colors"
              >
                <option value="general">General</option>
                <option value="material">Material</option>
                <option value="daily_wage">Daily wage</option>
                <option value="equipment">Equipment</option>
                <option value="utility">Utility</option>
                <option value="contract_payment">Contract payment</option>
                <option value="other">Other</option>
              </select>
            </div>

            {/* Remarks */}
            <div>
              <label className="block text-sm font-medium text-[var(--text)] mb-2">
                Remarks
              </label>
              <textarea
                value={formData.remarks}
                onChange={(e) => handleChange("remarks", e.target.value)}
                rows={2}
                className="w-full rounded-xl border border-[var(--border)] bg-[var(--bg)] px-4 py-3 text-sm text-[var(--text)] placeholder-[var(--muted)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)] transition-colors"
                placeholder="Any additional notes..."
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
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="inline-flex items-center gap-2 rounded-xl bg-[var(--primary)] px-6 py-2.5 text-sm font-medium text-white hover:bg-[var(--primary)]/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <Save className="h-4 w-4" />
                {isSubmitting ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}

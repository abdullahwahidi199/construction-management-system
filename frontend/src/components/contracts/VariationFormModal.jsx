// src/components/contracts/VariationFormModal.jsx
import { useState, useEffect } from "react";
import { X } from "lucide-react";
import Card from "../ui/Card";
import Button from "../ui/Button";
import Input from "../ui/Input";
import PermissionWrapper from "../../auth/PermissionWrapper";
import { useLanguage } from "../../hooks/useLanguage";

const emptyForm = {
  description: "",
  amount_change: "",
  days_added: "",
  date: "",
  approved: false,
};

export default function VariationFormModal({
  isOpen,
  onClose,
  onSubmit,
  variation = null,
  loading: submitLoading,
  currency,
}) {
  const isEdit = !!variation;
  const [form, setForm] = useState(emptyForm);
  const [errors, setErrors] = useState({});
  const { t } = useLanguage();

  useEffect(() => {
    if (variation) {
      setForm({
        description: variation.description || "",
        amount_change: variation.amount_change ?? "",
        days_added: variation.days_added ?? "",
        date: variation.date || "",
        approved: variation.approved || false,
      });
    } else {
      setForm(emptyForm);
    }
    setErrors({});
  }, [variation, isOpen]);

  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: "" }));
  };

  const validate = () => {
    const e = {};
    if (!form.description.trim())
      e.description = t("VariationFormModal.descriptionRequired");
    if (form.amount_change === "" || form.amount_change === null)
      e.amount_change = t("VariationFormModal.amountChangeRequired");
    if (!form.date) e.date = t("VariationFormModal.dateRequired");
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    await onSubmit({
      ...form,
      amount_change: Number(form.amount_change),
      days_added: Number(form.days_added) || 0,
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative w-full max-w-md">
        <Card className="p-0">
          <form onSubmit={handleSubmit}>
            <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border)]">
              <h2 className="text-lg font-semibold text-[var(--text)]">
                {isEdit
                  ? t("VariationFormModal.editVariation")
                  : t("VariationFormModal.addVariation")}
              </h2>
              <button
                type="button"
                onClick={onClose}
                className="p-1 rounded-lg hover:bg-[var(--hover)] text-[var(--text)]"
              >
                <X size={20} />
              </button>
            </div>

            <div className="px-6 py-4 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <Input
                  label={t("VariationFormModal.date")}
                  type="date"
                  value={form.date}
                  onChange={(val) => handleChange("date", val)}
                  error={errors.date}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[var(--text)] mb-1">
                  {t("VariationFormModal.description")}
                </label>
                <textarea
                  value={form.description}
                  onChange={(e) => handleChange("description", e.target.value)}
                  rows={3}
                  placeholder={t("VariationFormModal.descriptionPlaceholder")}
                  className="w-full px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--card)] text-[var(--text)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)] resize-none"
                />
                {errors.description && (
                  <p className="text-xs text-[var(--danger)] mt-1">
                    {errors.description}
                  </p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <Input
                  label={`${t("VariationFormModal.amountChange")} (${currency})`}
                  type="number"
                  value={form.amount_change}
                  onChange={(val) => handleChange("amount_change", val)}
                  placeholder={t("VariationFormModal.amountPlaceholder")}
                  step="0.01"
                  error={errors.amount_change}
                />
                <Input
                  label={t("VariationFormModal.daysAdded")}
                  type="number"
                  value={form.days_added}
                  onChange={(val) => handleChange("days_added", val)}
                  placeholder={t("VariationFormModal.daysPlaceholder")}
                />
              </div>

              {isEdit && (
                <div className="flex items-center gap-3">
                  <label className="text-sm font-medium text-[var(--text)]">
                    {t("VariationFormModal.approved")}
                  </label>
                  <button
                    type="button"
                    onClick={() => handleChange("approved", !form.approved)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      form.approved
                        ? "bg-[var(--success)]"
                        : "bg-[var(--muted)]"
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        form.approved ? "translate-x-6" : "translate-x-1"
                      }`}
                    />
                  </button>
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-[var(--border)]">
              <Button
                type="button"
                variant="secondary"
                onClick={onClose}
                disabled={submitLoading}
              >
                {t("VariationFormModal.cancel")}
              </Button>
              <PermissionWrapper
                permissions={[
                  isEdit
                    ? "contract_variations.update"
                    : "contract_variations.create",
                ]}
                fallback={
                  <Button
                    type="submit"
                    variant="primary"
                    disabled
                    title={t("VariationFormModal.permissionDenied")}
                  >
                    {isEdit
                      ? t("VariationFormModal.updateVariations")
                      : t("VariationFormModal.createVariation")}
                  </Button>
                }
              >
                <Button
                  type="submit"
                  variant="primary"
                  disabled={submitLoading}
                >
                  {submitLoading
                    ? t("VariationFormModal.saving")
                    : isEdit
                      ? t("VariationFormModal.updateVariation")
                      : t("VariationFormModal.addVariationButton")}
                </Button>
              </PermissionWrapper>
            </div>
          </form>
        </Card>
      </div>
    </div>
  );
}

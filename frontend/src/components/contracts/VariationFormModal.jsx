// src/components/contracts/VariationFormModal.jsx
import { useState, useEffect } from "react";
import { X } from "lucide-react";
import Card from "../ui/Card";
import Button from "../ui/Button";
import Input from "../ui/Input";
import PermissionWrapper from "../../auth/PermissionWrapper";
import { useLanguage } from "../../hooks/useLanguage";
import { fieldLabelClass, textareaControlClass } from "../ui/formStyles.jsx";

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
    <div className="mobile-modal-surface fixed inset-0 z-50 flex">
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="mobile-modal-panel relative w-full max-w-md overflow-hidden rounded-2xl">
        <Card
          className="flex h-full min-h-0 flex-col p-0"
          contentClassName="flex min-h-0 flex-1 flex-col p-0"
        >
          <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col">
            <div className="mobile-modal-header flex items-center justify-between px-6 py-4 border-b border-[var(--border)]">
              <h2 className="text-lg font-semibold text-[var(--text)]">
                {isEdit
                  ? t("VariationFormModal.editVariation")
                  : t("VariationFormModal.addVariation")}
              </h2>
              <button
                type="button"
                onClick={onClose}
                className="inline-flex h-11 w-11 items-center justify-center rounded-lg hover:bg-[var(--hover)] text-[var(--text)] sm:h-9 sm:w-9"
                aria-label="Close"
              >
                <X size={20} />
              </button>
            </div>

            <div className="mobile-modal-content px-6 py-4 space-y-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Input
                  label={t("VariationFormModal.date")}
                  type="date"
                  value={form.date}
                  onChange={(val) => handleChange("date", val)}
                  error={errors.date}
                  module="contract_variations"
                />
              </div>

              <div>
                <label className={fieldLabelClass}>
                  {t("VariationFormModal.description")}
                </label>
                <textarea
                  value={form.description}
                  onChange={(e) => handleChange("description", e.target.value)}
                  rows={3}
                  placeholder={t("VariationFormModal.descriptionPlaceholder")}
                  className={textareaControlClass}
                />
                {errors.description && (
                  <p className="text-xs text-[var(--danger)] mt-1">
                    {errors.description}
                  </p>
                )}
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
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
                    className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors sm:h-6 sm:w-11 ${
                      form.approved
                        ? "bg-[var(--success)]"
                        : "bg-[var(--muted)]"
                    }`}
                    aria-pressed={form.approved}
                  >
                    <span
                      className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform sm:h-4 sm:w-4 ${
                        form.approved ? "translate-x-8 sm:translate-x-6" : "translate-x-1"
                      }`}
                    />
                  </button>
                </div>
              )}
            </div>

            <div className="mobile-modal-footer flex items-center justify-end gap-3 px-6 py-4 border-t border-[var(--border)]">
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

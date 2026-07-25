// src/components/contracts/PaymentFormModal.jsx
import { useState, useEffect } from "react";
import { X } from "lucide-react";
import { useLanguage } from "../../hooks/useLanguage";
import Card from "../ui/Card";
import Button from "../ui/Button";
import Input from "../ui/Input";
import Select from "../ui/Select";
import PermissionWrapper from "../../auth/PermissionWrapper";

const emptyForm = {
  amount: "",
  payment_date: "",
  payment_type: "progress",
  reference_number: "",
  notes: "",
};

export default function PaymentFormModal({
  isOpen,
  onClose,
  onSubmit,
  payment = null,
  loading: submitLoading,
  maxAmount = null,
  currency,
}) {
  const { t } = useLanguage();
  const isEdit = !!payment;
  const [form, setForm] = useState(emptyForm);
  const [errors, setErrors] = useState({});

  const PAYMENT_TYPE_OPTIONS = [
    { value: "advance", label: t("PaymentFormModal.advance") },
    { value: "progress", label: t("PaymentFormModal.progressPayment") },
    {
      value: "retention_release",
      label: t("PaymentFormModal.retentionRelease"),
    },
    { value: "final", label: t("PaymentFormModal.finalPayment") },
    { value: "other", label: t("PaymentFormModal.other") },
  ];

  useEffect(() => {
    if (payment) {
      setForm({
        amount: payment.amount || "",
        payment_date: payment.payment_date || "",
        payment_type: payment.payment_type || "progress",
        reference_number: payment.reference_number || "",
        notes: payment.notes || "",
      });
    } else {
      setForm(emptyForm);
    }
    setErrors({});
  }, [payment, isOpen]);

  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: "" }));
  };

  const validate = () => {
    const e = {};
    if (!form.amount || Number(form.amount) <= 0)
      e.amount = t("PaymentFormModal.amountMustBePositive");
    if (maxAmount !== null && Number(form.amount) > maxAmount)
      e.amount = t("PaymentFormModal.amountExceedsRemaining", {
        amount: `${currency || ""}${maxAmount.toLocaleString()}`,
      });
    if (!form.payment_date)
      e.payment_date = t("PaymentFormModal.paymentDateRequired");
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    await onSubmit({
      ...form,
      amount: Number(form.amount),
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
                  ? t("PaymentFormModal.editPayment")
                  : t("PaymentFormModal.addPayment")}
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
              <Input
                label={`${t("PaymentFormModal.amount")} (${currency})`}
                type="number"
                value={form.amount}
                onChange={(val) => handleChange("amount", val)}
                placeholder={t("PaymentFormModal.amountPlaceholder")}
                min="0"
                step="0.01"
                error={errors.amount}
              />

              <Input
                label={t("PaymentFormModal.paymentDate")}
                type="date"
                value={form.payment_date}
                onChange={(val) => handleChange("payment_date", val)}
                error={errors.payment_date}
                module="contract_payments"
              />

              <Select
                label={t("PaymentFormModal.paymentType")}
                value={form.payment_type}
                onChange={(val) => handleChange("payment_type", val)}
                options={PAYMENT_TYPE_OPTIONS}
              />

              <Input
                label={t("PaymentFormModal.referenceNumber")}
                value={form.reference_number}
                onChange={(val) => handleChange("reference_number", val)}
                placeholder={t("PaymentFormModal.referencePlaceholder")}
              />

              <div>
                <label className="block text-sm font-medium text-[var(--text)] mb-1">
                  {t("PaymentFormModal.notes")}
                </label>
                <textarea
                  value={form.notes}
                  onChange={(e) => handleChange("notes", e.target.value)}
                  rows={2}
                  placeholder={t("PaymentFormModal.optionalNotes")}
                  className="w-full px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--card)] text-[var(--text)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)] resize-none"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-[var(--border)]">
              <Button
                type="button"
                variant="secondary"
                onClick={onClose}
                disabled={submitLoading}
              >
                {t("PaymentFormModal.cancel")}
              </Button>
              <PermissionWrapper
                permissions={[
                  payment
                    ? "contract_payments.update"
                    : "contract_payments.create",
                ]}
                fallback={
                  <Button
                    type="submit"
                    variant="primary"
                    disabled
                    title={t("PaymentFormModal.permissionDenied")}
                  >
                    {payment
                      ? t("PaymentFormModal.updatePayment")
                      : t("PaymentFormModal.createPayment")}
                  </Button>
                }
              >
                <Button
                  type="submit"
                  variant="primary"
                  disabled={submitLoading}
                >
                  {submitLoading
                    ? t("PaymentFormModal.saving")
                    : isEdit
                      ? t("PaymentFormModal.updatePayment")
                      : t("PaymentFormModal.addPaymentButton")}
                </Button>
              </PermissionWrapper>
            </div>
          </form>
        </Card>
      </div>
    </div>
  );
}

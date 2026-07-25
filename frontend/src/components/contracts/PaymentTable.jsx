import { useState } from "react";
import { Edit, Trash2, DollarSign, Printer } from "lucide-react";
import { useLanguage } from "../../hooks/useLanguage";
import { useCalendar } from "../../hooks/useCalendar";
import PermissionWrapper from "../../auth/PermissionWrapper";
import PrintableReceiptModal from "../common/PrintableReceiptModal";

const formatter = new Intl.NumberFormat("en-US", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

export default function PaymentTable({
  payments = [],
  onEdit,
  onDelete,
  loading,
  currency,
  contractContext,
}) {
  const { t } = useLanguage();
  const { formatDate, formatDateTime } = useCalendar("contract_payments");
  const [receiptPayment, setReceiptPayment] = useState(null);

  const displayDate = (payment) =>
    formatDate(payment.payment_date) || payment.formatted_payment_date || "-";

  const paymentCurrency = (payment) =>
    currency || payment.currency || contractContext?.currency || "";

  const formatAmount = (amount, currencyCode) =>
    `${currencyCode ? `${currencyCode} ` : ""}${formatter.format(amount)}`;

  const TYPE_LABELS = {
    advance: t("PaymentTable.advance"),
    progress: t("PaymentTable.progress"),
    retention_release: t("PaymentTable.retentionRelease"),
    final: t("PaymentTable.final"),
    other: t("PaymentTable.other"),
  };

  const TYPE_COLORS = {
    advance: "bg-blue-500/15 text-blue-500",
    progress: "bg-[var(--primary)]/15 text-[var(--primary)]",
    retention_release: "bg-amber-500/15 text-amber-500",
    final: "bg-[var(--success)]/15 text-[var(--success)]",
    other: "bg-[var(--muted)]/20 text-[var(--muted)]",
  };

  const paymentTypeLabel = (payment) =>
    TYPE_LABELS[payment.payment_type] ||
    payment.payment_type_display ||
    payment.payment_type ||
    "-";

  const buildReceipt = (payment) => {
    const currencyCode = paymentCurrency(payment);
    const contractNumber =
      contractContext?.contract_number ||
      payment.contract_number ||
      (payment.contract ? `#${payment.contract}` : "-");
    const contractTitle =
      contractContext?.title || payment.contract_title || "-";
    const projectName =
      contractContext?.project_name || payment.project_name || "-";
    const subcontractorName =
      contractContext?.subcontractor_name ||
      contractContext?.subcontractor?.name ||
      payment.subcontractor_name ||
      "-";

    return {
      title: "Contract Payment Receipt",
      subtitle: contractTitle,
      receiptNumber:
        payment.reference_number || `CP-${String(payment.id || "").padStart(6, "0")}`,
      receiptDate: displayDate(payment),
      status: paymentTypeLabel(payment),
      amountLabel: "Amount Paid",
      amount: payment.amount,
      currency: currencyCode,
      details: [
        { label: "Contract No.", value: contractNumber },
        { label: "Contract Title", value: contractTitle },
        { label: "Project", value: projectName },
        { label: "Subcontractor", value: subcontractorName },
        { label: "Payment Type", value: paymentTypeLabel(payment) },
        { label: "Payment Date", value: displayDate(payment) },
        { label: "Reference", value: payment.reference_number || "-" },
        { label: "Recorded At", value: formatDateTime(payment.created_at) || "-" },
        { label: "Payment ID", value: payment.id ? `#${payment.id}` : "-" },
      ],
      sections: [
        {
          title: "Payment Details",
          rows: [
            { label: "Amount", value: formatAmount(payment.amount, currencyCode) },
            { label: "Currency", value: currencyCode || "-" },
            { label: "Reference Number", value: payment.reference_number || "-" },
            { label: "Notes", value: payment.notes || "-" },
          ],
        },
      ],
      notes: payment.notes,
      signatures: ["Prepared By", "Approved By", "Paid By", "Received By"],
    };
  };

  const receipt = receiptPayment ? buildReceipt(receiptPayment) : null;

  if (loading) {
    return (
      <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl p-12 text-center">
        <div className="animate-spin w-8 h-8 border-2 border-[var(--border)] border-t-[var(--primary)] rounded-full mx-auto" />
        <p className="text-[var(--muted)] mt-4">
          {t("PaymentTable.loadingPayments")}
        </p>
      </div>
    );
  }

  if (!payments.length) {
    return (
      <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl p-12 text-center">
        <DollarSign size={40} className="mx-auto text-[var(--muted)] mb-3" />
        <p className="text-[var(--muted)]">{t("PaymentTable.noPayments")}</p>
      </div>
    );
  }

  return (
    <>
      <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl overflow-hidden">
      {/* Desktop */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[var(--border)]">
              <th className="text-start px-4 py-3 font-semibold text-[var(--muted)]">
                {t("PaymentTable.date")}
              </th>
              <th className="text-start px-4 py-3 font-semibold text-[var(--muted)]">
                {t("PaymentTable.type")}
              </th>
              <th className="text-end px-4 py-3 font-semibold text-[var(--muted)]">
                {t("PaymentTable.amount")}
              </th>
              <th className="text-start px-4 py-3 font-semibold text-[var(--muted)]">
                {t("PaymentTable.reference")}
              </th>
              <th className="text-start px-4 py-3 font-semibold text-[var(--muted)]">
                {t("PaymentTable.notes")}
              </th>
              <th className="text-end px-4 py-3 font-semibold text-[var(--muted)]">
                {t("PaymentTable.actions")}
              </th>
            </tr>
          </thead>
          <tbody>
            {payments.map((payment) => (
              <tr
                key={payment.id}
                className="border-b border-[var(--border)] last:border-0 hover:bg-[var(--hover)] transition-colors"
              >
                <td className="px-4 py-3 text-[var(--text)] text-start">
                  {displayDate(payment)}
                </td>
                <td className="px-4 py-3 text-start">
                  <span
                    className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium ${
                      TYPE_COLORS[payment.payment_type] || TYPE_COLORS.other
                    }`}
                  >
                    {paymentTypeLabel(payment)}
                  </span>
                </td>
                <td className="px-4 py-3 text-end font-semibold text-[var(--text)]">
                  {formatAmount(payment.amount, paymentCurrency(payment))}
                </td>
                <td className="px-4 py-3 text-[var(--muted)] font-mono text-xs text-start">
                  {payment.reference_number || "—"}
                </td>
                <td className="px-4 py-3 text-[var(--muted)] max-w-[200px] truncate text-start">
                  {payment.notes || "—"}
                </td>
                <td className="px-4 py-3 text-end">
                  <div className="flex items-center justify-end gap-1">
                    <button
                      onClick={() => setReceiptPayment(payment)}
                      className="p-1.5 rounded-lg hover:bg-[var(--hover)] text-[var(--muted)] hover:text-[var(--primary)] transition-colors"
                      title="Print receipt"
                      aria-label="Print payment receipt"
                    >
                      <Printer size={16} />
                    </button>
                    <button
                      onClick={() => onEdit(payment)}
                      className="p-1.5 rounded-lg hover:bg-[var(--hover)] text-[var(--muted)] hover:text-[var(--primary)] transition-colors"
                    >
                      <Edit size={16} />
                    </button>
                    <PermissionWrapper
                      permissions={["contract_payments.delete"]}
                    >
                      <button
                        onClick={() => onDelete(payment)}
                        className="p-1.5 rounded-lg hover:bg-[var(--hover)] text-[var(--muted)] hover:text-[var(--danger)] transition-colors"
                      >
                        <Trash2 size={16} />
                      </button>
                    </PermissionWrapper>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile */}
      <div className="md:hidden divide-y divide-[var(--border)]">
        {payments.map((payment) => (
          <div key={payment.id} className="p-4 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-[var(--muted)]">
                {displayDate(payment)}
              </span>
              <span
                className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium ${
                  TYPE_COLORS[payment.payment_type] || TYPE_COLORS.other
                }`}
              >
                {paymentTypeLabel(payment)}
              </span>
            </div>
            <p className="text-[var(--text)] font-semibold text-lg">
              {formatAmount(payment.amount, paymentCurrency(payment))}
            </p>
            {payment.reference_number && (
              <p className="text-xs text-[var(--muted)] font-mono">
                {t("PaymentTable.ref")}: {payment.reference_number}
              </p>
            )}
            <div className="flex items-center justify-end gap-2">
              <button
                onClick={() => setReceiptPayment(payment)}
                className="p-2 rounded-lg hover:bg-[var(--hover)] text-[var(--muted)] hover:text-[var(--primary)]"
                title="Print receipt"
                aria-label="Print payment receipt"
              >
                <Printer size={16} />
              </button>
              <button
                onClick={() => onEdit(payment)}
                className="p-2 rounded-lg hover:bg-[var(--hover)] text-[var(--muted)] hover:text-[var(--primary)]"
              >
                <Edit size={16} />
              </button>
              <PermissionWrapper permissions={["contract_payments.delete"]}>
                <button
                  onClick={() => onDelete(payment)}
                  className="p-2 rounded-lg hover:bg-[var(--hover)] text-[var(--muted)] hover:text-[var(--danger)]"
                >
                  <Trash2 size={16} />
                </button>
              </PermissionWrapper>
            </div>
          </div>
        ))}
      </div>
      </div>
      {receipt && (
        <PrintableReceiptModal
          isOpen={Boolean(receiptPayment)}
          onClose={() => setReceiptPayment(null)}
          {...receipt}
        />
      )}
    </>
  );
}

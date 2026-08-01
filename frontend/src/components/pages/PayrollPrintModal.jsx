import { Printer, X } from "lucide-react";
import useFetch from "../../hooks/useFetch";
import { useCalendar } from "../../hooks/useCalendar";
import useBodyScrollLock from "../../hooks/useBodyScrollLock";
import PrintableReceiptModal from "../common/PrintableReceiptModal";

const EMPTY_VALUE = "-";

function hasValue(value) {
  return value !== null && value !== undefined && value !== "";
}

function numeric(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function labelize(value, fallback = EMPTY_VALUE) {
  if (!hasValue(value)) return fallback;
  return String(value).replace(/_/g, " ");
}

function formatMoney(value, currency) {
  const amount = numeric(value).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return `${currency ? `${currency} ` : ""}${amount}`;
}

function formatNumber(value) {
  return numeric(value).toLocaleString("en-US", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });
}

function payrollStatus(payroll) {
  if (hasValue(payroll.payment_status)) return labelize(payroll.payment_status);
  if (hasValue(payroll.payment_date)) return "Paid";
  if (numeric(payroll.amount_paid) > 0 && numeric(payroll.balance_due) <= 0) {
    return "Paid";
  }
  if (numeric(payroll.amount_paid) > 0 && numeric(payroll.balance_due) > 0) {
    return "partially paid";
  }
  return "Recorded";
}

function LoadingOrEmptyModal({ loading, onClose }) {
  return (
    <>
      <div className="fixed inset-0 z-[70] bg-black/50" onClick={onClose} />
      <div className="mobile-modal-surface fixed inset-0 z-[80] flex">
        <div
          className="mobile-modal-panel mobile-modal-full flex w-full max-w-3xl flex-col overflow-hidden rounded-xl border shadow-2xl"
          style={{
            backgroundColor: "var(--card)",
            borderColor: "var(--border)",
            color: "var(--text)",
          }}
          onClick={(event) => event.stopPropagation()}
        >
          <div
            className="mobile-modal-header flex flex-col gap-3 border-b px-5 py-4 sm:flex-row sm:items-center sm:justify-between"
            style={{ borderColor: "var(--border)" }}
          >
            <div>
              <h2 className="text-lg font-semibold">Employee Payroll Receipt</h2>
              <p className="text-sm" style={{ color: "var(--muted)" }}>
                Payroll print preview
              </p>
            </div>
            <div className="flex w-full items-center gap-2 sm:w-auto">
              <button
                type="button"
                disabled
                className="inline-flex min-h-12 flex-1 items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-medium text-white opacity-50 sm:flex-none"
                style={{ backgroundColor: "var(--primary)" }}
              >
                <Printer className="h-4 w-4" />
                Print
              </button>
              <button
                type="button"
                onClick={onClose}
                className="inline-flex h-12 w-12 items-center justify-center rounded-lg hover:bg-[var(--hover)]"
                aria-label="Close receipt"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>

          <div className="flex h-64 items-center justify-center bg-[var(--bg)] p-6">
            {loading ? (
              <div className="flex flex-col items-center gap-3">
                <div className="h-8 w-8 animate-spin rounded-full border-2 border-[var(--primary)] border-t-transparent" />
                <p className="text-sm text-[var(--muted)]">
                  Loading payroll data...
                </p>
              </div>
            ) : (
              <p className="text-sm text-[var(--muted)]">
                No payroll data found.
              </p>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

export default function PayrollPrintModal({ isOpen, onClose, payrollID }) {
  const { formatDate, parseDate } = useCalendar("payroll");
  const { data: payroll, loading } = useFetch(
    isOpen && payrollID ? `/payrolls/${payrollID}/` : null,
  );

  useBodyScrollLock(isOpen && (loading || !payroll));

  if (!isOpen) return null;

  const displayDate = (value) => {
    if (!hasValue(value)) return EMPTY_VALUE;
    return formatDate(value) || value;
  };

  const getDaysWorked = (start, end) => {
    if (!start || !end) return 30;
    const parsedStart = parseDate(start) || start;
    const parsedEnd = parseDate(end) || end;
    const startDate = new Date(`${parsedStart}T00:00:00`);
    const endDate = new Date(`${parsedEnd}T00:00:00`);
    if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) {
      return 30;
    }

    const diff = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24));
    return diff > 0 ? diff : 30;
  };

  const getPeriodLabel = (start, end) => {
    if (!hasValue(start)) return EMPTY_VALUE;
    return hasValue(end)
      ? `${displayDate(start)} to ${displayDate(end)}`
      : displayDate(start);
  };

  if (loading || !payroll) {
    return <LoadingOrEmptyModal loading={loading} onClose={onClose} />;
  }

  const currency = payroll.currency || "AFN";
  const daysWorked = getDaysWorked(
    payroll.payroll_period_start,
    payroll.payroll_period_end,
  );
  const hourlyRate = daysWorked ? numeric(payroll.basic_salary) / daysWorked / 8 : 0;
  const grossPay = hasValue(payroll.gross_pay)
    ? payroll.gross_pay
    : numeric(payroll.basic_salary) +
      numeric(payroll.overtime_amount) +
      numeric(payroll.bonus) +
      numeric(payroll.allowances);
  const totalDeductions = hasValue(payroll.total_deductions)
    ? payroll.total_deductions
    : numeric(payroll.deductions) +
      numeric(payroll.tax_deducted) +
      numeric(payroll.advance_deductions);
  const netPay = hasValue(payroll.net_pay)
    ? payroll.net_pay
    : numeric(grossPay) - numeric(totalDeductions);
  const payrollIdentifier = payroll.id || payrollID;
  const receiptNumber = `PAY-${String(payrollIdentifier || "0").padStart(6, "0")}`;
  const periodLabel = getPeriodLabel(
    payroll.payroll_period_start,
    payroll.payroll_period_end,
  );
  const notes = [
    payroll.amount_in_words
      ? `Amount in words: ${payroll.amount_in_words}`
      : "",
    payroll.notes ? `Notes: ${payroll.notes}` : "",
  ]
    .filter(Boolean)
    .join(" | ");

  return (
    <PrintableReceiptModal
      isOpen={isOpen}
      onClose={onClose}
      title="Employee Payroll Receipt"
      subtitle={payroll.project_name || payroll.employee_name || "Payroll payment"}
      receiptNumber={receiptNumber}
      receiptDate={displayDate(payroll.payment_date || payroll.payroll_period_end)}
      status={payrollStatus(payroll)}
      amountLabel="Net Pay"
      amount={netPay}
      currency={currency}
      details={[
        { label: "Employee", value: payroll.employee_name },
        { label: "Employee ID", value: payroll.employee_id },
        { label: "Position", value: payroll.position },
        { label: "Project", value: payroll.project_name || "General" },
        { label: "Payroll Period", value: periodLabel },
        { label: "Payment Date", value: displayDate(payroll.payment_date) },
        { label: "Payment Method", value: labelize(payroll.payment_method) },
        { label: "Status", value: payrollStatus(payroll) },
        {
          label: "Payroll ID",
          value: payrollIdentifier ? `#${payrollIdentifier}` : EMPTY_VALUE,
        },
      ]}
      sections={[
        {
          title: "Payroll Breakdown",
          rows: [
            { label: "Days Worked", value: formatNumber(daysWorked) },
            { label: "Basic Salary", value: formatMoney(payroll.basic_salary, currency) },
            { label: "Hourly Rate", value: formatMoney(hourlyRate, currency) },
            { label: "Overtime Hours", value: formatNumber(payroll.overtime_hours) },
            { label: "Overtime Amount", value: formatMoney(payroll.overtime_amount, currency) },
            { label: "Bonus", value: formatMoney(payroll.bonus, currency) },
            { label: "Allowances", value: formatMoney(payroll.allowances, currency) },
            { label: "Gross Pay", value: formatMoney(grossPay, currency) },
            { label: "Tax Deducted", value: formatMoney(payroll.tax_deducted, currency) },
            { label: "Other Deductions", value: formatMoney(payroll.deductions, currency) },
            {
              label: "Advance Deductions",
              value: formatMoney(payroll.advance_deductions, currency),
            },
            { label: "Total Deductions", value: formatMoney(totalDeductions, currency) },
            { label: "Amount Paid", value: formatMoney(payroll.amount_paid, currency) },
            { label: "Balance Due", value: formatMoney(payroll.balance_due, currency) },
            { label: "Net Pay", value: formatMoney(netPay, currency) },
          ],
        },
      ]}
      notes={notes}
      signatures={[
        "Prepared By",
        "Approved By",
        "Paid By",
        "Employee Signature",
      ]}
      footer="This is a system-generated payroll receipt. Keep it with the payment records."
    />
  );
}

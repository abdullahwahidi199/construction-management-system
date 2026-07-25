import { X, Printer } from "lucide-react";
import { useRef, useEffect } from "react";
import { useCalendar } from "../../hooks/useCalendar";

export default function ExpenseReceiptPrintModal({ isOpen, onClose, expense }) {
  const printRef = useRef();
  const { formatDate, formatDateTime } = useCalendar("expenses");

  // Lock body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  if (!isOpen || !expense) return null;

  const canPrint = expense.approval_status === "approved";

  const displayDate = (dateString, fallback) => {
    return formatDate(dateString) || fallback || "—";
  };

  const displayDateTime = (dateString, fallback) => {
    return formatDateTime(dateString) || fallback || "—";
  };

  const preparedBy = expense.created_by_name || "-";
  const approvedBy = expense.approved_by_name || "-";
  const approvalDate = displayDateTime(expense.approved_at);

  const handlePrint = () => {
    if (!canPrint) return;
    const printContent = printRef.current;
    if (!printContent) return;

    const printWindow = window.open("", "_blank", "width=900,height=650");
    if (!printWindow) return;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Expense Receipt #${expense.serial_number}</title>
        <style>
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }
          body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto,
              "Helvetica Neue", Arial, sans-serif;
            color: #111827;
            padding: 48px 56px;
            line-height: 1.5;
            font-size: 14px;
          }
          .document {
            max-width: 780px;
            margin: 0 auto;
          }

          /* Header */
          .doc-header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            padding-bottom: 20px;
            border-bottom: 3px solid #111827;
            margin-bottom: 28px;
          }
          .doc-header .brand h1 {
            font-size: 24px;
            font-weight: 800;
            letter-spacing: -0.5px;
          }
          .doc-header .brand p {
            font-size: 12px;
            color: #6b7280;
            margin-top: 2px;
            text-transform: uppercase;
            letter-spacing: 1px;
          }
          .doc-header .meta {
            text-align: right;
          }
          .doc-header .meta .receipt-title {
            font-size: 13px;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 1.5px;
            color: #4b5563;
          }
          .doc-header .meta .serial {
            font-size: 20px;
            font-weight: 800;
            color: #111827;
            margin-top: 4px;
          }
          .doc-header .meta .date {
            font-size: 12px;
            color: #6b7280;
            margin-top: 2px;
          }

          /* Info table */
          .info-grid {
            display: grid;
            grid-template-columns: 1fr 1fr 1fr;
            gap: 1px;
            background: #e5e7eb;
            border: 1px solid #e5e7eb;
            border-radius: 8px;
            overflow: hidden;
            margin-bottom: 28px;
          }
          .info-grid .cell {
            background: #fafafa;
            padding: 12px 16px;
          }
          .info-grid .label {
            font-size: 10px;
            color: #9ca3af;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            margin-bottom: 4px;
            font-weight: 600;
          }
          .info-grid .value {
            font-size: 14px;
            font-weight: 600;
            color: #111827;
            text-transform: capitalize;
          }

          /* Section title */
          .section-title {
            font-size: 12px;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 1px;
            color: #4b5563;
            margin-bottom: 10px;
            padding-bottom: 6px;
            border-bottom: 1px solid #e5e7eb;
          }
          .section {
            margin-bottom: 28px;
          }
          .description-box {
            font-size: 14px;
            color: #1f2937;
            padding: 4px 0;
          }

          /* Amounts */
          .amounts {
            border: 1px solid #e5e7eb;
            border-radius: 8px;
            overflow: hidden;
          }
          .amount-row {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 12px 18px;
            font-size: 14px;
            border-bottom: 1px solid #f3f4f6;
          }
          .amount-row:last-child {
            border-bottom: none;
          }
          .amount-row .label {
            color: #6b7280;
          }
          .amount-row .value {
            font-weight: 600;
            color: #111827;
          }
          .amount-row.total {
            background: #111827;
          }
          .amount-row.total .label {
            color: #d1d5db;
            font-weight: 600;
          }
          .amount-row.total .value {
            color: #ffffff;
            font-size: 17px;
            font-weight: 800;
          }
          .amount-row.subtotal {
            background: #f9fafb;
          }
          .amount-row.subtotal .label,
          .amount-row.subtotal .value {
            font-weight: 700;
            color: #111827;
          }

          /* Signatures */
          .signatures {
            margin-top: 56px;
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 24px;
          }
          .signature-block {
            text-align: center;
          }
          .signature-line {
            height: 48px;
            border-bottom: 1.5px solid #9ca3af;
            margin-bottom: 8px;
          }
          .signature-block .role {
            font-size: 12px;
            font-weight: 700;
            color: #111827;
            text-transform: uppercase;
            letter-spacing: 0.5px;
          }
          .signature-block .hint {
            font-size: 10px;
            color: #9ca3af;
            margin-top: 2px;
          }

          /* Footer */
          .doc-footer {
            margin-top: 48px;
            padding-top: 16px;
            border-top: 1px solid #e5e7eb;
            text-align: center;
            font-size: 10px;
            color: #9ca3af;
            letter-spacing: 0.5px;
          }

          @media print {
            body { padding: 24px 32px; }
            .amount-row.total { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
            .info-grid .cell,
            .amount-row.subtotal { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          }
        </style>
      </head>
      <body>
        <div class="document">
          <!-- Header -->
          <div class="doc-header">
            <div class="brand">
              <h1>Expense Receipt</h1>
              <p>Official Expense Record</p>
            </div>
            <div class="meta">
              <div class="receipt-title">Receipt No.</div>
              <div class="serial">#${expense.serial_number || "—"}</div>
              <div class="date">${displayDate(expense.expense_date, expense.formatted_expense_date)}</div>
            </div>
          </div>

          <!-- Info Grid -->
          <div class="info-grid">
            <div class="cell">
              <div class="label">Project</div>
              <div class="value">${expense.project_name || "—"}</div>
            </div>
            <div class="cell">
              <div class="label">Type</div>
              <div class="value">${expense.expense_type || "—"}</div>
            </div>
            <div class="cell">
              <div class="label">Paid To</div>
              <div class="value">${expense.paid_to || "—"}</div>
            </div>
          </div>

          <div class="info-grid">
            <div class="cell">
              <div class="label">Prepared By</div>
              <div class="value">${preparedBy}</div>
            </div>
            <div class="cell">
              <div class="label">Approved By</div>
              <div class="value">${approvedBy}</div>
            </div>
            <div class="cell">
              <div class="label">Approval Date</div>
              <div class="value">${approvalDate}</div>
            </div>
          </div>

          <!-- Description -->
          <div class="section">
            <div class="section-title">Description</div>
            <div class="description-box">${expense.description || "—"}</div>
          </div>

          <!-- Amount Breakdown -->
          <div class="section">
            <div class="section-title">Amount Breakdown</div>
            <div class="amounts">
              <div class="amount-row">
                <span class="label">USD Amount</span>
                <span class="value">$${expense.amount_usd || 0}</span>
              </div>
              <div class="amount-row">
                <span class="label">AFN Amount</span>
                <span class="value">؋ ${expense.amount_afn || 0}</span>
              </div>
              <div class="amount-row">
                <span class="label">Exchange Rate</span>
                <span class="value">${expense.exchange_rate || "—"}</span>
              </div>
              <div class="amount-row subtotal">
                <span class="label">Total AFN</span>
                <span class="value">؋ ${expense.total_afn || 0}</span>
              </div>
              <div class="amount-row total">
                <span class="label">Total USD</span>
                <span class="value">$${expense.total_usd || 0}</span>
              </div>
            </div>
          </div>

          ${
            expense.remarks
              ? `
            <div class="section">
              <div class="section-title">Remarks</div>
              <div class="description-box">${expense.remarks}</div>
            </div>
          `
              : ""
          }

          <!-- Signatures -->
          <div class="signatures">
            <div class="signature-block">
              <div class="signature-line"></div>
              <div class="role">Prepared By</div>
              <div class="hint">${preparedBy}</div>
            </div>
            <div class="signature-block">
              <div class="signature-line"></div>
              <div class="role">Checked By</div>
              <div class="hint">Name & Signature</div>
            </div>
            <div class="signature-block">
              <div class="signature-line"></div>
              <div class="role">Approved By</div>
              <div class="hint">${approvedBy}</div>
            </div>
            <div class="signature-block">
              <div class="signature-line"></div>
              <div class="role">Received By</div>
              <div class="hint">Name & Signature</div>
            </div>
          </div>

          <!-- Footer -->
          <div class="doc-footer">
            This is a system-generated document · Generated by Expense System · ${displayDateTime(new Date().toISOString())}
          </div>
        </div>
      </body>
      </html>
    `);

    printWindow.document.close();
    printWindow.focus();

    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 250);
  };

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/50 z-[60]" onClick={onClose} />

      {/* Modal */}
      <div className="mobile-modal-surface fixed inset-0 z-[70] flex">
        <div
          className="mobile-modal-panel mobile-modal-full w-full max-w-3xl bg-[var(--card)] rounded-2xl shadow-2xl border border-[var(--border)] overflow-hidden flex flex-col"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="mobile-modal-header flex flex-col gap-3 px-6 py-4 border-b border-[var(--border)] shrink-0 sm:flex-row sm:items-center sm:justify-between">
            <h2 className="text-lg font-semibold text-[var(--text)]">
              Expense Receipt Preview
            </h2>
            <div className="flex w-full items-center gap-2 sm:w-auto">
              <button
                onClick={handlePrint}
                disabled={!canPrint}
                className="inline-flex min-h-12 flex-1 items-center justify-center gap-2 rounded-lg bg-[var(--primary)] px-4 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-50 sm:flex-none"
              >
                <Printer className="h-4 w-4" />
                Print
              </button>
              <button
                onClick={onClose}
                className="inline-flex h-12 w-12 items-center justify-center rounded-lg hover:bg-[var(--hover)] text-[var(--muted)] hover:text-[var(--text)] transition-colors"
                aria-label="Close"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* Scrollable Receipt Preview */}
          <div className="flex-1 overflow-auto bg-[var(--bg)] mobile-scrollbar">
            {!canPrint && (
              <div className="border-b border-amber-500/20 bg-amber-500/10 px-6 py-3 text-sm text-amber-700 dark:text-amber-300">
                Expense must be approved before printing.
              </div>
            )}
            <div ref={printRef} className="mx-auto max-w-3xl p-4 sm:p-8 md:p-10">
              {/* Document Header */}
              <div className="mb-7 flex flex-col gap-4 border-b-[3px] border-[var(--text)] pb-5 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <h1 className="text-2xl font-extrabold tracking-tight text-[var(--text)]">
                    Expense Receipt
                  </h1>
                  <p className="text-[11px] uppercase tracking-widest text-[var(--muted)] mt-1">
                    Official Expense Record
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-[11px] font-bold uppercase tracking-widest text-[var(--muted)]">
                    Receipt No.
                  </p>
                  <p className="text-xl font-extrabold text-[var(--text)] mt-0.5">
                    #{expense.serial_number || "—"}
                  </p>
                  <p className="text-xs text-[var(--muted)] mt-0.5">
                    {displayDate(
                      expense.expense_date,
                      expense.formatted_expense_date,
                    )}
                  </p>
                </div>
              </div>

              {/* Info Grid */}
              <div className="mb-7 grid grid-cols-1 gap-px overflow-hidden rounded-lg border border-[var(--border)] bg-[var(--border)] sm:grid-cols-3">
                <div className="bg-[var(--card)] px-4 py-3">
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-[var(--muted)] mb-1">
                    Project
                  </p>
                  <p className="text-sm font-semibold text-[var(--text)]">
                    {expense.project_name || "—"}
                  </p>
                </div>
                <div className="bg-[var(--card)] px-4 py-3">
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-[var(--muted)] mb-1">
                    Type
                  </p>
                  <p className="text-sm font-semibold text-[var(--text)] capitalize">
                    {expense.expense_type || "—"}
                  </p>
                </div>
                <div className="bg-[var(--card)] px-4 py-3">
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-[var(--muted)] mb-1">
                    Paid To
                  </p>
                  <p className="text-sm font-semibold text-[var(--text)]">
                    {expense.paid_to || "—"}
                  </p>
                </div>
              </div>

              <div className="mb-7 grid grid-cols-1 gap-px overflow-hidden rounded-lg border border-[var(--border)] bg-[var(--border)] sm:grid-cols-3">
                <div className="bg-[var(--card)] px-4 py-3">
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-[var(--muted)] mb-1">
                    Prepared By
                  </p>
                  <p className="text-sm font-semibold text-[var(--text)]">
                    {preparedBy}
                  </p>
                </div>
                <div className="bg-[var(--card)] px-4 py-3">
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-[var(--muted)] mb-1">
                    Approved By
                  </p>
                  <p className="text-sm font-semibold text-[var(--text)]">
                    {approvedBy}
                  </p>
                </div>
                <div className="bg-[var(--card)] px-4 py-3">
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-[var(--muted)] mb-1">
                    Approval Date
                  </p>
                  <p className="text-sm font-semibold text-[var(--text)]">
                    {approvalDate}
                  </p>
                </div>
              </div>

              {/* Description */}
              <div className="mb-7">
                <p className="text-[11px] font-bold uppercase tracking-wide text-[var(--muted)] mb-2 pb-1.5 border-b border-[var(--border)]">
                  Description
                </p>
                <p className="text-sm text-[var(--text)]">
                  {expense.description || "—"}
                </p>
              </div>

              {/* Amount Breakdown */}
              <div className="mb-7">
                <p className="text-[11px] font-bold uppercase tracking-wide text-[var(--muted)] mb-2 pb-1.5 border-b border-[var(--border)]">
                  Amount Breakdown
                </p>
                <div className="border border-[var(--border)] rounded-lg overflow-hidden">
                  <div className="flex justify-between px-4 py-3 text-sm border-b border-[var(--border)]">
                    <span className="text-[var(--muted)]">USD Amount</span>
                    <span className="font-semibold text-[var(--text)]">
                      ${expense.amount_usd || 0}
                    </span>
                  </div>
                  <div className="flex justify-between px-4 py-3 text-sm border-b border-[var(--border)]">
                    <span className="text-[var(--muted)]">AFN Amount</span>
                    <span className="font-semibold text-[var(--text)]">
                      ؋ {expense.amount_afn || 0}
                    </span>
                  </div>
                  <div className="flex justify-between px-4 py-3 text-sm border-b border-[var(--border)]">
                    <span className="text-[var(--muted)]">Exchange Rate</span>
                    <span className="font-semibold text-[var(--text)]">
                      {expense.exchange_rate || "—"}
                    </span>
                  </div>
                  <div className="flex justify-between px-4 py-3 text-sm bg-[var(--hover)] border-b border-[var(--border)]">
                    <span className="font-bold text-[var(--text)]">
                      Total AFN
                    </span>
                    <span className="font-bold text-[var(--text)]">
                      ؋ {expense.total_afn || 0}
                    </span>
                  </div>
                  <div className="flex justify-between px-4 py-3.5 bg-[var(--text)]">
                    <span className="font-semibold text-white/80">
                      Total USD
                    </span>
                    <span className="text-lg font-extrabold text-white">
                      ${expense.total_usd || 0}
                    </span>
                  </div>
                </div>
              </div>

              {/* Remarks */}
              {expense.remarks && (
                <div className="mb-7">
                  <p className="text-[11px] font-bold uppercase tracking-wide text-[var(--muted)] mb-2 pb-1.5 border-b border-[var(--border)]">
                    Remarks
                  </p>
                  <p className="text-sm text-[var(--text)]">
                    {expense.remarks}
                  </p>
                </div>
              )}

              {/* Signatures */}
              <div className="mt-14 grid grid-cols-2 gap-6 sm:grid-cols-4">
                {[
                  { role: "Prepared By", name: preparedBy },
                  { role: "Checked By", name: "Name & Signature" },
                  { role: "Approved By", name: approvedBy },
                  { role: "Received By", name: "Name & Signature" },
                ].map((item) => (
                  <div key={item.role} className="text-center">
                    <div className="h-12 border-b-2 border-[var(--muted)] mb-2" />
                    <p className="text-xs font-bold uppercase tracking-wide text-[var(--text)]">
                      {item.role}
                    </p>
                    <p className="text-[10px] text-[var(--muted)] mt-0.5">
                      {item.name}
                    </p>
                  </div>
                ))}
              </div>

              {/* Footer */}
              <div className="mt-12 pt-4 border-t border-[var(--border)] text-center text-[10px] tracking-wide text-[var(--muted)]">
                This is a system-generated document · Generated by Expense
                System
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

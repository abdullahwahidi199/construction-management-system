import { X, Printer } from "lucide-react";
import { useEffect, useRef } from "react";

export default function ExpenseReceiptPrintModal({ isOpen, onClose, expense }) {
  const printRef = useRef();

  if (!isOpen || !expense) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 z-40 print:hidden"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 print:p-0">
        <div className="w-full max-w-2xl bg-[var(--card)] rounded-2xl shadow-2xl border border-[var(--border)] overflow-hidden print:shadow-none print:border-none print:rounded-none">
          {/* Header (hidden in print) */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border)] print:hidden">
            <h2 className="text-lg font-semibold text-[var(--text)]">
              Expense Receipt
            </h2>

            <div className="flex items-center gap-2">
              <button
                onClick={handlePrint}
                className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-[var(--primary)] text-white text-sm"
              >
                <Printer className="h-4 w-4" />
                Print
              </button>

              <button
                onClick={onClose}
                className="p-2 rounded-lg hover:bg-[var(--hover)]"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* Printable Area */}
          <div ref={printRef} className="p-8 text-[var(--text)] print:p-10">
            {/* Company / Header */}
            <div className="text-center mb-6">
              <h1 className="text-2xl font-bold">Expense Receipt</h1>
              <p className="text-sm text-[var(--muted)]">
                Official Expense Record
              </p>
            </div>

            <div className="border-t border-b border-[var(--border)] py-4 mb-6">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-[var(--muted)]">Serial Number</p>
                  <p className="font-semibold">#{expense.serial_number}</p>
                </div>

                <div>
                  <p className="text-[var(--muted)]">Date</p>
                  <p className="font-semibold">{expense.expense_date}</p>
                </div>

                <div>
                  <p className="text-[var(--muted)]">Project</p>
                  <p className="font-semibold">{expense.project_name}</p>
                </div>

                <div>
                  <p className="text-[var(--muted)]">Type</p>
                  <p className="font-semibold capitalize">
                    {expense.expense_type}
                  </p>
                </div>
              </div>
            </div>

            {/* Description */}
            <div className="mb-6">
              <p className="text-[var(--muted)] text-sm mb-1">Description</p>
              <p className="font-medium">{expense.description}</p>
            </div>

            {/* Payment Details */}
            <div className="mb-6 grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-[var(--muted)]">Paid To</p>
                <p className="font-semibold">{expense.paid_to || "—"}</p>
              </div>

              <div>
                <p className="text-[var(--muted)]">Exchange Rate</p>
                <p className="font-semibold">{expense.exchange_rate || "—"}</p>
              </div>
            </div>

            {/* Amounts */}
            <div className="border-t border-[var(--border)] pt-4">
              <h3 className="font-semibold mb-3">Amount Breakdown</h3>

              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-[var(--muted)]">USD Amount</span>
                  <span className="font-semibold">${expense.amount_usd}</span>
                </div>

                <div className="flex justify-between">
                  <span className="text-[var(--muted)]">AFN Amount</span>
                  <span className="font-semibold">؋ {expense.amount_afn}</span>
                </div>

                <div className="flex justify-between border-t border-[var(--border)] pt-2 mt-2">
                  <span className="font-semibold">Total USD</span>
                  <span className="font-bold text-lg">
                    ${expense.total_usd}
                  </span>
                </div>

                <div className="flex justify-between">
                  <span className="font-semibold">Total AFN</span>
                  <span className="font-bold text-lg">
                    ؋ {expense.total_afn}
                  </span>
                </div>
              </div>
            </div>

            {/* Remarks */}
            {expense.remarks && (
              <div className="mt-6">
                <p className="text-[var(--muted)] text-sm mb-1">Remarks</p>
                <p className="text-sm">{expense.remarks}</p>
              </div>
            )}

            {/* Footer */}
            <div className="mt-10 text-center text-xs text-[var(--muted)]">
              Generated automatically by Expense System
            </div>
          </div>
        </div>
      </div>

      {/* Print Styles */}
      <style>
        {`
          @media print {
            body * {
              visibility: hidden;
            }

            .print\\:hidden {
              display: none !important;
            }

            .print\\:p-10 {
              padding: 40px !important;
            }

            .print\\:shadow-none {
              box-shadow: none !important;
            }

            .print\\:border-none {
              border: none !important;
            }

            .print\\:rounded-none {
              border-radius: 0 !important;
            }

            #root, #root * {
              visibility: visible;
            }
          }
        `}
      </style>
    </>
  );
}

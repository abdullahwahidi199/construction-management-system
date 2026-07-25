import { useEffect, useMemo } from "react";
import { Printer, X } from "lucide-react";

const EMPTY_VALUE = "-";

function text(value) {
  if (value === null || value === undefined || value === "") return EMPTY_VALUE;
  return String(value);
}

function escapeHtml(value) {
  return text(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function formatMoney(amount, currency) {
  const numeric = Number(amount || 0);
  const formatted = numeric.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return `${currency ? `${currency} ` : ""}${formatted}`;
}

function normalizedRows(rows = []) {
  return rows.map((row) => ({
    label: text(row.label),
    value: text(row.value),
  }));
}

function renderPrintRows(rows) {
  return normalizedRows(rows)
    .map(
      (row) => `
        <div class="info-cell">
          <div class="label">${escapeHtml(row.label)}</div>
          <div class="value">${escapeHtml(row.value)}</div>
        </div>
      `,
    )
    .join("");
}

function renderPrintSections(sections = []) {
  return sections
    .map((section) => {
      const rows = normalizedRows(section.rows)
        .map(
          (row) => `
            <tr>
              <td>${escapeHtml(row.label)}</td>
              <td>${escapeHtml(row.value)}</td>
            </tr>
          `,
        )
        .join("");
      return `
        <section class="section">
          <h2>${escapeHtml(section.title)}</h2>
          <table>${rows}</table>
        </section>
      `;
    })
    .join("");
}

function renderPrintSignatures(signatures = []) {
  return signatures
    .map(
      (signature) => `
        <div class="signature">
          <div class="line"></div>
          <div class="role">${escapeHtml(signature)}</div>
        </div>
      `,
    )
    .join("");
}

export default function PrintableReceiptModal({
  isOpen,
  onClose,
  title,
  subtitle,
  receiptNumber,
  receiptDate,
  status,
  amountLabel = "Amount",
  amount,
  currency,
  details = [],
  sections = [],
  notes,
  signatures = [],
  footer = "This is a system-generated receipt. Keep it with the payment records.",
}) {
  useEffect(() => {
    if (!isOpen) return undefined;
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, [isOpen]);

  const amountText = useMemo(
    () => formatMoney(amount, currency),
    [amount, currency],
  );

  if (!isOpen) return null;

  const handlePrint = () => {
    const printWindow = window.open("", "_blank", "width=940,height=720");
    if (!printWindow) return;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>${escapeHtml(title)} ${escapeHtml(receiptNumber)}</title>
        <style>
          * { box-sizing: border-box; }
          body {
            margin: 0;
            padding: 36px 44px;
            color: #111827;
            background: #ffffff;
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Arial, sans-serif;
            font-size: 13px;
            line-height: 1.45;
          }
          .receipt { max-width: 820px; margin: 0 auto; }
          .header {
            display: grid;
            grid-template-columns: 1fr auto;
            gap: 24px;
            align-items: start;
            border-bottom: 3px solid #111827;
            padding-bottom: 18px;
            margin-bottom: 22px;
          }
          .brand h1 {
            margin: 0;
            font-size: 25px;
            line-height: 1.1;
            font-weight: 800;
            letter-spacing: 0;
          }
          .brand p {
            margin: 6px 0 0;
            color: #4b5563;
            font-size: 12px;
            text-transform: uppercase;
            letter-spacing: 0.8px;
          }
          .meta { text-align: right; min-width: 210px; }
          .meta .number {
            font-size: 20px;
            font-weight: 800;
            color: #111827;
          }
          .meta .small { color: #6b7280; margin-top: 3px; }
          .status {
            display: inline-block;
            margin-top: 8px;
            border: 1px solid #111827;
            border-radius: 999px;
            padding: 3px 12px;
            font-size: 11px;
            font-weight: 700;
            text-transform: uppercase;
          }
          .amount-box {
            display: grid;
            grid-template-columns: 1fr auto;
            align-items: center;
            gap: 20px;
            background: #111827;
            color: #ffffff;
            border-radius: 10px;
            padding: 18px 22px;
            margin-bottom: 20px;
          }
          .amount-box .label {
            color: #d1d5db;
            font-size: 12px;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 0.8px;
          }
          .amount-box .amount {
            font-size: 28px;
            font-weight: 900;
          }
          .info-grid {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            border: 1px solid #d1d5db;
            border-radius: 10px;
            overflow: hidden;
            margin-bottom: 20px;
          }
          .info-cell {
            min-height: 68px;
            padding: 11px 13px;
            border-right: 1px solid #e5e7eb;
            border-bottom: 1px solid #e5e7eb;
          }
          .info-cell:nth-child(3n) { border-right: 0; }
          .info-cell .label {
            color: #6b7280;
            font-size: 10px;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            margin-bottom: 4px;
          }
          .info-cell .value {
            color: #111827;
            font-size: 13px;
            font-weight: 650;
          }
          .section { margin: 22px 0; }
          .section h2 {
            margin: 0 0 8px;
            padding-bottom: 7px;
            border-bottom: 1px solid #d1d5db;
            font-size: 12px;
            font-weight: 800;
            text-transform: uppercase;
            letter-spacing: 0.8px;
            color: #374151;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            border: 1px solid #d1d5db;
            border-radius: 8px;
            overflow: hidden;
          }
          td {
            border-bottom: 1px solid #e5e7eb;
            padding: 9px 12px;
            vertical-align: top;
          }
          td:first-child {
            width: 36%;
            color: #6b7280;
            font-weight: 700;
            background: #f9fafb;
          }
          tr:last-child td { border-bottom: 0; }
          .notes {
            border: 1px solid #d1d5db;
            border-radius: 8px;
            padding: 12px 14px;
            color: #374151;
            margin-top: 20px;
          }
          .signatures {
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 24px;
            margin-top: 58px;
          }
          .signature { text-align: center; }
          .line {
            height: 46px;
            border-bottom: 1.5px solid #111827;
            margin-bottom: 8px;
          }
          .role {
            font-size: 11px;
            font-weight: 800;
            text-transform: uppercase;
            letter-spacing: 0.5px;
          }
          .footer {
            margin-top: 34px;
            padding-top: 12px;
            border-top: 1px solid #e5e7eb;
            text-align: center;
            color: #6b7280;
            font-size: 10px;
          }
          @media print {
            body { padding: 22px 28px; }
            .amount-box { print-color-adjust: exact; -webkit-print-color-adjust: exact; }
          }
        </style>
      </head>
      <body>
        <main class="receipt">
          <header class="header">
            <div class="brand">
              <h1>${escapeHtml(title)}</h1>
              <p>${escapeHtml(subtitle)}</p>
            </div>
            <div class="meta">
              <div class="small">Receipt No.</div>
              <div class="number">${escapeHtml(receiptNumber)}</div>
              <div class="small">${escapeHtml(receiptDate)}</div>
              <div class="status">${escapeHtml(status)}</div>
            </div>
          </header>
          <section class="amount-box">
            <div>
              <div class="label">${escapeHtml(amountLabel)}</div>
              <div>Currency: ${escapeHtml(currency || EMPTY_VALUE)}</div>
            </div>
            <div class="amount">${escapeHtml(amountText)}</div>
          </section>
          <section class="info-grid">${renderPrintRows(details)}</section>
          ${renderPrintSections(sections)}
          ${notes ? `<section class="notes">${escapeHtml(notes)}</section>` : ""}
          <section class="signatures">${renderPrintSignatures(signatures)}</section>
          <footer class="footer">${escapeHtml(footer)}</footer>
        </main>
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
      <div className="fixed inset-0 z-[70] bg-black/50" onClick={onClose} />
      <div className="mobile-modal-surface fixed inset-0 z-[80] flex">
        <div
          className="mobile-modal-panel mobile-modal-full flex w-full max-w-4xl flex-col overflow-hidden rounded-xl border shadow-2xl"
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
              <h2 className="text-lg font-semibold">{title}</h2>
              <p className="text-sm" style={{ color: "var(--muted)" }}>
                {receiptNumber}
              </p>
            </div>
            <div className="flex w-full items-center gap-2 sm:w-auto">
              <button
                type="button"
                onClick={handlePrint}
                className="inline-flex min-h-12 flex-1 items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-medium text-white sm:flex-none"
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

          <div className="flex-1 overflow-auto bg-[var(--bg)] p-4 mobile-scrollbar sm:p-5">
            <div className="mx-auto max-w-3xl rounded-lg bg-white p-4 text-slate-900 shadow-sm sm:p-7">
              <div className="mb-5 flex flex-col gap-4 border-b-[3px] border-slate-900 pb-4 sm:flex-row sm:items-start sm:justify-between sm:gap-6">
                <div>
                  <h1 className="text-2xl font-extrabold tracking-normal">
                    {title}
                  </h1>
                  <p className="mt-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
                    {subtitle}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-slate-500">Receipt No.</p>
                  <p className="text-lg font-extrabold">{receiptNumber}</p>
                  <p className="text-xs text-slate-500">{receiptDate}</p>
                  <p className="mt-2 inline-flex rounded-full border border-slate-900 px-3 py-1 text-[11px] font-bold uppercase">
                    {status}
                  </p>
                </div>
              </div>

              <div className="mb-5 flex flex-col gap-3 rounded-lg bg-slate-900 px-5 py-4 text-white sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-xs font-bold uppercase tracking-wide text-slate-300">
                    {amountLabel}
                  </p>
                  <p className="text-xs text-slate-300">
                    Currency: {currency || EMPTY_VALUE}
                  </p>
                </div>
                <p className="text-2xl font-black">{amountText}</p>
              </div>

              <div className="mb-5 grid grid-cols-1 overflow-hidden rounded-lg border border-slate-200 sm:grid-cols-3">
                {normalizedRows(details).map((row) => (
                  <div
                    key={`${row.label}-${row.value}`}
                    className="min-h-[68px] border-b border-r border-slate-200 p-3"
                  >
                    <p className="mb-1 text-[10px] font-bold uppercase tracking-wide text-slate-500">
                      {row.label}
                    </p>
                    <p className="text-sm font-semibold">{row.value}</p>
                  </div>
                ))}
              </div>

              {sections.map((section) => (
                <div key={section.title} className="mb-5">
                  <h3 className="mb-2 border-b border-slate-300 pb-1 text-xs font-extrabold uppercase tracking-wide text-slate-700">
                    {section.title}
                  </h3>
                  <div className="overflow-hidden rounded-lg border border-slate-200">
                    {normalizedRows(section.rows).map((row) => (
                      <div
                        key={`${section.title}-${row.label}`}
                        className="grid grid-cols-1 border-b border-slate-200 last:border-b-0 sm:grid-cols-[38%_1fr]"
                      >
                        <div className="bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-500">
                          {row.label}
                        </div>
                        <div className="px-3 py-2 text-sm font-semibold">
                          {row.value}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}

              {notes && (
                <div className="mb-8 rounded-lg border border-slate-200 p-3 text-sm text-slate-700">
                  {notes}
                </div>
              )}

              <div className="mt-12 grid grid-cols-2 gap-6 sm:grid-cols-4">
                {signatures.map((signature) => (
                  <div key={signature} className="text-center">
                    <div className="mb-2 h-12 border-b border-slate-900" />
                    <p className="text-[11px] font-extrabold uppercase tracking-wide">
                      {signature}
                    </p>
                  </div>
                ))}
              </div>
              <p className="mt-8 border-t border-slate-200 pt-3 text-center text-[10px] text-slate-500">
                {footer}
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

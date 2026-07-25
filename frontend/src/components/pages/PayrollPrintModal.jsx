import React, { useEffect, useRef } from "react";
import { X, Printer } from "lucide-react";
import useFetch from "../../hooks/useFetch";
import { useCalendar } from "../../hooks/useCalendar";

export default function PayrollPrintModal({ isOpen, onClose, payrollID }) {
  const printRef = useRef();
  const {
    formatDate: formatPayrollDate,
    parseDate: parsePayrollDate,
  } = useCalendar("payroll");
  const { data: payroll, loading } = useFetch(
    payrollID ? `/payrolls/${payrollID}/` : null,
  );

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

  if (!isOpen) return null;

  const displayDate = (dateString) => {
    if (!dateString) return "__ / __ / ____";
    return formatPayrollDate(dateString) || dateString;
  };

  const formatFullDate = (dateString) => {
    if (!dateString) return "—";
    return formatPayrollDate(dateString) || dateString;
  };

  const formatNumber = (num) => {
    if (!num && num !== 0) return "0";
    return Number(num).toLocaleString(undefined, {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    });
  };

  const getDaysWorked = (start, end) => {
    if (!start || !end) return 30;
    const s = new Date(`${parsePayrollDate(start) || start}T00:00:00`);
    const e = new Date(`${parsePayrollDate(end) || end}T00:00:00`);
    if (Number.isNaN(s.getTime()) || Number.isNaN(e.getTime())) return 30;
    const diff = Math.ceil((e - s) / (1000 * 60 * 60 * 24));
    return diff > 0 ? diff : 30;
  };

  const getHourlyRate = (salary, days) => {
    if (!salary || !days) return 0;
    const daily = Number(salary) / days;
    return (daily / 8).toFixed(2);
  };

  const getPeriodLabel = (start, end) => {
    if (!start) return "";
    return end
      ? `${formatFullDate(start)} - ${formatFullDate(end)}`
      : formatFullDate(start);
  };

  const currencyLabel = payroll?.currency || "AFN";

  const handlePrint = () => {
    if (!payroll) return;
    const printWindow = window.open("", "_blank", "width=1050,height=750");
    if (!printWindow) return;

    const days = getDaysWorked(
      payroll.payroll_period_start,
      payroll.payroll_period_end,
    );
    const hourlyRate = getHourlyRate(payroll.basic_salary, days);
    const periodLabel = getPeriodLabel(
      payroll.payroll_period_start,
      payroll.payroll_period_end,
    );

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Cash Payment Voucher - ${payroll.employee_name}</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif;
            color: #111;
            padding: 24px 32px;
            font-size: 13px;
            line-height: 1.3;
          }
          .voucher { max-width: 950px; margin: 0 auto; }

          /* Header */
          .v-header {
            display: flex;
            align-items: flex-start;
            justify-content: space-between;
            margin-bottom: 6px;
          }
          .v-header .logo {
            width: 80px;
            height: 80px;
            border: 2px solid #333;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 11px;
            font-weight: 800;
            text-transform: uppercase;
          }
          .v-header .title-area {
            flex: 1;
            text-align: center;
            padding-top: 8px;
          }
          .v-header .title-area h1 {
            font-size: 28px;
            font-weight: 900;
            letter-spacing: 1px;
            text-transform: uppercase;
          }
          .v-header .spacer { width: 80px; }

          /* Project row */
          .project-row {
            display: flex;
            justify-content: space-between;
            align-items: baseline;
            padding: 4px 0 6px;
            border-bottom: 1.5px solid #222;
            margin-bottom: 0;
            font-size: 13px;
          }
          .project-row .project-name {
            font-weight: 700;
            font-size: 13px;
            text-decoration: underline;
          }
          .project-row .period-label {
            font-weight: 700;
            font-size: 15px;
            direction: rtl;
          }

          /* Main table */
          table.main-tbl {
            width: 100%;
            border-collapse: collapse;
            font-size: 13px;
          }
          table.main-tbl td,
          table.main-tbl th {
            border: 1.5px solid #222;
            padding: 5px 10px;
            vertical-align: middle;
          }
          table.main-tbl th {
            background: #e8e8e8;
            font-weight: 700;
            font-size: 12px;
            text-align: center;
          }

          /* Payee info rows */
          .payee-row td {
            font-size: 13px;
            height: 30px;
          }
          .payee-row .label-cell {
            font-weight: 700;
            background: #fafafa;
            width: 100px;
          }
          .payee-row .value-cell {
            font-weight: 600;
          }

          /* Green header row */
          .green-header td {
            background: #4a7c3f;
            color: #fff;
            font-weight: 700;
            font-size: 12px;
            text-align: center;
            padding: 6px 10px;
          }

          /* Data rows */
          .data-row td {
            height: 32px;
            font-size: 13px;
          }
          .data-row .item-label {
            font-weight: 600;
            text-align: left;
            padding-left: 12px;
          }
          .data-row .amount-cell {
            text-align: center;
            font-weight: 600;
          }
          .data-row .desc-cell {
            font-weight: 600;
            text-align: center;
          }

          /* Description header area */
          .desc-header-cell {
            font-weight: 700;
            text-align: center;
          }
          .salary-info {
            font-size: 12px;
            font-weight: 600;
          }

          /* End statement */
          .end-row td {
            text-align: center;
            font-weight: 600;
            font-size: 12px;
            padding: 4px;
            letter-spacing: 1px;
          }
          .checks-row td {
            text-align: center;
            font-weight: 700;
            font-size: 13px;
            color: #4a7c3f;
            padding: 4px;
          }

          /* Amount in words */
          .words-row td {
            font-size: 12px;
            padding: 6px 10px;
          }
          .particulars-row td {
            font-size: 12px;
            padding: 6px 10px;
          }

          /* Signatures */
          .sig-row td {
            height: 50px;
            font-size: 11px;
            font-weight: 700;
            vertical-align: top;
            padding: 8px 10px;
          }

          /* Receiver section */
          .recv-row td {
            font-size: 12px;
            padding: 4px 10px;
            height: 26px;
          }
          .recv-label {
            font-weight: 600;
          }
          .recv-value {
            font-weight: 700;
            text-align: center;
          }
          .thumb-cell {
            font-weight: 700;
            font-size: 11px;
            text-align: center;
            vertical-align: middle;
          }

          /* SN/CPV cells */
          .sn-cell {
            background: #fafafa;
            font-weight: 700;
            font-size: 12px;
            text-align: center;
          }

          @media print {
            body { padding: 16px 20px; }
            table.main-tbl th,
            .green-header td,
            .payee-row .label-cell,
            .sn-cell {
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
            }
          }
        </style>
      </head>
      <body>
        <div class="voucher">
          <!-- Header -->
          <div class="v-header">
            <div class="logo">LOGO</div>
            <div class="title-area">
              <h1>Cash Payment Voucher</h1>
            </div>
            <div class="spacer"></div>
          </div>

          <!-- Project Row -->
          <div class="project-row">
            <span class="project-name">${payroll.project_name || payroll.employee_name?.split(" ")[0] || "PROJECT"}</span>
            <span class="period-label">${periodLabel}</span>
          </div>

          <!-- Main Table -->
          <table class="main-tbl">
            <!-- Payee Row -->
            <tr class="payee-row">
              <td class="label-cell">Payee :</td>
              <td class="value-cell" colspan="2">${payroll.employee_name || "—"}</td>
              <td rowspan="2" style="text-align:center; font-size:12px;">
                <span style="font-weight:600;">Date:</span> ${displayDate(payroll.payment_date)}
              </td>
              <td class="sn-cell" style="width:50px;">SN#</td>
              <td class="sn-cell" style="width:40px;">${payroll.employee_id?.replace("EMP-", "") || "—"}</td>
            </tr>
            <tr class="payee-row">
              <td class="label-cell">Position :</td>
              <td class="value-cell">${payroll.position || "—"}</td>
              <td style="text-align:center; font-size:12px;">
                <span style="font-weight:600;">ID #</span> ${payroll.employee_id || ""}
              </td>
              <td class="sn-cell">CPV#</td>
              <td class="sn-cell"></td>
            </tr>

            <!-- Green Header Row -->
            <tr class="green-header">
              <td style="width:160px;">Account Title</td>
              <td style="width:130px;">Account Code</td>
              <td style="width:120px;">DR.</td>
              <td style="width:120px;">CR.</td>
              <td colspan="2">Description</td>
            </tr>

            <!-- Voucher Title & Salary Info -->
            <tr class="data-row">
              <td colspan="2" style="font-weight:700; font-size:12px; background:#f9fafb;">
                ${payroll.project_name || "LALANDER 5"} Employee's Payroll Voucher ${periodLabel}
              </td>
              <td></td>
              <td></td>
              <td class="desc-header-cell" colspan="2">
                <div style="display:flex; justify-content:space-between; padding:0 4px;">
                  <span>Salary for</span>
                  <span><strong>${days}</strong> days</span>
                </div>
              </td>
            </tr>

            <!-- M/R and H/R row -->
            <tr class="data-row">
              <td colspan="2" style="border-top:none;"></td>
              <td style="border-top:none;"></td>
              <td style="border-top:none;"></td>
              <td colspan="2" style="border-top:none;">
                <div style="display:flex; justify-content:space-between; padding:0 4px; font-size:12px;">
                  <span>M/R <strong>${currencyLabel} ${formatNumber(payroll.basic_salary)}</strong></span>
                  <span>H/R <strong>${currencyLabel} ${hourlyRate}</strong></span>
                </div>
              </td>
            </tr>

            <!-- Regular Time Salary -->
            <tr class="data-row">
              <td class="item-label" colspan="2">Regular time salary</td>
              <td class="amount-cell">${currencyLabel} ${formatNumber(payroll.basic_salary)}</td>
              <td></td>
              <td class="desc-cell" style="font-weight:700;">Days Worked</td>
              <td class="desc-cell" style="font-weight:800; font-size:15px;">${days}</td>
            </tr>

            <!-- Overtime -->
            <tr class="data-row">
              <td class="item-label" colspan="2">Overtime / Addition</td>
              <td class="amount-cell">${currencyLabel} ${formatNumber(payroll.overtime_amount)}</td>
              <td></td>
              <td class="desc-cell" style="font-weight:700;">Over Time Hours</td>
              <td class="desc-cell" style="font-weight:800; font-size:15px;">${formatNumber(payroll.overtime_hours)}</td>
            </tr>

            <!-- Bonus -->
            <tr class="data-row">
              <td class="item-label" colspan="2">Bonus</td>
              <td class="amount-cell">${currencyLabel} ${formatNumber(payroll.bonus)}</td>
              <td></td>
              <td colspan="2"></td>
            </tr>

            <!-- Allowances / Food Cost -->
            <tr class="data-row">
              <td class="item-label" colspan="2">Allowances</td>
              <td class="amount-cell">${currencyLabel} ${formatNumber(payroll.allowances)}</td>
              <td></td>
              <td colspan="2"></td>
            </tr>

            <!-- Deduction -->
            <tr class="data-row">
              <td class="item-label" colspan="2">Deduction</td>
              <td></td>
              <td class="amount-cell">${currencyLabel} ${formatNumber(Number(payroll.deductions || 0) + Number(payroll.tax_deducted || 0))}</td>
              <td colspan="2"></td>
            </tr>

            <!-- Advances -->
            <tr class="data-row">
              <td class="item-label" colspan="2">Advances</td>
              <td></td>
              <td class="amount-cell">${currencyLabel} 0</td>
              <td colspan="2"></td>
            </tr>

            <!-- End of Statement -->
            <tr class="end-row">
              <td colspan="6">----END OF STATEMENT----</td>
            </tr>

            <!-- All Checks Out -->
            <tr class="checks-row">
              <td colspan="6">ALL CHECKS OUT</td>
            </tr>

            <!-- Amount in words -->
            <tr class="words-row">
              <td colspan="6" style="font-weight:600;">
                <strong>Amount in words :</strong> ${payroll.amount_in_words || ""}
              </td>
            </tr>

            <!-- Particulars -->
            <tr class="particulars-row">
              <td colspan="6" style="font-weight:600;">
                <strong>Particulars</strong>
                <span style="margin-left:80px;">${payroll.project_name || "LALANDER 5"} Employee's Payroll Voucher ${periodLabel}</span>
              </td>
            </tr>

            <!-- Signature Row -->
            <tr class="sig-row">
              <td colspan="2" style="width:33%;">Prepared By</td>
              <td style="width:17%;">Checked By</td>
              <td colspan="3">Approved By</td>
            </tr>

            <!-- Receiver Row 1 -->
            <tr class="recv-row">
              <td colspan="2" rowspan="4" style="vertical-align:top; padding-top:10px;"></td>
              <td colspan="2" class="recv-label">Recevid.</td>
              <td class="recv-value">${currencyLabel} ${formatNumber(payroll.net_pay)}</td>
              <td rowspan="4" class="thumb-cell" style="width:100px; border-left:1.5px solid #222;">
                THUMB IMP.
              </td>
            </tr>
            <tr class="recv-row">
              <td colspan="2" class="recv-label">Signature.</td>
              <td class="recv-value"></td>
            </tr>
            <tr class="recv-row">
              <td colspan="2" class="recv-label">Name.</td>
              <td class="recv-value">${payroll.employee_name || "—"}</td>
            </tr>
            <tr class="recv-row">
              <td colspan="2"></td>
              <td></td>
            </tr>
          </table>
        </div>
      </body>
      </html>
    `);

    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 300);
  };

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/50 z-[60]" onClick={onClose} />

      {/* Modal */}
      <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
        <div
          className="w-full max-w-5xl max-h-[90vh] bg-[var(--card)] rounded-2xl shadow-2xl border border-[var(--border)] overflow-hidden flex flex-col"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Modal Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border)] shrink-0">
            <h2 className="text-lg font-semibold text-[var(--text)]">
              Cash Payment Voucher Preview
            </h2>
            <div className="flex items-center gap-2">
              <button
                onClick={handlePrint}
                disabled={loading || !payroll}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[var(--primary)] text-white text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Printer className="h-4 w-4" />
                Print
              </button>
              <button
                onClick={onClose}
                className="p-2 rounded-lg hover:bg-[var(--hover)] text-[var(--muted)] hover:text-[var(--text)] transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* Scrollable Preview */}
          <div className="overflow-y-auto flex-1 bg-gray-100">
            {loading ? (
              <div className="flex items-center justify-center h-64">
                <div className="flex flex-col items-center gap-3">
                  <div className="w-8 h-8 border-2 border-[var(--primary)] border-t-transparent rounded-full animate-spin" />
                  <p className="text-sm text-[var(--muted)]">
                    Loading payroll data...
                  </p>
                </div>
              </div>
            ) : !payroll ? (
              <div className="flex items-center justify-center h-64">
                <p className="text-sm text-[var(--muted)]">
                  No payroll data found.
                </p>
              </div>
            ) : (
              <div ref={printRef} className="p-6 md:p-8 max-w-5xl mx-auto">
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 md:p-8">
                  {/* ===== VOUCHER HEADER ===== */}
                  <div className="flex items-start justify-between mb-1">
                    <div className="w-20 h-20 border-2 border-gray-800 rounded-full flex items-center justify-center text-[10px] font-bold uppercase text-gray-700">
                      LOGO
                    </div>
                    <div className="flex-1 text-center pt-2">
                      <h1 className="text-2xl md:text-3xl font-black uppercase tracking-wider text-gray-900">
                        Cash Payment Voucher
                      </h1>
                    </div>
                    <div className="w-20" />
                  </div>

                  {/* Project & Period Row */}
                  <div className="flex justify-between items-baseline border-b-2 border-gray-900 pb-1 mb-0">
                    <span className="text-sm font-bold text-gray-900 underline">
                      {payroll.project_name || "PROJECT"}
                    </span>
                    <span className="text-base font-bold text-gray-900">
                      {(() => {
                        return getPeriodLabel(
                          payroll.payroll_period_start,
                          payroll.payroll_period_end,
                        );
                      })()}
                    </span>
                  </div>

                  {/* ===== MAIN TABLE ===== */}
                  <table className="w-full border-collapse text-sm">
                    <tbody>
                      {/* Payee Row */}
                      <tr>
                        <td className="border-[1.5px] border-gray-900 px-3 py-1.5 font-bold bg-gray-50 w-[100px]">
                          Payee :
                        </td>
                        <td
                          className="border-[1.5px] border-gray-900 px-3 py-1.5 font-semibold"
                          colSpan={2}
                        >
                          {payroll.employee_name || "—"}
                        </td>
                        <td
                          className="border-[1.5px] border-gray-900 px-3 py-1.5 text-center text-xs"
                          rowSpan={2}
                        >
                          <span className="font-semibold">Date:</span>{" "}
                          {displayDate(payroll.payment_date)}
                        </td>
                        <td className="border-[1.5px] border-gray-900 px-2 py-1.5 bg-gray-50 font-bold text-center text-xs w-[50px]">
                          SN#
                        </td>
                        <td className="border-[1.5px] border-gray-900 px-2 py-1.5 bg-gray-50 font-bold text-center text-xs w-[50px]">
                          {payroll.employee_id?.replace("EMP-", "") || "—"}
                        </td>
                      </tr>

                      {/* Position Row */}
                      <tr>
                        <td className="border-[1.5px] border-gray-900 px-3 py-1.5 font-bold bg-gray-50">
                          Position :
                        </td>
                        <td className="border-[1.5px] border-gray-900 px-3 py-1.5 font-semibold">
                          {payroll.position || "—"}
                        </td>
                        <td className="border-[1.5px] border-gray-900 px-3 py-1.5 text-center text-xs">
                          <span className="font-semibold">ID #</span>{" "}
                          {payroll.employee_id || ""}
                        </td>
                        <td className="border-[1.5px] border-gray-900 px-2 py-1.5 bg-gray-50 font-bold text-center text-xs">
                          CPV#
                        </td>
                        <td className="border-[1.5px] border-gray-900 px-2 py-1.5 bg-gray-50 font-bold text-center text-xs"></td>
                      </tr>

                      {/* Green Header */}
                      <tr>
                        <td
                          className="border-[1.5px] border-gray-900 px-3 py-1.5 bg-[#4a7c3f] text-white font-bold text-xs text-center"
                          style={{ width: "160px" }}
                        >
                          Account Title
                        </td>
                        <td
                          className="border-[1.5px] border-gray-900 px-3 py-1.5 bg-[#4a7c3f] text-white font-bold text-xs text-center"
                          style={{ width: "130px" }}
                        >
                          Account Code
                        </td>
                        <td
                          className="border-[1.5px] border-gray-900 px-3 py-1.5 bg-[#4a7c3f] text-white font-bold text-xs text-center"
                          style={{ width: "110px" }}
                        >
                          DR.
                        </td>
                        <td
                          className="border-[1.5px] border-gray-900 px-3 py-1.5 bg-[#4a7c3f] text-white font-bold text-xs text-center"
                          style={{ width: "110px" }}
                        >
                          CR.
                        </td>
                        <td
                          className="border-[1.5px] border-gray-900 px-3 py-1.5 bg-[#4a7c3f] text-white font-bold text-xs text-center"
                          colSpan={2}
                        >
                          Description
                        </td>
                      </tr>

                      {/* Voucher Title + Salary Info */}
                      <tr>
                        <td
                          className="border-[1.5px] border-gray-900 px-3 py-1.5 font-bold text-xs bg-gray-50"
                          colSpan={2}
                        >
                          {payroll.project_name || "LALANDER 5"} Employee's
                          Payroll Voucher{" "}
                          {(() => {
                            return getPeriodLabel(
                              payroll.payroll_period_start,
                              payroll.payroll_period_end,
                            );
                          })()}
                        </td>
                        <td className="border-[1.5px] border-gray-900 px-3 py-1"></td>
                        <td className="border-[1.5px] border-gray-900 px-3 py-1"></td>
                        <td
                          className="border-[1.5px] border-gray-900 px-2 py-1 text-xs"
                          colSpan={2}
                        >
                          <div className="flex justify-between">
                            <span>Salary for</span>
                            <span>
                              <span className="font-bold">
                                {getDaysWorked(
                                  payroll.payroll_period_start,
                                  payroll.payroll_period_end,
                                )}
                              </span>{" "}
                              days
                            </span>
                          </div>
                          <div className="flex justify-between mt-0.5">
                            <span>
                              M/R{" "}
                              <strong>
                                {payroll.currency}{" "}
                                {formatNumber(payroll.basic_salary)}
                              </strong>
                            </span>
                            <span>
                              H/R{" "}
                              <strong>
                                {payroll.currency}{" "}
                                {getHourlyRate(
                                  payroll.basic_salary,
                                  getDaysWorked(
                                    payroll.payroll_period_start,
                                    payroll.payroll_period_end,
                                  ),
                                )}
                              </strong>
                            </span>
                          </div>
                        </td>
                      </tr>

                      {/* Regular time salary */}
                      <tr>
                        <td
                          className="border-[1.5px] border-gray-900 px-3 py-2 font-semibold"
                          colSpan={2}
                        >
                          Regular time salary
                        </td>
                        <td className="border-[1.5px] border-gray-900 px-3 py-2 text-center font-semibold">
                          {payroll.currency}{" "}
                          {formatNumber(payroll.basic_salary)}
                        </td>
                        <td className="border-[1.5px] border-gray-900 px-3 py-2"></td>
                        <td className="border-[1.5px] border-gray-900 px-2 py-2 text-center font-bold text-xs">
                          Days Worked
                        </td>
                        <td className="border-[1.5px] border-gray-900 px-2 py-2 text-center font-extrabold text-base">
                          {getDaysWorked(
                            payroll.payroll_period_start,
                            payroll.payroll_period_end,
                          )}
                        </td>
                      </tr>

                      {/* Overtime */}
                      <tr>
                        <td
                          className="border-[1.5px] border-gray-900 px-3 py-2 font-semibold"
                          colSpan={2}
                        >
                          Overtime / Addition
                        </td>
                        <td className="border-[1.5px] border-gray-900 px-3 py-2 text-center font-semibold">
                          {payroll.currency}{" "}
                          {formatNumber(payroll.overtime_amount)}
                        </td>
                        <td className="border-[1.5px] border-gray-900 px-3 py-2"></td>
                        <td className="border-[1.5px] border-gray-900 px-2 py-2 text-center font-bold text-xs">
                          Over Time Hours
                        </td>
                        <td className="border-[1.5px] border-gray-900 px-2 py-2 text-center font-extrabold text-base">
                          {formatNumber(payroll.overtime_hours)}
                        </td>
                      </tr>

                      {/* Bonus */}
                      <tr>
                        <td
                          className="border-[1.5px] border-gray-900 px-3 py-2 font-semibold"
                          colSpan={2}
                        >
                          Bonus
                        </td>
                        <td className="border-[1.5px] border-gray-900 px-3 py-2 text-center font-semibold">
                          {payroll.currency} {formatNumber(payroll.bonus)}
                        </td>
                        <td className="border-[1.5px] border-gray-900 px-3 py-2"></td>
                        <td
                          className="border-[1.5px] border-gray-900 px-2 py-2"
                          colSpan={2}
                        ></td>
                      </tr>

                      {/* Allowances */}
                      <tr>
                        <td
                          className="border-[1.5px] border-gray-900 px-3 py-2 font-semibold"
                          colSpan={2}
                        >
                          Allowances
                        </td>
                        <td className="border-[1.5px] border-gray-900 px-3 py-2 text-center font-semibold">
                          {payroll.currency} {formatNumber(payroll.allowances)}
                        </td>
                        <td className="border-[1.5px] border-gray-900 px-3 py-2"></td>
                        <td
                          className="border-[1.5px] border-gray-900 px-2 py-2"
                          colSpan={2}
                        ></td>
                      </tr>

                      {/* Deduction */}
                      <tr>
                        <td
                          className="border-[1.5px] border-gray-900 px-3 py-2 font-semibold"
                          colSpan={2}
                        >
                          Deduction
                        </td>
                        <td className="border-[1.5px] border-gray-900 px-3 py-2"></td>
                        <td className="border-[1.5px] border-gray-900 px-3 py-2 text-center font-semibold">
                          {payroll.currency}{" "}
                          {formatNumber(
                            Number(payroll.deductions || 0) +
                              Number(payroll.tax_deducted || 0),
                          )}
                        </td>
                        <td
                          className="border-[1.5px] border-gray-900 px-2 py-2"
                          colSpan={2}
                        ></td>
                      </tr>

                      {/* Advances */}
                      <tr>
                        <td
                          className="border-[1.5px] border-gray-900 px-3 py-2 font-semibold"
                          colSpan={2}
                        >
                          Advances
                        </td>
                        <td className="border-[1.5px] border-gray-900 px-3 py-2"></td>
                        <td className="border-[1.5px] border-gray-900 px-3 py-2 text-center font-semibold">
                          {payroll.currency} 0
                        </td>
                        <td
                          className="border-[1.5px] border-gray-900 px-2 py-2"
                          colSpan={2}
                        ></td>
                      </tr>

                      {/* End of Statement */}
                      <tr>
                        <td
                          className="border-[1.5px] border-gray-900 px-3 py-1 text-center font-semibold text-xs tracking-widest"
                          colSpan={6}
                        >
                          ----END OF STATEMENT----
                        </td>
                      </tr>

                      {/* All Checks Out */}
                      <tr>
                        <td
                          className="border-[1.5px] border-gray-900 px-3 py-1 text-center font-bold text-sm text-green-700"
                          colSpan={6}
                        >
                          ALL CHECKS OUT
                        </td>
                      </tr>

                      {/* Amount in Words */}
                      <tr>
                        <td
                          className="border-[1.5px] border-gray-900 px-3 py-2 text-xs"
                          colSpan={6}
                        >
                          <strong>Amount in words :</strong>{" "}
                          {payroll.amount_in_words || ""}
                        </td>
                      </tr>

                      {/* Particulars */}
                      <tr>
                        <td
                          className="border-[1.5px] border-gray-900 px-3 py-2 text-xs"
                          colSpan={6}
                        >
                          <strong>Particulars</strong>
                          <span className="ml-16">
                            {payroll.project_name || "LALANDER 5"} Employee's
                            Payroll Voucher{" "}
                            {(() => {
                              return getPeriodLabel(
                                payroll.payroll_period_start,
                                payroll.payroll_period_end,
                              );
                            })()}
                          </span>
                        </td>
                      </tr>

                      {/* Signatures */}
                      <tr>
                        <td
                          className="border-[1.5px] border-gray-900 px-3 py-2 text-[11px] font-bold align-top h-14"
                          colSpan={2}
                        >
                          Prepared By
                        </td>
                        <td className="border-[1.5px] border-gray-900 px-3 py-2 text-[11px] font-bold align-top h-14">
                          Checked By
                        </td>
                        <td
                          className="border-[1.5px] border-gray-900 px-3 py-2 text-[11px] font-bold align-top h-14"
                          colSpan={3}
                        >
                          Approved By
                        </td>
                      </tr>

                      {/* Receiver - Recevid */}
                      <tr>
                        <td
                          className="border-[1.5px] border-gray-900 px-3 py-1"
                          colSpan={2}
                          rowSpan={4}
                        ></td>
                        <td
                          className="border-[1.5px] border-gray-900 px-3 py-1 text-xs font-semibold"
                          colSpan={2}
                        >
                          Recevid.
                        </td>
                        <td className="border-[1.5px] border-gray-900 px-2 py-1 text-center font-bold text-sm">
                          {payroll.currency} {formatNumber(payroll.net_pay)}
                        </td>
                        <td
                          className="border-[1.5px] border-gray-900 px-2 py-1 text-center font-bold text-[10px] align-middle"
                          rowSpan={4}
                          style={{ width: "90px" }}
                        >
                          THUMB IMP.
                        </td>
                      </tr>

                      {/* Signature */}
                      <tr>
                        <td
                          className="border-[1.5px] border-gray-900 px-3 py-1 text-xs font-semibold"
                          colSpan={2}
                        >
                          Signature.
                        </td>
                        <td className="border-[1.5px] border-gray-900 px-2 py-1"></td>
                      </tr>

                      {/* Name */}
                      <tr>
                        <td
                          className="border-[1.5px] border-gray-900 px-3 py-1 text-xs font-semibold"
                          colSpan={2}
                        >
                          Name.
                        </td>
                        <td className="border-[1.5px] border-gray-900 px-2 py-1 text-center font-semibold text-sm">
                          {payroll.employee_name || "—"}
                        </td>
                      </tr>

                      {/* Empty row */}
                      <tr>
                        <td
                          className="border-[1.5px] border-gray-900 px-3 py-2"
                          colSpan={2}
                        ></td>
                        <td className="border-[1.5px] border-gray-900 px-2 py-2"></td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

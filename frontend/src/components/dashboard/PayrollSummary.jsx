// components/dashboard/PayrollSummary.jsx

import Card from "../ui/Card";
import { useLanguage } from "../../hooks/useLanguage";

const formatMoney = (val, currency = "USD") => {
  if (val === null || val === undefined) return `${currency} 0`;

  const num = parseFloat(val);

  return `${currency} ${num.toLocaleString("en-US", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  })}`;
};

// show USD + AFN together
const renderDual = (usd, afn) => (
  <div>
    <div>{formatMoney(usd, "USD")}</div>
    <div className="text-xs text-[var(--muted)]">{formatMoney(afn, "AFN")}</div>
  </div>
);

const PAYMENT_ICONS = {
  bank_transfer: "🏦",
  check: "📝",
  cash: "💵",
};

export default function PayrollSummary({ data }) {
  if (!data) return null;

  const { t } = useLanguage();

  const current = data.current_month || {};
  const previous = data.previous_month || {};

  const currentNetUSD = parseFloat(current.cash_outflow_usd ?? current.net_usd ?? 0);
  const previousNetUSD = parseFloat(previous.cash_outflow_usd ?? previous.net_usd ?? 0);

  const changeNet =
    previousNetUSD > 0
      ? (((currentNetUSD - previousNetUSD) / previousNetUSD) * 100).toFixed(1)
      : 0;

  return (
    <Card
      title={t("payrollSummary.title")}
      right={
        <span className="text-xs text-[var(--muted)]">
          {t("payrollSummary.payrollsThisMonth", {
            count: current.count || 0,
          })}
        </span>
      }
    >
      <div className="space-y-5">
        {/* CURRENT vs PREVIOUS */}
        <div className="grid grid-cols-1 gap-4 min-[380px]:grid-cols-2">
          <div className="p-4 rounded-lg bg-[var(--bg)] border border-[var(--border)]">
            <p className="text-xs text-[var(--muted)] mb-1">
              {t("payrollSummary.thisMonthNet")}
            </p>

            <div className="text-xl font-bold text-[var(--text)]">
              {renderDual(current.net_usd, current.net_afn)}
            </div>

            <div className="text-xs text-[var(--muted)] mt-1">
              {t("payrollSummary.gross")}:{" "}
              {renderDual(current.gross_usd, current.gross_afn)}
            </div>
            <div className="text-xs text-[var(--muted)] mt-1">
              Cash outflow:{" "}
              {renderDual(current.cash_outflow_usd, current.cash_outflow_afn)}
            </div>
            <div className="mt-2 space-y-1 text-xs text-[var(--muted)]">
              <div className="flex justify-between gap-3">
                <span>Employees</span>
                <div className="text-right">{renderDual(current.employee_net_usd, current.employee_net_afn)}</div>
              </div>
              <div className="flex justify-between gap-3">
                <span>Advances paid</span>
                <div className="text-right">{renderDual(current.total_advances_paid_usd, current.total_advances_paid_afn)}</div>
              </div>
              <div className="flex justify-between gap-3">
                <span>Daily workers</span>
                <div className="text-right">{renderDual(current.daily_worker_net_usd, current.daily_worker_net_afn)}</div>
              </div>
            </div>
          </div>

          <div className="p-4 rounded-lg bg-[var(--bg)] border border-[var(--border)]">
            <p className="text-xs text-[var(--muted)] mb-1">
              {t("payrollSummary.lastMonthNet")}
            </p>

            <div className="text-xl font-bold text-[var(--muted)]">
              {renderDual(previous.net_usd, previous.net_afn)}
            </div>
            <div className="text-xs text-[var(--muted)] mt-1">
              Cash outflow:{" "}
              {renderDual(previous.cash_outflow_usd, previous.cash_outflow_afn)}
            </div>

            {changeNet !== 0 && (
              <p
                className="text-xs mt-1 font-medium"
                style={{
                  color: changeNet > 0 ? "var(--danger)" : "var(--success)",
                }}
              >
                {changeNet > 0 ? "↑" : "↓"} {Math.abs(changeNet)}%{" "}
                {t("payrollSummary.change")}
              </p>
            )}
          </div>
        </div>

        {/* BREAKDOWN */}
        <div className="grid grid-cols-1 gap-3 min-[380px]:grid-cols-2 sm:grid-cols-3 xl:grid-cols-6">
          {[
            {
              label: "Deductions",
              usd: current.total_deductions_usd,
              afn: current.total_deductions_afn,
              color: "var(--danger)",
            },
            {
              label: "Advances Paid",
              usd: current.total_advances_paid_usd,
              afn: current.total_advances_paid_afn,
              color: "var(--danger)",
            },
            {
              label: "Advance Deductions",
              usd: current.total_advance_deductions_usd,
              afn: current.total_advance_deductions_afn,
              color: "var(--warning)",
            },
            {
              label: t("payrollSummary.tax"),
              usd: current.total_tax_usd,
              afn: current.total_tax_afn,
              color: "var(--warning)",
            },
            {
              label: t("payrollSummary.bonus"),
              usd: current.total_bonus_usd,
              afn: current.total_bonus_afn,
              color: "var(--success)",
            },
            {
              label: t("payrollSummary.overtime"),
              usd: current.total_overtime_usd,
              afn: current.total_overtime_afn,
              color: "var(--primary)",
            },
            {
              label: "Outstanding Salary",
              usd: current.outstanding_salary_usd,
              afn: current.outstanding_salary_afn,
              color: "var(--warning)",
            },
            {
              label: "Already Paid",
              usd: current.amount_already_paid_usd,
              afn: current.amount_already_paid_afn,
              color: "var(--success)",
            },
          ].map((item) => (
            <div
              key={item.label}
              className="text-center p-2 rounded-lg bg-[var(--bg)]"
            >
              <div style={{ color: item.color }} className="text-sm font-bold">
                {renderDual(item.usd, item.afn)}
              </div>
              <p className="text-[10px] text-[var(--muted)]">{item.label}</p>
            </div>
          ))}
        </div>

        {/* PAYMENT METHODS */}
        {data.payment_method_breakdown?.length > 0 && (
          <div>
            <h4 className="text-sm font-medium text-[var(--muted)] mb-3">
              {t("payrollSummary.paymentMethods")}
            </h4>

            <div className="space-y-2">
              {data.payment_method_breakdown.map((pm) => (
                <div
                  key={pm.payment_method}
                  className="flex items-center justify-between text-sm"
                >
                  <div className="flex items-center gap-2">
                    <span>{PAYMENT_ICONS[pm.payment_method] || "💳"}</span>
                    <span className="capitalize text-[var(--text)]">
                      {pm.payment_method.replace("_", " ")}
                    </span>
                  </div>

                  <div className="text-right text-xs">
                    {renderDual(pm.total_usd, pm.total_afn)}
                    <div className="text-[var(--muted)]">({pm.count})</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* RECENT PAYROLLS */}
        {data.recent_payrolls?.length > 0 && (
          <div className="border-t border-[var(--border)] pt-4">
            <h4 className="text-sm font-medium text-[var(--muted)] mb-3">
              {t("payrollSummary.recentPayrolls")}
            </h4>

            <div className="space-y-2">
              {data.recent_payrolls.map((pr) => (
                <div
                  key={pr.id}
                  className="flex flex-col gap-2 rounded-lg bg-[var(--bg)] px-3 py-2 min-[380px]:flex-row min-[380px]:items-center min-[380px]:justify-between"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-medium">
                      {pr.employee__first_name} {pr.employee__last_name}
                    </p>
                    <p className="text-xs text-[var(--muted)]">
                      {pr.employee__employee_id} · {pr.currency}
                    </p>
                  </div>

                  <div className="shrink-0 min-[380px]:text-right">
                    <div className="text-sm font-semibold">
                      {formatMoney(pr.net_pay, pr.currency)}
                    </div>
                    <div className="text-xs text-[var(--muted)]">
                      {t("payrollSummary.gross")}:{" "}
                      {formatMoney(pr.gross_pay, pr.currency)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}

import { useLanguage } from "../../hooks/useLanguage";
import Card from "../ui/Card";

const formatCurrency = (val) => {
  if (val === null || val === undefined) return "0";

  const num = parseFloat(val);

  return num.toLocaleString("en-US", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });
};

const getBudgetTotals = (value) => {
  if (!value || typeof value !== "object") {
    return { usd: value || 0, afn: 0 };
  }

  return {
    usd: value.usd ?? value.USD ?? 0,
    afn: value.afn ?? value.AFN ?? 0,
  };
};

function FinancialRow({ label, value, prefix = "", color, bold = false }) {
  return (
    <div className="flex items-center justify-between py-2.5 border-b border-[var(--border)] last:border-0">
      <span className="text-sm text-[var(--muted)]">{label}</span>

      <span
        className={`text-sm ${bold ? "font-bold" : "font-medium"}`}
        style={{ color: color || "var(--text)" }}
      >
        {prefix}
        {formatCurrency(value)}
      </span>
    </div>
  );
}

export default function FinancialOverview({ data }) {
  const { t } = useLanguage();
  if (!data) return null;

  const budgets = getBudgetTotals(data.total_budget_all_projects);

  return (
    <Card title={t("financialOverview.title")}>
      <div className="space-y-0">
        <FinancialRow
          label={`${t("financialOverview.totalBudget")} USD`}
          value={budgets.usd}
          prefix="$"
          bold
        />
        <FinancialRow
          label={`${t("financialOverview.totalBudget")} AFN`}
          value={budgets.afn}
          prefix="AFN "
          bold
        />

        <div className="mt-4 mb-1">
          <p className="text-xs font-semibold text-[var(--muted)] uppercase tracking-wider">
            {t("financialOverview.expenses")}
          </p>
        </div>

        <FinancialRow
          label={t("financialOverview.expensesUsd")}
          value={data.expenses?.total_usd}
          prefix="$"
        />

        <FinancialRow
          label={t("financialOverview.expensesAfn")}
          value={data.expenses?.total_afn}
          prefix="AFN "
        />

        <FinancialRow
          label="Project Expenses USD"
          value={data.expenses?.project_usd}
          prefix="$"
          color="var(--muted)"
        />

        <FinancialRow
          label="Project Expenses AFN"
          value={data.expenses?.project_afn}
          prefix="AFN "
          color="var(--muted)"
        />

        <FinancialRow
          label="Office Expenses USD"
          value={data.expenses?.office_usd}
          prefix="$"
          color="var(--muted)"
        />

        <FinancialRow
          label="Office Expenses AFN"
          value={data.expenses?.office_afn}
          prefix="AFN "
          color="var(--muted)"
        />

        <div className="mt-4 mb-1">
          <p className="text-xs font-semibold text-[var(--muted)] uppercase tracking-wider">
            {t("financialOverview.payroll")}
          </p>
        </div>

        <FinancialRow
          label={t("financialOverview.netPayrollUsd")}
          value={data.payroll?.net_usd}
          prefix="$"
        />

        <FinancialRow
          label={t("financialOverview.netPayrollAfn")}
          value={data.payroll?.net_afn}
          prefix="AFN "
        />

        <FinancialRow
          label="Payroll Cash Outflow USD"
          value={data.payroll?.cash_outflow_usd}
          prefix="$"
          color="var(--primary)"
        />

        <FinancialRow
          label="Payroll Cash Outflow AFN"
          value={data.payroll?.cash_outflow_afn}
          prefix="AFN "
          color="var(--primary)"
        />

        <FinancialRow
          label="Employee Payroll USD"
          value={data.payroll?.employee_net_usd}
          prefix="$"
          color="var(--muted)"
        />

        <FinancialRow
          label="Employee Payroll AFN"
          value={data.payroll?.employee_net_afn}
          prefix="AFN "
          color="var(--muted)"
        />

        <FinancialRow
          label="Daily Worker Payroll USD"
          value={data.payroll?.daily_worker_net_usd}
          prefix="$"
          color="var(--muted)"
        />

        <FinancialRow
          label="Daily Worker Payroll AFN"
          value={data.payroll?.daily_worker_net_afn}
          prefix="AFN "
          color="var(--muted)"
        />

        <FinancialRow
          label="Employee Advances Paid USD"
          value={data.payroll?.salary_advances_usd}
          prefix="$"
          color="var(--danger)"
        />

        <FinancialRow
          label="Employee Advances Paid AFN"
          value={data.payroll?.salary_advances_afn}
          prefix="AFN "
          color="var(--danger)"
        />

        <FinancialRow
          label="Employee Advance Deductions USD"
          value={data.payroll?.employee_advance_deductions_usd}
          prefix="$"
          color="var(--muted)"
        />

        <FinancialRow
          label="Employee Advance Deductions AFN"
          value={data.payroll?.employee_advance_deductions_afn}
          prefix="AFN "
          color="var(--muted)"
        />

        <FinancialRow
          label={t("financialOverview.grossPayrollUsd")}
          value={data.payroll?.gross_usd}
          prefix="$"
          color="var(--muted)"
        />

        <FinancialRow
          label={t("financialOverview.grossPayrollAfn")}
          value={data.payroll?.gross_afn}
          prefix="AFN "
          color="var(--muted)"
        />

        <div className="mt-4 mb-1">
          <p className="text-xs font-semibold text-[var(--muted)] uppercase tracking-wider">
            {t("financialOverview.contracts")}
          </p>
        </div>

        <FinancialRow
          label={t("financialOverview.contractValueUsd")}
          value={data.contracts?.total_contract_value_usd}
          prefix="$"
        />

        <FinancialRow
          label={t("financialOverview.contractValueAfn")}
          value={data.contracts?.total_contract_value_afn}
          prefix="AFN "
        />

        <FinancialRow
          label={t("financialOverview.paymentsMadeUsd")}
          value={data.contracts?.total_payments_made_usd}
          prefix="$"
        />

        <FinancialRow
          label={t("financialOverview.paymentsMadeAfn")}
          value={data.contracts?.total_payments_made_afn}
          prefix="AFN "
        />

        <FinancialRow
          label={t("financialOverview.remainingUsd")}
          value={data.contracts?.total_remaining_usd}
          prefix="$"
          color="var(--warning)"
        />

        <FinancialRow
          label={t("financialOverview.remainingAfn")}
          value={data.contracts?.total_remaining_afn}
          prefix="AFN "
          color="var(--warning)"
        />

        <div className="mt-4 pt-3 border-t-2 border-[var(--border)]">
          <FinancialRow
            label={t("financialOverview.grandTotalOutflowUsd")}
            value={data.grand_total_outflow?.usd}
            prefix="$"
            color="var(--primary)"
          />

          <FinancialRow
            label={t("financialOverview.grandTotalOutflowAfn")}
            value={data.grand_total_outflow?.afn}
            prefix="AFN "
            color="var(--primary)"
          />
        </div>
      </div>
    </Card>
  );
}

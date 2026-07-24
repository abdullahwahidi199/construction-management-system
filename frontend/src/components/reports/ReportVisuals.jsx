import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { useLanguage } from "../../hooks/useLanguage";
import {
  formatLabel,
  formatMoney,
  formatValue,
  getArrayData,
  humanizeStatus,
  toNumber,
  translateOrFallback,
  translateReportKey,
} from "./reportUtils";

const COLORS = [
  "#2563eb",
  "#16a34a",
  "#d97706",
  "#7c3aed",
  "#0891b2",
  "#dc2626",
  "#475569",
  "#0f766e",
];

const axisStyle = {
  fontSize: 11,
  fill: "var(--muted)",
};

const tooltipStyle = {
  background: "var(--card)",
  border: "0",
  borderRadius: 8,
  color: "var(--text)",
  boxShadow: "0 18px 38px rgba(0,0,0,0.14)",
};

const gridStroke = "color-mix(in srgb, var(--border) 55%, transparent)";

const chartText = (t, key, fallback, params) =>
  translateOrFallback(t, `reports.charts.${key}`, fallback, params);

const legendText = (t, key, fallback) =>
  translateOrFallback(t, `reports.legends.${key}`, fallback);

function ChartFrame({ title, subtitle, children, className = "" }) {
  return (
    <section
      className={`overflow-hidden rounded-lg bg-card shadow-sm shadow-black/5 ${className}`}
    >
      <div className="px-5 py-4">
        <h3 className="text-sm font-semibold text-text">{title}</h3>
        {subtitle && <p className="mt-1 text-xs text-muted">{subtitle}</p>}
      </div>
      <div className="h-80 p-4">{children}</div>
    </section>
  );
}

function EmptyChart({ label }) {
  const { t } = useLanguage();
  return (
    <div className="h-full flex items-center justify-center text-sm text-muted">
      {label || translateOrFallback(t, "reports.states.noChartData", "No chart data available")}
    </div>
  );
}

function normalizeStatus(items, t) {
  return items.map((item) => ({
    name: translateReportKey(
      t,
      "values",
      item.status ?? item.name,
      humanizeStatus(item.status ?? item.name),
    ),
    value: toNumber(item.count ?? item.value),
  }));
}

function normalizeCurrency(items, t) {
  return items.map((item) => ({
    name: item.currency || translateOrFallback(t, "reports.values.unspecified", "Unspecified"),
    count: toNumber(item.count),
    value: toNumber(
      item.total_value ?? item.total_contract_value ?? item.total_gross,
    ),
    paid: toNumber(item.total_paid ?? item.total_net),
    net: toNumber(item.total_net),
    gross: toNumber(item.total_gross),
    tax: toNumber(item.total_tax),
    deductions: toNumber(item.total_deductions),
  }));
}

function StatusPie({ data, t }) {
  const chartData = normalizeStatus(data, t).filter((item) => item.value > 0);

  if (chartData.length === 0) return <EmptyChart />;

  return (
    <ResponsiveContainer width="100%" height="100%">
      <PieChart>
        <Pie
          data={chartData}
          dataKey="value"
          nameKey="name"
          innerRadius={62}
          outerRadius={104}
          paddingAngle={2}
        >
          {chartData.map((entry, index) => (
            <Cell key={entry.name} fill={COLORS[index % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip
          contentStyle={tooltipStyle}
          formatter={(value) => formatValue(value)}
        />
        <Legend iconType="circle" wrapperStyle={{ fontSize: 12 }} />
      </PieChart>
    </ResponsiveContainer>
  );
}

function ProjectVisuals({ data, rows, t }) {
  const status = getArrayData(data, "status_breakdown");
  const projectSpend = [...rows]
    .map((row) => ({
      name: row.name,
      budget: toNumber(row.estimated_budget),
      spentUsd: toNumber(row.total_spent_usd ?? row.total_expense_usd),
      spentAfn: toNumber(row.total_spent_afn),
      expenses: toNumber(row.expense_count),
    }))
    .sort((a, b) => b.spentUsd + b.spentAfn - (a.spentUsd + a.spentAfn))
    .slice(0, 8);

  return (
    <div className="grid gap-5 xl:grid-cols-[minmax(0,1.5fr)_minmax(320px,0.9fr)]">
      <ChartFrame
        title={chartText(t, "projectSpendProfile", "Project Spend Profile")}
        subtitle={chartText(t, "projectSpendSubtitle", "Top projects by recorded USD and AFN spend")}
      >
        {projectSpend.length ? (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={projectSpend}>
              <CartesianGrid stroke={gridStroke} vertical={false} />
              <XAxis dataKey="name" tick={axisStyle} height={52} />
              <YAxis tick={axisStyle} />
              <Tooltip
                contentStyle={tooltipStyle}
                formatter={(value, name) => [
                  formatValue(value),
                  formatLabel(name),
                ]}
              />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Bar dataKey="budget" name={legendText(t, "budget", "Budget")} fill={COLORS[0]} radius={4} />
              <Bar
                dataKey="spentUsd"
                name={legendText(t, "spentUsd", "Spent USD")}
                fill={COLORS[1]}
                radius={4}
              />
              <Bar
                dataKey="spentAfn"
                name={legendText(t, "spentAfn", "Spent AFN")}
                fill={COLORS[2]}
                radius={4}
              />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <EmptyChart />
        )}
      </ChartFrame>

      <ChartFrame
        title={chartText(t, "projectStatusMix", "Project Status Mix")}
        subtitle={chartText(t, "countByStatus", "Count by current status")}
      >
        <StatusPie data={status} t={t} />
      </ChartFrame>
    </div>
  );
}

function ExpenseVisuals({ data, t }) {
  const monthly = getArrayData(data, "monthly_trend").map((item) => ({
    month: item.month
      ? new Date(item.month).toLocaleDateString(undefined, {
          month: "short",
          year: "2-digit",
        })
      : translateOrFallback(t, "reports.values.unknown", "Unknown"),
    usd: toNumber(item.total_usd),
    afn: toNumber(item.total_afn),
    records: toNumber(item.count),
  }));

  const types = getArrayData(data, "type_breakdown").map((item) => ({
    name: translateReportKey(t, "values", item.expense_type, formatLabel(item.expense_type)),
    usd: toNumber(item.total_usd),
    afn: toNumber(item.total_afn),
    records: toNumber(item.count),
  }));

  return (
    <div className="grid gap-5 xl:grid-cols-[minmax(0,1.45fr)_minmax(340px,1fr)]">
      <ChartFrame
        title={chartText(t, "monthlyExpenseTrend", "Monthly Expense Trend")}
        subtitle={chartText(t, "monthlyExpenseSubtitle", "AFN, USD, and record volume by month")}
      >
        {monthly.length ? (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={monthly}>
              <CartesianGrid stroke={gridStroke} vertical={false} />
              <XAxis dataKey="month" tick={axisStyle} />
              <YAxis tick={axisStyle} />
              <Tooltip
                contentStyle={tooltipStyle}
                formatter={(value, name) => [
                  formatValue(value),
                  formatLabel(name),
                ]}
              />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Area
                type="monotone"
                dataKey="usd"
                name="USD"
                stroke={COLORS[0]}
                fill={COLORS[0]}
                fillOpacity={0.18}
              />
              <Area
                type="monotone"
                dataKey="afn"
                name="AFN"
                stroke={COLORS[1]}
                fill={COLORS[1]}
                fillOpacity={0.16}
              />
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <EmptyChart />
        )}
      </ChartFrame>

      <ChartFrame
        title={chartText(t, "expenseCategories", "Expense Categories")}
        subtitle={chartText(t, "expenseCategoriesSubtitle", "Spend by expense type")}
      >
        {types.length ? (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={types} layout="vertical" margin={{ left: 18 }}>
              <CartesianGrid stroke={gridStroke} horizontal={false} />
              <XAxis type="number" tick={axisStyle} />
              <YAxis
                type="category"
                dataKey="name"
                tick={axisStyle}
                width={110}
              />
              <Tooltip
                contentStyle={tooltipStyle}
                formatter={(value, name) => [
                  formatValue(value),
                  formatLabel(name),
                ]}
              />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Bar dataKey="usd" name="USD" fill={COLORS[0]} radius={4} />
              <Bar dataKey="afn" name="AFN" fill={COLORS[2]} radius={4} />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <EmptyChart />
        )}
      </ChartFrame>
    </div>
  );
}

function PayrollVisuals({ data, rows, t }) {
  const currency = normalizeCurrency(getArrayData(data, "by_currency"), t);
  const source = getArrayData(data, "by_source").map((item) => ({
    name: translateReportKey(
      t,
      "values",
      item.source_type,
      item.source_type || translateOrFallback(t, "reports.values.unknown", "Unknown"),
    ),
    count: toNumber(item.count),
    gross: toNumber(item.total_gross),
    net: toNumber(item.total_net),
    advances: toNumber(item.total_advances),
    deductions: toNumber(item.total_deductions),
    tax: toNumber(item.total_tax),
  }));
  const topPayroll = [...rows]
    .map((row) => ({
      name: `${row.employee} (${row.source_type})`,
      net: toNumber(row.net_pay),
      gross: toNumber(row.gross_pay),
      deductions: toNumber(row.deductions),
    }))
    .sort((a, b) => b.net - a.net)
    .slice(0, 8);

  return (
    <div className="grid gap-5 xl:grid-cols-2">
      <ChartFrame
        title={chartText(t, "payrollByWorkforce", "Payroll by Workforce Type")}
        subtitle={chartText(t, "payrollByWorkforceSubtitle", "Employee payroll versus daily worker payroll")}
      >
        {source.length ? (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={source}>
              <CartesianGrid stroke={gridStroke} vertical={false} />
              <XAxis dataKey="name" tick={axisStyle} />
              <YAxis tick={axisStyle} />
              <Tooltip
                contentStyle={tooltipStyle}
                formatter={(value, name) => [
                  formatValue(value),
                  formatLabel(name),
                ]}
              />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Bar dataKey="gross" name={legendText(t, "gross", "Gross")} fill={COLORS[0]} radius={4} />
              <Bar dataKey="net" name={legendText(t, "net", "Net")} fill={COLORS[1]} radius={4} />
              <Bar dataKey="advances" name={legendText(t, "advances", "Advances")} fill={COLORS[2]} radius={4} />
              <Bar dataKey="deductions" name={legendText(t, "deductions", "Deductions")} fill={COLORS[5]} radius={4} />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <EmptyChart />
        )}
      </ChartFrame>

      <ChartFrame
        title={chartText(t, "payrollByCurrency", "Payroll by Currency")}
        subtitle={chartText(t, "payrollByCurrencySubtitle", "Gross, net, tax, and deductions")}
      >
        {currency.length ? (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={currency}>
              <CartesianGrid stroke={gridStroke} vertical={false} />
              <XAxis dataKey="name" tick={axisStyle} />
              <YAxis tick={axisStyle} />
              <Tooltip
                contentStyle={tooltipStyle}
                formatter={(value, name) => [
                  formatValue(value),
                  formatLabel(name),
                ]}
              />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Bar dataKey="gross" name={legendText(t, "gross", "Gross")} fill={COLORS[0]} radius={4} />
              <Bar dataKey="net" name={legendText(t, "net", "Net")} fill={COLORS[1]} radius={4} />
              <Bar dataKey="deductions" name={legendText(t, "deductions", "Deductions")} fill={COLORS[2]} radius={4} />
              <Bar dataKey="tax" name={legendText(t, "tax", "Tax")} fill={COLORS[5]} radius={4} />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <EmptyChart />
        )}
      </ChartFrame>

      <ChartFrame
        title={chartText(t, "topNetPayroll", "Top Net Payroll")}
        subtitle={chartText(t, "topNetPayrollSubtitle", "Highest net payroll rows")}
      >
        {topPayroll.length ? (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={topPayroll} layout="vertical" margin={{ left: 18 }}>
              <CartesianGrid stroke={gridStroke} horizontal={false} />
              <XAxis type="number" tick={axisStyle} />
              <YAxis
                type="category"
                dataKey="name"
                tick={axisStyle}
                width={110}
              />
              <Tooltip
                contentStyle={tooltipStyle}
                formatter={(value, name) => [
                  formatValue(value),
                  formatLabel(name),
                ]}
              />
              <Bar dataKey="net" name={legendText(t, "net", "Net")} fill={COLORS[1]} radius={4} />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <EmptyChart />
        )}
      </ChartFrame>
    </div>
  );
}

function AttendanceVisuals({ data, t }) {
  const status = getArrayData(data, "status_breakdown");
  const source = getArrayData(data, "by_source").map((item) => ({
    name: translateReportKey(
      t,
      "values",
      item.source_type,
      item.source_type || translateOrFallback(t, "reports.values.unknown", "Unknown"),
    ),
    count: toNumber(item.count),
    present: toNumber(item.present),
    absent: toNumber(item.absent),
    halfDay: toNumber(item.half_day),
    leave: toNumber(item.leave),
    overtime: toNumber(item.overtime),
    overtimeHours: toNumber(item.total_overtime),
  }));
  const employees = getArrayData(data, "per_employee")
    .map((item) => ({
      name: item.name ||
        `${item.employee__first_name || ""} ${
          item.employee__last_name || ""
        }`.trim() || "Employee",
      source: item.source_type || "Employee",
      present: toNumber(item.present),
      absent: toNumber(item.absent),
      halfDay: toNumber(item.half_day),
      leave: toNumber(item.leave),
      overtime: toNumber(item.total_overtime),
    }))
    .sort((a, b) => b.overtime + b.present - (a.overtime + a.present))
    .slice(0, 8);

  return (
    <div className="grid gap-5 xl:grid-cols-[minmax(320px,0.9fr)_minmax(0,1.4fr)]">
      <ChartFrame
        title={chartText(t, "attendanceStatus", "Attendance Status")}
        subtitle={chartText(t, "presenceMix", "Presence mix")}
      >
        <StatusPie data={status} t={t} />
      </ChartFrame>

      <ChartFrame
        title={chartText(t, "attendanceByWorkforce", "Attendance by Workforce Type")}
        subtitle={chartText(t, "attendanceByWorkforceSubtitle", "Employee attendance versus daily worker attendance")}
      >
        {source.length ? (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={source}>
              <CartesianGrid stroke={gridStroke} vertical={false} />
              <XAxis dataKey="name" tick={axisStyle} />
              <YAxis tick={axisStyle} />
              <Tooltip
                contentStyle={tooltipStyle}
                formatter={(value, name) => [
                  formatValue(value),
                  formatLabel(name),
                ]}
              />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Bar dataKey="present" name={legendText(t, "present", "Present")} fill={COLORS[1]} radius={4} />
              <Bar dataKey="absent" name={legendText(t, "absent", "Absent")} fill={COLORS[5]} radius={4} />
              <Bar dataKey="halfDay" name={legendText(t, "halfDay", "Half Day")} fill={COLORS[2]} radius={4} />
              <Bar dataKey="leave" name={legendText(t, "leave", "Leave")} fill={COLORS[3]} radius={4} />
              <Bar dataKey="overtime" name={legendText(t, "overtime", "Overtime")} fill={COLORS[0]} radius={4} />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <EmptyChart />
        )}
      </ChartFrame>

      <ChartFrame
        title={chartText(t, "employeeAttendanceDetail", "Employee Attendance Detail")}
        subtitle={chartText(t, "employeeAttendanceDetailSubtitle", "Presence, absences, leave, and overtime")}
        className="xl:col-span-2"
      >
        {employees.length ? (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={employees}>
              <CartesianGrid stroke={gridStroke} vertical={false} />
              <XAxis dataKey="name" tick={axisStyle} height={52} />
              <YAxis tick={axisStyle} />
              <Tooltip
                contentStyle={tooltipStyle}
                formatter={(value, name) => [
                  formatValue(value),
                  formatLabel(name),
                ]}
              />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Bar dataKey="present" name={legendText(t, "present", "Present")} fill={COLORS[1]} radius={4} />
              <Bar dataKey="absent" name={legendText(t, "absent", "Absent")} fill={COLORS[5]} radius={4} />
              <Bar dataKey="leave" name={legendText(t, "leave", "Leave")} fill={COLORS[2]} radius={4} />
              <Bar dataKey="overtime" name={legendText(t, "overtime", "Overtime")} fill={COLORS[0]} radius={4} />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <EmptyChart />
        )}
      </ChartFrame>
    </div>
  );
}

function EmployeeVisuals({ data, t }) {
  const departments = getArrayData(data, "department_breakdown").map((item) => ({
    name: translateReportKey(t, "values", item.department, formatLabel(item.department)),
    employees: toNumber(item.count),
    salary: toNumber(item.total_salary),
    average: toNumber(item.avg_salary),
  }));

  const activeData = [
    { name: translateOrFallback(t, "reports.values.active", "Active"), value: toNumber(data?.summary?.active_count) },
    { name: translateOrFallback(t, "reports.values.inactive", "Inactive"), value: toNumber(data?.summary?.inactive_count) },
  ].filter((item) => item.value > 0);

  return (
    <div className="grid gap-5 xl:grid-cols-[minmax(0,1.45fr)_minmax(320px,0.9fr)]">
      <ChartFrame
        title={chartText(t, "departmentWorkforce", "Department Workforce")}
        subtitle={chartText(t, "departmentWorkforceSubtitle", "Headcount and salary concentration")}
      >
        {departments.length ? (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={departments}>
              <CartesianGrid stroke={gridStroke} vertical={false} />
              <XAxis dataKey="name" tick={axisStyle} height={52} />
              <YAxis tick={axisStyle} />
              <Tooltip
                contentStyle={tooltipStyle}
                formatter={(value, name) => [
                  formatValue(value),
                  formatLabel(name),
                ]}
              />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Bar dataKey="employees" name={legendText(t, "employees", "Employees")} fill={COLORS[0]} radius={4} />
              <Bar dataKey="salary" name={legendText(t, "salary", "Salary")} fill={COLORS[1]} radius={4} />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <EmptyChart />
        )}
      </ChartFrame>

      <ChartFrame
        title={chartText(t, "employmentStatus", "Employment Status")}
        subtitle={chartText(t, "activeVsInactive", "Active vs inactive")}
      >
        <StatusPie data={activeData} t={t} />
      </ChartFrame>
    </div>
  );
}

function ContractVisuals({ data, rows, t }) {
  const currency = normalizeCurrency(getArrayData(data, "by_currency"), t);
  const status = getArrayData(data, "status_breakdown");
  const progress = [...rows]
    .map((row) => ({
      name: row.contract_number || row.title,
      value: toNumber(row.contract_value),
      paid: toNumber(row.total_paid),
      remaining: toNumber(row.remaining_amount),
      progress: toNumber(row.completion_percentage),
    }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 8);

  return (
    <div className="grid gap-5 xl:grid-cols-2">
      <ChartFrame
        title={chartText(t, "contractCurrencyExposure", "Contract Currency Exposure")}
        subtitle={chartText(t, "contractCurrencySubtitle", "Contract value versus paid amount")}
      >
        {currency.length ? (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={currency}>
              <CartesianGrid stroke={gridStroke} vertical={false} />
              <XAxis dataKey="name" tick={axisStyle} />
              <YAxis tick={axisStyle} />
              <Tooltip
                contentStyle={tooltipStyle}
                formatter={(value, name) => [
                  formatValue(value),
                  formatLabel(name),
                ]}
              />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Bar dataKey="value" name={legendText(t, "value", "Value")} fill={COLORS[0]} radius={4} />
              <Bar dataKey="paid" name={legendText(t, "paid", "Paid")} fill={COLORS[1]} radius={4} />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <EmptyChart />
        )}
      </ChartFrame>

      <ChartFrame
        title={chartText(t, "contractStatus", "Contract Status")}
        subtitle={chartText(t, "countByContractStatus", "Count by contract status")}
      >
        <StatusPie data={status} t={t} />
      </ChartFrame>

      <ChartFrame
        title={chartText(t, "largestContracts", "Largest Contracts")}
        subtitle={chartText(t, "largestContractsSubtitle", "Value, paid amount, and remaining balance")}
        className="xl:col-span-2"
      >
        {progress.length ? (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={progress}>
              <CartesianGrid stroke={gridStroke} vertical={false} />
              <XAxis dataKey="name" tick={axisStyle} />
              <YAxis tick={axisStyle} />
              <Tooltip
                contentStyle={tooltipStyle}
                formatter={(value, name) => [
                  formatValue(value),
                  formatLabel(name),
                ]}
              />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Bar dataKey="value" name={legendText(t, "value", "Value")} fill={COLORS[0]} radius={4} />
              <Bar dataKey="paid" name={legendText(t, "paid", "Paid")} fill={COLORS[1]} radius={4} />
              <Bar dataKey="remaining" name={legendText(t, "remaining", "Remaining")} fill={COLORS[2]} radius={4} />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <EmptyChart />
        )}
      </ChartFrame>
    </div>
  );
}

function FinancialVisuals({ data, t }) {
  const summary = data?.summary || {};
  const costMix = getArrayData(data, "cost_mix_by_currency");
  const payrollSource = getArrayData(data, "payroll_by_source").map((item) => ({
    name: translateReportKey(t, "values", item.source_type, item.source_type),
    netUsd: toNumber(item.net_usd),
    netAfn: toNumber(item.net_afn),
    grossUsd: toNumber(item.gross_usd),
    grossAfn: toNumber(item.gross_afn),
    records: toNumber(item.count),
  }));
  const contracts = getArrayData(data, "contracts").map((item) => ({
    name: item.currency,
    value: toNumber(item.adjusted_value),
    paid: toNumber(item.paid),
    remaining: toNumber(item.remaining),
    variation: toNumber(item.variation),
    count: toNumber(item.count),
  }));
  const monthly = getArrayData(data, "monthly_trend").map((item) => ({
    month: item.month
      ? new Date(item.month).toLocaleDateString(undefined, {
          month: "short",
          year: "2-digit",
        })
      : translateOrFallback(t, "reports.values.unknown", "Unknown"),
    expensesUsd: toNumber(item.expenses_usd),
    expensesAfn: toNumber(item.expenses_afn),
    employeePayroll: toNumber(item.employee_payroll),
    workerPayroll: toNumber(item.worker_payroll),
    contractPayments: toNumber(item.contract_payments),
  }));
  const projects = getArrayData(data, "rows").slice(0, 8).map((row) => ({
    name: row.project,
    usd: toNumber(row.total_cost_usd),
    afn: toNumber(row.total_cost_afn),
    budget: toNumber(row.budget),
    workerUsd: toNumber(row.worker_payroll_usd),
    workerAfn: toNumber(row.worker_payroll_afn),
  }));

  const cards = [
    { label: translateReportKey(t, "metrics", "operating_cost_usd", "Operating Cost USD"), value: formatMoney(summary.operating_cost_usd, "USD") },
    { label: translateReportKey(t, "metrics", "operating_cost_afn", "Operating Cost AFN"), value: formatMoney(summary.operating_cost_afn, "AFN") },
    { label: translateReportKey(t, "metrics", "contract_value_usd", "Contract Value USD"), value: formatMoney(summary.contract_value_usd, "USD") },
    { label: translateReportKey(t, "metrics", "contract_value_afn", "Contract Value AFN"), value: formatMoney(summary.contract_value_afn, "AFN") },
    { label: translateReportKey(t, "metrics", "expenses_usd", "Expenses USD Eq."), value: formatMoney(summary.expenses_usd, "USD") },
    { label: translateReportKey(t, "metrics", "expenses_afn", "Expenses AFN Eq."), value: formatMoney(summary.expenses_afn, "AFN") },
    { label: translateReportKey(t, "metrics", "payroll_net_usd", "Payroll Net USD"), value: formatMoney(summary.payroll_net_usd, "USD") },
    { label: translateReportKey(t, "metrics", "payroll_net_afn", "Payroll Net AFN"), value: formatMoney(summary.payroll_net_afn, "AFN") },
  ];

  return (
    <div className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map((card) => (
          <div
            key={card.label}
            className="relative overflow-hidden rounded-lg bg-card p-5 shadow-sm shadow-black/5"
          >
            <div className="absolute inset-x-0 top-0 h-1 bg-[var(--primary)]" />
            <p className="text-xs font-semibold text-muted uppercase tracking-wide">
              {card.label}
            </p>
            <p className="mt-2 text-2xl font-semibold text-text">
              {card.value}
            </p>
          </div>
        ))}
      </div>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1.35fr)_minmax(340px,0.9fr)]">
        <ChartFrame
          title={chartText(t, "operatingCostMix", "Operating Cost Mix")}
          subtitle={chartText(t, "operatingCostMixSubtitle", "Expenses, payroll, and contract payments by currency")}
        >
          {costMix.length ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={costMix}>
                <CartesianGrid stroke={gridStroke} vertical={false} />
                <XAxis dataKey="currency" tick={axisStyle} />
                <YAxis tick={axisStyle} />
                <Tooltip
                  contentStyle={tooltipStyle}
                  formatter={(value, name) => [
                    formatValue(value),
                    formatLabel(name),
                  ]}
                />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Bar dataKey="expenses" name={legendText(t, "expenses", "Expenses")} fill={COLORS[0]} radius={4} />
                <Bar dataKey="employee_payroll" name={legendText(t, "employeePayroll", "Employee Payroll")} fill={COLORS[1]} radius={4} />
                <Bar dataKey="worker_payroll" name={legendText(t, "workerPayroll", "Worker Payroll")} fill={COLORS[2]} radius={4} />
                <Bar dataKey="contract_paid" name={legendText(t, "contractPaid", "Contract Paid")} fill={COLORS[3]} radius={4} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <EmptyChart />
          )}
        </ChartFrame>

        <ChartFrame
          title={chartText(t, "financialRecords", "Financial Records")}
          subtitle={chartText(t, "financialRecordsSubtitle", "Volume behind the overview")}
        >
          <div className="grid h-full grid-cols-2 gap-3 content-center">
            {[
              [translateReportKey(t, "metrics", "total_projects", "Projects"), summary.total_projects],
              [translateReportKey(t, "metrics", "expense_records", "Expenses"), summary.expense_records],
              [translateReportKey(t, "metrics", "employee_payroll_records", "Employee Payroll"), summary.employee_payroll_records],
              [translateReportKey(t, "metrics", "daily_worker_payroll_records", "Worker Payroll"), summary.daily_worker_payroll_records],
              [translateReportKey(t, "metrics", "contract_count", "Contracts"), summary.contract_count],
              [translateReportKey(t, "metrics", "budget_usd", "Budget USD"), summary.budget_usd],
              [translateReportKey(t, "metrics", "budget_afn", "Budget AFN"), summary.budget_afn],
              [translateReportKey(t, "metrics", "contract_paid_usd", "Paid USD"), summary.contract_paid_usd],
            ].map(([label, value]) => (
              <div key={label} className="rounded-lg bg-bg p-4">
                <p className="text-xs text-muted">{label}</p>
                <p className="mt-1 text-lg font-semibold text-text">
                  {formatValue(value)}
                </p>
              </div>
            ))}
          </div>
        </ChartFrame>
      </div>

      <div className="grid gap-5 xl:grid-cols-2">
        <ChartFrame
          title={chartText(t, "monthlyFinancialMovement", "Monthly Financial Movement")}
          subtitle={chartText(t, "monthlyFinancialMovementSubtitle", "Expenses, payroll, and contract payment movement")}
        >
          {monthly.length ? (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={monthly}>
                <CartesianGrid stroke={gridStroke} vertical={false} />
                <XAxis dataKey="month" tick={axisStyle} />
                <YAxis tick={axisStyle} />
                <Tooltip
                  contentStyle={tooltipStyle}
                  formatter={(value, name) => [
                    formatValue(value),
                    formatLabel(name),
                  ]}
                />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Area
                  type="monotone"
                dataKey="expensesUsd"
                  name={translateReportKey(t, "metrics", "expenses_usd", "Expenses USD Eq.")}
                  stroke={COLORS[0]}
                  fill={COLORS[0]}
                  fillOpacity={0.16}
                />
                <Area
                  type="monotone"
                  dataKey="expensesAfn"
                  name={translateReportKey(t, "metrics", "expenses_afn", "Expenses AFN Eq.")}
                  stroke={COLORS[1]}
                  fill={COLORS[1]}
                  fillOpacity={0.14}
                />
                <Area
                  type="monotone"
                  dataKey="workerPayroll"
                  name={translateReportKey(t, "metrics", "daily_worker_payroll_records", "Worker Payroll")}
                  stroke={COLORS[2]}
                  fill={COLORS[2]}
                  fillOpacity={0.12}
                />
                <Area
                  type="monotone"
                  dataKey="contractPayments"
                  name={legendText(t, "contractPayments", "Contract Payments")}
                  stroke={COLORS[3]}
                  fill={COLORS[3]}
                  fillOpacity={0.1}
                />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <EmptyChart />
          )}
        </ChartFrame>

        <ChartFrame
          title={chartText(t, "payrollSourceSplit", "Payroll Source Split")}
          subtitle={chartText(t, "payrollSourceSplitSubtitle", "Employee payroll versus daily worker payroll")}
        >
          {payrollSource.length ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={payrollSource}>
                <CartesianGrid stroke={gridStroke} vertical={false} />
                <XAxis dataKey="name" tick={axisStyle} />
                <YAxis tick={axisStyle} />
                <Tooltip
                  contentStyle={tooltipStyle}
                  formatter={(value, name) => [
                    formatValue(value),
                    formatLabel(name),
                  ]}
                />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Bar dataKey="netUsd" name={translateReportKey(t, "metrics", "payroll_net_usd", "Net USD")} fill={COLORS[0]} radius={4} />
                <Bar dataKey="netAfn" name={translateReportKey(t, "metrics", "payroll_net_afn", "Net AFN")} fill={COLORS[1]} radius={4} />
                <Bar dataKey="grossUsd" name={legendText(t, "gross", "Gross USD")} fill={COLORS[2]} radius={4} />
                <Bar dataKey="grossAfn" name={legendText(t, "gross", "Gross AFN")} fill={COLORS[3]} radius={4} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <EmptyChart />
          )}
        </ChartFrame>
      </div>

      <div className="grid gap-5 xl:grid-cols-[minmax(340px,0.9fr)_minmax(0,1.35fr)]">
        <ChartFrame
          title={chartText(t, "contractExposure", "Contract Exposure")}
          subtitle={chartText(t, "contractExposureSubtitle", "Adjusted value, paid amount, remaining balance, and variations")}
        >
          {contracts.length ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={contracts}>
                <CartesianGrid stroke={gridStroke} vertical={false} />
                <XAxis dataKey="name" tick={axisStyle} />
                <YAxis tick={axisStyle} />
                <Tooltip
                  contentStyle={tooltipStyle}
                  formatter={(value, name) => [
                    formatValue(value),
                    formatLabel(name),
                  ]}
                />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Bar dataKey="value" name={legendText(t, "value", "Value")} fill={COLORS[0]} radius={4} />
                <Bar dataKey="paid" name={legendText(t, "paid", "Paid")} fill={COLORS[1]} radius={4} />
                <Bar dataKey="remaining" name={legendText(t, "remaining", "Remaining")} fill={COLORS[2]} radius={4} />
                <Bar dataKey="variation" name={legendText(t, "variation", "Variation")} fill={COLORS[3]} radius={4} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <EmptyChart />
          )}
        </ChartFrame>

        <ChartFrame
          title={chartText(t, "projectCostRanking", "Project Cost Ranking")}
          subtitle={chartText(t, "projectCostRankingSubtitle", "Top projects by total cost exposure")}
        >
          {projects.length ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={projects} layout="vertical" margin={{ left: 20 }}>
                <CartesianGrid stroke={gridStroke} horizontal={false} />
                <XAxis type="number" tick={axisStyle} />
                <YAxis
                  type="category"
                  dataKey="name"
                  tick={axisStyle}
                  width={120}
                />
                <Tooltip
                  contentStyle={tooltipStyle}
                  formatter={(value, name) => [
                    formatValue(value),
                    formatLabel(name),
                  ]}
                />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Bar dataKey="usd" name={translateReportKey(t, "metrics", "total_usd", "Total USD")} fill={COLORS[0]} radius={4} />
                <Bar dataKey="afn" name={translateReportKey(t, "metrics", "total_afn", "Total AFN")} fill={COLORS[1]} radius={4} />
                <Bar dataKey="workerAfn" name={translateReportKey(t, "columns", "worker_payroll_afn", "Worker AFN")} fill={COLORS[2]} radius={4} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <EmptyChart />
          )}
        </ChartFrame>
      </div>
    </div>
  );
}

export default function ReportVisuals({ reportKey, data, rows }) {
  const { t } = useLanguage();
  if (!data) return null;

  switch (reportKey) {
    case "projects":
      return <ProjectVisuals data={data} rows={rows} t={t} />;
    case "expenses":
      return <ExpenseVisuals data={data} t={t} />;
    case "payroll":
      return <PayrollVisuals data={data} rows={rows} t={t} />;
    case "attendance":
      return <AttendanceVisuals data={data} t={t} />;
    case "employees":
      return <EmployeeVisuals data={data} t={t} />;
    case "contracts":
      return <ContractVisuals data={data} rows={rows} t={t} />;
    case "financial":
      return <FinancialVisuals data={data} t={t} />;
    default:
      return null;
  }
}

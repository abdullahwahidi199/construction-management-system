import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
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

const CHART_COLORS = {
  contract: "#16a34a",
  contractDark: "#15803d",
  expense: "#ea580c",
  expenseDark: "#dc2626",
  balance: "#0f766e",
  primary: "#2563eb",
  warning: "#d97706",
  neutral: "#64748b",
  slate: "#475569",
};

const COLORS = [
  CHART_COLORS.primary,
  CHART_COLORS.contract,
  CHART_COLORS.expense,
  CHART_COLORS.balance,
  CHART_COLORS.warning,
  CHART_COLORS.expenseDark,
  CHART_COLORS.neutral,
];

const DONUT_COLORS = [
  CHART_COLORS.expense,
  CHART_COLORS.expenseDark,
  CHART_COLORS.warning,
  CHART_COLORS.slate,
  CHART_COLORS.primary,
];

const axisStyle = {
  fontSize: 11,
  fill: "var(--muted)",
};

const tooltipStyle = {
  background: "var(--card)",
  border: "1px solid color-mix(in srgb, var(--border) 70%, transparent)",
  borderRadius: 6,
  color: "var(--text)",
  boxShadow: "0 16px 34px rgba(15,23,42,0.12)",
  fontSize: 12,
};

const tooltipLabelStyle = {
  color: "var(--text)",
  fontWeight: 600,
};

const tooltipItemStyle = {
  color: "var(--muted)",
};

const gridStroke = "color-mix(in srgb, var(--border) 48%, transparent)";
const cursorFill = "color-mix(in srgb, var(--primary) 7%, transparent)";
const chartMargin = { top: 12, right: 18, bottom: 4, left: 0 };
const verticalChartMargin = { top: 12, right: 18, bottom: 4, left: 12 };
const legendStyle = {
  color: "var(--muted)",
  fontSize: 12,
  paddingTop: 8,
};
const lineDot = {
  r: 3,
  strokeWidth: 2,
  fill: "var(--card)",
};
const activeLineDot = { r: 5, strokeWidth: 0 };

const chartText = (t, key, fallback, params) =>
  translateOrFallback(t, `reports.charts.${key}`, fallback, params);

const legendText = (t, key, fallback) =>
  translateOrFallback(t, `reports.legends.${key}`, fallback);

function ChartFrame({ title, subtitle, children, className = "" }) {
  return (
    <section
      className={`min-w-0 overflow-hidden rounded-md border border-[color:color-mix(in_srgb,var(--border)_72%,transparent)] bg-card ${className}`}
    >
      <div className="flex items-start justify-between gap-4 px-4 py-4 sm:px-5">
        <div className="min-w-0">
          <h3 className="truncate text-sm font-semibold text-text">{title}</h3>
          {subtitle && <p className="mt-1 text-xs leading-5 text-muted">{subtitle}</p>}
        </div>
        <span
          className="mt-1 h-2 w-2 shrink-0 rounded-full bg-[var(--primary)]"
          aria-hidden="true"
        />
      </div>
      <div className="h-[19rem] min-w-0 px-2 pb-4 sm:h-80 sm:px-4">
        {children}
      </div>
    </section>
  );
}

function EmptyChart({ label }) {
  const { t } = useLanguage();
  return (
    <div className="flex h-full items-center justify-center rounded-md border border-dashed border-[color:color-mix(in_srgb,var(--border)_75%,transparent)] bg-bg/40 px-4 text-center">
      <p className="max-w-56 text-sm leading-6 text-muted">
        {label || translateOrFallback(t, "reports.states.noChartData", "No chart data available")}
      </p>
    </div>
  );
}

function ChartTooltip(props) {
  return (
    <Tooltip
      contentStyle={tooltipStyle}
      cursor={{ fill: cursorFill }}
      itemStyle={tooltipItemStyle}
      labelStyle={tooltipLabelStyle}
      {...props}
    />
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
      <PieChart margin={{ top: 8, right: 8, bottom: 8, left: 8 }}>
        <Pie
          data={chartData}
          dataKey="value"
          nameKey="name"
          innerRadius="58%"
          outerRadius="78%"
          paddingAngle={3}
          stroke="var(--card)"
          strokeWidth={3}
        >
          {chartData.map((entry, index) => (
            <Cell key={entry.name} fill={COLORS[index % COLORS.length]} />
          ))}
        </Pie>
        <ChartTooltip formatter={(value) => formatValue(value)} />
        <Legend iconType="circle" wrapperStyle={legendStyle} />
      </PieChart>
    </ResponsiveContainer>
  );
}

function CategoryDonutSet({ groups }) {
  const activeGroups = groups
    .map((group) => ({
      ...group,
      data: group.data.filter((item) => item.value > 0).slice(0, 6),
    }))
    .filter((group) => group.data.length > 0);

  if (activeGroups.length === 0) return <EmptyChart />;

  return (
    <div
      className={`grid h-full min-h-0 gap-4 ${
        activeGroups.length > 1 ? "sm:grid-cols-2" : ""
      }`}
    >
      {activeGroups.map((group) => (
        <div key={group.label} className="flex min-h-0 flex-col">
          <p className="px-1 text-xs font-semibold uppercase tracking-wide text-muted">
            {group.label}
          </p>
          <div className="min-h-0 flex-1">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart margin={{ top: 4, right: 4, bottom: 4, left: 4 }}>
                <Pie
                  data={group.data}
                  dataKey="value"
                  nameKey="name"
                  innerRadius="56%"
                  outerRadius="76%"
                  paddingAngle={3}
                  stroke="var(--card)"
                  strokeWidth={3}
                >
                  {group.data.map((entry, index) => (
                    <Cell
                      key={`${group.label}-${entry.name}`}
                      fill={DONUT_COLORS[index % DONUT_COLORS.length]}
                    />
                  ))}
                </Pie>
                <ChartTooltip
                  formatter={(value, name) => [formatValue(value), name]}
                />
                <Legend iconType="circle" wrapperStyle={legendStyle} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      ))}
    </div>
  );
}

function ProgressComparison({ items, t, accent = CHART_COLORS.primary }) {
  const rows = items.filter((item) => item.name).slice(0, 6);

  if (rows.length === 0) return <EmptyChart />;

  return (
    <div className="h-full overflow-y-auto pr-1 mobile-scrollbar">
      <div className="space-y-4 py-1">
        {rows.map((item) => {
          const progress = Math.max(0, Math.min(toNumber(item.progress), 100));
          const valueLabel = legendText(t, "value", "Value");
          const paidLabel = legendText(t, "paid", "Paid");
          const remainingLabel = legendText(t, "remaining", "Remaining");

          return (
            <div key={item.name} className="min-w-0">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-text">
                    {item.name}
                  </p>
                  <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted">
                    <span>{valueLabel}: {formatValue(item.value)}</span>
                    <span>{paidLabel}: {formatValue(item.paid)}</span>
                    <span>{remainingLabel}: {formatValue(item.remaining)}</span>
                  </div>
                </div>
                <p className="shrink-0 text-sm font-semibold text-text">
                  {formatValue(progress, { maximumFractionDigits: 0 })}%
                </p>
              </div>
              <div className="mt-2 h-2 overflow-hidden rounded-full bg-hover">
                <div
                  className="h-full rounded-full"
                  style={{ width: `${progress}%`, background: accent }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
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
            <BarChart data={projectSpend} margin={chartMargin} barGap={6}>
              <CartesianGrid stroke={gridStroke} strokeDasharray="3 5" vertical={false} />
              <XAxis
                dataKey="name"
                tick={axisStyle}
                height={52}
                axisLine={false}
                tickLine={false}
              />
              <YAxis tick={axisStyle} axisLine={false} tickLine={false} width={48} />
              <ChartTooltip
                formatter={(value, name) => [
                  formatValue(value),
                  formatLabel(name),
                ]}
              />
              <Legend wrapperStyle={legendStyle} />
              <Bar
                dataKey="budget"
                name={legendText(t, "budget", "Budget")}
                fill={CHART_COLORS.primary}
                radius={3}
                barSize={12}
                maxBarSize={22}
              />
              <Bar
                dataKey="spentUsd"
                name={legendText(t, "spentUsd", "Spent USD")}
                fill={CHART_COLORS.expense}
                radius={3}
                barSize={12}
                maxBarSize={22}
              />
              <Bar
                dataKey="spentAfn"
                name={legendText(t, "spentAfn", "Spent AFN")}
                fill={CHART_COLORS.warning}
                radius={3}
                barSize={12}
                maxBarSize={22}
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
  const categoryGroups = [
    {
      label: "USD",
      data: types.map((item) => ({ name: item.name, value: item.usd })),
    },
    {
      label: "AFN",
      data: types.map((item) => ({ name: item.name, value: item.afn })),
    },
  ];

  return (
    <div className="grid gap-5 xl:grid-cols-[minmax(0,1.45fr)_minmax(340px,1fr)]">
      <ChartFrame
        title={chartText(t, "monthlyExpenseTrend", "Monthly Expense Trend")}
        subtitle={chartText(t, "monthlyExpenseSubtitle", "AFN and USD movement by month")}
      >
        {monthly.length ? (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={monthly} margin={chartMargin}>
              <CartesianGrid stroke={gridStroke} strokeDasharray="3 5" vertical={false} />
              <XAxis
                dataKey="month"
                tick={axisStyle}
                axisLine={false}
                tickLine={false}
              />
              <YAxis tick={axisStyle} axisLine={false} tickLine={false} width={48} />
              <ChartTooltip
                formatter={(value, name) => [
                  formatValue(value),
                  formatLabel(name),
                ]}
              />
              <Legend wrapperStyle={legendStyle} />
              <Line
                type="monotone"
                dataKey="usd"
                name="USD"
                stroke={CHART_COLORS.expense}
                strokeWidth={2.2}
                dot={{ ...lineDot, stroke: CHART_COLORS.expense }}
                activeDot={{ ...activeLineDot, fill: CHART_COLORS.expense }}
              />
              <Line
                type="monotone"
                dataKey="afn"
                name="AFN"
                stroke={CHART_COLORS.warning}
                strokeWidth={2.2}
                dot={{ ...lineDot, stroke: CHART_COLORS.warning }}
                activeDot={{ ...activeLineDot, fill: CHART_COLORS.warning }}
              />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <EmptyChart />
        )}
      </ChartFrame>

      <ChartFrame
        title={chartText(t, "expenseCategories", "Expense Categories")}
        subtitle={chartText(t, "expenseCategoriesSubtitle", "Spend by expense type")}
      >
        <CategoryDonutSet groups={categoryGroups} />
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
    advanceDeductions: toNumber(item.total_advance_deductions),
    cashOutflow: toNumber(item.total_cash_outflow),
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
            <BarChart data={source} margin={chartMargin} barGap={5}>
              <CartesianGrid stroke={gridStroke} strokeDasharray="3 5" vertical={false} />
              <XAxis dataKey="name" tick={axisStyle} axisLine={false} tickLine={false} />
              <YAxis tick={axisStyle} axisLine={false} tickLine={false} width={48} />
              <ChartTooltip
                formatter={(value, name) => [
                  formatValue(value),
                  formatLabel(name),
                ]}
              />
              <Legend wrapperStyle={legendStyle} />
              <Bar dataKey="gross" name={legendText(t, "gross", "Gross")} fill={CHART_COLORS.primary} radius={3} barSize={10} maxBarSize={20} />
              <Bar dataKey="net" name={legendText(t, "net", "Net")} fill={CHART_COLORS.balance} radius={3} barSize={10} maxBarSize={20} />
              <Bar dataKey="advances" name={legendText(t, "advances", "Advances Paid")} fill={CHART_COLORS.warning} radius={3} barSize={10} maxBarSize={20} />
              <Bar dataKey="advanceDeductions" name={legendText(t, "advanceDeductions", "Advance Deductions")} fill={CHART_COLORS.expense} radius={3} barSize={10} maxBarSize={20} />
              <Bar dataKey="cashOutflow" name={legendText(t, "cashOutflow", "Cash Outflow")} fill={CHART_COLORS.expenseDark} radius={3} barSize={10} maxBarSize={20} />
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
            <BarChart data={currency} margin={chartMargin} barGap={6}>
              <CartesianGrid stroke={gridStroke} strokeDasharray="3 5" vertical={false} />
              <XAxis dataKey="name" tick={axisStyle} axisLine={false} tickLine={false} />
              <YAxis tick={axisStyle} axisLine={false} tickLine={false} width={48} />
              <ChartTooltip
                formatter={(value, name) => [
                  formatValue(value),
                  formatLabel(name),
                ]}
              />
              <Legend wrapperStyle={legendStyle} />
              <Bar dataKey="gross" name={legendText(t, "gross", "Gross")} fill={CHART_COLORS.primary} radius={3} barSize={12} maxBarSize={22} />
              <Bar dataKey="net" name={legendText(t, "net", "Net")} fill={CHART_COLORS.balance} radius={3} barSize={12} maxBarSize={22} />
              <Bar dataKey="deductions" name={legendText(t, "deductions", "Deductions")} fill={CHART_COLORS.expense} radius={3} barSize={12} maxBarSize={22} />
              <Bar dataKey="tax" name={legendText(t, "tax", "Tax")} fill={CHART_COLORS.expenseDark} radius={3} barSize={12} maxBarSize={22} />
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
            <BarChart data={topPayroll} layout="vertical" margin={verticalChartMargin}>
              <CartesianGrid stroke={gridStroke} strokeDasharray="3 5" horizontal={false} />
              <XAxis type="number" tick={axisStyle} axisLine={false} tickLine={false} />
              <YAxis
                type="category"
                dataKey="name"
                tick={axisStyle}
                width={110}
                axisLine={false}
                tickLine={false}
              />
              <ChartTooltip
                formatter={(value, name) => [
                  formatValue(value),
                  formatLabel(name),
                ]}
              />
              <Bar dataKey="net" name={legendText(t, "net", "Net")} fill={CHART_COLORS.balance} radius={3} barSize={12} maxBarSize={24} />
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
            <BarChart data={source} margin={chartMargin} barGap={6}>
              <CartesianGrid stroke={gridStroke} strokeDasharray="3 5" vertical={false} />
              <XAxis dataKey="name" tick={axisStyle} axisLine={false} tickLine={false} />
              <YAxis tick={axisStyle} axisLine={false} tickLine={false} width={44} />
              <ChartTooltip
                formatter={(value, name) => [
                  formatValue(value),
                  formatLabel(name),
                ]}
              />
              <Legend wrapperStyle={legendStyle} />
              <Bar dataKey="present" name={legendText(t, "present", "Present")} fill={CHART_COLORS.contract} radius={3} barSize={10} maxBarSize={20} />
              <Bar dataKey="absent" name={legendText(t, "absent", "Absent")} fill={CHART_COLORS.expenseDark} radius={3} barSize={10} maxBarSize={20} />
              <Bar dataKey="halfDay" name={legendText(t, "halfDay", "Half Day")} fill={CHART_COLORS.warning} radius={3} barSize={10} maxBarSize={20} />
              <Bar dataKey="leave" name={legendText(t, "leave", "Leave")} fill={CHART_COLORS.expense} radius={3} barSize={10} maxBarSize={20} />
              <Bar dataKey="overtime" name={legendText(t, "overtime", "Overtime")} fill={CHART_COLORS.primary} radius={3} barSize={10} maxBarSize={20} />
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
            <BarChart data={employees} margin={chartMargin} barGap={5}>
              <CartesianGrid stroke={gridStroke} strokeDasharray="3 5" vertical={false} />
              <XAxis
                dataKey="name"
                tick={axisStyle}
                height={52}
                axisLine={false}
                tickLine={false}
              />
              <YAxis tick={axisStyle} axisLine={false} tickLine={false} width={44} />
              <ChartTooltip
                formatter={(value, name) => [
                  formatValue(value),
                  formatLabel(name),
                ]}
              />
              <Legend wrapperStyle={legendStyle} />
              <Bar dataKey="present" name={legendText(t, "present", "Present")} fill={CHART_COLORS.contract} radius={3} barSize={10} maxBarSize={20} />
              <Bar dataKey="absent" name={legendText(t, "absent", "Absent")} fill={CHART_COLORS.expenseDark} radius={3} barSize={10} maxBarSize={20} />
              <Bar dataKey="leave" name={legendText(t, "leave", "Leave")} fill={CHART_COLORS.warning} radius={3} barSize={10} maxBarSize={20} />
              <Bar dataKey="overtime" name={legendText(t, "overtime", "Overtime")} fill={CHART_COLORS.primary} radius={3} barSize={10} maxBarSize={20} />
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
            <BarChart data={departments} margin={chartMargin} barGap={8}>
              <CartesianGrid stroke={gridStroke} strokeDasharray="3 5" vertical={false} />
              <XAxis
                dataKey="name"
                tick={axisStyle}
                height={52}
                axisLine={false}
                tickLine={false}
              />
              <YAxis tick={axisStyle} axisLine={false} tickLine={false} width={48} />
              <ChartTooltip
                formatter={(value, name) => [
                  formatValue(value),
                  formatLabel(name),
                ]}
              />
              <Legend wrapperStyle={legendStyle} />
              <Bar dataKey="employees" name={legendText(t, "employees", "Employees")} fill={CHART_COLORS.primary} radius={3} barSize={12} maxBarSize={22} />
              <Bar dataKey="salary" name={legendText(t, "salary", "Salary")} fill={CHART_COLORS.contract} radius={3} barSize={12} maxBarSize={22} />
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
            <BarChart data={currency} margin={chartMargin} barGap={8}>
              <CartesianGrid stroke={gridStroke} strokeDasharray="3 5" vertical={false} />
              <XAxis dataKey="name" tick={axisStyle} axisLine={false} tickLine={false} />
              <YAxis tick={axisStyle} axisLine={false} tickLine={false} width={48} />
              <ChartTooltip
                formatter={(value, name) => [
                  formatValue(value),
                  formatLabel(name),
                ]}
              />
              <Legend wrapperStyle={legendStyle} />
              <Bar dataKey="value" name={legendText(t, "value", "Value")} fill={CHART_COLORS.contract} radius={3} barSize={12} maxBarSize={24} />
              <Bar dataKey="paid" name={legendText(t, "paid", "Paid")} fill={CHART_COLORS.primary} radius={3} barSize={12} maxBarSize={24} />
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
        title={chartText(t, "contractProgress", "Contract Completion Progress")}
        subtitle={chartText(t, "contractProgressSubtitle", "Completion percentage with paid and remaining balance")}
      >
        <ProgressComparison items={progress} t={t} accent={CHART_COLORS.balance} />
      </ChartFrame>

      <ChartFrame
        title={chartText(t, "largestContracts", "Largest Contracts")}
        subtitle={chartText(t, "largestContractsSubtitle", "Value, paid amount, and remaining balance")}
      >
        {progress.length ? (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={progress} margin={chartMargin} barGap={6}>
              <CartesianGrid stroke={gridStroke} strokeDasharray="3 5" vertical={false} />
              <XAxis dataKey="name" tick={axisStyle} axisLine={false} tickLine={false} />
              <YAxis tick={axisStyle} axisLine={false} tickLine={false} width={48} />
              <ChartTooltip
                formatter={(value, name) => [
                  formatValue(value),
                  formatLabel(name),
                ]}
              />
              <Legend wrapperStyle={legendStyle} />
              <Bar dataKey="value" name={legendText(t, "value", "Value")} fill={CHART_COLORS.contract} radius={3} barSize={12} maxBarSize={24} />
              <Bar dataKey="paid" name={legendText(t, "paid", "Paid")} fill={CHART_COLORS.primary} radius={3} barSize={12} maxBarSize={24} />
              <Bar dataKey="remaining" name={legendText(t, "remaining", "Remaining")} fill={CHART_COLORS.warning} radius={3} barSize={12} maxBarSize={24} />
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
    advancesUsd: toNumber(item.advances_usd),
    advancesAfn: toNumber(item.advances_afn),
    cashOutflowUsd: toNumber(item.cash_outflow_usd),
    cashOutflowAfn: toNumber(item.cash_outflow_afn),
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
    employeeAdvances: toNumber(item.employee_advances),
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
    { label: translateReportKey(t, "metrics", "operating_cost_usd", "Operating Cost USD"), value: formatMoney(summary.operating_cost_usd, "USD"), tone: "outflow" },
    { label: translateReportKey(t, "metrics", "operating_cost_afn", "Operating Cost AFN"), value: formatMoney(summary.operating_cost_afn, "AFN"), tone: "outflow" },
    { label: translateReportKey(t, "metrics", "contract_value_usd", "Contract Value USD"), value: formatMoney(summary.contract_value_usd, "USD"), tone: "contract" },
    { label: translateReportKey(t, "metrics", "contract_value_afn", "Contract Value AFN"), value: formatMoney(summary.contract_value_afn, "AFN"), tone: "contract" },
    { label: translateReportKey(t, "metrics", "expenses_usd", "Expenses USD Eq."), value: formatMoney(summary.expenses_usd, "USD"), tone: "outflow" },
    { label: translateReportKey(t, "metrics", "expenses_afn", "Expenses AFN Eq."), value: formatMoney(summary.expenses_afn, "AFN"), tone: "outflow" },
    { label: translateReportKey(t, "metrics", "payroll_net_usd", "Payroll Net USD"), value: formatMoney(summary.payroll_net_usd, "USD"), tone: "payroll" },
    { label: translateReportKey(t, "metrics", "payroll_net_afn", "Payroll Net AFN"), value: formatMoney(summary.payroll_net_afn, "AFN"), tone: "payroll" },
    { label: translateReportKey(t, "metrics", "employee_advances_paid_afn", "Employee Advances AFN"), value: formatMoney(summary.employee_advances_paid_afn, "AFN"), tone: "warning" },
    { label: translateReportKey(t, "metrics", "payroll_cash_outflow_afn", "Payroll Cash Outflow AFN"), value: formatMoney(summary.payroll_cash_outflow_afn, "AFN"), tone: "outflow" },
  ];
  const toneClasses = {
    contract: "bg-success/10 text-success",
    outflow: "bg-danger/10 text-danger",
    payroll: "bg-[color:color-mix(in_srgb,var(--primary)_12%,transparent)] text-[var(--primary)]",
    warning: "bg-warning/10 text-warning",
  };
  const toneLabels = {
    contract: translateOrFallback(t, "reports.metricTones.contract", "Contract"),
    outflow: translateOrFallback(t, "reports.metricTones.outflow", "Outflow"),
    payroll: translateOrFallback(t, "reports.metricTones.payroll", "Payroll"),
    warning: translateOrFallback(t, "reports.metricTones.warning", "Watch"),
  };

  return (
    <div className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map((card) => (
          <div
            key={card.label}
            className="min-w-0 rounded-md border border-[color:color-mix(in_srgb,var(--border)_72%,transparent)] bg-card px-4 py-4"
          >
            <div className="flex items-start justify-between gap-3">
              <p className="min-w-0 text-[11px] font-semibold uppercase leading-5 tracking-wide text-muted">
                {card.label}
              </p>
              <span
                className={`inline-flex shrink-0 items-center rounded-full px-2 py-0.5 text-[11px] font-semibold ${toneClasses[card.tone]}`}
              >
                {toneLabels[card.tone]}
              </span>
            </div>
            <p className="mt-3 break-words text-2xl font-semibold leading-tight text-text">
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
              <BarChart data={costMix} margin={chartMargin} barGap={5}>
                <CartesianGrid stroke={gridStroke} strokeDasharray="3 5" vertical={false} />
                <XAxis dataKey="currency" tick={axisStyle} axisLine={false} tickLine={false} />
                <YAxis tick={axisStyle} axisLine={false} tickLine={false} width={48} />
                <ChartTooltip
                  formatter={(value, name) => [
                    formatValue(value),
                    formatLabel(name),
                  ]}
                />
                <Legend wrapperStyle={legendStyle} />
                <Bar dataKey="expenses" name={legendText(t, "expenses", "Expenses")} fill={CHART_COLORS.expense} radius={3} barSize={10} maxBarSize={20} />
                <Bar dataKey="employee_payroll" name={legendText(t, "employeePayroll", "Employee Payroll")} fill={CHART_COLORS.primary} radius={3} barSize={10} maxBarSize={20} />
                <Bar dataKey="employee_advances" name={legendText(t, "employeeAdvances", "Employee Advances")} fill={CHART_COLORS.warning} radius={3} barSize={10} maxBarSize={20} />
                <Bar dataKey="worker_payroll" name={legendText(t, "workerPayroll", "Worker Payroll")} fill={CHART_COLORS.balance} radius={3} barSize={10} maxBarSize={20} />
                <Bar dataKey="contract_paid" name={legendText(t, "contractPaid", "Contract Paid")} fill={CHART_COLORS.neutral} radius={3} barSize={10} maxBarSize={20} />
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
          <div className="h-full overflow-y-auto pr-1 mobile-scrollbar">
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
              <div
                key={label}
                className="flex items-center justify-between gap-4 border-b border-[color:color-mix(in_srgb,var(--border)_58%,transparent)] py-3 last:border-0"
              >
                <p className="min-w-0 text-sm text-muted">{label}</p>
                <p className="shrink-0 text-sm font-semibold text-text">
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
              <LineChart data={monthly} margin={chartMargin}>
                <CartesianGrid stroke={gridStroke} strokeDasharray="3 5" vertical={false} />
                <XAxis dataKey="month" tick={axisStyle} axisLine={false} tickLine={false} />
                <YAxis tick={axisStyle} axisLine={false} tickLine={false} width={48} />
                <ChartTooltip
                  formatter={(value, name) => [
                    formatValue(value),
                    formatLabel(name),
                  ]}
                />
                <Legend wrapperStyle={legendStyle} />
                <Line
                  type="monotone"
                  dataKey="expensesUsd"
                  name={translateReportKey(t, "metrics", "expenses_usd", "Expenses USD Eq.")}
                  stroke={CHART_COLORS.expense}
                  strokeWidth={2}
                  dot={{ ...lineDot, stroke: CHART_COLORS.expense }}
                  activeDot={{ ...activeLineDot, fill: CHART_COLORS.expense }}
                />
                <Line
                  type="monotone"
                  dataKey="expensesAfn"
                  name={translateReportKey(t, "metrics", "expenses_afn", "Expenses AFN Eq.")}
                  stroke={CHART_COLORS.warning}
                  strokeWidth={2}
                  dot={{ ...lineDot, stroke: CHART_COLORS.warning }}
                  activeDot={{ ...activeLineDot, fill: CHART_COLORS.warning }}
                />
                <Line
                  type="monotone"
                  dataKey="workerPayroll"
                  name={translateReportKey(t, "metrics", "daily_worker_payroll_records", "Worker Payroll")}
                  stroke={CHART_COLORS.primary}
                  strokeWidth={2}
                  dot={{ ...lineDot, stroke: CHART_COLORS.primary }}
                  activeDot={{ ...activeLineDot, fill: CHART_COLORS.primary }}
                />
                <Line
                  type="monotone"
                  dataKey="employeeAdvances"
                  name={legendText(t, "employeeAdvances", "Employee Advances")}
                  stroke={CHART_COLORS.neutral}
                  strokeWidth={2}
                  dot={{ ...lineDot, stroke: CHART_COLORS.neutral }}
                  activeDot={{ ...activeLineDot, fill: CHART_COLORS.neutral }}
                />
                <Line
                  type="monotone"
                  dataKey="contractPayments"
                  name={legendText(t, "contractPayments", "Contract Payments")}
                  stroke={CHART_COLORS.balance}
                  strokeWidth={2}
                  dot={{ ...lineDot, stroke: CHART_COLORS.balance }}
                  activeDot={{ ...activeLineDot, fill: CHART_COLORS.balance }}
                />
              </LineChart>
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
              <BarChart data={payrollSource} margin={chartMargin} barGap={6}>
                <CartesianGrid stroke={gridStroke} strokeDasharray="3 5" vertical={false} />
                <XAxis dataKey="name" tick={axisStyle} axisLine={false} tickLine={false} />
                <YAxis tick={axisStyle} axisLine={false} tickLine={false} width={48} />
                <ChartTooltip
                  formatter={(value, name) => [
                    formatValue(value),
                    formatLabel(name),
                  ]}
                />
                <Legend wrapperStyle={legendStyle} />
                <Bar dataKey="netUsd" name={translateReportKey(t, "metrics", "payroll_net_usd", "Net USD")} fill={CHART_COLORS.primary} radius={3} barSize={12} maxBarSize={22} />
                <Bar dataKey="netAfn" name={translateReportKey(t, "metrics", "payroll_net_afn", "Net AFN")} fill={CHART_COLORS.balance} radius={3} barSize={12} maxBarSize={22} />
                <Bar dataKey="grossUsd" name={legendText(t, "gross", "Gross USD")} fill={CHART_COLORS.neutral} radius={3} barSize={12} maxBarSize={22} />
                <Bar dataKey="grossAfn" name={legendText(t, "gross", "Gross AFN")} fill={CHART_COLORS.warning} radius={3} barSize={12} maxBarSize={22} />
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
              <BarChart data={contracts} margin={chartMargin} barGap={6}>
                <CartesianGrid stroke={gridStroke} strokeDasharray="3 5" vertical={false} />
                <XAxis dataKey="name" tick={axisStyle} axisLine={false} tickLine={false} />
                <YAxis tick={axisStyle} axisLine={false} tickLine={false} width={48} />
                <ChartTooltip
                  formatter={(value, name) => [
                    formatValue(value),
                    formatLabel(name),
                  ]}
                />
                <Legend wrapperStyle={legendStyle} />
                <Bar dataKey="value" name={legendText(t, "value", "Value")} fill={CHART_COLORS.contract} radius={3} barSize={12} maxBarSize={24} />
                <Bar dataKey="paid" name={legendText(t, "paid", "Paid")} fill={CHART_COLORS.primary} radius={3} barSize={12} maxBarSize={24} />
                <Bar dataKey="remaining" name={legendText(t, "remaining", "Remaining")} fill={CHART_COLORS.warning} radius={3} barSize={12} maxBarSize={24} />
                <Bar dataKey="variation" name={legendText(t, "variation", "Variation")} fill={CHART_COLORS.neutral} radius={3} barSize={12} maxBarSize={24} />
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
              <BarChart data={projects} layout="vertical" margin={verticalChartMargin}>
                <CartesianGrid stroke={gridStroke} strokeDasharray="3 5" horizontal={false} />
                <XAxis type="number" tick={axisStyle} axisLine={false} tickLine={false} />
                <YAxis
                  type="category"
                  dataKey="name"
                  tick={axisStyle}
                  width={120}
                  axisLine={false}
                  tickLine={false}
                />
                <ChartTooltip
                  formatter={(value, name) => [
                    formatValue(value),
                    formatLabel(name),
                  ]}
                />
                <Legend wrapperStyle={legendStyle} />
                <Bar dataKey="usd" name={translateReportKey(t, "metrics", "total_usd", "Total USD")} fill={CHART_COLORS.primary} radius={3} barSize={12} maxBarSize={24} />
                <Bar dataKey="afn" name={translateReportKey(t, "metrics", "total_afn", "Total AFN")} fill={CHART_COLORS.expense} radius={3} barSize={12} maxBarSize={24} />
                <Bar dataKey="workerAfn" name={translateReportKey(t, "columns", "worker_payroll_afn", "Worker AFN")} fill={CHART_COLORS.warning} radius={3} barSize={12} maxBarSize={24} />
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

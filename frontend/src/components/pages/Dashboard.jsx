// pages/Dashboard.jsx

import { useState } from "react";
import useFetch from "../../hooks/useFetch";
import KPICards from "../dashboard/KPICards";
import ProjectOverview from "../dashboard/ProjectOverview";
import FinancialOverview from "../dashboard/FinancialOverview";
import BudgetComparison from "../dashboard/BudgetComparison";
import ExpenseSummary from "../dashboard/ExpenseSummary";
import WorkforceSection from "../dashboard/WorkforceSection";
import ContractSection from "../dashboard/ContractSection";
import AlertsPanel from "../dashboard/AlertsPanel";
import RecentActivity from "../dashboard/RecentActivity";
import PayrollSummary from "../dashboard/PayrollSummary";
import DashboardSkeleton from "../dashboard/DashboardSkeleton";
import { useLanguage } from "../../hooks/useLanguage";

export default function Dashboard() {
  const { data, loading, error, refetch } = useFetch("dashboard/");
  const [lastRefresh, setLastRefresh] = useState(new Date());
  const { t } = useLanguage();

  const handleRefresh = () => {
    refetch();
    setLastRefresh(new Date());
  };

  if (loading) return <DashboardSkeleton />;

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <div className="w-16 h-16 rounded-full bg-[var(--danger)]/10 flex items-center justify-center">
          <svg
            className="w-8 h-8 text-[var(--danger)]"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
            />
          </svg>
        </div>
        <h2 className="text-xl font-semibold text-[var(--text)]">
          {t("dashboard.failedTitle")}
        </h2>
        <p className="text-[var(--muted)]">
          {error?.response?.data?.detail ||
            error?.message ||
            t("dashboard.failedMessage")}
        </p>
        <button
          onClick={handleRefresh}
          className="px-6 py-2.5 bg-[var(--primary)] text-white rounded-lg hover:opacity-90 transition-opacity"
        >
          {t("dashboard.tryAgain")}
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* ── Header ──────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[var(--text)]">
            {t("dashboard.title")}
          </h1>
          <p className="text-sm text-[var(--muted)] mt-1">
            {t("dashboard.subtitle")}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-[var(--muted)]">
            {t("dashboard.lastUpdated")}: {lastRefresh.toLocaleTimeString()}
          </span>
          <button
            onClick={handleRefresh}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg border border-[var(--border)] bg-[var(--card)] text-[var(--text)] hover:bg-[var(--hover)] transition-colors"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
            {t("dashboard.refresh")}
          </button>
        </div>
      </div>

      {/* ── Alerts (if any high severity) ───────── */}
      {data.alerts?.high_count > 0 && (
        <AlertsPanel alerts={data.alerts} compact />
      )}

      {/* ── KPI Cards ──────────────────────────── */}
      <KPICards
        projects={data.project_overview}
        financial={data.financial_overview}
        workforce={data.workforce_summary}
        contracts={data.contract_summary}
        expenseMonth={data.expense_this_month}
      />

      {/* ── Row 1: Financial + Budget ────────────── */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2">
          <ExpenseSummary data={data.expense_summary} />
        </div>
        <div>
          <FinancialOverview data={data.financial_overview} />
        </div>
      </div>

      {/* ── Row 2: Projects + Budget Comparison ──── */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <ProjectOverview data={data.project_overview} />
        <BudgetComparison data={data.budget_comparison} />
      </div>

      {/* ── Row 3: Workforce + Contracts ─────────── */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <WorkforceSection
          workforce={data.workforce_summary}
          attendance={data.attendance_summary}
        />
        <ContractSection
          contracts={data.contract_summary}
          subcontractors={data.subcontractor_summary}
        />
      </div>

      {/* ── Row 4: Payroll + Alerts ──────────────── */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <PayrollSummary data={data.payroll_summary} />
        <AlertsPanel alerts={data.alerts} />
      </div>

      {/* ── Row 5: Recent Activity ───────────────── */}
      <RecentActivity activities={data.recent_activity} />
    </div>
  );
}

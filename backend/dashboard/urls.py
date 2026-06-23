# dashboard/urls.py

from django.urls import path
from .views import (
    FullDashboardView,
    ProjectOverviewView,
    FinancialOverviewView,
    ExpenseSummaryView,
    ExpenseThisMonthView,
    WorkforceSummaryView,
    AttendanceSummaryView,
    PayrollSummaryView,
    ContractSummaryView,
    SubcontractorSummaryView,
    BudgetComparisonView,
    AlertsView,
    RecentActivityView,
)

app_name = "dashboard"

urlpatterns = [
    # ── Main dashboard (loads everything) ──────
    path(
        "",
        FullDashboardView.as_view(),
        name="full-dashboard",
    ),

    # ── Individual sections (for lazy-loading / widget refresh) ──
    path(
        "projects/",
        ProjectOverviewView.as_view(),
        name="project-overview",
    ),
    path(
        "financial/",
        FinancialOverviewView.as_view(),
        name="financial-overview",
    ),
    path(
        "expenses/",
        ExpenseSummaryView.as_view(),
        name="expense-summary",
    ),
    path(
        "expenses/this-month/",
        ExpenseThisMonthView.as_view(),
        name="expense-this-month",
    ),
    path(
        "workforce/",
        WorkforceSummaryView.as_view(),
        name="workforce-summary",
    ),
    path(
        "attendance/",
        AttendanceSummaryView.as_view(),
        name="attendance-summary",
    ),
    path(
        "payroll/",
        PayrollSummaryView.as_view(),
        name="payroll-summary",
    ),
    path(
        "contracts/",
        ContractSummaryView.as_view(),
        name="contract-summary",
    ),
    path(
        "subcontractors/",
        SubcontractorSummaryView.as_view(),
        name="subcontractor-summary",
    ),
    path(
        "budget-comparison/",
        BudgetComparisonView.as_view(),
        name="budget-comparison",
    ),
    path(
        "alerts/",
        AlertsView.as_view(),
        name="alerts",
    ),
    path(
        "activity/",
        RecentActivityView.as_view(),
        name="recent-activity",
    ),
]
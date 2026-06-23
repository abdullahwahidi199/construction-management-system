# dashboard/views.py

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status

from .services import DashboardService
from .serializers import (
    FullDashboardSerializer,
    ProjectOverviewSerializer,
    FinancialOverviewSerializer,
    ExpenseSummarySerializer,
    ExpenseThisMonthSerializer,
    WorkforceSummarySerializer,
    AttendanceSummarySerializer,
    PayrollSummarySerializer,
    ContractSummarySerializer,
    SubcontractorSummarySerializer,
    BudgetComparisonSerializer,
    AlertsSummarySerializer,
    ActivitySerializer,
)


class FullDashboardView(APIView):
    """
    GET /api/dashboard/
    Returns the complete dashboard payload with all sections.
    This is the primary endpoint for the dashboard page.
    """

    def get(self, request):
        data = DashboardService.get_full_dashboard()
        serializer = FullDashboardSerializer(data)
        return Response(serializer.data, status=status.HTTP_200_OK)


# ════════════════════════════════════════════
# Individual Section Views
# (for lazy-loading or refreshing specific widgets)
# ════════════════════════════════════════════

class ProjectOverviewView(APIView):
    """GET /api/dashboard/projects/"""

    def get(self, request):
        data = DashboardService.get_project_overview()
        serializer = ProjectOverviewSerializer(data)
        return Response(serializer.data)


class FinancialOverviewView(APIView):
    """GET /api/dashboard/financial/"""

    def get(self, request):
        data = DashboardService.get_financial_overview()
        serializer = FinancialOverviewSerializer(data)
        return Response(serializer.data)


class ExpenseSummaryView(APIView):
    """GET /api/dashboard/expenses/"""

    def get(self, request):
        data = DashboardService.get_expense_summary()
        serializer = ExpenseSummarySerializer(data)
        return Response(serializer.data)


class ExpenseThisMonthView(APIView):
    """GET /api/dashboard/expenses/this-month/"""

    def get(self, request):
        data = DashboardService.get_expense_this_month()
        serializer = ExpenseThisMonthSerializer(data)
        return Response(serializer.data)


class WorkforceSummaryView(APIView):
    """GET /api/dashboard/workforce/"""

    def get(self, request):
        data = DashboardService.get_workforce_summary()
        serializer = WorkforceSummarySerializer(data)
        return Response(serializer.data)


class AttendanceSummaryView(APIView):
    """GET /api/dashboard/attendance/"""

    def get(self, request):
        data = DashboardService.get_attendance_summary()
        serializer = AttendanceSummarySerializer(data)
        return Response(serializer.data)


class PayrollSummaryView(APIView):
    """GET /api/dashboard/payroll/"""

    def get(self, request):
        data = DashboardService.get_payroll_summary()
        serializer = PayrollSummarySerializer(data)
        return Response(serializer.data)


class ContractSummaryView(APIView):
    """GET /api/dashboard/contracts/"""

    def get(self, request):
        data = DashboardService.get_contract_summary()
        serializer = ContractSummarySerializer(data)
        return Response(serializer.data)


class SubcontractorSummaryView(APIView):
    """GET /api/dashboard/subcontractors/"""

    def get(self, request):
        data = DashboardService.get_subcontractor_summary()
        serializer = SubcontractorSummarySerializer(data)
        return Response(serializer.data)


class BudgetComparisonView(APIView):
    """GET /api/dashboard/budget-comparison/"""

    def get(self, request):
        data = DashboardService.get_project_budget_comparison()
        serializer = BudgetComparisonSerializer(data, many=True)
        return Response(serializer.data)


class AlertsView(APIView):
    """GET /api/dashboard/alerts/"""

    def get(self, request):
        data = DashboardService.get_alerts()
        serializer = AlertsSummarySerializer(data)
        return Response(serializer.data)


class RecentActivityView(APIView):
    """GET /api/dashboard/activity/"""

    def get(self, request):
        limit = request.query_params.get("limit", 15)
        try:
            limit = int(limit)
        except (ValueError, TypeError):
            limit = 15

        data = DashboardService.get_recent_activity(limit=limit)
        serializer = ActivitySerializer(data, many=True)
        return Response(serializer.data)
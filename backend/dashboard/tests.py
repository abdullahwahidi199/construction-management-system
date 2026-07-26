from datetime import date
from decimal import Decimal

from django.test import TestCase
from rest_framework.test import APITestCase

from common.test_helpers import (
    create_admin,
    create_attendance,
    create_contract,
    create_contract_payment,
    create_employee,
    create_expense,
    create_payroll,
    create_project,
    create_subcontractor,
    create_worker,
    create_worker_payroll,
    create_user,
)
from dashboard.services import DashboardService
from expenses.models import Expense


class DashboardAPITests(APITestCase):
    def setUp(self):
        self.admin = create_admin()
        self.client.force_authenticate(self.admin)
        self.project = create_project(
            name="Dashboard Project",
            estimated_budget=Decimal("1000.00"),
            budget_currency="USD",
        )
        self.employee = create_employee()
        create_attendance(self.employee, date=date.today())
        create_payroll(self.employee)
        create_expense(self.project, amount_usd=Decimal("125.00"))
        subcontractor = create_subcontractor()
        contract = create_contract(project=self.project, subcontractor=subcontractor, contract_value=Decimal("500.00"))
        create_contract_payment(contract=contract, amount=Decimal("100.00"))
        worker = create_worker(project=self.project)
        create_worker_payroll(worker=worker, project=self.project)

    def test_full_dashboard_contains_all_major_sections_and_totals(self):
        response = self.client.get("/api/dashboard/")

        self.assertEqual(response.status_code, 200, response.data)
        for key in [
            "project_overview",
            "financial_overview",
            "expense_summary",
            "workforce_summary",
            "attendance_summary",
            "payroll_summary",
            "contract_summary",
            "budget_comparison",
            "alerts",
            "recent_activity",
        ]:
            self.assertIn(key, response.data)
        self.assertEqual(response.data["project_overview"]["total_projects"], 1)

    def test_dashboard_section_endpoints_are_authenticated_and_schema_stable(self):
        endpoints = {
            "/api/dashboard/projects/": "total_projects",
            "/api/dashboard/financial/": "grand_total_outflow",
            "/api/dashboard/expenses/": "total_expense_count",
            "/api/dashboard/workforce/": "total_employees",
            "/api/dashboard/attendance/": "today",
            "/api/dashboard/payroll/": "current_month",
            "/api/dashboard/contracts/": "total_contracts",
            "/api/dashboard/subcontractors/": "total_subcontractors",
            "/api/dashboard/alerts/": "total_alerts",
        }

        for endpoint, expected_key in endpoints.items():
            response = self.client.get(endpoint)
            self.assertEqual(response.status_code, 200, endpoint)
            self.assertIn(expected_key, response.data, endpoint)

    def test_recent_activity_limit_is_respected(self):
        response = self.client.get("/api/dashboard/activity/?limit=2")

        self.assertEqual(response.status_code, 200, response.data)
        self.assertLessEqual(len(response.data), 2)

    def test_dashboard_requires_dashboard_permission(self):
        user = create_user(username="no-dashboard", role="employee", permissions=["projects.view"])
        self.client.force_authenticate(user)

        response = self.client.get("/api/dashboard/")

        self.assertEqual(response.status_code, 403)

    def test_dashboard_expense_widgets_split_current_month_project_and_office(self):
        create_expense(
            self.project,
            expense_date=date.today(),
            amount_usd=Decimal("40.00"),
        )
        create_expense(
            None,
            expense_scope=Expense.ExpenseScope.OFFICE,
            expense_date=date.today(),
            amount_usd=Decimal("60.00"),
            expense_type="office_rent",
        )

        response = self.client.get("/api/dashboard/expenses/this-month/")

        self.assertEqual(response.status_code, 200, response.data)
        self.assertEqual(
            response.data["current_month"]["project"]["total_usd"],
            Decimal("40.00"),
        )
        self.assertEqual(
            response.data["current_month"]["office"]["total_usd"],
            Decimal("60.00"),
        )


class DashboardPerformanceTests(TestCase):
    def test_budget_comparison_keeps_query_count_bounded_for_large_project_sets(self):
        for index in range(20):
            project = create_project(name=f"Project {index}", estimated_budget=Decimal("1000.00"))
            create_expense(project, amount_usd=Decimal("10.00"))

        with self.assertNumQueries(2):
            rows = DashboardService.get_project_budget_comparison()

        self.assertEqual(len(rows), 20)

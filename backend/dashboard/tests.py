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
    create_salary_advance,
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

    def test_dashboard_expenses_include_usd_equivalent_without_changing_raw_totals(self):
        create_expense(
            self.project,
            amount_usd=Decimal("0.00"),
            amount_afn=Decimal("700.00"),
            exchange_rate=Decimal("70.0000"),
        )

        response = self.client.get("/api/dashboard/financial/")

        self.assertEqual(response.status_code, 200, response.data)
        self.assertEqual(response.data["expenses"]["total_usd"], Decimal("125.00"))
        self.assertEqual(response.data["expenses"]["total_afn"], Decimal("700.00"))
        self.assertEqual(
            response.data["expenses"]["total_usd_equivalent"],
            Decimal("135.00"),
        )

    def test_expense_summary_uses_usd_equivalent_for_project_and_office_breakdown(self):
        create_expense(
            self.project,
            amount_usd=Decimal("0.00"),
            amount_afn=Decimal("700.00"),
            exchange_rate=Decimal("70.0000"),
        )
        create_expense(
            None,
            expense_scope=Expense.ExpenseScope.OFFICE,
            amount_usd=Decimal("60.00"),
            expense_type="office_rent",
        )
        create_expense(
            None,
            expense_scope=Expense.ExpenseScope.OFFICE,
            amount_usd=Decimal("0.00"),
            amount_afn=Decimal("680.00"),
            exchange_rate=Decimal("68.0000"),
            expense_type="office_rent",
        )

        response = self.client.get("/api/dashboard/expenses/")

        self.assertEqual(response.status_code, 200, response.data)
        self.assertEqual(
            Decimal(response.data["total_expenses_usd_equivalent"]),
            Decimal("205.00"),
        )

        by_project = {
            row["project__name"]: row
            for row in response.data["by_project"]
        }
        self.assertEqual(
            Decimal(by_project["Dashboard Project"]["total_usd_equivalent"]),
            Decimal("135.00"),
        )
        self.assertEqual(
            Decimal(by_project["Office Expenses"]["total_usd_equivalent"]),
            Decimal("70.00"),
        )
        self.assertEqual(
            Decimal(response.data["office_expenses"]["total_usd_equivalent"]),
            Decimal("70.00"),
        )

    def test_dashboard_expense_widgets_split_current_month_project_and_office(self):
        create_expense(
            self.project,
            expense_date=date.today(),
            amount_usd=Decimal("40.00"),
        )
        create_expense(
            self.project,
            expense_date=date.today(),
            amount_usd=Decimal("0.00"),
            amount_afn=Decimal("680.00"),
            exchange_rate=Decimal("68.0000"),
        )
        create_expense(
            None,
            expense_scope=Expense.ExpenseScope.OFFICE,
            expense_date=date.today(),
            amount_usd=Decimal("60.00"),
            expense_type="office_rent",
        )
        create_expense(
            None,
            expense_scope=Expense.ExpenseScope.OFFICE,
            expense_date=date.today(),
            amount_usd=Decimal("0.00"),
            amount_afn=Decimal("680.00"),
            exchange_rate=Decimal("68.0000"),
            expense_type="office_rent",
        )

        response = self.client.get("/api/dashboard/expenses/this-month/")

        self.assertEqual(response.status_code, 200, response.data)
        self.assertEqual(
            response.data["current_month"]["project"]["total_usd"],
            Decimal("40.00"),
        )
        self.assertEqual(
            response.data["current_month"]["project"]["total_afn"],
            Decimal("680.00"),
        )
        self.assertEqual(
            response.data["current_month"]["project"]["total_usd_equivalent"],
            Decimal("50.00"),
        )
        self.assertEqual(
            response.data["current_month"]["office"]["total_usd"],
            Decimal("60.00"),
        )
        self.assertEqual(
            response.data["current_month"]["office"]["total_afn"],
            Decimal("680.00"),
        )
        self.assertEqual(
            response.data["current_month"]["office"]["total_usd_equivalent"],
            Decimal("70.00"),
        )
        self.assertEqual(
            response.data["current_month"]["total_usd_equivalent"],
            Decimal("120.00"),
        )

    def test_salary_advance_is_immediate_outflow_and_payroll_does_not_double_count(self):
        employee = create_employee(
            email="advance.dashboard@example.com",
            salary=Decimal("30000.00"),
        )
        baseline = DashboardService.get_financial_overview()["grand_total_outflow"]["afn"]

        create_salary_advance(
            employee=employee,
            amount=Decimal("5000.00"),
            remaining_balance=Decimal("5000.00"),
            date=date(2026, 7, 1),
        )
        after_advance = DashboardService.get_financial_overview()

        self.assertEqual(
            after_advance["grand_total_outflow"]["afn"],
            baseline + Decimal("5000.00"),
        )
        self.assertEqual(
            after_advance["payroll"]["salary_advances_afn"],
            Decimal("5000.00"),
        )

        response = self.client.post(
            "/api/payrolls/",
            {
                "employee": employee.id,
                "payroll_period_start": "2026-07-01",
                "payroll_period_end": "2026-07-31",
                "basic_salary": "30000.00",
                "currency": "AFN",
                "payment_method": "cash",
                "advance_deduction_mode": "all",
            },
            format="json",
        )

        self.assertEqual(response.status_code, 201, response.data)
        self.assertEqual(Decimal(response.data["advance_deductions"]), Decimal("5000.00"))
        self.assertEqual(Decimal(response.data["net_pay"]), Decimal("25000.00"))

        after_payroll = DashboardService.get_financial_overview()
        self.assertEqual(
            after_payroll["grand_total_outflow"]["afn"],
            baseline + Decimal("30000.00"),
        )


class DashboardPerformanceTests(TestCase):
    def test_budget_comparison_keeps_query_count_bounded_for_large_project_sets(self):
        for index in range(20):
            project = create_project(name=f"Project {index}", estimated_budget=Decimal("1000.00"))
            create_expense(project, amount_usd=Decimal("10.00"))

        with self.assertNumQueries(2):
            rows = DashboardService.get_project_budget_comparison()

        self.assertEqual(len(rows), 20)

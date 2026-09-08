from datetime import date, timedelta
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
from Employees.models import Employee, PayrollPayment
from expenses.models import Expense
from accounts.models import ProjectAssignment
from project.models import Apartment, ApartmentPayment, ApartmentSale, Building, Customer, Floor


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

    def test_dashboard_apartment_metrics_are_real_and_currency_separated(self):
        building = Building.objects.create(project=self.project, name="Dashboard Tower")
        floor = Floor.objects.create(building=building, floor_number=1)
        customer = Customer.objects.create(project=self.project, name="Dashboard Buyer")
        usd_apartment = Apartment.objects.create(
            project=self.project,
            building=building,
            floor=floor,
            apartment_number="101",
            status=Apartment.Status.SOLD,
        )
        Apartment.objects.create(
            project=self.project,
            building=building,
            floor=floor,
            apartment_number="102",
        )
        sale = ApartmentSale.objects.create(
            apartment=usd_apartment,
            customer=customer,
            reference_number="DASH-SALE-101",
            sale_date=date.today(),
            sale_price=Decimal("100000.00"),
            currency="USD",
            created_by=self.admin,
        )
        ApartmentPayment.objects.create(
            sale=sale,
            customer=customer,
            receipt_number="DASH-RCPT-101",
            amount=Decimal("40000.00"),
            currency="USD",
            payment_date=date.today(),
            payment_method=ApartmentPayment.Method.CASH,
            recorded_by=self.admin,
        )

        response = self.client.get("/api/dashboard/")
        self.assertEqual(response.status_code, 200, response.data)
        summary = response.data["apartment_summary"]
        self.assertEqual(summary["inventory"], {"total": 2, "available": 1, "sold": 1})
        self.assertEqual(summary["sale_count"], 1)
        self.assertEqual(summary["payment_status"]["partially_paid"], 1)
        self.assertEqual(summary["currencies"]["USD"]["sales"], Decimal("100000.00"))
        self.assertEqual(summary["currencies"]["USD"]["received"], Decimal("40000.00"))
        self.assertEqual(summary["currencies"]["USD"]["outstanding"], Decimal("60000.00"))
        self.assertEqual(summary["currencies"]["AFN"]["sales"], Decimal("0.00"))

    def test_dashboard_apartment_metrics_follow_assigned_projects(self):
        building = Building.objects.create(project=self.project, name="Scoped Tower")
        floor = Floor.objects.create(building=building, floor_number=1)
        Apartment.objects.create(
            project=self.project,
            building=building,
            floor=floor,
            apartment_number="A-1",
        )
        other_project = create_project(name="Hidden Dashboard Project")
        other_building = Building.objects.create(project=other_project, name="Hidden Tower")
        other_floor = Floor.objects.create(building=other_building, floor_number=1)
        Apartment.objects.create(
            project=other_project,
            building=other_building,
            floor=other_floor,
            apartment_number="H-1",
        )
        user = create_user(
            username="scoped-dashboard-user",
            role="scoped_dashboard",
            permissions=["dashboard.view", "projects.view_assigned", "apartments.view", "apartment_sales.view"],
        )
        ProjectAssignment.objects.create(user=user, project=self.project, assigned_by=self.admin)
        self.client.force_authenticate(user)

        response = self.client.get("/api/dashboard/apartments/")
        self.assertEqual(response.status_code, 200, response.data)
        self.assertEqual(response.data["inventory"]["total"], 1)

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

    def test_dashboard_payroll_summary_splits_project_and_office_payroll(self):
        project_employee = create_employee(
            email="dashboard.project.payroll@example.com",
            employment_type=Employee.EmploymentType.PROJECT,
            project=self.project,
            salary=Decimal("1200.00"),
        )
        office_employee = create_employee(
            email="dashboard.office.payroll@example.com",
            employment_type=Employee.EmploymentType.OFFICE,
            project=None,
            salary=Decimal("800.00"),
        )
        start = date.today().replace(day=1)
        project_payroll = create_payroll(
            employee=project_employee,
            payroll_period_start=start,
            payroll_period_end=date.today(),
            basic_salary=Decimal("1200.00"),
            currency="USD",
        )
        office_payroll = create_payroll(
            employee=office_employee,
            payroll_period_start=start,
            payroll_period_end=date.today(),
            basic_salary=Decimal("800.00"),
            currency="USD",
        )
        PayrollPayment.objects.create(
            payroll=project_payroll,
            amount=Decimal("1200.00"),
            payment_date=date.today(),
            payment_method="cash",
        )
        PayrollPayment.objects.create(
            payroll=office_payroll,
            amount=Decimal("800.00"),
            payment_date=date.today(),
            payment_method="cash",
        )
        project_payroll.refresh_payment_totals(save=True)
        office_payroll.refresh_payment_totals(save=True)

        response = self.client.get("/api/dashboard/payroll/")

        self.assertEqual(response.status_code, 200, response.data)
        current = response.data["current_month"]
        self.assertEqual(Decimal(current["project_payroll_paid_usd"]), Decimal("1200.00"))
        self.assertEqual(Decimal(current["office_payroll_paid_usd"]), Decimal("800.00"))

    def test_dashboard_payroll_summary_uses_payment_date_not_period_start(self):
        project_employee = create_employee(
            email="dashboard.shamsi.period@example.com",
            employment_type=Employee.EmploymentType.PROJECT,
            project=self.project,
            salary=Decimal("999.99"),
        )
        first_of_month = date.today().replace(day=1)
        previous_month_start = (first_of_month - timedelta(days=1)).replace(day=1)
        payroll = create_payroll(
            employee=project_employee,
            payroll_period_start=previous_month_start,
            payroll_period_end=date.today(),
            basic_salary=Decimal("999.99"),
            currency="AFN",
            payment_date=date.today(),
        )
        PayrollPayment.objects.create(
            payroll=payroll,
            amount=Decimal("999.99"),
            payment_date=date.today(),
            payment_method="cash",
        )
        payroll.refresh_payment_totals(save=True)

        response = self.client.get("/api/dashboard/payroll/")

        self.assertEqual(response.status_code, 200, response.data)
        current = response.data["current_month"]
        previous = response.data["previous_month"]
        self.assertEqual(Decimal(current["project_payroll_paid_afn"]), Decimal("999.99"))
        self.assertEqual(Decimal(current["cash_outflow_afn"]), Decimal("999.99"))
        self.assertEqual(Decimal(previous["project_payroll_paid_afn"]), Decimal("0.00"))


class DashboardPerformanceTests(TestCase):
    def test_budget_comparison_keeps_query_count_bounded_for_large_project_sets(self):
        for index in range(20):
            project = create_project(name=f"Project {index}", estimated_budget=Decimal("1000.00"))
            create_expense(project, amount_usd=Decimal("10.00"))

        with self.assertNumQueries(2):
            rows = DashboardService.get_project_budget_comparison()

        self.assertEqual(len(rows), 20)

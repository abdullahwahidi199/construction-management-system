from datetime import date
from decimal import Decimal
<<<<<<< HEAD

from django.contrib.auth import get_user_model
from django.test import TestCase
from rest_framework.test import APITestCase

from Employees.models import Employee, Payroll
from dashboard.services import DashboardService
from expenses.models import Expense
from expenses.serializers import ExpenseSerializer
from project.models import Project
from subcontractor.models import (
    Contract,
    ContractPayment,
    ContractVariation,
    PaymentTypeChoices,
    SpecializationChoices,
    Subcontractor,
)


class FinancialCurrencyAuditTests(TestCase):
    def setUp(self):
        self.usd_project = Project.objects.create(
            name="USD Tower",
            property_type="commercial",
            location="Kabul",
            total_floors=10,
            start_date=date(2026, 1, 1),
            estimated_budget=Decimal("1000.00"),
            budget_currency="USD",
            status="ongoing",
        )
        self.afn_project = Project.objects.create(
            name="AFN Villas",
            property_type="residential",
            location="Herat",
            total_floors=2,
            start_date=date(2026, 1, 1),
            estimated_budget=Decimal("70000.00"),
=======

from django.test import TestCase

from expenses.models import Expense
from Employees.models import Attendance, Employee, Payroll
from labour.models import DailyWorker, WorkerPayroll
from labour.models import WorkerAttendance
from project.models import Project
from reports.reports.attendance_report import AttendanceReport
from reports.reports.financial_report import FinancialOverviewReport
from reports.reports.payroll_report import PayrollReport
from reports.reports.project_report import ProjectSummaryReport


class ProjectSummaryReportTests(TestCase):
    def test_project_report_uses_converted_expenses_and_worker_payroll(self):
        project = Project.objects.create(
            name="Lalander 4",
            property_type="residential",
            location="Kabul",
            total_floors=4,
            start_date=date(2025, 1, 1),
            estimated_budget=Decimal("20000.00"),
>>>>>>> recovery
            budget_currency="AFN",
            status="ongoing",
        )

<<<<<<< HEAD
    def test_expense_serializer_rejects_mixed_currency_row(self):
        serializer = ExpenseSerializer(
            data={
                "project": self.usd_project.id,
                "expense_date": date(2026, 2, 1),
                "description": "Mixed cash entry",
                "amount_afn": "100.00",
                "amount_usd": "20.00",
                "exchange_rate": "70.0000",
                "expense_type": "general",
            }
        )

        self.assertFalse(serializer.is_valid())
        self.assertIn("Expense cannot contain both AFN and USD amounts", str(serializer.errors))

    def test_dashboard_budget_comparison_uses_project_budget_currency_only(self):
        Expense.objects.create(
            project=self.usd_project,
            expense_date=date(2026, 2, 1),
            description="USD materials",
            amount_usd=Decimal("250.00"),
        )
        Expense.objects.create(
            project=self.usd_project,
            expense_date=date(2026, 2, 2),
            description="AFN materials should not reduce USD budget",
            amount_afn=Decimal("7000.00"),
        )
        Expense.objects.create(
            project=self.afn_project,
            expense_date=date(2026, 2, 3),
            description="AFN cement",
            amount_afn=Decimal("10000.00"),
        )

        rows = {row["name"]: row for row in DashboardService.get_project_budget_comparison()}

        self.assertEqual(rows["USD Tower"]["budget_currency"], "USD")
        self.assertEqual(rows["USD Tower"]["budget_remaining"], 750.0)
        self.assertIsNone(rows["USD Tower"]["budget_remaining_afn"])
        self.assertEqual(rows["AFN Villas"]["budget_currency"], "AFN")
        self.assertEqual(rows["AFN Villas"]["budget_remaining"], 60000.0)
        self.assertIsNone(rows["AFN Villas"]["budget_remaining_usd"])

    def test_contract_financials_are_kept_separate_by_currency(self):
        subcontractor = Subcontractor.objects.create(
            name="Audit Sub",
            specialization=SpecializationChoices.CONCRETE,
        )
        usd_contract = Contract.objects.create(
            project=self.usd_project,
            subcontractor=subcontractor,
            title="USD shell",
            currency="USD",
            contract_value=Decimal("1000.00"),
            retention_percentage=Decimal("10.00"),
            start_date=date(2026, 1, 1),
            end_date=date(2026, 6, 1),
            status="active",
        )
        afn_contract = Contract.objects.create(
            project=self.afn_project,
            subcontractor=subcontractor,
            title="AFN shell",
            currency="AFN",
            contract_value=Decimal("70000.00"),
            retention_percentage=Decimal("5.00"),
            start_date=date(2026, 1, 1),
            end_date=date(2026, 6, 1),
            status="active",
        )
        ContractVariation.objects.create(
            contract=usd_contract,
            description="Approved scope",
            amount_change=Decimal("100.00"),
            days_added=1,
            date=date(2026, 2, 1),
            approved=True,
        )
        ContractPayment.objects.create(
            contract=usd_contract,
            amount=Decimal("300.00"),
            payment_date=date(2026, 3, 1),
            payment_type=PaymentTypeChoices.PROGRESS,
        )
        ContractPayment.objects.create(
            contract=afn_contract,
            amount=Decimal("10000.00"),
            payment_date=date(2026, 3, 1),
            payment_type=PaymentTypeChoices.PROGRESS,
        )

        overview = DashboardService.get_financial_overview()

        self.assertEqual(overview["contracts"]["total_contract_value_usd"], Decimal("1000.00"))
        self.assertEqual(overview["contracts"]["total_contract_value_afn"], Decimal("70000.00"))
        self.assertEqual(overview["contracts"]["total_payments_made_usd"], Decimal("300.00"))
        self.assertEqual(overview["contracts"]["total_payments_made_afn"], Decimal("10000.00"))


class PayrollAPITests(APITestCase):
    def setUp(self):
        self.user = get_user_model().objects.create_superuser(
            username="auditor",
            password="pass",
            email="auditor@example.com",
        )
        self.client.force_authenticate(self.user)
        self.employee = Employee.objects.create(
            first_name="Amina",
            last_name="Rahimi",
            email="amina@example.com",
            phone="0700000000",
            address="Kabul",
            department="engineering",
            position="Engineer",
            employment_type="full_time",
            hire_date=date(2026, 1, 1),
            salary=Decimal("1000.00"),
        )

    def test_bulk_payroll_creation_uses_existing_model_fields(self):
        response = self.client.post(
            "/api/payrolls/bulk_create_payroll/",
            {
                "employee_ids": [self.employee.id],
                "payroll_period_start": "2026-02-01",
                "payroll_period_end": "2026-02-28",
                "bonus": "50.00",
                "allowances": "25.00",
                "deductions": "10.00",
                "tax_percentage": "10.00",
                "payment_method": "cash",
            },
            format="json",
        )

        self.assertEqual(response.status_code, 201, response.data)
        payroll = Payroll.objects.get(employee=self.employee)
        self.assertEqual(payroll.gross_pay, Decimal("1075.00"))
        self.assertEqual(payroll.net_pay, Decimal("965.00"))


class FinancialAPISecurityTests(APITestCase):
    def setUp(self):
        self.user = get_user_model().objects.create_superuser(
            username="finance",
            password="pass",
            email="finance@example.com",
        )
        self.project = Project.objects.create(
            name="API Audit Project",
            property_type="commercial",
            location="Kabul",
            total_floors=5,
            start_date=date(2026, 1, 1),
            estimated_budget=Decimal("1000.00"),
            budget_currency="USD",
            status="ongoing",
        )

    def test_unauthenticated_financial_endpoint_is_rejected(self):
        response = self.client.get("/api/expenses/")

        self.assertEqual(response.status_code, 401)

    def test_expense_api_totals_are_raw_currency_buckets(self):
        Expense.objects.create(
            project=self.project,
            expense_date=date(2026, 2, 1),
            description="USD only",
            amount_usd=Decimal("25.00"),
        )
        Expense.objects.create(
            project=self.project,
            expense_date=date(2026, 2, 2),
            description="AFN only",
            amount_afn=Decimal("7000.00"),
        )

        self.client.force_authenticate(self.user)
        response = self.client.get("/api/expenses/")

        self.assertEqual(response.status_code, 200, response.data)
        self.assertEqual(Decimal(response.data["results"]["totals"]["usd"]), Decimal("25"))
        self.assertEqual(Decimal(response.data["results"]["totals"]["afn"]), Decimal("7000"))
=======
        Expense.objects.create(
            project=project,
            expense_date=date(2025, 11, 2),
            description="AFN expense",
            amount_afn=Decimal("6500.00"),
            amount_usd=Decimal("0.00"),
            exchange_rate=Decimal("65.00"),
            expense_type="general",
        )
        Expense.objects.create(
            project=project,
            expense_date=date(2025, 11, 3),
            description="USD expense",
            amount_afn=Decimal("0.00"),
            amount_usd=Decimal("100.00"),
            exchange_rate=Decimal("65.00"),
            expense_type="general",
        )

        worker_afn = DailyWorker.objects.create(
            full_name="Worker AFN",
            phone="0700000000",
            daily_rate=Decimal("1000.00"),
            overtime_hourly_rate=Decimal("0.00"),
            currency="AFN",
            skill_type="helper",
            joining_date=date(2025, 1, 1),
            assigned_project=project,
        )
        WorkerPayroll.objects.create(
            worker=worker_afn,
            project=project,
            period_start=date(2025, 11, 1),
            period_end=date(2025, 11, 7),
            daily_rate_applied=Decimal("1000.00"),
            overtime_rate_applied=Decimal("0.00"),
            gross_amount=Decimal("3500.00"),
            advances=Decimal("500.00"),
            deductions=Decimal("0.00"),
            net_amount=Decimal("3000.00"),
            currency="AFN",
            status="paid",
        )

        worker_usd = DailyWorker.objects.create(
            full_name="Worker USD",
            phone="0700000001",
            daily_rate=Decimal("100.00"),
            overtime_hourly_rate=Decimal("0.00"),
            currency="USD",
            skill_type="helper",
            joining_date=date(2025, 1, 1),
            assigned_project=project,
        )
        WorkerPayroll.objects.create(
            worker=worker_usd,
            project=project,
            period_start=date(2025, 11, 1),
            period_end=date(2025, 11, 7),
            daily_rate_applied=Decimal("100.00"),
            overtime_rate_applied=Decimal("0.00"),
            gross_amount=Decimal("100.00"),
            advances=Decimal("25.00"),
            deductions=Decimal("0.00"),
            net_amount=Decimal("75.00"),
            currency="USD",
            status="paid",
        )

        data = ProjectSummaryReport().generate()
        row = data["rows"][0]

        self.assertEqual(row["raw_expenses_afn"], Decimal("6500.00"))
        self.assertEqual(row["raw_expenses_usd"], Decimal("100.00"))
        self.assertEqual(row["expenses_usd"], Decimal("200.00"))
        self.assertEqual(row["expenses_afn"], Decimal("13000.00"))
        self.assertEqual(row["worker_payroll_afn"], Decimal("3000.00"))
        self.assertEqual(row["worker_payroll_usd"], Decimal("75.00"))
        self.assertEqual(row["total_spent_afn"], Decimal("16000.00"))
        self.assertEqual(row["total_spent_usd"], Decimal("275.00"))
        self.assertEqual(row["budget_remaining_afn"], Decimal("4000.00"))


class PayrollReportTests(TestCase):
    def test_payroll_report_includes_employee_and_daily_worker_payrolls(self):
        project = Project.objects.create(
            name="Payroll Project",
            property_type="commercial",
            location="Kabul",
            start_date=date(2025, 1, 1),
            estimated_budget=Decimal("100000.00"),
            budget_currency="AFN",
            status="ongoing",
        )
        employee = Employee.objects.create(
            first_name="Staff",
            last_name="Member",
            email="staff@example.com",
            phone="0700000002",
            address="Kabul",
            department="finance",
            position="Accountant",
            employment_type="full_time",
            hire_date=date(2025, 1, 1),
            salary=Decimal("1000.00"),
        )
        Payroll.objects.create(
            employee=employee,
            payroll_period_start=date(2025, 2, 1),
            payroll_period_end=date(2025, 2, 28),
            basic_salary=Decimal("1000.00"),
            gross_pay=Decimal("1200.00"),
            deductions=Decimal("100.00"),
            tax_deducted=Decimal("50.00"),
            net_pay=Decimal("1050.00"),
            currency="USD",
            payment_method="bank_transfer",
        )

        worker = DailyWorker.objects.create(
            full_name="Site Worker",
            phone="0700000003",
            daily_rate=Decimal("700.00"),
            overtime_hourly_rate=Decimal("80.00"),
            currency="AFN",
            skill_type="mason",
            joining_date=date(2025, 1, 1),
            assigned_project=project,
        )
        WorkerPayroll.objects.create(
            worker=worker,
            project=project,
            period_start=date(2025, 2, 1),
            period_end=date(2025, 2, 7),
            daily_rate_applied=Decimal("700.00"),
            overtime_rate_applied=Decimal("80.00"),
            gross_amount=Decimal("4200.00"),
            advances=Decimal("500.00"),
            deductions=Decimal("200.00"),
            net_amount=Decimal("3500.00"),
            currency="AFN",
            status="paid",
            payment_method="cash",
        )

        data = PayrollReport().generate()

        self.assertEqual(data["summary"]["total_records"], 2)
        self.assertEqual(data["summary"]["employee_payroll_records"], 1)
        self.assertEqual(data["summary"]["daily_worker_payroll_records"], 1)
        self.assertEqual(
            {row["source_type"] for row in data["rows"]},
            {"Employee", "Daily Worker"},
        )
        self.assertEqual(data["summary"]["total_net"], Decimal("4550.00"))

        worker_only = PayrollReport(filters={"source_type": "daily_worker"}).generate()
        self.assertEqual(worker_only["summary"]["total_records"], 1)
        self.assertEqual(worker_only["rows"][0]["source_type"], "Daily Worker")


class AttendanceReportTests(TestCase):
    def test_attendance_report_includes_employee_and_daily_worker_attendance(self):
        project = Project.objects.create(
            name="Attendance Project",
            property_type="commercial",
            location="Kabul",
            start_date=date(2025, 1, 1),
            estimated_budget=Decimal("100000.00"),
            budget_currency="AFN",
            status="ongoing",
        )
        employee = Employee.objects.create(
            first_name="Office",
            last_name="Staff",
            email="office@example.com",
            phone="0700000004",
            address="Kabul",
            department="administration",
            position="Admin",
            employment_type="full_time",
            hire_date=date(2025, 1, 1),
            salary=Decimal("900.00"),
        )
        Attendance.objects.create(
            employee=employee,
            date=date(2025, 3, 1),
            status="present",
            overtime_hours=Decimal("1.50"),
        )

        worker = DailyWorker.objects.create(
            full_name="Attendance Worker",
            phone="0700000005",
            daily_rate=Decimal("600.00"),
            overtime_hourly_rate=Decimal("75.00"),
            currency="AFN",
            skill_type="helper",
            joining_date=date(2025, 1, 1),
            assigned_project=project,
        )
        WorkerAttendance.objects.create(
            worker=worker,
            project=project,
            date=date(2025, 3, 1),
            status="overtime",
            overtime_hours=Decimal("2.50"),
        )

        data = AttendanceReport().generate()

        self.assertEqual(data["summary"]["total_records"], 2)
        self.assertEqual(data["summary"]["employee_attendance_records"], 1)
        self.assertEqual(data["summary"]["daily_worker_attendance_records"], 1)
        self.assertEqual(
            {row["source_type"] for row in data["rows"]},
            {"Employee", "Daily Worker"},
        )
        self.assertEqual(data["summary"]["total_overtime_hours"], Decimal("4.00"))

        employee_only = AttendanceReport(filters={"source_type": "employee"}).generate()
        self.assertEqual(employee_only["summary"]["total_records"], 1)
        self.assertEqual(employee_only["rows"][0]["source_type"], "Employee")


class FinancialOverviewReportTests(TestCase):
    def test_financial_overview_includes_rich_cost_sources(self):
        project = Project.objects.create(
            name="Financial Project",
            property_type="mixed",
            location="Kabul",
            start_date=date(2025, 1, 1),
            estimated_budget=Decimal("50000.00"),
            budget_currency="AFN",
            status="ongoing",
        )
        Expense.objects.create(
            project=project,
            expense_date=date(2025, 4, 1),
            description="Converted expense",
            amount_afn=Decimal("6500.00"),
            amount_usd=Decimal("100.00"),
            exchange_rate=Decimal("65.00"),
            expense_type="general",
        )

        employee = Employee.objects.create(
            first_name="Finance",
            last_name="Staff",
            email="finance@example.com",
            phone="0700000006",
            address="Kabul",
            department="finance",
            position="Officer",
            employment_type="full_time",
            hire_date=date(2025, 1, 1),
            salary=Decimal("1000.00"),
        )
        Payroll.objects.create(
            employee=employee,
            payroll_period_start=date(2025, 4, 1),
            payroll_period_end=date(2025, 4, 30),
            basic_salary=Decimal("1000.00"),
            gross_pay=Decimal("1000.00"),
            net_pay=Decimal("900.00"),
            deductions=Decimal("100.00"),
            tax_deducted=Decimal("0.00"),
            currency="USD",
        )

        worker = DailyWorker.objects.create(
            full_name="Financial Worker",
            phone="0700000007",
            daily_rate=Decimal("700.00"),
            overtime_hourly_rate=Decimal("0.00"),
            currency="AFN",
            skill_type="helper",
            joining_date=date(2025, 1, 1),
            assigned_project=project,
        )
        WorkerPayroll.objects.create(
            worker=worker,
            project=project,
            period_start=date(2025, 4, 1),
            period_end=date(2025, 4, 7),
            daily_rate_applied=Decimal("700.00"),
            overtime_rate_applied=Decimal("0.00"),
            gross_amount=Decimal("3500.00"),
            net_amount=Decimal("3000.00"),
            currency="AFN",
            status="paid",
        )

        data = FinancialOverviewReport().generate()

        self.assertEqual(data["summary"]["expenses_usd"], Decimal("200.00"))
        self.assertEqual(data["summary"]["expenses_afn"], Decimal("13000.00"))
        self.assertEqual(data["summary"]["payroll_net_usd"], Decimal("900.00"))
        self.assertEqual(data["summary"]["payroll_net_afn"], Decimal("3000.00"))
        self.assertEqual(data["summary"]["operating_cost_usd"], Decimal("1100.00"))
        self.assertEqual(data["summary"]["operating_cost_afn"], Decimal("16000.00"))
        self.assertEqual(data["rows"][0]["project"], "Financial Project")
        self.assertEqual(data["rows"][0]["total_cost_afn"], Decimal("16000.00"))

        scoped = FinancialOverviewReport(filters={"project_id": project.id}).generate()
        self.assertEqual(scoped["summary"]["employee_payroll_records"], 0)
        self.assertEqual(scoped["summary"]["daily_worker_payroll_records"], 1)
>>>>>>> recovery

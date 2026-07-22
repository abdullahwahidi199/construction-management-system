from datetime import date
from decimal import Decimal

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
            budget_currency="AFN",
            status="ongoing",
        )

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

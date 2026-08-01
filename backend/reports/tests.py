from datetime import date
from decimal import Decimal

from django.contrib.auth import get_user_model
from django.test import TestCase
from rest_framework.test import APITestCase

from Employees.models import Employee, Payroll, SalaryAdvance
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
            budget_currency="AFN",
            status="ongoing",
        )

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
        self.assertIn(
            "Expense cannot contain both AFN and USD amounts",
            str(serializer.errors),
        )

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

        rows = {
            row["name"]: row
            for row in DashboardService.get_project_budget_comparison()
        }

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

        self.assertEqual(
            overview["contracts"]["total_contract_value_usd"],
            Decimal("1000.00"),
        )
        self.assertEqual(
            overview["contracts"]["total_contract_value_afn"],
            Decimal("70000.00"),
        )
        self.assertEqual(
            overview["contracts"]["total_payments_made_usd"],
            Decimal("300.00"),
        )
        self.assertEqual(
            overview["contracts"]["total_payments_made_afn"],
            Decimal("10000.00"),
        )


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
        self.assertEqual(
            Decimal(response.data["results"]["totals"]["usd"]),
            Decimal("25"),
        )
        self.assertEqual(
            Decimal(response.data["results"]["totals"]["afn"]),
            Decimal("7000"),
        )


class ReportEndpointTests(APITestCase):
    def setUp(self):
        self.user = get_user_model().objects.create_superuser(
            username="report-admin",
            password="pass",
            email="report-admin@example.com",
        )
        self.client.force_authenticate(self.user)
        self.project = Project.objects.create(
            name="Report Project",
            property_type="commercial",
            location="Kabul",
            total_floors=5,
            start_date=date(2026, 1, 1),
            estimated_budget=Decimal("1000.00"),
            budget_currency="USD",
            status="ongoing",
        )
        self.employee = Employee.objects.create(
            first_name="Report",
            last_name="Employee",
            email="report.employee@example.com",
            phone="0700000000",
            address="Kabul",
            department="finance",
            position="Accountant",
            employment_type="full_time",
            hire_date=date(2026, 1, 1),
            salary=Decimal("1000.00"),
        )
        Payroll.objects.create(
            employee=self.employee,
            payroll_period_start=date(2026, 2, 1),
            payroll_period_end=date(2026, 2, 28),
            basic_salary=Decimal("1000.00"),
            gross_pay=Decimal("1000.00"),
            net_pay=Decimal("900.00"),
            tax_deducted=Decimal("100.00"),
            currency="USD",
        )
        Expense.objects.create(
            project=self.project,
            expense_date=date(2026, 2, 1),
            description="Report expense",
            amount_usd=Decimal("50.00"),
            approval_status=Expense.ApprovalStatus.APPROVED,
        )
        Expense.objects.create(
            expense_scope=Expense.ExpenseScope.OFFICE,
            project=None,
            expense_date=date(2026, 2, 1),
            description="Office rent",
            expense_type="office_rent",
            amount_usd=Decimal("30.00"),
            approval_status=Expense.ApprovalStatus.APPROVED,
        )
        subcontractor = Subcontractor.objects.create(
            name="Report Sub",
            specialization=SpecializationChoices.CONCRETE,
        )
        self.contract = Contract.objects.create(
            project=self.project,
            subcontractor=subcontractor,
            title="Report Contract",
            currency="USD",
            contract_value=Decimal("500.00"),
            start_date=date(2026, 1, 1),
            end_date=date(2026, 6, 1),
            status="active",
        )

    def test_all_json_reports_return_summary_rows_and_totals(self):
        endpoints = [
            "/api/reports/projects/",
            "/api/reports/expenses/",
            "/api/reports/payroll/",
            "/api/reports/attendance/",
            "/api/reports/employees/",
            "/api/reports/contracts/",
            "/api/reports/financial/",
        ]

        for endpoint in endpoints:
            response = self.client.get(endpoint)
            self.assertEqual(response.status_code, 200, endpoint)
            self.assertIn("summary", response.data, endpoint)

    def test_report_date_range_validation(self):
        response = self.client.get("/api/reports/expenses/?start_date=2026-03-01&end_date=2026-02-01")

        self.assertEqual(response.status_code, 400)

    def test_report_filters_and_pdf_export(self):
        filtered = self.client.get(f"/api/reports/contracts/?project_id={self.project.id}&currency=USD")
        exported = self.client.get("/api/reports/projects/?export=pdf")

        self.assertEqual(filtered.status_code, 200, filtered.data)
        self.assertEqual(exported.status_code, 200)
        self.assertEqual(exported["Content-Type"], "application/pdf")

    def test_expense_pdf_export_rejects_pending_status(self):
        response = self.client.get("/api/reports/expenses/?export=pdf&status=pending")

        self.assertEqual(response.status_code, 403)

    def test_expense_report_splits_project_and_office_totals_and_filters_scope(self):
        all_expenses = self.client.get("/api/reports/expenses/")
        office_expenses = self.client.get("/api/reports/expenses/?expense_scope=office")
        project_report = self.client.get("/api/reports/projects/")
        financial = self.client.get("/api/reports/financial/")

        self.assertEqual(all_expenses.status_code, 200, all_expenses.data)
        self.assertEqual(
            all_expenses.data["summary"]["total_project_expenses_usd"],
            Decimal("50"),
        )
        self.assertEqual(
            all_expenses.data["summary"]["total_office_expenses_usd"],
            Decimal("30"),
        )
        self.assertEqual(
            all_expenses.data["summary"]["overall_total_expenses_usd"],
            Decimal("80"),
        )
        self.assertEqual(office_expenses.data["summary"]["total_records"], 1)
        self.assertEqual(office_expenses.data["preview"][0]["project__name"], "Office")
        self.assertEqual(office_expenses.data["rows"][0]["project"], "Office")
        self.assertEqual(
            project_report.data["summary"]["total_expenses_usd"],
            Decimal("50.00"),
        )
        self.assertEqual(
            financial.data["summary"]["office_expenses_usd"],
            Decimal("30.00"),
        )

    def test_reports_include_salary_advances_without_double_counting_payroll_settlement(self):
        scenario_employee = Employee.objects.create(
            first_name="Advance",
            last_name="Worker",
            email="advance.worker@example.com",
            phone="0799999999",
            address="Kabul",
            department="finance",
            position="Accountant",
            employment_type="full_time",
            hire_date=date(2026, 1, 1),
            salary=Decimal("30000.00"),
        )
        advance = SalaryAdvance.objects.create(
            employee=scenario_employee,
            amount=Decimal("5000.00"),
            remaining_balance=Decimal("5000.00"),
            date=date(2026, 2, 10),
            reason="Emergency advance",
        )
        SalaryAdvance.objects.filter(pk=advance.pk).update(
            remaining_balance=Decimal("0.00"),
            status="deducted",
        )
        Payroll.objects.create(
            employee=scenario_employee,
            payroll_period_start=date(2026, 2, 1),
            payroll_period_end=date(2026, 2, 28),
            basic_salary=Decimal("30000.00"),
            gross_pay=Decimal("30000.00"),
            advance_deductions=Decimal("5000.00"),
            net_pay=Decimal("25000.00"),
            currency="AFN",
            payment_method="cash",
        )

        payroll = self.client.get("/api/reports/payroll/?currency=AFN")
        financial = self.client.get("/api/reports/financial/")
        expenses = self.client.get("/api/reports/expenses/")

        self.assertEqual(payroll.status_code, 200, payroll.data)
        self.assertEqual(payroll.data["summary"]["total_advances"], Decimal("5000.00"))
        self.assertEqual(payroll.data["summary"]["total_advance_deductions"], Decimal("5000.00"))
        self.assertEqual(payroll.data["summary"]["total_cash_outflow"], Decimal("30000.00"))
        self.assertIn(
            "Salary Advance",
            {row["source_type"] for row in payroll.data["rows"]},
        )

        self.assertEqual(
            financial.data["summary"]["employee_advances_paid_afn"],
            Decimal("5000.00"),
        )
        self.assertEqual(
            financial.data["summary"]["payroll_cash_outflow_afn"],
            Decimal("30000.00"),
        )
        self.assertEqual(
            expenses.data["summary"]["employee_advances_paid_afn"],
            Decimal("5000.00"),
        )
        self.assertEqual(
            expenses.data["summary"]["overall_total_outflow_afn"],
            Decimal("5000.00"),
        )

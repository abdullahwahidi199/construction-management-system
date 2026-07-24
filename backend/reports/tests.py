from datetime import date
from decimal import Decimal

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

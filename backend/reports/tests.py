from datetime import date
from decimal import Decimal

from django.contrib.auth import get_user_model
from django.test import TestCase
from rest_framework.test import APITestCase

from Employees.models import Employee, Payroll, PayrollPayment, SalaryAdvance
from dashboard.services import DashboardService
from accounts.models import ProjectAssignment
from common.test_helpers import create_user
from expenses.models import Expense
from expenses.serializers import ExpenseSerializer
from project.models import (
    Apartment,
    ApartmentPayment,
    ApartmentSale,
    Building,
    Customer,
    Floor,
    Project,
)
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
            employment_type="OFFICE",
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
            employment_type="OFFICE",
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

    def test_payroll_report_splits_project_and_office_employee_payroll(self):
        project_employee = Employee.objects.create(
            first_name="Project",
            last_name="Payroll",
            email="project.payroll.report@example.com",
            phone="0700000001",
            address="Kabul",
            department="engineering",
            position="Engineer",
            employment_type=Employee.EmploymentType.PROJECT,
            project=self.project,
            hire_date=date(2026, 1, 1),
            salary=Decimal("700.00"),
        )
        project_payroll = Payroll.objects.create(
            employee=project_employee,
            payroll_period_start=date(2026, 3, 1),
            payroll_period_end=date(2026, 3, 31),
            basic_salary=Decimal("700.00"),
            gross_pay=Decimal("700.00"),
            net_pay=Decimal("700.00"),
            currency="USD",
        )
        PayrollPayment.objects.create(
            payroll=project_payroll,
            amount=Decimal("700.00"),
            payment_date=date(2026, 3, 31),
            payment_method="cash",
        )
        project_payroll.refresh_payment_totals(save=True)

        response = self.client.get("/api/reports/payroll/")
        project_filtered = self.client.get(f"/api/reports/payroll/?employment_type=PROJECT&project_id={self.project.id}")
        office_filtered = self.client.get("/api/reports/payroll/?employment_type=OFFICE")

        self.assertEqual(response.status_code, 200, response.data)
        self.assertEqual(
            response.data["summary"]["project_payroll"][0]["project"],
            self.project.name,
        )
        self.assertEqual(
            response.data["summary"]["project_payroll"][0]["total_paid"],
            Decimal("700.00"),
        )
        self.assertEqual(project_filtered.status_code, 200, project_filtered.data)
        self.assertTrue(
            all(row["payroll_classification"] == "Project Payroll" for row in project_filtered.data["rows"])
        )
        self.assertEqual(office_filtered.status_code, 200, office_filtered.data)
        self.assertTrue(
            all(row["payroll_classification"] == "Office Payroll" for row in office_filtered.data["rows"])
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
            employment_type="OFFICE",
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


class ApartmentReportEndpointTests(APITestCase):
    def setUp(self):
        self.admin = get_user_model().objects.create_superuser(
            username="apartment-report-admin",
            password="pass",
            email="apartment-report-admin@example.com",
        )
        self.client.force_authenticate(self.admin)
        self.project = Project.objects.create(
            name="Apartment Report Project",
            property_type="residential",
            location="Kabul",
            total_floors=2,
            start_date=date(2026, 1, 1),
            estimated_budget=Decimal("100000.00"),
            budget_currency="USD",
            status="ongoing",
        )
        self.building = Building.objects.create(project=self.project, name="Tower A")
        self.floor = Floor.objects.create(building=self.building, floor_number=1)
        self.apartment = Apartment.objects.create(
            project=self.project,
            building=self.building,
            floor=self.floor,
            apartment_number="101",
            status=Apartment.Status.SOLD,
        )
        self.customer = Customer.objects.create(project=self.project, name="Report Customer")
        self.sale = ApartmentSale.objects.create(
            apartment=self.apartment,
            customer=self.customer,
            reference_number="REPORT-SALE-101",
            sale_date=date(2026, 9, 1),
            sale_price=Decimal("100000.00"),
            currency="USD",
            created_by=self.admin,
        )
        self.payment = ApartmentPayment.objects.create(
            sale=self.sale,
            customer=self.customer,
            receipt_number="REPORT-RCPT-101",
            amount=Decimal("40000.00"),
            currency="USD",
            payment_date=date(2026, 9, 2),
            payment_method=ApartmentPayment.Method.BANK_TRANSFER,
            recorded_by=self.admin,
        )

    def test_apartment_reports_use_real_data_filters_and_project_summary(self):
        sales = self.client.get(
            f"/api/reports/apartment-sales/?project_id={self.project.id}&currency=USD&payment_status=PARTIALLY_PAID"
        )
        payments = self.client.get(
            "/api/reports/apartment-payments/?payment_method=BANK_TRANSFER&start_date=2026-09-02"
        )
        outstanding = self.client.get("/api/reports/apartment-outstanding/")
        projects = self.client.get("/api/reports/projects/")

        self.assertEqual(sales.status_code, 200, sales.data)
        self.assertEqual(len(sales.data["rows"]), 1)
        self.assertEqual(sales.data["rows"][0]["customer"], self.customer.name)
        self.assertEqual(sales.data["rows"][0]["total_paid"], Decimal("40000.00"))
        self.assertEqual(sales.data["rows"][0]["remaining"], Decimal("60000.00"))
        self.assertEqual(payments.status_code, 200, payments.data)
        self.assertEqual(payments.data["rows"][0]["receipt_number"], self.payment.receipt_number)
        self.assertEqual(outstanding.status_code, 200, outstanding.data)
        self.assertEqual(len(outstanding.data["rows"]), 1)
        self.assertEqual(projects.status_code, 200, projects.data)
        project_row = projects.data["rows"][0]
        self.assertEqual(project_row["apartments"], 1)
        self.assertEqual(project_row["sold_apartments"], 1)
        self.assertEqual(project_row["apartment_sales_usd"], Decimal("100000.00"))
        self.assertEqual(project_row["apartment_received_usd"], Decimal("40000.00"))
        self.assertEqual(project_row["apartment_outstanding_usd"], Decimal("60000.00"))

    def test_apartment_report_permissions_and_project_scoping(self):
        other_project = Project.objects.create(
            name="Hidden Apartment Project",
            property_type="residential",
            location="Herat",
            total_floors=1,
            start_date=date(2026, 1, 1),
            estimated_budget=Decimal("50000.00"),
            budget_currency="AFN",
            status="ongoing",
        )
        other_building = Building.objects.create(project=other_project, name="Hidden Tower")
        other_floor = Floor.objects.create(building=other_building, floor_number=1)
        other_apartment = Apartment.objects.create(
            project=other_project,
            building=other_building,
            floor=other_floor,
            apartment_number="201",
            status=Apartment.Status.SOLD,
        )
        other_customer = Customer.objects.create(project=other_project, name="Hidden Customer")
        ApartmentSale.objects.create(
            apartment=other_apartment,
            customer=other_customer,
            reference_number="HIDDEN-SALE-201",
            sale_date=date(2026, 9, 1),
            sale_price=Decimal("50000.00"),
            currency="AFN",
            created_by=self.admin,
        )

        reporter = create_user(
            username="apartment-reporter",
            role="apartment_reporter",
            permissions=["projects.view_assigned", "apartment_sales_reports.view"],
        )
        ProjectAssignment.objects.create(user=reporter, project=self.project, assigned_by=self.admin)
        self.client.force_authenticate(reporter)

        sales = self.client.get("/api/reports/apartment-sales/")
        payments = self.client.get("/api/reports/apartment-payments/")
        outstanding = self.client.get("/api/reports/apartment-outstanding/")
        self.assertEqual(sales.status_code, 200, sales.data)
        self.assertEqual([row["sale_reference"] for row in sales.data["rows"]], ["REPORT-SALE-101"])
        self.assertEqual(payments.status_code, 403)
        self.assertEqual(outstanding.status_code, 403)

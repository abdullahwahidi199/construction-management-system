from datetime import date
from decimal import Decimal

from rest_framework.test import APITestCase

from common.test_helpers import (
    create_admin,
    create_contract,
    create_contract_payment,
    create_employee,
    create_payroll,
    create_project,
    create_user,
)
from Employees.models import Employee, PayrollPayment
from project.models import Project


class ProjectAPITests(APITestCase):
    def setUp(self):
        self.admin = create_admin()
        self.client.force_authenticate(self.admin)

    def test_create_project_success(self):
        response = self.client.post(
            "/api/projects/",
            {
                "name": "New Mall",
                "property_type": "commercial",
                "location": "Kabul",
                "start_date": "2026-01-01",
                "status": "planning",
            },
            format="json",
        )

        self.assertEqual(response.status_code, 201, response.data)
        self.assertTrue(Project.objects.filter(name="New Mall").exists())

    def test_project_crud_and_status_change(self):
        project = create_project(status="planning")

        update = self.client.patch(
            f"/api/projects/{project.id}/",
            {"status": "completed", "actual_completion_date": "2026-05-01"},
            format="json",
        )
        self.assertEqual(update.status_code, 200, update.data)
        project.refresh_from_db()
        self.assertEqual(project.status, "completed")

        delete = self.client.delete(f"/api/projects/{project.id}/")
        self.assertEqual(delete.status_code, 204)
        self.assertFalse(Project.objects.filter(id=project.id).exists())

    def test_project_validation_rejects_invalid_choice(self):
        response = self.client.post(
            "/api/projects/",
            {
                "name": "Invalid Property Type",
                "property_type": "castle",
                "location": "Kabul",
                "start_date": "2026-01-01",
            },
            format="json",
        )

        self.assertEqual(response.status_code, 400)
        self.assertIn("property_type", response.data)

    def test_duplicate_project_names_are_currently_allowed(self):
        create_project(name="Duplicate Tower")
        response = self.client.post(
            "/api/projects/",
            {
                "name": "Duplicate Tower",
                "property_type": "commercial",
                "location": "Kabul",
                "start_date": "2026-01-01",
            },
            format="json",
        )

        self.assertEqual(response.status_code, 201, response.data)
        self.assertEqual(Project.objects.filter(name="Duplicate Tower").count(), 2)

    def test_unauthenticated_project_access_is_rejected(self):
        self.client.force_authenticate(None)

        response = self.client.get("/api/projects/")

        self.assertEqual(response.status_code, 401)

    def test_role_without_project_permission_is_forbidden(self):
        user = create_user(
            username="no-projects",
            role="employee",
            permissions=["expenses.view"],
        )
        self.client.force_authenticate(user)

        response = self.client.get("/api/projects/")

        self.assertEqual(response.status_code, 403)

    def test_project_detail_financial_totals_are_currency_separated(self):
        project = create_project(estimated_budget=Decimal("1000.00"), budget_currency="USD")

        response = self.client.get(f"/api/projects/{project.id}/")

        self.assertEqual(response.status_code, 200, response.data)
        self.assertEqual(response.data["budget_currency"], "USD")
        self.assertIn("total_expenses_usd", response.data)
        self.assertIn("total_contract_value", response.data)

    def test_project_detail_handles_contract_without_value(self):
        project = create_project(estimated_budget=Decimal("1000.00"), budget_currency="USD")
        contract = create_contract(project=project, contract_value=None, currency="USD")
        create_contract_payment(contract=contract, amount=Decimal("250.00"))

        response = self.client.get(f"/api/projects/{project.id}/")

        self.assertEqual(response.status_code, 200, response.data)
        self.assertEqual(Decimal(response.data["total_contract_value"]["USD"]), Decimal("0.00"))
        self.assertEqual(Decimal(response.data["total_contract_payments"]["USD"]), Decimal("250.00"))
        self.assertEqual(Decimal(response.data["remaining_contract_balance"]["USD"]), Decimal("0.00"))

    def test_project_detail_includes_only_allocated_employee_payroll(self):
        project = create_project(name="Payroll Project", estimated_budget=Decimal("100000.00"), budget_currency="AFN")
        other_project = create_project(name="Other Payroll Project")
        project_employee = create_employee(
            email="project.payroll@example.com",
            employment_type=Employee.EmploymentType.PROJECT,
            project=project,
            salary=Decimal("40000.00"),
        )
        other_employee = create_employee(
            email="other.payroll@example.com",
            employment_type=Employee.EmploymentType.PROJECT,
            project=other_project,
            salary=Decimal("30000.00"),
        )
        office_employee = create_employee(
            email="office.payroll@example.com",
            employment_type=Employee.EmploymentType.OFFICE,
            project=None,
            salary=Decimal("50000.00"),
        )

        project_payroll = create_payroll(
            employee=project_employee,
            payroll_period_start=date(2026, 7, 1),
            payroll_period_end=date(2026, 7, 31),
            basic_salary=Decimal("40000.00"),
            currency="AFN",
        )
        PayrollPayment.objects.create(
            payroll=project_payroll,
            amount=Decimal("40000.00"),
            payment_date=date(2026, 7, 31),
            payment_method="cash",
        )
        project_payroll.refresh_payment_totals(save=True)
        create_payroll(
            employee=other_employee,
            payroll_period_start=date(2026, 7, 1),
            payroll_period_end=date(2026, 7, 31),
            basic_salary=Decimal("30000.00"),
            currency="AFN",
        )
        create_payroll(
            employee=office_employee,
            payroll_period_start=date(2026, 7, 1),
            payroll_period_end=date(2026, 7, 31),
            basic_salary=Decimal("50000.00"),
            currency="AFN",
        )

        response = self.client.get(f"/api/projects/{project.id}/")

        self.assertEqual(response.status_code, 200, response.data)
        self.assertEqual(response.data["assigned_employee_count"], 1)
        self.assertEqual(
            Decimal(response.data["employee_payroll_summary"]["AFN"]["paid"]),
            Decimal("40000.00"),
        )
        self.assertEqual(len(response.data["payroll_records"]), 1)
        self.assertEqual(response.data["payroll_records"][0]["employee"], project_employee.full_name)

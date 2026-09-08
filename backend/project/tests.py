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
from accounts.models import Permission, ProjectAssignment, RolePermission
from project.models import (
    Apartment,
    ApartmentPayment,
    ApartmentSale,
    Building,
    Customer,
    Floor,
    Project,
)


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


class ApartmentManagementAPITests(APITestCase):
    def setUp(self):
        self.admin = create_admin(username="apartment-admin")
        self.client.force_authenticate(self.admin)
        self.project = create_project(name="Apartment Project")

    def test_building_and_floor_creation(self):
        building_response = self.client.post(
            "/api/projects/buildings/",
            {"project": self.project.id, "name": "Tower A", "description": "East tower"},
            format="json",
        )
        self.assertEqual(building_response.status_code, 201, building_response.data)

        floor_response = self.client.post(
            "/api/projects/floors/",
            {"building": building_response.data["id"], "floor_number": 1, "name": "Ground Floor"},
            format="json",
        )
        self.assertEqual(floor_response.status_code, 201, floor_response.data)
        self.assertEqual(floor_response.data["project"], self.project.id)

        duplicate = self.client.post(
            "/api/projects/floors/",
            {"building": building_response.data["id"], "floor_number": 1},
            format="json",
        )
        self.assertEqual(duplicate.status_code, 400, duplicate.data)

    def test_bulk_floor_creation_is_atomic_and_rejects_duplicates(self):
        building = Building.objects.create(project=self.project, name="Tower B")
        response = self.client.post(
            "/api/projects/floors/bulk/",
            {
                "building": building.id,
                "rows": [
                    {"floor_number": 1, "name": "Ground Floor"},
                    {"floor_number": 2, "name": "First Floor"},
                ],
            },
            format="json",
        )
        self.assertEqual(response.status_code, 201, response.data)
        self.assertEqual(Floor.objects.filter(building=building).count(), 2)

        duplicate_response = self.client.post(
            "/api/projects/floors/bulk/",
            {
                "building": building.id,
                "rows": [
                    {"floor_number": 3},
                    {"floor_number": 2},
                ],
            },
            format="json",
        )
        self.assertEqual(duplicate_response.status_code, 400, duplicate_response.data)
        self.assertEqual(Floor.objects.filter(building=building).count(), 2)
        self.assertIn("rows", duplicate_response.data["errors"])

    def test_apartment_creation_defaults_available_and_validates_relationships(self):
        building = Building.objects.create(project=self.project, name="Tower C")
        floor = Floor.objects.create(building=building, floor_number=1)
        response = self.client.post(
            "/api/projects/apartments/",
            {
                "project": self.project.id,
                "building": building.id,
                "floor": floor.id,
                "apartment_number": "101",
                "apartment_type": "Two bedroom",
                "area": "95.50",
                "bedrooms": 2,
            },
            format="json",
        )
        self.assertEqual(response.status_code, 201, response.data)
        self.assertEqual(response.data["status"], Apartment.Status.AVAILABLE)

        duplicate = self.client.post(
            "/api/projects/apartments/",
            {
                "project": self.project.id,
                "building": building.id,
                "floor": floor.id,
                "apartment_number": "101",
            },
            format="json",
        )
        self.assertEqual(duplicate.status_code, 400, duplicate.data)

        other_project = create_project(name="Other Apartment Project")
        other_building = Building.objects.create(project=other_project, name="Other Tower")
        other_floor = Floor.objects.create(building=other_building, floor_number=1)
        invalid = self.client.post(
            "/api/projects/apartments/",
            {
                "project": self.project.id,
                "building": building.id,
                "floor": other_floor.id,
                "apartment_number": "102",
            },
            format="json",
        )
        self.assertEqual(invalid.status_code, 400, invalid.data)
        self.assertFalse(Apartment.objects.filter(apartment_number="102").exists())

    def test_bulk_apartment_creation_is_atomic_and_rejects_duplicates(self):
        building = Building.objects.create(project=self.project, name="Tower D")
        floor = Floor.objects.create(building=building, floor_number=4)
        response = self.client.post(
            "/api/projects/apartments/bulk/",
            {
                "project": self.project.id,
                "building": building.id,
                "floor": floor.id,
                "rows": [
                    {"apartment_number": "401", "area": "80", "bedrooms": 2},
                    {"apartment_number": "402", "apartment_type": "Studio"},
                ],
            },
            format="json",
        )
        self.assertEqual(response.status_code, 201, response.data)
        self.assertEqual(Apartment.objects.filter(floor=floor).count(), 2)

        duplicate_response = self.client.post(
            "/api/projects/apartments/bulk/",
            {
                "project": self.project.id,
                "building": building.id,
                "floor": floor.id,
                "rows": [
                    {"apartment_number": "403"},
                    {"apartment_number": "403"},
                ],
            },
            format="json",
        )
        self.assertEqual(duplicate_response.status_code, 400, duplicate_response.data)
        self.assertEqual(Apartment.objects.filter(floor=floor).count(), 2)
        self.assertIn("rows", duplicate_response.data["errors"])

        existing_response = self.client.post(
            "/api/projects/apartments/bulk/",
            {
                "project": self.project.id,
                "building": building.id,
                "floor": floor.id,
                "rows": [{"apartment_number": "401"}],
            },
            format="json",
        )
        self.assertEqual(existing_response.status_code, 400, existing_response.data)
        self.assertEqual(Apartment.objects.filter(floor=floor).count(), 2)

    def test_building_floor_and_apartment_full_crud(self):
        building = self.client.post(
            "/api/projects/buildings/",
            {"project": self.project.id, "name": "CRUD Tower"},
            format="json",
        )
        self.assertEqual(building.status_code, 201, building.data)
        building_id = building.data["id"]
        updated_building = self.client.patch(
            f"/api/projects/buildings/{building_id}/",
            {"name": "Updated Tower"},
            format="json",
        )
        self.assertEqual(updated_building.status_code, 200, updated_building.data)

        floor = self.client.post(
            "/api/projects/floors/",
            {"building": building_id, "floor_number": 1, "name": "Ground"},
            format="json",
        )
        self.assertEqual(floor.status_code, 201, floor.data)
        floor_id = floor.data["id"]
        updated_floor = self.client.patch(
            f"/api/projects/floors/{floor_id}/",
            {"name": "Ground Floor"},
            format="json",
        )
        self.assertEqual(updated_floor.status_code, 200, updated_floor.data)

        apartment = self.client.post(
            "/api/projects/apartments/",
            {
                "project": self.project.id,
                "building": building_id,
                "floor": floor_id,
                "apartment_number": "G-01",
            },
            format="json",
        )
        self.assertEqual(apartment.status_code, 201, apartment.data)
        apartment_id = apartment.data["id"]
        detail = self.client.get(f"/api/projects/apartments/{apartment_id}/")
        self.assertEqual(detail.status_code, 200, detail.data)
        updated_apartment = self.client.patch(
            f"/api/projects/apartments/{apartment_id}/",
            {"description": "Garden-facing"},
            format="json",
        )
        self.assertEqual(updated_apartment.status_code, 200, updated_apartment.data)
        self.assertEqual(updated_apartment.data["description"], "Garden-facing")

        other_project = create_project(name="CRUD Other Project")
        other_building = Building.objects.create(project=other_project, name="Other CRUD Tower")
        invalid_building_move = self.client.patch(
            f"/api/projects/buildings/{building_id}/",
            {"project": other_project.id},
            format="json",
        )
        invalid_floor_move = self.client.patch(
            f"/api/projects/floors/{floor_id}/",
            {"building": other_building.id},
            format="json",
        )
        self.assertEqual(invalid_building_move.status_code, 400, invalid_building_move.data)
        self.assertEqual(invalid_floor_move.status_code, 400, invalid_floor_move.data)

        self.assertEqual(self.client.delete(f"/api/projects/apartments/{apartment_id}/").status_code, 204)
        self.assertEqual(self.client.delete(f"/api/projects/floors/{floor_id}/").status_code, 204)
        self.assertEqual(self.client.delete(f"/api/projects/buildings/{building_id}/").status_code, 204)

    def test_apartment_permissions_are_assignable_and_enforced_per_action(self):
        required_codes = {
            "buildings.view", "buildings.create", "buildings.update", "buildings.delete",
            "floors.view", "floors.create", "floors.update", "floors.delete", "floors.bulk_create",
            "apartments.view", "apartments.create", "apartments.update", "apartments.delete",
            "apartments.bulk_create", "apartment_sales.view", "apartment_sales.create",
            "apartment_sales.update", "apartment_sales.cancel",
            "apartment_payments.view", "apartment_payments.create",
            "apartment_sales_reports.view", "apartment_payment_reports.view",
            "apartment_outstanding_reports.view",
        }
        self.assertTrue(required_codes.issubset(set(Permission.objects.values_list("code", flat=True))))

        building = Building.objects.create(project=self.project, name="Permission Tower")
        user = create_user(
            username="building-viewer",
            role="building_viewer",
            permissions=["projects.view_assigned", "buildings.view", "floors.create"],
        )
        ProjectAssignment.objects.create(user=user, project=self.project, assigned_by=self.admin)
        self.client.force_authenticate(user)
        self.assertEqual(self.client.get("/api/projects/buildings/").status_code, 200)
        self.assertEqual(
            self.client.post(
                "/api/projects/buildings/",
                {"project": self.project.id, "name": "Forbidden"},
                format="json",
            ).status_code,
            403,
        )
        self.assertEqual(
            self.client.post(
                "/api/projects/floors/bulk/",
                {"building": building.id, "rows": [{"floor_number": 2}]},
                format="json",
            ).status_code,
            403,
        )

        create_permission = Permission.objects.get(code="buildings.create")
        RolePermission.objects.create(role="building_viewer", permission=create_permission)
        allowed = self.client.post(
            "/api/projects/buildings/",
            {"project": self.project.id, "name": "Allowed"},
            format="json",
        )
        self.assertEqual(allowed.status_code, 201, allowed.data)

    def test_apartment_management_actions_require_their_exact_permissions(self):
        building = Building.objects.create(project=self.project, name="Exact Permission Tower")
        floor = Floor.objects.create(building=building, floor_number=1)
        apartment = Apartment.objects.create(
            project=self.project,
            building=building,
            floor=floor,
            apartment_number="EP-101",
        )
        user = create_user(
            username="apartment-exact-actions",
            role="apartment_exact_actions",
            permissions=[
                "projects.view_assigned",
                "buildings.update",
                "floors.bulk_create",
                "apartments.delete",
            ],
        )
        ProjectAssignment.objects.create(user=user, project=self.project, assigned_by=self.admin)
        self.client.force_authenticate(user)

        self.assertEqual(self.client.get("/api/projects/buildings/").status_code, 403)
        self.assertEqual(
            self.client.post(
                "/api/projects/buildings/",
                {"project": self.project.id, "name": "Not Allowed"},
                format="json",
            ).status_code,
            403,
        )
        updated = self.client.patch(
            f"/api/projects/buildings/{building.id}/",
            {"name": "Updated With Exact Permission"},
            format="json",
        )
        self.assertEqual(updated.status_code, 200, updated.data)
        self.assertEqual(self.client.delete(f"/api/projects/buildings/{building.id}/").status_code, 403)

        bulk_floor = self.client.post(
            "/api/projects/floors/bulk/",
            {"building": building.id, "rows": [{"floor_number": 2}]},
            format="json",
        )
        self.assertEqual(bulk_floor.status_code, 201, bulk_floor.data)
        self.assertEqual(
            self.client.post(
                "/api/projects/floors/",
                {"building": building.id, "floor_number": 3},
                format="json",
            ).status_code,
            403,
        )

        self.assertEqual(
            self.client.patch(
                f"/api/projects/apartments/{apartment.id}/",
                {"description": "Not Allowed"},
                format="json",
            ).status_code,
            403,
        )
        self.assertEqual(
            self.client.post(
                "/api/projects/apartments/bulk/",
                {
                    "project": self.project.id,
                    "building": building.id,
                    "floor": floor.id,
                    "rows": [{"apartment_number": "EP-102"}],
                },
                format="json",
            ).status_code,
            403,
        )
        self.assertEqual(
            self.client.delete(f"/api/projects/apartments/{apartment.id}/").status_code,
            204,
        )

class ApartmentSalesPaymentAPITests(APITestCase):
    def setUp(self):
        self.admin = create_admin(username="sales-admin")
        self.client.force_authenticate(self.admin)
        self.project = create_project(name="Sales Project")
        self.building = Building.objects.create(project=self.project, name="Sales Tower")
        self.floor = Floor.objects.create(building=self.building, floor_number=1)
        self.apartment = Apartment.objects.create(
            project=self.project,
            building=self.building,
            floor=self.floor,
            apartment_number="101",
        )
        self.customer = Customer.objects.create(
            project=self.project,
            name="Amina Ahmadi",
            phone="0700000000",
            address="Kabul, Afghanistan",
        )

    def create_sale(self, **overrides):
        payload = {
            "apartment": self.apartment.id,
            "customer": self.customer.id,
            "reference_number": "SALE-101",
            "sale_date": "2026-09-01",
            "sale_price": "100000.00",
            "currency": "USD",
            "notes": "Primary sale",
        }
        payload.update(overrides)
        return self.client.post("/api/projects/apartment-sales/", payload, format="json")

    def create_payment(self, sale, **overrides):
        payload = {
            "sale": sale.id,
            "customer": self.customer.id,
            "receipt_number": "RCPT-101",
            "amount": "40000.00",
            "currency": "USD",
            "payment_date": "2026-09-02",
            "payment_method": "BANK_TRANSFER",
            "reference": "BANK-1",
        }
        payload.update(overrides)
        return self.client.post("/api/projects/apartment-payments/", payload, format="json")

    def test_apartment_can_be_sold_only_once_and_becomes_sold(self):
        response = self.create_sale()
        self.assertEqual(response.status_code, 201, response.data)
        self.apartment.refresh_from_db()
        sale = ApartmentSale.objects.get(apartment=self.apartment)

        self.assertEqual(self.apartment.status, Apartment.Status.SOLD)
        self.assertEqual(sale.customer, self.customer)
        self.assertEqual(sale.created_by, self.admin)
        self.assertEqual(Decimal(response.data["total_paid"]), Decimal("0.00"))
        self.assertEqual(Decimal(response.data["remaining_balance"]), Decimal("100000.00"))
        self.assertEqual(response.data["payment_status"], ApartmentSale.PaymentStatus.UNPAID)
        self.assertEqual(response.data["customer_address"], "Kabul, Afghanistan")

        second = self.create_sale(reference_number="SALE-101-SECOND")
        self.assertEqual(second.status_code, 400, second.data)
        self.assertEqual(ApartmentSale.objects.filter(apartment=self.apartment).count(), 1)

    def test_sale_and_payment_identifiers_are_generated_by_the_server(self):
        response = self.client.post(
            "/api/projects/apartment-sales/",
            {
                "apartment": self.apartment.id,
                "customer": self.customer.id,
                "sale_date": "2026-09-01",
                "sale_price": "100000.00",
                "currency": "USD",
            },
            format="json",
        )
        self.assertEqual(response.status_code, 201, response.data)
        self.assertTrue(response.data["reference_number"].startswith("SALE-"))

        payment = self.client.post(
            "/api/projects/apartment-payments/",
            {
                "sale": response.data["id"],
                "customer": self.customer.id,
                "amount": "1000.00",
                "currency": "USD",
                "payment_date": "2026-09-02",
                "payment_method": "CASH",
            },
            format="json",
        )
        self.assertEqual(payment.status_code, 201, payment.data)
        self.assertTrue(payment.data["receipt_number"].startswith("RCPT-"))

    def test_sale_can_be_edited_cancelled_excluded_and_apartment_resold(self):
        sale_response = self.create_sale()
        sale_id = sale_response.data["id"]
        original_reference = sale_response.data["reference_number"]
        sale = ApartmentSale.objects.get(pk=sale_id)
        self.create_payment(sale)

        edited = self.client.patch(
            f"/api/projects/apartment-sales/{sale_id}/",
            {
                "sale_date": "2026-09-03",
                "sale_price": "120000.00",
                "currency": "AFN",
                "notes": "Corrected sale details",
            },
            format="json",
        )
        self.assertEqual(edited.status_code, 200, edited.data)
        self.assertEqual(edited.data["reference_number"], original_reference)
        self.assertEqual(Decimal(edited.data["remaining_balance"]), Decimal("80000.00"))
        self.assertEqual(edited.data["currency"], "AFN")
        self.assertEqual(edited.data["payments"][0]["currency"], "AFN")

        missing_reason = self.client.post(f"/api/projects/apartment-sales/{sale_id}/cancel/")
        self.assertEqual(missing_reason.status_code, 400, missing_reason.data)
        self.assertIn("cancellation_reason", missing_reason.data["errors"])
        cancelled = self.client.post(
            f"/api/projects/apartment-sales/{sale_id}/cancel/",
            {"reason": "Buyer withdrew from the agreement"},
            format="json",
        )
        self.assertEqual(cancelled.status_code, 200, cancelled.data)
        self.assertEqual(cancelled.data["status"], ApartmentSale.Status.CANCELLED)
        self.assertEqual(cancelled.data["payment_status"], ApartmentSale.PaymentStatus.CANCELLED)
        self.assertIsNotNone(cancelled.data["cancelled_at"])
        self.assertEqual(cancelled.data["cancellation_reason"], "Buyer withdrew from the agreement")
        self.apartment.refresh_from_db()
        self.assertEqual(self.apartment.status, Apartment.Status.AVAILABLE)

        rejected_payment = self.create_payment(sale, amount="1000.00")
        self.assertEqual(rejected_payment.status_code, 400, rejected_payment.data)
        self.assertIn("sale", rejected_payment.data["errors"])

        sales_report = self.client.get("/api/reports/apartment-sales/")
        payments_report = self.client.get("/api/reports/apartment-payments/")
        outstanding_report = self.client.get("/api/reports/apartment-outstanding/")
        project_report = self.client.get("/api/reports/projects/")
        dashboard = self.client.get("/api/dashboard/apartments/")
        self.assertEqual(sales_report.data["rows"], [])
        self.assertEqual(sales_report.data["summary"]["cancelled_sales"], 1)
        self.assertEqual(
            sales_report.data["summary"]["cancelled_sales_worth_afn"],
            Decimal("120000.00"),
        )
        self.assertEqual(payments_report.data["rows"], [])
        self.assertEqual(outstanding_report.data["rows"], [])
        self.assertEqual(project_report.data["rows"][0]["sold_apartments"], 0)
        self.assertEqual(project_report.data["rows"][0]["cancelled_apartment_sales"], 1)
        self.assertEqual(dashboard.data["sale_count"], 0)
        self.assertEqual(dashboard.data["cancelled_sale_count"], 1)
        self.assertEqual(dashboard.data["currencies"]["AFN"]["sales"], Decimal("0.00"))
        self.assertEqual(dashboard.data["currencies"]["AFN"]["cancelled"], Decimal("120000.00"))

        resale = self.client.post(
            "/api/projects/apartment-sales/",
            {
                "apartment": self.apartment.id,
                "customer": self.customer.id,
                "sale_date": "2026-09-04",
                "sale_price": "125000.00",
                "currency": "USD",
            },
            format="json",
        )
        self.assertEqual(resale.status_code, 201, resale.data)
        self.assertNotEqual(resale.data["reference_number"], original_reference)
        self.assertEqual(ApartmentSale.objects.filter(apartment=self.apartment).count(), 2)

    def test_payments_update_calculated_totals_and_status(self):
        sale_response = self.create_sale()
        sale = ApartmentSale.objects.get(pk=sale_response.data["id"])

        first = self.create_payment(sale)
        self.assertEqual(first.status_code, 201, first.data)
        self.assertEqual(ApartmentPayment.objects.get(pk=first.data["id"]).recorded_by, self.admin)

        detail = self.client.get(f"/api/projects/apartment-sales/{sale.id}/")
        self.assertEqual(Decimal(detail.data["total_paid"]), Decimal("40000.00"))
        self.assertEqual(Decimal(detail.data["remaining_balance"]), Decimal("60000.00"))
        self.assertEqual(detail.data["payment_status"], ApartmentSale.PaymentStatus.PARTIALLY_PAID)
        self.assertEqual(len(detail.data["payments"]), 1)

        final = self.create_payment(
            sale,
            receipt_number="RCPT-102",
            amount="60000.00",
            payment_method="CASH",
        )
        self.assertEqual(final.status_code, 201, final.data)
        paid_detail = self.client.get(f"/api/projects/apartment-sales/{sale.id}/")
        self.assertEqual(Decimal(paid_detail.data["remaining_balance"]), Decimal("0.00"))
        self.assertEqual(paid_detail.data["payment_status"], ApartmentSale.PaymentStatus.PAID)

    def test_invalid_payment_customer_currency_and_overpayment_are_rejected(self):
        sale_response = self.create_sale()
        sale = ApartmentSale.objects.get(pk=sale_response.data["id"])
        other_customer = Customer.objects.create(project=self.project, name="Other Customer")

        wrong_customer = self.create_payment(sale, customer=other_customer.id)
        self.assertEqual(wrong_customer.status_code, 400, wrong_customer.data)
        wrong_currency = self.create_payment(sale, receipt_number="RCPT-102", currency="AFN")
        self.assertEqual(wrong_currency.status_code, 400, wrong_currency.data)
        overpayment = self.create_payment(sale, receipt_number="RCPT-103", amount="100000.01")
        self.assertEqual(overpayment.status_code, 400, overpayment.data)
        self.assertEqual(ApartmentPayment.objects.filter(sale=sale).count(), 0)

        invalid_sale_currency = self.client.post(
            "/api/projects/apartment-sales/",
            {
                "apartment": self.apartment.id,
                "customer": self.customer.id,
                "reference_number": "SALE-BAD-CURRENCY",
                "sale_date": "2026-09-01",
                "sale_price": "100000.00",
                "currency": "EUR",
            },
            format="json",
        )
        self.assertEqual(invalid_sale_currency.status_code, 400, invalid_sale_currency.data)

    def test_sales_filters_outstanding_report_and_currency_summary(self):
        sale_response = self.create_sale()
        sale = ApartmentSale.objects.get(pk=sale_response.data["id"])
        self.create_payment(sale)

        filtered_urls = (
            f"/api/projects/apartment-sales/?project={self.project.id}",
            f"/api/projects/apartment-sales/?building={self.building.id}",
            f"/api/projects/apartment-sales/?customer={self.customer.id}",
            f"/api/projects/apartment-sales/?apartment={self.apartment.id}",
            "/api/projects/apartment-sales/?date=2026-09-01",
            "/api/projects/apartment-sales/?payment_status=PARTIALLY_PAID",
            "/api/projects/apartment-sales/?outstanding=true",
        )
        for url in filtered_urls:
            response = self.client.get(url)
            self.assertEqual(response.status_code, 200, response.data)
            self.assertEqual([item["id"] for item in response.data], [sale.id])
            self.assertEqual(response.data[0]["project_name"], self.project.name)
            self.assertEqual(response.data[0]["building"], self.building.id)

        paid_filter = self.client.get(
            "/api/projects/apartment-sales/?payment_status=PAID"
        )
        self.assertEqual(paid_filter.status_code, 200, paid_filter.data)
        self.assertEqual(paid_filter.data, [])

        second_apartment = Apartment.objects.create(
            project=self.project,
            building=self.building,
            floor=self.floor,
            apartment_number="102",
            status=Apartment.Status.SOLD,
        )
        afn_sale = ApartmentSale.objects.create(
            apartment=second_apartment,
            customer=self.customer,
            reference_number="SALE-102-AFN",
            sale_date=date(2026, 9, 3),
            sale_price=Decimal("200000.00"),
            currency="AFN",
            created_by=self.admin,
        )
        ApartmentPayment.objects.create(
            sale=afn_sale,
            customer=self.customer,
            receipt_number="RCPT-102-AFN",
            amount=Decimal("50000.00"),
            currency="AFN",
            payment_date=date(2026, 9, 4),
            payment_method=ApartmentPayment.Method.CASH,
            recorded_by=self.admin,
        )

        project_detail = self.client.get(f"/api/projects/{self.project.id}/")
        self.assertEqual(project_detail.status_code, 200, project_detail.data)
        summary = project_detail.data["apartment_summary"]
        self.assertEqual(summary["total"], 2)
        self.assertEqual(summary["available"], 0)
        self.assertEqual(summary["sold"], 2)
        self.assertEqual(Decimal(summary["currencies"]["USD"]["sales"]), Decimal("100000.00"))
        self.assertEqual(Decimal(summary["currencies"]["USD"]["received"]), Decimal("40000.00"))
        self.assertEqual(Decimal(summary["currencies"]["USD"]["outstanding"]), Decimal("60000.00"))
        self.assertEqual(Decimal(summary["currencies"]["AFN"]["sales"]), Decimal("200000.00"))
        self.assertEqual(Decimal(summary["currencies"]["AFN"]["received"]), Decimal("50000.00"))
        self.assertEqual(Decimal(summary["currencies"]["AFN"]["outstanding"]), Decimal("150000.00"))

    def test_sales_and_payments_follow_project_permissions_and_scoping(self):
        sale_response = self.create_sale()
        sale = ApartmentSale.objects.get(pk=sale_response.data["id"])
        self.create_payment(sale)

        other_project = create_project(name="Unassigned Sales Project")
        other_building = Building.objects.create(project=other_project, name="Other Tower")
        other_floor = Floor.objects.create(building=other_building, floor_number=1)
        other_apartment = Apartment.objects.create(
            project=other_project,
            building=other_building,
            floor=other_floor,
            apartment_number="201",
            status=Apartment.Status.SOLD,
        )
        other_customer = Customer.objects.create(project=other_project, name="Other Project Customer")
        ApartmentSale.objects.create(
            apartment=other_apartment,
            customer=other_customer,
            reference_number="SALE-201",
            sale_date=date(2026, 9, 1),
            sale_price=Decimal("50000.00"),
            currency="USD",
            created_by=self.admin,
        )

        assigned_user = create_user(
            username="assigned-sales-user",
            role="employee",
            permissions=[
                "projects.view_assigned",
                "apartment_sales.view",
                "apartment_payments.view",
            ],
        )
        ProjectAssignment.objects.create(user=assigned_user, project=self.project, assigned_by=self.admin)
        self.client.force_authenticate(assigned_user)

        sales = self.client.get("/api/projects/apartment-sales/")
        payments = self.client.get("/api/projects/apartment-payments/")
        customers = self.client.get("/api/projects/apartment-customers/")
        self.assertEqual(sales.status_code, 200, sales.data)
        self.assertEqual([item["id"] for item in sales.data], [sale.id])
        self.assertEqual(len(payments.data), 1)
        self.assertEqual([item["id"] for item in customers.data], [self.customer.id])

        project_detail = self.client.get(f"/api/projects/{self.project.id}/")
        other_project_detail = self.client.get(f"/api/projects/{other_project.id}/")
        self.assertEqual(project_detail.status_code, 200, project_detail.data)
        self.assertEqual(other_project_detail.status_code, 404, other_project_detail.data)

        self.client.force_authenticate(None)
        self.assertEqual(self.client.get("/api/projects/apartment-sales/").status_code, 401)

    def test_sale_and_payment_actions_require_their_exact_permissions(self):
        sale_response = self.create_sale()
        self.assertEqual(sale_response.status_code, 201, sale_response.data)
        sale = ApartmentSale.objects.get(pk=sale_response.data["id"])

        editor = create_user(
            username="sale-exact-editor",
            role="sale_exact_editor",
            permissions=["projects.view_assigned", "apartment_sales.update"],
        )
        ProjectAssignment.objects.create(user=editor, project=self.project, assigned_by=self.admin)
        self.client.force_authenticate(editor)
        edited = self.client.patch(
            f"/api/projects/apartment-sales/{sale.id}/",
            {"notes": "Edited with update permission"},
            format="json",
        )
        self.assertEqual(edited.status_code, 200, edited.data)
        self.assertEqual(self.client.get(f"/api/projects/apartment-sales/{sale.id}/").status_code, 403)
        self.assertEqual(self.client.get("/api/projects/apartment-customers/").status_code, 200)
        self.assertEqual(
            self.client.post(
                f"/api/projects/apartment-sales/{sale.id}/cancel/",
                {"reason": "Must not be accepted"},
                format="json",
            ).status_code,
            403,
        )

        payment_recorder = create_user(
            username="payment-exact-recorder",
            role="payment_exact_recorder",
            permissions=["projects.view_assigned", "apartment_payments.create"],
        )
        ProjectAssignment.objects.create(
            user=payment_recorder,
            project=self.project,
            assigned_by=self.admin,
        )
        self.client.force_authenticate(payment_recorder)
        payment = self.client.post(
            "/api/projects/apartment-payments/",
            {
                "sale": sale.id,
                "customer": self.customer.id,
                "amount": "1000.00",
                "currency": "USD",
                "payment_date": "2026-09-03",
                "payment_method": "CASH",
            },
            format="json",
        )
        self.assertEqual(payment.status_code, 201, payment.data)
        self.assertEqual(self.client.get("/api/projects/apartment-payments/").status_code, 403)
        self.assertEqual(
            self.client.patch(
                f"/api/projects/apartment-sales/{sale.id}/",
                {"notes": "Must not be accepted"},
                format="json",
            ).status_code,
            403,
        )

        viewer = create_user(
            username="sale-exact-viewer",
            role="sale_exact_viewer",
            permissions=[
                "projects.view_assigned",
                "apartment_sales.view",
                "apartment_payments.view",
            ],
        )
        ProjectAssignment.objects.create(user=viewer, project=self.project, assigned_by=self.admin)
        self.client.force_authenticate(viewer)
        self.assertEqual(self.client.get(f"/api/projects/apartment-sales/{sale.id}/").status_code, 200)
        self.assertEqual(self.client.get("/api/projects/apartment-payments/").status_code, 200)
        self.assertEqual(
            self.client.patch(
                f"/api/projects/apartment-sales/{sale.id}/",
                {"notes": "Must not be accepted"},
                format="json",
            ).status_code,
            403,
        )
        self.assertEqual(
            self.client.post(
                "/api/projects/apartment-payments/",
                {
                    "sale": sale.id,
                    "customer": self.customer.id,
                    "amount": "1000.00",
                    "currency": "USD",
                    "payment_date": "2026-09-04",
                    "payment_method": "CASH",
                },
                format="json",
            ).status_code,
            403,
        )

        canceller = create_user(
            username="sale-exact-canceller",
            role="sale_exact_canceller",
            permissions=["projects.view_assigned", "apartment_sales.cancel"],
        )
        ProjectAssignment.objects.create(user=canceller, project=self.project, assigned_by=self.admin)
        self.client.force_authenticate(canceller)
        self.assertEqual(
            self.client.patch(
                f"/api/projects/apartment-sales/{sale.id}/",
                {"notes": "Must not be accepted"},
                format="json",
            ).status_code,
            403,
        )
        cancelled = self.client.post(
            f"/api/projects/apartment-sales/{sale.id}/cancel/",
            {"reason": "Approved cancellation reason"},
            format="json",
        )
        self.assertEqual(cancelled.status_code, 200, cancelled.data)
        self.assertEqual(cancelled.data["status"], ApartmentSale.Status.CANCELLED)


class CompleteApartmentWorkflowAPITests(APITestCase):
    def test_complete_apartment_sale_and_payment_workflow(self):
        admin = create_admin(username="complete-apartment-admin")
        self.client.force_authenticate(admin)
        project = create_project(name="Complete Apartment Workflow")

        building = self.client.post(
            "/api/projects/buildings/",
            {"project": project.id, "name": "Tower A", "description": "Residential tower"},
            format="json",
        )
        self.assertEqual(building.status_code, 201, building.data)
        floors = self.client.post(
            "/api/projects/floors/bulk/",
            {
                "building": building.data["id"],
                "rows": [{"floor_number": 1, "name": "Ground"}, {"floor_number": 2, "name": "First"}],
            },
            format="json",
        )
        self.assertEqual(floors.status_code, 201, floors.data)
        apartments = self.client.post(
            "/api/projects/apartments/bulk/",
            {
                "project": project.id,
                "building": building.data["id"],
                "floor": floors.data[0]["id"],
                "rows": [
                    {"apartment_number": "101", "apartment_type": "2BR", "area": "120", "bedrooms": 2},
                    {"apartment_number": "102", "apartment_type": "3BR", "area": "150", "bedrooms": 3},
                ],
            },
            format="json",
        )
        self.assertEqual(apartments.status_code, 201, apartments.data)
        self.assertTrue(all(row["status"] == Apartment.Status.AVAILABLE for row in apartments.data))
        customer = self.client.post(
            "/api/projects/apartment-customers/",
            {"project": project.id, "name": "Workflow Customer", "phone": "0700000000", "notes": "Buyer"},
            format="json",
        )
        self.assertEqual(customer.status_code, 201, customer.data)
        sale = self.client.post(
            "/api/projects/apartment-sales/",
            {
                "apartment": apartments.data[0]["id"],
                "customer": customer.data["id"],
                "reference_number": "COMPLETE-SALE-101",
                "sale_date": "2026-09-06",
                "sale_price": "100000.00",
                "currency": "USD",
            },
            format="json",
        )
        self.assertEqual(sale.status_code, 201, sale.data)
        self.assertEqual(sale.data["payment_status"], ApartmentSale.PaymentStatus.UNPAID)

        for receipt, amount in (("COMPLETE-RCPT-1", "40000.00"), ("COMPLETE-RCPT-2", "60000.00")):
            payment = self.client.post(
                "/api/projects/apartment-payments/",
                {
                    "sale": sale.data["id"],
                    "customer": customer.data["id"],
                    "receipt_number": receipt,
                    "amount": amount,
                    "currency": "USD",
                    "payment_date": "2026-09-06",
                    "payment_method": "CASH",
                },
                format="json",
            )
            self.assertEqual(payment.status_code, 201, payment.data)

        detail = self.client.get(f"/api/projects/apartment-sales/{sale.data['id']}/")
        self.assertEqual(detail.status_code, 200, detail.data)
        self.assertEqual(detail.data["total_paid"], "100000.00")
        self.assertEqual(detail.data["remaining_balance"], "0.00")
        self.assertEqual(detail.data["payment_status"], ApartmentSale.PaymentStatus.PAID)
        self.assertEqual(len(detail.data["payments"]), 2)
        self.assertEqual(self.client.get("/api/projects/apartment-sales/?outstanding=true").data, [])

        sales_report = self.client.get("/api/reports/apartment-sales/")
        payment_report = self.client.get("/api/reports/apartment-payments/")
        outstanding_report = self.client.get("/api/reports/apartment-outstanding/")
        dashboard = self.client.get("/api/dashboard/apartments/")
        permission_meta = self.client.get("/api/auth/meta/")
        self.assertEqual(len(sales_report.data["rows"]), 1)
        self.assertEqual(len(payment_report.data["rows"]), 2)
        self.assertEqual(outstanding_report.data["rows"], [])
        self.assertEqual(dashboard.data["inventory"], {"total": 2, "available": 1, "sold": 1})
        self.assertEqual(dashboard.data["currencies"]["USD"]["received"], Decimal("100000.00"))
        permission_codes = {item["code"] for item in permission_meta.data["permissions"]}
        self.assertIn("apartments.bulk_create", permission_codes)
        self.assertIn("apartment_outstanding_reports.view", permission_codes)

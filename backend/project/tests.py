from datetime import date
from decimal import Decimal

from rest_framework.test import APITestCase

from common.test_helpers import create_admin, create_project, create_user
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

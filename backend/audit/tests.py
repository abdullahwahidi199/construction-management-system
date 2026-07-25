from datetime import date
from decimal import Decimal

from django.contrib.auth import get_user_model
from django.test import TestCase
from rest_framework.test import APITestCase

from audit.models import AuditLog
from expenses.models import Expense
from project.models import Project


class AuditSignalTests(APITestCase):
    def setUp(self):
        self.user = get_user_model().objects.create_superuser(
            username="audit-admin",
            password="pass12345",
            email="audit@example.com",
        )
        self.client.force_authenticate(self.user)

    def test_project_create_and_budget_change_are_audited(self):
        project = Project.objects.create(
            name="Audit Project",
            property_type="commercial",
            location="Kabul",
            total_floors=4,
            start_date=date(2026, 1, 1),
            estimated_budget=Decimal("1000.00"),
            budget_currency="USD",
        )
        project.estimated_budget = Decimal("1200.00")
        project.save()

        self.assertTrue(
            AuditLog.objects.filter(
                action="project.budget_change",
                model_name="Project",
                object_id=str(project.id),
                extra_metadata__currency="USD",
            ).exists()
        )

    def test_financial_currency_change_records_warning(self):
        project = Project.objects.create(
            name="Currency Audit",
            property_type="commercial",
            location="Kabul",
            total_floors=4,
            start_date=date(2026, 1, 1),
            estimated_budget=Decimal("1000.00"),
            budget_currency="USD",
        )

        project.budget_currency = "AFN"
        project.save()

        log = AuditLog.objects.filter(action="project.budget_change").latest("timestamp")
        self.assertEqual(log.extra_metadata["currency_change"]["old"], "USD")
        self.assertIn("Currency changed", log.extra_metadata["warnings"][0])

    def test_sensitive_fields_are_masked(self):
        target = get_user_model().objects.create_user(
            username="masked-user",
            password="secret-pass",
            email="masked@example.com",
        )

        log = AuditLog.objects.filter(model_name="User", object_id=str(target.id)).latest("timestamp")
        self.assertEqual(log.new_data["password"], "***")
        self.assertIn("***@", log.new_data["email"])


class AuditAPITests(APITestCase):
    def setUp(self):
        self.user = get_user_model().objects.create_superuser(
            username="api-auditor",
            password="pass12345",
            email="api-audit@example.com",
        )
        self.client.force_authenticate(self.user)
        self.project = Project.objects.create(
            name="API Audit Project",
            property_type="commercial",
            location="Kabul",
            total_floors=4,
            start_date=date(2026, 1, 1),
            estimated_budget=Decimal("1000.00"),
            budget_currency="USD",
        )

    def test_audit_list_detail_and_summary(self):
        response = self.client.get("/api/audit/logs/")
        self.assertEqual(response.status_code, 200, response.data)
        self.assertGreaterEqual(response.data["count"], 1)

        log_id = response.data["results"][0]["id"]
        detail = self.client.get(f"/api/audit/logs/{log_id}/")
        self.assertEqual(detail.status_code, 200, detail.data)
        self.assertIn("field_changes", detail.data)

        summary = self.client.get("/api/audit/logs/summary/")
        self.assertEqual(summary.status_code, 200, summary.data)
        self.assertIn("total_logs", summary.data)

    def test_failed_login_is_audited_without_password(self):
        self.client.force_authenticate(None)
        response = self.client.post(
            "/api/auth/login/",
            {"username": "api-auditor", "password": "wrong"},
            format="json",
        )
        self.assertEqual(response.status_code, 400)
        log = AuditLog.objects.filter(action="auth.login_failed").latest("timestamp")
        self.assertEqual(log.status, "failed")
        self.assertNotIn("password", str(log.extra_metadata).lower())

    def test_expense_create_audit_captures_currency_and_reason(self):
        response = self.client.post(
            "/api/expenses/",
            {
                "project": self.project.id,
                "expense_date": "2026-02-01",
                "description": "Audit expense",
                "amount_usd": "50.00",
                "amount_afn": "0.00",
                "exchange_rate": "0.0000",
                "expense_type": "general",
            },
            format="json",
            HTTP_X_AUDIT_REASON="Vendor invoice correction",
        )

        self.assertEqual(response.status_code, 201, response.data)
        log = AuditLog.objects.filter(model_name="Expense", action="expense.create").latest("timestamp")
        self.assertEqual(log.extra_metadata["currency"], "USD")
        self.assertEqual(log.extra_metadata["reason"], "Vendor invoice correction")
        self.assertTrue(log.extra_metadata["is_financial"])

    def test_audit_filters_search_and_unauthorized_access(self):
        response = self.client.get("/api/audit/logs/?action=project.budget_change&search=API")
        self.assertEqual(response.status_code, 200, response.data)
        self.assertIn("results", response.data)

        self.client.force_authenticate(None)
        unauthenticated = self.client.get("/api/audit/logs/")
        self.assertEqual(unauthenticated.status_code, 401)

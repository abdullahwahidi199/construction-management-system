from decimal import Decimal
from unittest.mock import patch

from rest_framework.test import APITestCase

from accounts.models import ApplicationSettings
from common.test_helpers import (
    create_admin,
    create_expense,
    create_project,
    create_user,
    expense_payload,
)
from expenses.models import Expense


class ExpenseWorkflowAPITests(APITestCase):
    def setUp(self):
        self.admin = create_admin()
        self.project = create_project()
        self.client.force_authenticate(self.admin)

    def test_create_expense_auto_serializes_and_returns_totals(self):
        response = self.client.post(
            "/api/expenses/",
            expense_payload(self.project),
            format="json",
        )

        self.assertEqual(response.status_code, 201, response.data)
        self.assertEqual(response.data["serial_number"], 1)
        self.assertEqual(response.data["approval_status"], "approved")
        self.assertEqual(Decimal(response.data["total_usd"]), Decimal("250.00"))

    def test_expense_validation_rejects_empty_and_mixed_amounts(self):
        empty = self.client.post(
            "/api/expenses/",
            expense_payload(self.project, amount_usd="0.00", amount_afn="0.00"),
            format="json",
        )
        mixed = self.client.post(
            "/api/expenses/",
            expense_payload(self.project, amount_usd="25.00", amount_afn="100.00"),
            format="json",
        )

        self.assertEqual(empty.status_code, 400)
        self.assertEqual(mixed.status_code, 400)
        self.assertIn("Expense cannot contain both", str(mixed.data))

    def test_expense_list_filters_searches_orders_and_totals_only_approved(self):
        create_expense(self.project, description="Steel beams", amount_usd=Decimal("100.00"))
        create_expense(
            self.project,
            description="Pending concrete",
            amount_usd=Decimal("500.00"),
            approval_status=Expense.ApprovalStatus.PENDING,
        )
        create_expense(self.project, description="AFN timber", amount_usd=0, amount_afn=Decimal("700.00"))

        response = self.client.get("/api/expenses/?search=Steel&ordering=expense_date")

        self.assertEqual(response.status_code, 200, response.data)
        self.assertEqual(response.data["results"]["totals"]["usd"], Decimal("100"))
        self.assertEqual(response.data["results"]["totals"]["afn"], 0)
        self.assertEqual(len(response.data["results"]["results"]), 1)

    def test_approval_workflow_pending_approve_reject_and_notifications(self):
        approver = create_user(
            username="approver",
            role="accountant",
            permissions=["expenses.view", "expenses.create", "expenses.approve", "settings.manage"],
        )
        submitter = create_user(
            username="submitter",
            role="site_engineer",
            permissions=["expenses.view", "expenses.create"],
        )
        self.client.force_authenticate(approver)
        self.client.put("/api/expenses/approval-settings/", {"enabled": True}, format="json")

        self.client.force_authenticate(submitter)
        created = self.client.post("/api/expenses/", expense_payload(self.project), format="json")
        self.assertEqual(created.status_code, 201, created.data)
        self.assertEqual(created.data["approval_status"], "pending")

        self.client.force_authenticate(approver)
        approved = self.client.post(
            f"/api/expenses/{created.data['id']}/approve/",
            {"approval_notes": "Receipt verified"},
            format="json",
        )
        self.assertEqual(approved.status_code, 200, approved.data)
        self.assertEqual(approved.data["approval_status"], "approved")

        second = create_expense(
            self.project,
            created_by=submitter,
            approval_status=Expense.ApprovalStatus.PENDING,
            description="Needs rejection",
        )
        rejected = self.client.post(
            f"/api/expenses/{second.id}/reject/",
            {"approval_notes": "Missing invoice"},
            format="json",
        )
        self.assertEqual(rejected.status_code, 200, rejected.data)
        self.assertEqual(rejected.data["approval_status"], "rejected")

    def test_reject_requires_reason(self):
        expense = create_expense(self.project, approval_status=Expense.ApprovalStatus.PENDING)

        response = self.client.post(f"/api/expenses/{expense.id}/reject/", {}, format="json")

        self.assertEqual(response.status_code, 400)
        self.assertIn("approval_notes", response.data["errors"])

    def test_user_cannot_update_another_users_pending_expense_without_permission(self):
        owner = create_user(username="owner", role="site_engineer", permissions=["expenses.view", "expenses.create"])
        other = create_user(username="other", role="supervisor", permissions=["expenses.view", "expenses.update_own"])
        expense = create_expense(
            self.project,
            created_by=owner,
            approval_status=Expense.ApprovalStatus.PENDING,
        )
        self.client.force_authenticate(other)

        response = self.client.patch(
            f"/api/expenses/{expense.id}/",
            {"description": "Tampered"},
            format="json",
        )

        self.assertEqual(response.status_code, 403)

    def test_pending_expenses_are_excluded_from_export(self):
        create_expense(self.project, approval_status=Expense.ApprovalStatus.PENDING)

        response = self.client.get("/api/expenses/export-pdf/?status=pending")

        self.assertEqual(response.status_code, 403)

    def test_concurrent_expense_serial_generation_is_unique_per_project(self):
        first = create_expense(self.project)
        second = create_expense(self.project)

        self.assertEqual((first.serial_number, second.serial_number), (1, 2))

    def test_network_broadcast_failures_do_not_break_expense_approval(self):
        expense = create_expense(self.project, approval_status=Expense.ApprovalStatus.PENDING)

        with patch("notifications.services.broadcast_event", side_effect=RuntimeError("channel down")):
            response = self.client.post(
                f"/api/expenses/{expense.id}/approve/",
                {"approval_notes": "Approved despite realtime failure"},
                format="json",
            )

        self.assertEqual(response.status_code, 200, response.data)

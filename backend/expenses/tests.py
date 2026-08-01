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
from expenses.models import Expense, ExpenseEditRequest


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
        self.assertEqual(response.data["expense_scope"], "project")
        self.assertEqual(response.data["project_name"], self.project.name)

    def test_create_office_expense_without_project(self):
        response = self.client.post(
            "/api/expenses/",
            expense_payload(
                expense_scope=Expense.ExpenseScope.OFFICE,
                project=None,
                expense_type="office_rent",
                description="Office rent",
                amount_usd="900.00",
            ),
            format="json",
        )

        self.assertEqual(response.status_code, 201, response.data)
        self.assertIsNone(response.data["project"])
        self.assertEqual(response.data["project_name"], "Office")
        self.assertEqual(response.data["expense_scope"], "office")
        self.assertEqual(response.data["expense_type"], "office_rent")

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

    def test_expense_scope_validation_requires_exactly_one_context(self):
        office_with_project = self.client.post(
            "/api/expenses/",
            expense_payload(self.project, expense_scope=Expense.ExpenseScope.OFFICE),
            format="json",
        )
        project_payload = expense_payload(
            self.project,
            expense_scope=Expense.ExpenseScope.PROJECT,
        )
        project_payload["project"] = None
        project_without_project = self.client.post(
            "/api/expenses/",
            project_payload,
            format="json",
        )

        self.assertEqual(office_with_project.status_code, 400)
        self.assertEqual(project_without_project.status_code, 400)
        self.assertIn("Office expenses cannot be linked", str(office_with_project.data))
        self.assertIn("Project expenses must be linked", str(project_without_project.data))

    def test_expense_list_filters_searches_orders_and_totals_only_approved(self):
        create_expense(self.project, description="Steel beams", amount_usd=Decimal("100.00"))
        create_expense(
            None,
            expense_scope=Expense.ExpenseScope.OFFICE,
            description="Office rent",
            expense_type="office_rent",
            amount_usd=Decimal("50.00"),
        )
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
        self.assertEqual(
            response.data["results"]["totals"]["usd_equivalent"],
            Decimal("100.00"),
        )
        self.assertEqual(
            response.data["results"]["totals"]["afn_equivalent"],
            Decimal("7000.00"),
        )
        self.assertEqual(len(response.data["results"]["results"]), 1)

        office = self.client.get("/api/expenses/?expense_scope=office")
        self.assertEqual(office.status_code, 200, office.data)
        self.assertEqual(office.data["results"]["totals"]["office"]["usd"], Decimal("50"))
        self.assertEqual(office.data["results"]["results"][0]["project_name"], "Office")

        all_expenses = self.client.get("/api/expenses/")
        self.assertEqual(all_expenses.status_code, 200, all_expenses.data)
        self.assertEqual(
            all_expenses.data["results"]["totals"]["usd_equivalent"],
            Decimal("160.00"),
        )
        self.assertEqual(
            all_expenses.data["results"]["totals"]["afn_equivalent"],
            Decimal("11200.00"),
        )

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

    def test_office_expense_serial_generation_uses_office_ledger(self):
        first = create_expense(
            None,
            expense_scope=Expense.ExpenseScope.OFFICE,
            expense_type="office_rent",
        )
        second = create_expense(
            None,
            expense_scope=Expense.ExpenseScope.OFFICE,
            expense_type="utilities",
        )
        project_expense = create_expense(self.project)

        self.assertEqual((first.serial_number, second.serial_number), (1, 2))
        self.assertEqual(project_expense.serial_number, 1)

    def test_changing_expense_scope_moves_to_next_ledger_serial(self):
        create_expense(
            None,
            expense_scope=Expense.ExpenseScope.OFFICE,
            expense_type="office_rent",
        )
        project_expense = create_expense(self.project)

        response = self.client.patch(
            f"/api/expenses/{project_expense.id}/",
            {
                "expense_scope": Expense.ExpenseScope.OFFICE,
                "project": None,
                "expense_type": "utilities",
            },
            format="json",
        )

        self.assertEqual(response.status_code, 202, response.data)
        project_expense.refresh_from_db()
        self.assertEqual(project_expense.expense_scope, Expense.ExpenseScope.PROJECT)

        edit_request = ExpenseEditRequest.objects.get(expense=project_expense)
        approved = self.client.post(
            f"/api/expenses/edit-requests/{edit_request.id}/approve/",
            {"approval_notes": "Ledger change approved"},
            format="json",
        )

        self.assertEqual(approved.status_code, 200, approved.data)
        project_expense.refresh_from_db()
        self.assertEqual(project_expense.serial_number, 2)
        self.assertEqual(project_expense.project_label, "Office")

    def test_approved_financial_edit_requires_approval_and_preserves_original_until_approved(self):
        requester = create_user(
            username="requester",
            role="site_engineer",
            permissions=["expenses.view", "expenses.create", "expenses.update_own"],
        )
        expense = create_expense(
            self.project,
            created_by=requester,
            amount_usd=Decimal("250.00"),
            approval_status=Expense.ApprovalStatus.APPROVED,
        )
        self.client.force_authenticate(requester)

        response = self.client.patch(
            f"/api/expenses/{expense.id}/",
            {"amount_usd": "300.00"},
            format="json",
        )

        self.assertEqual(response.status_code, 202, response.data)
        self.assertEqual(response.data["edit_request"]["approval_status"], "pending")
        self.assertIn("amount_usd", response.data["edit_request"]["changed_fields"])
        expense.refresh_from_db()
        self.assertEqual(expense.amount_usd, Decimal("250.00"))

        self.client.force_authenticate(self.admin)
        queue = self.client.get("/api/expenses/approvals/?status=pending")
        self.assertEqual(queue.status_code, 200, queue.data)
        rows = queue.data["results"]["results"]
        self.assertTrue(any(row.get("approval_item_type") == "expense_edit" for row in rows))

        edit_request = ExpenseEditRequest.objects.get(expense=expense)
        approved = self.client.post(
            f"/api/expenses/edit-requests/{edit_request.id}/approve/",
            {"approval_notes": "Amount verified"},
            format="json",
        )

        self.assertEqual(approved.status_code, 200, approved.data)
        expense.refresh_from_db()
        edit_request.refresh_from_db()
        self.assertEqual(expense.amount_usd, Decimal("300.00"))
        self.assertEqual(edit_request.approval_status, ExpenseEditRequest.ApprovalStatus.APPROVED)

    def test_rejected_expense_edit_request_keeps_original_values(self):
        requester = create_user(
            username="requester_reject",
            role="site_engineer",
            permissions=["expenses.view", "expenses.create", "expenses.update_own"],
        )
        expense = create_expense(
            self.project,
            created_by=requester,
            amount_usd=Decimal("250.00"),
            approval_status=Expense.ApprovalStatus.APPROVED,
        )
        self.client.force_authenticate(requester)
        response = self.client.patch(
            f"/api/expenses/{expense.id}/",
            {"amount_usd": "400.00"},
            format="json",
        )
        self.assertEqual(response.status_code, 202, response.data)

        edit_request = ExpenseEditRequest.objects.get(expense=expense)
        self.client.force_authenticate(self.admin)
        rejected = self.client.post(
            f"/api/expenses/edit-requests/{edit_request.id}/reject/",
            {"approval_notes": "Receipt does not match"},
            format="json",
        )

        self.assertEqual(rejected.status_code, 200, rejected.data)
        expense.refresh_from_db()
        edit_request.refresh_from_db()
        self.assertEqual(expense.amount_usd, Decimal("250.00"))
        self.assertEqual(edit_request.approval_status, ExpenseEditRequest.ApprovalStatus.REJECTED)

    def test_network_broadcast_failures_do_not_break_expense_approval(self):
        expense = create_expense(self.project, approval_status=Expense.ApprovalStatus.PENDING)

        with patch("notifications.services.broadcast_event", side_effect=RuntimeError("channel down")):
            response = self.client.post(
                f"/api/expenses/{expense.id}/approve/",
                {"approval_notes": "Approved despite realtime failure"},
                format="json",
            )

        self.assertEqual(response.status_code, 200, response.data)

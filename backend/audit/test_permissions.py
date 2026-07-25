from types import SimpleNamespace
from unittest.mock import patch

from django.test import SimpleTestCase

from audit.permissions import AuditLogPermission


class AuditLogPermissionTests(SimpleTestCase):
    def setUp(self):
        self.permission = AuditLogPermission()
        self.user = SimpleNamespace(is_authenticated=True)

    def request(self, user=None):
        return SimpleNamespace(user=self.user if user is None else user)

    def view(self, action):
        return SimpleNamespace(action=action)

    def test_rejects_anonymous_users(self):
        anonymous = SimpleNamespace(is_authenticated=False)
        self.assertFalse(self.permission.has_permission(self.request(anonymous), self.view("list")))

    @patch("audit.permissions.has_permission")
    def test_wildcard_grants_every_action(self, has_permission):
        has_permission.side_effect = lambda user, code: code == "*"
        self.assertTrue(self.permission.has_permission(self.request(), self.view("destroy")))

    @patch("audit.permissions.has_permission")
    def test_maps_actions_to_required_permissions(self, has_permission):
        granted = {"audit_logs.view", "audit_logs.export", "audit_logs.delete", "audit_logs.manage_retention"}
        has_permission.side_effect = lambda user, code: code in granted

        self.assertTrue(self.permission.has_permission(self.request(), self.view("list")))
        self.assertTrue(self.permission.has_permission(self.request(), self.view("retrieve")))
        self.assertTrue(self.permission.has_permission(self.request(), self.view("summary")))
        self.assertTrue(self.permission.has_permission(self.request(), self.view("export_csv")))
        self.assertTrue(self.permission.has_permission(self.request(), self.view("export_excel")))
        self.assertTrue(self.permission.has_permission(self.request(), self.view("destroy")))
        self.assertTrue(self.permission.has_permission(self.request(), self.view("retention")))
        self.assertTrue(self.permission.has_permission(self.request(), self.view("update_retention")))
        self.assertFalse(self.permission.has_permission(self.request(), self.view("create")))

from datetime import timedelta

from django.contrib.auth import get_user_model
from django.utils import timezone
from rest_framework.authtoken.models import Token
from rest_framework.test import APITestCase

from accounts.constants import Role
from accounts.models import CustomRole, Permission, ProjectAssignment, RolePermission
from common.test_helpers import create_admin, create_project, create_user


class AuthenticationAndRBACAPITests(APITestCase):
    def setUp(self):
        self.admin_password = "StrongPass123!"
        self.admin = create_admin(password=self.admin_password)

    def test_login_returns_token_user_role_and_permissions(self):
        response = self.client.post(
            "/api/auth/login/",
            {"username": self.admin.username, "password": self.admin_password},
            format="json",
        )

        self.assertEqual(response.status_code, 200, response.data)
        self.assertIn("token", response.data)
        self.assertEqual(response.data["role"], Role.ADMIN)
        self.assertIn("*", response.data["permissions"])

    def test_login_rejects_bad_password_and_inactive_user(self):
        bad_password = self.client.post(
            "/api/auth/login/",
            {"username": self.admin.username, "password": "wrong"},
            format="json",
        )
        inactive = create_user(username="inactive", password="StrongPass123!", is_active=False)
        inactive_response = self.client.post(
            "/api/auth/login/",
            {"username": inactive.username, "password": "StrongPass123!"},
            format="json",
        )

        self.assertEqual(bad_password.status_code, 400)
        self.assertEqual(inactive_response.status_code, 400)

    def test_logout_deletes_token_and_blocks_reuse(self):
        token = Token.objects.create(user=self.admin)

        response = self.client.post("/api/auth/logout/", **{"HTTP_AUTHORIZATION": f"Token {token.key}"})
        me = self.client.get("/api/auth/me/", **{"HTTP_AUTHORIZATION": f"Token {token.key}"})

        self.assertEqual(response.status_code, 204)
        self.assertEqual(me.status_code, 401)

    def test_invalid_and_expired_like_tokens_are_rejected(self):
        invalid = self.client.get("/api/auth/me/", **{"HTTP_AUTHORIZATION": "Token not-a-real-token"})

        self.assertEqual(invalid.status_code, 401)

    def test_jwt_refresh_endpoint_is_not_wired_for_current_token_auth_contract(self):
        response = self.client.post("/api/auth/token/refresh/", {"refresh": "unused"}, format="json")

        self.assertEqual(response.status_code, 404)

    def test_password_validation_on_create_and_set_password(self):
        self.client.force_authenticate(self.admin)
        weak = self.client.post(
            "/api/auth/users/",
            {"username": "weak", "password": "short", "role": Role.MANAGER},
            format="json",
        )
        user = create_user(username="target", role=Role.MANAGER)
        too_short = self.client.post(
            f"/api/auth/users/{user.id}/set_password/",
            {"new_password": "12345"},
            format="json",
        )
        strong = self.client.post(
            f"/api/auth/users/{user.id}/set_password/",
            {"new_password": "BetterPass123!"},
            format="json",
        )

        self.assertEqual(weak.status_code, 400)
        self.assertEqual(too_short.status_code, 400)
        self.assertEqual(strong.status_code, 200)

    def test_custom_roles_for_accountant_hr_site_engineer_supervisor_employee_laborer(self):
        self.client.force_authenticate(self.admin)
        roles = ["accountant", "hr", "site_engineer", "supervisor", "employee", "laborer"]

        for role in roles:
            response = self.client.post(
                "/api/auth/roles/",
                {"label": role.replace("_", " ").title(), "value": role},
                format="json",
            )
            self.assertEqual(response.status_code, 201, response.data)

        self.assertEqual(CustomRole.objects.filter(value__in=roles).count(), len(roles))

    def test_role_permission_assignment_update_and_delete(self):
        self.client.force_authenticate(self.admin)
        role = CustomRole.objects.create(value="accountant", label="Accountant")
        permission = Permission.objects.get(code="expenses.view")

        assigned = self.client.post(
            "/api/auth/role-permissions/",
            {"role": role.value, "permission": permission.id},
            format="json",
        )
        self.assertEqual(assigned.status_code, 201, assigned.data)

        user = create_user(username="accountant-user", role=role.value)
        me = self.client.get(f"/api/auth/users/{user.id}/")
        self.assertIn("expenses.view", me.data["permissions"])

        deleted = self.client.delete(f"/api/auth/role-permissions/{assigned.data['id']}/")
        self.assertEqual(deleted.status_code, 204)
        self.assertFalse(RolePermission.objects.filter(role=role.value, permission=permission).exists())

    def test_user_crud_role_assignment_and_project_assignment(self):
        self.client.force_authenticate(self.admin)
        user_response = self.client.post(
            "/api/auth/users/",
            {
                "username": "managed-user",
                "password": "StrongPass123!",
                "email": "managed@example.com",
                "role": Role.MANAGER,
            },
            format="json",
        )
        self.assertEqual(user_response.status_code, 201, user_response.data)

        role_response = self.client.post(
            f"/api/auth/users/{user_response.data['id']}/set_role/",
            {"role": Role.DATA_ENTRY},
            format="json",
        )
        self.assertEqual(role_response.status_code, 200, role_response.data)
        self.assertEqual(role_response.data["role"], Role.DATA_ENTRY)

        project = create_project()
        assignment = self.client.post(
            "/api/auth/project-assignments/",
            {"user": user_response.data["id"], "project": project.id},
            format="json",
        )
        self.assertEqual(assignment.status_code, 201, assignment.data)
        self.assertTrue(ProjectAssignment.objects.filter(project=project).exists())

    def test_role_deletion_protects_system_and_assigned_roles(self):
        self.client.force_authenticate(self.admin)
        system_role = CustomRole.objects.get(value=Role.MANAGER)
        system_delete = self.client.delete(f"/api/auth/roles/{system_role.id}/")
        self.assertEqual(system_delete.status_code, 400)

        role = CustomRole.objects.create(value="supervisor", label="Supervisor")
        create_user(username="supervisor-user", role=role.value)
        assigned_delete = self.client.delete(f"/api/auth/roles/{role.id}/")
        self.assertEqual(assigned_delete.status_code, 400)

    def test_non_admin_cannot_escalate_permissions(self):
        user = create_user(username="ordinary", role="employee", permissions=["projects.view"])
        self.client.force_authenticate(user)

        response = self.client.post(
            "/api/auth/users/",
            {"username": "escalated", "password": "StrongPass123!", "role": Role.ADMIN},
            format="json",
        )

        self.assertEqual(response.status_code, 403)

    def test_calendar_settings_permission_checks(self):
        viewer = create_user(username="settings-viewer", role="hr", permissions=["settings.view"])
        manager = create_user(username="settings-manager", role="admin_ops", permissions=["settings.manage"])

        self.client.force_authenticate(viewer)
        get_response = self.client.get("/api/auth/settings/calendar/")
        put_forbidden = self.client.put(
            "/api/auth/settings/calendar/",
            {"default_calendar": "gregorian", "modules": {}},
            format="json",
        )

        self.client.force_authenticate(manager)
        put_allowed = self.client.put(
            "/api/auth/settings/calendar/",
            {"default_calendar": "gregorian", "modules": {"expenses": "gregorian"}},
            format="json",
        )

        self.assertEqual(get_response.status_code, 200)
        self.assertEqual(put_forbidden.status_code, 403)
        self.assertEqual(put_allowed.status_code, 200, put_allowed.data)

from datetime import timedelta

from django.conf import settings
from django.contrib.auth import get_user_model
from django.core.cache import cache
from django.test import SimpleTestCase, override_settings
from django.utils import timezone
from rest_framework.authtoken.models import Token
from rest_framework.test import APITestCase

from accounts.constants import Role
from accounts.models import CustomRole, Permission, ProjectAssignment, RolePermission
from common.test_helpers import create_admin, create_project, create_user


TEST_CACHES = {
    "default": {
        "BACKEND": "django.core.cache.backends.locmem.LocMemCache",
        "LOCATION": "auth-rate-limit-tests",
    }
}


class AuthenticationRateLimitConfigurationTests(SimpleTestCase):
    def test_default_cache_is_redis_backed_for_shared_worker_throttling(self):
        self.assertEqual(
            settings.CACHES["default"]["BACKEND"],
            "django.core.cache.backends.redis.RedisCache",
        )


@override_settings(CACHES=TEST_CACHES)
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
        ordinary = create_user(username="settings-reader", role="data_entry", permissions=["expenses.view"])
        viewer = create_user(username="settings-viewer", role="hr", permissions=["settings.view"])
        manager = create_user(username="settings-manager", role="admin_ops", permissions=["settings.manage"])

        self.client.force_authenticate(ordinary)
        ordinary_get_response = self.client.get("/api/auth/settings/calendar/")

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

        self.assertEqual(ordinary_get_response.status_code, 200)
        self.assertEqual(get_response.status_code, 200)
        self.assertEqual(put_forbidden.status_code, 403)
        self.assertEqual(put_allowed.status_code, 200, put_allowed.data)


@override_settings(CACHES=TEST_CACHES)
class LoginRateLimitingTests(APITestCase):
    def setUp(self):
        cache.clear()
        self.password = "StrongPass123!"
        self.admin = create_admin(username="rate-admin", password=self.password)
        self.login_url = "/api/auth/login/"
        self.ip = "203.0.113.10"

    def post_login(self, username, password, ip=None):
        return self.client.post(
            self.login_url,
            {"username": username, "password": password},
            format="json",
            REMOTE_ADDR=ip or self.ip,
            HTTP_USER_AGENT="RateLimitTest/1.0",
        )

    def test_successful_login_does_not_create_failed_rate_limit(self):
        response = self.post_login(self.admin.username, self.password)

        self.assertEqual(response.status_code, 200, response.data)
        self.assertIn("token", response.data)

    def test_failed_login_is_rejected_without_hiding_validation_response(self):
        response = self.post_login(self.admin.username, "wrong-password")

        self.assertEqual(response.status_code, 400)

    def test_exceeding_minute_limit_returns_429_payload_and_retry_after_header(self):
        for _ in range(settings.LOGIN_RATE_LIMIT_PER_MINUTE):
            response = self.post_login(self.admin.username, "wrong-password")
            self.assertEqual(response.status_code, 400, response.data)

        limited = self.post_login(self.admin.username, "wrong-password")

        self.assertEqual(limited.status_code, 429)
        self.assertEqual(limited.data["detail"], "Too many login attempts. Please try again in 15 minutes.")
        self.assertEqual(limited.data["retry_after"], settings.LOGIN_BLOCK_TIME)
        self.assertEqual(limited["Retry-After"], str(settings.LOGIN_BLOCK_TIME))

    def test_successful_login_resets_failed_attempt_counter_for_ip(self):
        for _ in range(settings.LOGIN_RATE_LIMIT_PER_MINUTE - 1):
            self.assertEqual(self.post_login(self.admin.username, "wrong-password").status_code, 400)

        self.assertEqual(self.post_login(self.admin.username, self.password).status_code, 200)

        for _ in range(settings.LOGIN_RATE_LIMIT_PER_MINUTE):
            self.assertEqual(self.post_login(self.admin.username, "wrong-password").status_code, 400)

        self.assertEqual(self.post_login(self.admin.username, "wrong-password").status_code, 429)

    @override_settings(LOGIN_RATE_LIMIT_PER_MINUTE=100, LOGIN_RATE_LIMIT_PER_HOUR=20)
    def test_exceeding_hourly_limit_blocks_login_attempts(self):
        cache.clear()
        for _ in range(settings.LOGIN_RATE_LIMIT_PER_HOUR):
            self.assertEqual(self.post_login(self.admin.username, "wrong-password").status_code, 400)

        self.assertEqual(self.post_login(self.admin.username, "wrong-password").status_code, 429)

    def test_username_limit_blocks_even_when_production_proxy_ip_rotates(self):
        for index in range(settings.LOGIN_RATE_LIMIT_PER_MINUTE):
            response = self.post_login(
                self.admin.username,
                "wrong-password",
                ip=f"198.51.100.{index + 1}",
            )
            self.assertEqual(response.status_code, 400, response.data)

        limited = self.post_login(
            self.admin.username,
            "wrong-password",
            ip="198.51.100.250",
        )

        self.assertEqual(limited.status_code, 429)
        self.assertEqual(limited.data["code"], "rate_limited")

    def test_ip_limit_still_blocks_distributed_usernames_from_one_client(self):
        for index in range(settings.LOGIN_RATE_LIMIT_PER_MINUTE):
            response = self.post_login(f"missing-{index}", "wrong-password")
            self.assertEqual(response.status_code, 400, response.data)

        limited = self.post_login("another-missing-user", "wrong-password")

        self.assertEqual(limited.status_code, 429)
        self.assertEqual(limited.data["code"], "rate_limited")

    def test_rate_limited_login_attempt_is_logged(self):
        for _ in range(settings.LOGIN_RATE_LIMIT_PER_MINUTE):
            self.post_login(self.admin.username, "wrong-password")

        with self.assertLogs("cms.auth.rate_limit", level="WARNING") as logs:
            self.post_login(self.admin.username, "wrong-password")

        message = "\n".join(logs.output)
        self.assertIn(self.ip, message)
        self.assertIn(self.admin.username, message)
        self.assertIn("RateLimitTest/1.0", message)
        self.assertIn(self.login_url, message)

from datetime import date, datetime
from types import SimpleNamespace
from unittest.mock import patch

from django.core.exceptions import PermissionDenied as DjangoPermissionDenied
from django.db import DatabaseError, IntegrityError
from django.test import SimpleTestCase, override_settings
from rest_framework import serializers, status
from rest_framework.exceptions import (
    AuthenticationFailed,
    MethodNotAllowed,
    NotAuthenticated,
    NotFound,
    Throttled,
    ValidationError,
)

from common.calendar_utils import (
    CALENDAR_GREGORIAN,
    CALENDAR_INHERIT,
    CALENDAR_SHAMSI,
    CalendarDateField,
    calendar_month_bounds,
    calendar_year_bounds,
    convert_query_date_params,
    format_calendar_date,
    format_calendar_datetime,
    format_date_fields,
    format_gregorian_date,
    format_shamsi_date,
    get_module_calendar,
    is_shamsi_leap_year,
    normalize_calendar_settings,
    parse_calendar_date,
    parse_calendar_datetime,
    parse_gregorian_date,
    parse_shamsi_date,
    shamsi_month_length,
    to_gregorian,
)
from common.exceptions import (
    build_error_payload,
    custom_exception_handler,
    json_response_for_exception,
    response_for_exception,
)
from common.ip import get_client_ip


class CalendarUtilityTests(SimpleTestCase):
    def test_calendar_settings_normalization_and_module_resolution(self):
        settings = normalize_calendar_settings(
            {
                "default_calendar": CALENDAR_GREGORIAN,
                "modules": {
                    "payroll": CALENDAR_SHAMSI,
                    "expenses": "bad-value",
                    "custom": CALENDAR_GREGORIAN,
                },
            }
        )

        self.assertEqual(settings["default_calendar"], CALENDAR_GREGORIAN)
        self.assertEqual(settings["modules"]["payroll"], CALENDAR_SHAMSI)
        self.assertEqual(settings["modules"]["expenses"], CALENDAR_INHERIT)
        self.assertEqual(settings["modules"]["custom"], CALENDAR_GREGORIAN)
        self.assertEqual(get_module_calendar("projects", settings), CALENDAR_GREGORIAN)
        self.assertEqual(get_module_calendar("payroll", settings), CALENDAR_SHAMSI)

    def test_shamsi_conversion_validation_and_leap_years(self):
        self.assertEqual(format_shamsi_date("2026-03-21"), "1405-01-01")
        self.assertEqual(to_gregorian("1405-01-01"), date(2026, 3, 21))
        self.assertTrue(is_shamsi_leap_year(1403))
        self.assertEqual(shamsi_month_length(1403, 12), 30)
        self.assertEqual(shamsi_month_length(1404, 12), 29)

        with self.assertRaises(ValueError):
            to_gregorian("1404-12-30")
        with self.assertRaises(ValueError):
            shamsi_month_length(1405, 13)

    def test_parse_and_format_calendar_dates_and_datetimes(self):
        self.assertEqual(parse_gregorian_date("2026/02/28"), date(2026, 2, 28))
        self.assertEqual(parse_shamsi_date("1405-01-01"), date(2026, 3, 21))
        self.assertEqual(parse_calendar_date("2026-03-21", CALENDAR_SHAMSI), date(2026, 3, 21))
        self.assertEqual(parse_calendar_date("1405-01-01", CALENDAR_SHAMSI), date(2026, 3, 21))
        self.assertEqual(format_gregorian_date(datetime(2026, 7, 25, 9, 30)), "2026-07-25")
        self.assertEqual(format_calendar_date(date(2026, 3, 21), CALENDAR_GREGORIAN), "2026-03-21")
        self.assertEqual(
            parse_calendar_datetime("1405-01-01 13:45:00", CALENDAR_SHAMSI),
            datetime(2026, 3, 21, 13, 45),
        )
        self.assertEqual(format_calendar_datetime(datetime(2026, 3, 21, 8, 5), CALENDAR_SHAMSI), "1405-01-01 08:05")

    def test_query_conversion_bounds_and_formatted_fields(self):
        converted = convert_query_date_params(
            {"date__gte": "1405-01-01", "status": "present"},
            {"date"},
            CALENDAR_SHAMSI,
        )
        self.assertEqual(converted["date__gte"], "2026-03-21")
        self.assertEqual(converted["status"], "present")

        self.assertEqual(calendar_month_bounds(2026, 2, CALENDAR_GREGORIAN), (date(2026, 2, 1), date(2026, 2, 28)))
        self.assertEqual(calendar_year_bounds(2026, CALENDAR_GREGORIAN), (date(2026, 1, 1), date(2026, 12, 31)))
        self.assertEqual(calendar_month_bounds(1405, 1, CALENDAR_SHAMSI), (date(2026, 3, 21), date(2026, 4, 20)))
        self.assertEqual(calendar_year_bounds(1405, CALENDAR_SHAMSI)[0], date(2026, 3, 21))

        row = format_date_fields({"date": date(2026, 3, 21), "name": "A"}, {"date"}, CALENDAR_SHAMSI)
        self.assertEqual(row["calendar_type"], CALENDAR_SHAMSI)
        self.assertEqual(row["formatted_date"], "1405-01-01")

    def test_calendar_date_field_validation_and_representation(self):
        field = CalendarDateField(calendar_module="reports")
        with patch("common.calendar_utils.get_module_calendar", return_value=CALENDAR_SHAMSI):
            self.assertEqual(field.to_internal_value("1405-01-01"), date(2026, 3, 21))
            self.assertEqual(field.to_representation(date(2026, 3, 21)), "1405-01-01")

        with patch("common.calendar_utils.get_module_calendar", return_value=CALENDAR_SHAMSI):
            with self.assertRaises(serializers.ValidationError):
                field.to_internal_value("bad-date")


class ExceptionUtilityTests(SimpleTestCase):
    def test_build_error_payload_cleans_nested_errors(self):
        payload = build_error_payload(
            status.HTTP_400_BAD_REQUEST,
            errors={"amount": [ValidationError("Invalid amount").detail[0]], "other": None},
        )
        self.assertEqual(payload["code"], "validation_error")
        self.assertEqual(payload["detail"], "Please check the submitted information.")
        self.assertEqual(payload["errors"]["amount"], ["Invalid amount"])
        self.assertEqual(payload["errors"]["other"], "")

    def test_response_for_exception_maps_common_exception_types(self):
        cases = [
            (NotAuthenticated(), 401, "authentication_required"),
            (AuthenticationFailed(), 401, "authentication_required"),
            (DjangoPermissionDenied(), 403, "permission_denied"),
            (NotFound(), 404, "not_found"),
            (MethodNotAllowed("POST"), 405, "method_not_allowed"),
            (Throttled(), 429, "rate_limited"),
            (ValidationError({"name": ["Required"]}), 400, "validation_error"),
            (IntegrityError("duplicate"), 409, "conflict"),
            (DatabaseError("offline"), 503, "service_unavailable"),
            (RuntimeError("boom"), 500, "server_error"),
        ]

        request = SimpleNamespace(path="/api/test/", method="GET", user=SimpleNamespace(is_authenticated=False))
        for exc, expected_status, expected_code in cases:
            with self.subTest(exc=type(exc).__name__):
                payload, status_code = response_for_exception(exc, request=request)
                self.assertEqual(status_code, expected_status)
                self.assertEqual(payload["code"], expected_code)

    def test_custom_and_json_exception_handlers_return_standard_payloads(self):
        response = custom_exception_handler(ValidationError({"field": ["Bad"]}), {"request": None})
        self.assertEqual(response.status_code, 400)
        self.assertEqual(response.data["code"], "validation_error")
        self.assertIn("field", response.data["errors"])

        json_response = json_response_for_exception(NotAuthenticated())
        self.assertEqual(json_response.status_code, 401)
        self.assertIn(b"authentication_required", json_response.content)


class ClientIPUtilityTests(SimpleTestCase):
    @override_settings(TRUSTED_PROXY_IPS=["127.0.0.1"])
    def test_ignores_forwarded_for_from_untrusted_direct_clients(self):
        request = SimpleNamespace(
            META={
                "REMOTE_ADDR": "198.51.100.20",
                "HTTP_X_FORWARDED_FOR": "203.0.113.50",
            }
        )

        self.assertEqual(get_client_ip(request), "198.51.100.20")

    @override_settings(TRUSTED_PROXY_IPS=["127.0.0.1"])
    def test_uses_forwarded_for_from_trusted_reverse_proxy(self):
        request = SimpleNamespace(
            META={
                "REMOTE_ADDR": "127.0.0.1",
                "HTTP_X_FORWARDED_FOR": "198.51.100.30, 127.0.0.1",
            }
        )

        self.assertEqual(get_client_ip(request), "198.51.100.30")

from datetime import date
from decimal import Decimal
import uuid

from django.db import IntegrityError, transaction
from rest_framework.test import APITestCase

from accounts.models import ApplicationSettings
from common.calendar_utils import calendar_month_bounds
from common.test_helpers import create_admin, create_project, create_user
from project.models import Apartment, Building, Floor

from .models import ApartmentServiceSetting, ServiceCharge, ServicePayment


class ApartmentServicesAPITests(APITestCase):
    def setUp(self):
        self.admin = create_admin(username="services-admin")
        self.client.force_authenticate(self.admin)
        settings_obj = ApplicationSettings.get_solo()
        settings_obj.set_calendar_settings({
            "default_calendar": "gregorian",
            "modules": {"services": "gregorian"},
        })
        settings_obj.save()
        self.project = create_project(name="Service Tower")
        self.building = Building.objects.create(project=self.project, name="Block A")
        self.floor = Floor.objects.create(building=self.building, floor_number=1)
        self.apartments = [
            Apartment.objects.create(
                project=self.project,
                building=self.building,
                floor=self.floor,
                apartment_number=f"A-{number:02d}",
            )
            for number in range(1, 4)
        ]

    def setting_payload(self, apartment=None, fee="2000.00", **overrides):
        payload = {
            "apartment": (apartment or self.apartments[0]).id,
            "default_fee": fee,
            "currency": "AFN",
            "is_active": True,
            "notes": "Monthly service",
        }
        payload.update(overrides)
        return payload

    def create_setting(self, apartment=None, fee="2000.00", **overrides):
        return self.client.post(
            "/api/services/settings/",
            self.setting_payload(apartment, fee, **overrides),
            format="json",
        )

    def generate(self, period="2026-10", **overrides):
        payload = {"service_period": period}
        payload.update(overrides)
        return self.client.post("/api/services/charges/generate/", payload, format="json")

    def pay(self, charge, amount="1000.00", **overrides):
        payload = {
            "charge": charge.id,
            "amount": amount,
            "currency": charge.currency,
            "payment_date": "2026-10-05",
            "payment_method": "CASH",
            "idempotency_key": str(uuid.uuid4()),
        }
        payload.update(overrides)
        return self.client.post("/api/services/payments/", payload, format="json")

    def test_individual_service_setting_creation_and_validation(self):
        response = self.create_setting()
        self.assertEqual(response.status_code, 201, response.data)
        setting = ApartmentServiceSetting.objects.get(apartment=self.apartments[0])
        self.assertEqual(setting.default_fee, Decimal("2000.00"))
        self.assertEqual(setting.updated_by, self.admin)
        invalid = self.create_setting(self.apartments[1], fee="-1.00")
        self.assertEqual(invalid.status_code, 400, invalid.data)

    def test_bulk_setup_updates_existing_rows_without_duplicates(self):
        self.create_setting(fee="1500.00")
        response = self.client.post(
            "/api/services/settings/bulk/",
            {
                "rows": [
                    self.setting_payload(self.apartments[0], "2100.00"),
                    self.setting_payload(self.apartments[1], "3000.00"),
                ]
            },
            format="json",
        )
        self.assertEqual(response.status_code, 200, response.data)
        self.assertEqual(response.data["created"], 1)
        self.assertEqual(response.data["updated"], 1)
        self.assertEqual(ApartmentServiceSetting.objects.count(), 2)
        self.assertEqual(
            ApartmentServiceSetting.objects.get(apartment=self.apartments[0]).default_fee,
            Decimal("2100.00"),
        )

    def test_bulk_setup_returns_row_errors_for_duplicate_apartments(self):
        row = self.setting_payload(self.apartments[0], "1500.00")
        response = self.client.post(
            "/api/services/settings/bulk/",
            {"rows": [row, row]},
            format="json",
        )
        self.assertEqual(response.status_code, 400, response.data)
        self.assertEqual(ApartmentServiceSetting.objects.count(), 0)

    def test_generation_snapshots_different_fees_and_skips_duplicates(self):
        self.create_setting(self.apartments[0], "1500.00")
        self.create_setting(self.apartments[1], "2500.00")
        preview = self.generate(preview=True)
        self.assertEqual(preview.status_code, 200, preview.data)
        self.assertEqual(preview.data["to_create"], 2)
        self.assertEqual(Decimal(preview.data["expected_totals"]["AFN"]), Decimal("4000.00"))

        first = self.generate()
        second = self.generate()
        self.assertEqual(first.status_code, 201, first.data)
        self.assertEqual(first.data["created"], 2)
        self.assertEqual(second.status_code, 201, second.data)
        self.assertEqual(second.data["created"], 0)
        self.assertEqual(second.data["skipped"], 2)
        self.assertEqual(ServiceCharge.objects.count(), 2)
        self.assertEqual(
            set(ServiceCharge.objects.values_list("amount", flat=True)),
            {Decimal("1500.00"), Decimal("2500.00")},
        )

    def test_database_constraint_prevents_duplicate_charge(self):
        charge = ServiceCharge.objects.create(
            apartment=self.apartments[0],
            period_start=date(2026, 10, 1),
            period_end=date(2026, 10, 31),
            amount=Decimal("2000.00"),
            currency="AFN",
        )
        with self.assertRaises(IntegrityError), transaction.atomic():
            ServiceCharge.objects.create(
                apartment=charge.apartment,
                period_start=charge.period_start,
                period_end=charge.period_end,
                amount=Decimal("2500.00"),
                currency="AFN",
            )

    def test_historical_charge_is_unchanged_when_default_fee_changes(self):
        self.create_setting(fee="2000.00")
        self.generate("2026-10")
        setting = ApartmentServiceSetting.objects.get(apartment=self.apartments[0])
        self.client.patch(
            f"/api/services/settings/{setting.id}/",
            {"default_fee": "2500.00"},
            format="json",
        )
        self.generate("2026-11")
        october = ServiceCharge.objects.get(period_start=date(2026, 10, 1))
        november = ServiceCharge.objects.get(period_start=date(2026, 11, 1))
        self.assertEqual(october.amount, Decimal("2000.00"))
        self.assertEqual(november.amount, Decimal("2500.00"))

    def test_partial_full_and_multiple_payments_calculate_consistently(self):
        self.create_setting(fee="3000.00")
        self.generate()
        charge = ServiceCharge.objects.get()
        first = self.pay(charge, "1000.00")
        self.assertEqual(first.status_code, 201, first.data)
        detail = self.client.get(f"/api/services/charges/{charge.id}/")
        self.assertEqual(Decimal(detail.data["total_paid"]), Decimal("1000.00"))
        self.assertEqual(Decimal(detail.data["remaining_amount"]), Decimal("2000.00"))
        self.assertEqual(detail.data["payment_status"], "PARTIAL")

        second = self.pay(charge, "2000.00")
        self.assertEqual(second.status_code, 201, second.data)
        paid = self.client.get(f"/api/services/charges/{charge.id}/")
        self.assertEqual(Decimal(paid.data["remaining_amount"]), Decimal("0.00"))
        self.assertEqual(paid.data["payment_status"], "PAID")
        self.assertEqual(ServicePayment.objects.filter(charge=charge).count(), 2)

    def test_zero_negative_and_overpayments_are_rejected(self):
        self.create_setting(fee="1000.00")
        self.generate()
        charge = ServiceCharge.objects.get()
        self.assertEqual(self.pay(charge, "0.00").status_code, 400)
        self.assertEqual(self.pay(charge, "-1.00").status_code, 400)
        response = self.pay(charge, "1000.01")
        self.assertEqual(response.status_code, 400, response.data)
        self.assertEqual(ServicePayment.objects.count(), 0)

    def test_payment_idempotency_prevents_double_submit(self):
        self.create_setting(fee="3000.00")
        self.generate()
        charge = ServiceCharge.objects.get()
        key = str(uuid.uuid4())
        first = self.pay(charge, "1000.00", idempotency_key=key)
        duplicate = self.pay(charge, "1000.00", idempotency_key=key)
        self.assertEqual(first.status_code, 201, first.data)
        self.assertEqual(duplicate.status_code, 200, duplicate.data)
        self.assertTrue(duplicate.data["duplicate_prevented"])
        self.assertEqual(ServicePayment.objects.count(), 1)

    def test_outstanding_debt_across_months_and_account_history(self):
        self.create_setting(fee="3000.00")
        self.generate("2026-10")
        self.generate("2026-11")
        account = self.client.get(
            f"/api/services/charges/apartment-account/?apartment={self.apartments[0].id}"
        )
        self.assertEqual(account.status_code, 200, account.data)
        self.assertEqual(len(account.data["charges"]), 2)
        self.assertEqual(
            Decimal(account.data["totals"]["AFN"]["outstanding"]),
            Decimal("6000.00"),
        )

    def test_adjustment_does_not_change_default_and_cannot_drop_below_paid(self):
        self.create_setting(fee="2000.00")
        self.generate()
        charge = ServiceCharge.objects.get()
        self.pay(charge, "1000.00")
        invalid = self.client.post(
            f"/api/services/charges/{charge.id}/adjust/",
            {"amount": "500.00", "adjustment_note": "Invalid reduction"},
            format="json",
        )
        self.assertEqual(invalid.status_code, 400, invalid.data)
        valid = self.client.post(
            f"/api/services/charges/{charge.id}/adjust/",
            {"amount": "2500.00", "adjustment_note": "Special October charge"},
            format="json",
        )
        self.assertEqual(valid.status_code, 200, valid.data)
        self.assertEqual(Decimal(valid.data["amount"]), Decimal("2500.00"))
        self.assertEqual(
            ApartmentServiceSetting.objects.get().default_fee,
            Decimal("2000.00"),
        )

    def test_bulk_payments_save_valid_rows_and_report_invalid_rows(self):
        for apartment, fee in zip(self.apartments[:2], ("2000.00", "1500.00")):
            self.create_setting(apartment, fee)
        self.generate()
        charges = list(ServiceCharge.objects.order_by("apartment_id"))
        response = self.client.post(
            "/api/services/payments/bulk/",
            {
                "rows": [
                    {
                        "charge": charges[0].id,
                        "amount": "500.00",
                        "currency": "AFN",
                        "payment_date": "2026-10-06",
                        "payment_method": "CASH",
                        "idempotency_key": str(uuid.uuid4()),
                    },
                    {
                        "charge": charges[1].id,
                        "amount": "9999.00",
                        "currency": "AFN",
                        "payment_date": "2026-10-06",
                        "payment_method": "CASH",
                        "idempotency_key": str(uuid.uuid4()),
                    },
                ]
            },
            format="json",
        )
        self.assertEqual(response.status_code, 207, response.data)
        self.assertEqual(response.data["created"], 1)
        self.assertEqual(response.data["failed"], 1)
        self.assertEqual(ServicePayment.objects.count(), 1)

    def test_permissions_are_enforced_for_protected_actions(self):
        self.create_setting()
        viewer = create_user(
            username="services-viewer",
            role="services_viewer",
            permissions=["projects.view", "services.view"],
        )
        self.client.force_authenticate(viewer)
        self.assertEqual(self.client.get("/api/services/charges/").status_code, 200)
        self.assertEqual(
            self.client.post(
                "/api/services/settings/",
                self.setting_payload(self.apartments[1]),
                format="json",
            ).status_code,
            403,
        )
        self.assertEqual(self.generate().status_code, 403)

    def test_services_calendar_setting_converts_period_and_payment_dates(self):
        settings_response = self.client.put(
            "/api/auth/settings/calendar/",
            {
                "default_calendar": "gregorian",
                "modules": {"services": "shamsi"},
            },
            format="json",
        )
        self.assertEqual(settings_response.status_code, 200, settings_response.data)
        self.assertEqual(settings_response.data["modules"]["services"], "shamsi")
        self.create_setting(fee="2000.00")
        response = self.generate("1405-07")
        self.assertEqual(response.status_code, 201, response.data)
        charge = ServiceCharge.objects.get()
        expected_start, expected_end = calendar_month_bounds(1405, 7, "shamsi")
        self.assertEqual((charge.period_start, charge.period_end), (expected_start, expected_end))

        payment = self.pay(charge, "500.00", payment_date="1405-07-05")
        self.assertEqual(payment.status_code, 201, payment.data)
        self.assertEqual(ServicePayment.objects.get().payment_date, date(2026, 9, 27))

    def test_inactive_or_unconfigured_apartments_are_not_generated(self):
        self.create_setting(self.apartments[0], "2000.00", is_active=False)
        self.create_setting(self.apartments[1], "2500.00", is_active=True)
        response = self.generate()
        self.assertEqual(response.status_code, 201, response.data)
        self.assertEqual(ServiceCharge.objects.count(), 1)
        self.assertEqual(ServiceCharge.objects.get().apartment, self.apartments[1])


from datetime import date, timedelta
from decimal import Decimal

from rest_framework.test import APITestCase

from accounts.models import ApplicationSettings
from common.test_helpers import (
    create_admin,
    create_project,
    create_worker,
    create_worker_advance,
    create_worker_attendance,
)
from labour.models import DailyWorker, WorkerAdvance, WorkerPayroll


class DailyWorkerAPITests(APITestCase):
    def setUp(self):
        self.admin = create_admin()
        self.project = create_project()
        self.client.force_authenticate(self.admin)

    def test_worker_crud_search_filters_assignment_and_validation(self):
        worker = create_worker(project=self.project, full_name="Rahim Mason")

        list_response = self.client.get("/api/daily-workers/?search=Rahim&skill_type=mason&status=active")
        self.assertEqual(list_response.status_code, 200, list_response.data)
        self.assertEqual(len(list_response.data), 1)

        future = date.today() + timedelta(days=1)
        invalid = self.client.post(
            "/api/daily-workers/",
            {
                "full_name": "Future Worker",
                "phone": "070",
                "daily_rate": "20.00",
                "overtime_hourly_rate": "3.00",
                "currency": "USD",
                "skill_type": "helper",
                "status": "active",
                "joining_date": future.isoformat(),
                "assigned_project": self.project.id,
            },
            format="json",
        )
        self.assertEqual(invalid.status_code, 400)

        patched = self.client.patch(f"/api/daily-workers/{worker.id}/", {"status": "inactive"}, format="json")
        self.assertEqual(patched.status_code, 200, patched.data)
        self.assertEqual(patched.data["status"], "inactive")

    def test_worker_attendance_bulk_daily_status_and_summary(self):
        worker = create_worker(project=self.project)

        bulk = self.client.post(
            "/api/worker-attendance/bulk_mark/",
            {
                "date": "2026-02-01",
                "project": self.project.id,
                "records": [
                    {"worker": worker.id, "status": "overtime", "overtime_hours": "3.00"},
                ],
            },
            format="json",
        )
        self.assertEqual(bulk.status_code, 200, bulk.data)
        self.assertEqual(bulk.data["created_count"], 1)

        daily = self.client.get(f"/api/worker-attendance/daily_status/?date=2026-02-01&project={self.project.id}")
        summary = self.client.get("/api/worker-attendance/summary/")
        self.assertEqual(daily.data["status_counts"]["overtime"], 1)
        self.assertIn("work_calendar", daily.data)
        self.assertEqual(summary.data["overtime"], 1)

    def test_absent_worker_attendance_cannot_have_overtime(self):
        worker = create_worker(project=self.project)

        response = self.client.post(
            "/api/worker-attendance/",
            {
                "worker": worker.id,
                "project": self.project.id,
                "date": "2026-02-02",
                "status": "absent",
                "overtime_hours": "1.00",
            },
            format="json",
        )

        self.assertEqual(response.status_code, 400)
        self.assertIn("overtime_hours", response.data["errors"])

    def test_worker_advance_filters_open_and_paid(self):
        worker = create_worker(project=self.project)
        create_worker_advance(worker=worker, amount=Decimal("20.00"), remaining_balance=Decimal("20.00"))
        create_worker_advance(worker=worker, amount=Decimal("10.00"), remaining_balance=Decimal("0.00"))

        open_response = self.client.get(f"/api/worker-advances/?worker={worker.id}&status=open")
        paid_response = self.client.get(f"/api/worker-advances/?worker={worker.id}&status=paid")

        self.assertEqual(len(open_response.data), 1)
        self.assertEqual(len(paid_response.data), 1)

    def test_generate_worker_payroll_applies_attendance_overtime_and_advances(self):
        worker = create_worker(project=self.project, daily_rate=Decimal("20.00"), overtime_hourly_rate=Decimal("5.00"))
        create_worker_attendance(worker=worker, project=self.project, date=date(2026, 2, 1), status="present", overtime_hours=Decimal("2.00"))
        create_worker_attendance(worker=worker, project=self.project, date=date(2026, 2, 2), status="half_day", overtime_hours=Decimal("0.00"))
        create_worker_advance(worker=worker, amount=Decimal("15.00"), remaining_balance=Decimal("15.00"))

        response = self.client.post(
            "/api/worker-payroll/generate/",
            {
                "worker_ids": [worker.id],
                "project": self.project.id,
                "period_start": "2026-02-01",
                "period_end": "2026-02-02",
                "payment_method": "cash",
                "deductions": "5.00",
            },
            format="json",
        )

        self.assertEqual(response.status_code, 201, response.data)
        payroll = WorkerPayroll.objects.get(worker=worker)
        self.assertEqual(payroll.gross_amount, Decimal("40.00"))
        self.assertEqual(payroll.advances, Decimal("15.00"))
        self.assertEqual(payroll.net_amount, Decimal("20.00"))

        paid = self.client.patch(
            f"/api/worker-payroll/{payroll.id}/mark_paid/",
            {"payment_date": "2026-03-01", "payment_method": "cash"},
            format="json",
        )
        self.assertEqual(paid.status_code, 200, paid.data)
        self.assertEqual(WorkerAdvance.objects.get(worker=worker).remaining_balance, Decimal("0.00"))

    def test_generate_worker_payroll_skips_configured_off_days_and_holidays(self):
        settings_obj = ApplicationSettings.get_solo()
        settings_obj.set_calendar_settings({
            "default_calendar": "gregorian",
            "modules": {},
            "work_calendar": {
                "weekly_off_days": [4],
                "holidays": [
                    {
                        "name": "Company Holiday",
                        "start_date": "2026-02-03",
                        "end_date": "2026-02-03",
                        "paid_holiday": True,
                        "active": True,
                    }
                ],
            },
        })
        settings_obj.save()
        worker = create_worker(project=self.project, daily_rate=Decimal("20.00"), overtime_hourly_rate=Decimal("0.00"))
        for attendance_date in [
            date(2026, 2, 1),
            date(2026, 2, 2),
            date(2026, 2, 4),
            date(2026, 2, 5),
        ]:
            create_worker_attendance(
                worker=worker,
                project=self.project,
                date=attendance_date,
                status="present",
                overtime_hours=Decimal("0.00"),
            )

        response = self.client.post(
            "/api/worker-payroll/generate/",
            {
                "worker_ids": [worker.id],
                "project": self.project.id,
                "period_start": "2026-02-01",
                "period_end": "2026-02-06",
                "payment_method": "cash",
            },
            format="json",
        )

        self.assertEqual(response.status_code, 201, response.data)
        payroll = WorkerPayroll.objects.get(worker=worker)
        self.assertEqual(payroll.total_days_worked, Decimal("4.00"))
        self.assertEqual(payroll.gross_amount, Decimal("80.00"))

    def test_generate_worker_payroll_only_errors_for_missing_working_days(self):
        settings_obj = ApplicationSettings.get_solo()
        settings_obj.set_calendar_settings({
            "default_calendar": "gregorian",
            "modules": {},
            "work_calendar": {
                "weekly_off_days": [4],
                "holidays": [
                    {
                        "name": "Company Holiday",
                        "start_date": "2026-02-03",
                        "end_date": "2026-02-03",
                        "paid_holiday": True,
                        "active": True,
                    }
                ],
            },
        })
        settings_obj.save()
        worker = create_worker(project=self.project)
        create_worker_attendance(worker=worker, project=self.project, date=date(2026, 2, 1))
        create_worker_attendance(worker=worker, project=self.project, date=date(2026, 2, 2))

        response = self.client.post(
            "/api/worker-payroll/generate/",
            {
                "worker_ids": [worker.id],
                "project": self.project.id,
                "period_start": "2026-02-01",
                "period_end": "2026-02-04",
                "payment_method": "cash",
            },
            format="json",
        )

        self.assertEqual(response.status_code, 400, response.data)
        self.assertIn("Attendance has not been recorded for 2026-02-04", response.data["detail"])
        self.assertNotIn("2026-02-03", response.data["detail"])

    def test_worker_payroll_reports_and_summary(self):
        worker = create_worker(project=self.project)
        create_worker_attendance(worker=worker, project=self.project)
        self.client.post(
            "/api/worker-payroll/generate/",
            {
                "worker_ids": [worker.id],
                "project": self.project.id,
                "period_start": "2026-02-01",
                "period_end": "2026-02-01",
            },
            format="json",
        )

        summary = self.client.get("/api/worker-payroll/summary/")
        reports = self.client.get("/api/worker-payroll/reports/")

        self.assertEqual(summary.status_code, 200, summary.data)
        self.assertEqual(summary.data["records"], 1)
        self.assertEqual(reports.status_code, 200, reports.data)
        self.assertIn("monthly_labor_cost", reports.data)

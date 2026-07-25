from datetime import date, timedelta
from decimal import Decimal

from rest_framework.test import APITestCase

from common.calendar_utils import to_shamsi
from common.test_helpers import (
    create_admin,
    create_attendance,
    create_employee,
    create_payroll,
    employee_payload,
)
from Employees.models import Attendance, Employee, Payroll


class EmployeeAndPayrollAPITests(APITestCase):
    def setUp(self):
        self.admin = create_admin()
        self.client.force_authenticate(self.admin)

    def test_employee_crud_search_filters_and_status(self):
        create_employee(first_name="Amina", department="engineering", email="amina@example.com")
        create_employee(first_name="Zahra", department="finance", email="zahra@example.com", is_active=False)

        filtered = self.client.get("/api/employees/?search=Amina&department=engineering&is_active=true")
        self.assertEqual(filtered.status_code, 200, filtered.data)
        self.assertEqual(len(filtered.data), 1)

        created = self.client.post("/api/employees/", employee_payload(email="new@example.com"), format="json")
        self.assertEqual(created.status_code, 201, created.data)

        patched = self.client.patch(
            f"/api/employees/{created.data['id']}/",
            {"is_active": False},
            format="json",
        )
        self.assertEqual(patched.status_code, 200, patched.data)
        self.assertFalse(patched.data["is_active"])

    def test_employee_duplicate_email_is_rejected(self):
        create_employee(email="duplicate@example.com")

        response = self.client.post(
            "/api/employees/",
            employee_payload(email="duplicate@example.com"),
            format="json",
        )

        self.assertEqual(response.status_code, 400)
        self.assertIn("email", response.data["errors"])

    def test_attendance_validation_bulk_mark_daily_and_summary(self):
        employee = create_employee()
        future = date.today() + timedelta(days=1)

        invalid = self.client.post(
            "/api/attendance/",
            {"employee": employee.id, "date": future.isoformat(), "status": "present"},
            format="json",
        )
        self.assertEqual(invalid.status_code, 400)

        bulk = self.client.post(
            "/api/attendance/bulk_mark/",
            {
                "date": date.today().isoformat(),
                "records": [
                    {
                        "employee": employee.id,
                        "status": "present",
                        "check_in": "08:00",
                        "check_out": "17:00",
                        "overtime_hours": "2.00",
                    }
                ],
            },
            format="json",
        )
        self.assertEqual(bulk.status_code, 200, bulk.data)
        self.assertEqual(bulk.data["created_count"], 1)

        daily = self.client.get(f"/api/attendance/daily/?date={date.today().isoformat()}")
        self.assertEqual(daily.status_code, 200, daily.data)
        self.assertEqual(daily.data["status_counts"]["present"], 1)

        shamsi_year, shamsi_month, _ = to_shamsi(date.today())
        summary = self.client.get(f"/api/attendance/summary/?employee={employee.id}&month={shamsi_month}&year={shamsi_year}")
        self.assertEqual(summary.status_code, 200, summary.data)
        self.assertEqual(summary.data["present"], 1)

    def test_payroll_create_calculates_salary_bonus_deductions_and_overtime(self):
        employee = create_employee(salary=Decimal("1200.00"))

        response = self.client.post(
            "/api/payrolls/",
            {
                "employee": employee.id,
                "payroll_period_start": "2026-03-01",
                "payroll_period_end": "2026-03-31",
                "basic_salary": "1200.00",
                "overtime_hours": "4.00",
                "overtime_rate": "15.00",
                "bonus": "100.00",
                "allowances": "50.00",
                "deductions": "25.00",
                "tax_deducted": "120.00",
                "currency": "USD",
                "payment_method": "cash",
            },
            format="json",
        )

        self.assertEqual(response.status_code, 201, response.data)
        self.assertEqual(Decimal(response.data["gross_pay"]), Decimal("1410.00"))
        self.assertEqual(Decimal(response.data["net_pay"]), Decimal("1265.00"))

    def test_bulk_payroll_duplicate_period_reports_error(self):
        employee = create_employee()
        create_payroll(employee=employee)

        response = self.client.post(
            "/api/payrolls/bulk_create_payroll/",
            {
                "employee_ids": [employee.id],
                "payroll_period_start": "2026-02-01",
                "payroll_period_end": "2026-02-28",
                "bonus": "0.00",
                "allowances": "0.00",
                "deductions": "0.00",
                "tax_percentage": "10.00",
                "payment_method": "cash",
            },
            format="json",
        )

        self.assertEqual(response.status_code, 201, response.data)
        self.assertEqual(response.data["errors"][0]["error"], "Payroll for this period already exists")

    def test_payroll_summary_filters_by_payment_method_and_date(self):
        employee = create_employee()
        create_payroll(employee=employee, payment_method="cash", payment_date=date(2026, 3, 1))
        create_payroll(
            employee=create_employee(email="bank@example.com"),
            payment_method="bank_transfer",
            payment_date=date(2026, 4, 1),
            payroll_period_start=date(2026, 3, 1),
            payroll_period_end=date(2026, 3, 31),
        )

        listed = self.client.get("/api/payrolls/?payment_method=cash&start_date=2026-03-01&end_date=2026-03-31")
        summary = self.client.get("/api/payrolls/summary/")

        self.assertEqual(listed.status_code, 200, listed.data)
        self.assertEqual(len(listed.data), 1)
        self.assertEqual(summary.status_code, 200, summary.data)
        self.assertEqual(summary.data["summary"]["total_records"], 2)

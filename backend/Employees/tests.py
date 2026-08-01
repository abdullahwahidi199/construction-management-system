from datetime import date, timedelta
from decimal import Decimal

from rest_framework.test import APITestCase

from common.calendar_utils import to_shamsi
from common.test_helpers import (
    create_admin,
    create_attendance,
    create_employee,
    create_payroll,
    create_salary_advance,
    employee_payload,
)
from Employees.models import Attendance, Employee, Payroll, PayrollAdvanceDeduction, PayrollPayment, SalaryAdvance


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

    def test_payroll_duplicate_employee_month_has_clear_validation_message(self):
        employee = create_employee(salary=Decimal("1200.00"))
        create_payroll(
            employee=employee,
            payroll_period_start=date(2026, 7, 1),
            payroll_period_end=date(2026, 7, 31),
        )

        response = self.client.post(
            "/api/payrolls/",
            {
                "employee": employee.id,
                "payroll_period_start": "2026-07-01",
                "payroll_period_end": "2026-07-31",
                "basic_salary": "1200.00",
                "currency": "USD",
                "payment_method": "cash",
                "advance_deduction_mode": "none",
            },
            format="json",
        )

        self.assertEqual(response.status_code, 400)
        self.assertIn("non_field_errors", response.data["errors"])
        self.assertIn("selected month", response.data["errors"]["non_field_errors"][0])

    def test_salary_advances_are_deducted_and_tracked_on_payroll(self):
        employee = create_employee(salary=Decimal("1200.00"))
        advance = create_salary_advance(employee=employee, amount=Decimal("200.00"), remaining_balance=Decimal("200.00"))

        outstanding = self.client.get(f"/api/payrolls/outstanding_advances/?employee={employee.id}")
        self.assertEqual(outstanding.status_code, 200, outstanding.data)
        self.assertEqual(Decimal(outstanding.data["total_outstanding"]), Decimal("200.00"))

        response = self.client.post(
            "/api/payrolls/",
            {
                "employee": employee.id,
                "payroll_period_start": "2026-04-01",
                "payroll_period_end": "2026-04-30",
                "basic_salary": "1200.00",
                "bonus": "100.00",
                "allowances": "50.00",
                "deductions": "25.00",
                "tax_deducted": "120.00",
                "currency": "USD",
                "payment_method": "cash",
                "advance_deduction_mode": "all",
            },
            format="json",
        )

        self.assertEqual(response.status_code, 201, response.data)
        self.assertEqual(Decimal(response.data["advance_deductions"]), Decimal("200.00"))
        self.assertEqual(Decimal(response.data["net_pay"]), Decimal("1005.00"))
        advance.refresh_from_db()
        self.assertEqual(advance.remaining_balance, Decimal("0.00"))
        self.assertEqual(advance.status, "deducted")
        self.assertEqual(PayrollAdvanceDeduction.objects.filter(advance=advance).count(), 1)

        history = self.client.get(f"/api/employees/{employee.id}/advance_history/")
        self.assertEqual(history.status_code, 200, history.data)
        self.assertEqual(history.data[0]["deductions"][0]["payroll"], response.data["id"])

    def test_payroll_advances_are_limited_to_selected_month_and_previous_months(self):
        employee = create_employee(salary=Decimal("2000.00"))
        may = create_salary_advance(
            employee=employee,
            amount=Decimal("100.00"),
            remaining_balance=Decimal("100.00"),
            date=date(2026, 5, 1),
        )
        july = create_salary_advance(
            employee=employee,
            amount=Decimal("150.00"),
            remaining_balance=Decimal("150.00"),
            date=date(2026, 7, 1),
        )
        august = create_salary_advance(
            employee=employee,
            amount=Decimal("300.00"),
            remaining_balance=Decimal("300.00"),
            date=date(2026, 8, 1),
        )

        outstanding = self.client.get(
            f"/api/payrolls/outstanding_advances/?employee={employee.id}&period_end=2026-07-31"
        )

        self.assertEqual(outstanding.status_code, 200, outstanding.data)
        self.assertEqual(
            {advance["id"] for advance in outstanding.data["advances"]},
            {may.id, july.id},
        )
        self.assertEqual(Decimal(outstanding.data["total_outstanding"]), Decimal("250.00"))

        response = self.client.post(
            "/api/payrolls/",
            {
                "employee": employee.id,
                "payroll_period_start": "2026-07-01",
                "payroll_period_end": "2026-07-31",
                "basic_salary": "2000.00",
                "currency": "USD",
                "payment_method": "cash",
                "advance_deduction_mode": "all",
            },
            format="json",
        )

        self.assertEqual(response.status_code, 201, response.data)
        self.assertEqual(Decimal(response.data["advance_deductions"]), Decimal("250.00"))
        may.refresh_from_db()
        july.refresh_from_db()
        august.refresh_from_db()
        self.assertEqual(may.remaining_balance, Decimal("0.00"))
        self.assertEqual(july.remaining_balance, Decimal("0.00"))
        self.assertEqual(august.remaining_balance, Decimal("300.00"))

    def test_payroll_rejects_advance_deduction_greater_than_payable_salary(self):
        employee = create_employee(salary=Decimal("300.00"))
        create_salary_advance(employee=employee, amount=Decimal("500.00"), remaining_balance=Decimal("500.00"))

        response = self.client.post(
            "/api/payrolls/",
            {
                "employee": employee.id,
                "payroll_period_start": "2026-05-01",
                "payroll_period_end": "2026-05-31",
                "basic_salary": "300.00",
                "deductions": "0.00",
                "tax_deducted": "0.00",
                "currency": "USD",
                "payment_method": "cash",
                "advance_deduction_mode": "all",
            },
            format="json",
        )

        self.assertEqual(response.status_code, 400)
        self.assertEqual(SalaryAdvance.objects.get(employee=employee).remaining_balance, Decimal("500.00"))

    def test_payroll_payments_update_partial_and_full_payment_status(self):
        employee = create_employee()
        payroll = create_payroll(employee=employee, payment_date=None)

        partial = self.client.post(
            f"/api/payrolls/{payroll.id}/record_payment/",
            {
                "amount": "500.00",
                "payment_date": "2026-03-05",
                "payment_method": "cash",
                "reference_number": "REC-001",
            },
            format="json",
        )
        self.assertEqual(partial.status_code, 201, partial.data)
        payroll.refresh_from_db()
        self.assertEqual(payroll.payment_status, "partially_paid")
        self.assertEqual(payroll.amount_paid, Decimal("500.00"))
        self.assertEqual(payroll.balance_due, payroll.net_pay - Decimal("500.00"))

        full = self.client.post(
            f"/api/payrolls/{payroll.id}/record_payment/",
            {
                "amount": str(payroll.balance_due),
                "payment_date": "2026-03-06",
                "payment_method": "bank_transfer",
            },
            format="json",
        )
        self.assertEqual(full.status_code, 201, full.data)
        payroll.refresh_from_db()
        self.assertEqual(payroll.payment_status, "fully_paid")
        self.assertEqual(payroll.balance_due, Decimal("0.00"))
        self.assertEqual(PayrollPayment.objects.filter(payroll=payroll).count(), 2)

    def test_employee_payroll_summary_includes_advance_and_payment_metrics(self):
        employee = create_employee(salary=Decimal("1200.00"))
        create_salary_advance(employee=employee, amount=Decimal("100.00"), remaining_balance=Decimal("40.00"))
        payroll = create_payroll(employee=employee, advance_deductions=Decimal("60.00"))
        PayrollPayment.objects.create(payroll=payroll, amount=Decimal("500.00"), payment_date=date(2026, 3, 10), payment_method="cash")
        payroll.refresh_payment_totals(save=True)

        shamsi_year = to_shamsi(payroll.payroll_period_start)[0]
        response = self.client.get(f"/api/employees/{employee.id}/payroll_summary/?year={shamsi_year}")

        self.assertEqual(response.status_code, 200, response.data)
        self.assertEqual(Decimal(response.data["summary"]["outstanding_advances"]), Decimal("40.00"))
        self.assertEqual(Decimal(response.data["summary"]["total_advances_given"]), Decimal("100.00"))
        self.assertEqual(Decimal(response.data["summary"]["total_advances_paid_this_year"]), Decimal("100.00"))
        self.assertEqual(Decimal(response.data["summary"]["total_advances_deducted"]), Decimal("60.00"))
        self.assertEqual(response.data["summary"]["total_payrolls_processed"], 1)
        self.assertEqual(Decimal(response.data["summary"]["total_amount_paid_this_year"]), Decimal("500.00"))
        self.assertEqual(Decimal(response.data["summary"]["total_outstanding_salary_this_year"]), payroll.balance_due)

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

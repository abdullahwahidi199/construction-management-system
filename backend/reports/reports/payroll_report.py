from collections import defaultdict
from decimal import Decimal

from Employees.models import Payroll
from labour.models import WorkerPayroll
from .base import BaseReport


ZERO = Decimal("0.00")


def money(value):
    if value is None or value == "":
        return ZERO
    return Decimal(str(value))


def empty_currency_summary(currency):
    return {
        "currency": currency,
        "count": 0,
        "employee_count": 0,
        "daily_worker_count": 0,
        "total_gross": ZERO,
        "total_net": ZERO,
        "total_tax": ZERO,
        "total_deductions": ZERO,
        "total_advances": ZERO,
    }


def empty_source_summary(source_type):
    return {
        "source_type": source_type,
        "count": 0,
        "total_gross": ZERO,
        "total_net": ZERO,
        "total_tax": ZERO,
        "total_deductions": ZERO,
        "total_advances": ZERO,
    }


class PayrollReport(BaseReport):
    report_name = "Payroll Report"

    def _employee_queryset(self):
        if self.filters.get("source_type") == "daily_worker":
            return Payroll.objects.none()

        qs = Payroll.objects.select_related("employee")

        employee_id = self.filters.get("employee_id")
        currency = self.filters.get("currency")
        payment_method = self.filters.get("payment_method")
        start, end = self.get_date_range()

        if employee_id:
            qs = qs.filter(employee_id=employee_id)
        if currency:
            qs = qs.filter(currency=currency)
        if payment_method:
            qs = qs.filter(payment_method=payment_method)
        if start:
            qs = qs.filter(payroll_period_start__gte=start)
        if end:
            qs = qs.filter(payroll_period_end__lte=end)

        return qs

    def _worker_queryset(self):
        if self.filters.get("source_type") == "employee":
            return WorkerPayroll.objects.none()

        qs = WorkerPayroll.objects.select_related("worker", "project")

        employee_id = self.filters.get("employee_id")
        currency = self.filters.get("currency")
        payment_method = self.filters.get("payment_method")
        start, end = self.get_date_range()

        if employee_id:
            qs = qs.filter(worker_id=employee_id)
        if currency:
            qs = qs.filter(currency=currency)
        if payment_method:
            qs = qs.filter(payment_method=payment_method)
        if start:
            qs = qs.filter(period_start__gte=start)
        if end:
            qs = qs.filter(period_end__lte=end)

        return qs

    def _add_summary(self, by_currency, by_source, row):
        currency = row["currency"] or "AFN"
        source_type = row["source_type"]

        if currency not in by_currency:
            by_currency[currency] = empty_currency_summary(currency)
        if source_type not in by_source:
            by_source[source_type] = empty_source_summary(source_type)

        currency_summary = by_currency[currency]
        source_summary = by_source[source_type]

        currency_summary["count"] += 1
        source_summary["count"] += 1

        if source_type == "Employee":
            currency_summary["employee_count"] += 1
        else:
            currency_summary["daily_worker_count"] += 1

        for key in [
            "total_gross",
            "total_net",
            "total_tax",
            "total_deductions",
            "total_advances",
        ]:
            row_key = key.replace("total_", "")
            amount = money(row.get(row_key))
            currency_summary[key] += amount
            source_summary[key] += amount

    def _employee_row(self, payroll):
        return {
            "id": f"employee-{payroll.id}",
            "source_type": "Employee",
            "employee": payroll.employee.full_name,
            "employee_id": payroll.employee.employee_id,
            "project": "",
            "department": payroll.employee.get_department_display(),
            "period_start": payroll.payroll_period_start,
            "period_end": payroll.payroll_period_end,
            "currency": payroll.currency,
            "basic_salary": payroll.basic_salary,
            "daily_rate": None,
            "overtime_hours": payroll.overtime_hours,
            "overtime_amount": payroll.overtime_amount,
            "bonus": payroll.bonus,
            "allowances": payroll.allowances,
            "gross": payroll.gross_pay,
            "gross_pay": payroll.gross_pay,
            "advances": ZERO,
            "deductions": payroll.deductions,
            "tax": payroll.tax_deducted,
            "tax_deducted": payroll.tax_deducted,
            "net": payroll.net_pay,
            "net_pay": payroll.net_pay,
            "status": "Paid" if payroll.payment_date else "Recorded",
            "payment_method": payroll.get_payment_method_display(),
            "payment_date": payroll.payment_date,
        }

    def _worker_row(self, payroll):
        overtime_amount = (
            money(payroll.overtime_hours) * money(payroll.overtime_rate_applied)
        )

        return {
            "id": f"daily-worker-{payroll.id}",
            "source_type": "Daily Worker",
            "employee": payroll.worker.full_name,
            "employee_id": payroll.worker.worker_id,
            "project": payroll.project.name if payroll.project else "",
            "department": payroll.worker.get_skill_type_display(),
            "period_start": payroll.period_start,
            "period_end": payroll.period_end,
            "currency": payroll.currency,
            "basic_salary": None,
            "daily_rate": payroll.daily_rate_applied,
            "overtime_hours": payroll.overtime_hours,
            "overtime_amount": overtime_amount,
            "bonus": ZERO,
            "allowances": ZERO,
            "gross": payroll.gross_amount,
            "gross_pay": payroll.gross_amount,
            "advances": payroll.advances,
            "deductions": payroll.deductions,
            "tax": ZERO,
            "tax_deducted": ZERO,
            "net": payroll.net_amount,
            "net_pay": payroll.net_amount,
            "status": payroll.get_status_display(),
            "payment_method": payroll.get_payment_method_display(),
            "payment_date": payroll.payment_date,
        }

    def generate(self):
        employee_rows = [self._employee_row(p) for p in self._employee_queryset()]
        worker_rows = [self._worker_row(p) for p in self._worker_queryset()]
        rows = sorted(
            [*employee_rows, *worker_rows],
            key=lambda row: (row["period_start"], row["source_type"], row["employee"]),
            reverse=True,
        )

        by_currency = defaultdict(dict)
        by_source = defaultdict(dict)

        for row in rows:
            self._add_summary(by_currency, by_source, row)

        total_gross = sum((money(row["gross"]) for row in rows), ZERO)
        total_net = sum((money(row["net"]) for row in rows), ZERO)
        total_deductions = sum((money(row["deductions"]) for row in rows), ZERO)
        total_tax = sum((money(row["tax"]) for row in rows), ZERO)
        total_advances = sum((money(row["advances"]) for row in rows), ZERO)

        return {
            **self.get_metadata(),
            "summary": {
                "total_records": len(rows),
                "employee_payroll_records": len(employee_rows),
                "daily_worker_payroll_records": len(worker_rows),
                "total_gross": total_gross,
                "total_net": total_net,
                "total_deductions": total_deductions,
                "total_tax": total_tax,
                "total_advances": total_advances,
                "by_currency": list(by_currency.values()),
                "by_source": list(by_source.values()),
            },
            "rows": rows,
        }

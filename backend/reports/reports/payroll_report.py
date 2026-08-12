from collections import defaultdict
from decimal import Decimal

from Employees.finance import SALARY_ADVANCE_CURRENCY, salary_advance_queryset
from Employees.models import Payroll
from common.work_calendar import get_work_calendar_service
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
        "salary_advance_count": 0,
        "daily_worker_count": 0,
        "total_gross": ZERO,
        "total_net": ZERO,
        "total_tax": ZERO,
        "total_deductions": ZERO,
        "total_advances": ZERO,
        "total_advance_deductions": ZERO,
        "total_amount_paid": ZERO,
        "total_balance_due": ZERO,
        "total_cash_outflow": ZERO,
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
        "total_advance_deductions": ZERO,
        "total_amount_paid": ZERO,
        "total_balance_due": ZERO,
        "total_cash_outflow": ZERO,
    }


class PayrollReport(BaseReport):
    report_name = "Payroll Report"

    def _calendar_summary(self):
        start, end = self.get_date_range()
        if not start or not end:
            return {
                "total_calendar_days": 0,
                "total_working_days": 0,
                "weekly_off_days": 0,
                "official_holidays": 0,
                "days": [],
            }
        return get_work_calendar_service().get_range_summary(start, end)

    def _employee_queryset(self):
        if self.filters.get("source_type") == "daily_worker":
            return Payroll.objects.none()

        qs = Payroll.objects.select_related("employee", "project")

        employee_id = self.filters.get("employee_id")
        project_id = self.filters.get("project_id")
        employment_type = self.filters.get("employment_type")
        currency = self.filters.get("currency")
        payment_method = self.filters.get("payment_method")
        start, end = self.get_date_range()

        if employee_id:
            qs = qs.filter(employee_id=employee_id)
        if project_id:
            qs = qs.filter(project_id=project_id)
        if employment_type:
            qs = qs.filter(allocation_type=employment_type)
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

    def _salary_advance_queryset(self):
        if self.filters.get("source_type") == "daily_worker":
            return salary_advance_queryset().none()
        currency = self.filters.get("currency")
        payment_method = self.filters.get("payment_method")
        if currency and currency != SALARY_ADVANCE_CURRENCY:
            return salary_advance_queryset().none()
        if payment_method:
            return salary_advance_queryset().none()

        start, end = self.get_date_range()
        return salary_advance_queryset(
            start=start,
            end=end,
            employee_id=self.filters.get("employee_id"),
        )

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
        elif source_type == "Salary Advance":
            currency_summary["salary_advance_count"] += 1
        else:
            currency_summary["daily_worker_count"] += 1

        for key in [
            "total_gross",
            "total_net",
            "total_tax",
            "total_deductions",
            "total_advances",
            "total_advance_deductions",
            "total_amount_paid",
            "total_balance_due",
            "total_cash_outflow",
        ]:
            row_key = "advance_paid" if key == "total_advances" else key.replace("total_", "")
            amount = money(row.get(row_key))
            currency_summary[key] += amount
            source_summary[key] += amount

    def _employee_row(self, payroll):
        return {
            "id": f"employee-{payroll.id}",
            "source_type": "Employee",
            "employee": payroll.employee.full_name,
            "employee_id": payroll.employee.employee_id,
            "employment_type": payroll.get_allocation_type_display(),
            "project": payroll.project.name if payroll.project else "",
            "project_id": payroll.project_id,
            "payroll_classification": (
                "Project Payroll" if payroll.allocation_type == Payroll.AllocationType.PROJECT
                else "Office Payroll"
            ),
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
            "advances": payroll.advance_deductions,
            "advance_paid": ZERO,
            "advance_deductions": payroll.advance_deductions,
            "cash_outflow": payroll.net_pay,
            "deductions": payroll.deductions,
            "tax": payroll.tax_deducted,
            "tax_deducted": payroll.tax_deducted,
            "net": payroll.net_pay,
            "net_pay": payroll.net_pay,
            "amount_paid": payroll.amount_paid,
            "balance_due": payroll.balance_due,
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
            "employment_type": "Project Worker",
            "project": payroll.project.name if payroll.project else "",
            "project_id": payroll.project_id,
            "payroll_classification": "Project Payroll",
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
            "advance_paid": payroll.advances,
            "advance_deductions": payroll.advances,
            "cash_outflow": payroll.net_amount,
            "deductions": payroll.deductions,
            "tax": ZERO,
            "tax_deducted": ZERO,
            "net": payroll.net_amount,
            "net_pay": payroll.net_amount,
            "amount_paid": payroll.net_amount if payroll.status == "paid" else ZERO,
            "balance_due": ZERO if payroll.status == "paid" else payroll.net_amount,
            "status": payroll.get_status_display(),
            "payment_method": payroll.get_payment_method_display(),
            "payment_date": payroll.payment_date,
        }

    def _salary_advance_row(self, advance):
        return {
            "id": f"salary-advance-{advance.id}",
            "source_type": "Salary Advance",
            "employee": advance.employee.full_name,
            "employee_id": advance.employee.employee_id,
            "employment_type": "Salary Advance",
            "project": "",
            "project_id": None,
            "payroll_classification": "Salary Advance",
            "department": advance.employee.get_department_display(),
            "period_start": advance.date,
            "period_end": advance.date,
            "currency": SALARY_ADVANCE_CURRENCY,
            "basic_salary": None,
            "daily_rate": None,
            "overtime_hours": ZERO,
            "overtime_amount": ZERO,
            "bonus": ZERO,
            "allowances": ZERO,
            "gross": ZERO,
            "gross_pay": ZERO,
            "advances": advance.amount,
            "advance_paid": advance.amount,
            "advance_deductions": ZERO,
            "cash_outflow": advance.amount,
            "deductions": ZERO,
            "tax": ZERO,
            "tax_deducted": ZERO,
            "net": ZERO,
            "net_pay": ZERO,
            "amount_paid": advance.amount,
            "balance_due": ZERO,
            "status": advance.get_status_display(),
            "payment_method": "Advance",
            "payment_date": advance.date,
        }

    def generate(self):
        employee_rows = [self._employee_row(p) for p in self._employee_queryset()]
        salary_advance_rows = [
            self._salary_advance_row(advance)
            for advance in self._salary_advance_queryset()
        ]
        worker_rows = [self._worker_row(p) for p in self._worker_queryset()]
        rows = sorted(
            [*employee_rows, *salary_advance_rows, *worker_rows],
            key=lambda row: (row["period_start"], row["source_type"], row["employee"]),
            reverse=True,
        )

        by_currency = defaultdict(dict)
        by_source = defaultdict(dict)
        by_project = defaultdict(lambda: {"project": "", "count": 0, "total_paid": ZERO, "total_net": ZERO})
        office_payroll = {"count": 0, "total_paid": ZERO, "total_net": ZERO}

        for row in rows:
            self._add_summary(by_currency, by_source, row)
            if row.get("payroll_classification") == "Project Payroll" and row.get("project"):
                project_key = row.get("project_id") or row["project"]
                by_project[project_key]["project"] = row["project"]
                by_project[project_key]["count"] += 1
                by_project[project_key]["total_paid"] += money(row.get("amount_paid"))
                by_project[project_key]["total_net"] += money(row.get("net_pay"))
            elif row.get("payroll_classification") == "Office Payroll":
                office_payroll["count"] += 1
                office_payroll["total_paid"] += money(row.get("amount_paid"))
                office_payroll["total_net"] += money(row.get("net_pay"))

        total_gross = sum((money(row["gross"]) for row in rows), ZERO)
        total_net = sum((money(row["net"]) for row in rows), ZERO)
        total_deductions = sum((money(row["deductions"]) for row in rows), ZERO)
        total_tax = sum((money(row["tax"]) for row in rows), ZERO)
        total_advances = sum((money(row["advance_paid"]) for row in rows), ZERO)
        total_advance_deductions = sum((money(row["advance_deductions"]) for row in rows), ZERO)
        total_amount_paid = sum((money(row["amount_paid"]) for row in rows), ZERO)
        total_balance_due = sum((money(row["balance_due"]) for row in rows), ZERO)
        total_cash_outflow = sum((money(row["cash_outflow"]) for row in rows), ZERO)
        calendar_summary = self._calendar_summary()

        return {
            **self.get_metadata(),
            "summary": {
                "total_records": len(rows),
                "total_calendar_days": calendar_summary["total_calendar_days"],
                "total_working_days": calendar_summary["total_working_days"],
                "weekly_off_days": calendar_summary["weekly_off_days"],
                "official_holidays": calendar_summary["official_holidays"],
                "employee_payroll_records": len(employee_rows),
                "salary_advance_records": len(salary_advance_rows),
                "daily_worker_payroll_records": len(worker_rows),
                "total_gross": total_gross,
                "total_net": total_net,
                "total_deductions": total_deductions,
                "total_tax": total_tax,
                "total_advances": total_advances,
                "total_advance_deductions": total_advance_deductions,
                "total_amount_paid": total_amount_paid,
                "total_balance_due": total_balance_due,
                "total_cash_outflow": total_cash_outflow,
                "by_currency": list(by_currency.values()),
                "by_source": list(by_source.values()),
                "project_payroll": list(by_project.values()),
                "office_payroll": office_payroll,
                "calendar_summary": calendar_summary,
            },
            "rows": rows,
        }

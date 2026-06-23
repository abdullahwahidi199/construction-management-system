from decimal import Decimal
from django.db.models import Sum, Count, Value, DecimalField
from django.db.models.functions import Coalesce

from Employees.models import Payroll  # adjust import
from .base import BaseReport


class PayrollReport(BaseReport):
    report_name = "Payroll Report"

    def _base_queryset(self):
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

    def generate(self):
        qs = self._base_queryset()

        rows = []
        for p in qs:
            rows.append({
                "id": p.id,
                "employee": p.employee.full_name,
                "employee_id": p.employee.employee_id,
                "department": p.employee.get_department_display(),
                "period_start": p.payroll_period_start,
                "period_end": p.payroll_period_end,
                "currency": p.currency,
                "basic_salary": p.basic_salary,
                "overtime_amount": p.overtime_amount,
                "bonus": p.bonus,
                "allowances": p.allowances,
                "deductions": p.deductions,
                "tax_deducted": p.tax_deducted,
                "gross_pay": p.gross_pay,
                "net_pay": p.net_pay,
                "payment_method": p.get_payment_method_display(),
                "payment_date": p.payment_date,
            })

        # Aggregates split by currency
        currency_summary = list(
            qs.values("currency").annotate(
                count=Count("id"),
                total_gross=Coalesce(Sum("gross_pay"), Value(Decimal("0")),
                                     output_field=DecimalField(max_digits=18, decimal_places=2)),
                total_net=Coalesce(Sum("net_pay"), Value(Decimal("0")),
                                   output_field=DecimalField(max_digits=18, decimal_places=2)),
                total_tax=Coalesce(Sum("tax_deducted"), Value(Decimal("0")),
                                   output_field=DecimalField(max_digits=18, decimal_places=2)),
                total_deductions=Coalesce(Sum("deductions"), Value(Decimal("0")),
                                          output_field=DecimalField(max_digits=18, decimal_places=2)),
            ).order_by("currency")
        )

        return {
            **self.get_metadata(),
            "summary": {
                "total_records": len(rows),
                "by_currency": currency_summary,
            },
            "rows": rows,
        }
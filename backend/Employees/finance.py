from decimal import Decimal

from django.db.models import Count, DecimalField, ExpressionWrapper, F, Sum
from django.db.models.functions import Coalesce

from .models import SalaryAdvance


ZERO = Decimal("0.00")
SALARY_ADVANCE_CURRENCY = "AFN"


def salary_advance_queryset(start=None, end=None, employee_id=None):
    queryset = SalaryAdvance.objects.select_related("employee").exclude(
        status="cancelled",
    )
    if employee_id:
        queryset = queryset.filter(employee_id=employee_id)
    if start:
        queryset = queryset.filter(date__gte=start)
    if end:
        queryset = queryset.filter(date__lte=end)
    return queryset


def salary_advance_totals(queryset=None):
    queryset = queryset if queryset is not None else salary_advance_queryset()
    deducted = ExpressionWrapper(
        F("amount") - F("remaining_balance"),
        output_field=DecimalField(max_digits=12, decimal_places=2),
    )
    totals = queryset.aggregate(
        total_paid=Coalesce(Sum("amount"), ZERO),
        outstanding=Coalesce(Sum("remaining_balance"), ZERO),
        total_deducted=Coalesce(Sum(deducted), ZERO),
        count=Count("id"),
    )
    totals["currency"] = SALARY_ADVANCE_CURRENCY
    totals["total_usd"] = ZERO
    totals["total_afn"] = totals["total_paid"]
    totals["outstanding_usd"] = ZERO
    totals["outstanding_afn"] = totals["outstanding"]
    totals["deducted_usd"] = ZERO
    totals["deducted_afn"] = totals["total_deducted"]
    return totals

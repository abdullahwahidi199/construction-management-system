from decimal import Decimal

from django.db.models import (
    Sum, Count, Value, DecimalField, Q, OuterRef, Subquery
)
from django.db.models.functions import Coalesce

from project.models import Project
from expenses.models import Expense
from Employees.models import Payroll
from subcontractor.models import Contract
from .base import BaseReport


ZERO = Value(
    Decimal("0"),
    output_field=DecimalField(max_digits=18, decimal_places=2)
)


def money_sum(field, filter_q=None):
    kwargs = {"filter": filter_q} if filter_q else {}
    return Coalesce(
        Sum(field, **kwargs),
        ZERO,
        output_field=DecimalField(max_digits=18, decimal_places=2),
    )


class FinancialOverviewReport(BaseReport):
    report_name = "Financial Overview Report"

    def generate(self):
        start, end = self.get_date_range()
        project_id = self.filters.get("project_id")

        # =====================================================
        # EXPENSES (UNCHANGED - SAFE)
        # =====================================================
        exp_qs = Expense.objects.all()

        if project_id:
            exp_qs = exp_qs.filter(project_id=project_id)
        if start:
            exp_qs = exp_qs.filter(expense_date__gte=start)
        if end:
            exp_qs = exp_qs.filter(expense_date__lte=end)

        exp_totals = exp_qs.aggregate(
            total_afn=money_sum("amount_afn"),
            total_usd=money_sum("amount_usd"),
            count=Count("id"),
        )

        # =====================================================
        # PAYROLL (UNCHANGED - SAFE)
        # =====================================================
        pay_qs = Payroll.objects.all()

        if start:
            pay_qs = pay_qs.filter(payroll_period_start__gte=start)
        if end:
            pay_qs = pay_qs.filter(payroll_period_end__lte=end)

        payroll_totals = pay_qs.aggregate(
            net_afn=money_sum("net_pay", Q(currency="AFN")),
            net_usd=money_sum("net_pay", Q(currency="USD")),
            gross_afn=money_sum("gross_pay", Q(currency="AFN")),
            gross_usd=money_sum("gross_pay", Q(currency="USD")),
            count=Count("id"),
        )

        # =====================================================
        # CONTRACTS (FIXED: NO JOIN MULTIPLICATION)
        # =====================================================

        # ---- SUBQUERY: payments per contract ----
        payments_sub = Contract.objects.filter(
            id=OuterRef("id")
        ).annotate(
            total=Coalesce(Sum("payments__amount"), ZERO)
        ).values("total")[:1]

        # ---- SUBQUERY: variations per contract ----
        variations_sub = Contract.objects.filter(
            id=OuterRef("id")
        ).annotate(
            total=Coalesce(
                Sum("variations__amount_change", filter=Q(variations__approved=True)),
                ZERO
            )
        ).values("total")[:1]

        contract_qs = Contract.objects.all()

        if project_id:
            contract_qs = contract_qs.filter(project_id=project_id)

        # ---- clean per-contract annotation ----
        contract_qs = contract_qs.annotate(
            total_paid=Coalesce(Subquery(payments_sub), ZERO),
            total_variation=Coalesce(Subquery(variations_sub), ZERO),
        )

        # ---- SAFE GROUPING (NO DUPLICATION POSSIBLE) ----
        contract_summary = contract_qs.values("currency").annotate(
            total_contract_value=Sum("contract_value"),
            total_paid=Sum("total_paid"),
            total_variation=Sum("total_variation"),
            count=Count("id"),
        ).order_by("currency")

        # =====================================================
        # PROJECT BUDGETS
        # =====================================================
        proj_qs = Project.objects.all()

        if project_id:
            proj_qs = proj_qs.filter(id=project_id)

        budget_total = proj_qs.aggregate(
            total_afn=money_sum("estimated_budget", Q(budget_currency="AFN")),
            total_usd=money_sum("estimated_budget", Q(budget_currency="USD")),
        )

        # =====================================================
        # RESPONSE
        # =====================================================
        return {
            **self.get_metadata(),
            "expenses": exp_totals,
            "payroll": payroll_totals,
            "contracts": list(contract_summary),
            "total_estimated_budget": budget_total,
        }

from decimal import Decimal
from django.db.models import Sum, Count, F, Value, DecimalField
from django.db.models.functions import Coalesce

from project.models import Project
from .base import BaseReport


class ProjectSummaryReport(BaseReport):
    report_name = "Project Summary Report"

    def generate(self):
        qs = Project.objects.all()

        # ─────────────────────────────────────────────
        # Filters
        # ─────────────────────────────────────────────
        status = self.filters.get("status")
        property_type = self.filters.get("property_type")
        start, end = self.get_date_range()

        if status:
            qs = qs.filter(status=status)
        if property_type:
            qs = qs.filter(property_type=property_type)
        if start:
            qs = qs.filter(start_date__gte=start)
        if end:
            qs = qs.filter(start_date__lte=end)

        # ─────────────────────────────────────────────
        # Expense aggregation (USD + AFN)
        # ─────────────────────────────────────────────
        qs = qs.annotate(
            total_expense_usd=Coalesce(
                Sum("expenses__amount_usd"),
                Value(Decimal("0")),
                output_field=DecimalField(max_digits=18, decimal_places=2),
            ),
            total_expense_afn=Coalesce(
                Sum("expenses__amount_afn"),
                Value(Decimal("0")),
                output_field=DecimalField(max_digits=18, decimal_places=2),
            ),
            expense_count=Count("expenses"),
        )

        rows = []
        total_budget = Decimal("0")
        total_budget_usd = Decimal("0")
        total_budget_afn = Decimal("0")

        total_spent_usd = Decimal("0")
        total_spent_afn = Decimal("0")

        # ─────────────────────────────────────────────
        # Loop projects
        # ─────────────────────────────────────────────
        for p in qs:
            budget = p.estimated_budget or Decimal("0")
            budget_currency = p.budget_currency or "AFN"

            # ── EXPENSES
            spent_usd_expenses = p.total_expense_usd or Decimal("0")
            spent_afn_expenses = p.total_expense_afn or Decimal("0")

            # ── CONTRACTS (already separated by currency)
            contract_usd = Decimal("0")
            contract_afn = Decimal("0")

            for contract in p.subcontractor_contracts.all():
                contract_payments = contract.total_paid or Decimal("0")

                if contract.currency == "USD":
                    contract_usd += contract_payments
                else:
                    contract_afn += contract_payments

            # ── TOTALS (no conversion)
            project_total_usd = spent_usd_expenses + contract_usd
            project_total_afn = spent_afn_expenses + contract_afn

            # ── GLOBAL SUMS
            total_budget += budget
            if budget_currency == "USD":
                total_budget_usd += budget
            else:
                total_budget_afn += budget
            total_spent_usd += project_total_usd
            total_spent_afn += project_total_afn

            rows.append({
                "id": p.id,
                "name": p.name,
                "property_type": p.get_property_type_display(),
                "location": p.location,
                "status": p.get_status_display(),
                "total_floors": p.total_floors,
                "start_date": p.start_date,
                "expected_completion_date": p.expected_completion_date,
                "actual_completion_date": p.actual_completion_date,

                "estimated_budget": budget,
                "budget_currency": budget_currency,

                # ── EXPENSE BREAKDOWN
                "expenses_usd": spent_usd_expenses,
                "expenses_afn": spent_afn_expenses,

                # ── CONTRACT BREAKDOWN
                "contracts_usd": contract_usd,
                "contracts_afn": contract_afn,

                # ── TOTAL SPENT (SEPARATED CURRENCIES)
                "total_spent_usd": project_total_usd,
                "total_spent_afn": project_total_afn,

                "expense_count": p.expense_count,

                "budget_remaining": (
                    budget - project_total_usd
                    if budget_currency == "USD"
                    else budget - project_total_afn
                ),
            })

        # ─────────────────────────────────────────────
        # Status breakdown
        # ─────────────────────────────────────────────
        status_breakdown = list(
            qs.values("status")
              .annotate(count=Count("id"))
              .order_by("status")
        )

        # ─────────────────────────────────────────────
        # Final response
        # ─────────────────────────────────────────────
        return {
            **self.get_metadata(),

            "summary": {
                "total_projects": len(rows),
                "total_estimated_budget": total_budget,
                "total_estimated_budget_usd": total_budget_usd,
                "total_estimated_budget_afn": total_budget_afn,

                "total_spent_usd": total_spent_usd,
                "total_spent_afn": total_spent_afn,

                "remaining_budget_usd": None,  # intentionally not mixed
                "remaining_budget_afn": None,
            },

            "status_breakdown": status_breakdown,
            "rows": rows,
        }

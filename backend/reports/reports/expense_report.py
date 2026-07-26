from decimal import Decimal
from django.db.models import Sum, Count, Value, DecimalField
from django.db.models.functions import Coalesce, TruncMonth

from expenses.models import Expense
from .base import BaseReport


class ExpenseReport(BaseReport):
    report_name = "Expense Report"

    # ---------------------------------------------------------
    # BASE QUERYSET
    # ---------------------------------------------------------
    def _base_queryset(self):
        requested_status = self.filters.get("status") or self.filters.get("approval_status")
        qs = Expense.objects.select_related("project")
        if requested_status:
            qs = qs.filter(approval_status=requested_status)
        else:
            qs = qs.approved()

        project_id = self.filters.get("project_id")
        expense_scope = self.filters.get("expense_scope")
        expense_type = self.filters.get("expense_type")
        start, end = self.get_date_range()

        if project_id:
            qs = qs.filter(project_id=project_id)
        if expense_scope:
            qs = qs.filter(expense_scope=expense_scope)
        if expense_type:
            qs = qs.filter(expense_type=expense_type)
        if start:
            qs = qs.filter(expense_date__gte=start)
        if end:
            qs = qs.filter(expense_date__lte=end)

        return qs

    # ---------------------------------------------------------
    # REPORT GENERATION
    # ---------------------------------------------------------
    def generate(self):
        qs = self._base_queryset()

        # =====================================================
        # 1. GLOBAL SUMMARY (FAST SQL AGGREGATION)
        # =====================================================
        totals = qs.aggregate(
            total_afn=Coalesce(
                Sum("amount_afn"),
                Value(Decimal("0")),
                output_field=DecimalField(max_digits=18, decimal_places=2),
            ),
            total_usd=Coalesce(
                Sum("amount_usd"),
                Value(Decimal("0")),
                output_field=DecimalField(max_digits=18, decimal_places=2),
            ),
        )
        project_totals = qs.filter(
            expense_scope=Expense.ExpenseScope.PROJECT,
        ).aggregate(
            total_afn=Coalesce(Sum("amount_afn"), Value(Decimal("0"))),
            total_usd=Coalesce(Sum("amount_usd"), Value(Decimal("0"))),
            count=Count("id"),
        )
        office_totals = qs.filter(
            expense_scope=Expense.ExpenseScope.OFFICE,
        ).aggregate(
            total_afn=Coalesce(Sum("amount_afn"), Value(Decimal("0"))),
            total_usd=Coalesce(Sum("amount_usd"), Value(Decimal("0"))),
            count=Count("id"),
        )

        # =====================================================
        # 2. EXPENSE TYPE BREAKDOWN
        # =====================================================
        type_breakdown = list(
            qs.values("expense_type")
            .annotate(
                count=Count("id"),
                total_afn=Coalesce(Sum("amount_afn"), Value(Decimal("0"))),
                total_usd=Coalesce(Sum("amount_usd"), Value(Decimal("0"))),
            )
            .order_by("-total_usd")
        )

        # =====================================================
        # 3. MONTHLY TREND ANALYSIS
        # =====================================================
        monthly_trend = list(
            qs.annotate(month=TruncMonth("expense_date"))
            .values("month")
            .annotate(
                count=Count("id"),
                total_afn=Coalesce(Sum("amount_afn"), Value(Decimal("0"))),
                total_usd=Coalesce(Sum("amount_usd"), Value(Decimal("0"))),
            )
            .order_by("month")
        )

        # =====================================================
        # 4. OPTIONAL: LIGHTWEIGHT PREVIEW ROWS (NOT FULL DATA)
        # =====================================================
        preview_rows = []
        preview_values = qs.order_by("-expense_date")[:20].values(
            "id",
            "serial_number",
            "expense_date",
            "expense_scope",
            "expense_type",
            "amount_afn",
            "amount_usd",
            "project_id",
            "project__name",
            "approval_status",
        )
        for row in preview_values:
            row["total_usd"] = row["amount_usd"]
            row["total_afn"] = row["amount_afn"]
            if row["expense_scope"] == Expense.ExpenseScope.OFFICE:
                row["project__name"] = "Office"
            row["project"] = row["project__name"] or ""
            preview_rows.append(row)

        # =====================================================
        # 5. FINAL RESPONSE
        # =====================================================
        return {
            **self.get_metadata(),
            "summary": {
                "total_records": qs.count(),
                "total_project_expenses_afn": project_totals["total_afn"],
                "total_project_expenses_usd": project_totals["total_usd"],
                "total_project_expense_count": project_totals["count"],
                "total_office_expenses_afn": office_totals["total_afn"],
                "total_office_expenses_usd": office_totals["total_usd"],
                "total_office_expense_count": office_totals["count"],
                "overall_total_expenses_afn": totals["total_afn"],
                "overall_total_expenses_usd": totals["total_usd"],
                **totals,
            },
            "type_breakdown": type_breakdown,
            "monthly_trend": monthly_trend,
            "rows": preview_rows,
            "preview": preview_rows,
        }

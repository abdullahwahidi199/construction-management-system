from decimal import Decimal
from django.db.models import Sum, Count, Value, DecimalField
from django.db.models.functions import Coalesce

from subcontractor.models import Contract
from .base import BaseReport


class ContractReport(BaseReport):
    report_name = "Subcontractor Contract Report"

    # ---------------------------------------------------------
    # BASE QUERYSET (ONLY FILTERING - NO JOINS, NO ANNOTATION)
    # ---------------------------------------------------------
    def _base_queryset(self):
        qs = Contract.objects.select_related("project", "subcontractor")

        project_id = self.filters.get("project_id")
        subcontractor_id = self.filters.get("subcontractor_id")
        status = self.filters.get("status")
        currency = self.filters.get("currency")

        if project_id:
            qs = qs.filter(project_id=project_id)
        if subcontractor_id:
            qs = qs.filter(subcontractor_id=subcontractor_id)
        if status:
            qs = qs.filter(status=status)
        if currency:
            qs = qs.filter(currency=currency)

        return qs

    # ---------------------------------------------------------
    # REPORT GENERATION
    # ---------------------------------------------------------
    def generate(self):
        base_qs = self._base_queryset()

        # =====================================================
        # ROW DATA (SAFE ANNOTATION PER CONTRACT)
        # =====================================================
        qs = base_qs.annotate(
            total_paid_db=Coalesce(
                Sum("payments__amount"),
                Value(Decimal("0")),
                output_field=DecimalField(max_digits=18, decimal_places=2),
            ),
            total_invoiced_db=Coalesce(
                Sum("invoices__amount"),
                Value(Decimal("0")),
                output_field=DecimalField(max_digits=18, decimal_places=2),
            ),
        )

        rows = []
        total_contracts = qs.count()

        for c in qs:
            paid = c.total_paid_db or Decimal("0")
            invoiced = c.total_invoiced_db or Decimal("0")

            rows.append({
                "id": c.id,
                "contract_number": c.contract_number,
                "title": c.title,
                "project": c.project.name,
                "subcontractor": c.subcontractor.name,
                "currency": c.currency,

                "contract_value": c.contract_value,
                "retention_amount": c.retention_amount,
                "completion_percentage": c.completion_percentage,
                "status": c.get_status_display(),

                "start_date": c.start_date,
                "end_date": c.end_date,

                "total_paid": paid,
                "total_invoiced": invoiced,

                "remaining_amount": c.contract_value - paid,
            })

        # =====================================================
        # SAFE SUMMARY (NO JOINED SUM ON MULTIPLE RELATIONS)
        # =====================================================

        # We rebuild clean aggregation in Python to avoid SQL duplication
        currency_map = {}

        for c in base_qs.prefetch_related("payments"):
            cur = c.currency

            if cur not in currency_map:
                currency_map[cur] = {
                    "currency": cur,
                    "count": 0,
                    "total_value": Decimal("0"),
                    "total_paid": Decimal("0"),
                }

            currency_map[cur]["count"] += 1
            currency_map[cur]["total_value"] += c.adjusted_contract_value

            paid = sum(p.amount for p in c.payments.all())
            currency_map[cur]["total_paid"] += paid

        currency_summary = list(currency_map.values())

        # =====================================================
        # STATUS BREAKDOWN (SAFE)
        # =====================================================
        status_breakdown = list(
            base_qs.values("status")
            .annotate(count=Count("id"))
            .order_by("status")
        )

        # =====================================================
        # FINAL RESPONSE
        # =====================================================
        return {
            **self.get_metadata(),
            "summary": {
                "total_contracts": total_contracts,
                "status_breakdown": status_breakdown,
                "by_currency": currency_summary,
            },
            "rows": rows,
        }
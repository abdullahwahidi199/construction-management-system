from decimal import Decimal
from django.db.models import Count, Prefetch

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

        from expenses.models import Expense

        rows = []
        total_contracts = base_qs.count()
        qs = base_qs.prefetch_related(
            "payments",
            "invoices",
            Prefetch(
                "expenses",
                queryset=Expense.objects.approved().only(
                    "id",
                    "contract",
                    "amount_usd",
                    "amount_afn",
                ),
                to_attr="approved_expenses",
            ),
        )

        for c in qs:
            paid = sum((payment.amount or Decimal("0")) for payment in c.payments.all())
            invoiced = sum((invoice.amount or Decimal("0")) for invoice in c.invoices.all())
            contract_expenses_usd = sum(
                (expense.amount_usd or Decimal("0"))
                for expense in getattr(c, "approved_expenses", [])
            )
            contract_expenses_afn = sum(
                (expense.amount_afn or Decimal("0"))
                for expense in getattr(c, "approved_expenses", [])
            )
            payment_usd = paid if c.currency == "USD" else Decimal("0")
            payment_afn = paid if c.currency == "AFN" else Decimal("0")
            cash_outflow_usd = payment_usd + contract_expenses_usd
            cash_outflow_afn = payment_afn + contract_expenses_afn

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
                "contract_expenses_usd": contract_expenses_usd,
                "contract_expenses_afn": contract_expenses_afn,
                "cash_outflow_usd": cash_outflow_usd,
                "cash_outflow_afn": cash_outflow_afn,
                "net_position_usd": -cash_outflow_usd,
                "net_position_afn": -cash_outflow_afn,

                "remaining_amount": c.adjusted_contract_value - paid,
            })

        # =====================================================
        # SAFE SUMMARY (NO JOINED SUM ON MULTIPLE RELATIONS)
        # =====================================================

        # We rebuild clean aggregation in Python to avoid SQL duplication
        currency_map = {}

        for c in qs:
            cur = c.currency

            if cur not in currency_map:
                currency_map[cur] = {
                    "currency": cur,
                    "count": 0,
                    "total_value": Decimal("0"),
                    "total_paid": Decimal("0"),
                    "contract_expenses_usd": Decimal("0"),
                    "contract_expenses_afn": Decimal("0"),
                }

            currency_map[cur]["count"] += 1
            currency_map[cur]["total_value"] += c.adjusted_contract_value

            paid = sum((p.amount or Decimal("0")) for p in c.payments.all())
            currency_map[cur]["total_paid"] += paid
            currency_map[cur]["contract_expenses_usd"] += sum(
                (expense.amount_usd or Decimal("0"))
                for expense in getattr(c, "approved_expenses", [])
            )
            currency_map[cur]["contract_expenses_afn"] += sum(
                (expense.amount_afn or Decimal("0"))
                for expense in getattr(c, "approved_expenses", [])
            )

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

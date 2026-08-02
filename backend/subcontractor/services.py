from decimal import Decimal
from datetime import timedelta

from django.db import transaction
from django.db.models import Q, Sum

from .models import (
    Contract,
    ContractPayment,
    ContractVariation,
    ContractStatusChoices,
    PaymentTypeChoices,
    ContractInvoice
)


class ContractService:
    """Business-logic layer for contract operations."""

    ZERO = Decimal("0.00")

    # ── payment creation (race-condition safe) ──

    @staticmethod
    @transaction.atomic
    def create_payment(contract: Contract, validated_data: dict) -> ContractPayment:
        """
        Create a payment with row-level locking to prevent
        concurrent requests from exceeding the adjusted value.
        """
        # lock the contract row
        contract = Contract.objects.select_for_update().get(pk=contract.pk)

        if not contract.can_accept_payments():
            raise ValueError(
                f"Cannot add payments to a contract in '{contract.status}' status."
            )

        amount = validated_data['amount']
        existing_paid = contract.payments.aggregate(
            total=Sum('amount'),
        )['total'] or Decimal('0.00')

        if existing_paid + amount > contract.adjusted_contract_value:
            raise ValueError(
                f"Total payments ({existing_paid + amount}) would exceed "
                f"adjusted contract value ({contract.adjusted_contract_value})."
            )

        return ContractPayment.objects.create(contract=contract, **validated_data)

    # ── variation approval ─────────────────────

    @staticmethod
    @transaction.atomic
    def approve_variation(variation: ContractVariation) -> ContractVariation:
        """
        Approve a variation after verifying that the adjusted
        contract value stays above total paid.
        """
        if variation.approved:
            raise ValueError("Variation is already approved.")

        contract = variation.contract
        prospective_adjusted = (
            contract.adjusted_contract_value + variation.amount_change
        )
        total_paid = contract.total_paid

        if prospective_adjusted < total_paid and variation.amount_change < 0:
            raise ValueError(
                f"Cannot approve: adjusted value ({prospective_adjusted}) "
                f"would fall below total paid ({total_paid})."
            )

        variation.approved = True
        variation.save(update_fields=['approved'])
        return variation

    # ── financial summary: single contract ─────

    from django.db.models import Sum
    from decimal import Decimal

    @staticmethod
    def get_financial_summary(contract: Contract) -> dict:
        summary = contract.financial_summary

        total_invoiced = ContractInvoice.objects.filter(
            contract=contract
        ).aggregate(
            total=Sum("amount")
        )["total"] or Decimal("0.00")

        adjusted_contract_value = summary["adjusted_contract_value"]

        invoice_balance = adjusted_contract_value - total_invoiced

        summary["total_invoiced"] = total_invoiced
        summary["invoice_balance"] = invoice_balance
        summary.update(ContractService.get_contract_expense_summary(contract))

        return summary

    @staticmethod
    def contract_expenses_queryset(contract: Contract):
        from expenses.models import Expense

        return (
            Expense.objects.approved()
            .filter(contract=contract)
            .select_related("project", "contract")
            .only(
                "id",
                "expense_scope",
                "serial_number",
                "project",
                "expense_date",
                "description",
                "remarks",
                "paid_to",
                "amount_usd",
                "amount_afn",
                "exchange_rate",
                "expense_type",
                "approval_status",
                "project__name",
                "contract__contract_number",
                "contract__title",
            )
        )

    @staticmethod
    def _expense_equivalent_totals(queryset):
        from expenses.services import expense_currency_totals

        return expense_currency_totals(queryset)

    @staticmethod
    def get_contract_expense_summary(contract: Contract) -> dict:
        expenses = ContractService.contract_expenses_queryset(contract)
        raw_totals = expenses.aggregate(
            total_usd=Sum("amount_usd"),
            total_afn=Sum("amount_afn"),
        )
        equivalent_totals = ContractService._expense_equivalent_totals(expenses)
        total_paid = contract.total_paid or ContractService.ZERO
        payment_usd = total_paid if contract.currency == "USD" else ContractService.ZERO
        payment_afn = total_paid if contract.currency == "AFN" else ContractService.ZERO
        expense_usd = raw_totals["total_usd"] or ContractService.ZERO
        expense_afn = raw_totals["total_afn"] or ContractService.ZERO
        cash_outflow_usd = payment_usd + expense_usd
        cash_outflow_afn = payment_afn + expense_afn

        return {
            "payments_made_usd": payment_usd,
            "payments_made_afn": payment_afn,
            "total_contract_expenses_usd": expense_usd,
            "total_contract_expenses_afn": expense_afn,
            "total_contract_expenses_usd_equivalent": equivalent_totals["usd_equivalent"],
            "total_contract_expenses_afn_equivalent": equivalent_totals["afn_equivalent"],
            "total_cash_outflow_usd": cash_outflow_usd,
            "total_cash_outflow_afn": cash_outflow_afn,
            "net_position_usd": -cash_outflow_usd,
            "net_position_afn": -cash_outflow_afn,
        }

    @staticmethod
    def _money(value):
        return value or ContractService.ZERO

    @staticmethod
    def _expense_timeline_item(expense):
        amount_usd = ContractService._money(expense.amount_usd)
        amount_afn = ContractService._money(expense.amount_afn)
        currency = "USD" if amount_usd > 0 else "AFN"
        amount = amount_usd if currency == "USD" else amount_afn

        return {
            "id": f"expense:{expense.id}",
            "source": "expense",
            "transaction_type": "expense",
            "direction": "out",
            "date": expense.expense_date,
            "title": "Expense",
            "description": expense.description,
            "reference": f"Expense #{expense.serial_number}",
            "amount": amount,
            "signed_amount": -amount,
            "amount_usd": amount_usd,
            "amount_afn": amount_afn,
            "usd_equivalent": expense.total_usd_equivalent,
            "afn_equivalent": expense.total_afn_equivalent,
            "currency": currency,
            "expense_id": expense.id,
            "payment_id": None,
            "status": expense.approval_status,
            "counterparty": expense.paid_to or expense.project_label,
        }

    @staticmethod
    def _payment_timeline_item(payment):
        amount = ContractService._money(payment.amount)
        currency = payment.contract.currency or "AFN"

        return {
            "id": f"payment:{payment.id}",
            "source": "contract_payment",
            "transaction_type": "payment",
            "direction": "out",
            "date": payment.payment_date,
            "title": payment.get_payment_type_display(),
            "description": payment.notes,
            "reference": payment.reference_number or f"Payment #{payment.id}",
            "amount": amount,
            "signed_amount": -amount,
            "amount_usd": amount if currency == "USD" else ContractService.ZERO,
            "amount_afn": amount if currency == "AFN" else ContractService.ZERO,
            "usd_equivalent": amount if currency == "USD" else ContractService.ZERO,
            "afn_equivalent": amount if currency == "AFN" else ContractService.ZERO,
            "currency": currency,
            "expense_id": None,
            "payment_id": payment.id,
            "status": "posted",
            "counterparty": payment.contract.subcontractor.name,
        }

    @staticmethod
    def get_financial_timeline(
        contract: Contract,
        *,
        transaction_type=None,
        search=None,
        date_from=None,
        date_to=None,
    ) -> dict:
        include_payments = transaction_type in (None, "", "all", "payment")
        include_expenses = transaction_type in (None, "", "all", "expense")
        search = (search or "").strip()
        rows = []

        if include_payments:
            payments = (
                ContractPayment.objects.filter(contract=contract)
                .select_related("contract", "contract__subcontractor")
                .only(
                    "id",
                    "contract",
                    "amount",
                    "payment_date",
                    "payment_type",
                    "reference_number",
                    "notes",
                    "created_at",
                    "contract__currency",
                    "contract__subcontractor__name",
                )
            )
            if date_from:
                payments = payments.filter(payment_date__gte=date_from)
            if date_to:
                payments = payments.filter(payment_date__lte=date_to)
            if search:
                payments = payments.filter(
                    Q(reference_number__icontains=search)
                    | Q(notes__icontains=search)
                    | Q(payment_type__icontains=search)
                )
            rows.extend(ContractService._payment_timeline_item(payment) for payment in payments)

        if include_expenses:
            expenses = ContractService.contract_expenses_queryset(contract)
            if date_from:
                expenses = expenses.filter(expense_date__gte=date_from)
            if date_to:
                expenses = expenses.filter(expense_date__lte=date_to)
            if search:
                expenses = expenses.filter(
                    Q(description__icontains=search)
                    | Q(remarks__icontains=search)
                    | Q(paid_to__icontains=search)
                    | Q(expense_type__icontains=search)
                    | Q(project__name__icontains=search)
                )
            rows.extend(ContractService._expense_timeline_item(expense) for expense in expenses)

        rows.sort(key=lambda item: (item["date"], item["transaction_type"], item["id"]))

        return {
            "summary": ContractService.get_financial_summary(contract),
            "results": rows,
        }

    # ── financial summary: subcontractor-level ──

    @staticmethod
    def get_subcontractor_financial_summary(subcontractor) -> dict:
        """
        Aggregate financial data across all contracts
        grouped by currency.
        """

        contracts = Contract.objects.filter(subcontractor=subcontractor)

        result = {}

        for contract in contracts:
            currency = contract.currency or "USD"

            if currency not in result:
                result[currency] = {
                    'total_contracts': 0,
                    'active_contracts': 0,
                    'total_contract_value': Decimal('0.00'),
                    'total_variation_amount': Decimal('0.00'),
                    'adjusted_contract_value': Decimal('0.00'),
                    'total_paid': Decimal('0.00'),
                    'remaining_amount': Decimal('0.00'),
                    'total_retention': Decimal('0.00'),
                    'retention_balance': Decimal('0.00'),
                }

            # contract-level values
            contract_value = contract.contract_value or Decimal('0.00')

            variation_total = ContractVariation.objects.filter(
                contract=contract,
                approved=True
            ).aggregate(total=Sum('amount_change'))['total'] or Decimal('0.00')

            adjusted_value = contract_value + variation_total

            paid = ContractPayment.objects.filter(
                contract=contract
            ).aggregate(total=Sum('amount'))['total'] or Decimal('0.00')

            retention = contract.retention_amount or Decimal('0.00')

            retention_released = ContractPayment.objects.filter(
                contract=contract,
                payment_type=PaymentTypeChoices.RETENTION_RELEASE
            ).aggregate(total=Sum('amount'))['total'] or Decimal('0.00')

            # remaining
            remaining = adjusted_value - paid
            retention_balance = retention - retention_released

            # accumulate per currency
            result[currency]['total_contracts'] += 1
            result[currency]['active_contracts'] += (
                1 if contract.status == ContractStatusChoices.ACTIVE else 0
            )

            result[currency]['total_contract_value'] += contract_value
            result[currency]['total_variation_amount'] += variation_total
            result[currency]['adjusted_contract_value'] += adjusted_value
            result[currency]['total_paid'] += paid
            result[currency]['remaining_amount'] += remaining
            result[currency]['total_retention'] += retention
            result[currency]['retention_balance'] += retention_balance

        return result

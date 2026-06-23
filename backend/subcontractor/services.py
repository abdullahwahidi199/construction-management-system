from decimal import Decimal
from datetime import timedelta

from django.db import transaction
from django.db.models import Sum

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

        return summary

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
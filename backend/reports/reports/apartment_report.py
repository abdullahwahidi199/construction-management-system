from decimal import Decimal

from django.db.models import DecimalField, Sum, Value
from django.db.models.functions import Coalesce

from accounts.services import has_permission
from project.models import ApartmentPayment, ApartmentSale

from .base import BaseReport


ZERO = Decimal("0.00")
CURRENCIES = ("AFN", "USD")


def currency_buckets(value_key):
    return {currency: {value_key: ZERO} for currency in CURRENCIES}


class ApartmentReportBase(BaseReport):
    def scope_to_projects(self, queryset, field):
        if self.user and not has_permission(self.user, "projects.view"):
            project_ids = self.user.project_assignments.values("project_id")
            return queryset.filter(**{f"{field}__in": project_ids})
        return queryset


class ApartmentSalesReport(ApartmentReportBase):
    report_name = "Apartment Sales Report"
    outstanding_only = False

    def _queryset(self):
        paid_field = DecimalField(max_digits=15, decimal_places=2)
        queryset = ApartmentSale.objects.select_related(
            "apartment__project",
            "apartment__building",
            "apartment__floor",
            "customer",
        ).annotate(
            _paid_total=Coalesce(
                Sum("payments__amount"),
                Value(ZERO),
                output_field=paid_field,
            )
        )
        queryset = self.scope_to_projects(queryset, "apartment__project_id")
        filters = self.filters
        mappings = {
            "project_id": "apartment__project_id",
            "building_id": "apartment__building_id",
            "customer_id": "customer_id",
            "currency": "currency",
        }
        for filter_name, lookup in mappings.items():
            if filters.get(filter_name) not in (None, ""):
                queryset = queryset.filter(**{lookup: filters[filter_name]})
        start, end = self.get_date_range()
        if start:
            queryset = queryset.filter(sale_date__gte=start)
        if end:
            queryset = queryset.filter(sale_date__lte=end)
        return queryset

    def generate(self):
        rows = []
        totals = {
            currency: {"sales": ZERO, "paid": ZERO, "outstanding": ZERO}
            for currency in CURRENCIES
        }
        status_counts = {
            ApartmentSale.PaymentStatus.UNPAID: 0,
            ApartmentSale.PaymentStatus.PARTIALLY_PAID: 0,
            ApartmentSale.PaymentStatus.PAID: 0,
        }
        cancelled_count = 0
        cancelled_totals = {currency: ZERO for currency in CURRENCIES}
        requested_status = self.filters.get("payment_status")

        for sale in self._queryset():
            if sale.status == ApartmentSale.Status.CANCELLED:
                if not self.outstanding_only:
                    cancelled_count += 1
                    cancelled_totals[sale.currency] += sale.sale_price
                continue
            paid = sale.total_paid
            remaining = sale.remaining_balance
            payment_status = sale.payment_status
            if self.outstanding_only and remaining <= ZERO:
                continue
            if requested_status and payment_status != requested_status:
                continue
            totals[sale.currency]["sales"] += sale.sale_price
            totals[sale.currency]["paid"] += paid
            totals[sale.currency]["outstanding"] += remaining
            status_counts[payment_status] += 1
            rows.append({
                "id": sale.id,
                "project": sale.apartment.project.name,
                "building": sale.apartment.building.name,
                "floor": sale.apartment.floor.name or sale.apartment.floor.floor_number,
                "apartment": sale.apartment.apartment_number,
                "customer": sale.customer.name,
                "sale_reference": sale.reference_number,
                "sale_date": sale.sale_date,
                "sale_price": sale.sale_price,
                "currency": sale.currency,
                "total_paid": paid,
                "remaining": remaining,
                "payment_status": payment_status,
            })

        return {
            **self.get_metadata(),
            "summary": {
                "total_sales": len(rows),
                "unpaid_sales": status_counts[ApartmentSale.PaymentStatus.UNPAID],
                "partially_paid_sales": status_counts[ApartmentSale.PaymentStatus.PARTIALLY_PAID],
                "paid_sales": status_counts[ApartmentSale.PaymentStatus.PAID],
                **({
                    "cancelled_sales": cancelled_count,
                    "cancelled_sales_worth_usd": cancelled_totals["USD"],
                    "cancelled_sales_worth_afn": cancelled_totals["AFN"],
                } if not self.outstanding_only else {}),
                "currencies": totals,
            },
            "rows": rows,
        }


class ApartmentOutstandingReport(ApartmentSalesReport):
    report_name = "Outstanding Apartment Payments Report"
    outstanding_only = True


class ApartmentPaymentsReport(ApartmentReportBase):
    report_name = "Apartment Payment Report"

    def _queryset(self):
        queryset = ApartmentPayment.objects.select_related(
            "sale__apartment__project",
            "sale__apartment__building",
            "sale__apartment__floor",
            "customer",
        ).filter(sale__status=ApartmentSale.Status.ACTIVE)
        queryset = self.scope_to_projects(queryset, "sale__apartment__project_id")
        mappings = {
            "project_id": "sale__apartment__project_id",
            "customer_id": "customer_id",
            "currency": "currency",
            "payment_method": "payment_method",
        }
        for filter_name, lookup in mappings.items():
            if self.filters.get(filter_name) not in (None, ""):
                queryset = queryset.filter(**{lookup: self.filters[filter_name]})
        start, end = self.get_date_range()
        if start:
            queryset = queryset.filter(payment_date__gte=start)
        if end:
            queryset = queryset.filter(payment_date__lte=end)
        return queryset

    def generate(self):
        rows = []
        totals = currency_buckets("received")
        for payment in self._queryset():
            totals[payment.currency]["received"] += payment.amount
            rows.append({
                "id": payment.id,
                "payment_date": payment.payment_date,
                "customer": payment.customer.name,
                "apartment": payment.sale.apartment.apartment_number,
                "building": payment.sale.apartment.building.name,
                "floor": payment.sale.apartment.floor.name or payment.sale.apartment.floor.floor_number,
                "project": payment.sale.apartment.project.name,
                "sale_reference": payment.sale.reference_number,
                "receipt_number": payment.receipt_number,
                "amount": payment.amount,
                "currency": payment.currency,
                "payment_method": payment.get_payment_method_display(),
                "reference": payment.reference,
            })
        return {
            **self.get_metadata(),
            "summary": {"total_payments": len(rows), "currencies": totals},
            "rows": rows,
        }

from decimal import Decimal

from django.db.models import Count, Prefetch

from expenses.models import Expense
from Employees.models import Payroll
from project.models import Project
from .base import BaseReport


ZERO = Decimal("0.00")
CURRENCIES = ("AFN", "USD")


def money(value):
    if value is None or value == "":
        return ZERO
    return Decimal(str(value))


def currency_totals():
    return {currency: ZERO for currency in CURRENCIES}


def add_currency_total(totals, currency, amount):
    currency = (currency or "AFN").upper()
    if currency not in totals:
        totals[currency] = ZERO
    totals[currency] += money(amount)


class ProjectSummaryReport(BaseReport):
    report_name = "Project Summary Report"

    def _base_queryset(self):
        qs = Project.objects.prefetch_related(
            Prefetch(
                "expenses",
                queryset=Expense.objects.approved().filter(
                    expense_scope=Expense.ExpenseScope.PROJECT,
                ),
                to_attr="approved_expenses",
            ),
            "subcontractor_contracts__payments",
            "subcontractor_contracts__variations",
            "worker_payrolls",
            "employee_payrolls",
        )

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

        return qs

    def _expense_totals(self, expenses):
        totals = {
            "raw_usd": ZERO,
            "raw_afn": ZERO,
            "equivalent_usd": ZERO,
            "equivalent_afn": ZERO,
            "count": 0,
        }

        for expense in expenses:
            totals["raw_usd"] += money(expense.amount_usd)
            totals["raw_afn"] += money(expense.amount_afn)
            totals["equivalent_usd"] += money(expense.total_usd)
            totals["equivalent_afn"] += money(expense.total_afn)
            totals["count"] += 1

        return totals

    def _contract_totals(self, contracts):
        totals = {
            "count": 0,
            "value": currency_totals(),
            "paid": currency_totals(),
            "remaining": currency_totals(),
        }

        for contract in contracts:
            currency = (contract.currency or "AFN").upper()
            totals["count"] += 1
            add_currency_total(totals["value"], currency, contract.adjusted_contract_value)
            add_currency_total(totals["paid"], currency, contract.total_paid)
            add_currency_total(totals["remaining"], currency, contract.remaining_amount)

        return totals

    def _worker_payroll_totals(self, payrolls):
        totals = {
            "count": 0,
            "gross": currency_totals(),
            "net": currency_totals(),
            "advances": currency_totals(),
            "deductions": currency_totals(),
        }

        for payroll in payrolls:
            currency = (payroll.currency or "AFN").upper()
            totals["count"] += 1
            add_currency_total(totals["gross"], currency, payroll.gross_amount)
            add_currency_total(totals["net"], currency, payroll.net_amount)
            add_currency_total(totals["advances"], currency, payroll.advances)
            add_currency_total(totals["deductions"], currency, payroll.deductions)

        return totals

    def _employee_payroll_totals(self, payrolls):
        totals = {
            "count": 0,
            "gross": currency_totals(),
            "net": currency_totals(),
            "paid": currency_totals(),
            "balance": currency_totals(),
        }

        for payroll in payrolls:
            if payroll.allocation_type != Payroll.AllocationType.PROJECT:
                continue
            currency = (payroll.currency or "AFN").upper()
            totals["count"] += 1
            add_currency_total(totals["gross"], currency, payroll.gross_pay)
            add_currency_total(totals["net"], currency, payroll.net_pay)
            add_currency_total(totals["paid"], currency, payroll.amount_paid)
            add_currency_total(totals["balance"], currency, payroll.balance_due)

        return totals

    def _budget_remaining(self, budget, budget_currency, total_spent_usd, total_spent_afn):
        budget_currency = (budget_currency or "AFN").upper()
        if budget_currency == "USD":
            return budget - total_spent_usd, None
        if budget_currency == "AFN":
            return None, budget - total_spent_afn
        return None, None

    def generate(self):
        qs = self._base_queryset()
        rows = []
        summary = {
            "total_projects": 0,
            "total_estimated_budget_usd": ZERO,
            "total_estimated_budget_afn": ZERO,
            "total_expenses_usd": ZERO,
            "total_expenses_afn": ZERO,
            "total_contract_payments_usd": ZERO,
            "total_contract_payments_afn": ZERO,
            "total_worker_payroll_usd": ZERO,
            "total_worker_payroll_afn": ZERO,
            "total_spent_usd": ZERO,
            "total_spent_afn": ZERO,
        }

        for project in qs:
            budget = money(project.estimated_budget)
            budget_currency = (project.budget_currency or "AFN").upper()
            expenses = self._expense_totals(getattr(project, "approved_expenses", []))
            contracts = self._contract_totals(project.subcontractor_contracts.all())
            worker_payroll = self._worker_payroll_totals(project.worker_payrolls.all())
            employee_payroll = self._employee_payroll_totals(project.employee_payrolls.all())

            total_spent_usd = (
                expenses["equivalent_usd"]
                + contracts["paid"]["USD"]
                + employee_payroll["paid"]["USD"]
                + worker_payroll["net"]["USD"]
            )
            total_spent_afn = (
                expenses["equivalent_afn"]
                + contracts["paid"]["AFN"]
                + employee_payroll["paid"]["AFN"]
                + worker_payroll["net"]["AFN"]
            )
            remaining_usd, remaining_afn = self._budget_remaining(
                budget,
                budget_currency,
                total_spent_usd,
                total_spent_afn,
            )

            if budget_currency == "USD":
                summary["total_estimated_budget_usd"] += budget
            elif budget_currency == "AFN":
                summary["total_estimated_budget_afn"] += budget

            summary["total_projects"] += 1
            summary["total_expenses_usd"] += expenses["equivalent_usd"]
            summary["total_expenses_afn"] += expenses["equivalent_afn"]
            summary["total_contract_payments_usd"] += contracts["paid"]["USD"]
            summary["total_contract_payments_afn"] += contracts["paid"]["AFN"]
            summary.setdefault("total_employee_payroll_usd", ZERO)
            summary.setdefault("total_employee_payroll_afn", ZERO)
            summary["total_employee_payroll_usd"] += employee_payroll["paid"]["USD"]
            summary["total_employee_payroll_afn"] += employee_payroll["paid"]["AFN"]
            summary["total_worker_payroll_usd"] += worker_payroll["net"]["USD"]
            summary["total_worker_payroll_afn"] += worker_payroll["net"]["AFN"]
            summary["total_spent_usd"] += total_spent_usd
            summary["total_spent_afn"] += total_spent_afn

            rows.append({
                "id": project.id,
                "name": project.name,
                "property_type": project.get_property_type_display(),
                "location": project.location,
                "status": project.get_status_display(),
                "total_floors": project.total_floors,
                "start_date": project.start_date,
                "expected_completion_date": project.expected_completion_date,
                "actual_completion_date": project.actual_completion_date,
                "estimated_budget": budget,
                "budget_currency": budget_currency,
                "budget_remaining_usd": remaining_usd,
                "budget_remaining_afn": remaining_afn,
                "budget_remaining": remaining_usd if budget_currency == "USD" else remaining_afn,
                "expense_count": expenses["count"],
                "raw_expenses_usd": expenses["raw_usd"],
                "raw_expenses_afn": expenses["raw_afn"],
                "expenses_usd": expenses["equivalent_usd"],
                "expenses_afn": expenses["equivalent_afn"],
                "contract_count": contracts["count"],
                "contracts_value_usd": contracts["value"]["USD"],
                "contracts_value_afn": contracts["value"]["AFN"],
                "contracts_usd": contracts["paid"]["USD"],
                "contracts_afn": contracts["paid"]["AFN"],
                "contracts_remaining_usd": contracts["remaining"]["USD"],
                "contracts_remaining_afn": contracts["remaining"]["AFN"],
                "employee_payroll_count": employee_payroll["count"],
                "employee_payroll_gross_usd": employee_payroll["gross"]["USD"],
                "employee_payroll_gross_afn": employee_payroll["gross"]["AFN"],
                "employee_payroll_net_usd": employee_payroll["net"]["USD"],
                "employee_payroll_net_afn": employee_payroll["net"]["AFN"],
                "employee_payroll_usd": employee_payroll["paid"]["USD"],
                "employee_payroll_afn": employee_payroll["paid"]["AFN"],
                "worker_payroll_count": worker_payroll["count"],
                "worker_payroll_gross_usd": worker_payroll["gross"]["USD"],
                "worker_payroll_gross_afn": worker_payroll["gross"]["AFN"],
                "worker_payroll_advances_usd": worker_payroll["advances"]["USD"],
                "worker_payroll_advances_afn": worker_payroll["advances"]["AFN"],
                "worker_payroll_deductions_usd": worker_payroll["deductions"]["USD"],
                "worker_payroll_deductions_afn": worker_payroll["deductions"]["AFN"],
                "worker_payroll_usd": worker_payroll["net"]["USD"],
                "worker_payroll_afn": worker_payroll["net"]["AFN"],
                "total_spent_usd": total_spent_usd,
                "total_spent_afn": total_spent_afn,
            })

        status_breakdown = list(
            qs.values("status")
            .annotate(count=Count("id"))
            .order_by("status")
        )

        return {
            **self.get_metadata(),
            "summary": summary,
            "status_breakdown": status_breakdown,
            "rows": rows,
        }

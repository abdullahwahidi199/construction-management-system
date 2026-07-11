from datetime import date, timedelta
from decimal import Decimal
from random import choice, randint, seed

from django.contrib.auth import get_user_model
from django.core.management.base import BaseCommand
from django.db import transaction

from Employees.models import Employee, Payroll
from expenses.models import Expense
from project.models import Project
from subcontractor.models import (
    Contract,
    ContractPayment,
    ContractVariation,
    PaymentTypeChoices,
    SpecializationChoices,
    Subcontractor,
)


class Command(BaseCommand):
    help = "Generate realistic QA and financial audit seed data."

    @transaction.atomic
    def handle(self, *args, **options):
        seed(20260711)
        user, _ = get_user_model().objects.get_or_create(
            username="qa_auditor",
            defaults={"email": "qa_auditor@example.com", "is_staff": True},
        )

        projects = []
        for index in range(20):
            currency = "USD" if index % 2 == 0 else "AFN"
            budget = Decimal(randint(80_000, 950_000)) if currency == "USD" else Decimal(randint(5_000_000, 80_000_000))
            projects.append(Project.objects.create(
                name=f"QA Project {index + 1:02d}",
                description="Generated construction project for audit testing.",
                property_type=choice(["residential", "commercial", "mixed"]),
                location=choice(["Kabul", "Herat", "Mazar", "Kandahar"]),
                total_floors=randint(1, 24),
                start_date=date(2025, 1, 1) + timedelta(days=index * 11),
                expected_completion_date=date(2026, 12, 31) + timedelta(days=index * 7),
                estimated_budget=budget,
                budget_currency=currency,
                status=choice(["planning", "ongoing", "completed", "on_hold"]),
            ))

        employees = []
        for index in range(100):
            employees.append(Employee.objects.create(
                first_name=f"Employee{index + 1}",
                last_name="QA",
                email=f"employee{index + 1}@qa.local",
                phone=f"07{index + 1:08d}",
                address="Generated address",
                department=choice(["engineering", "construction", "finance", "procurement", "administration"]),
                position=choice(["Engineer", "Foreman", "Accountant", "Officer"]),
                employment_type=choice(["full_time", "part_time", "contract"]),
                hire_date=date(2024, 1, 1) + timedelta(days=index),
                salary=Decimal(randint(300, 2500)),
            ))

        subcontractors = []
        for index in range(50):
            subcontractors.append(Subcontractor.objects.create(
                name=f"QA Subcontractor {index + 1:02d}",
                contact_person=f"Contact {index + 1}",
                phone=f"079{index + 1:07d}",
                specialization=choice([value for value, _ in SpecializationChoices.choices]),
            ))

        contracts = []
        for index in range(100):
            project = choice(projects)
            currency = "USD" if index % 2 == 0 else "AFN"
            value = Decimal(randint(10_000, 250_000)) if currency == "USD" else Decimal(randint(750_000, 20_000_000))
            contract = Contract.objects.create(
                project=project,
                subcontractor=choice(subcontractors),
                title=f"QA Contract {index + 1:03d}",
                scope_of_work="Generated scope for QA financial testing.",
                currency=currency,
                contract_value=value,
                retention_percentage=Decimal(choice(["0", "5", "10"])),
                start_date=date(2025, 1, 1) + timedelta(days=index),
                end_date=date(2026, 1, 1) + timedelta(days=index),
                status="active",
            )
            contracts.append(contract)

            for payment_index in range(randint(8, 15)):
                amount = (value / Decimal("30")) * Decimal(randint(1, 3))
                ContractPayment.objects.create(
                    contract=contract,
                    amount=amount.quantize(Decimal("0.01")),
                    payment_date=contract.start_date + timedelta(days=payment_index * 20),
                    payment_type=choice([value for value, _ in PaymentTypeChoices.choices]),
                )

            if index % 3 == 0:
                ContractVariation.objects.create(
                    contract=contract,
                    description="Generated approved variation",
                    amount_change=(value * Decimal("0.03")).quantize(Decimal("0.01")),
                    days_added=randint(1, 20),
                    date=contract.start_date + timedelta(days=30),
                    approved=True,
                )

        for index in range(500):
            currency = "USD" if index % 3 == 0 else "AFN"
            Expense.objects.create(
                project=choice(projects),
                expense_date=date(2025, 1, 1) + timedelta(days=randint(0, 650)),
                description=f"QA material transaction {index + 1}",
                paid_to=choice(["Supplier A", "Supplier B", "Cash Vendor"]),
                amount_usd=Decimal(randint(25, 5000)) if currency == "USD" else Decimal("0.00"),
                amount_afn=Decimal(randint(1000, 350000)) if currency == "AFN" else Decimal("0.00"),
                exchange_rate=Decimal("0.0000"),
                expense_type=choice(["material", "construction", "equipment", "utility", "other"]),
                created_by=user,
            )

        for index in range(200):
            employee = choice(employees)
            currency = "USD" if index % 4 == 0 else "AFN"
            base = Decimal(randint(300, 2500)) if currency == "USD" else Decimal(randint(20000, 180000))
            payroll = Payroll(
                employee=employee,
                payroll_period_start=date(2026, 1, 1) + timedelta(days=30 * (index % 12)),
                payroll_period_end=date(2026, 1, 28) + timedelta(days=30 * (index % 12)),
                basic_salary=base,
                overtime_hours=Decimal(randint(0, 20)),
                overtime_rate=Decimal(randint(5, 25)) if currency == "USD" else Decimal(randint(300, 1500)),
                bonus=Decimal(randint(0, 300)) if currency == "USD" else Decimal(randint(0, 20000)),
                allowances=Decimal(randint(0, 150)) if currency == "USD" else Decimal(randint(0, 10000)),
                deductions=Decimal(randint(0, 100)) if currency == "USD" else Decimal(randint(0, 8000)),
                tax_deducted=(base * Decimal("0.10")).quantize(Decimal("0.01")),
                currency=currency,
                payment_method=choice(["bank_transfer", "check", "cash"]),
                payment_date=date(2026, 2, 1) + timedelta(days=index % 28),
                created_by=user,
            )
            payroll.calculate_totals()
            payroll.save()

        self.stdout.write(self.style.SUCCESS(
            "Created 20 projects, 100 employees, 50 subcontractors, 500 material transactions, "
            "200 payroll records, 100 contracts, and 1000+ financial transactions."
        ))

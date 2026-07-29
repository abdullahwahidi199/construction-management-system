from contextlib import redirect_stdout
from datetime import date, time
from decimal import Decimal
from io import StringIO

from django.contrib.auth import get_user_model
from django.core.management import call_command
from django.core.files.uploadedfile import SimpleUploadedFile
from rest_framework.authtoken.models import Token

from accounts.constants import Role
from accounts.models import CustomRole, Permission, RolePermission
from Employees.models import Attendance, Employee, Payroll, PayrollPayment, SalaryAdvance
from expenses.models import Expense
from labour.models import DailyWorker, WorkerAdvance, WorkerAttendance, WorkerPayroll
from notifications.models import Notification
from project.models import Project
from subcontractor.models import (
    Contract,
    ContractPayment,
    ContractVariation,
    PaymentTypeChoices,
    SpecializationChoices,
    Subcontractor,
)


def seed_permissions():
    with redirect_stdout(StringIO()):
        call_command("seed_permissions", verbosity=0)


def create_user(username="tester", password="StrongPass123!", role=Role.MANAGER, permissions=None, **extra):
    seed_permissions()
    user = get_user_model().objects.create_user(
        username=username,
        password=password,
        email=extra.pop("email", f"{username}@example.com"),
        **extra,
    )
    user.profile.role = role
    user.profile.save(update_fields=["role", "updated_at"])
    if permissions is not None:
        CustomRole.objects.update_or_create(
            value=role,
            defaults={"label": role.replace("_", " ").title()},
        )
        RolePermission.objects.filter(role=role).delete()
        for code in permissions:
            permission, _ = Permission.objects.get_or_create(
                code=code,
                defaults={"name": code, "module": code.split(".")[0]},
            )
            RolePermission.objects.get_or_create(role=role, permission=permission)
    return user


def create_admin(username="admin", password="StrongPass123!"):
    seed_permissions()
    return get_user_model().objects.create_superuser(
        username=username,
        password=password,
        email=f"{username}@example.com",
    )


def auth_header(user):
    token, _ = Token.objects.get_or_create(user=user)
    return {"HTTP_AUTHORIZATION": f"Token {token.key}"}


def create_project(name="Kabul Tower", **overrides):
    data = {
        "name": name,
        "property_type": "commercial",
        "location": "Kabul",
        "total_floors": 8,
        "start_date": date(2026, 1, 1),
        "expected_completion_date": date(2026, 12, 31),
        "estimated_budget": Decimal("100000.00"),
        "budget_currency": "USD",
        "status": "ongoing",
    }
    data.update(overrides)
    return Project.objects.create(**data)


def employee_payload(**overrides):
    data = {
        "first_name": "Amina",
        "last_name": "Rahimi",
        "email": "amina.rahimi@example.com",
        "phone": "0700000000",
        "address": "Kabul",
        "department": "engineering",
        "position": "Site Engineer",
        "employment_type": "full_time",
        "hire_date": "2026-01-01",
        "salary": "1200.00",
        "hourly_rate": "10.00",
        "is_active": True,
    }
    data.update(overrides)
    return data


def create_employee(**overrides):
    data = employee_payload(**overrides)
    data["hire_date"] = date.fromisoformat(data["hire_date"]) if isinstance(data["hire_date"], str) else data["hire_date"]
    return Employee.objects.create(**data)


def create_payroll(employee=None, **overrides):
    employee = employee or create_employee()
    data = {
        "employee": employee,
        "payroll_period_start": date(2026, 2, 1),
        "payroll_period_end": date(2026, 2, 28),
        "basic_salary": Decimal("1200.00"),
        "overtime_hours": Decimal("4.00"),
        "overtime_rate": Decimal("15.00"),
        "bonus": Decimal("100.00"),
        "allowances": Decimal("50.00"),
        "deductions": Decimal("25.00"),
        "tax_deducted": Decimal("120.00"),
        "gross_pay": Decimal("0.00"),
        "net_pay": Decimal("0.00"),
        "currency": "USD",
        "payment_method": "cash",
        "payment_date": date(2026, 3, 1),
    }
    data.update(overrides)
    payroll = Payroll(**data)
    payroll.calculate_totals()
    payroll.save()
    payroll.refresh_payment_totals(save=True)
    return payroll


def create_salary_advance(employee=None, **overrides):
    employee = employee or create_employee()
    data = {
        "employee": employee,
        "amount": Decimal("100.00"),
        "remaining_balance": Decimal("100.00"),
        "date": date(2026, 1, 15),
        "reason": "Personal advance",
        "notes": "",
        "status": "active",
    }
    data.update(overrides)
    return SalaryAdvance.objects.create(**data)


def create_payroll_payment(payroll=None, **overrides):
    payroll = payroll or create_payroll()
    data = {
        "payroll": payroll,
        "amount": payroll.balance_due or payroll.net_pay,
        "payment_date": date(2026, 3, 5),
        "payment_method": "cash",
        "reference_number": "PAY-001",
    }
    data.update(overrides)
    payment = PayrollPayment.objects.create(**data)
    payroll.refresh_payment_totals(save=True)
    return payment


def create_attendance(employee=None, **overrides):
    employee = employee or create_employee()
    data = {
        "employee": employee,
        "date": date(2026, 2, 10),
        "status": "present",
        "check_in": time(8, 0),
        "check_out": time(17, 0),
        "overtime_hours": Decimal("1.50"),
    }
    data.update(overrides)
    return Attendance.objects.create(**data)


def expense_payload(project=None, **overrides):
    expense_scope = overrides.get("expense_scope", Expense.ExpenseScope.PROJECT)
    if project is None and expense_scope == Expense.ExpenseScope.PROJECT:
        project = create_project()
    data = {
        "expense_scope": expense_scope,
        "project": project.id if project else None,
        "expense_date": "2026-02-01",
        "description": "Concrete purchase",
        "remarks": "Batch A",
        "paid_to": "Supplier One",
        "amount_afn": "0.00",
        "amount_usd": "250.00",
        "exchange_rate": "70.0000",
        "expense_type": "material",
    }
    data.update(overrides)
    return data


def create_expense(project=None, **overrides):
    expense_scope = overrides.get("expense_scope", Expense.ExpenseScope.PROJECT)
    if project is None and expense_scope == Expense.ExpenseScope.PROJECT:
        project = create_project()
    data = {
        "expense_scope": expense_scope,
        "project": project,
        "expense_date": date(2026, 2, 1),
        "description": "Concrete purchase",
        "amount_afn": Decimal("0.00"),
        "amount_usd": Decimal("250.00"),
        "exchange_rate": Decimal("70.0000"),
        "expense_type": "material",
        "approval_status": Expense.ApprovalStatus.APPROVED,
    }
    data.update(overrides)
    return Expense.objects.create(**data)


def create_subcontractor(**overrides):
    data = {
        "name": "Prime Concrete",
        "contact_person": "Farid",
        "phone": "0799999999",
        "email": "prime@example.com",
        "specialization": SpecializationChoices.CONCRETE,
    }
    data.update(overrides)
    return Subcontractor.objects.create(**data)


def contract_payload(project=None, subcontractor=None, **overrides):
    project = project or create_project()
    subcontractor = subcontractor or create_subcontractor()
    data = {
        "project": project.id,
        "subcontractor": subcontractor.id,
        "title": "Foundation Works",
        "scope_of_work": "Excavation and concrete",
        "currency": "USD",
        "contract_value": "1000.00",
        "retention_percentage": "10.00",
        "start_date": "2026-01-01",
        "end_date": "2026-06-30",
        "completion_percentage": "25.00",
        "status": "active",
    }
    data.update(overrides)
    return data


def create_contract(project=None, subcontractor=None, **overrides):
    project = project or create_project()
    subcontractor = subcontractor or create_subcontractor()
    data = {
        "project": project,
        "subcontractor": subcontractor,
        "title": "Foundation Works",
        "scope_of_work": "Excavation and concrete",
        "currency": "USD",
        "contract_value": Decimal("1000.00"),
        "retention_percentage": Decimal("10.00"),
        "start_date": date(2026, 1, 1),
        "end_date": date(2026, 6, 30),
        "completion_percentage": Decimal("25.00"),
        "status": "active",
    }
    data.update(overrides)
    return Contract.objects.create(**data)


def create_contract_payment(contract=None, **overrides):
    contract = contract or create_contract()
    data = {
        "contract": contract,
        "amount": Decimal("250.00"),
        "payment_date": date(2026, 3, 1),
        "payment_type": PaymentTypeChoices.PROGRESS,
        "reference_number": "REF-001",
    }
    data.update(overrides)
    return ContractPayment.objects.create(**data)


def create_contract_variation(contract=None, **overrides):
    contract = contract or create_contract()
    data = {
        "contract": contract,
        "description": "Extra rebar",
        "amount_change": Decimal("100.00"),
        "days_added": 2,
        "date": date(2026, 3, 5),
        "approved": True,
    }
    data.update(overrides)
    return ContractVariation.objects.create(**data)


def create_worker(project=None, **overrides):
    project = project or create_project()
    data = {
        "full_name": "Rahim Labor",
        "father_name": "Karim",
        "phone": "0788888888",
        "daily_rate": Decimal("20.00"),
        "overtime_hourly_rate": Decimal("3.00"),
        "currency": "USD",
        "skill_type": "mason",
        "status": "active",
        "joining_date": date(2026, 1, 1),
        "assigned_project": project,
    }
    data.update(overrides)
    return DailyWorker.objects.create(**data)


def create_worker_attendance(worker=None, project=None, **overrides):
    worker = worker or create_worker(project=project)
    data = {
        "worker": worker,
        "project": project or worker.assigned_project,
        "date": date(2026, 2, 1),
        "status": "present",
        "overtime_hours": Decimal("2.00"),
    }
    data.update(overrides)
    return WorkerAttendance.objects.create(**data)


def create_worker_advance(worker=None, **overrides):
    worker = worker or create_worker()
    data = {
        "worker": worker,
        "amount": Decimal("15.00"),
        "currency": worker.currency,
        "date": date(2026, 1, 20),
        "description": "Transport advance",
        "remaining_balance": Decimal("15.00"),
    }
    data.update(overrides)
    return WorkerAdvance.objects.create(**data)


def create_worker_payroll(worker=None, project=None, **overrides):
    worker = worker or create_worker(project=project)
    project = project or worker.assigned_project
    create_worker_attendance(worker=worker, project=project)
    data = {
        "worker": worker,
        "project": project,
        "period_start": date(2026, 2, 1),
        "period_end": date(2026, 2, 28),
        "daily_rate_applied": worker.daily_rate,
        "overtime_rate_applied": worker.overtime_hourly_rate,
        "currency": worker.currency,
        "deductions": Decimal("0.00"),
        "payment_method": "cash",
    }
    data.update(overrides)
    payroll = WorkerPayroll(**data)
    payroll.calculate_from_attendance()
    payroll.save()
    return payroll


def create_notification(user, **overrides):
    data = {
        "recipient": user,
        "title": "Expense approved",
        "message": "Your expense was approved.",
        "notification_type": "expense_approval",
        "payload": {"expense_id": 1},
    }
    data.update(overrides)
    return Notification.objects.create(**data)


def uploaded_file(name="document.pdf", content=b"%PDF-1.4 test", content_type="application/pdf"):
    return SimpleUploadedFile(name, content, content_type=content_type)

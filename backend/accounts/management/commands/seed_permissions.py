from django.core.management.base import BaseCommand

from accounts.models import Permission

PERMISSIONS = [

    # Dashboard
    ("dashboard.view", "View Dashboard", "Dashboard"),

    # Reports
    ("reports.view", "View Reports", "Reports"),
    ("reports.export", "Export Reports", "Reports"),

    # Users
    ("users.view", "View Users", "Users"),
    ("users.create", "Create Users", "Users"),
    ("users.update", "Update Users", "Users"),
    ("users.delete", "Delete Users", "Users"),

    # Roles
    ("roles.view", "View Roles", "Roles"),
    ("roles.create", "Create Roles", "Roles"),
    ("roles.update", "Update Roles", "Roles"),
    ("roles.delete", "Delete Roles", "Roles"),

    # Permissions
    ("permissions.view", "View Permissions", "Permissions"),
    ("permissions.manage", "Manage Permissions", "Permissions"),

    # Projects
    ("projects.view", "View Projects", "Projects"),
    ("projects.create", "Create Projects", "Projects"),
    ("projects.update", "Update Projects", "Projects"),
    ("projects.delete", "Delete Projects", "Projects"),

    # Expenses
    ("expenses.view", "View Expenses", "Expenses"),
    ("expenses.create", "Create Expenses", "Expenses"),
    ("expenses.update", "Update Expenses", "Expenses"),
    ("expenses.update_own", "Update Own Expenses", "Expenses"),
    ("expenses.delete", "Delete Expenses", "Expenses"),
    ("expenses.approve", "Approve Expenses", "Expenses"),

    # Employees
    ("employees.view", "View Employees", "Employees"),
    ("employees.create", "Create Employees", "Employees"),
    ("employees.update", "Update Employees", "Employees"),
    ("employees.delete", "Delete Employees", "Employees"),

    # Payrolls
    ("payrolls.view", "View Payrolls", "Payrolls"),
    ("payrolls.create", "Create Payrolls", "Payrolls"),
    ("payrolls.update", "Update Payrolls", "Payrolls"),
    ("payrolls.delete", "Delete Payrolls", "Payrolls"),

    # Attendance
    ("attendance.view", "View Attendance", "Attendance"),
    ("attendance.create", "Create Attendance", "Attendance"),
    ("attendance.update", "Update Attendance", "Attendance"),
    ("attendance.delete", "Delete Attendance", "Attendance"),

    # Daily Workers
    ("daily_workers.view", "View Daily Workers", "Daily Workers"),
    ("daily_workers.create", "Create Daily Workers", "Daily Workers"),
    ("daily_workers.update", "Update Daily Workers", "Daily Workers"),
    ("daily_workers.delete", "Delete Daily Workers", "Daily Workers"),

    # Worker Attendance
    ("daily_worker_attendance.view", "View Worker Attendance", "Worker Attendance"),
    ("daily_worker_attendance.create", "Create Worker Attendance", "Worker Attendance"),
    ("daily_worker_attendance.update", "Update Worker Attendance", "Worker Attendance"),
    ("daily_worker_attendance.delete", "Delete Worker Attendance", "Worker Attendance"),

    # Worker Payroll
    ("daily_worker_payroll.view", "View Worker Payroll", "Worker Payroll"),
    ("daily_worker_payroll.create", "Create Worker Payroll", "Worker Payroll"),
    ("daily_worker_payroll.update", "Update Worker Payroll", "Worker Payroll"),
    ("daily_worker_payroll.delete", "Delete Worker Payroll", "Worker Payroll"),

    # Worker Advances
    ("worker_advances.view", "View Worker Advances", "Worker Advances"),
    ("worker_advances.create", "Create Worker Advances", "Worker Advances"),
    ("worker_advances.update", "Update Worker Advances", "Worker Advances"),
    ("worker_advances.delete", "Delete Worker Advances", "Worker Advances"),

    # Subcontractors
    ("subcontractors.view", "View Subcontractors", "Subcontractors"),
    ("subcontractors.create", "Create Subcontractors", "Subcontractors"),
    ("subcontractors.update", "Update Subcontractors", "Subcontractors"),
    ("subcontractors.delete", "Delete Subcontractors", "Subcontractors"),

    # Contracts
    ("contracts.view", "View Contracts", "Contracts"),
    ("contracts.create", "Create Contracts", "Contracts"),
    ("contracts.update", "Update Contracts", "Contracts"),
    ("contracts.delete", "Delete Contracts", "Contracts"),

    # Contract Documents
    ("contract_documents.view", "View Contract Documents", "Contract Documents"),
    ("contract_documents.create", "Create Contract Documents", "Contract Documents"),
    ("contract_documents.update", "Update Contract Documents", "Contract Documents"),
    ("contract_documents.delete", "Delete Contract Documents", "Contract Documents"),

    # Contract Payments
    ("contract_payments.view", "View Contract Payments", "Contract Payments"),
    ("contract_payments.create", "Create Contract Payments", "Contract Payments"),
    ("contract_payments.update", "Update Contract Payments", "Contract Payments"),
    ("contract_payments.delete", "Delete Contract Payments", "Contract Payments"),

    # Contract Variations
    ("contract_variations.view", "View Contract Variations", "Contract Variations"),
    ("contract_variations.create", "Create Contract Variations", "Contract Variations"),
    ("contract_variations.update", "Update Contract Variations", "Contract Variations"),
    ("contract_variations.delete", "Delete Contract Variations", "Contract Variations"),

    # Contract Invoices
    ("contract_invoices.view", "View Contract Invoices", "Contract Invoices"),
    ("contract_invoices.create", "Create Contract Invoices", "Contract Invoices"),
    ("contract_invoices.update", "Update Contract Invoices", "Contract Invoices"),
    ("contract_invoices.delete", "Delete Contract Invoices", "Contract Invoices"),

    # Invoice Documents
    ("invoice_documents.view", "View Invoice Documents", "Invoice Documents"),
    ("invoice_documents.create", "Create Invoice Documents", "Invoice Documents"),
    ("invoice_documents.update", "Update Invoice Documents", "Invoice Documents"),
    ("invoice_documents.delete", "Delete Invoice Documents", "Invoice Documents"),

    # Settings
    ("settings.view", "View Settings", "Settings"),
    ("settings.manage", "Manage Settings", "Settings"),

    # Audit Logs
    ("audit_logs.view", "View Audit Logs", "Audit Logs"),
    ("audit_logs.export", "Export Audit Logs", "Audit Logs"),
    ("audit_logs.delete", "Delete Audit Logs", "Audit Logs"),
    ("audit_logs.manage_retention", "Manage Audit Retention", "Audit Logs"),
]
from accounts.constants import Role

ROLE_PERMISSIONS = {
    Role.ADMIN: [code for code, _, _ in PERMISSIONS],
    Role.MANAGER: [
        "dashboard.view",

        "projects.view",
        "projects.create",

        "expenses.view",
        "expenses.create",
        "expenses.update",
        "expenses.approve",

        "employees.view",
        "employees.create",
        "employees.update",

        "daily_workers.view",
        "daily_workers.create",
        "daily_workers.update",
        "daily_worker_attendance.view",
        "daily_worker_attendance.create",
        "daily_worker_attendance.update",
        "daily_worker_payroll.view",
        "daily_worker_payroll.create",
        "daily_worker_payroll.update",
        "worker_advances.view",
        "worker_advances.create",
        "worker_advances.update",
    ],

    Role.DATA_ENTRY: [
        "projects.view",

        "expenses.view",
        "expenses.create",
        "expenses.update_own",

        "attendance.view",
        "attendance.create",

        "daily_workers.view",
        "daily_worker_attendance.view",
        "daily_worker_attendance.create",
        "worker_advances.view",
        "worker_advances.create",
    ]
}

from accounts.models import (
    CustomRole,
    Permission,
    RolePermission,
)

class Command(BaseCommand):

    def handle(self, *args, **kwargs):
        for value, label in Role.CHOICES:
            CustomRole.objects.update_or_create(
                value=value,
                defaults={"label": str(label), "is_system": True},
            )

        for code, name, module in PERMISSIONS:

            Permission.objects.update_or_create(
                code=code,
                defaults={"name": name, "module": module},
            )

        for role, permissions in ROLE_PERMISSIONS.items():

            for code in permissions:

                permission = Permission.objects.get(
                    code=code
                )

                RolePermission.objects.get_or_create(
                    role=role,
                    permission=permission,
                )

        self.stdout.write(
            self.style.SUCCESS(
                "Permissions seeded successfully"
            )
        )

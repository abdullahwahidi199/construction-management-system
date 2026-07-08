from django.utils.translation import gettext_lazy as _


class Role:
    ADMIN = "admin"
    MANAGER = "manager"
    DATA_ENTRY = "data_entry"

    CHOICES = (
        (ADMIN, _("Admin")),
        (MANAGER, _("Manager")),
        (DATA_ENTRY, _("Data Entry User")),
    )


class Effect:
    ALLOW = "allow"
    DENY = "deny"

    CHOICES = (
        (ALLOW, _("Allow")),
        (DENY, _("Deny")),
    )


# ADMIN_PERMISSIONS = {"*"}

# MANAGER_PERMISSIONS = {
#     "dashboard.view",
#     "reports.view",
#     "projects.view",
#     "projects.create",
#     # "projects.update",
#     "expenses.view",
#     "expenses.create",
#     "expenses.update",
#     "employees.view",
#     "employees.create",
#     "employees.update",
#     "payrolls.view",
#     "payrolls.create",
#     "payrolls.update",
#     # "attendance.view",
#     "attendance.create",
#     "attendance.update",
#     "subcontractors.view",
#     "subcontractors.create",
#     "subcontractors.update",
#     "contracts.view",
#     "contracts.create",
#     "contracts.update",
#     "contract_documents.view",
#     "contract_documents.create",
#     "contract_documents.update",
#     "contract_payments.view",
#     "contract_payments.create",
#     "contract_variations.view",
#     "contract_variations.create",
#     "contract_variations.update",
#     "contract_invoices.view",
#     "contract_invoices.create",
#     "contract_invoices.update",
#     "invoice_documents.view",
#     "invoice_documents.create",
# }

# DATA_ENTRY_PERMISSIONS = {
#     "projects.view",
#     "expenses.create",
#     "expenses.view",
#     "expenses.update_own",
#     "attendance.view",
#     "attendance.create",
#     "attendance.update_own",
# }

# DEFAULT_ROLE_PERMISSIONS = {
#     Role.ADMIN: ADMIN_PERMISSIONS,
#     Role.MANAGER: MANAGER_PERMISSIONS,
#     Role.DATA_ENTRY: DATA_ENTRY_PERMISSIONS,
# }


# AVAILABLE_PERMISSIONS = sorted(
#     {
#         permission
#         for permissions in DEFAULT_ROLE_PERMISSIONS.values()
#         for permission in permissions
#     }
#     | {
#         "users.view",
#         "users.create",
#         "users.update",
#         "users.delete",
#         "roles.manage",
#         "permissions.manage",
#         "system_settings.manage",
#         "projects.delete",
#         "expenses.delete",
#         "employees.delete",
#         "payrolls.delete",
#         "attendance.delete",
#         "subcontractors.delete",
#         "contracts.delete",
#         "contract_documents.delete",
#         "contract_payments.delete",
#         "contract_variations.delete",
#         "contract_invoices.delete",
#         "invoice_documents.delete",
#     }
# )

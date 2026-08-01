export const ROLES = {
  ADMIN: "admin",
  MANAGER: "manager",
  DATA_ENTRY: "data_entry",
};

export const roleHome = {
  [ROLES.ADMIN]: "/admin/dashboard",
  [ROLES.MANAGER]: "/manager/dashboard",
  [ROLES.DATA_ENTRY]: "/data-entry/dashboard",
};

export const ADMIN_PANEL_PERMISSIONS = [
  "users.view",
  "users.create",
  "users.update",
  "roles.view",
  "roles.create",
  "roles.update",
  "roles.delete",
  "permissions.view",
  "permissions.manage",
  "audit_logs.view",
  "settings.view",
  "settings.manage",
];

export const OPERATIONAL_PERMISSIONS = [
  "dashboard.view",
  "projects.view",
  "projects.create",
  "projects.update",
  "projects.delete",
  "expenses.view",
  "expenses.create",
  "expenses.update",
  "expenses.update_own",
  "expenses.delete",
  "expenses.approve",
  "employees.view",
  "employees.create",
  "employees.update",
  "employees.delete",
  "payrolls.view",
  "payrolls.create",
  "payrolls.update",
  "payrolls.delete",
  "attendance.view",
  "attendance.create",
  "attendance.update",
  "attendance.delete",
  "daily_workers.view",
  "daily_workers.create",
  "daily_workers.update",
  "daily_workers.delete",
  "daily_worker_attendance.view",
  "daily_worker_attendance.create",
  "daily_worker_attendance.update",
  "daily_worker_attendance.delete",
  "daily_worker_payroll.view",
  "daily_worker_payroll.create",
  "daily_worker_payroll.update",
  "daily_worker_payroll.delete",
  "worker_advances.view",
  "worker_advances.create",
  "worker_advances.update",
  "worker_advances.delete",
  "contracts.view",
  "contracts.create",
  "contracts.update",
  "contracts.delete",
  "contract_documents.view",
  "contract_documents.create",
  "contract_documents.update",
  "contract_documents.delete",
  "contract_payments.view",
  "contract_payments.create",
  "contract_payments.update",
  "contract_payments.delete",
  "contract_variations.view",
  "contract_variations.create",
  "contract_variations.update",
  "contract_variations.delete",
  "contract_invoices.view",
  "contract_invoices.create",
  "contract_invoices.update",
  "contract_invoices.delete",
  "invoice_documents.view",
  "invoice_documents.create",
  "invoice_documents.update",
  "invoice_documents.delete",
  "subcontractors.view",
  "subcontractors.create",
  "subcontractors.update",
  "subcontractors.delete",
  "reports.view",
  "reports.export",
  "settings.view",
  "settings.manage",
];

const ADMIN_ROUTE_RULES = [
  {
    path: "/admin/users",
    permissions: ["users.view", "users.create", "users.update", "users.delete"],
  },
  {
    path: "/admin/permissions",
    permissions: [
      "roles.view",
      "roles.create",
      "roles.update",
      "roles.delete",
      "permissions.view",
      "permissions.manage",
    ],
  },
  { path: "/admin/audit-logs", permissions: ["audit_logs.view"] },
  { path: "/admin/settings", permissions: ["settings.view", "settings.manage"] },
];

const OPERATIONAL_ROUTE_RULES = [
  { path: "/manager/dashboard", permissions: ["dashboard.view"] },
  {
    path: "/manager/projects",
    permissions: ["projects.view", "projects.create", "projects.update", "projects.delete"],
  },
  {
    path: "/manager/contracts",
    permissions: ["contracts.view", "contracts.create", "contracts.update", "contracts.delete"],
  },
  {
    path: "/manager/contract-payments",
    permissions: [
      "contract_payments.view",
      "contract_payments.create",
      "contract_payments.update",
      "contract_payments.delete",
    ],
  },
  {
    path: "/manager/contract-variations",
    permissions: [
      "contract_variations.view",
      "contract_variations.create",
      "contract_variations.update",
      "contract_variations.delete",
    ],
  },
  {
    path: "/manager/contract-documents",
    permissions: [
      "contract_documents.view",
      "contract_documents.create",
      "contract_documents.update",
      "contract_documents.delete",
      "invoice_documents.view",
      "invoice_documents.create",
      "invoice_documents.update",
      "invoice_documents.delete",
    ],
  },
  {
    path: "/manager/employees",
    permissions: ["employees.view", "employees.create", "employees.update", "employees.delete"],
  },
  {
    path: "/manager/daily-workers",
    permissions: [
      "daily_workers.view",
      "daily_workers.create",
      "daily_workers.update",
      "daily_workers.delete",
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
  },
  {
    path: "/manager/subcontractors",
    permissions: [
      "subcontractors.view",
      "subcontractors.create",
      "subcontractors.update",
      "subcontractors.delete",
    ],
  },
  {
    path: "/manager/expenses",
    permissions: ["expenses.view", "expenses.create", "expenses.update", "expenses.update_own", "expenses.delete"],
  },
  {
    path: "/manager/expense-approvals",
    permissions: ["expenses.approve"],
  },
  {
    path: "/manager/payrolls",
    permissions: ["payrolls.view", "payrolls.create", "payrolls.update", "payrolls.delete"],
  },
  {
    path: "/manager/attendance",
    permissions: ["attendance.view", "attendance.create", "attendance.update", "attendance.delete"],
  },
  { path: "/manager/reports", permissions: ["reports.view", "reports.export"] },
  { path: "/manager/settings", permissions: ["settings.view", "settings.manage"] },
];

export function hasAnyPermission(permissions = [], required = []) {
  if (permissions.includes("*")) return true;
  return required.some((permission) => permissions.includes(permission));
}

function firstAllowedPath(permissions, rules) {
  return rules.find((rule) => hasAnyPermission(permissions, rule.permissions))?.path;
}

export function homeForUser(role, permissions = []) {
  if (roleHome[role]) return roleHome[role];
  return (
    firstAllowedPath(permissions, ADMIN_ROUTE_RULES) ||
    firstAllowedPath(permissions, OPERATIONAL_ROUTE_RULES) ||
    "/login"
  );
}

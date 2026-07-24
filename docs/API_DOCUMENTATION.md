# API Documentation

Generated from Django REST Framework URL patterns, view classes, serializers, filters, and permission classes.

Base URL: `http://127.0.0.1:8000`

Authentication: most endpoints use `Authorization: Token <token>` unless marked public.

## Documentation Endpoints

- `GET /api/schema/` - built-in OpenAPI schema endpoint.
- `GET /api/docs/swagger/` - Swagger UI shell using `/api/schema/`.
- `GET /api/docs/redoc/` - ReDoc shell using `/api/schema/`.

## Endpoint Index By Module

### Attendance

| Method | URL | View/Action | Auth | Permissions | Roles |
|---|---|---|---|---|---|
| `GET` | `/api/attendance/` | `AttendanceViewSet.list` | Token/session authenticated RBAC | `attendance.view, attendance.view_assigned` | admin, data_entry |
| `POST` | `/api/attendance/` | `AttendanceViewSet.create` | Token/session authenticated RBAC | `attendance.create` | admin, data_entry |
| `DELETE` | `/api/attendance/{id}/` | `AttendanceViewSet.destroy` | Token/session authenticated RBAC | `attendance.delete` | admin |
| `GET` | `/api/attendance/{id}/` | `AttendanceViewSet.retrieve` | Token/session authenticated RBAC | `attendance.view, attendance.view_assigned` | admin, data_entry |
| `PATCH` | `/api/attendance/{id}/` | `AttendanceViewSet.partial_update` | Token/session authenticated RBAC | `attendance.update, attendance.update_own` | admin |
| `PUT` | `/api/attendance/{id}/` | `AttendanceViewSet.update` | Token/session authenticated RBAC | `attendance.update, attendance.update_own` | admin |
| `POST` | `/api/attendance/bulk_mark/` | `AttendanceViewSet.bulk_mark` | Token/session authenticated RBAC | `attendance.create` | admin, data_entry |
| `GET` | `/api/attendance/daily/` | `AttendanceViewSet.daily` | Token/session authenticated RBAC | `attendance.view, attendance.view_assigned` | admin, data_entry |
| `GET` | `/api/attendance/summary/` | `AttendanceViewSet.summary` | Token/session authenticated RBAC | `attendance.view, attendance.view_assigned` | admin, data_entry |
| `GET` | `/api/employees/attendance/export-pdf/` | `AttendancePDFExportView.get` | Authenticated | `-` | admin, manager, data_entry |
| `GET` | `/api/worker-attendance/` | `WorkerAttendanceViewSet.list` | Token/session authenticated RBAC | `daily_worker_attendance.view, daily_worker_attendance.view_assigned` | admin, data_entry, manager |
| `POST` | `/api/worker-attendance/` | `WorkerAttendanceViewSet.create` | Token/session authenticated RBAC | `daily_worker_attendance.create` | admin, data_entry, manager |
| `DELETE` | `/api/worker-attendance/{id}/` | `WorkerAttendanceViewSet.destroy` | Token/session authenticated RBAC | `daily_worker_attendance.delete` | admin |
| `GET` | `/api/worker-attendance/{id}/` | `WorkerAttendanceViewSet.retrieve` | Token/session authenticated RBAC | `daily_worker_attendance.view, daily_worker_attendance.view_assigned` | admin, data_entry, manager |
| `PATCH` | `/api/worker-attendance/{id}/` | `WorkerAttendanceViewSet.partial_update` | Token/session authenticated RBAC | `daily_worker_attendance.update, daily_worker_attendance.update_own` | admin, manager |
| `PUT` | `/api/worker-attendance/{id}/` | `WorkerAttendanceViewSet.update` | Token/session authenticated RBAC | `daily_worker_attendance.update, daily_worker_attendance.update_own` | admin, manager |
| `POST` | `/api/worker-attendance/bulk_mark/` | `WorkerAttendanceViewSet.bulk_mark` | Token/session authenticated RBAC | `daily_worker_attendance.create` | admin, data_entry, manager |
| `GET` | `/api/worker-attendance/daily_status/` | `WorkerAttendanceViewSet.daily_status` | Token/session authenticated RBAC | `daily_worker_attendance.view, daily_worker_attendance.view_assigned` | admin, data_entry, manager |
| `GET` | `/api/worker-attendance/summary/` | `WorkerAttendanceViewSet.summary` | Token/session authenticated RBAC | `daily_worker_attendance.view, daily_worker_attendance.view_assigned` | admin, data_entry, manager |

### Audit / Settings

| Method | URL | View/Action | Auth | Permissions | Roles |
|---|---|---|---|---|---|
| `GET` | `/api/audit/logs/` | `AuditLogViewSet.list` | Authenticated with audit permissions | `audit_logs.view` | admin |
| `DELETE` | `/api/audit/logs/{id}/` | `AuditLogViewSet.destroy` | Authenticated with audit permissions | `audit_logs.delete` | admin |
| `GET` | `/api/audit/logs/{id}/` | `AuditLogViewSet.retrieve` | Authenticated with audit permissions | `audit_logs.view` | admin |
| `GET` | `/api/audit/logs/export/csv/` | `AuditLogViewSet.export_csv` | Authenticated with audit permissions | `audit_logs.export` | admin |
| `GET` | `/api/audit/logs/export/excel/` | `AuditLogViewSet.export_excel` | Authenticated with audit permissions | `audit_logs.export` | admin |
| `GET` | `/api/audit/logs/options/` | `AuditLogViewSet.options` | Authenticated with audit permissions | `audit_logs.view` | admin |
| `GET` | `/api/audit/logs/retention/` | `AuditLogViewSet.retention` | Authenticated with audit permissions | `audit_logs.manage_retention` | admin |
| `PUT` | `/api/audit/logs/retention/` | `AuditLogViewSet.retention` | Authenticated with audit permissions | `audit_logs.manage_retention` | admin |
| `GET` | `/api/audit/logs/summary/` | `AuditLogViewSet.summary` | Authenticated with audit permissions | `audit_logs.view` | admin |

### Authentication

| Method | URL | View/Action | Auth | Permissions | Roles |
|---|---|---|---|---|---|
| `POST` | `/api/auth/login/` | `LoginView.post` | Public | `-` | All |
| `POST` | `/api/auth/logout/` | `LogoutView.post` | Authenticated | `-` | admin, manager, data_entry |
| `GET` | `/api/auth/me/` | `MeView.get` | Authenticated | `-` | admin, manager, data_entry |
| `GET` | `/api/auth/meta/` | `roles_and_permissions.get` | Authenticated | `-` | admin, manager, data_entry |

### Contractors

| Method | URL | View/Action | Auth | Permissions | Roles |
|---|---|---|---|---|---|
| `GET` | `/api/subcontractors/` | `SubcontractorViewSet.list` | Token/session authenticated RBAC | `subcontractors.view, subcontractors.view_assigned` | admin |
| `POST` | `/api/subcontractors/` | `SubcontractorViewSet.create` | Token/session authenticated RBAC | `subcontractors.create` | admin |
| `DELETE` | `/api/subcontractors/{id}/` | `SubcontractorViewSet.destroy` | Token/session authenticated RBAC | `subcontractors.delete` | admin |
| `GET` | `/api/subcontractors/{id}/` | `SubcontractorViewSet.retrieve` | Token/session authenticated RBAC | `subcontractors.view, subcontractors.view_assigned` | admin |
| `PATCH` | `/api/subcontractors/{id}/` | `SubcontractorViewSet.partial_update` | Token/session authenticated RBAC | `subcontractors.update, subcontractors.update_own` | admin |
| `PUT` | `/api/subcontractors/{id}/` | `SubcontractorViewSet.update` | Token/session authenticated RBAC | `subcontractors.update, subcontractors.update_own` | admin |
| `GET` | `/api/subcontractors/{id}/contracts/` | `SubcontractorViewSet.contracts` | Token/session authenticated RBAC | `subcontractors.view, subcontractors.view_assigned` | admin |
| `GET` | `/api/subcontractors/{id}/financial_summary/` | `SubcontractorViewSet.financial_summary` | Token/session authenticated RBAC | `subcontractors.view, subcontractors.view_assigned` | admin |

### Contracts

| Method | URL | View/Action | Auth | Permissions | Roles |
|---|---|---|---|---|---|
| `GET` | `/api/contract-documents/` | `ContractDocumentViewSet.list` | Token/session authenticated RBAC | `contract_documents.view, contract_documents.view_assigned` | admin |
| `POST` | `/api/contract-documents/` | `ContractDocumentViewSet.create` | Token/session authenticated RBAC | `contract_documents.create` | admin |
| `DELETE` | `/api/contract-documents/{id}/` | `ContractDocumentViewSet.destroy` | Token/session authenticated RBAC | `contract_documents.delete` | admin |
| `GET` | `/api/contract-documents/{id}/` | `ContractDocumentViewSet.retrieve` | Token/session authenticated RBAC | `contract_documents.view, contract_documents.view_assigned` | admin |
| `PATCH` | `/api/contract-documents/{id}/` | `ContractDocumentViewSet.partial_update` | Token/session authenticated RBAC | `contract_documents.update, contract_documents.update_own` | admin |
| `PUT` | `/api/contract-documents/{id}/` | `ContractDocumentViewSet.update` | Token/session authenticated RBAC | `contract_documents.update, contract_documents.update_own` | admin |
| `GET` | `/api/contract-payments/` | `ContractPaymentViewSet.list` | Token/session authenticated RBAC | `contract_payments.view, contract_payments.view_assigned` | admin |
| `POST` | `/api/contract-payments/` | `ContractPaymentViewSet.create` | Token/session authenticated RBAC | `contract_payments.create` | admin |
| `DELETE` | `/api/contract-payments/{id}/` | `ContractPaymentViewSet.destroy` | Token/session authenticated RBAC | `contract_payments.delete` | admin |
| `GET` | `/api/contract-payments/{id}/` | `ContractPaymentViewSet.retrieve` | Token/session authenticated RBAC | `contract_payments.view, contract_payments.view_assigned` | admin |
| `PATCH` | `/api/contract-payments/{id}/` | `ContractPaymentViewSet.partial_update` | Token/session authenticated RBAC | `contract_payments.update, contract_payments.update_own` | admin |
| `PUT` | `/api/contract-payments/{id}/` | `ContractPaymentViewSet.update` | Token/session authenticated RBAC | `contract_payments.update, contract_payments.update_own` | admin |
| `GET` | `/api/contract-variations/` | `ContractVariationViewSet.list` | Token/session authenticated RBAC | `contract_variations.view, contract_variations.view_assigned` | admin |
| `POST` | `/api/contract-variations/` | `ContractVariationViewSet.create` | Token/session authenticated RBAC | `contract_variations.create` | admin |
| `DELETE` | `/api/contract-variations/{id}/` | `ContractVariationViewSet.destroy` | Token/session authenticated RBAC | `contract_variations.delete` | admin |
| `GET` | `/api/contract-variations/{id}/` | `ContractVariationViewSet.retrieve` | Token/session authenticated RBAC | `contract_variations.view, contract_variations.view_assigned` | admin |
| `PATCH` | `/api/contract-variations/{id}/` | `ContractVariationViewSet.partial_update` | Token/session authenticated RBAC | `contract_variations.update, contract_variations.update_own` | admin |
| `PUT` | `/api/contract-variations/{id}/` | `ContractVariationViewSet.update` | Token/session authenticated RBAC | `contract_variations.update, contract_variations.update_own` | admin |
| `POST` | `/api/contract-variations/{id}/approve/` | `ContractVariationViewSet.approve` | Token/session authenticated RBAC | `contract_variations.create` | admin |
| `GET` | `/api/contracts/` | `ContractViewSet.list` | Token/session authenticated RBAC | `contracts.view, contracts.view_assigned` | admin |
| `POST` | `/api/contracts/` | `ContractViewSet.create` | Token/session authenticated RBAC | `contracts.create` | admin |
| `DELETE` | `/api/contracts/{id}/` | `ContractViewSet.destroy` | Token/session authenticated RBAC | `contracts.delete` | admin |
| `GET` | `/api/contracts/{id}/` | `ContractViewSet.retrieve` | Token/session authenticated RBAC | `contracts.view, contracts.view_assigned` | admin |
| `PATCH` | `/api/contracts/{id}/` | `ContractViewSet.partial_update` | Token/session authenticated RBAC | `contracts.update, contracts.update_own` | admin |
| `PUT` | `/api/contracts/{id}/` | `ContractViewSet.update` | Token/session authenticated RBAC | `contracts.update, contracts.update_own` | admin |
| `GET` | `/api/contracts/{id}/documents/` | `ContractViewSet.documents` | Token/session authenticated RBAC | `contracts.view, contracts.view_assigned` | admin |
| `POST` | `/api/contracts/{id}/documents/` | `ContractViewSet.documents` | Token/session authenticated RBAC | `contracts.create` | admin |
| `GET` | `/api/contracts/{id}/financial_summary/` | `ContractViewSet.financial_summary` | Token/session authenticated RBAC | `contracts.view, contracts.view_assigned` | admin |
| `GET` | `/api/contracts/{id}/payments/` | `ContractViewSet.payments` | Token/session authenticated RBAC | `contracts.view, contracts.view_assigned` | admin |
| `POST` | `/api/contracts/{id}/payments/` | `ContractViewSet.payments` | Token/session authenticated RBAC | `contracts.create` | admin |
| `GET` | `/api/contracts/{id}/variations/` | `ContractViewSet.variations` | Token/session authenticated RBAC | `contracts.view, contracts.view_assigned` | admin |
| `POST` | `/api/contracts/{id}/variations/` | `ContractViewSet.variations` | Token/session authenticated RBAC | `contracts.create` | admin |
| `GET` | `/api/contracts/export-pdf/` | `ContractPDFExportView.get` | Authenticated | `-` | admin, manager, data_entry |
| `GET` | `/api/contracts/{id}/export-pdf/` | `ContractDetailPDFView.get` | Authenticated | `-` | admin, manager, data_entry |
| `GET` | `/api/invoice-documents/` | `ContractInvoiceDocumentViewSet.list` | Token/session authenticated RBAC | `invoice_documents.view, invoice_documents.view_assigned` | admin |
| `POST` | `/api/invoice-documents/` | `ContractInvoiceDocumentViewSet.create` | Token/session authenticated RBAC | `invoice_documents.create` | admin |
| `DELETE` | `/api/invoice-documents/{id}/` | `ContractInvoiceDocumentViewSet.destroy` | Token/session authenticated RBAC | `invoice_documents.delete` | admin |
| `GET` | `/api/invoice-documents/{id}/` | `ContractInvoiceDocumentViewSet.retrieve` | Token/session authenticated RBAC | `invoice_documents.view, invoice_documents.view_assigned` | admin |
| `PATCH` | `/api/invoice-documents/{id}/` | `ContractInvoiceDocumentViewSet.partial_update` | Token/session authenticated RBAC | `invoice_documents.update, invoice_documents.update_own` | admin |
| `PUT` | `/api/invoice-documents/{id}/` | `ContractInvoiceDocumentViewSet.update` | Token/session authenticated RBAC | `invoice_documents.update, invoice_documents.update_own` | admin |
| `GET` | `/api/invoices/` | `ContractInvoiceViewSet.list` | Token/session authenticated RBAC | `contract_invoices.view, contract_invoices.view_assigned` | admin |
| `POST` | `/api/invoices/` | `ContractInvoiceViewSet.create` | Token/session authenticated RBAC | `contract_invoices.create` | admin |
| `DELETE` | `/api/invoices/{id}/` | `ContractInvoiceViewSet.destroy` | Token/session authenticated RBAC | `contract_invoices.delete` | admin |
| `GET` | `/api/invoices/{id}/` | `ContractInvoiceViewSet.retrieve` | Token/session authenticated RBAC | `contract_invoices.view, contract_invoices.view_assigned` | admin |
| `PATCH` | `/api/invoices/{id}/` | `ContractInvoiceViewSet.partial_update` | Token/session authenticated RBAC | `contract_invoices.update, contract_invoices.update_own` | admin |
| `PUT` | `/api/invoices/{id}/` | `ContractInvoiceViewSet.update` | Token/session authenticated RBAC | `contract_invoices.update, contract_invoices.update_own` | admin |

### Dashboard

| Method | URL | View/Action | Auth | Permissions | Roles |
|---|---|---|---|---|---|
| `GET` | `/api/dashboard/` | `FullDashboardView.get` | Token/session authenticated RBAC | `dashboard.view, dashboard.view_assigned` | admin, manager |
| `GET` | `/api/dashboard/activity/` | `RecentActivityView.get` | Token/session authenticated RBAC | `dashboard.view, dashboard.view_assigned` | admin, manager |
| `GET` | `/api/dashboard/alerts/` | `AlertsView.get` | Token/session authenticated RBAC | `dashboard.view, dashboard.view_assigned` | admin, manager |
| `GET` | `/api/dashboard/attendance/` | `AttendanceSummaryView.get` | Token/session authenticated RBAC | `dashboard.view, dashboard.view_assigned` | admin, manager |
| `GET` | `/api/dashboard/budget-comparison/` | `BudgetComparisonView.get` | Token/session authenticated RBAC | `dashboard.view, dashboard.view_assigned` | admin, manager |
| `GET` | `/api/dashboard/contracts/` | `ContractSummaryView.get` | Token/session authenticated RBAC | `dashboard.view, dashboard.view_assigned` | admin, manager |
| `GET` | `/api/dashboard/expenses/` | `ExpenseSummaryView.get` | Token/session authenticated RBAC | `dashboard.view, dashboard.view_assigned` | admin, manager |
| `GET` | `/api/dashboard/expenses/this-month/` | `ExpenseThisMonthView.get` | Token/session authenticated RBAC | `dashboard.view, dashboard.view_assigned` | admin, manager |
| `GET` | `/api/dashboard/financial/` | `FinancialOverviewView.get` | Token/session authenticated RBAC | `dashboard.view, dashboard.view_assigned` | admin, manager |
| `GET` | `/api/dashboard/payroll/` | `PayrollSummaryView.get` | Token/session authenticated RBAC | `dashboard.view, dashboard.view_assigned` | admin, manager |
| `GET` | `/api/dashboard/projects/` | `ProjectOverviewView.get` | Token/session authenticated RBAC | `dashboard.view, dashboard.view_assigned` | admin, manager |
| `GET` | `/api/dashboard/subcontractors/` | `SubcontractorSummaryView.get` | Token/session authenticated RBAC | `dashboard.view, dashboard.view_assigned` | admin, manager |
| `GET` | `/api/dashboard/workforce/` | `WorkforceSummaryView.get` | Token/session authenticated RBAC | `dashboard.view, dashboard.view_assigned` | admin, manager |

### Employees

| Method | URL | View/Action | Auth | Permissions | Roles |
|---|---|---|---|---|---|
| `GET` | `/api/employees/` | `EmployeeViewSet.list` | Token/session authenticated RBAC | `employees.view, employees.view_assigned` | admin, manager |
| `POST` | `/api/employees/` | `EmployeeViewSet.create` | Token/session authenticated RBAC | `employees.create` | admin, manager |
| `DELETE` | `/api/employees/{id}/` | `EmployeeViewSet.destroy` | Token/session authenticated RBAC | `employees.delete` | admin |
| `GET` | `/api/employees/{id}/` | `EmployeeViewSet.retrieve` | Token/session authenticated RBAC | `employees.view, employees.view_assigned` | admin, manager |
| `PATCH` | `/api/employees/{id}/` | `EmployeeViewSet.partial_update` | Token/session authenticated RBAC | `employees.update, employees.update_own` | admin, manager |
| `PUT` | `/api/employees/{id}/` | `EmployeeViewSet.update` | Token/session authenticated RBAC | `employees.update, employees.update_own` | admin, manager |
| `GET` | `/api/employees/{id}/payroll_history/` | `EmployeeViewSet.payroll_history` | Token/session authenticated RBAC | `employees.view, employees.view_assigned` | admin, manager |
| `GET` | `/api/employees/{id}/payroll_summary/` | `EmployeeViewSet.payroll_summary` | Token/session authenticated RBAC | `employees.view, employees.view_assigned` | admin, manager |
| `GET` | `/api/employees/by_department/` | `EmployeeViewSet.by_department` | Token/session authenticated RBAC | `employees.view, employees.view_assigned` | admin, manager |

### Expenses

| Method | URL | View/Action | Auth | Permissions | Roles |
|---|---|---|---|---|---|
| `GET` | `/api/expenses/` | `ExpenseViewSet.list` | Token/session authenticated RBAC | `expenses.view, expenses.view_assigned` | admin, data_entry, manager |
| `POST` | `/api/expenses/` | `ExpenseViewSet.create` | Token/session authenticated RBAC | `expenses.create` | admin, data_entry, manager |
| `DELETE` | `/api/expenses/{id}/` | `ExpenseViewSet.destroy` | Token/session authenticated RBAC | `expenses.delete` | admin |
| `GET` | `/api/expenses/{id}/` | `ExpenseViewSet.retrieve` | Token/session authenticated RBAC | `expenses.view, expenses.view_assigned` | admin, data_entry, manager |
| `PATCH` | `/api/expenses/{id}/` | `ExpenseViewSet.partial_update` | Token/session authenticated RBAC | `expenses.update, expenses.update_own` | admin, manager |
| `PUT` | `/api/expenses/{id}/` | `ExpenseViewSet.update` | Token/session authenticated RBAC | `expenses.update, expenses.update_own` | admin, manager |
| `GET` | `/api/expenses/export-pdf/` | `ExpensePDFExportView.get` | Authenticated | `-` | admin, manager, data_entry |

### Inventory / Labour

| Method | URL | View/Action | Auth | Permissions | Roles |
|---|---|---|---|---|---|
| `GET` | `/api/daily-workers/` | `DailyWorkerViewSet.list` | Token/session authenticated RBAC | `daily_workers.view, daily_workers.view_assigned` | admin, data_entry, manager |
| `POST` | `/api/daily-workers/` | `DailyWorkerViewSet.create` | Token/session authenticated RBAC | `daily_workers.create` | admin, manager |
| `DELETE` | `/api/daily-workers/{id}/` | `DailyWorkerViewSet.destroy` | Token/session authenticated RBAC | `daily_workers.delete` | admin |
| `GET` | `/api/daily-workers/{id}/` | `DailyWorkerViewSet.retrieve` | Token/session authenticated RBAC | `daily_workers.view, daily_workers.view_assigned` | admin, data_entry, manager |
| `PATCH` | `/api/daily-workers/{id}/` | `DailyWorkerViewSet.partial_update` | Token/session authenticated RBAC | `daily_workers.update, daily_workers.update_own` | admin, manager |
| `PUT` | `/api/daily-workers/{id}/` | `DailyWorkerViewSet.update` | Token/session authenticated RBAC | `daily_workers.update, daily_workers.update_own` | admin, manager |
| `GET` | `/api/daily-workers/{id}/detail_summary/` | `DailyWorkerViewSet.detail_summary` | Token/session authenticated RBAC | `daily_workers.view, daily_workers.view_assigned` | admin, data_entry, manager |

### Payroll

| Method | URL | View/Action | Auth | Permissions | Roles |
|---|---|---|---|---|---|
| `GET` | `/api/employees/payrolls/export-pdf/` | `PayrollPDFExportView.get` | Token/session authenticated RBAC | `payrolls.view, payrolls.view_assigned` | admin |
| `GET` | `/api/payrolls/` | `PayrollViewSet.list` | Token/session authenticated RBAC | `payrolls.view, payrolls.view_assigned` | admin |
| `POST` | `/api/payrolls/` | `PayrollViewSet.create` | Token/session authenticated RBAC | `payrolls.create` | admin |
| `DELETE` | `/api/payrolls/{id}/` | `PayrollViewSet.destroy` | Token/session authenticated RBAC | `payrolls.delete` | admin |
| `GET` | `/api/payrolls/{id}/` | `PayrollViewSet.retrieve` | Token/session authenticated RBAC | `payrolls.view, payrolls.view_assigned` | admin |
| `PATCH` | `/api/payrolls/{id}/` | `PayrollViewSet.partial_update` | Token/session authenticated RBAC | `payrolls.update, payrolls.update_own` | admin |
| `PUT` | `/api/payrolls/{id}/` | `PayrollViewSet.update` | Token/session authenticated RBAC | `payrolls.update, payrolls.update_own` | admin |
| `PATCH` | `/api/payrolls/{id}/update_payment_status/` | `PayrollViewSet.update_payment_status` | Token/session authenticated RBAC | `payrolls.update, payrolls.update_own` | admin |
| `POST` | `/api/payrolls/bulk_create_payroll/` | `PayrollViewSet.bulk_create_payroll` | Token/session authenticated RBAC | `payrolls.create` | admin |
| `GET` | `/api/payrolls/monthly_report/` | `PayrollViewSet.monthly_report` | Token/session authenticated RBAC | `payrolls.view, payrolls.view_assigned` | admin |
| `GET` | `/api/payrolls/summary/` | `PayrollViewSet.summary` | Token/session authenticated RBAC | `payrolls.view, payrolls.view_assigned` | admin |
| `GET` | `/api/worker-advances/` | `WorkerAdvanceViewSet.list` | Token/session authenticated RBAC | `worker_advances.view, worker_advances.view_assigned` | admin, data_entry, manager |
| `POST` | `/api/worker-advances/` | `WorkerAdvanceViewSet.create` | Token/session authenticated RBAC | `worker_advances.create` | admin, data_entry, manager |
| `DELETE` | `/api/worker-advances/{id}/` | `WorkerAdvanceViewSet.destroy` | Token/session authenticated RBAC | `worker_advances.delete` | admin |
| `GET` | `/api/worker-advances/{id}/` | `WorkerAdvanceViewSet.retrieve` | Token/session authenticated RBAC | `worker_advances.view, worker_advances.view_assigned` | admin, data_entry, manager |
| `PATCH` | `/api/worker-advances/{id}/` | `WorkerAdvanceViewSet.partial_update` | Token/session authenticated RBAC | `worker_advances.update, worker_advances.update_own` | admin, manager |
| `PUT` | `/api/worker-advances/{id}/` | `WorkerAdvanceViewSet.update` | Token/session authenticated RBAC | `worker_advances.update, worker_advances.update_own` | admin, manager |
| `GET` | `/api/worker-payroll/` | `WorkerPayrollViewSet.list` | Token/session authenticated RBAC | `daily_worker_payroll.view, daily_worker_payroll.view_assigned` | admin, manager |
| `POST` | `/api/worker-payroll/` | `WorkerPayrollViewSet.create` | Token/session authenticated RBAC | `daily_worker_payroll.create` | admin, manager |
| `DELETE` | `/api/worker-payroll/{id}/` | `WorkerPayrollViewSet.destroy` | Token/session authenticated RBAC | `daily_worker_payroll.delete` | admin |
| `GET` | `/api/worker-payroll/{id}/` | `WorkerPayrollViewSet.retrieve` | Token/session authenticated RBAC | `daily_worker_payroll.view, daily_worker_payroll.view_assigned` | admin, manager |
| `PATCH` | `/api/worker-payroll/{id}/` | `WorkerPayrollViewSet.partial_update` | Token/session authenticated RBAC | `daily_worker_payroll.update, daily_worker_payroll.update_own` | admin, manager |
| `PUT` | `/api/worker-payroll/{id}/` | `WorkerPayrollViewSet.update` | Token/session authenticated RBAC | `daily_worker_payroll.update, daily_worker_payroll.update_own` | admin, manager |
| `PATCH` | `/api/worker-payroll/{id}/approve/` | `WorkerPayrollViewSet.approve` | Token/session authenticated RBAC | `daily_worker_payroll.update, daily_worker_payroll.update_own` | admin, manager |
| `PATCH` | `/api/worker-payroll/{id}/mark_paid/` | `WorkerPayrollViewSet.mark_paid` | Token/session authenticated RBAC | `daily_worker_payroll.update, daily_worker_payroll.update_own` | admin, manager |
| `POST` | `/api/worker-payroll/generate/` | `WorkerPayrollViewSet.generate` | Token/session authenticated RBAC | `daily_worker_payroll.create` | admin, manager |
| `GET` | `/api/worker-payroll/reports/` | `WorkerPayrollViewSet.reports` | Token/session authenticated RBAC | `daily_worker_payroll.view, daily_worker_payroll.view_assigned` | admin, manager |
| `GET` | `/api/worker-payroll/summary/` | `WorkerPayrollViewSet.summary` | Token/session authenticated RBAC | `daily_worker_payroll.view, daily_worker_payroll.view_assigned` | admin, manager |

### Projects

| Method | URL | View/Action | Auth | Permissions | Roles |
|---|---|---|---|---|---|
| `GET` | `/api/projects/` | `project_list_create.get` | Authenticated | `-` | admin, manager, data_entry |
| `POST` | `/api/projects/` | `project_list_create.post` | Authenticated | `-` | admin, manager, data_entry |
| `DELETE` | `/api/projects/{id}/` | `ProjectDetailView.delete` | Token/session authenticated RBAC | `projects.delete` | admin |
| `GET` | `/api/projects/{id}/` | `ProjectDetailView.get` | Token/session authenticated RBAC | `projects.view, projects.view_assigned` | admin, data_entry, manager |
| `PATCH` | `/api/projects/{id}/` | `ProjectDetailView.patch` | Token/session authenticated RBAC | `projects.update, projects.update_own` | admin |
| `PUT` | `/api/projects/{id}/` | `ProjectDetailView.put` | Token/session authenticated RBAC | `projects.update, projects.update_own` | admin |
| `GET` | `/api/projects/{id}/export-pdf/` | `ProjectPDFExportView.get` | Authenticated | `-` | admin, manager, data_entry |

### Reports

| Method | URL | View/Action | Auth | Permissions | Roles |
|---|---|---|---|---|---|
| `GET` | `/api/reports/attendance/` | `AttendanceReportView.get` | Token/session authenticated RBAC | `reports.view, reports.view_assigned` | admin |
| `GET` | `/api/reports/contracts/` | `ContractReportView.get` | Token/session authenticated RBAC | `reports.view, reports.view_assigned` | admin |
| `GET` | `/api/reports/employees/` | `EmployeeReportView.get` | Token/session authenticated RBAC | `reports.view, reports.view_assigned` | admin |
| `GET` | `/api/reports/expenses/` | `ExpenseReportView.get` | Token/session authenticated RBAC | `reports.view, reports.view_assigned` | admin |
| `GET` | `/api/reports/financial/` | `FinancialReportView.get` | Token/session authenticated RBAC | `reports.view, reports.view_assigned` | admin |
| `GET` | `/api/reports/payroll/` | `PayrollReportView.get` | Token/session authenticated RBAC | `reports.view, reports.view_assigned` | admin |
| `GET` | `/api/reports/projects/` | `ProjectReportView.get` | Token/session authenticated RBAC | `reports.view, reports.view_assigned` | admin |

### Settings

| Method | URL | View/Action | Auth | Permissions | Roles |
|---|---|---|---|---|---|
| `GET` | `/api/schema/` | `SchemaView.get` | Authenticated | `-` | admin, manager, data_entry |

### Users

| Method | URL | View/Action | Auth | Permissions | Roles |
|---|---|---|---|---|---|
| `GET` | `/api/auth/permissions/` | `PermissionViewSet.list` | Authenticated admin role | `admin role` | admin |
| `POST` | `/api/auth/permissions/` | `PermissionViewSet.create` | Authenticated admin role | `admin role` | admin |
| `DELETE` | `/api/auth/permissions/{id}/` | `PermissionViewSet.destroy` | Authenticated admin role | `admin role` | admin |
| `GET` | `/api/auth/permissions/{id}/` | `PermissionViewSet.retrieve` | Authenticated admin role | `admin role` | admin |
| `PATCH` | `/api/auth/permissions/{id}/` | `PermissionViewSet.partial_update` | Authenticated admin role | `admin role` | admin |
| `PUT` | `/api/auth/permissions/{id}/` | `PermissionViewSet.update` | Authenticated admin role | `admin role` | admin |
| `GET` | `/api/auth/project-assignments/` | `ProjectAssignmentViewSet.list` | Authenticated admin role | `admin role` | admin |
| `POST` | `/api/auth/project-assignments/` | `ProjectAssignmentViewSet.create` | Authenticated admin role | `admin role` | admin |
| `DELETE` | `/api/auth/project-assignments/{id}/` | `ProjectAssignmentViewSet.destroy` | Authenticated admin role | `admin role` | admin |
| `GET` | `/api/auth/project-assignments/{id}/` | `ProjectAssignmentViewSet.retrieve` | Authenticated admin role | `admin role` | admin |
| `PATCH` | `/api/auth/project-assignments/{id}/` | `ProjectAssignmentViewSet.partial_update` | Authenticated admin role | `admin role` | admin |
| `PUT` | `/api/auth/project-assignments/{id}/` | `ProjectAssignmentViewSet.update` | Authenticated admin role | `admin role` | admin |
| `GET` | `/api/auth/role-permissions/` | `RolePermissionViewSet.list` | Authenticated admin role | `admin role` | admin |
| `POST` | `/api/auth/role-permissions/` | `RolePermissionViewSet.create` | Authenticated admin role | `admin role` | admin |
| `DELETE` | `/api/auth/role-permissions/{id}/` | `RolePermissionViewSet.destroy` | Authenticated admin role | `admin role` | admin |
| `GET` | `/api/auth/role-permissions/{id}/` | `RolePermissionViewSet.retrieve` | Authenticated admin role | `admin role` | admin |
| `PATCH` | `/api/auth/role-permissions/{id}/` | `RolePermissionViewSet.partial_update` | Authenticated admin role | `admin role` | admin |
| `PUT` | `/api/auth/role-permissions/{id}/` | `RolePermissionViewSet.update` | Authenticated admin role | `admin role` | admin |
| `GET` | `/api/auth/user-permissions/` | `UserPermissionOverrideViewSet.list` | Authenticated admin role | `admin role` | admin |
| `POST` | `/api/auth/user-permissions/` | `UserPermissionOverrideViewSet.create` | Authenticated admin role | `admin role` | admin |
| `DELETE` | `/api/auth/user-permissions/{id}/` | `UserPermissionOverrideViewSet.destroy` | Authenticated admin role | `admin role` | admin |
| `GET` | `/api/auth/user-permissions/{id}/` | `UserPermissionOverrideViewSet.retrieve` | Authenticated admin role | `admin role` | admin |
| `PATCH` | `/api/auth/user-permissions/{id}/` | `UserPermissionOverrideViewSet.partial_update` | Authenticated admin role | `admin role` | admin |
| `PUT` | `/api/auth/user-permissions/{id}/` | `UserPermissionOverrideViewSet.update` | Authenticated admin role | `admin role` | admin |
| `GET` | `/api/auth/users/` | `UserViewSet.list` | Authenticated admin role | `admin role` | admin |
| `POST` | `/api/auth/users/` | `UserViewSet.create` | Authenticated admin role | `admin role` | admin |
| `DELETE` | `/api/auth/users/{id}/` | `UserViewSet.destroy` | Authenticated admin role | `admin role` | admin |
| `GET` | `/api/auth/users/{id}/` | `UserViewSet.retrieve` | Authenticated admin role | `admin role` | admin |
| `PATCH` | `/api/auth/users/{id}/` | `UserViewSet.partial_update` | Authenticated admin role | `admin role` | admin |
| `PUT` | `/api/auth/users/{id}/` | `UserViewSet.update` | Authenticated admin role | `admin role` | admin |
| `POST` | `/api/auth/users/{id}/set_password/` | `UserViewSet.set_password` | Authenticated admin role | `admin role` | admin |
| `POST` | `/api/auth/users/{id}/set_role/` | `UserViewSet.set_role` | Authenticated admin role | `admin role` | admin |

## Endpoint Details

### `GET /api/attendance/`

**Module:** Attendance
**Description:** Attendance management.
**Authentication:** Token/session authenticated RBAC
**Required permissions:** `attendance.view, attendance.view_assigned`
**Roles inferred:** admin, data_entry
**View/action:** `AttendanceViewSet.list`

**Query parameters:** none documented/inferred.

**Request/response serializer:** `AttendanceListSerializer`

**Example request**

```http
GET /api/attendance/ HTTP/1.1
Host: 127.0.0.1:8000
Authorization: Token {{token}}
```

**Example response**

```json
{
  "detail": "Example response shape depends on serializer/custom view. See schema sections below."
}
```

**Possible error responses:** `400` validation error, `401` unauthenticated, `403` permission denied, `404` not found, `405` method not allowed.

### `POST /api/attendance/`

**Module:** Attendance
**Description:** Attendance management.
**Authentication:** Token/session authenticated RBAC
**Required permissions:** `attendance.create`
**Roles inferred:** admin, data_entry
**View/action:** `AttendanceViewSet.create`

**Query parameters:** none documented/inferred.

**Request/response serializer:** `AttendanceSerializer`

**Example request**

```http
POST /api/attendance/ HTTP/1.1
Host: 127.0.0.1:8000
Authorization: Token {{token}}
Content-Type: application/json

{}
```

**Example response**

```json
{
  "detail": "Example response shape depends on serializer/custom view. See schema sections below."
}
```

**Possible error responses:** `400` validation error, `401` unauthenticated, `403` permission denied, `404` not found, `405` method not allowed.

### `DELETE /api/attendance/{id}/`

**Module:** Attendance
**Description:** Attendance management.
**Authentication:** Token/session authenticated RBAC
**Required permissions:** `attendance.delete`
**Roles inferred:** admin
**View/action:** `AttendanceViewSet.destroy`

**Query parameters:** none documented/inferred.

**Request/response serializer:** `AttendanceSerializer`

**Example request**

```http
DELETE /api/attendance/{id}/ HTTP/1.1
Host: 127.0.0.1:8000
Authorization: Token {{token}}
```

**Example response**

```json
{
  "detail": "Example response shape depends on serializer/custom view. See schema sections below."
}
```

**Possible error responses:** `400` validation error, `401` unauthenticated, `403` permission denied, `404` not found, `405` method not allowed.

### `GET /api/attendance/{id}/`

**Module:** Attendance
**Description:** Attendance management.
**Authentication:** Token/session authenticated RBAC
**Required permissions:** `attendance.view, attendance.view_assigned`
**Roles inferred:** admin, data_entry
**View/action:** `AttendanceViewSet.retrieve`

**Query parameters:** none documented/inferred.

**Request/response serializer:** `AttendanceSerializer`

**Example request**

```http
GET /api/attendance/{id}/ HTTP/1.1
Host: 127.0.0.1:8000
Authorization: Token {{token}}
```

**Example response**

```json
{
  "detail": "Example response shape depends on serializer/custom view. See schema sections below."
}
```

**Possible error responses:** `400` validation error, `401` unauthenticated, `403` permission denied, `404` not found, `405` method not allowed.

### `PATCH /api/attendance/{id}/`

**Module:** Attendance
**Description:** Attendance management.
**Authentication:** Token/session authenticated RBAC
**Required permissions:** `attendance.update, attendance.update_own`
**Roles inferred:** admin
**View/action:** `AttendanceViewSet.partial_update`

**Query parameters:** none documented/inferred.

**Request/response serializer:** `AttendanceSerializer`

**Example request**

```http
PATCH /api/attendance/{id}/ HTTP/1.1
Host: 127.0.0.1:8000
Authorization: Token {{token}}
Content-Type: application/json

{}
```

**Example response**

```json
{
  "detail": "Example response shape depends on serializer/custom view. See schema sections below."
}
```

**Possible error responses:** `400` validation error, `401` unauthenticated, `403` permission denied, `404` not found, `405` method not allowed.

### `PUT /api/attendance/{id}/`

**Module:** Attendance
**Description:** Attendance management.
**Authentication:** Token/session authenticated RBAC
**Required permissions:** `attendance.update, attendance.update_own`
**Roles inferred:** admin
**View/action:** `AttendanceViewSet.update`

**Query parameters:** none documented/inferred.

**Request/response serializer:** `AttendanceSerializer`

**Example request**

```http
PUT /api/attendance/{id}/ HTTP/1.1
Host: 127.0.0.1:8000
Authorization: Token {{token}}
Content-Type: application/json

{}
```

**Example response**

```json
{
  "detail": "Example response shape depends on serializer/custom view. See schema sections below."
}
```

**Possible error responses:** `400` validation error, `401` unauthenticated, `403` permission denied, `404` not found, `405` method not allowed.

### `POST /api/attendance/bulk_mark/`

**Module:** Attendance
**Description:** Attendance management.
**Authentication:** Token/session authenticated RBAC
**Required permissions:** `attendance.create`
**Roles inferred:** admin, data_entry
**View/action:** `AttendanceViewSet.bulk_mark`

**Query parameters:** none documented/inferred.

**Request/response serializer:** `BulkAttendanceSerializer`

**Example request**

```http
POST /api/attendance/bulk_mark/ HTTP/1.1
Host: 127.0.0.1:8000
Authorization: Token {{token}}
Content-Type: application/json

{}
```

**Example response**

```json
{
  "detail": "Example response shape depends on serializer/custom view. See schema sections below."
}
```

**Possible error responses:** `400` validation error, `401` unauthenticated, `403` permission denied, `404` not found, `405` method not allowed.

### `GET /api/attendance/daily/`

**Module:** Attendance
**Description:** Get attendance for a specific date.
**Authentication:** Token/session authenticated RBAC
**Required permissions:** `attendance.view, attendance.view_assigned`
**Roles inferred:** admin, data_entry
**View/action:** `AttendanceViewSet.daily`

**Query parameters:** none documented/inferred.

**Request/response serializer:** `AttendanceSerializer`

**Example request**

```http
GET /api/attendance/daily/ HTTP/1.1
Host: 127.0.0.1:8000
Authorization: Token {{token}}
```

**Example response**

```json
{
  "detail": "Example response shape depends on serializer/custom view. See schema sections below."
}
```

**Possible error responses:** `400` validation error, `401` unauthenticated, `403` permission denied, `404` not found, `405` method not allowed.

### `GET /api/attendance/summary/`

**Module:** Attendance
**Description:** Monthly attendance summary for one employee.
**Authentication:** Token/session authenticated RBAC
**Required permissions:** `attendance.view, attendance.view_assigned`
**Roles inferred:** admin, data_entry
**View/action:** `AttendanceViewSet.summary`

**Query parameters:** none documented/inferred.

**Request/response serializer:** `AttendanceSerializer`

**Example request**

```http
GET /api/attendance/summary/ HTTP/1.1
Host: 127.0.0.1:8000
Authorization: Token {{token}}
```

**Example response**

```json
{
  "detail": "Example response shape depends on serializer/custom view. See schema sections below."
}
```

**Possible error responses:** `400` validation error, `401` unauthenticated, `403` permission denied, `404` not found, `405` method not allowed.

### `GET /api/employees/attendance/export-pdf/`

**Module:** Attendance
**Description:** Intentionally simple parent class for all views. Only implements
**Authentication:** Authenticated
**Required permissions:** `-`
**Roles inferred:** admin, manager, data_entry
**View/action:** `AttendancePDFExportView.get`

**Query parameters:** none documented/inferred.

**Request/response schema:** custom response or not declared by serializer.

**Example request**

```http
GET /api/employees/attendance/export-pdf/ HTTP/1.1
Host: 127.0.0.1:8000
Authorization: Token {{token}}
```

**Example response**

```json
{
  "detail": "Example response shape depends on serializer/custom view. See schema sections below."
}
```

**Possible error responses:** `400` validation error, `401` unauthenticated, `403` permission denied, `404` not found, `405` method not allowed.

### `GET /api/worker-attendance/`

**Module:** Attendance
**Description:** A viewset that provides default `create()`, `retrieve()`, `update()`,
**Authentication:** Token/session authenticated RBAC
**Required permissions:** `daily_worker_attendance.view, daily_worker_attendance.view_assigned`
**Roles inferred:** admin, data_entry, manager
**View/action:** `WorkerAttendanceViewSet.list`

**Query parameters:** none documented/inferred.

**Request/response serializer:** `WorkerAttendanceSerializer`

**Example request**

```http
GET /api/worker-attendance/ HTTP/1.1
Host: 127.0.0.1:8000
Authorization: Token {{token}}
```

**Example response**

```json
{
  "detail": "Example response shape depends on serializer/custom view. See schema sections below."
}
```

**Possible error responses:** `400` validation error, `401` unauthenticated, `403` permission denied, `404` not found, `405` method not allowed.

### `POST /api/worker-attendance/`

**Module:** Attendance
**Description:** A viewset that provides default `create()`, `retrieve()`, `update()`,
**Authentication:** Token/session authenticated RBAC
**Required permissions:** `daily_worker_attendance.create`
**Roles inferred:** admin, data_entry, manager
**View/action:** `WorkerAttendanceViewSet.create`

**Query parameters:** none documented/inferred.

**Request/response serializer:** `WorkerAttendanceSerializer`

**Example request**

```http
POST /api/worker-attendance/ HTTP/1.1
Host: 127.0.0.1:8000
Authorization: Token {{token}}
Content-Type: application/json

{}
```

**Example response**

```json
{
  "detail": "Example response shape depends on serializer/custom view. See schema sections below."
}
```

**Possible error responses:** `400` validation error, `401` unauthenticated, `403` permission denied, `404` not found, `405` method not allowed.

### `DELETE /api/worker-attendance/{id}/`

**Module:** Attendance
**Description:** A viewset that provides default `create()`, `retrieve()`, `update()`,
**Authentication:** Token/session authenticated RBAC
**Required permissions:** `daily_worker_attendance.delete`
**Roles inferred:** admin
**View/action:** `WorkerAttendanceViewSet.destroy`

**Query parameters:** none documented/inferred.

**Request/response serializer:** `WorkerAttendanceSerializer`

**Example request**

```http
DELETE /api/worker-attendance/{id}/ HTTP/1.1
Host: 127.0.0.1:8000
Authorization: Token {{token}}
```

**Example response**

```json
{
  "detail": "Example response shape depends on serializer/custom view. See schema sections below."
}
```

**Possible error responses:** `400` validation error, `401` unauthenticated, `403` permission denied, `404` not found, `405` method not allowed.

### `GET /api/worker-attendance/{id}/`

**Module:** Attendance
**Description:** A viewset that provides default `create()`, `retrieve()`, `update()`,
**Authentication:** Token/session authenticated RBAC
**Required permissions:** `daily_worker_attendance.view, daily_worker_attendance.view_assigned`
**Roles inferred:** admin, data_entry, manager
**View/action:** `WorkerAttendanceViewSet.retrieve`

**Query parameters:** none documented/inferred.

**Request/response serializer:** `WorkerAttendanceSerializer`

**Example request**

```http
GET /api/worker-attendance/{id}/ HTTP/1.1
Host: 127.0.0.1:8000
Authorization: Token {{token}}
```

**Example response**

```json
{
  "detail": "Example response shape depends on serializer/custom view. See schema sections below."
}
```

**Possible error responses:** `400` validation error, `401` unauthenticated, `403` permission denied, `404` not found, `405` method not allowed.

### `PATCH /api/worker-attendance/{id}/`

**Module:** Attendance
**Description:** A viewset that provides default `create()`, `retrieve()`, `update()`,
**Authentication:** Token/session authenticated RBAC
**Required permissions:** `daily_worker_attendance.update, daily_worker_attendance.update_own`
**Roles inferred:** admin, manager
**View/action:** `WorkerAttendanceViewSet.partial_update`

**Query parameters:** none documented/inferred.

**Request/response serializer:** `WorkerAttendanceSerializer`

**Example request**

```http
PATCH /api/worker-attendance/{id}/ HTTP/1.1
Host: 127.0.0.1:8000
Authorization: Token {{token}}
Content-Type: application/json

{}
```

**Example response**

```json
{
  "detail": "Example response shape depends on serializer/custom view. See schema sections below."
}
```

**Possible error responses:** `400` validation error, `401` unauthenticated, `403` permission denied, `404` not found, `405` method not allowed.

### `PUT /api/worker-attendance/{id}/`

**Module:** Attendance
**Description:** A viewset that provides default `create()`, `retrieve()`, `update()`,
**Authentication:** Token/session authenticated RBAC
**Required permissions:** `daily_worker_attendance.update, daily_worker_attendance.update_own`
**Roles inferred:** admin, manager
**View/action:** `WorkerAttendanceViewSet.update`

**Query parameters:** none documented/inferred.

**Request/response serializer:** `WorkerAttendanceSerializer`

**Example request**

```http
PUT /api/worker-attendance/{id}/ HTTP/1.1
Host: 127.0.0.1:8000
Authorization: Token {{token}}
Content-Type: application/json

{}
```

**Example response**

```json
{
  "detail": "Example response shape depends on serializer/custom view. See schema sections below."
}
```

**Possible error responses:** `400` validation error, `401` unauthenticated, `403` permission denied, `404` not found, `405` method not allowed.

### `POST /api/worker-attendance/bulk_mark/`

**Module:** Attendance
**Description:** A viewset that provides default `create()`, `retrieve()`, `update()`,
**Authentication:** Token/session authenticated RBAC
**Required permissions:** `daily_worker_attendance.create`
**Roles inferred:** admin, data_entry, manager
**View/action:** `WorkerAttendanceViewSet.bulk_mark`

**Query parameters:** none documented/inferred.

**Request/response serializer:** `WorkerAttendanceSerializer`

**Example request**

```http
POST /api/worker-attendance/bulk_mark/ HTTP/1.1
Host: 127.0.0.1:8000
Authorization: Token {{token}}
Content-Type: application/json

{}
```

**Example response**

```json
{
  "detail": "Example response shape depends on serializer/custom view. See schema sections below."
}
```

**Possible error responses:** `400` validation error, `401` unauthenticated, `403` permission denied, `404` not found, `405` method not allowed.

### `GET /api/worker-attendance/daily_status/`

**Module:** Attendance
**Description:** A viewset that provides default `create()`, `retrieve()`, `update()`,
**Authentication:** Token/session authenticated RBAC
**Required permissions:** `daily_worker_attendance.view, daily_worker_attendance.view_assigned`
**Roles inferred:** admin, data_entry, manager
**View/action:** `WorkerAttendanceViewSet.daily_status`

**Query parameters:** none documented/inferred.

**Request/response serializer:** `WorkerAttendanceSerializer`

**Example request**

```http
GET /api/worker-attendance/daily_status/ HTTP/1.1
Host: 127.0.0.1:8000
Authorization: Token {{token}}
```

**Example response**

```json
{
  "detail": "Example response shape depends on serializer/custom view. See schema sections below."
}
```

**Possible error responses:** `400` validation error, `401` unauthenticated, `403` permission denied, `404` not found, `405` method not allowed.

### `GET /api/worker-attendance/summary/`

**Module:** Attendance
**Description:** A viewset that provides default `create()`, `retrieve()`, `update()`,
**Authentication:** Token/session authenticated RBAC
**Required permissions:** `daily_worker_attendance.view, daily_worker_attendance.view_assigned`
**Roles inferred:** admin, data_entry, manager
**View/action:** `WorkerAttendanceViewSet.summary`

**Query parameters:** none documented/inferred.

**Request/response serializer:** `WorkerAttendanceSerializer`

**Example request**

```http
GET /api/worker-attendance/summary/ HTTP/1.1
Host: 127.0.0.1:8000
Authorization: Token {{token}}
```

**Example response**

```json
{
  "detail": "Example response shape depends on serializer/custom view. See schema sections below."
}
```

**Possible error responses:** `400` validation error, `401` unauthenticated, `403` permission denied, `404` not found, `405` method not allowed.

### `GET /api/audit/logs/`

**Module:** Audit / Settings
**Description:** List a queryset.
**Authentication:** Authenticated with audit permissions
**Required permissions:** `audit_logs.view`
**Roles inferred:** admin
**View/action:** `AuditLogViewSet.list`

**Query parameters**

| Name | Type | Required | Description |
|---|---|---|---|
| page | integer | no | Page number. |
| page_size | integer | no | Page size, max defined by view pagination class. |

**Request/response serializer:** `AuditLogListSerializer`

**Example request**

```http
GET /api/audit/logs/ HTTP/1.1
Host: 127.0.0.1:8000
Authorization: Token {{token}}
```

**Example response**

```json
{
  "detail": "Example response shape depends on serializer/custom view. See schema sections below."
}
```

**Possible error responses:** `400` validation error, `401` unauthenticated, `403` permission denied, `404` not found, `405` method not allowed.

**Pagination:** page-number pagination. Paginated responses use `{ count, next, previous, results }` unless the view customizes the shape.

### `DELETE /api/audit/logs/{id}/`

**Module:** Audit / Settings
**Description:** List a queryset.
**Authentication:** Authenticated with audit permissions
**Required permissions:** `audit_logs.delete`
**Roles inferred:** admin
**View/action:** `AuditLogViewSet.destroy`

**Query parameters**

| Name | Type | Required | Description |
|---|---|---|---|
| page | integer | no | Page number. |
| page_size | integer | no | Page size, max defined by view pagination class. |

**Request/response serializer:** `AuditLogListSerializer`

**Example request**

```http
DELETE /api/audit/logs/{id}/ HTTP/1.1
Host: 127.0.0.1:8000
Authorization: Token {{token}}
```

**Example response**

```json
{
  "detail": "Example response shape depends on serializer/custom view. See schema sections below."
}
```

**Possible error responses:** `400` validation error, `401` unauthenticated, `403` permission denied, `404` not found, `405` method not allowed.

**Pagination:** page-number pagination. Paginated responses use `{ count, next, previous, results }` unless the view customizes the shape.

### `GET /api/audit/logs/{id}/`

**Module:** Audit / Settings
**Description:** List a queryset.
**Authentication:** Authenticated with audit permissions
**Required permissions:** `audit_logs.view`
**Roles inferred:** admin
**View/action:** `AuditLogViewSet.retrieve`

**Query parameters**

| Name | Type | Required | Description |
|---|---|---|---|
| page | integer | no | Page number. |
| page_size | integer | no | Page size, max defined by view pagination class. |

**Request/response serializer:** `AuditLogDetailSerializer`

**Example request**

```http
GET /api/audit/logs/{id}/ HTTP/1.1
Host: 127.0.0.1:8000
Authorization: Token {{token}}
```

**Example response**

```json
{
  "detail": "Example response shape depends on serializer/custom view. See schema sections below."
}
```

**Possible error responses:** `400` validation error, `401` unauthenticated, `403` permission denied, `404` not found, `405` method not allowed.

**Pagination:** page-number pagination. Paginated responses use `{ count, next, previous, results }` unless the view customizes the shape.

### `GET /api/audit/logs/export/csv/`

**Module:** Audit / Settings
**Description:** List a queryset.
**Authentication:** Authenticated with audit permissions
**Required permissions:** `audit_logs.export`
**Roles inferred:** admin
**View/action:** `AuditLogViewSet.export_csv`

**Query parameters**

| Name | Type | Required | Description |
|---|---|---|---|
| page | integer | no | Page number. |
| page_size | integer | no | Page size, max defined by view pagination class. |

**Request/response serializer:** `AuditLogListSerializer`

**Example request**

```http
GET /api/audit/logs/export/csv/ HTTP/1.1
Host: 127.0.0.1:8000
Authorization: Token {{token}}
```

**Example response**

```json
{
  "detail": "Example response shape depends on serializer/custom view. See schema sections below."
}
```

**Possible error responses:** `400` validation error, `401` unauthenticated, `403` permission denied, `404` not found, `405` method not allowed.

**Pagination:** page-number pagination. Paginated responses use `{ count, next, previous, results }` unless the view customizes the shape.

### `GET /api/audit/logs/export/excel/`

**Module:** Audit / Settings
**Description:** List a queryset.
**Authentication:** Authenticated with audit permissions
**Required permissions:** `audit_logs.export`
**Roles inferred:** admin
**View/action:** `AuditLogViewSet.export_excel`

**Query parameters**

| Name | Type | Required | Description |
|---|---|---|---|
| page | integer | no | Page number. |
| page_size | integer | no | Page size, max defined by view pagination class. |

**Request/response serializer:** `AuditLogListSerializer`

**Example request**

```http
GET /api/audit/logs/export/excel/ HTTP/1.1
Host: 127.0.0.1:8000
Authorization: Token {{token}}
```

**Example response**

```json
{
  "detail": "Example response shape depends on serializer/custom view. See schema sections below."
}
```

**Possible error responses:** `400` validation error, `401` unauthenticated, `403` permission denied, `404` not found, `405` method not allowed.

**Pagination:** page-number pagination. Paginated responses use `{ count, next, previous, results }` unless the view customizes the shape.

### `GET /api/audit/logs/options/`

**Module:** Audit / Settings
**Description:** Handler method for HTTP 'OPTIONS' request.
**Authentication:** Authenticated with audit permissions
**Required permissions:** `audit_logs.view`
**Roles inferred:** admin
**View/action:** `AuditLogViewSet.options`

**Query parameters**

| Name | Type | Required | Description |
|---|---|---|---|
| page | integer | no | Page number. |
| page_size | integer | no | Page size, max defined by view pagination class. |

**Request/response serializer:** `AuditLogListSerializer`

**Example request**

```http
GET /api/audit/logs/options/ HTTP/1.1
Host: 127.0.0.1:8000
Authorization: Token {{token}}
```

**Example response**

```json
{
  "detail": "Example response shape depends on serializer/custom view. See schema sections below."
}
```

**Possible error responses:** `400` validation error, `401` unauthenticated, `403` permission denied, `404` not found, `405` method not allowed.

**Pagination:** page-number pagination. Paginated responses use `{ count, next, previous, results }` unless the view customizes the shape.

### `GET /api/audit/logs/retention/`

**Module:** Audit / Settings
**Description:** List a queryset.
**Authentication:** Authenticated with audit permissions
**Required permissions:** `audit_logs.manage_retention`
**Roles inferred:** admin
**View/action:** `AuditLogViewSet.retention`

**Query parameters**

| Name | Type | Required | Description |
|---|---|---|---|
| page | integer | no | Page number. |
| page_size | integer | no | Page size, max defined by view pagination class. |

**Request/response serializer:** `AuditLogListSerializer`

**Example request**

```http
GET /api/audit/logs/retention/ HTTP/1.1
Host: 127.0.0.1:8000
Authorization: Token {{token}}
```

**Example response**

```json
{
  "detail": "Example response shape depends on serializer/custom view. See schema sections below."
}
```

**Possible error responses:** `400` validation error, `401` unauthenticated, `403` permission denied, `404` not found, `405` method not allowed.

**Pagination:** page-number pagination. Paginated responses use `{ count, next, previous, results }` unless the view customizes the shape.

### `PUT /api/audit/logs/retention/`

**Module:** Audit / Settings
**Description:** List a queryset.
**Authentication:** Authenticated with audit permissions
**Required permissions:** `audit_logs.manage_retention`
**Roles inferred:** admin
**View/action:** `AuditLogViewSet.retention`

**Query parameters**

| Name | Type | Required | Description |
|---|---|---|---|
| page | integer | no | Page number. |
| page_size | integer | no | Page size, max defined by view pagination class. |

**Request/response serializer:** `AuditLogListSerializer`

**Example request**

```http
PUT /api/audit/logs/retention/ HTTP/1.1
Host: 127.0.0.1:8000
Authorization: Token {{token}}
Content-Type: application/json

{}
```

**Example response**

```json
{
  "detail": "Example response shape depends on serializer/custom view. See schema sections below."
}
```

**Possible error responses:** `400` validation error, `401` unauthenticated, `403` permission denied, `404` not found, `405` method not allowed.

**Pagination:** page-number pagination. Paginated responses use `{ count, next, previous, results }` unless the view customizes the shape.

### `GET /api/audit/logs/summary/`

**Module:** Audit / Settings
**Description:** List a queryset.
**Authentication:** Authenticated with audit permissions
**Required permissions:** `audit_logs.view`
**Roles inferred:** admin
**View/action:** `AuditLogViewSet.summary`

**Query parameters**

| Name | Type | Required | Description |
|---|---|---|---|
| page | integer | no | Page number. |
| page_size | integer | no | Page size, max defined by view pagination class. |

**Request/response serializer:** `AuditLogListSerializer`

**Example request**

```http
GET /api/audit/logs/summary/ HTTP/1.1
Host: 127.0.0.1:8000
Authorization: Token {{token}}
```

**Example response**

```json
{
  "detail": "Example response shape depends on serializer/custom view. See schema sections below."
}
```

**Possible error responses:** `400` validation error, `401` unauthenticated, `403` permission denied, `404` not found, `405` method not allowed.

**Pagination:** page-number pagination. Paginated responses use `{ count, next, previous, results }` unless the view customizes the shape.

### `POST /api/auth/login/`

**Module:** Authentication
**Description:** Intentionally simple parent class for all views. Only implements
**Authentication:** Public
**Required permissions:** `-`
**Roles inferred:** All
**View/action:** `LoginView.post`

**Query parameters:** none documented/inferred.

**Request/response schema:** custom response or not declared by serializer.

**Example request**

```http
POST /api/auth/login/ HTTP/1.1
Host: 127.0.0.1:8000
Content-Type: application/json

{}
```

**Example response**

```json
{
  "detail": "Example response shape depends on serializer/custom view. See schema sections below."
}
```

**Possible error responses:** `400` validation error, `401` unauthenticated, `403` permission denied, `404` not found, `405` method not allowed.

### `POST /api/auth/logout/`

**Module:** Authentication
**Description:** Intentionally simple parent class for all views. Only implements
**Authentication:** Authenticated
**Required permissions:** `-`
**Roles inferred:** admin, manager, data_entry
**View/action:** `LogoutView.post`

**Query parameters:** none documented/inferred.

**Request/response schema:** custom response or not declared by serializer.

**Example request**

```http
POST /api/auth/logout/ HTTP/1.1
Host: 127.0.0.1:8000
Authorization: Token {{token}}
Content-Type: application/json

{}
```

**Example response**

```json
{
  "detail": "Example response shape depends on serializer/custom view. See schema sections below."
}
```

**Possible error responses:** `400` validation error, `401` unauthenticated, `403` permission denied, `404` not found, `405` method not allowed.

### `GET /api/auth/me/`

**Module:** Authentication
**Description:** Intentionally simple parent class for all views. Only implements
**Authentication:** Authenticated
**Required permissions:** `-`
**Roles inferred:** admin, manager, data_entry
**View/action:** `MeView.get`

**Query parameters:** none documented/inferred.

**Request/response schema:** custom response or not declared by serializer.

**Example request**

```http
GET /api/auth/me/ HTTP/1.1
Host: 127.0.0.1:8000
Authorization: Token {{token}}
```

**Example response**

```json
{
  "detail": "Example response shape depends on serializer/custom view. See schema sections below."
}
```

**Possible error responses:** `400` validation error, `401` unauthenticated, `403` permission denied, `404` not found, `405` method not allowed.

### `GET /api/auth/meta/`

**Module:** Authentication
**Description:** Intentionally simple parent class for all views. Only implements
**Authentication:** Authenticated
**Required permissions:** `-`
**Roles inferred:** admin, manager, data_entry
**View/action:** `roles_and_permissions.get`

**Query parameters:** none documented/inferred.

**Request/response schema:** custom response or not declared by serializer.

**Example request**

```http
GET /api/auth/meta/ HTTP/1.1
Host: 127.0.0.1:8000
Authorization: Token {{token}}
```

**Example response**

```json
{
  "detail": "Example response shape depends on serializer/custom view. See schema sections below."
}
```

**Possible error responses:** `400` validation error, `401` unauthenticated, `403` permission denied, `404` not found, `405` method not allowed.

### `GET /api/subcontractors/`

**Module:** Contractors
**Description:** CRUD + soft-delete + nested contract list + financial summary.
**Authentication:** Token/session authenticated RBAC
**Required permissions:** `subcontractors.view, subcontractors.view_assigned`
**Roles inferred:** admin
**View/action:** `SubcontractorViewSet.list`

**Query parameters**

| Name | Type | Required | Description |
|---|---|---|---|
| filterset_class | string | no | Uses `SubcontractorFilter`. |
| search | string | no | Searches: name, contact_person, specialization |
| ordering | string | no | Allowed: name, specialization, created_at |
| page | integer | no | Page number. |
| page_size | integer | no | Page size, max defined by view pagination class. |

**Request/response serializer:** `SubcontractorListSerializer`

**Example request**

```http
GET /api/subcontractors/ HTTP/1.1
Host: 127.0.0.1:8000
Authorization: Token {{token}}
```

**Example response**

```json
{
  "detail": "Example response shape depends on serializer/custom view. See schema sections below."
}
```

**Possible error responses:** `400` validation error, `401` unauthenticated, `403` permission denied, `404` not found, `405` method not allowed.

**Pagination:** page-number pagination. Paginated responses use `{ count, next, previous, results }` unless the view customizes the shape.

### `POST /api/subcontractors/`

**Module:** Contractors
**Description:** CRUD + soft-delete + nested contract list + financial summary.
**Authentication:** Token/session authenticated RBAC
**Required permissions:** `subcontractors.create`
**Roles inferred:** admin
**View/action:** `SubcontractorViewSet.create`

**Query parameters**

| Name | Type | Required | Description |
|---|---|---|---|
| filterset_class | string | no | Uses `SubcontractorFilter`. |
| search | string | no | Searches: name, contact_person, specialization |
| ordering | string | no | Allowed: name, specialization, created_at |
| page | integer | no | Page number. |
| page_size | integer | no | Page size, max defined by view pagination class. |

**Request/response serializer:** `SubcontractorDetailSerializer`

**Example request**

```http
POST /api/subcontractors/ HTTP/1.1
Host: 127.0.0.1:8000
Authorization: Token {{token}}
Content-Type: application/json

{}
```

**Example response**

```json
{
  "detail": "Example response shape depends on serializer/custom view. See schema sections below."
}
```

**Possible error responses:** `400` validation error, `401` unauthenticated, `403` permission denied, `404` not found, `405` method not allowed.

**Pagination:** page-number pagination. Paginated responses use `{ count, next, previous, results }` unless the view customizes the shape.

### `DELETE /api/subcontractors/{id}/`

**Module:** Contractors
**Description:** CRUD + soft-delete + nested contract list + financial summary.
**Authentication:** Token/session authenticated RBAC
**Required permissions:** `subcontractors.delete`
**Roles inferred:** admin
**View/action:** `SubcontractorViewSet.destroy`

**Query parameters**

| Name | Type | Required | Description |
|---|---|---|---|
| filterset_class | string | no | Uses `SubcontractorFilter`. |
| search | string | no | Searches: name, contact_person, specialization |
| ordering | string | no | Allowed: name, specialization, created_at |
| page | integer | no | Page number. |
| page_size | integer | no | Page size, max defined by view pagination class. |

**Request/response serializer:** `SubcontractorDetailSerializer`

**Example request**

```http
DELETE /api/subcontractors/{id}/ HTTP/1.1
Host: 127.0.0.1:8000
Authorization: Token {{token}}
```

**Example response**

```json
{
  "detail": "Example response shape depends on serializer/custom view. See schema sections below."
}
```

**Possible error responses:** `400` validation error, `401` unauthenticated, `403` permission denied, `404` not found, `405` method not allowed.

**Pagination:** page-number pagination. Paginated responses use `{ count, next, previous, results }` unless the view customizes the shape.

### `GET /api/subcontractors/{id}/`

**Module:** Contractors
**Description:** CRUD + soft-delete + nested contract list + financial summary.
**Authentication:** Token/session authenticated RBAC
**Required permissions:** `subcontractors.view, subcontractors.view_assigned`
**Roles inferred:** admin
**View/action:** `SubcontractorViewSet.retrieve`

**Query parameters**

| Name | Type | Required | Description |
|---|---|---|---|
| filterset_class | string | no | Uses `SubcontractorFilter`. |
| search | string | no | Searches: name, contact_person, specialization |
| ordering | string | no | Allowed: name, specialization, created_at |
| page | integer | no | Page number. |
| page_size | integer | no | Page size, max defined by view pagination class. |

**Request/response serializer:** `SubcontractorDetailSerializer`

**Example request**

```http
GET /api/subcontractors/{id}/ HTTP/1.1
Host: 127.0.0.1:8000
Authorization: Token {{token}}
```

**Example response**

```json
{
  "detail": "Example response shape depends on serializer/custom view. See schema sections below."
}
```

**Possible error responses:** `400` validation error, `401` unauthenticated, `403` permission denied, `404` not found, `405` method not allowed.

**Pagination:** page-number pagination. Paginated responses use `{ count, next, previous, results }` unless the view customizes the shape.

### `PATCH /api/subcontractors/{id}/`

**Module:** Contractors
**Description:** CRUD + soft-delete + nested contract list + financial summary.
**Authentication:** Token/session authenticated RBAC
**Required permissions:** `subcontractors.update, subcontractors.update_own`
**Roles inferred:** admin
**View/action:** `SubcontractorViewSet.partial_update`

**Query parameters**

| Name | Type | Required | Description |
|---|---|---|---|
| filterset_class | string | no | Uses `SubcontractorFilter`. |
| search | string | no | Searches: name, contact_person, specialization |
| ordering | string | no | Allowed: name, specialization, created_at |
| page | integer | no | Page number. |
| page_size | integer | no | Page size, max defined by view pagination class. |

**Request/response serializer:** `SubcontractorDetailSerializer`

**Example request**

```http
PATCH /api/subcontractors/{id}/ HTTP/1.1
Host: 127.0.0.1:8000
Authorization: Token {{token}}
Content-Type: application/json

{}
```

**Example response**

```json
{
  "detail": "Example response shape depends on serializer/custom view. See schema sections below."
}
```

**Possible error responses:** `400` validation error, `401` unauthenticated, `403` permission denied, `404` not found, `405` method not allowed.

**Pagination:** page-number pagination. Paginated responses use `{ count, next, previous, results }` unless the view customizes the shape.

### `PUT /api/subcontractors/{id}/`

**Module:** Contractors
**Description:** CRUD + soft-delete + nested contract list + financial summary.
**Authentication:** Token/session authenticated RBAC
**Required permissions:** `subcontractors.update, subcontractors.update_own`
**Roles inferred:** admin
**View/action:** `SubcontractorViewSet.update`

**Query parameters**

| Name | Type | Required | Description |
|---|---|---|---|
| filterset_class | string | no | Uses `SubcontractorFilter`. |
| search | string | no | Searches: name, contact_person, specialization |
| ordering | string | no | Allowed: name, specialization, created_at |
| page | integer | no | Page number. |
| page_size | integer | no | Page size, max defined by view pagination class. |

**Request/response serializer:** `SubcontractorDetailSerializer`

**Example request**

```http
PUT /api/subcontractors/{id}/ HTTP/1.1
Host: 127.0.0.1:8000
Authorization: Token {{token}}
Content-Type: application/json

{}
```

**Example response**

```json
{
  "detail": "Example response shape depends on serializer/custom view. See schema sections below."
}
```

**Possible error responses:** `400` validation error, `401` unauthenticated, `403` permission denied, `404` not found, `405` method not allowed.

**Pagination:** page-number pagination. Paginated responses use `{ count, next, previous, results }` unless the view customizes the shape.

### `GET /api/subcontractors/{id}/contracts/`

**Module:** Contractors
**Description:** List all contracts for this subcontractor.
**Authentication:** Token/session authenticated RBAC
**Required permissions:** `subcontractors.view, subcontractors.view_assigned`
**Roles inferred:** admin
**View/action:** `SubcontractorViewSet.contracts`

**Query parameters**

| Name | Type | Required | Description |
|---|---|---|---|
| filterset_class | string | no | Uses `SubcontractorFilter`. |
| search | string | no | Searches: name, contact_person, specialization |
| ordering | string | no | Allowed: name, specialization, created_at |
| page | integer | no | Page number. |
| page_size | integer | no | Page size, max defined by view pagination class. |

**Request/response serializer:** `SubcontractorDetailSerializer`

**Example request**

```http
GET /api/subcontractors/{id}/contracts/ HTTP/1.1
Host: 127.0.0.1:8000
Authorization: Token {{token}}
```

**Example response**

```json
{
  "detail": "Example response shape depends on serializer/custom view. See schema sections below."
}
```

**Possible error responses:** `400` validation error, `401` unauthenticated, `403` permission denied, `404` not found, `405` method not allowed.

**Pagination:** page-number pagination. Paginated responses use `{ count, next, previous, results }` unless the view customizes the shape.

### `GET /api/subcontractors/{id}/financial_summary/`

**Module:** Contractors
**Description:** CRUD + soft-delete + nested contract list + financial summary.
**Authentication:** Token/session authenticated RBAC
**Required permissions:** `subcontractors.view, subcontractors.view_assigned`
**Roles inferred:** admin
**View/action:** `SubcontractorViewSet.financial_summary`

**Query parameters**

| Name | Type | Required | Description |
|---|---|---|---|
| filterset_class | string | no | Uses `SubcontractorFilter`. |
| search | string | no | Searches: name, contact_person, specialization |
| ordering | string | no | Allowed: name, specialization, created_at |
| page | integer | no | Page number. |
| page_size | integer | no | Page size, max defined by view pagination class. |

**Request/response serializer:** `SubcontractorDetailSerializer`

**Example request**

```http
GET /api/subcontractors/{id}/financial_summary/ HTTP/1.1
Host: 127.0.0.1:8000
Authorization: Token {{token}}
```

**Example response**

```json
{
  "detail": "Example response shape depends on serializer/custom view. See schema sections below."
}
```

**Possible error responses:** `400` validation error, `401` unauthenticated, `403` permission denied, `404` not found, `405` method not allowed.

**Pagination:** page-number pagination. Paginated responses use `{ count, next, previous, results }` unless the view customizes the shape.

### `GET /api/contract-documents/`

**Module:** Contracts
**Description:** A viewset that provides default `create()`, `retrieve()`, `update()`,
**Authentication:** Token/session authenticated RBAC
**Required permissions:** `contract_documents.view, contract_documents.view_assigned`
**Roles inferred:** admin
**View/action:** `ContractDocumentViewSet.list`

**Query parameters**

| Name | Type | Required | Description |
|---|---|---|---|
| ordering | string | no | Allowed: uploaded_at, title |
| page | integer | no | Page number. |
| page_size | integer | no | Page size, max defined by view pagination class. |

**Request/response serializer:** `ContractDocumentSerializer`

**Example request**

```http
GET /api/contract-documents/ HTTP/1.1
Host: 127.0.0.1:8000
Authorization: Token {{token}}
```

**Example response**

```json
{
  "detail": "Example response shape depends on serializer/custom view. See schema sections below."
}
```

**Possible error responses:** `400` validation error, `401` unauthenticated, `403` permission denied, `404` not found, `405` method not allowed.

**Pagination:** page-number pagination. Paginated responses use `{ count, next, previous, results }` unless the view customizes the shape.

### `POST /api/contract-documents/`

**Module:** Contracts
**Description:** A viewset that provides default `create()`, `retrieve()`, `update()`,
**Authentication:** Token/session authenticated RBAC
**Required permissions:** `contract_documents.create`
**Roles inferred:** admin
**View/action:** `ContractDocumentViewSet.create`

**Query parameters**

| Name | Type | Required | Description |
|---|---|---|---|
| ordering | string | no | Allowed: uploaded_at, title |
| page | integer | no | Page number. |
| page_size | integer | no | Page size, max defined by view pagination class. |

**Request/response serializer:** `ContractDocumentCreateSerializer`

**Example request**

```http
POST /api/contract-documents/ HTTP/1.1
Host: 127.0.0.1:8000
Authorization: Token {{token}}
Content-Type: application/json

{}
```

**Example response**

```json
{
  "detail": "Example response shape depends on serializer/custom view. See schema sections below."
}
```

**Possible error responses:** `400` validation error, `401` unauthenticated, `403` permission denied, `404` not found, `405` method not allowed.

**Pagination:** page-number pagination. Paginated responses use `{ count, next, previous, results }` unless the view customizes the shape.

### `DELETE /api/contract-documents/{id}/`

**Module:** Contracts
**Description:** A viewset that provides default `create()`, `retrieve()`, `update()`,
**Authentication:** Token/session authenticated RBAC
**Required permissions:** `contract_documents.delete`
**Roles inferred:** admin
**View/action:** `ContractDocumentViewSet.destroy`

**Query parameters**

| Name | Type | Required | Description |
|---|---|---|---|
| ordering | string | no | Allowed: uploaded_at, title |
| page | integer | no | Page number. |
| page_size | integer | no | Page size, max defined by view pagination class. |

**Request/response serializer:** `ContractDocumentSerializer`

**Example request**

```http
DELETE /api/contract-documents/{id}/ HTTP/1.1
Host: 127.0.0.1:8000
Authorization: Token {{token}}
```

**Example response**

```json
{
  "detail": "Example response shape depends on serializer/custom view. See schema sections below."
}
```

**Possible error responses:** `400` validation error, `401` unauthenticated, `403` permission denied, `404` not found, `405` method not allowed.

**Pagination:** page-number pagination. Paginated responses use `{ count, next, previous, results }` unless the view customizes the shape.

### `GET /api/contract-documents/{id}/`

**Module:** Contracts
**Description:** A viewset that provides default `create()`, `retrieve()`, `update()`,
**Authentication:** Token/session authenticated RBAC
**Required permissions:** `contract_documents.view, contract_documents.view_assigned`
**Roles inferred:** admin
**View/action:** `ContractDocumentViewSet.retrieve`

**Query parameters**

| Name | Type | Required | Description |
|---|---|---|---|
| ordering | string | no | Allowed: uploaded_at, title |
| page | integer | no | Page number. |
| page_size | integer | no | Page size, max defined by view pagination class. |

**Request/response serializer:** `ContractDocumentSerializer`

**Example request**

```http
GET /api/contract-documents/{id}/ HTTP/1.1
Host: 127.0.0.1:8000
Authorization: Token {{token}}
```

**Example response**

```json
{
  "detail": "Example response shape depends on serializer/custom view. See schema sections below."
}
```

**Possible error responses:** `400` validation error, `401` unauthenticated, `403` permission denied, `404` not found, `405` method not allowed.

**Pagination:** page-number pagination. Paginated responses use `{ count, next, previous, results }` unless the view customizes the shape.

### `PATCH /api/contract-documents/{id}/`

**Module:** Contracts
**Description:** A viewset that provides default `create()`, `retrieve()`, `update()`,
**Authentication:** Token/session authenticated RBAC
**Required permissions:** `contract_documents.update, contract_documents.update_own`
**Roles inferred:** admin
**View/action:** `ContractDocumentViewSet.partial_update`

**Query parameters**

| Name | Type | Required | Description |
|---|---|---|---|
| ordering | string | no | Allowed: uploaded_at, title |
| page | integer | no | Page number. |
| page_size | integer | no | Page size, max defined by view pagination class. |

**Request/response serializer:** `ContractDocumentCreateSerializer`

**Example request**

```http
PATCH /api/contract-documents/{id}/ HTTP/1.1
Host: 127.0.0.1:8000
Authorization: Token {{token}}
Content-Type: application/json

{}
```

**Example response**

```json
{
  "detail": "Example response shape depends on serializer/custom view. See schema sections below."
}
```

**Possible error responses:** `400` validation error, `401` unauthenticated, `403` permission denied, `404` not found, `405` method not allowed.

**Pagination:** page-number pagination. Paginated responses use `{ count, next, previous, results }` unless the view customizes the shape.

### `PUT /api/contract-documents/{id}/`

**Module:** Contracts
**Description:** A viewset that provides default `create()`, `retrieve()`, `update()`,
**Authentication:** Token/session authenticated RBAC
**Required permissions:** `contract_documents.update, contract_documents.update_own`
**Roles inferred:** admin
**View/action:** `ContractDocumentViewSet.update`

**Query parameters**

| Name | Type | Required | Description |
|---|---|---|---|
| ordering | string | no | Allowed: uploaded_at, title |
| page | integer | no | Page number. |
| page_size | integer | no | Page size, max defined by view pagination class. |

**Request/response serializer:** `ContractDocumentCreateSerializer`

**Example request**

```http
PUT /api/contract-documents/{id}/ HTTP/1.1
Host: 127.0.0.1:8000
Authorization: Token {{token}}
Content-Type: application/json

{}
```

**Example response**

```json
{
  "detail": "Example response shape depends on serializer/custom view. See schema sections below."
}
```

**Possible error responses:** `400` validation error, `401` unauthenticated, `403` permission denied, `404` not found, `405` method not allowed.

**Pagination:** page-number pagination. Paginated responses use `{ count, next, previous, results }` unless the view customizes the shape.

### `GET /api/contract-payments/`

**Module:** Contracts
**Description:** A viewset that provides default `create()`, `retrieve()`, `update()`,
**Authentication:** Token/session authenticated RBAC
**Required permissions:** `contract_payments.view, contract_payments.view_assigned`
**Roles inferred:** admin
**View/action:** `ContractPaymentViewSet.list`

**Query parameters**

| Name | Type | Required | Description |
|---|---|---|---|
| filterset_class | string | no | Uses `ContractPaymentFilter`. |
| ordering | string | no | Allowed: payment_date, amount, created_at |
| page | integer | no | Page number. |
| page_size | integer | no | Page size, max defined by view pagination class. |

**Request/response serializer:** `ContractPaymentSerializer`

**Example request**

```http
GET /api/contract-payments/ HTTP/1.1
Host: 127.0.0.1:8000
Authorization: Token {{token}}
```

**Example response**

```json
{
  "detail": "Example response shape depends on serializer/custom view. See schema sections below."
}
```

**Possible error responses:** `400` validation error, `401` unauthenticated, `403` permission denied, `404` not found, `405` method not allowed.

**Pagination:** page-number pagination. Paginated responses use `{ count, next, previous, results }` unless the view customizes the shape.

### `POST /api/contract-payments/`

**Module:** Contracts
**Description:** A viewset that provides default `create()`, `retrieve()`, `update()`,
**Authentication:** Token/session authenticated RBAC
**Required permissions:** `contract_payments.create`
**Roles inferred:** admin
**View/action:** `ContractPaymentViewSet.create`

**Query parameters**

| Name | Type | Required | Description |
|---|---|---|---|
| filterset_class | string | no | Uses `ContractPaymentFilter`. |
| ordering | string | no | Allowed: payment_date, amount, created_at |
| page | integer | no | Page number. |
| page_size | integer | no | Page size, max defined by view pagination class. |

**Request/response serializer:** `ContractPaymentCreateSerializer`

**Example request**

```http
POST /api/contract-payments/ HTTP/1.1
Host: 127.0.0.1:8000
Authorization: Token {{token}}
Content-Type: application/json

{}
```

**Example response**

```json
{
  "detail": "Example response shape depends on serializer/custom view. See schema sections below."
}
```

**Possible error responses:** `400` validation error, `401` unauthenticated, `403` permission denied, `404` not found, `405` method not allowed.

**Pagination:** page-number pagination. Paginated responses use `{ count, next, previous, results }` unless the view customizes the shape.

### `DELETE /api/contract-payments/{id}/`

**Module:** Contracts
**Description:** Payments are permanent audit records — disallow deletion.
**Authentication:** Token/session authenticated RBAC
**Required permissions:** `contract_payments.delete`
**Roles inferred:** admin
**View/action:** `ContractPaymentViewSet.destroy`

**Query parameters**

| Name | Type | Required | Description |
|---|---|---|---|
| filterset_class | string | no | Uses `ContractPaymentFilter`. |
| ordering | string | no | Allowed: payment_date, amount, created_at |
| page | integer | no | Page number. |
| page_size | integer | no | Page size, max defined by view pagination class. |

**Request/response serializer:** `ContractPaymentSerializer`

**Example request**

```http
DELETE /api/contract-payments/{id}/ HTTP/1.1
Host: 127.0.0.1:8000
Authorization: Token {{token}}
```

**Example response**

```json
{
  "detail": "Example response shape depends on serializer/custom view. See schema sections below."
}
```

**Possible error responses:** `400` validation error, `401` unauthenticated, `403` permission denied, `404` not found, `405` method not allowed.

**Pagination:** page-number pagination. Paginated responses use `{ count, next, previous, results }` unless the view customizes the shape.

### `GET /api/contract-payments/{id}/`

**Module:** Contracts
**Description:** A viewset that provides default `create()`, `retrieve()`, `update()`,
**Authentication:** Token/session authenticated RBAC
**Required permissions:** `contract_payments.view, contract_payments.view_assigned`
**Roles inferred:** admin
**View/action:** `ContractPaymentViewSet.retrieve`

**Query parameters**

| Name | Type | Required | Description |
|---|---|---|---|
| filterset_class | string | no | Uses `ContractPaymentFilter`. |
| ordering | string | no | Allowed: payment_date, amount, created_at |
| page | integer | no | Page number. |
| page_size | integer | no | Page size, max defined by view pagination class. |

**Request/response serializer:** `ContractPaymentSerializer`

**Example request**

```http
GET /api/contract-payments/{id}/ HTTP/1.1
Host: 127.0.0.1:8000
Authorization: Token {{token}}
```

**Example response**

```json
{
  "detail": "Example response shape depends on serializer/custom view. See schema sections below."
}
```

**Possible error responses:** `400` validation error, `401` unauthenticated, `403` permission denied, `404` not found, `405` method not allowed.

**Pagination:** page-number pagination. Paginated responses use `{ count, next, previous, results }` unless the view customizes the shape.

### `PATCH /api/contract-payments/{id}/`

**Module:** Contracts
**Description:** A viewset that provides default `create()`, `retrieve()`, `update()`,
**Authentication:** Token/session authenticated RBAC
**Required permissions:** `contract_payments.update, contract_payments.update_own`
**Roles inferred:** admin
**View/action:** `ContractPaymentViewSet.partial_update`

**Query parameters**

| Name | Type | Required | Description |
|---|---|---|---|
| filterset_class | string | no | Uses `ContractPaymentFilter`. |
| ordering | string | no | Allowed: payment_date, amount, created_at |
| page | integer | no | Page number. |
| page_size | integer | no | Page size, max defined by view pagination class. |

**Request/response serializer:** `ContractPaymentCreateSerializer`

**Example request**

```http
PATCH /api/contract-payments/{id}/ HTTP/1.1
Host: 127.0.0.1:8000
Authorization: Token {{token}}
Content-Type: application/json

{}
```

**Example response**

```json
{
  "detail": "Example response shape depends on serializer/custom view. See schema sections below."
}
```

**Possible error responses:** `400` validation error, `401` unauthenticated, `403` permission denied, `404` not found, `405` method not allowed.

**Pagination:** page-number pagination. Paginated responses use `{ count, next, previous, results }` unless the view customizes the shape.

### `PUT /api/contract-payments/{id}/`

**Module:** Contracts
**Description:** A viewset that provides default `create()`, `retrieve()`, `update()`,
**Authentication:** Token/session authenticated RBAC
**Required permissions:** `contract_payments.update, contract_payments.update_own`
**Roles inferred:** admin
**View/action:** `ContractPaymentViewSet.update`

**Query parameters**

| Name | Type | Required | Description |
|---|---|---|---|
| filterset_class | string | no | Uses `ContractPaymentFilter`. |
| ordering | string | no | Allowed: payment_date, amount, created_at |
| page | integer | no | Page number. |
| page_size | integer | no | Page size, max defined by view pagination class. |

**Request/response serializer:** `ContractPaymentCreateSerializer`

**Example request**

```http
PUT /api/contract-payments/{id}/ HTTP/1.1
Host: 127.0.0.1:8000
Authorization: Token {{token}}
Content-Type: application/json

{}
```

**Example response**

```json
{
  "detail": "Example response shape depends on serializer/custom view. See schema sections below."
}
```

**Possible error responses:** `400` validation error, `401` unauthenticated, `403` permission denied, `404` not found, `405` method not allowed.

**Pagination:** page-number pagination. Paginated responses use `{ count, next, previous, results }` unless the view customizes the shape.

### `GET /api/contract-variations/`

**Module:** Contracts
**Description:** A viewset that provides default `create()`, `retrieve()`, `update()`,
**Authentication:** Token/session authenticated RBAC
**Required permissions:** `contract_variations.view, contract_variations.view_assigned`
**Roles inferred:** admin
**View/action:** `ContractVariationViewSet.list`

**Query parameters**

| Name | Type | Required | Description |
|---|---|---|---|
| filterset_class | string | no | Uses `ContractVariationFilter`. |
| ordering | string | no | Allowed: date, amount_change, created_at |
| page | integer | no | Page number. |
| page_size | integer | no | Page size, max defined by view pagination class. |

**Request/response serializer:** `ContractVariationSerializer`

**Example request**

```http
GET /api/contract-variations/ HTTP/1.1
Host: 127.0.0.1:8000
Authorization: Token {{token}}
```

**Example response**

```json
{
  "detail": "Example response shape depends on serializer/custom view. See schema sections below."
}
```

**Possible error responses:** `400` validation error, `401` unauthenticated, `403` permission denied, `404` not found, `405` method not allowed.

**Pagination:** page-number pagination. Paginated responses use `{ count, next, previous, results }` unless the view customizes the shape.

### `POST /api/contract-variations/`

**Module:** Contracts
**Description:** A viewset that provides default `create()`, `retrieve()`, `update()`,
**Authentication:** Token/session authenticated RBAC
**Required permissions:** `contract_variations.create`
**Roles inferred:** admin
**View/action:** `ContractVariationViewSet.create`

**Query parameters**

| Name | Type | Required | Description |
|---|---|---|---|
| filterset_class | string | no | Uses `ContractVariationFilter`. |
| ordering | string | no | Allowed: date, amount_change, created_at |
| page | integer | no | Page number. |
| page_size | integer | no | Page size, max defined by view pagination class. |

**Request/response serializer:** `ContractVariationCreateSerializer`

**Example request**

```http
POST /api/contract-variations/ HTTP/1.1
Host: 127.0.0.1:8000
Authorization: Token {{token}}
Content-Type: application/json

{}
```

**Example response**

```json
{
  "detail": "Example response shape depends on serializer/custom view. See schema sections below."
}
```

**Possible error responses:** `400` validation error, `401` unauthenticated, `403` permission denied, `404` not found, `405` method not allowed.

**Pagination:** page-number pagination. Paginated responses use `{ count, next, previous, results }` unless the view customizes the shape.

### `DELETE /api/contract-variations/{id}/`

**Module:** Contracts
**Description:** A viewset that provides default `create()`, `retrieve()`, `update()`,
**Authentication:** Token/session authenticated RBAC
**Required permissions:** `contract_variations.delete`
**Roles inferred:** admin
**View/action:** `ContractVariationViewSet.destroy`

**Query parameters**

| Name | Type | Required | Description |
|---|---|---|---|
| filterset_class | string | no | Uses `ContractVariationFilter`. |
| ordering | string | no | Allowed: date, amount_change, created_at |
| page | integer | no | Page number. |
| page_size | integer | no | Page size, max defined by view pagination class. |

**Request/response serializer:** `ContractVariationSerializer`

**Example request**

```http
DELETE /api/contract-variations/{id}/ HTTP/1.1
Host: 127.0.0.1:8000
Authorization: Token {{token}}
```

**Example response**

```json
{
  "detail": "Example response shape depends on serializer/custom view. See schema sections below."
}
```

**Possible error responses:** `400` validation error, `401` unauthenticated, `403` permission denied, `404` not found, `405` method not allowed.

**Pagination:** page-number pagination. Paginated responses use `{ count, next, previous, results }` unless the view customizes the shape.

### `GET /api/contract-variations/{id}/`

**Module:** Contracts
**Description:** A viewset that provides default `create()`, `retrieve()`, `update()`,
**Authentication:** Token/session authenticated RBAC
**Required permissions:** `contract_variations.view, contract_variations.view_assigned`
**Roles inferred:** admin
**View/action:** `ContractVariationViewSet.retrieve`

**Query parameters**

| Name | Type | Required | Description |
|---|---|---|---|
| filterset_class | string | no | Uses `ContractVariationFilter`. |
| ordering | string | no | Allowed: date, amount_change, created_at |
| page | integer | no | Page number. |
| page_size | integer | no | Page size, max defined by view pagination class. |

**Request/response serializer:** `ContractVariationSerializer`

**Example request**

```http
GET /api/contract-variations/{id}/ HTTP/1.1
Host: 127.0.0.1:8000
Authorization: Token {{token}}
```

**Example response**

```json
{
  "detail": "Example response shape depends on serializer/custom view. See schema sections below."
}
```

**Possible error responses:** `400` validation error, `401` unauthenticated, `403` permission denied, `404` not found, `405` method not allowed.

**Pagination:** page-number pagination. Paginated responses use `{ count, next, previous, results }` unless the view customizes the shape.

### `PATCH /api/contract-variations/{id}/`

**Module:** Contracts
**Description:** A viewset that provides default `create()`, `retrieve()`, `update()`,
**Authentication:** Token/session authenticated RBAC
**Required permissions:** `contract_variations.update, contract_variations.update_own`
**Roles inferred:** admin
**View/action:** `ContractVariationViewSet.partial_update`

**Query parameters**

| Name | Type | Required | Description |
|---|---|---|---|
| filterset_class | string | no | Uses `ContractVariationFilter`. |
| ordering | string | no | Allowed: date, amount_change, created_at |
| page | integer | no | Page number. |
| page_size | integer | no | Page size, max defined by view pagination class. |

**Request/response serializer:** `ContractVariationCreateSerializer`

**Example request**

```http
PATCH /api/contract-variations/{id}/ HTTP/1.1
Host: 127.0.0.1:8000
Authorization: Token {{token}}
Content-Type: application/json

{}
```

**Example response**

```json
{
  "detail": "Example response shape depends on serializer/custom view. See schema sections below."
}
```

**Possible error responses:** `400` validation error, `401` unauthenticated, `403` permission denied, `404` not found, `405` method not allowed.

**Pagination:** page-number pagination. Paginated responses use `{ count, next, previous, results }` unless the view customizes the shape.

### `PUT /api/contract-variations/{id}/`

**Module:** Contracts
**Description:** A viewset that provides default `create()`, `retrieve()`, `update()`,
**Authentication:** Token/session authenticated RBAC
**Required permissions:** `contract_variations.update, contract_variations.update_own`
**Roles inferred:** admin
**View/action:** `ContractVariationViewSet.update`

**Query parameters**

| Name | Type | Required | Description |
|---|---|---|---|
| filterset_class | string | no | Uses `ContractVariationFilter`. |
| ordering | string | no | Allowed: date, amount_change, created_at |
| page | integer | no | Page number. |
| page_size | integer | no | Page size, max defined by view pagination class. |

**Request/response serializer:** `ContractVariationCreateSerializer`

**Example request**

```http
PUT /api/contract-variations/{id}/ HTTP/1.1
Host: 127.0.0.1:8000
Authorization: Token {{token}}
Content-Type: application/json

{}
```

**Example response**

```json
{
  "detail": "Example response shape depends on serializer/custom view. See schema sections below."
}
```

**Possible error responses:** `400` validation error, `401` unauthenticated, `403` permission denied, `404` not found, `405` method not allowed.

**Pagination:** page-number pagination. Paginated responses use `{ count, next, previous, results }` unless the view customizes the shape.

### `POST /api/contract-variations/{id}/approve/`

**Module:** Contracts
**Description:** Approve a variation with financial-impact validation.
**Authentication:** Token/session authenticated RBAC
**Required permissions:** `contract_variations.create`
**Roles inferred:** admin
**View/action:** `ContractVariationViewSet.approve`

**Query parameters**

| Name | Type | Required | Description |
|---|---|---|---|
| filterset_class | string | no | Uses `ContractVariationFilter`. |
| ordering | string | no | Allowed: date, amount_change, created_at |
| page | integer | no | Page number. |
| page_size | integer | no | Page size, max defined by view pagination class. |

**Request/response serializer:** `ContractVariationSerializer`

**Example request**

```http
POST /api/contract-variations/{id}/approve/ HTTP/1.1
Host: 127.0.0.1:8000
Authorization: Token {{token}}
Content-Type: application/json

{}
```

**Example response**

```json
{
  "detail": "Example response shape depends on serializer/custom view. See schema sections below."
}
```

**Possible error responses:** `400` validation error, `401` unauthenticated, `403` permission denied, `404` not found, `405` method not allowed.

**Pagination:** page-number pagination. Paginated responses use `{ count, next, previous, results }` unless the view customizes the shape.

### `GET /api/contracts/`

**Module:** Contracts
**Description:** CRUD + nested payments / variations / documents + financial summary.
**Authentication:** Token/session authenticated RBAC
**Required permissions:** `contracts.view, contracts.view_assigned`
**Roles inferred:** admin
**View/action:** `ContractViewSet.list`

**Query parameters**

| Name | Type | Required | Description |
|---|---|---|---|
| filterset_class | string | no | Uses `ContractFilter`. |
| search | string | no | Searches: contract_number, title, scope_of_work, project__name, subcontractor__name |
| ordering | string | no | Allowed: contract_value, start_date, end_date, completion_percentage, created_at |
| page | integer | no | Page number. |
| page_size | integer | no | Page size, max defined by view pagination class. |

**Request/response serializer:** `ContractListSerializer`

**Example request**

```http
GET /api/contracts/ HTTP/1.1
Host: 127.0.0.1:8000
Authorization: Token {{token}}
```

**Example response**

```json
{
  "detail": "Example response shape depends on serializer/custom view. See schema sections below."
}
```

**Possible error responses:** `400` validation error, `401` unauthenticated, `403` permission denied, `404` not found, `405` method not allowed.

**Pagination:** page-number pagination. Paginated responses use `{ count, next, previous, results }` unless the view customizes the shape.

### `POST /api/contracts/`

**Module:** Contracts
**Description:** CRUD + nested payments / variations / documents + financial summary.
**Authentication:** Token/session authenticated RBAC
**Required permissions:** `contracts.create`
**Roles inferred:** admin
**View/action:** `ContractViewSet.create`

**Query parameters**

| Name | Type | Required | Description |
|---|---|---|---|
| filterset_class | string | no | Uses `ContractFilter`. |
| search | string | no | Searches: contract_number, title, scope_of_work, project__name, subcontractor__name |
| ordering | string | no | Allowed: contract_value, start_date, end_date, completion_percentage, created_at |
| page | integer | no | Page number. |
| page_size | integer | no | Page size, max defined by view pagination class. |

**Request/response serializer:** `ContractWriteSerializer`

**Example request**

```http
POST /api/contracts/ HTTP/1.1
Host: 127.0.0.1:8000
Authorization: Token {{token}}
Content-Type: application/json

{}
```

**Example response**

```json
{
  "detail": "Example response shape depends on serializer/custom view. See schema sections below."
}
```

**Possible error responses:** `400` validation error, `401` unauthenticated, `403` permission denied, `404` not found, `405` method not allowed.

**Pagination:** page-number pagination. Paginated responses use `{ count, next, previous, results }` unless the view customizes the shape.

### `DELETE /api/contracts/{id}/`

**Module:** Contracts
**Description:** CRUD + nested payments / variations / documents + financial summary.
**Authentication:** Token/session authenticated RBAC
**Required permissions:** `contracts.delete`
**Roles inferred:** admin
**View/action:** `ContractViewSet.destroy`

**Query parameters**

| Name | Type | Required | Description |
|---|---|---|---|
| filterset_class | string | no | Uses `ContractFilter`. |
| search | string | no | Searches: contract_number, title, scope_of_work, project__name, subcontractor__name |
| ordering | string | no | Allowed: contract_value, start_date, end_date, completion_percentage, created_at |
| page | integer | no | Page number. |
| page_size | integer | no | Page size, max defined by view pagination class. |

**Request/response serializer:** `ContractDetailSerializer`

**Example request**

```http
DELETE /api/contracts/{id}/ HTTP/1.1
Host: 127.0.0.1:8000
Authorization: Token {{token}}
```

**Example response**

```json
{
  "detail": "Example response shape depends on serializer/custom view. See schema sections below."
}
```

**Possible error responses:** `400` validation error, `401` unauthenticated, `403` permission denied, `404` not found, `405` method not allowed.

**Pagination:** page-number pagination. Paginated responses use `{ count, next, previous, results }` unless the view customizes the shape.

### `GET /api/contracts/{id}/`

**Module:** Contracts
**Description:** CRUD + nested payments / variations / documents + financial summary.
**Authentication:** Token/session authenticated RBAC
**Required permissions:** `contracts.view, contracts.view_assigned`
**Roles inferred:** admin
**View/action:** `ContractViewSet.retrieve`

**Query parameters**

| Name | Type | Required | Description |
|---|---|---|---|
| filterset_class | string | no | Uses `ContractFilter`. |
| search | string | no | Searches: contract_number, title, scope_of_work, project__name, subcontractor__name |
| ordering | string | no | Allowed: contract_value, start_date, end_date, completion_percentage, created_at |
| page | integer | no | Page number. |
| page_size | integer | no | Page size, max defined by view pagination class. |

**Request/response serializer:** `ContractDetailSerializer`

**Example request**

```http
GET /api/contracts/{id}/ HTTP/1.1
Host: 127.0.0.1:8000
Authorization: Token {{token}}
```

**Example response**

```json
{
  "detail": "Example response shape depends on serializer/custom view. See schema sections below."
}
```

**Possible error responses:** `400` validation error, `401` unauthenticated, `403` permission denied, `404` not found, `405` method not allowed.

**Pagination:** page-number pagination. Paginated responses use `{ count, next, previous, results }` unless the view customizes the shape.

### `PATCH /api/contracts/{id}/`

**Module:** Contracts
**Description:** CRUD + nested payments / variations / documents + financial summary.
**Authentication:** Token/session authenticated RBAC
**Required permissions:** `contracts.update, contracts.update_own`
**Roles inferred:** admin
**View/action:** `ContractViewSet.partial_update`

**Query parameters**

| Name | Type | Required | Description |
|---|---|---|---|
| filterset_class | string | no | Uses `ContractFilter`. |
| search | string | no | Searches: contract_number, title, scope_of_work, project__name, subcontractor__name |
| ordering | string | no | Allowed: contract_value, start_date, end_date, completion_percentage, created_at |
| page | integer | no | Page number. |
| page_size | integer | no | Page size, max defined by view pagination class. |

**Request/response serializer:** `ContractWriteSerializer`

**Example request**

```http
PATCH /api/contracts/{id}/ HTTP/1.1
Host: 127.0.0.1:8000
Authorization: Token {{token}}
Content-Type: application/json

{}
```

**Example response**

```json
{
  "detail": "Example response shape depends on serializer/custom view. See schema sections below."
}
```

**Possible error responses:** `400` validation error, `401` unauthenticated, `403` permission denied, `404` not found, `405` method not allowed.

**Pagination:** page-number pagination. Paginated responses use `{ count, next, previous, results }` unless the view customizes the shape.

### `PUT /api/contracts/{id}/`

**Module:** Contracts
**Description:** CRUD + nested payments / variations / documents + financial summary.
**Authentication:** Token/session authenticated RBAC
**Required permissions:** `contracts.update, contracts.update_own`
**Roles inferred:** admin
**View/action:** `ContractViewSet.update`

**Query parameters**

| Name | Type | Required | Description |
|---|---|---|---|
| filterset_class | string | no | Uses `ContractFilter`. |
| search | string | no | Searches: contract_number, title, scope_of_work, project__name, subcontractor__name |
| ordering | string | no | Allowed: contract_value, start_date, end_date, completion_percentage, created_at |
| page | integer | no | Page number. |
| page_size | integer | no | Page size, max defined by view pagination class. |

**Request/response serializer:** `ContractWriteSerializer`

**Example request**

```http
PUT /api/contracts/{id}/ HTTP/1.1
Host: 127.0.0.1:8000
Authorization: Token {{token}}
Content-Type: application/json

{}
```

**Example response**

```json
{
  "detail": "Example response shape depends on serializer/custom view. See schema sections below."
}
```

**Possible error responses:** `400` validation error, `401` unauthenticated, `403` permission denied, `404` not found, `405` method not allowed.

**Pagination:** page-number pagination. Paginated responses use `{ count, next, previous, results }` unless the view customizes the shape.

### `GET /api/contracts/{id}/documents/`

**Module:** Contracts
**Description:** CRUD + nested payments / variations / documents + financial summary.
**Authentication:** Token/session authenticated RBAC
**Required permissions:** `contracts.view, contracts.view_assigned`
**Roles inferred:** admin
**View/action:** `ContractViewSet.documents`

**Query parameters**

| Name | Type | Required | Description |
|---|---|---|---|
| filterset_class | string | no | Uses `ContractFilter`. |
| search | string | no | Searches: contract_number, title, scope_of_work, project__name, subcontractor__name |
| ordering | string | no | Allowed: contract_value, start_date, end_date, completion_percentage, created_at |
| page | integer | no | Page number. |
| page_size | integer | no | Page size, max defined by view pagination class. |

**Request/response serializer:** `ContractDetailSerializer`

**Example request**

```http
GET /api/contracts/{id}/documents/ HTTP/1.1
Host: 127.0.0.1:8000
Authorization: Token {{token}}
```

**Example response**

```json
{
  "detail": "Example response shape depends on serializer/custom view. See schema sections below."
}
```

**Possible error responses:** `400` validation error, `401` unauthenticated, `403` permission denied, `404` not found, `405` method not allowed.

**Pagination:** page-number pagination. Paginated responses use `{ count, next, previous, results }` unless the view customizes the shape.

### `POST /api/contracts/{id}/documents/`

**Module:** Contracts
**Description:** CRUD + nested payments / variations / documents + financial summary.
**Authentication:** Token/session authenticated RBAC
**Required permissions:** `contracts.create`
**Roles inferred:** admin
**View/action:** `ContractViewSet.documents`

**Query parameters**

| Name | Type | Required | Description |
|---|---|---|---|
| filterset_class | string | no | Uses `ContractFilter`. |
| search | string | no | Searches: contract_number, title, scope_of_work, project__name, subcontractor__name |
| ordering | string | no | Allowed: contract_value, start_date, end_date, completion_percentage, created_at |
| page | integer | no | Page number. |
| page_size | integer | no | Page size, max defined by view pagination class. |

**Request/response serializer:** `ContractDetailSerializer`

**Example request**

```http
POST /api/contracts/{id}/documents/ HTTP/1.1
Host: 127.0.0.1:8000
Authorization: Token {{token}}
Content-Type: application/json

{}
```

**Example response**

```json
{
  "detail": "Example response shape depends on serializer/custom view. See schema sections below."
}
```

**Possible error responses:** `400` validation error, `401` unauthenticated, `403` permission denied, `404` not found, `405` method not allowed.

**Pagination:** page-number pagination. Paginated responses use `{ count, next, previous, results }` unless the view customizes the shape.

### `GET /api/contracts/{id}/financial_summary/`

**Module:** Contracts
**Description:** CRUD + nested payments / variations / documents + financial summary.
**Authentication:** Token/session authenticated RBAC
**Required permissions:** `contracts.view, contracts.view_assigned`
**Roles inferred:** admin
**View/action:** `ContractViewSet.financial_summary`

**Query parameters**

| Name | Type | Required | Description |
|---|---|---|---|
| filterset_class | string | no | Uses `ContractFilter`. |
| search | string | no | Searches: contract_number, title, scope_of_work, project__name, subcontractor__name |
| ordering | string | no | Allowed: contract_value, start_date, end_date, completion_percentage, created_at |
| page | integer | no | Page number. |
| page_size | integer | no | Page size, max defined by view pagination class. |

**Request/response serializer:** `ContractDetailSerializer`

**Example request**

```http
GET /api/contracts/{id}/financial_summary/ HTTP/1.1
Host: 127.0.0.1:8000
Authorization: Token {{token}}
```

**Example response**

```json
{
  "detail": "Example response shape depends on serializer/custom view. See schema sections below."
}
```

**Possible error responses:** `400` validation error, `401` unauthenticated, `403` permission denied, `404` not found, `405` method not allowed.

**Pagination:** page-number pagination. Paginated responses use `{ count, next, previous, results }` unless the view customizes the shape.

### `GET /api/contracts/{id}/payments/`

**Module:** Contracts
**Description:** CRUD + nested payments / variations / documents + financial summary.
**Authentication:** Token/session authenticated RBAC
**Required permissions:** `contracts.view, contracts.view_assigned`
**Roles inferred:** admin
**View/action:** `ContractViewSet.payments`

**Query parameters**

| Name | Type | Required | Description |
|---|---|---|---|
| filterset_class | string | no | Uses `ContractFilter`. |
| search | string | no | Searches: contract_number, title, scope_of_work, project__name, subcontractor__name |
| ordering | string | no | Allowed: contract_value, start_date, end_date, completion_percentage, created_at |
| page | integer | no | Page number. |
| page_size | integer | no | Page size, max defined by view pagination class. |

**Request/response serializer:** `ContractDetailSerializer`

**Example request**

```http
GET /api/contracts/{id}/payments/ HTTP/1.1
Host: 127.0.0.1:8000
Authorization: Token {{token}}
```

**Example response**

```json
{
  "detail": "Example response shape depends on serializer/custom view. See schema sections below."
}
```

**Possible error responses:** `400` validation error, `401` unauthenticated, `403` permission denied, `404` not found, `405` method not allowed.

**Pagination:** page-number pagination. Paginated responses use `{ count, next, previous, results }` unless the view customizes the shape.

### `POST /api/contracts/{id}/payments/`

**Module:** Contracts
**Description:** CRUD + nested payments / variations / documents + financial summary.
**Authentication:** Token/session authenticated RBAC
**Required permissions:** `contracts.create`
**Roles inferred:** admin
**View/action:** `ContractViewSet.payments`

**Query parameters**

| Name | Type | Required | Description |
|---|---|---|---|
| filterset_class | string | no | Uses `ContractFilter`. |
| search | string | no | Searches: contract_number, title, scope_of_work, project__name, subcontractor__name |
| ordering | string | no | Allowed: contract_value, start_date, end_date, completion_percentage, created_at |
| page | integer | no | Page number. |
| page_size | integer | no | Page size, max defined by view pagination class. |

**Request/response serializer:** `ContractDetailSerializer`

**Example request**

```http
POST /api/contracts/{id}/payments/ HTTP/1.1
Host: 127.0.0.1:8000
Authorization: Token {{token}}
Content-Type: application/json

{}
```

**Example response**

```json
{
  "detail": "Example response shape depends on serializer/custom view. See schema sections below."
}
```

**Possible error responses:** `400` validation error, `401` unauthenticated, `403` permission denied, `404` not found, `405` method not allowed.

**Pagination:** page-number pagination. Paginated responses use `{ count, next, previous, results }` unless the view customizes the shape.

### `GET /api/contracts/{id}/variations/`

**Module:** Contracts
**Description:** CRUD + nested payments / variations / documents + financial summary.
**Authentication:** Token/session authenticated RBAC
**Required permissions:** `contracts.view, contracts.view_assigned`
**Roles inferred:** admin
**View/action:** `ContractViewSet.variations`

**Query parameters**

| Name | Type | Required | Description |
|---|---|---|---|
| filterset_class | string | no | Uses `ContractFilter`. |
| search | string | no | Searches: contract_number, title, scope_of_work, project__name, subcontractor__name |
| ordering | string | no | Allowed: contract_value, start_date, end_date, completion_percentage, created_at |
| page | integer | no | Page number. |
| page_size | integer | no | Page size, max defined by view pagination class. |

**Request/response serializer:** `ContractDetailSerializer`

**Example request**

```http
GET /api/contracts/{id}/variations/ HTTP/1.1
Host: 127.0.0.1:8000
Authorization: Token {{token}}
```

**Example response**

```json
{
  "detail": "Example response shape depends on serializer/custom view. See schema sections below."
}
```

**Possible error responses:** `400` validation error, `401` unauthenticated, `403` permission denied, `404` not found, `405` method not allowed.

**Pagination:** page-number pagination. Paginated responses use `{ count, next, previous, results }` unless the view customizes the shape.

### `POST /api/contracts/{id}/variations/`

**Module:** Contracts
**Description:** CRUD + nested payments / variations / documents + financial summary.
**Authentication:** Token/session authenticated RBAC
**Required permissions:** `contracts.create`
**Roles inferred:** admin
**View/action:** `ContractViewSet.variations`

**Query parameters**

| Name | Type | Required | Description |
|---|---|---|---|
| filterset_class | string | no | Uses `ContractFilter`. |
| search | string | no | Searches: contract_number, title, scope_of_work, project__name, subcontractor__name |
| ordering | string | no | Allowed: contract_value, start_date, end_date, completion_percentage, created_at |
| page | integer | no | Page number. |
| page_size | integer | no | Page size, max defined by view pagination class. |

**Request/response serializer:** `ContractDetailSerializer`

**Example request**

```http
POST /api/contracts/{id}/variations/ HTTP/1.1
Host: 127.0.0.1:8000
Authorization: Token {{token}}
Content-Type: application/json

{}
```

**Example response**

```json
{
  "detail": "Example response shape depends on serializer/custom view. See schema sections below."
}
```

**Possible error responses:** `400` validation error, `401` unauthenticated, `403` permission denied, `404` not found, `405` method not allowed.

**Pagination:** page-number pagination. Paginated responses use `{ count, next, previous, results }` unless the view customizes the shape.

### `GET /api/contracts/export-pdf/`

**Module:** Contracts
**Description:** Intentionally simple parent class for all views. Only implements
**Authentication:** Authenticated
**Required permissions:** `-`
**Roles inferred:** admin, manager, data_entry
**View/action:** `ContractPDFExportView.get`

**Query parameters:** none documented/inferred.

**Request/response schema:** custom response or not declared by serializer.

**Example request**

```http
GET /api/contracts/export-pdf/ HTTP/1.1
Host: 127.0.0.1:8000
Authorization: Token {{token}}
```

**Example response**

```json
{
  "detail": "Example response shape depends on serializer/custom view. See schema sections below."
}
```

**Possible error responses:** `400` validation error, `401` unauthenticated, `403` permission denied, `404` not found, `405` method not allowed.

### `GET /api/contracts/{id}/export-pdf/`

**Module:** Contracts
**Description:** Intentionally simple parent class for all views. Only implements
**Authentication:** Authenticated
**Required permissions:** `-`
**Roles inferred:** admin, manager, data_entry
**View/action:** `ContractDetailPDFView.get`

**Path parameters**

| Name | Type | Required | Description |
|---|---|---|---|
| id | string/integer | yes | Object primary key. |

**Query parameters:** none documented/inferred.

**Request/response schema:** custom response or not declared by serializer.

**Example request**

```http
GET /api/contracts/{id}/export-pdf/ HTTP/1.1
Host: 127.0.0.1:8000
Authorization: Token {{token}}
```

**Example response**

```json
{
  "detail": "Example response shape depends on serializer/custom view. See schema sections below."
}
```

**Possible error responses:** `400` validation error, `401` unauthenticated, `403` permission denied, `404` not found, `405` method not allowed.

### `GET /api/invoice-documents/`

**Module:** Contracts
**Description:** A viewset that provides default `create()`, `retrieve()`, `update()`,
**Authentication:** Token/session authenticated RBAC
**Required permissions:** `invoice_documents.view, invoice_documents.view_assigned`
**Roles inferred:** admin
**View/action:** `ContractInvoiceDocumentViewSet.list`

**Query parameters:** none documented/inferred.

**Request/response serializer:** `ContractInvoiceDocumentSerializer`

**Example request**

```http
GET /api/invoice-documents/ HTTP/1.1
Host: 127.0.0.1:8000
Authorization: Token {{token}}
```

**Example response**

```json
{
  "detail": "Example response shape depends on serializer/custom view. See schema sections below."
}
```

**Possible error responses:** `400` validation error, `401` unauthenticated, `403` permission denied, `404` not found, `405` method not allowed.

### `POST /api/invoice-documents/`

**Module:** Contracts
**Description:** A viewset that provides default `create()`, `retrieve()`, `update()`,
**Authentication:** Token/session authenticated RBAC
**Required permissions:** `invoice_documents.create`
**Roles inferred:** admin
**View/action:** `ContractInvoiceDocumentViewSet.create`

**Query parameters:** none documented/inferred.

**Request/response serializer:** `ContractInvoiceDocumentCreateSerializer`

**Example request**

```http
POST /api/invoice-documents/ HTTP/1.1
Host: 127.0.0.1:8000
Authorization: Token {{token}}
Content-Type: application/json

{}
```

**Example response**

```json
{
  "detail": "Example response shape depends on serializer/custom view. See schema sections below."
}
```

**Possible error responses:** `400` validation error, `401` unauthenticated, `403` permission denied, `404` not found, `405` method not allowed.

### `DELETE /api/invoice-documents/{id}/`

**Module:** Contracts
**Description:** A viewset that provides default `create()`, `retrieve()`, `update()`,
**Authentication:** Token/session authenticated RBAC
**Required permissions:** `invoice_documents.delete`
**Roles inferred:** admin
**View/action:** `ContractInvoiceDocumentViewSet.destroy`

**Query parameters:** none documented/inferred.

**Request/response serializer:** `ContractInvoiceDocumentSerializer`

**Example request**

```http
DELETE /api/invoice-documents/{id}/ HTTP/1.1
Host: 127.0.0.1:8000
Authorization: Token {{token}}
```

**Example response**

```json
{
  "detail": "Example response shape depends on serializer/custom view. See schema sections below."
}
```

**Possible error responses:** `400` validation error, `401` unauthenticated, `403` permission denied, `404` not found, `405` method not allowed.

### `GET /api/invoice-documents/{id}/`

**Module:** Contracts
**Description:** A viewset that provides default `create()`, `retrieve()`, `update()`,
**Authentication:** Token/session authenticated RBAC
**Required permissions:** `invoice_documents.view, invoice_documents.view_assigned`
**Roles inferred:** admin
**View/action:** `ContractInvoiceDocumentViewSet.retrieve`

**Query parameters:** none documented/inferred.

**Request/response serializer:** `ContractInvoiceDocumentSerializer`

**Example request**

```http
GET /api/invoice-documents/{id}/ HTTP/1.1
Host: 127.0.0.1:8000
Authorization: Token {{token}}
```

**Example response**

```json
{
  "detail": "Example response shape depends on serializer/custom view. See schema sections below."
}
```

**Possible error responses:** `400` validation error, `401` unauthenticated, `403` permission denied, `404` not found, `405` method not allowed.

### `PATCH /api/invoice-documents/{id}/`

**Module:** Contracts
**Description:** A viewset that provides default `create()`, `retrieve()`, `update()`,
**Authentication:** Token/session authenticated RBAC
**Required permissions:** `invoice_documents.update, invoice_documents.update_own`
**Roles inferred:** admin
**View/action:** `ContractInvoiceDocumentViewSet.partial_update`

**Query parameters:** none documented/inferred.

**Request/response serializer:** `ContractInvoiceDocumentCreateSerializer`

**Example request**

```http
PATCH /api/invoice-documents/{id}/ HTTP/1.1
Host: 127.0.0.1:8000
Authorization: Token {{token}}
Content-Type: application/json

{}
```

**Example response**

```json
{
  "detail": "Example response shape depends on serializer/custom view. See schema sections below."
}
```

**Possible error responses:** `400` validation error, `401` unauthenticated, `403` permission denied, `404` not found, `405` method not allowed.

### `PUT /api/invoice-documents/{id}/`

**Module:** Contracts
**Description:** A viewset that provides default `create()`, `retrieve()`, `update()`,
**Authentication:** Token/session authenticated RBAC
**Required permissions:** `invoice_documents.update, invoice_documents.update_own`
**Roles inferred:** admin
**View/action:** `ContractInvoiceDocumentViewSet.update`

**Query parameters:** none documented/inferred.

**Request/response serializer:** `ContractInvoiceDocumentCreateSerializer`

**Example request**

```http
PUT /api/invoice-documents/{id}/ HTTP/1.1
Host: 127.0.0.1:8000
Authorization: Token {{token}}
Content-Type: application/json

{}
```

**Example response**

```json
{
  "detail": "Example response shape depends on serializer/custom view. See schema sections below."
}
```

**Possible error responses:** `400` validation error, `401` unauthenticated, `403` permission denied, `404` not found, `405` method not allowed.

### `GET /api/invoices/`

**Module:** Contracts
**Description:** A viewset that provides default `create()`, `retrieve()`, `update()`,
**Authentication:** Token/session authenticated RBAC
**Required permissions:** `contract_invoices.view, contract_invoices.view_assigned`
**Roles inferred:** admin
**View/action:** `ContractInvoiceViewSet.list`

**Query parameters**

| Name | Type | Required | Description |
|---|---|---|---|
| contract | string | no | Filter `contract` with lookup `exact`. |
| status | string | no | Filter `status` with lookup `exact`. |
| search | string | no | Searches: invoice_number, contract__contract_number, contract__title, contract__subcontractor__name |
| ordering | string | no | Allowed: invoice_date, amount, created_at |

**Request/response serializer:** `ContractInvoiceSerializer`

**Example request**

```http
GET /api/invoices/ HTTP/1.1
Host: 127.0.0.1:8000
Authorization: Token {{token}}
```

**Example response**

```json
{
  "detail": "Example response shape depends on serializer/custom view. See schema sections below."
}
```

**Possible error responses:** `400` validation error, `401` unauthenticated, `403` permission denied, `404` not found, `405` method not allowed.

### `POST /api/invoices/`

**Module:** Contracts
**Description:** A viewset that provides default `create()`, `retrieve()`, `update()`,
**Authentication:** Token/session authenticated RBAC
**Required permissions:** `contract_invoices.create`
**Roles inferred:** admin
**View/action:** `ContractInvoiceViewSet.create`

**Query parameters**

| Name | Type | Required | Description |
|---|---|---|---|
| contract | string | no | Filter `contract` with lookup `exact`. |
| status | string | no | Filter `status` with lookup `exact`. |
| search | string | no | Searches: invoice_number, contract__contract_number, contract__title, contract__subcontractor__name |
| ordering | string | no | Allowed: invoice_date, amount, created_at |

**Request/response serializer:** `ContractInvoiceSerializer`

**Example request**

```http
POST /api/invoices/ HTTP/1.1
Host: 127.0.0.1:8000
Authorization: Token {{token}}
Content-Type: application/json

{}
```

**Example response**

```json
{
  "detail": "Example response shape depends on serializer/custom view. See schema sections below."
}
```

**Possible error responses:** `400` validation error, `401` unauthenticated, `403` permission denied, `404` not found, `405` method not allowed.

### `DELETE /api/invoices/{id}/`

**Module:** Contracts
**Description:** A viewset that provides default `create()`, `retrieve()`, `update()`,
**Authentication:** Token/session authenticated RBAC
**Required permissions:** `contract_invoices.delete`
**Roles inferred:** admin
**View/action:** `ContractInvoiceViewSet.destroy`

**Query parameters**

| Name | Type | Required | Description |
|---|---|---|---|
| contract | string | no | Filter `contract` with lookup `exact`. |
| status | string | no | Filter `status` with lookup `exact`. |
| search | string | no | Searches: invoice_number, contract__contract_number, contract__title, contract__subcontractor__name |
| ordering | string | no | Allowed: invoice_date, amount, created_at |

**Request/response serializer:** `ContractInvoiceSerializer`

**Example request**

```http
DELETE /api/invoices/{id}/ HTTP/1.1
Host: 127.0.0.1:8000
Authorization: Token {{token}}
```

**Example response**

```json
{
  "detail": "Example response shape depends on serializer/custom view. See schema sections below."
}
```

**Possible error responses:** `400` validation error, `401` unauthenticated, `403` permission denied, `404` not found, `405` method not allowed.

### `GET /api/invoices/{id}/`

**Module:** Contracts
**Description:** A viewset that provides default `create()`, `retrieve()`, `update()`,
**Authentication:** Token/session authenticated RBAC
**Required permissions:** `contract_invoices.view, contract_invoices.view_assigned`
**Roles inferred:** admin
**View/action:** `ContractInvoiceViewSet.retrieve`

**Query parameters**

| Name | Type | Required | Description |
|---|---|---|---|
| contract | string | no | Filter `contract` with lookup `exact`. |
| status | string | no | Filter `status` with lookup `exact`. |
| search | string | no | Searches: invoice_number, contract__contract_number, contract__title, contract__subcontractor__name |
| ordering | string | no | Allowed: invoice_date, amount, created_at |

**Request/response serializer:** `ContractInvoiceDetailsSerializer`

**Example request**

```http
GET /api/invoices/{id}/ HTTP/1.1
Host: 127.0.0.1:8000
Authorization: Token {{token}}
```

**Example response**

```json
{
  "detail": "Example response shape depends on serializer/custom view. See schema sections below."
}
```

**Possible error responses:** `400` validation error, `401` unauthenticated, `403` permission denied, `404` not found, `405` method not allowed.

### `PATCH /api/invoices/{id}/`

**Module:** Contracts
**Description:** A viewset that provides default `create()`, `retrieve()`, `update()`,
**Authentication:** Token/session authenticated RBAC
**Required permissions:** `contract_invoices.update, contract_invoices.update_own`
**Roles inferred:** admin
**View/action:** `ContractInvoiceViewSet.partial_update`

**Query parameters**

| Name | Type | Required | Description |
|---|---|---|---|
| contract | string | no | Filter `contract` with lookup `exact`. |
| status | string | no | Filter `status` with lookup `exact`. |
| search | string | no | Searches: invoice_number, contract__contract_number, contract__title, contract__subcontractor__name |
| ordering | string | no | Allowed: invoice_date, amount, created_at |

**Request/response serializer:** `ContractInvoiceSerializer`

**Example request**

```http
PATCH /api/invoices/{id}/ HTTP/1.1
Host: 127.0.0.1:8000
Authorization: Token {{token}}
Content-Type: application/json

{}
```

**Example response**

```json
{
  "detail": "Example response shape depends on serializer/custom view. See schema sections below."
}
```

**Possible error responses:** `400` validation error, `401` unauthenticated, `403` permission denied, `404` not found, `405` method not allowed.

### `PUT /api/invoices/{id}/`

**Module:** Contracts
**Description:** A viewset that provides default `create()`, `retrieve()`, `update()`,
**Authentication:** Token/session authenticated RBAC
**Required permissions:** `contract_invoices.update, contract_invoices.update_own`
**Roles inferred:** admin
**View/action:** `ContractInvoiceViewSet.update`

**Query parameters**

| Name | Type | Required | Description |
|---|---|---|---|
| contract | string | no | Filter `contract` with lookup `exact`. |
| status | string | no | Filter `status` with lookup `exact`. |
| search | string | no | Searches: invoice_number, contract__contract_number, contract__title, contract__subcontractor__name |
| ordering | string | no | Allowed: invoice_date, amount, created_at |

**Request/response serializer:** `ContractInvoiceSerializer`

**Example request**

```http
PUT /api/invoices/{id}/ HTTP/1.1
Host: 127.0.0.1:8000
Authorization: Token {{token}}
Content-Type: application/json

{}
```

**Example response**

```json
{
  "detail": "Example response shape depends on serializer/custom view. See schema sections below."
}
```

**Possible error responses:** `400` validation error, `401` unauthenticated, `403` permission denied, `404` not found, `405` method not allowed.

### `GET /api/dashboard/`

**Module:** Dashboard
**Description:** GET /api/dashboard/
**Authentication:** Token/session authenticated RBAC
**Required permissions:** `dashboard.view, dashboard.view_assigned`
**Roles inferred:** admin, manager
**View/action:** `FullDashboardView.get`

**Query parameters:** none documented/inferred.

**Request/response schema:** custom response or not declared by serializer.

**Example request**

```http
GET /api/dashboard/ HTTP/1.1
Host: 127.0.0.1:8000
Authorization: Token {{token}}
```

**Example response**

```json
{
  "detail": "Example response shape depends on serializer/custom view. See schema sections below."
}
```

**Possible error responses:** `400` validation error, `401` unauthenticated, `403` permission denied, `404` not found, `405` method not allowed.

### `GET /api/dashboard/activity/`

**Module:** Dashboard
**Description:** GET /api/dashboard/activity/
**Authentication:** Token/session authenticated RBAC
**Required permissions:** `dashboard.view, dashboard.view_assigned`
**Roles inferred:** admin, manager
**View/action:** `RecentActivityView.get`

**Query parameters:** none documented/inferred.

**Request/response schema:** custom response or not declared by serializer.

**Example request**

```http
GET /api/dashboard/activity/ HTTP/1.1
Host: 127.0.0.1:8000
Authorization: Token {{token}}
```

**Example response**

```json
{
  "detail": "Example response shape depends on serializer/custom view. See schema sections below."
}
```

**Possible error responses:** `400` validation error, `401` unauthenticated, `403` permission denied, `404` not found, `405` method not allowed.

### `GET /api/dashboard/alerts/`

**Module:** Dashboard
**Description:** GET /api/dashboard/alerts/
**Authentication:** Token/session authenticated RBAC
**Required permissions:** `dashboard.view, dashboard.view_assigned`
**Roles inferred:** admin, manager
**View/action:** `AlertsView.get`

**Query parameters:** none documented/inferred.

**Request/response schema:** custom response or not declared by serializer.

**Example request**

```http
GET /api/dashboard/alerts/ HTTP/1.1
Host: 127.0.0.1:8000
Authorization: Token {{token}}
```

**Example response**

```json
{
  "detail": "Example response shape depends on serializer/custom view. See schema sections below."
}
```

**Possible error responses:** `400` validation error, `401` unauthenticated, `403` permission denied, `404` not found, `405` method not allowed.

### `GET /api/dashboard/attendance/`

**Module:** Dashboard
**Description:** GET /api/dashboard/attendance/
**Authentication:** Token/session authenticated RBAC
**Required permissions:** `dashboard.view, dashboard.view_assigned`
**Roles inferred:** admin, manager
**View/action:** `AttendanceSummaryView.get`

**Query parameters:** none documented/inferred.

**Request/response schema:** custom response or not declared by serializer.

**Example request**

```http
GET /api/dashboard/attendance/ HTTP/1.1
Host: 127.0.0.1:8000
Authorization: Token {{token}}
```

**Example response**

```json
{
  "detail": "Example response shape depends on serializer/custom view. See schema sections below."
}
```

**Possible error responses:** `400` validation error, `401` unauthenticated, `403` permission denied, `404` not found, `405` method not allowed.

### `GET /api/dashboard/budget-comparison/`

**Module:** Dashboard
**Description:** GET /api/dashboard/budget-comparison/
**Authentication:** Token/session authenticated RBAC
**Required permissions:** `dashboard.view, dashboard.view_assigned`
**Roles inferred:** admin, manager
**View/action:** `BudgetComparisonView.get`

**Query parameters:** none documented/inferred.

**Request/response schema:** custom response or not declared by serializer.

**Example request**

```http
GET /api/dashboard/budget-comparison/ HTTP/1.1
Host: 127.0.0.1:8000
Authorization: Token {{token}}
```

**Example response**

```json
{
  "detail": "Example response shape depends on serializer/custom view. See schema sections below."
}
```

**Possible error responses:** `400` validation error, `401` unauthenticated, `403` permission denied, `404` not found, `405` method not allowed.

### `GET /api/dashboard/contracts/`

**Module:** Dashboard
**Description:** GET /api/dashboard/contracts/
**Authentication:** Token/session authenticated RBAC
**Required permissions:** `dashboard.view, dashboard.view_assigned`
**Roles inferred:** admin, manager
**View/action:** `ContractSummaryView.get`

**Query parameters:** none documented/inferred.

**Request/response schema:** custom response or not declared by serializer.

**Example request**

```http
GET /api/dashboard/contracts/ HTTP/1.1
Host: 127.0.0.1:8000
Authorization: Token {{token}}
```

**Example response**

```json
{
  "detail": "Example response shape depends on serializer/custom view. See schema sections below."
}
```

**Possible error responses:** `400` validation error, `401` unauthenticated, `403` permission denied, `404` not found, `405` method not allowed.

### `GET /api/dashboard/expenses/`

**Module:** Dashboard
**Description:** GET /api/dashboard/expenses/
**Authentication:** Token/session authenticated RBAC
**Required permissions:** `dashboard.view, dashboard.view_assigned`
**Roles inferred:** admin, manager
**View/action:** `ExpenseSummaryView.get`

**Query parameters:** none documented/inferred.

**Request/response schema:** custom response or not declared by serializer.

**Example request**

```http
GET /api/dashboard/expenses/ HTTP/1.1
Host: 127.0.0.1:8000
Authorization: Token {{token}}
```

**Example response**

```json
{
  "detail": "Example response shape depends on serializer/custom view. See schema sections below."
}
```

**Possible error responses:** `400` validation error, `401` unauthenticated, `403` permission denied, `404` not found, `405` method not allowed.

### `GET /api/dashboard/expenses/this-month/`

**Module:** Dashboard
**Description:** GET /api/dashboard/expenses/this-month/
**Authentication:** Token/session authenticated RBAC
**Required permissions:** `dashboard.view, dashboard.view_assigned`
**Roles inferred:** admin, manager
**View/action:** `ExpenseThisMonthView.get`

**Query parameters:** none documented/inferred.

**Request/response schema:** custom response or not declared by serializer.

**Example request**

```http
GET /api/dashboard/expenses/this-month/ HTTP/1.1
Host: 127.0.0.1:8000
Authorization: Token {{token}}
```

**Example response**

```json
{
  "detail": "Example response shape depends on serializer/custom view. See schema sections below."
}
```

**Possible error responses:** `400` validation error, `401` unauthenticated, `403` permission denied, `404` not found, `405` method not allowed.

### `GET /api/dashboard/financial/`

**Module:** Dashboard
**Description:** GET /api/dashboard/financial/
**Authentication:** Token/session authenticated RBAC
**Required permissions:** `dashboard.view, dashboard.view_assigned`
**Roles inferred:** admin, manager
**View/action:** `FinancialOverviewView.get`

**Query parameters:** none documented/inferred.

**Request/response schema:** custom response or not declared by serializer.

**Example request**

```http
GET /api/dashboard/financial/ HTTP/1.1
Host: 127.0.0.1:8000
Authorization: Token {{token}}
```

**Example response**

```json
{
  "detail": "Example response shape depends on serializer/custom view. See schema sections below."
}
```

**Possible error responses:** `400` validation error, `401` unauthenticated, `403` permission denied, `404` not found, `405` method not allowed.

### `GET /api/dashboard/payroll/`

**Module:** Dashboard
**Description:** GET /api/dashboard/payroll/
**Authentication:** Token/session authenticated RBAC
**Required permissions:** `dashboard.view, dashboard.view_assigned`
**Roles inferred:** admin, manager
**View/action:** `PayrollSummaryView.get`

**Query parameters:** none documented/inferred.

**Request/response schema:** custom response or not declared by serializer.

**Example request**

```http
GET /api/dashboard/payroll/ HTTP/1.1
Host: 127.0.0.1:8000
Authorization: Token {{token}}
```

**Example response**

```json
{
  "detail": "Example response shape depends on serializer/custom view. See schema sections below."
}
```

**Possible error responses:** `400` validation error, `401` unauthenticated, `403` permission denied, `404` not found, `405` method not allowed.

### `GET /api/dashboard/projects/`

**Module:** Dashboard
**Description:** GET /api/dashboard/projects/
**Authentication:** Token/session authenticated RBAC
**Required permissions:** `dashboard.view, dashboard.view_assigned`
**Roles inferred:** admin, manager
**View/action:** `ProjectOverviewView.get`

**Query parameters:** none documented/inferred.

**Request/response schema:** custom response or not declared by serializer.

**Example request**

```http
GET /api/dashboard/projects/ HTTP/1.1
Host: 127.0.0.1:8000
Authorization: Token {{token}}
```

**Example response**

```json
{
  "detail": "Example response shape depends on serializer/custom view. See schema sections below."
}
```

**Possible error responses:** `400` validation error, `401` unauthenticated, `403` permission denied, `404` not found, `405` method not allowed.

### `GET /api/dashboard/subcontractors/`

**Module:** Dashboard
**Description:** GET /api/dashboard/subcontractors/
**Authentication:** Token/session authenticated RBAC
**Required permissions:** `dashboard.view, dashboard.view_assigned`
**Roles inferred:** admin, manager
**View/action:** `SubcontractorSummaryView.get`

**Query parameters:** none documented/inferred.

**Request/response schema:** custom response or not declared by serializer.

**Example request**

```http
GET /api/dashboard/subcontractors/ HTTP/1.1
Host: 127.0.0.1:8000
Authorization: Token {{token}}
```

**Example response**

```json
{
  "detail": "Example response shape depends on serializer/custom view. See schema sections below."
}
```

**Possible error responses:** `400` validation error, `401` unauthenticated, `403` permission denied, `404` not found, `405` method not allowed.

### `GET /api/dashboard/workforce/`

**Module:** Dashboard
**Description:** GET /api/dashboard/workforce/
**Authentication:** Token/session authenticated RBAC
**Required permissions:** `dashboard.view, dashboard.view_assigned`
**Roles inferred:** admin, manager
**View/action:** `WorkforceSummaryView.get`

**Query parameters:** none documented/inferred.

**Request/response schema:** custom response or not declared by serializer.

**Example request**

```http
GET /api/dashboard/workforce/ HTTP/1.1
Host: 127.0.0.1:8000
Authorization: Token {{token}}
```

**Example response**

```json
{
  "detail": "Example response shape depends on serializer/custom view. See schema sections below."
}
```

**Possible error responses:** `400` validation error, `401` unauthenticated, `403` permission denied, `404` not found, `405` method not allowed.

### `GET /api/employees/`

**Module:** Employees
**Description:** ViewSet for managing Employee CRUD operations.
**Authentication:** Token/session authenticated RBAC
**Required permissions:** `employees.view, employees.view_assigned`
**Roles inferred:** admin, manager
**View/action:** `EmployeeViewSet.list`

**Query parameters:** none documented/inferred.

**Request/response serializer:** `EmployeeListSerializer`

**Example request**

```http
GET /api/employees/ HTTP/1.1
Host: 127.0.0.1:8000
Authorization: Token {{token}}
```

**Example response**

```json
{
  "detail": "Example response shape depends on serializer/custom view. See schema sections below."
}
```

**Possible error responses:** `400` validation error, `401` unauthenticated, `403` permission denied, `404` not found, `405` method not allowed.

### `POST /api/employees/`

**Module:** Employees
**Description:** ViewSet for managing Employee CRUD operations.
**Authentication:** Token/session authenticated RBAC
**Required permissions:** `employees.create`
**Roles inferred:** admin, manager
**View/action:** `EmployeeViewSet.create`

**Query parameters:** none documented/inferred.

**Request/response serializer:** `EmployeeSerializer`

**Example request**

```http
POST /api/employees/ HTTP/1.1
Host: 127.0.0.1:8000
Authorization: Token {{token}}
Content-Type: application/json

{}
```

**Example response**

```json
{
  "detail": "Example response shape depends on serializer/custom view. See schema sections below."
}
```

**Possible error responses:** `400` validation error, `401` unauthenticated, `403` permission denied, `404` not found, `405` method not allowed.

### `DELETE /api/employees/{id}/`

**Module:** Employees
**Description:** ViewSet for managing Employee CRUD operations.
**Authentication:** Token/session authenticated RBAC
**Required permissions:** `employees.delete`
**Roles inferred:** admin
**View/action:** `EmployeeViewSet.destroy`

**Query parameters:** none documented/inferred.

**Request/response serializer:** `EmployeeSerializer`

**Example request**

```http
DELETE /api/employees/{id}/ HTTP/1.1
Host: 127.0.0.1:8000
Authorization: Token {{token}}
```

**Example response**

```json
{
  "detail": "Example response shape depends on serializer/custom view. See schema sections below."
}
```

**Possible error responses:** `400` validation error, `401` unauthenticated, `403` permission denied, `404` not found, `405` method not allowed.

### `GET /api/employees/{id}/`

**Module:** Employees
**Description:** ViewSet for managing Employee CRUD operations.
**Authentication:** Token/session authenticated RBAC
**Required permissions:** `employees.view, employees.view_assigned`
**Roles inferred:** admin, manager
**View/action:** `EmployeeViewSet.retrieve`

**Query parameters:** none documented/inferred.

**Request/response serializer:** `EmployeeSerializer`

**Example request**

```http
GET /api/employees/{id}/ HTTP/1.1
Host: 127.0.0.1:8000
Authorization: Token {{token}}
```

**Example response**

```json
{
  "detail": "Example response shape depends on serializer/custom view. See schema sections below."
}
```

**Possible error responses:** `400` validation error, `401` unauthenticated, `403` permission denied, `404` not found, `405` method not allowed.

### `PATCH /api/employees/{id}/`

**Module:** Employees
**Description:** ViewSet for managing Employee CRUD operations.
**Authentication:** Token/session authenticated RBAC
**Required permissions:** `employees.update, employees.update_own`
**Roles inferred:** admin, manager
**View/action:** `EmployeeViewSet.partial_update`

**Query parameters:** none documented/inferred.

**Request/response serializer:** `EmployeeSerializer`

**Example request**

```http
PATCH /api/employees/{id}/ HTTP/1.1
Host: 127.0.0.1:8000
Authorization: Token {{token}}
Content-Type: application/json

{}
```

**Example response**

```json
{
  "detail": "Example response shape depends on serializer/custom view. See schema sections below."
}
```

**Possible error responses:** `400` validation error, `401` unauthenticated, `403` permission denied, `404` not found, `405` method not allowed.

### `PUT /api/employees/{id}/`

**Module:** Employees
**Description:** ViewSet for managing Employee CRUD operations.
**Authentication:** Token/session authenticated RBAC
**Required permissions:** `employees.update, employees.update_own`
**Roles inferred:** admin, manager
**View/action:** `EmployeeViewSet.update`

**Query parameters:** none documented/inferred.

**Request/response serializer:** `EmployeeSerializer`

**Example request**

```http
PUT /api/employees/{id}/ HTTP/1.1
Host: 127.0.0.1:8000
Authorization: Token {{token}}
Content-Type: application/json

{}
```

**Example response**

```json
{
  "detail": "Example response shape depends on serializer/custom view. See schema sections below."
}
```

**Possible error responses:** `400` validation error, `401` unauthenticated, `403` permission denied, `404` not found, `405` method not allowed.

### `GET /api/employees/{id}/payroll_history/`

**Module:** Employees
**Description:** Get payroll history for a specific employee
**Authentication:** Token/session authenticated RBAC
**Required permissions:** `employees.view, employees.view_assigned`
**Roles inferred:** admin, manager
**View/action:** `EmployeeViewSet.payroll_history`

**Query parameters:** none documented/inferred.

**Request/response serializer:** `EmployeeSerializer`

**Example request**

```http
GET /api/employees/{id}/payroll_history/ HTTP/1.1
Host: 127.0.0.1:8000
Authorization: Token {{token}}
```

**Example response**

```json
{
  "detail": "Example response shape depends on serializer/custom view. See schema sections below."
}
```

**Possible error responses:** `400` validation error, `401` unauthenticated, `403` permission denied, `404` not found, `405` method not allowed.

### `GET /api/employees/{id}/payroll_summary/`

**Module:** Employees
**Description:** Get payroll summary for a specific employee
**Authentication:** Token/session authenticated RBAC
**Required permissions:** `employees.view, employees.view_assigned`
**Roles inferred:** admin, manager
**View/action:** `EmployeeViewSet.payroll_summary`

**Query parameters:** none documented/inferred.

**Request/response serializer:** `EmployeeSerializer`

**Example request**

```http
GET /api/employees/{id}/payroll_summary/ HTTP/1.1
Host: 127.0.0.1:8000
Authorization: Token {{token}}
```

**Example response**

```json
{
  "detail": "Example response shape depends on serializer/custom view. See schema sections below."
}
```

**Possible error responses:** `400` validation error, `401` unauthenticated, `403` permission denied, `404` not found, `405` method not allowed.

### `GET /api/employees/by_department/`

**Module:** Employees
**Description:** Get employees grouped by department
**Authentication:** Token/session authenticated RBAC
**Required permissions:** `employees.view, employees.view_assigned`
**Roles inferred:** admin, manager
**View/action:** `EmployeeViewSet.by_department`

**Query parameters:** none documented/inferred.

**Request/response serializer:** `EmployeeSerializer`

**Example request**

```http
GET /api/employees/by_department/ HTTP/1.1
Host: 127.0.0.1:8000
Authorization: Token {{token}}
```

**Example response**

```json
{
  "detail": "Example response shape depends on serializer/custom view. See schema sections below."
}
```

**Possible error responses:** `400` validation error, `401` unauthenticated, `403` permission denied, `404` not found, `405` method not allowed.

### `GET /api/expenses/`

**Module:** Expenses
**Description:** A viewset that provides default `create()`, `retrieve()`, `update()`,
**Authentication:** Token/session authenticated RBAC
**Required permissions:** `expenses.view, expenses.view_assigned`
**Roles inferred:** admin, data_entry, manager
**View/action:** `ExpenseViewSet.list`

**Query parameters**

| Name | Type | Required | Description |
|---|---|---|---|
| project | string | no | Filter `project` with lookup `exact`. |
| expense_type | string | no | Filter `expense_type` with lookup `exact`. |
| expense_date__gte | string | no | Filter `expense_date` with lookup `gte`. |
| expense_date__lte | string | no | Filter `expense_date` with lookup `lte`. |
| expense_date | string | no | Filter `expense_date` with lookup `exact`. |
| serial_number | string | no | Filter `serial_number` with lookup `exact`. |
| search | string | no | Searches: serial_number, description, remarks, paid_to |
| ordering | string | no | Allowed: expense_date, serial_number, total_usd_calc |
| page | integer | no | Page number. |
| page_size | integer | no | Page size, max defined by view pagination class. |

**Request/response serializer:** `ExpenseSerializer`

**Example request**

```http
GET /api/expenses/ HTTP/1.1
Host: 127.0.0.1:8000
Authorization: Token {{token}}
```

**Example response**

```json
{
  "detail": "Example response shape depends on serializer/custom view. See schema sections below."
}
```

**Possible error responses:** `400` validation error, `401` unauthenticated, `403` permission denied, `404` not found, `405` method not allowed.

**Pagination:** page-number pagination. Paginated responses use `{ count, next, previous, results }` unless the view customizes the shape.

### `POST /api/expenses/`

**Module:** Expenses
**Description:** A viewset that provides default `create()`, `retrieve()`, `update()`,
**Authentication:** Token/session authenticated RBAC
**Required permissions:** `expenses.create`
**Roles inferred:** admin, data_entry, manager
**View/action:** `ExpenseViewSet.create`

**Query parameters**

| Name | Type | Required | Description |
|---|---|---|---|
| project | string | no | Filter `project` with lookup `exact`. |
| expense_type | string | no | Filter `expense_type` with lookup `exact`. |
| expense_date__gte | string | no | Filter `expense_date` with lookup `gte`. |
| expense_date__lte | string | no | Filter `expense_date` with lookup `lte`. |
| expense_date | string | no | Filter `expense_date` with lookup `exact`. |
| serial_number | string | no | Filter `serial_number` with lookup `exact`. |
| search | string | no | Searches: serial_number, description, remarks, paid_to |
| ordering | string | no | Allowed: expense_date, serial_number, total_usd_calc |
| page | integer | no | Page number. |
| page_size | integer | no | Page size, max defined by view pagination class. |

**Request/response serializer:** `ExpenseSerializer`

**Example request**

```http
POST /api/expenses/ HTTP/1.1
Host: 127.0.0.1:8000
Authorization: Token {{token}}
Content-Type: application/json

{}
```

**Example response**

```json
{
  "detail": "Example response shape depends on serializer/custom view. See schema sections below."
}
```

**Possible error responses:** `400` validation error, `401` unauthenticated, `403` permission denied, `404` not found, `405` method not allowed.

**Pagination:** page-number pagination. Paginated responses use `{ count, next, previous, results }` unless the view customizes the shape.

### `DELETE /api/expenses/{id}/`

**Module:** Expenses
**Description:** A viewset that provides default `create()`, `retrieve()`, `update()`,
**Authentication:** Token/session authenticated RBAC
**Required permissions:** `expenses.delete`
**Roles inferred:** admin
**View/action:** `ExpenseViewSet.destroy`

**Query parameters**

| Name | Type | Required | Description |
|---|---|---|---|
| project | string | no | Filter `project` with lookup `exact`. |
| expense_type | string | no | Filter `expense_type` with lookup `exact`. |
| expense_date__gte | string | no | Filter `expense_date` with lookup `gte`. |
| expense_date__lte | string | no | Filter `expense_date` with lookup `lte`. |
| expense_date | string | no | Filter `expense_date` with lookup `exact`. |
| serial_number | string | no | Filter `serial_number` with lookup `exact`. |
| search | string | no | Searches: serial_number, description, remarks, paid_to |
| ordering | string | no | Allowed: expense_date, serial_number, total_usd_calc |
| page | integer | no | Page number. |
| page_size | integer | no | Page size, max defined by view pagination class. |

**Request/response serializer:** `ExpenseSerializer`

**Example request**

```http
DELETE /api/expenses/{id}/ HTTP/1.1
Host: 127.0.0.1:8000
Authorization: Token {{token}}
```

**Example response**

```json
{
  "detail": "Example response shape depends on serializer/custom view. See schema sections below."
}
```

**Possible error responses:** `400` validation error, `401` unauthenticated, `403` permission denied, `404` not found, `405` method not allowed.

**Pagination:** page-number pagination. Paginated responses use `{ count, next, previous, results }` unless the view customizes the shape.

### `GET /api/expenses/{id}/`

**Module:** Expenses
**Description:** A viewset that provides default `create()`, `retrieve()`, `update()`,
**Authentication:** Token/session authenticated RBAC
**Required permissions:** `expenses.view, expenses.view_assigned`
**Roles inferred:** admin, data_entry, manager
**View/action:** `ExpenseViewSet.retrieve`

**Query parameters**

| Name | Type | Required | Description |
|---|---|---|---|
| project | string | no | Filter `project` with lookup `exact`. |
| expense_type | string | no | Filter `expense_type` with lookup `exact`. |
| expense_date__gte | string | no | Filter `expense_date` with lookup `gte`. |
| expense_date__lte | string | no | Filter `expense_date` with lookup `lte`. |
| expense_date | string | no | Filter `expense_date` with lookup `exact`. |
| serial_number | string | no | Filter `serial_number` with lookup `exact`. |
| search | string | no | Searches: serial_number, description, remarks, paid_to |
| ordering | string | no | Allowed: expense_date, serial_number, total_usd_calc |
| page | integer | no | Page number. |
| page_size | integer | no | Page size, max defined by view pagination class. |

**Request/response serializer:** `ExpenseSerializer`

**Example request**

```http
GET /api/expenses/{id}/ HTTP/1.1
Host: 127.0.0.1:8000
Authorization: Token {{token}}
```

**Example response**

```json
{
  "detail": "Example response shape depends on serializer/custom view. See schema sections below."
}
```

**Possible error responses:** `400` validation error, `401` unauthenticated, `403` permission denied, `404` not found, `405` method not allowed.

**Pagination:** page-number pagination. Paginated responses use `{ count, next, previous, results }` unless the view customizes the shape.

### `PATCH /api/expenses/{id}/`

**Module:** Expenses
**Description:** A viewset that provides default `create()`, `retrieve()`, `update()`,
**Authentication:** Token/session authenticated RBAC
**Required permissions:** `expenses.update, expenses.update_own`
**Roles inferred:** admin, manager
**View/action:** `ExpenseViewSet.partial_update`

**Query parameters**

| Name | Type | Required | Description |
|---|---|---|---|
| project | string | no | Filter `project` with lookup `exact`. |
| expense_type | string | no | Filter `expense_type` with lookup `exact`. |
| expense_date__gte | string | no | Filter `expense_date` with lookup `gte`. |
| expense_date__lte | string | no | Filter `expense_date` with lookup `lte`. |
| expense_date | string | no | Filter `expense_date` with lookup `exact`. |
| serial_number | string | no | Filter `serial_number` with lookup `exact`. |
| search | string | no | Searches: serial_number, description, remarks, paid_to |
| ordering | string | no | Allowed: expense_date, serial_number, total_usd_calc |
| page | integer | no | Page number. |
| page_size | integer | no | Page size, max defined by view pagination class. |

**Request/response serializer:** `ExpenseSerializer`

**Example request**

```http
PATCH /api/expenses/{id}/ HTTP/1.1
Host: 127.0.0.1:8000
Authorization: Token {{token}}
Content-Type: application/json

{}
```

**Example response**

```json
{
  "detail": "Example response shape depends on serializer/custom view. See schema sections below."
}
```

**Possible error responses:** `400` validation error, `401` unauthenticated, `403` permission denied, `404` not found, `405` method not allowed.

**Pagination:** page-number pagination. Paginated responses use `{ count, next, previous, results }` unless the view customizes the shape.

### `PUT /api/expenses/{id}/`

**Module:** Expenses
**Description:** A viewset that provides default `create()`, `retrieve()`, `update()`,
**Authentication:** Token/session authenticated RBAC
**Required permissions:** `expenses.update, expenses.update_own`
**Roles inferred:** admin, manager
**View/action:** `ExpenseViewSet.update`

**Query parameters**

| Name | Type | Required | Description |
|---|---|---|---|
| project | string | no | Filter `project` with lookup `exact`. |
| expense_type | string | no | Filter `expense_type` with lookup `exact`. |
| expense_date__gte | string | no | Filter `expense_date` with lookup `gte`. |
| expense_date__lte | string | no | Filter `expense_date` with lookup `lte`. |
| expense_date | string | no | Filter `expense_date` with lookup `exact`. |
| serial_number | string | no | Filter `serial_number` with lookup `exact`. |
| search | string | no | Searches: serial_number, description, remarks, paid_to |
| ordering | string | no | Allowed: expense_date, serial_number, total_usd_calc |
| page | integer | no | Page number. |
| page_size | integer | no | Page size, max defined by view pagination class. |

**Request/response serializer:** `ExpenseSerializer`

**Example request**

```http
PUT /api/expenses/{id}/ HTTP/1.1
Host: 127.0.0.1:8000
Authorization: Token {{token}}
Content-Type: application/json

{}
```

**Example response**

```json
{
  "detail": "Example response shape depends on serializer/custom view. See schema sections below."
}
```

**Possible error responses:** `400` validation error, `401` unauthenticated, `403` permission denied, `404` not found, `405` method not allowed.

**Pagination:** page-number pagination. Paginated responses use `{ count, next, previous, results }` unless the view customizes the shape.

### `GET /api/expenses/export-pdf/`

**Module:** Expenses
**Description:** Intentionally simple parent class for all views. Only implements
**Authentication:** Authenticated
**Required permissions:** `-`
**Roles inferred:** admin, manager, data_entry
**View/action:** `ExpensePDFExportView.get`

**Query parameters:** none documented/inferred.

**Request/response schema:** custom response or not declared by serializer.

**Example request**

```http
GET /api/expenses/export-pdf/ HTTP/1.1
Host: 127.0.0.1:8000
Authorization: Token {{token}}
```

**Example response**

```json
{
  "detail": "Example response shape depends on serializer/custom view. See schema sections below."
}
```

**Possible error responses:** `400` validation error, `401` unauthenticated, `403` permission denied, `404` not found, `405` method not allowed.

### `GET /api/daily-workers/`

**Module:** Inventory / Labour
**Description:** A viewset that provides default `create()`, `retrieve()`, `update()`,
**Authentication:** Token/session authenticated RBAC
**Required permissions:** `daily_workers.view, daily_workers.view_assigned`
**Roles inferred:** admin, data_entry, manager
**View/action:** `DailyWorkerViewSet.list`

**Query parameters:** none documented/inferred.

**Request/response serializer:** `DailyWorkerListSerializer`

**Example request**

```http
GET /api/daily-workers/ HTTP/1.1
Host: 127.0.0.1:8000
Authorization: Token {{token}}
```

**Example response**

```json
{
  "detail": "Example response shape depends on serializer/custom view. See schema sections below."
}
```

**Possible error responses:** `400` validation error, `401` unauthenticated, `403` permission denied, `404` not found, `405` method not allowed.

### `POST /api/daily-workers/`

**Module:** Inventory / Labour
**Description:** A viewset that provides default `create()`, `retrieve()`, `update()`,
**Authentication:** Token/session authenticated RBAC
**Required permissions:** `daily_workers.create`
**Roles inferred:** admin, manager
**View/action:** `DailyWorkerViewSet.create`

**Query parameters:** none documented/inferred.

**Request/response serializer:** `DailyWorkerSerializer`

**Example request**

```http
POST /api/daily-workers/ HTTP/1.1
Host: 127.0.0.1:8000
Authorization: Token {{token}}
Content-Type: application/json

{}
```

**Example response**

```json
{
  "detail": "Example response shape depends on serializer/custom view. See schema sections below."
}
```

**Possible error responses:** `400` validation error, `401` unauthenticated, `403` permission denied, `404` not found, `405` method not allowed.

### `DELETE /api/daily-workers/{id}/`

**Module:** Inventory / Labour
**Description:** A viewset that provides default `create()`, `retrieve()`, `update()`,
**Authentication:** Token/session authenticated RBAC
**Required permissions:** `daily_workers.delete`
**Roles inferred:** admin
**View/action:** `DailyWorkerViewSet.destroy`

**Query parameters:** none documented/inferred.

**Request/response serializer:** `DailyWorkerSerializer`

**Example request**

```http
DELETE /api/daily-workers/{id}/ HTTP/1.1
Host: 127.0.0.1:8000
Authorization: Token {{token}}
```

**Example response**

```json
{
  "detail": "Example response shape depends on serializer/custom view. See schema sections below."
}
```

**Possible error responses:** `400` validation error, `401` unauthenticated, `403` permission denied, `404` not found, `405` method not allowed.

### `GET /api/daily-workers/{id}/`

**Module:** Inventory / Labour
**Description:** A viewset that provides default `create()`, `retrieve()`, `update()`,
**Authentication:** Token/session authenticated RBAC
**Required permissions:** `daily_workers.view, daily_workers.view_assigned`
**Roles inferred:** admin, data_entry, manager
**View/action:** `DailyWorkerViewSet.retrieve`

**Query parameters:** none documented/inferred.

**Request/response serializer:** `DailyWorkerSerializer`

**Example request**

```http
GET /api/daily-workers/{id}/ HTTP/1.1
Host: 127.0.0.1:8000
Authorization: Token {{token}}
```

**Example response**

```json
{
  "detail": "Example response shape depends on serializer/custom view. See schema sections below."
}
```

**Possible error responses:** `400` validation error, `401` unauthenticated, `403` permission denied, `404` not found, `405` method not allowed.

### `PATCH /api/daily-workers/{id}/`

**Module:** Inventory / Labour
**Description:** A viewset that provides default `create()`, `retrieve()`, `update()`,
**Authentication:** Token/session authenticated RBAC
**Required permissions:** `daily_workers.update, daily_workers.update_own`
**Roles inferred:** admin, manager
**View/action:** `DailyWorkerViewSet.partial_update`

**Query parameters:** none documented/inferred.

**Request/response serializer:** `DailyWorkerSerializer`

**Example request**

```http
PATCH /api/daily-workers/{id}/ HTTP/1.1
Host: 127.0.0.1:8000
Authorization: Token {{token}}
Content-Type: application/json

{}
```

**Example response**

```json
{
  "detail": "Example response shape depends on serializer/custom view. See schema sections below."
}
```

**Possible error responses:** `400` validation error, `401` unauthenticated, `403` permission denied, `404` not found, `405` method not allowed.

### `PUT /api/daily-workers/{id}/`

**Module:** Inventory / Labour
**Description:** A viewset that provides default `create()`, `retrieve()`, `update()`,
**Authentication:** Token/session authenticated RBAC
**Required permissions:** `daily_workers.update, daily_workers.update_own`
**Roles inferred:** admin, manager
**View/action:** `DailyWorkerViewSet.update`

**Query parameters:** none documented/inferred.

**Request/response serializer:** `DailyWorkerSerializer`

**Example request**

```http
PUT /api/daily-workers/{id}/ HTTP/1.1
Host: 127.0.0.1:8000
Authorization: Token {{token}}
Content-Type: application/json

{}
```

**Example response**

```json
{
  "detail": "Example response shape depends on serializer/custom view. See schema sections below."
}
```

**Possible error responses:** `400` validation error, `401` unauthenticated, `403` permission denied, `404` not found, `405` method not allowed.

### `GET /api/daily-workers/{id}/detail_summary/`

**Module:** Inventory / Labour
**Description:** A viewset that provides default `create()`, `retrieve()`, `update()`,
**Authentication:** Token/session authenticated RBAC
**Required permissions:** `daily_workers.view, daily_workers.view_assigned`
**Roles inferred:** admin, data_entry, manager
**View/action:** `DailyWorkerViewSet.detail_summary`

**Query parameters:** none documented/inferred.

**Request/response serializer:** `DailyWorkerSerializer`

**Example request**

```http
GET /api/daily-workers/{id}/detail_summary/ HTTP/1.1
Host: 127.0.0.1:8000
Authorization: Token {{token}}
```

**Example response**

```json
{
  "detail": "Example response shape depends on serializer/custom view. See schema sections below."
}
```

**Possible error responses:** `400` validation error, `401` unauthenticated, `403` permission denied, `404` not found, `405` method not allowed.

### `GET /api/employees/payrolls/export-pdf/`

**Module:** Payroll
**Description:** Intentionally simple parent class for all views. Only implements
**Authentication:** Token/session authenticated RBAC
**Required permissions:** `payrolls.view, payrolls.view_assigned`
**Roles inferred:** admin
**View/action:** `PayrollPDFExportView.get`

**Query parameters:** none documented/inferred.

**Request/response schema:** custom response or not declared by serializer.

**Example request**

```http
GET /api/employees/payrolls/export-pdf/ HTTP/1.1
Host: 127.0.0.1:8000
Authorization: Token {{token}}
```

**Example response**

```json
{
  "detail": "Example response shape depends on serializer/custom view. See schema sections below."
}
```

**Possible error responses:** `400` validation error, `401` unauthenticated, `403` permission denied, `404` not found, `405` method not allowed.

### `GET /api/payrolls/`

**Module:** Payroll
**Description:** ViewSet for managing Payroll CRUD operations.
**Authentication:** Token/session authenticated RBAC
**Required permissions:** `payrolls.view, payrolls.view_assigned`
**Roles inferred:** admin
**View/action:** `PayrollViewSet.list`

**Query parameters:** none documented/inferred.

**Request/response serializer:** `PayrollListSerializer`

**Example request**

```http
GET /api/payrolls/ HTTP/1.1
Host: 127.0.0.1:8000
Authorization: Token {{token}}
```

**Example response**

```json
{
  "detail": "Example response shape depends on serializer/custom view. See schema sections below."
}
```

**Possible error responses:** `400` validation error, `401` unauthenticated, `403` permission denied, `404` not found, `405` method not allowed.

### `POST /api/payrolls/`

**Module:** Payroll
**Description:** ViewSet for managing Payroll CRUD operations.
**Authentication:** Token/session authenticated RBAC
**Required permissions:** `payrolls.create`
**Roles inferred:** admin
**View/action:** `PayrollViewSet.create`

**Query parameters:** none documented/inferred.

**Request/response serializer:** `PayrollSerializer`

**Example request**

```http
POST /api/payrolls/ HTTP/1.1
Host: 127.0.0.1:8000
Authorization: Token {{token}}
Content-Type: application/json

{}
```

**Example response**

```json
{
  "detail": "Example response shape depends on serializer/custom view. See schema sections below."
}
```

**Possible error responses:** `400` validation error, `401` unauthenticated, `403` permission denied, `404` not found, `405` method not allowed.

### `DELETE /api/payrolls/{id}/`

**Module:** Payroll
**Description:** ViewSet for managing Payroll CRUD operations.
**Authentication:** Token/session authenticated RBAC
**Required permissions:** `payrolls.delete`
**Roles inferred:** admin
**View/action:** `PayrollViewSet.destroy`

**Query parameters:** none documented/inferred.

**Request/response serializer:** `PayrollSerializer`

**Example request**

```http
DELETE /api/payrolls/{id}/ HTTP/1.1
Host: 127.0.0.1:8000
Authorization: Token {{token}}
```

**Example response**

```json
{
  "detail": "Example response shape depends on serializer/custom view. See schema sections below."
}
```

**Possible error responses:** `400` validation error, `401` unauthenticated, `403` permission denied, `404` not found, `405` method not allowed.

### `GET /api/payrolls/{id}/`

**Module:** Payroll
**Description:** ViewSet for managing Payroll CRUD operations.
**Authentication:** Token/session authenticated RBAC
**Required permissions:** `payrolls.view, payrolls.view_assigned`
**Roles inferred:** admin
**View/action:** `PayrollViewSet.retrieve`

**Query parameters:** none documented/inferred.

**Request/response serializer:** `PayrollSerializer`

**Example request**

```http
GET /api/payrolls/{id}/ HTTP/1.1
Host: 127.0.0.1:8000
Authorization: Token {{token}}
```

**Example response**

```json
{
  "detail": "Example response shape depends on serializer/custom view. See schema sections below."
}
```

**Possible error responses:** `400` validation error, `401` unauthenticated, `403` permission denied, `404` not found, `405` method not allowed.

### `PATCH /api/payrolls/{id}/`

**Module:** Payroll
**Description:** ViewSet for managing Payroll CRUD operations.
**Authentication:** Token/session authenticated RBAC
**Required permissions:** `payrolls.update, payrolls.update_own`
**Roles inferred:** admin
**View/action:** `PayrollViewSet.partial_update`

**Query parameters:** none documented/inferred.

**Request/response serializer:** `PayrollSerializer`

**Example request**

```http
PATCH /api/payrolls/{id}/ HTTP/1.1
Host: 127.0.0.1:8000
Authorization: Token {{token}}
Content-Type: application/json

{}
```

**Example response**

```json
{
  "detail": "Example response shape depends on serializer/custom view. See schema sections below."
}
```

**Possible error responses:** `400` validation error, `401` unauthenticated, `403` permission denied, `404` not found, `405` method not allowed.

### `PUT /api/payrolls/{id}/`

**Module:** Payroll
**Description:** ViewSet for managing Payroll CRUD operations.
**Authentication:** Token/session authenticated RBAC
**Required permissions:** `payrolls.update, payrolls.update_own`
**Roles inferred:** admin
**View/action:** `PayrollViewSet.update`

**Query parameters:** none documented/inferred.

**Request/response serializer:** `PayrollSerializer`

**Example request**

```http
PUT /api/payrolls/{id}/ HTTP/1.1
Host: 127.0.0.1:8000
Authorization: Token {{token}}
Content-Type: application/json

{}
```

**Example response**

```json
{
  "detail": "Example response shape depends on serializer/custom view. See schema sections below."
}
```

**Possible error responses:** `400` validation error, `401` unauthenticated, `403` permission denied, `404` not found, `405` method not allowed.

### `PATCH /api/payrolls/{id}/update_payment_status/`

**Module:** Payroll
**Description:** Update payment status for a specific payroll
**Authentication:** Token/session authenticated RBAC
**Required permissions:** `payrolls.update, payrolls.update_own`
**Roles inferred:** admin
**View/action:** `PayrollViewSet.update_payment_status`

**Query parameters:** none documented/inferred.

**Request/response serializer:** `PayrollSerializer`

**Example request**

```http
PATCH /api/payrolls/{id}/update_payment_status/ HTTP/1.1
Host: 127.0.0.1:8000
Authorization: Token {{token}}
Content-Type: application/json

{}
```

**Example response**

```json
{
  "detail": "Example response shape depends on serializer/custom view. See schema sections below."
}
```

**Possible error responses:** `400` validation error, `401` unauthenticated, `403` permission denied, `404` not found, `405` method not allowed.

### `POST /api/payrolls/bulk_create_payroll/`

**Module:** Payroll
**Description:** Create payroll records for multiple employees at once
**Authentication:** Token/session authenticated RBAC
**Required permissions:** `payrolls.create`
**Roles inferred:** admin
**View/action:** `PayrollViewSet.bulk_create_payroll`

**Query parameters:** none documented/inferred.

**Request/response serializer:** `PayrollBulkCreateSerializer`

**Example request**

```http
POST /api/payrolls/bulk_create_payroll/ HTTP/1.1
Host: 127.0.0.1:8000
Authorization: Token {{token}}
Content-Type: application/json

{}
```

**Example response**

```json
{
  "detail": "Example response shape depends on serializer/custom view. See schema sections below."
}
```

**Possible error responses:** `400` validation error, `401` unauthenticated, `403` permission denied, `404` not found, `405` method not allowed.

### `GET /api/payrolls/monthly_report/`

**Module:** Payroll
**Description:** Generate monthly payroll report
**Authentication:** Token/session authenticated RBAC
**Required permissions:** `payrolls.view, payrolls.view_assigned`
**Roles inferred:** admin
**View/action:** `PayrollViewSet.monthly_report`

**Query parameters:** none documented/inferred.

**Request/response serializer:** `PayrollSerializer`

**Example request**

```http
GET /api/payrolls/monthly_report/ HTTP/1.1
Host: 127.0.0.1:8000
Authorization: Token {{token}}
```

**Example response**

```json
{
  "detail": "Example response shape depends on serializer/custom view. See schema sections below."
}
```

**Possible error responses:** `400` validation error, `401` unauthenticated, `403` permission denied, `404` not found, `405` method not allowed.

### `GET /api/payrolls/summary/`

**Module:** Payroll
**Description:** Get overall payroll summary
**Authentication:** Token/session authenticated RBAC
**Required permissions:** `payrolls.view, payrolls.view_assigned`
**Roles inferred:** admin
**View/action:** `PayrollViewSet.summary`

**Query parameters:** none documented/inferred.

**Request/response serializer:** `PayrollSerializer`

**Example request**

```http
GET /api/payrolls/summary/ HTTP/1.1
Host: 127.0.0.1:8000
Authorization: Token {{token}}
```

**Example response**

```json
{
  "detail": "Example response shape depends on serializer/custom view. See schema sections below."
}
```

**Possible error responses:** `400` validation error, `401` unauthenticated, `403` permission denied, `404` not found, `405` method not allowed.

### `GET /api/worker-advances/`

**Module:** Payroll
**Description:** A viewset that provides default `create()`, `retrieve()`, `update()`,
**Authentication:** Token/session authenticated RBAC
**Required permissions:** `worker_advances.view, worker_advances.view_assigned`
**Roles inferred:** admin, data_entry, manager
**View/action:** `WorkerAdvanceViewSet.list`

**Query parameters:** none documented/inferred.

**Request/response serializer:** `WorkerAdvanceSerializer`

**Example request**

```http
GET /api/worker-advances/ HTTP/1.1
Host: 127.0.0.1:8000
Authorization: Token {{token}}
```

**Example response**

```json
{
  "detail": "Example response shape depends on serializer/custom view. See schema sections below."
}
```

**Possible error responses:** `400` validation error, `401` unauthenticated, `403` permission denied, `404` not found, `405` method not allowed.

### `POST /api/worker-advances/`

**Module:** Payroll
**Description:** A viewset that provides default `create()`, `retrieve()`, `update()`,
**Authentication:** Token/session authenticated RBAC
**Required permissions:** `worker_advances.create`
**Roles inferred:** admin, data_entry, manager
**View/action:** `WorkerAdvanceViewSet.create`

**Query parameters:** none documented/inferred.

**Request/response serializer:** `WorkerAdvanceSerializer`

**Example request**

```http
POST /api/worker-advances/ HTTP/1.1
Host: 127.0.0.1:8000
Authorization: Token {{token}}
Content-Type: application/json

{}
```

**Example response**

```json
{
  "detail": "Example response shape depends on serializer/custom view. See schema sections below."
}
```

**Possible error responses:** `400` validation error, `401` unauthenticated, `403` permission denied, `404` not found, `405` method not allowed.

### `DELETE /api/worker-advances/{id}/`

**Module:** Payroll
**Description:** A viewset that provides default `create()`, `retrieve()`, `update()`,
**Authentication:** Token/session authenticated RBAC
**Required permissions:** `worker_advances.delete`
**Roles inferred:** admin
**View/action:** `WorkerAdvanceViewSet.destroy`

**Query parameters:** none documented/inferred.

**Request/response serializer:** `WorkerAdvanceSerializer`

**Example request**

```http
DELETE /api/worker-advances/{id}/ HTTP/1.1
Host: 127.0.0.1:8000
Authorization: Token {{token}}
```

**Example response**

```json
{
  "detail": "Example response shape depends on serializer/custom view. See schema sections below."
}
```

**Possible error responses:** `400` validation error, `401` unauthenticated, `403` permission denied, `404` not found, `405` method not allowed.

### `GET /api/worker-advances/{id}/`

**Module:** Payroll
**Description:** A viewset that provides default `create()`, `retrieve()`, `update()`,
**Authentication:** Token/session authenticated RBAC
**Required permissions:** `worker_advances.view, worker_advances.view_assigned`
**Roles inferred:** admin, data_entry, manager
**View/action:** `WorkerAdvanceViewSet.retrieve`

**Query parameters:** none documented/inferred.

**Request/response serializer:** `WorkerAdvanceSerializer`

**Example request**

```http
GET /api/worker-advances/{id}/ HTTP/1.1
Host: 127.0.0.1:8000
Authorization: Token {{token}}
```

**Example response**

```json
{
  "detail": "Example response shape depends on serializer/custom view. See schema sections below."
}
```

**Possible error responses:** `400` validation error, `401` unauthenticated, `403` permission denied, `404` not found, `405` method not allowed.

### `PATCH /api/worker-advances/{id}/`

**Module:** Payroll
**Description:** A viewset that provides default `create()`, `retrieve()`, `update()`,
**Authentication:** Token/session authenticated RBAC
**Required permissions:** `worker_advances.update, worker_advances.update_own`
**Roles inferred:** admin, manager
**View/action:** `WorkerAdvanceViewSet.partial_update`

**Query parameters:** none documented/inferred.

**Request/response serializer:** `WorkerAdvanceSerializer`

**Example request**

```http
PATCH /api/worker-advances/{id}/ HTTP/1.1
Host: 127.0.0.1:8000
Authorization: Token {{token}}
Content-Type: application/json

{}
```

**Example response**

```json
{
  "detail": "Example response shape depends on serializer/custom view. See schema sections below."
}
```

**Possible error responses:** `400` validation error, `401` unauthenticated, `403` permission denied, `404` not found, `405` method not allowed.

### `PUT /api/worker-advances/{id}/`

**Module:** Payroll
**Description:** A viewset that provides default `create()`, `retrieve()`, `update()`,
**Authentication:** Token/session authenticated RBAC
**Required permissions:** `worker_advances.update, worker_advances.update_own`
**Roles inferred:** admin, manager
**View/action:** `WorkerAdvanceViewSet.update`

**Query parameters:** none documented/inferred.

**Request/response serializer:** `WorkerAdvanceSerializer`

**Example request**

```http
PUT /api/worker-advances/{id}/ HTTP/1.1
Host: 127.0.0.1:8000
Authorization: Token {{token}}
Content-Type: application/json

{}
```

**Example response**

```json
{
  "detail": "Example response shape depends on serializer/custom view. See schema sections below."
}
```

**Possible error responses:** `400` validation error, `401` unauthenticated, `403` permission denied, `404` not found, `405` method not allowed.

### `GET /api/worker-payroll/`

**Module:** Payroll
**Description:** A viewset that provides default `create()`, `retrieve()`, `update()`,
**Authentication:** Token/session authenticated RBAC
**Required permissions:** `daily_worker_payroll.view, daily_worker_payroll.view_assigned`
**Roles inferred:** admin, manager
**View/action:** `WorkerPayrollViewSet.list`

**Query parameters:** none documented/inferred.

**Request/response serializer:** `WorkerPayrollSerializer`

**Example request**

```http
GET /api/worker-payroll/ HTTP/1.1
Host: 127.0.0.1:8000
Authorization: Token {{token}}
```

**Example response**

```json
{
  "detail": "Example response shape depends on serializer/custom view. See schema sections below."
}
```

**Possible error responses:** `400` validation error, `401` unauthenticated, `403` permission denied, `404` not found, `405` method not allowed.

### `POST /api/worker-payroll/`

**Module:** Payroll
**Description:** A viewset that provides default `create()`, `retrieve()`, `update()`,
**Authentication:** Token/session authenticated RBAC
**Required permissions:** `daily_worker_payroll.create`
**Roles inferred:** admin, manager
**View/action:** `WorkerPayrollViewSet.create`

**Query parameters:** none documented/inferred.

**Request/response serializer:** `WorkerPayrollSerializer`

**Example request**

```http
POST /api/worker-payroll/ HTTP/1.1
Host: 127.0.0.1:8000
Authorization: Token {{token}}
Content-Type: application/json

{}
```

**Example response**

```json
{
  "detail": "Example response shape depends on serializer/custom view. See schema sections below."
}
```

**Possible error responses:** `400` validation error, `401` unauthenticated, `403` permission denied, `404` not found, `405` method not allowed.

### `DELETE /api/worker-payroll/{id}/`

**Module:** Payroll
**Description:** A viewset that provides default `create()`, `retrieve()`, `update()`,
**Authentication:** Token/session authenticated RBAC
**Required permissions:** `daily_worker_payroll.delete`
**Roles inferred:** admin
**View/action:** `WorkerPayrollViewSet.destroy`

**Query parameters:** none documented/inferred.

**Request/response serializer:** `WorkerPayrollSerializer`

**Example request**

```http
DELETE /api/worker-payroll/{id}/ HTTP/1.1
Host: 127.0.0.1:8000
Authorization: Token {{token}}
```

**Example response**

```json
{
  "detail": "Example response shape depends on serializer/custom view. See schema sections below."
}
```

**Possible error responses:** `400` validation error, `401` unauthenticated, `403` permission denied, `404` not found, `405` method not allowed.

### `GET /api/worker-payroll/{id}/`

**Module:** Payroll
**Description:** A viewset that provides default `create()`, `retrieve()`, `update()`,
**Authentication:** Token/session authenticated RBAC
**Required permissions:** `daily_worker_payroll.view, daily_worker_payroll.view_assigned`
**Roles inferred:** admin, manager
**View/action:** `WorkerPayrollViewSet.retrieve`

**Query parameters:** none documented/inferred.

**Request/response serializer:** `WorkerPayrollSerializer`

**Example request**

```http
GET /api/worker-payroll/{id}/ HTTP/1.1
Host: 127.0.0.1:8000
Authorization: Token {{token}}
```

**Example response**

```json
{
  "detail": "Example response shape depends on serializer/custom view. See schema sections below."
}
```

**Possible error responses:** `400` validation error, `401` unauthenticated, `403` permission denied, `404` not found, `405` method not allowed.

### `PATCH /api/worker-payroll/{id}/`

**Module:** Payroll
**Description:** A viewset that provides default `create()`, `retrieve()`, `update()`,
**Authentication:** Token/session authenticated RBAC
**Required permissions:** `daily_worker_payroll.update, daily_worker_payroll.update_own`
**Roles inferred:** admin, manager
**View/action:** `WorkerPayrollViewSet.partial_update`

**Query parameters:** none documented/inferred.

**Request/response serializer:** `WorkerPayrollSerializer`

**Example request**

```http
PATCH /api/worker-payroll/{id}/ HTTP/1.1
Host: 127.0.0.1:8000
Authorization: Token {{token}}
Content-Type: application/json

{}
```

**Example response**

```json
{
  "detail": "Example response shape depends on serializer/custom view. See schema sections below."
}
```

**Possible error responses:** `400` validation error, `401` unauthenticated, `403` permission denied, `404` not found, `405` method not allowed.

### `PUT /api/worker-payroll/{id}/`

**Module:** Payroll
**Description:** A viewset that provides default `create()`, `retrieve()`, `update()`,
**Authentication:** Token/session authenticated RBAC
**Required permissions:** `daily_worker_payroll.update, daily_worker_payroll.update_own`
**Roles inferred:** admin, manager
**View/action:** `WorkerPayrollViewSet.update`

**Query parameters:** none documented/inferred.

**Request/response serializer:** `WorkerPayrollSerializer`

**Example request**

```http
PUT /api/worker-payroll/{id}/ HTTP/1.1
Host: 127.0.0.1:8000
Authorization: Token {{token}}
Content-Type: application/json

{}
```

**Example response**

```json
{
  "detail": "Example response shape depends on serializer/custom view. See schema sections below."
}
```

**Possible error responses:** `400` validation error, `401` unauthenticated, `403` permission denied, `404` not found, `405` method not allowed.

### `PATCH /api/worker-payroll/{id}/approve/`

**Module:** Payroll
**Description:** A viewset that provides default `create()`, `retrieve()`, `update()`,
**Authentication:** Token/session authenticated RBAC
**Required permissions:** `daily_worker_payroll.update, daily_worker_payroll.update_own`
**Roles inferred:** admin, manager
**View/action:** `WorkerPayrollViewSet.approve`

**Query parameters:** none documented/inferred.

**Request/response serializer:** `WorkerPayrollSerializer`

**Example request**

```http
PATCH /api/worker-payroll/{id}/approve/ HTTP/1.1
Host: 127.0.0.1:8000
Authorization: Token {{token}}
Content-Type: application/json

{}
```

**Example response**

```json
{
  "detail": "Example response shape depends on serializer/custom view. See schema sections below."
}
```

**Possible error responses:** `400` validation error, `401` unauthenticated, `403` permission denied, `404` not found, `405` method not allowed.

### `PATCH /api/worker-payroll/{id}/mark_paid/`

**Module:** Payroll
**Description:** A viewset that provides default `create()`, `retrieve()`, `update()`,
**Authentication:** Token/session authenticated RBAC
**Required permissions:** `daily_worker_payroll.update, daily_worker_payroll.update_own`
**Roles inferred:** admin, manager
**View/action:** `WorkerPayrollViewSet.mark_paid`

**Query parameters:** none documented/inferred.

**Request/response serializer:** `WorkerPayrollSerializer`

**Example request**

```http
PATCH /api/worker-payroll/{id}/mark_paid/ HTTP/1.1
Host: 127.0.0.1:8000
Authorization: Token {{token}}
Content-Type: application/json

{}
```

**Example response**

```json
{
  "detail": "Example response shape depends on serializer/custom view. See schema sections below."
}
```

**Possible error responses:** `400` validation error, `401` unauthenticated, `403` permission denied, `404` not found, `405` method not allowed.

### `POST /api/worker-payroll/generate/`

**Module:** Payroll
**Description:** A viewset that provides default `create()`, `retrieve()`, `update()`,
**Authentication:** Token/session authenticated RBAC
**Required permissions:** `daily_worker_payroll.create`
**Roles inferred:** admin, manager
**View/action:** `WorkerPayrollViewSet.generate`

**Query parameters:** none documented/inferred.

**Request/response serializer:** `WorkerPayrollSerializer`

**Example request**

```http
POST /api/worker-payroll/generate/ HTTP/1.1
Host: 127.0.0.1:8000
Authorization: Token {{token}}
Content-Type: application/json

{}
```

**Example response**

```json
{
  "detail": "Example response shape depends on serializer/custom view. See schema sections below."
}
```

**Possible error responses:** `400` validation error, `401` unauthenticated, `403` permission denied, `404` not found, `405` method not allowed.

### `GET /api/worker-payroll/reports/`

**Module:** Payroll
**Description:** A viewset that provides default `create()`, `retrieve()`, `update()`,
**Authentication:** Token/session authenticated RBAC
**Required permissions:** `daily_worker_payroll.view, daily_worker_payroll.view_assigned`
**Roles inferred:** admin, manager
**View/action:** `WorkerPayrollViewSet.reports`

**Query parameters:** none documented/inferred.

**Request/response serializer:** `WorkerPayrollSerializer`

**Example request**

```http
GET /api/worker-payroll/reports/ HTTP/1.1
Host: 127.0.0.1:8000
Authorization: Token {{token}}
```

**Example response**

```json
{
  "detail": "Example response shape depends on serializer/custom view. See schema sections below."
}
```

**Possible error responses:** `400` validation error, `401` unauthenticated, `403` permission denied, `404` not found, `405` method not allowed.

### `GET /api/worker-payroll/summary/`

**Module:** Payroll
**Description:** A viewset that provides default `create()`, `retrieve()`, `update()`,
**Authentication:** Token/session authenticated RBAC
**Required permissions:** `daily_worker_payroll.view, daily_worker_payroll.view_assigned`
**Roles inferred:** admin, manager
**View/action:** `WorkerPayrollViewSet.summary`

**Query parameters:** none documented/inferred.

**Request/response serializer:** `WorkerPayrollSerializer`

**Example request**

```http
GET /api/worker-payroll/summary/ HTTP/1.1
Host: 127.0.0.1:8000
Authorization: Token {{token}}
```

**Example response**

```json
{
  "detail": "Example response shape depends on serializer/custom view. See schema sections below."
}
```

**Possible error responses:** `400` validation error, `401` unauthenticated, `403` permission denied, `404` not found, `405` method not allowed.

### `GET /api/projects/`

**Module:** Projects
**Description:** Intentionally simple parent class for all views. Only implements
**Authentication:** Authenticated
**Required permissions:** `-`
**Roles inferred:** admin, manager, data_entry
**View/action:** `project_list_create.get`

**Query parameters:** none documented/inferred.

**Request/response schema:** custom response or not declared by serializer.

**Example request**

```http
GET /api/projects/ HTTP/1.1
Host: 127.0.0.1:8000
Authorization: Token {{token}}
```

**Example response**

```json
{
  "detail": "Example response shape depends on serializer/custom view. See schema sections below."
}
```

**Possible error responses:** `400` validation error, `401` unauthenticated, `403` permission denied, `404` not found, `405` method not allowed.

### `POST /api/projects/`

**Module:** Projects
**Description:** Intentionally simple parent class for all views. Only implements
**Authentication:** Authenticated
**Required permissions:** `-`
**Roles inferred:** admin, manager, data_entry
**View/action:** `project_list_create.post`

**Query parameters:** none documented/inferred.

**Request/response schema:** custom response or not declared by serializer.

**Example request**

```http
POST /api/projects/ HTTP/1.1
Host: 127.0.0.1:8000
Authorization: Token {{token}}
Content-Type: application/json

{}
```

**Example response**

```json
{
  "detail": "Example response shape depends on serializer/custom view. See schema sections below."
}
```

**Possible error responses:** `400` validation error, `401` unauthenticated, `403` permission denied, `404` not found, `405` method not allowed.

### `DELETE /api/projects/{id}/`

**Module:** Projects
**Description:** Concrete view for retrieving, updating or deleting a model instance.
**Authentication:** Token/session authenticated RBAC
**Required permissions:** `projects.delete`
**Roles inferred:** admin
**View/action:** `ProjectDetailView.delete`

**Path parameters**

| Name | Type | Required | Description |
|---|---|---|---|
| id | string/integer | yes | Object primary key. |

**Query parameters:** none documented/inferred.

**Request/response serializer:** `ProjectSerializer`

**Example request**

```http
DELETE /api/projects/{id}/ HTTP/1.1
Host: 127.0.0.1:8000
Authorization: Token {{token}}
```

**Example response**

```json
{
  "detail": "Example response shape depends on serializer/custom view. See schema sections below."
}
```

**Possible error responses:** `400` validation error, `401` unauthenticated, `403` permission denied, `404` not found, `405` method not allowed.

### `GET /api/projects/{id}/`

**Module:** Projects
**Description:** Concrete view for retrieving, updating or deleting a model instance.
**Authentication:** Token/session authenticated RBAC
**Required permissions:** `projects.view, projects.view_assigned`
**Roles inferred:** admin, data_entry, manager
**View/action:** `ProjectDetailView.get`

**Path parameters**

| Name | Type | Required | Description |
|---|---|---|---|
| id | string/integer | yes | Object primary key. |

**Query parameters:** none documented/inferred.

**Request/response serializer:** `ProjectSerializer`

**Example request**

```http
GET /api/projects/{id}/ HTTP/1.1
Host: 127.0.0.1:8000
Authorization: Token {{token}}
```

**Example response**

```json
{
  "detail": "Example response shape depends on serializer/custom view. See schema sections below."
}
```

**Possible error responses:** `400` validation error, `401` unauthenticated, `403` permission denied, `404` not found, `405` method not allowed.

### `PATCH /api/projects/{id}/`

**Module:** Projects
**Description:** Concrete view for retrieving, updating or deleting a model instance.
**Authentication:** Token/session authenticated RBAC
**Required permissions:** `projects.update, projects.update_own`
**Roles inferred:** admin
**View/action:** `ProjectDetailView.patch`

**Path parameters**

| Name | Type | Required | Description |
|---|---|---|---|
| id | string/integer | yes | Object primary key. |

**Query parameters:** none documented/inferred.

**Request/response serializer:** `ProjectSerializer`

**Example request**

```http
PATCH /api/projects/{id}/ HTTP/1.1
Host: 127.0.0.1:8000
Authorization: Token {{token}}
Content-Type: application/json

{}
```

**Example response**

```json
{
  "detail": "Example response shape depends on serializer/custom view. See schema sections below."
}
```

**Possible error responses:** `400` validation error, `401` unauthenticated, `403` permission denied, `404` not found, `405` method not allowed.

### `PUT /api/projects/{id}/`

**Module:** Projects
**Description:** Concrete view for retrieving, updating or deleting a model instance.
**Authentication:** Token/session authenticated RBAC
**Required permissions:** `projects.update, projects.update_own`
**Roles inferred:** admin
**View/action:** `ProjectDetailView.put`

**Path parameters**

| Name | Type | Required | Description |
|---|---|---|---|
| id | string/integer | yes | Object primary key. |

**Query parameters:** none documented/inferred.

**Request/response serializer:** `ProjectSerializer`

**Example request**

```http
PUT /api/projects/{id}/ HTTP/1.1
Host: 127.0.0.1:8000
Authorization: Token {{token}}
Content-Type: application/json

{}
```

**Example response**

```json
{
  "detail": "Example response shape depends on serializer/custom view. See schema sections below."
}
```

**Possible error responses:** `400` validation error, `401` unauthenticated, `403` permission denied, `404` not found, `405` method not allowed.

### `GET /api/projects/{id}/export-pdf/`

**Module:** Projects
**Description:** Intentionally simple parent class for all views. Only implements
**Authentication:** Authenticated
**Required permissions:** `-`
**Roles inferred:** admin, manager, data_entry
**View/action:** `ProjectPDFExportView.get`

**Path parameters**

| Name | Type | Required | Description |
|---|---|---|---|
| id | string/integer | yes | Object primary key. |

**Query parameters:** none documented/inferred.

**Request/response schema:** custom response or not declared by serializer.

**Example request**

```http
GET /api/projects/{id}/export-pdf/ HTTP/1.1
Host: 127.0.0.1:8000
Authorization: Token {{token}}
```

**Example response**

```json
{
  "detail": "Example response shape depends on serializer/custom view. See schema sections below."
}
```

**Possible error responses:** `400` validation error, `401` unauthenticated, `403` permission denied, `404` not found, `405` method not allowed.

### `GET /api/reports/attendance/`

**Module:** Reports
**Description:** Generic report view.
**Authentication:** Token/session authenticated RBAC
**Required permissions:** `reports.view, reports.view_assigned`
**Roles inferred:** admin
**View/action:** `AttendanceReportView.get`

**Query parameters:** none documented/inferred.

**Request/response serializer:** `AttendanceReportFilterSerializer`

**Example request**

```http
GET /api/reports/attendance/ HTTP/1.1
Host: 127.0.0.1:8000
Authorization: Token {{token}}
```

**Example response**

```json
{
  "detail": "Example response shape depends on serializer/custom view. See schema sections below."
}
```

**Possible error responses:** `400` validation error, `401` unauthenticated, `403` permission denied, `404` not found, `405` method not allowed.

### `GET /api/reports/contracts/`

**Module:** Reports
**Description:** Generic report view.
**Authentication:** Token/session authenticated RBAC
**Required permissions:** `reports.view, reports.view_assigned`
**Roles inferred:** admin
**View/action:** `ContractReportView.get`

**Query parameters:** none documented/inferred.

**Request/response serializer:** `ContractReportFilterSerializer`

**Example request**

```http
GET /api/reports/contracts/ HTTP/1.1
Host: 127.0.0.1:8000
Authorization: Token {{token}}
```

**Example response**

```json
{
  "detail": "Example response shape depends on serializer/custom view. See schema sections below."
}
```

**Possible error responses:** `400` validation error, `401` unauthenticated, `403` permission denied, `404` not found, `405` method not allowed.

### `GET /api/reports/employees/`

**Module:** Reports
**Description:** Generic report view.
**Authentication:** Token/session authenticated RBAC
**Required permissions:** `reports.view, reports.view_assigned`
**Roles inferred:** admin
**View/action:** `EmployeeReportView.get`

**Query parameters:** none documented/inferred.

**Request/response serializer:** `EmployeeReportFilterSerializer`

**Example request**

```http
GET /api/reports/employees/ HTTP/1.1
Host: 127.0.0.1:8000
Authorization: Token {{token}}
```

**Example response**

```json
{
  "detail": "Example response shape depends on serializer/custom view. See schema sections below."
}
```

**Possible error responses:** `400` validation error, `401` unauthenticated, `403` permission denied, `404` not found, `405` method not allowed.

### `GET /api/reports/expenses/`

**Module:** Reports
**Description:** Generic report view.
**Authentication:** Token/session authenticated RBAC
**Required permissions:** `reports.view, reports.view_assigned`
**Roles inferred:** admin
**View/action:** `ExpenseReportView.get`

**Query parameters:** none documented/inferred.

**Request/response serializer:** `ExpenseReportFilterSerializer`

**Example request**

```http
GET /api/reports/expenses/ HTTP/1.1
Host: 127.0.0.1:8000
Authorization: Token {{token}}
```

**Example response**

```json
{
  "detail": "Example response shape depends on serializer/custom view. See schema sections below."
}
```

**Possible error responses:** `400` validation error, `401` unauthenticated, `403` permission denied, `404` not found, `405` method not allowed.

### `GET /api/reports/financial/`

**Module:** Reports
**Description:** Generic report view.
**Authentication:** Token/session authenticated RBAC
**Required permissions:** `reports.view, reports.view_assigned`
**Roles inferred:** admin
**View/action:** `FinancialReportView.get`

**Query parameters:** none documented/inferred.

**Request/response serializer:** `FinancialReportFilterSerializer`

**Example request**

```http
GET /api/reports/financial/ HTTP/1.1
Host: 127.0.0.1:8000
Authorization: Token {{token}}
```

**Example response**

```json
{
  "detail": "Example response shape depends on serializer/custom view. See schema sections below."
}
```

**Possible error responses:** `400` validation error, `401` unauthenticated, `403` permission denied, `404` not found, `405` method not allowed.

### `GET /api/reports/payroll/`

**Module:** Reports
**Description:** Generic report view.
**Authentication:** Token/session authenticated RBAC
**Required permissions:** `reports.view, reports.view_assigned`
**Roles inferred:** admin
**View/action:** `PayrollReportView.get`

**Query parameters:** none documented/inferred.

**Request/response serializer:** `PayrollReportFilterSerializer`

**Example request**

```http
GET /api/reports/payroll/ HTTP/1.1
Host: 127.0.0.1:8000
Authorization: Token {{token}}
```

**Example response**

```json
{
  "detail": "Example response shape depends on serializer/custom view. See schema sections below."
}
```

**Possible error responses:** `400` validation error, `401` unauthenticated, `403` permission denied, `404` not found, `405` method not allowed.

### `GET /api/reports/projects/`

**Module:** Reports
**Description:** Generic report view.
**Authentication:** Token/session authenticated RBAC
**Required permissions:** `reports.view, reports.view_assigned`
**Roles inferred:** admin
**View/action:** `ProjectReportView.get`

**Query parameters:** none documented/inferred.

**Request/response serializer:** `ProjectReportFilterSerializer`

**Example request**

```http
GET /api/reports/projects/ HTTP/1.1
Host: 127.0.0.1:8000
Authorization: Token {{token}}
```

**Example response**

```json
{
  "detail": "Example response shape depends on serializer/custom view. See schema sections below."
}
```

**Possible error responses:** `400` validation error, `401` unauthenticated, `403` permission denied, `404` not found, `405` method not allowed.

### `GET /api/schema/`

**Module:** Settings
**Description:** Intentionally simple parent class for all views. Only implements
**Authentication:** Authenticated
**Required permissions:** `-`
**Roles inferred:** admin, manager, data_entry
**View/action:** `SchemaView.get`

**Query parameters:** none documented/inferred.

**Request/response schema:** custom response or not declared by serializer.

**Example request**

```http
GET /api/schema/ HTTP/1.1
Host: 127.0.0.1:8000
Authorization: Token {{token}}
```

**Example response**

```json
{
  "detail": "Example response shape depends on serializer/custom view. See schema sections below."
}
```

**Possible error responses:** `400` validation error, `401` unauthenticated, `403` permission denied, `404` not found, `405` method not allowed.

### `GET /api/auth/permissions/`

**Module:** Users
**Description:** A viewset that provides default `create()`, `retrieve()`, `update()`,
**Authentication:** Authenticated admin role
**Required permissions:** `admin role`
**Roles inferred:** admin
**View/action:** `PermissionViewSet.list`

**Query parameters:** none documented/inferred.

**Request/response serializer:** `PermissionSerializer`

**Example request**

```http
GET /api/auth/permissions/ HTTP/1.1
Host: 127.0.0.1:8000
Authorization: Token {{token}}
```

**Example response**

```json
{
  "detail": "Example response shape depends on serializer/custom view. See schema sections below."
}
```

**Possible error responses:** `400` validation error, `401` unauthenticated, `403` permission denied, `404` not found, `405` method not allowed.

### `POST /api/auth/permissions/`

**Module:** Users
**Description:** A viewset that provides default `create()`, `retrieve()`, `update()`,
**Authentication:** Authenticated admin role
**Required permissions:** `admin role`
**Roles inferred:** admin
**View/action:** `PermissionViewSet.create`

**Query parameters:** none documented/inferred.

**Request/response serializer:** `PermissionSerializer`

**Example request**

```http
POST /api/auth/permissions/ HTTP/1.1
Host: 127.0.0.1:8000
Authorization: Token {{token}}
Content-Type: application/json

{}
```

**Example response**

```json
{
  "detail": "Example response shape depends on serializer/custom view. See schema sections below."
}
```

**Possible error responses:** `400` validation error, `401` unauthenticated, `403` permission denied, `404` not found, `405` method not allowed.

### `DELETE /api/auth/permissions/{id}/`

**Module:** Users
**Description:** A viewset that provides default `create()`, `retrieve()`, `update()`,
**Authentication:** Authenticated admin role
**Required permissions:** `admin role`
**Roles inferred:** admin
**View/action:** `PermissionViewSet.destroy`

**Query parameters:** none documented/inferred.

**Request/response serializer:** `PermissionSerializer`

**Example request**

```http
DELETE /api/auth/permissions/{id}/ HTTP/1.1
Host: 127.0.0.1:8000
Authorization: Token {{token}}
```

**Example response**

```json
{
  "detail": "Example response shape depends on serializer/custom view. See schema sections below."
}
```

**Possible error responses:** `400` validation error, `401` unauthenticated, `403` permission denied, `404` not found, `405` method not allowed.

### `GET /api/auth/permissions/{id}/`

**Module:** Users
**Description:** A viewset that provides default `create()`, `retrieve()`, `update()`,
**Authentication:** Authenticated admin role
**Required permissions:** `admin role`
**Roles inferred:** admin
**View/action:** `PermissionViewSet.retrieve`

**Query parameters:** none documented/inferred.

**Request/response serializer:** `PermissionSerializer`

**Example request**

```http
GET /api/auth/permissions/{id}/ HTTP/1.1
Host: 127.0.0.1:8000
Authorization: Token {{token}}
```

**Example response**

```json
{
  "detail": "Example response shape depends on serializer/custom view. See schema sections below."
}
```

**Possible error responses:** `400` validation error, `401` unauthenticated, `403` permission denied, `404` not found, `405` method not allowed.

### `PATCH /api/auth/permissions/{id}/`

**Module:** Users
**Description:** A viewset that provides default `create()`, `retrieve()`, `update()`,
**Authentication:** Authenticated admin role
**Required permissions:** `admin role`
**Roles inferred:** admin
**View/action:** `PermissionViewSet.partial_update`

**Query parameters:** none documented/inferred.

**Request/response serializer:** `PermissionSerializer`

**Example request**

```http
PATCH /api/auth/permissions/{id}/ HTTP/1.1
Host: 127.0.0.1:8000
Authorization: Token {{token}}
Content-Type: application/json

{}
```

**Example response**

```json
{
  "detail": "Example response shape depends on serializer/custom view. See schema sections below."
}
```

**Possible error responses:** `400` validation error, `401` unauthenticated, `403` permission denied, `404` not found, `405` method not allowed.

### `PUT /api/auth/permissions/{id}/`

**Module:** Users
**Description:** A viewset that provides default `create()`, `retrieve()`, `update()`,
**Authentication:** Authenticated admin role
**Required permissions:** `admin role`
**Roles inferred:** admin
**View/action:** `PermissionViewSet.update`

**Query parameters:** none documented/inferred.

**Request/response serializer:** `PermissionSerializer`

**Example request**

```http
PUT /api/auth/permissions/{id}/ HTTP/1.1
Host: 127.0.0.1:8000
Authorization: Token {{token}}
Content-Type: application/json

{}
```

**Example response**

```json
{
  "detail": "Example response shape depends on serializer/custom view. See schema sections below."
}
```

**Possible error responses:** `400` validation error, `401` unauthenticated, `403` permission denied, `404` not found, `405` method not allowed.

### `GET /api/auth/project-assignments/`

**Module:** Users
**Description:** A viewset that provides default `create()`, `retrieve()`, `update()`,
**Authentication:** Authenticated admin role
**Required permissions:** `admin role`
**Roles inferred:** admin
**View/action:** `ProjectAssignmentViewSet.list`

**Query parameters:** none documented/inferred.

**Request/response serializer:** `ProjectAssignmentSerializer`

**Example request**

```http
GET /api/auth/project-assignments/ HTTP/1.1
Host: 127.0.0.1:8000
Authorization: Token {{token}}
```

**Example response**

```json
{
  "detail": "Example response shape depends on serializer/custom view. See schema sections below."
}
```

**Possible error responses:** `400` validation error, `401` unauthenticated, `403` permission denied, `404` not found, `405` method not allowed.

### `POST /api/auth/project-assignments/`

**Module:** Users
**Description:** A viewset that provides default `create()`, `retrieve()`, `update()`,
**Authentication:** Authenticated admin role
**Required permissions:** `admin role`
**Roles inferred:** admin
**View/action:** `ProjectAssignmentViewSet.create`

**Query parameters:** none documented/inferred.

**Request/response serializer:** `ProjectAssignmentSerializer`

**Example request**

```http
POST /api/auth/project-assignments/ HTTP/1.1
Host: 127.0.0.1:8000
Authorization: Token {{token}}
Content-Type: application/json

{}
```

**Example response**

```json
{
  "detail": "Example response shape depends on serializer/custom view. See schema sections below."
}
```

**Possible error responses:** `400` validation error, `401` unauthenticated, `403` permission denied, `404` not found, `405` method not allowed.

### `DELETE /api/auth/project-assignments/{id}/`

**Module:** Users
**Description:** A viewset that provides default `create()`, `retrieve()`, `update()`,
**Authentication:** Authenticated admin role
**Required permissions:** `admin role`
**Roles inferred:** admin
**View/action:** `ProjectAssignmentViewSet.destroy`

**Query parameters:** none documented/inferred.

**Request/response serializer:** `ProjectAssignmentSerializer`

**Example request**

```http
DELETE /api/auth/project-assignments/{id}/ HTTP/1.1
Host: 127.0.0.1:8000
Authorization: Token {{token}}
```

**Example response**

```json
{
  "detail": "Example response shape depends on serializer/custom view. See schema sections below."
}
```

**Possible error responses:** `400` validation error, `401` unauthenticated, `403` permission denied, `404` not found, `405` method not allowed.

### `GET /api/auth/project-assignments/{id}/`

**Module:** Users
**Description:** A viewset that provides default `create()`, `retrieve()`, `update()`,
**Authentication:** Authenticated admin role
**Required permissions:** `admin role`
**Roles inferred:** admin
**View/action:** `ProjectAssignmentViewSet.retrieve`

**Query parameters:** none documented/inferred.

**Request/response serializer:** `ProjectAssignmentSerializer`

**Example request**

```http
GET /api/auth/project-assignments/{id}/ HTTP/1.1
Host: 127.0.0.1:8000
Authorization: Token {{token}}
```

**Example response**

```json
{
  "detail": "Example response shape depends on serializer/custom view. See schema sections below."
}
```

**Possible error responses:** `400` validation error, `401` unauthenticated, `403` permission denied, `404` not found, `405` method not allowed.

### `PATCH /api/auth/project-assignments/{id}/`

**Module:** Users
**Description:** A viewset that provides default `create()`, `retrieve()`, `update()`,
**Authentication:** Authenticated admin role
**Required permissions:** `admin role`
**Roles inferred:** admin
**View/action:** `ProjectAssignmentViewSet.partial_update`

**Query parameters:** none documented/inferred.

**Request/response serializer:** `ProjectAssignmentSerializer`

**Example request**

```http
PATCH /api/auth/project-assignments/{id}/ HTTP/1.1
Host: 127.0.0.1:8000
Authorization: Token {{token}}
Content-Type: application/json

{}
```

**Example response**

```json
{
  "detail": "Example response shape depends on serializer/custom view. See schema sections below."
}
```

**Possible error responses:** `400` validation error, `401` unauthenticated, `403` permission denied, `404` not found, `405` method not allowed.

### `PUT /api/auth/project-assignments/{id}/`

**Module:** Users
**Description:** A viewset that provides default `create()`, `retrieve()`, `update()`,
**Authentication:** Authenticated admin role
**Required permissions:** `admin role`
**Roles inferred:** admin
**View/action:** `ProjectAssignmentViewSet.update`

**Query parameters:** none documented/inferred.

**Request/response serializer:** `ProjectAssignmentSerializer`

**Example request**

```http
PUT /api/auth/project-assignments/{id}/ HTTP/1.1
Host: 127.0.0.1:8000
Authorization: Token {{token}}
Content-Type: application/json

{}
```

**Example response**

```json
{
  "detail": "Example response shape depends on serializer/custom view. See schema sections below."
}
```

**Possible error responses:** `400` validation error, `401` unauthenticated, `403` permission denied, `404` not found, `405` method not allowed.

### `GET /api/auth/role-permissions/`

**Module:** Users
**Description:** A viewset that provides default `create()`, `retrieve()`, `update()`,
**Authentication:** Authenticated admin role
**Required permissions:** `admin role`
**Roles inferred:** admin
**View/action:** `RolePermissionViewSet.list`

**Query parameters:** none documented/inferred.

**Request/response serializer:** `RolePermissionSerializer`

**Example request**

```http
GET /api/auth/role-permissions/ HTTP/1.1
Host: 127.0.0.1:8000
Authorization: Token {{token}}
```

**Example response**

```json
{
  "detail": "Example response shape depends on serializer/custom view. See schema sections below."
}
```

**Possible error responses:** `400` validation error, `401` unauthenticated, `403` permission denied, `404` not found, `405` method not allowed.

### `POST /api/auth/role-permissions/`

**Module:** Users
**Description:** A viewset that provides default `create()`, `retrieve()`, `update()`,
**Authentication:** Authenticated admin role
**Required permissions:** `admin role`
**Roles inferred:** admin
**View/action:** `RolePermissionViewSet.create`

**Query parameters:** none documented/inferred.

**Request/response serializer:** `RolePermissionCreateSerializer`

**Example request**

```http
POST /api/auth/role-permissions/ HTTP/1.1
Host: 127.0.0.1:8000
Authorization: Token {{token}}
Content-Type: application/json

{}
```

**Example response**

```json
{
  "detail": "Example response shape depends on serializer/custom view. See schema sections below."
}
```

**Possible error responses:** `400` validation error, `401` unauthenticated, `403` permission denied, `404` not found, `405` method not allowed.

### `DELETE /api/auth/role-permissions/{id}/`

**Module:** Users
**Description:** A viewset that provides default `create()`, `retrieve()`, `update()`,
**Authentication:** Authenticated admin role
**Required permissions:** `admin role`
**Roles inferred:** admin
**View/action:** `RolePermissionViewSet.destroy`

**Query parameters:** none documented/inferred.

**Request/response serializer:** `RolePermissionSerializer`

**Example request**

```http
DELETE /api/auth/role-permissions/{id}/ HTTP/1.1
Host: 127.0.0.1:8000
Authorization: Token {{token}}
```

**Example response**

```json
{
  "detail": "Example response shape depends on serializer/custom view. See schema sections below."
}
```

**Possible error responses:** `400` validation error, `401` unauthenticated, `403` permission denied, `404` not found, `405` method not allowed.

### `GET /api/auth/role-permissions/{id}/`

**Module:** Users
**Description:** A viewset that provides default `create()`, `retrieve()`, `update()`,
**Authentication:** Authenticated admin role
**Required permissions:** `admin role`
**Roles inferred:** admin
**View/action:** `RolePermissionViewSet.retrieve`

**Query parameters:** none documented/inferred.

**Request/response serializer:** `RolePermissionSerializer`

**Example request**

```http
GET /api/auth/role-permissions/{id}/ HTTP/1.1
Host: 127.0.0.1:8000
Authorization: Token {{token}}
```

**Example response**

```json
{
  "detail": "Example response shape depends on serializer/custom view. See schema sections below."
}
```

**Possible error responses:** `400` validation error, `401` unauthenticated, `403` permission denied, `404` not found, `405` method not allowed.

### `PATCH /api/auth/role-permissions/{id}/`

**Module:** Users
**Description:** A viewset that provides default `create()`, `retrieve()`, `update()`,
**Authentication:** Authenticated admin role
**Required permissions:** `admin role`
**Roles inferred:** admin
**View/action:** `RolePermissionViewSet.partial_update`

**Query parameters:** none documented/inferred.

**Request/response serializer:** `RolePermissionCreateSerializer`

**Example request**

```http
PATCH /api/auth/role-permissions/{id}/ HTTP/1.1
Host: 127.0.0.1:8000
Authorization: Token {{token}}
Content-Type: application/json

{}
```

**Example response**

```json
{
  "detail": "Example response shape depends on serializer/custom view. See schema sections below."
}
```

**Possible error responses:** `400` validation error, `401` unauthenticated, `403` permission denied, `404` not found, `405` method not allowed.

### `PUT /api/auth/role-permissions/{id}/`

**Module:** Users
**Description:** A viewset that provides default `create()`, `retrieve()`, `update()`,
**Authentication:** Authenticated admin role
**Required permissions:** `admin role`
**Roles inferred:** admin
**View/action:** `RolePermissionViewSet.update`

**Query parameters:** none documented/inferred.

**Request/response serializer:** `RolePermissionCreateSerializer`

**Example request**

```http
PUT /api/auth/role-permissions/{id}/ HTTP/1.1
Host: 127.0.0.1:8000
Authorization: Token {{token}}
Content-Type: application/json

{}
```

**Example response**

```json
{
  "detail": "Example response shape depends on serializer/custom view. See schema sections below."
}
```

**Possible error responses:** `400` validation error, `401` unauthenticated, `403` permission denied, `404` not found, `405` method not allowed.

### `GET /api/auth/user-permissions/`

**Module:** Users
**Description:** A viewset that provides default `create()`, `retrieve()`, `update()`,
**Authentication:** Authenticated admin role
**Required permissions:** `admin role`
**Roles inferred:** admin
**View/action:** `UserPermissionOverrideViewSet.list`

**Query parameters:** none documented/inferred.

**Request/response serializer:** `UserPermissionOverrideSerializer`

**Example request**

```http
GET /api/auth/user-permissions/ HTTP/1.1
Host: 127.0.0.1:8000
Authorization: Token {{token}}
```

**Example response**

```json
{
  "detail": "Example response shape depends on serializer/custom view. See schema sections below."
}
```

**Possible error responses:** `400` validation error, `401` unauthenticated, `403` permission denied, `404` not found, `405` method not allowed.

### `POST /api/auth/user-permissions/`

**Module:** Users
**Description:** A viewset that provides default `create()`, `retrieve()`, `update()`,
**Authentication:** Authenticated admin role
**Required permissions:** `admin role`
**Roles inferred:** admin
**View/action:** `UserPermissionOverrideViewSet.create`

**Query parameters:** none documented/inferred.

**Request/response serializer:** `UserPermissionOverrideSerializer`

**Example request**

```http
POST /api/auth/user-permissions/ HTTP/1.1
Host: 127.0.0.1:8000
Authorization: Token {{token}}
Content-Type: application/json

{}
```

**Example response**

```json
{
  "detail": "Example response shape depends on serializer/custom view. See schema sections below."
}
```

**Possible error responses:** `400` validation error, `401` unauthenticated, `403` permission denied, `404` not found, `405` method not allowed.

### `DELETE /api/auth/user-permissions/{id}/`

**Module:** Users
**Description:** A viewset that provides default `create()`, `retrieve()`, `update()`,
**Authentication:** Authenticated admin role
**Required permissions:** `admin role`
**Roles inferred:** admin
**View/action:** `UserPermissionOverrideViewSet.destroy`

**Query parameters:** none documented/inferred.

**Request/response serializer:** `UserPermissionOverrideSerializer`

**Example request**

```http
DELETE /api/auth/user-permissions/{id}/ HTTP/1.1
Host: 127.0.0.1:8000
Authorization: Token {{token}}
```

**Example response**

```json
{
  "detail": "Example response shape depends on serializer/custom view. See schema sections below."
}
```

**Possible error responses:** `400` validation error, `401` unauthenticated, `403` permission denied, `404` not found, `405` method not allowed.

### `GET /api/auth/user-permissions/{id}/`

**Module:** Users
**Description:** A viewset that provides default `create()`, `retrieve()`, `update()`,
**Authentication:** Authenticated admin role
**Required permissions:** `admin role`
**Roles inferred:** admin
**View/action:** `UserPermissionOverrideViewSet.retrieve`

**Query parameters:** none documented/inferred.

**Request/response serializer:** `UserPermissionOverrideSerializer`

**Example request**

```http
GET /api/auth/user-permissions/{id}/ HTTP/1.1
Host: 127.0.0.1:8000
Authorization: Token {{token}}
```

**Example response**

```json
{
  "detail": "Example response shape depends on serializer/custom view. See schema sections below."
}
```

**Possible error responses:** `400` validation error, `401` unauthenticated, `403` permission denied, `404` not found, `405` method not allowed.

### `PATCH /api/auth/user-permissions/{id}/`

**Module:** Users
**Description:** A viewset that provides default `create()`, `retrieve()`, `update()`,
**Authentication:** Authenticated admin role
**Required permissions:** `admin role`
**Roles inferred:** admin
**View/action:** `UserPermissionOverrideViewSet.partial_update`

**Query parameters:** none documented/inferred.

**Request/response serializer:** `UserPermissionOverrideSerializer`

**Example request**

```http
PATCH /api/auth/user-permissions/{id}/ HTTP/1.1
Host: 127.0.0.1:8000
Authorization: Token {{token}}
Content-Type: application/json

{}
```

**Example response**

```json
{
  "detail": "Example response shape depends on serializer/custom view. See schema sections below."
}
```

**Possible error responses:** `400` validation error, `401` unauthenticated, `403` permission denied, `404` not found, `405` method not allowed.

### `PUT /api/auth/user-permissions/{id}/`

**Module:** Users
**Description:** A viewset that provides default `create()`, `retrieve()`, `update()`,
**Authentication:** Authenticated admin role
**Required permissions:** `admin role`
**Roles inferred:** admin
**View/action:** `UserPermissionOverrideViewSet.update`

**Query parameters:** none documented/inferred.

**Request/response serializer:** `UserPermissionOverrideSerializer`

**Example request**

```http
PUT /api/auth/user-permissions/{id}/ HTTP/1.1
Host: 127.0.0.1:8000
Authorization: Token {{token}}
Content-Type: application/json

{}
```

**Example response**

```json
{
  "detail": "Example response shape depends on serializer/custom view. See schema sections below."
}
```

**Possible error responses:** `400` validation error, `401` unauthenticated, `403` permission denied, `404` not found, `405` method not allowed.

### `GET /api/auth/users/`

**Module:** Users
**Description:** A viewset that provides default `create()`, `retrieve()`, `update()`,
**Authentication:** Authenticated admin role
**Required permissions:** `admin role`
**Roles inferred:** admin
**View/action:** `UserViewSet.list`

**Query parameters:** none documented/inferred.

**Request/response serializer:** `UserSerializer`

**Example request**

```http
GET /api/auth/users/ HTTP/1.1
Host: 127.0.0.1:8000
Authorization: Token {{token}}
```

**Example response**

```json
{
  "detail": "Example response shape depends on serializer/custom view. See schema sections below."
}
```

**Possible error responses:** `400` validation error, `401` unauthenticated, `403` permission denied, `404` not found, `405` method not allowed.

### `POST /api/auth/users/`

**Module:** Users
**Description:** A viewset that provides default `create()`, `retrieve()`, `update()`,
**Authentication:** Authenticated admin role
**Required permissions:** `admin role`
**Roles inferred:** admin
**View/action:** `UserViewSet.create`

**Query parameters:** none documented/inferred.

**Request/response serializer:** `UserCreateSerializer`

**Example request**

```http
POST /api/auth/users/ HTTP/1.1
Host: 127.0.0.1:8000
Authorization: Token {{token}}
Content-Type: application/json

{}
```

**Example response**

```json
{
  "detail": "Example response shape depends on serializer/custom view. See schema sections below."
}
```

**Possible error responses:** `400` validation error, `401` unauthenticated, `403` permission denied, `404` not found, `405` method not allowed.

### `DELETE /api/auth/users/{id}/`

**Module:** Users
**Description:** A viewset that provides default `create()`, `retrieve()`, `update()`,
**Authentication:** Authenticated admin role
**Required permissions:** `admin role`
**Roles inferred:** admin
**View/action:** `UserViewSet.destroy`

**Query parameters:** none documented/inferred.

**Request/response serializer:** `UserSerializer`

**Example request**

```http
DELETE /api/auth/users/{id}/ HTTP/1.1
Host: 127.0.0.1:8000
Authorization: Token {{token}}
```

**Example response**

```json
{
  "detail": "Example response shape depends on serializer/custom view. See schema sections below."
}
```

**Possible error responses:** `400` validation error, `401` unauthenticated, `403` permission denied, `404` not found, `405` method not allowed.

### `GET /api/auth/users/{id}/`

**Module:** Users
**Description:** A viewset that provides default `create()`, `retrieve()`, `update()`,
**Authentication:** Authenticated admin role
**Required permissions:** `admin role`
**Roles inferred:** admin
**View/action:** `UserViewSet.retrieve`

**Query parameters:** none documented/inferred.

**Request/response serializer:** `UserSerializer`

**Example request**

```http
GET /api/auth/users/{id}/ HTTP/1.1
Host: 127.0.0.1:8000
Authorization: Token {{token}}
```

**Example response**

```json
{
  "detail": "Example response shape depends on serializer/custom view. See schema sections below."
}
```

**Possible error responses:** `400` validation error, `401` unauthenticated, `403` permission denied, `404` not found, `405` method not allowed.

### `PATCH /api/auth/users/{id}/`

**Module:** Users
**Description:** A viewset that provides default `create()`, `retrieve()`, `update()`,
**Authentication:** Authenticated admin role
**Required permissions:** `admin role`
**Roles inferred:** admin
**View/action:** `UserViewSet.partial_update`

**Query parameters:** none documented/inferred.

**Request/response serializer:** `UserSerializer`

**Example request**

```http
PATCH /api/auth/users/{id}/ HTTP/1.1
Host: 127.0.0.1:8000
Authorization: Token {{token}}
Content-Type: application/json

{}
```

**Example response**

```json
{
  "detail": "Example response shape depends on serializer/custom view. See schema sections below."
}
```

**Possible error responses:** `400` validation error, `401` unauthenticated, `403` permission denied, `404` not found, `405` method not allowed.

### `PUT /api/auth/users/{id}/`

**Module:** Users
**Description:** A viewset that provides default `create()`, `retrieve()`, `update()`,
**Authentication:** Authenticated admin role
**Required permissions:** `admin role`
**Roles inferred:** admin
**View/action:** `UserViewSet.update`

**Query parameters:** none documented/inferred.

**Request/response serializer:** `UserSerializer`

**Example request**

```http
PUT /api/auth/users/{id}/ HTTP/1.1
Host: 127.0.0.1:8000
Authorization: Token {{token}}
Content-Type: application/json

{}
```

**Example response**

```json
{
  "detail": "Example response shape depends on serializer/custom view. See schema sections below."
}
```

**Possible error responses:** `400` validation error, `401` unauthenticated, `403` permission denied, `404` not found, `405` method not allowed.

### `POST /api/auth/users/{id}/set_password/`

**Module:** Users
**Description:** A viewset that provides default `create()`, `retrieve()`, `update()`,
**Authentication:** Authenticated admin role
**Required permissions:** `admin role`
**Roles inferred:** admin
**View/action:** `UserViewSet.set_password`

**Query parameters:** none documented/inferred.

**Request/response serializer:** `UserSerializer`

**Example request**

```http
POST /api/auth/users/{id}/set_password/ HTTP/1.1
Host: 127.0.0.1:8000
Authorization: Token {{token}}
Content-Type: application/json

{}
```

**Example response**

```json
{
  "detail": "Example response shape depends on serializer/custom view. See schema sections below."
}
```

**Possible error responses:** `400` validation error, `401` unauthenticated, `403` permission denied, `404` not found, `405` method not allowed.

### `POST /api/auth/users/{id}/set_role/`

**Module:** Users
**Description:** A viewset that provides default `create()`, `retrieve()`, `update()`,
**Authentication:** Authenticated admin role
**Required permissions:** `admin role`
**Roles inferred:** admin
**View/action:** `UserViewSet.set_role`

**Query parameters:** none documented/inferred.

**Request/response serializer:** `UserSerializer`

**Example request**

```http
POST /api/auth/users/{id}/set_role/ HTTP/1.1
Host: 127.0.0.1:8000
Authorization: Token {{token}}
Content-Type: application/json

{}
```

**Example response**

```json
{
  "detail": "Example response shape depends on serializer/custom view. See schema sections below."
}
```

**Possible error responses:** `400` validation error, `401` unauthenticated, `403` permission denied, `404` not found, `405` method not allowed.

## Serializer Reference

### `ActivitySerializer`

| Field | Type | Required | Read-only | Write-only | Allow null | Validation / choices |
|---|---|---:|---:|---:|---:|---|
| `type` | CharField | True | False | False | False | validators: ProhibitNullCharactersValidator, ProhibitSurrogateCharactersValidator |
| `icon` | CharField | True | False | False | False | validators: ProhibitNullCharactersValidator, ProhibitSurrogateCharactersValidator |
| `title` | CharField | True | False | False | False | validators: ProhibitNullCharactersValidator, ProhibitSurrogateCharactersValidator |
| `description` | CharField | True | False | False | False | validators: ProhibitNullCharactersValidator, ProhibitSurrogateCharactersValidator |
| `project` | CharField | True | False | False | True | validators: ProhibitNullCharactersValidator, ProhibitSurrogateCharactersValidator |
| `amount_display` | CharField | True | False | False | True | validators: ProhibitNullCharactersValidator, ProhibitSurrogateCharactersValidator |
| `timestamp` | CharField | True | False | False | False | validators: ProhibitNullCharactersValidator, ProhibitSurrogateCharactersValidator |
| `entity_id` | IntegerField | True | False | False | False | - |

### `AlertSerializer`

| Field | Type | Required | Read-only | Write-only | Allow null | Validation / choices |
|---|---|---:|---:|---:|---:|---|
| `type` | CharField | True | False | False | False | validators: ProhibitNullCharactersValidator, ProhibitSurrogateCharactersValidator |
| `severity` | CharField | True | False | False | False | validators: ProhibitNullCharactersValidator, ProhibitSurrogateCharactersValidator |
| `title` | CharField | True | False | False | False | validators: ProhibitNullCharactersValidator, ProhibitSurrogateCharactersValidator |
| `message` | CharField | True | False | False | False | validators: ProhibitNullCharactersValidator, ProhibitSurrogateCharactersValidator |
| `entity_type` | CharField | True | False | False | False | validators: ProhibitNullCharactersValidator, ProhibitSurrogateCharactersValidator |
| `entity_id` | IntegerField | True | False | False | True | - |

### `AlertsSummarySerializer`

| Field | Type | Required | Read-only | Write-only | Allow null | Validation / choices |
|---|---|---:|---:|---:|---:|---|
| `total_alerts` | IntegerField | True | False | False | False | - |
| `high_count` | IntegerField | True | False | False | False | - |
| `medium_count` | IntegerField | True | False | False | False | - |
| `low_count` | IntegerField | True | False | False | False | - |
| `alerts` | ListSerializer | True | False | False | False | - |

### `AttendanceListSerializer`

| Field | Type | Required | Read-only | Write-only | Allow null | Validation / choices |
|---|---|---:|---:|---:|---:|---|
| `id` | IntegerField | False | True | False | False | - |
| `employee` | PrimaryKeyRelatedField | True | False | False | False | choices: 3, 2 |
| `employee_name` | CharField | False | True | False | False | validators: ProhibitNullCharactersValidator, ProhibitSurrogateCharactersValidator |
| `employee_identifier` | CharField | False | True | False | False | validators: ProhibitNullCharactersValidator, ProhibitSurrogateCharactersValidator |
| `date` | DateField | True | False | False | False | - |
| `status` | ChoiceField | False | False | False | False | choices: present, absent, half_day, leave |
| `check_in` | TimeField | False | False | False | True | - |
| `check_out` | TimeField | False | False | False | True | - |
| `overtime_hours` | DecimalField | False | False | False | False | Extra hours worked beyond normal shift |

### `AttendanceReportFilterSerializer`

| Field | Type | Required | Read-only | Write-only | Allow null | Validation / choices |
|---|---|---:|---:|---:|---:|---|
| `start_date` | DateField | False | False | False | False | - |
| `end_date` | DateField | False | False | False | False | - |
| `export` | ChoiceField | False | False | False | False | choices: json, pdf |
| `employee_id` | IntegerField | False | False | False | False | - |
| `status` | CharField | False | False | False | False | validators: ProhibitNullCharactersValidator, ProhibitSurrogateCharactersValidator |

### `AttendanceSerializer`

| Field | Type | Required | Read-only | Write-only | Allow null | Validation / choices |
|---|---|---:|---:|---:|---:|---|
| `id` | IntegerField | False | True | False | False | - |
| `employee` | PrimaryKeyRelatedField | True | False | False | False | choices: 3, 2 |
| `employee_name` | CharField | False | True | False | False | validators: ProhibitNullCharactersValidator, ProhibitSurrogateCharactersValidator |
| `employee_identifier` | CharField | False | True | False | False | validators: ProhibitNullCharactersValidator, ProhibitSurrogateCharactersValidator |
| `date` | DateField | True | False | False | False | - |
| `status` | ChoiceField | False | False | False | False | choices: present, absent, half_day, leave |
| `check_in` | TimeField | False | False | False | True | - |
| `check_out` | TimeField | False | False | False | True | - |
| `overtime_hours` | DecimalField | False | False | False | False | Extra hours worked beyond normal shift |
| `note` | CharField | False | False | False | False | validators: MaxLengthValidator, ProhibitNullCharactersValidator, ProhibitSurrogateCharactersValidator |
| `created_at` | DateTimeField | False | True | False | False | - |
| `updated_at` | DateTimeField | False | True | False | False | - |

### `AttendanceSummarySerializer`

| Field | Type | Required | Read-only | Write-only | Allow null | Validation / choices |
|---|---|---:|---:|---:|---:|---|
| `today` | DictField | True | False | False | False | - |
| `weekly_trend` | ListField | True | False | False | False | - |

### `AuditLogDetailSerializer`

| Field | Type | Required | Read-only | Write-only | Allow null | Validation / choices |
|---|---|---:|---:|---:|---:|---|
| `id` | IntegerField | False | True | False | False | - |
| `timestamp` | DateTimeField | False | True | False | False | - |
| `username` | CharField | False | True | False | False | validators: ProhibitNullCharactersValidator, ProhibitSurrogateCharactersValidator |
| `action` | CharField | True | False | False | False | validators: MaxLengthValidator, ProhibitNullCharactersValidator, ProhibitSurrogateCharactersValidator |
| `status` | ChoiceField | False | False | False | False | choices: success, failed |
| `model_name` | CharField | False | False | False | False | validators: MaxLengthValidator, ProhibitNullCharactersValidator, ProhibitSurrogateCharactersValidator |
| `object_id` | CharField | False | False | False | False | validators: MaxLengthValidator, ProhibitNullCharactersValidator, ProhibitSurrogateCharactersValidator |
| `object_repr` | CharField | False | False | False | False | validators: MaxLengthValidator, ProhibitNullCharactersValidator, ProhibitSurrogateCharactersValidator |
| `old_data` | JSONField | False | False | False | False | - |
| `new_data` | JSONField | False | False | False | False | - |
| `field_changes` | SerializerMethodField | False | True | False | False | - |
| `financial_changes` | SerializerMethodField | False | True | False | False | - |
| `warnings` | SerializerMethodField | False | True | False | False | - |
| `description` | CharField | False | False | False | False | validators: ProhibitNullCharactersValidator, ProhibitSurrogateCharactersValidator |
| `ip_address` | IPAddressField | False | False | False | True | validators: ProhibitNullCharactersValidator, ProhibitSurrogateCharactersValidator, function |
| `user_agent` | CharField | False | False | False | False | validators: ProhibitNullCharactersValidator, ProhibitSurrogateCharactersValidator |
| `request_method` | CharField | False | False | False | False | validators: MaxLengthValidator, ProhibitNullCharactersValidator, ProhibitSurrogateCharactersValidator |
| `endpoint` | CharField | False | False | False | False | validators: ProhibitNullCharactersValidator, ProhibitSurrogateCharactersValidator |
| `extra_metadata` | JSONField | False | False | False | False | - |

### `AuditLogListSerializer`

| Field | Type | Required | Read-only | Write-only | Allow null | Validation / choices |
|---|---|---:|---:|---:|---:|---|
| `id` | IntegerField | False | True | False | False | - |
| `timestamp` | DateTimeField | False | True | False | False | - |
| `username` | CharField | False | True | False | False | validators: ProhibitNullCharactersValidator, ProhibitSurrogateCharactersValidator |
| `action` | CharField | True | False | False | False | validators: MaxLengthValidator, ProhibitNullCharactersValidator, ProhibitSurrogateCharactersValidator |
| `status` | ChoiceField | False | False | False | False | choices: success, failed |
| `model_name` | CharField | False | False | False | False | validators: MaxLengthValidator, ProhibitNullCharactersValidator, ProhibitSurrogateCharactersValidator |
| `object_id` | CharField | False | False | False | False | validators: MaxLengthValidator, ProhibitNullCharactersValidator, ProhibitSurrogateCharactersValidator |
| `object_repr` | CharField | False | False | False | False | validators: MaxLengthValidator, ProhibitNullCharactersValidator, ProhibitSurrogateCharactersValidator |
| `endpoint` | CharField | False | False | False | False | validators: ProhibitNullCharactersValidator, ProhibitSurrogateCharactersValidator |
| `ip_address` | IPAddressField | False | False | False | True | validators: ProhibitNullCharactersValidator, ProhibitSurrogateCharactersValidator, function |
| `changed_field_count` | SerializerMethodField | False | True | False | False | - |
| `is_financial` | SerializerMethodField | False | True | False | False | - |
| `currency` | SerializerMethodField | False | True | False | False | - |

### `AuditRetentionPolicySerializer`

| Field | Type | Required | Read-only | Write-only | Allow null | Validation / choices |
|---|---|---:|---:|---:|---:|---|
| `id` | IntegerField | False | True | False | False | - |
| `keep_forever` | BooleanField | False | False | False | False | - |
| `archive_after_months` | IntegerField | False | False | False | True | validators: MaxValueValidator, MinValueValidator |
| `updated_at` | DateTimeField | False | True | False | False | - |
| `updated_by` | PrimaryKeyRelatedField | False | True | False | True | - |

### `BaseReportFilterSerializer`

| Field | Type | Required | Read-only | Write-only | Allow null | Validation / choices |
|---|---|---:|---:|---:|---:|---|
| `start_date` | DateField | False | False | False | False | - |
| `end_date` | DateField | False | False | False | False | - |
| `export` | ChoiceField | False | False | False | False | choices: json, pdf |

### `BudgetComparisonSerializer`

| Field | Type | Required | Read-only | Write-only | Allow null | Validation / choices |
|---|---|---:|---:|---:|---:|---|
| `id` | IntegerField | True | False | False | False | - |
| `name` | CharField | True | False | False | False | validators: ProhibitNullCharactersValidator, ProhibitSurrogateCharactersValidator |
| `status` | CharField | True | False | False | False | validators: ProhibitNullCharactersValidator, ProhibitSurrogateCharactersValidator |
| `estimated_budget` | FloatField | True | False | False | False | - |
| `budget_currency` | CharField | True | False | False | False | validators: ProhibitNullCharactersValidator, ProhibitSurrogateCharactersValidator |
| `total_spent_usd` | FloatField | True | False | False | False | - |
| `total_spent_afn` | FloatField | True | False | False | False | - |
| `budget_remaining` | FloatField | True | False | False | False | - |
| `budget_remaining_usd` | FloatField | True | False | False | True | - |
| `budget_remaining_afn` | FloatField | True | False | False | True | - |
| `budget_utilization_pct` | FloatField | True | False | False | False | - |
| `is_over_budget` | BooleanField | True | False | False | False | - |

### `BulkAttendanceSerializer`

| Field | Type | Required | Read-only | Write-only | Allow null | Validation / choices |
|---|---|---:|---:|---:|---:|---|
| `date` | DateField | True | False | False | False | - |
| `records` | ListField | True | False | False | False | List of {employee: id, status: 'present/absent/half_day/leave', check_in: '08:00', check_out: '17:00', overtime_hours: 0, note: ''} |

### `BulkWorkerAttendanceSerializer`

| Field | Type | Required | Read-only | Write-only | Allow null | Validation / choices |
|---|---|---:|---:|---:|---:|---|
| `date` | DateField | True | False | False | False | - |
| `project` | IntegerField | False | False | False | True | - |
| `records` | ListField | True | False | False | False | - |

### `ContractDetailSerializer`

| Field | Type | Required | Read-only | Write-only | Allow null | Validation / choices |
|---|---|---:|---:|---:|---:|---|
| `id` | IntegerField | False | True | False | False | - |
| `project` | PrimaryKeyRelatedField | True | False | False | False | choices: 6, 4, 5 |
| `project_name` | CharField | False | True | False | False | validators: ProhibitNullCharactersValidator, ProhibitSurrogateCharactersValidator |
| `subcontractor` | SubcontractorListSerializer | False | True | False | False | - |
| `contract_number` | CharField | False | True | False | False | validators: ProhibitNullCharactersValidator, ProhibitSurrogateCharactersValidator |
| `title` | CharField | True | False | False | False | validators: MaxLengthValidator, ProhibitNullCharactersValidator, ProhibitSurrogateCharactersValidator |
| `scope_of_work` | CharField | False | False | False | False | validators: ProhibitNullCharactersValidator, ProhibitSurrogateCharactersValidator |
| `currency` | ChoiceField | False | False | False | False | choices: AFN, USD |
| `contract_value` | DecimalField | True | False | False | False | validators: MinValueValidator |
| `retention_percentage` | DecimalField | False | False | False | False | validators: MaxValueValidator, MinValueValidator |
| `retention_amount` | DecimalField | False | True | False | False | - |
| `start_date` | DateField | True | False | False | False | - |
| `end_date` | DateField | True | False | False | False | - |
| `completion_percentage` | DecimalField | False | False | False | False | validators: MaxValueValidator, MinValueValidator |
| `status` | ChoiceField | False | False | False | False | choices: draft, active, completed, terminated, cancelled |
| `status_display` | CharField | False | True | False | False | validators: ProhibitNullCharactersValidator, ProhibitSurrogateCharactersValidator |
| `notes` | CharField | False | False | False | False | validators: ProhibitNullCharactersValidator, ProhibitSurrogateCharactersValidator |
| `payments` | SerializerMethodField | False | True | False | False | - |
| `documents` | SerializerMethodField | False | True | False | False | - |
| `variations` | SerializerMethodField | False | True | False | False | - |
| `financial_summary` | SerializerMethodField | False | True | False | False | - |
| `adjusted_contract_value` | ReadOnlyField | False | True | False | False | - |
| `created_at` | DateTimeField | False | True | False | False | - |
| `updated_at` | DateTimeField | False | True | False | False | - |

### `ContractDocumentCreateSerializer`

| Field | Type | Required | Read-only | Write-only | Allow null | Validation / choices |
|---|---|---:|---:|---:|---:|---|
| `id` | IntegerField | False | True | False | False | - |
| `title` | CharField | True | False | False | False | validators: MaxLengthValidator, ProhibitNullCharactersValidator, ProhibitSurrogateCharactersValidator |
| `document_type` | ChoiceField | False | False | False | False | choices: signed_contract, boq, drawing, invoice, quotation, supporting |
| `document_type_display` | CharField | False | True | False | False | validators: ProhibitNullCharactersValidator, ProhibitSurrogateCharactersValidator |
| `file` | FileField | True | False | False | False | - |
| `uploaded_at` | DateTimeField | False | True | False | False | - |

### `ContractDocumentSerializer`

| Field | Type | Required | Read-only | Write-only | Allow null | Validation / choices |
|---|---|---:|---:|---:|---:|---|
| `id` | IntegerField | False | True | False | False | - |
| `contract` | PrimaryKeyRelatedField | True | False | False | False | choices: 3, 2, 1 |
| `title` | CharField | True | False | False | False | validators: MaxLengthValidator, ProhibitNullCharactersValidator, ProhibitSurrogateCharactersValidator |
| `document_type` | ChoiceField | False | False | False | False | choices: signed_contract, boq, drawing, invoice, quotation, supporting |
| `document_type_display` | CharField | False | True | False | False | validators: ProhibitNullCharactersValidator, ProhibitSurrogateCharactersValidator |
| `file` | FileField | True | False | False | False | - |
| `uploaded_at` | DateTimeField | False | True | False | False | - |

### `ContractInvoiceDetailsSerializer`

| Field | Type | Required | Read-only | Write-only | Allow null | Validation / choices |
|---|---|---:|---:|---:|---:|---|
| `id` | IntegerField | False | True | False | False | - |
| `contract` | PrimaryKeyRelatedField | True | False | False | False | choices: 3, 2, 1 |
| `contract_number` | CharField | False | True | False | False | validators: ProhibitNullCharactersValidator, ProhibitSurrogateCharactersValidator |
| `project_name` | CharField | False | True | False | False | validators: ProhibitNullCharactersValidator, ProhibitSurrogateCharactersValidator |
| `subcontractor_name` | CharField | False | True | False | False | validators: ProhibitNullCharactersValidator, ProhibitSurrogateCharactersValidator |
| `invoice_number` | CharField | False | True | False | False | validators: ProhibitNullCharactersValidator, ProhibitSurrogateCharactersValidator |
| `invoice_date` | DateField | True | False | False | False | - |
| `due_date` | DateField | False | False | False | True | - |
| `description` | CharField | False | False | False | False | validators: ProhibitNullCharactersValidator, ProhibitSurrogateCharactersValidator |
| `amount` | DecimalField | True | False | False | False | validators: MinValueValidator |
| `status` | ChoiceField | False | False | False | False | choices: pending, approved, partially_paid, paid, cancelled |
| `notes` | CharField | False | False | False | False | validators: ProhibitNullCharactersValidator, ProhibitSurrogateCharactersValidator |
| `documents` | ListSerializer | False | True | False | False | - |
| `created_at` | DateTimeField | False | True | False | False | - |

### `ContractInvoiceDocumentCreateSerializer`

| Field | Type | Required | Read-only | Write-only | Allow null | Validation / choices |
|---|---|---:|---:|---:|---:|---|
| `id` | IntegerField | False | True | False | False | - |
| `invoice` | PrimaryKeyRelatedField | True | False | False | False | choices: 4, 3, 2, 1 |
| `file` | FileField | True | False | False | False | - |
| `uploaded_at` | DateTimeField | False | True | False | False | - |

### `ContractInvoiceDocumentSerializer`

| Field | Type | Required | Read-only | Write-only | Allow null | Validation / choices |
|---|---|---:|---:|---:|---:|---|
| `id` | IntegerField | False | True | False | False | - |
| `file` | FileField | True | False | False | False | - |
| `uploaded_at` | DateTimeField | False | True | False | False | - |

### `ContractInvoiceSerializer`

| Field | Type | Required | Read-only | Write-only | Allow null | Validation / choices |
|---|---|---:|---:|---:|---:|---|
| `id` | IntegerField | False | True | False | False | - |
| `project_name` | CharField | False | True | False | False | validators: ProhibitNullCharactersValidator, ProhibitSurrogateCharactersValidator |
| `contract` | PrimaryKeyRelatedField | True | False | False | False | choices: 3, 2, 1 |
| `subcontractor_name` | CharField | False | True | False | False | validators: ProhibitNullCharactersValidator, ProhibitSurrogateCharactersValidator |
| `invoice_number` | CharField | False | True | False | False | validators: ProhibitNullCharactersValidator, ProhibitSurrogateCharactersValidator |
| `invoice_date` | DateField | True | False | False | False | - |
| `due_date` | DateField | False | False | False | True | - |
| `description` | CharField | False | False | False | False | validators: ProhibitNullCharactersValidator, ProhibitSurrogateCharactersValidator |
| `amount` | DecimalField | True | False | False | False | validators: MinValueValidator |
| `status` | ChoiceField | False | False | False | False | choices: pending, approved, partially_paid, paid, cancelled |
| `created_at` | DateTimeField | False | True | False | False | - |

### `ContractListSerializer`

| Field | Type | Required | Read-only | Write-only | Allow null | Validation / choices |
|---|---|---:|---:|---:|---:|---|
| `id` | IntegerField | False | True | False | False | - |
| `contract_number` | CharField | False | True | False | False | validators: ProhibitNullCharactersValidator, ProhibitSurrogateCharactersValidator |
| `title` | CharField | True | False | False | False | validators: MaxLengthValidator, ProhibitNullCharactersValidator, ProhibitSurrogateCharactersValidator |
| `project` | PrimaryKeyRelatedField | True | False | False | False | choices: 6, 4, 5 |
| `project_name` | CharField | False | True | False | False | validators: ProhibitNullCharactersValidator, ProhibitSurrogateCharactersValidator |
| `retention_percentage` | DecimalField | False | False | False | False | validators: MaxValueValidator, MinValueValidator |
| `completion_percentage` | DecimalField | False | False | False | False | validators: MaxValueValidator, MinValueValidator |
| `subcontractor` | PrimaryKeyRelatedField | True | False | False | False | choices: 5, 1, 2, 4, 3 |
| `subcontractor_name` | CharField | False | True | False | False | validators: ProhibitNullCharactersValidator, ProhibitSurrogateCharactersValidator |
| `currency` | ChoiceField | False | False | False | False | choices: AFN, USD |
| `contract_value` | DecimalField | True | False | False | False | validators: MinValueValidator |
| `status` | ChoiceField | False | False | False | False | choices: draft, active, completed, terminated, cancelled |
| `status_display` | CharField | False | True | False | False | validators: ProhibitNullCharactersValidator, ProhibitSurrogateCharactersValidator |
| `start_date` | DateField | True | False | False | False | - |
| `end_date` | DateField | True | False | False | False | - |
| `created_at` | DateTimeField | False | True | False | False | - |
| `adjusted_contract_value` | ReadOnlyField | False | True | False | False | - |

### `ContractPaymentCreateSerializer`

| Field | Type | Required | Read-only | Write-only | Allow null | Validation / choices |
|---|---|---:|---:|---:|---:|---|
| `id` | IntegerField | False | True | False | False | - |
| `amount` | DecimalField | True | False | False | False | validators: MinValueValidator |
| `payment_date` | DateField | True | False | False | False | - |
| `payment_type` | ChoiceField | True | False | False | False | choices: advance, progress, retention_release, final, other |
| `payment_type_display` | CharField | False | True | False | False | validators: ProhibitNullCharactersValidator, ProhibitSurrogateCharactersValidator |
| `reference_number` | CharField | False | False | False | False | validators: MaxLengthValidator, ProhibitNullCharactersValidator, ProhibitSurrogateCharactersValidator |
| `notes` | CharField | False | False | False | False | validators: ProhibitNullCharactersValidator, ProhibitSurrogateCharactersValidator |
| `created_at` | DateTimeField | False | True | False | False | - |

### `ContractPaymentSerializer`

| Field | Type | Required | Read-only | Write-only | Allow null | Validation / choices |
|---|---|---:|---:|---:|---:|---|
| `id` | IntegerField | False | True | False | False | - |
| `contract` | PrimaryKeyRelatedField | True | False | False | False | choices: 3, 2, 1 |
| `amount` | DecimalField | True | False | False | False | validators: MinValueValidator |
| `payment_date` | DateField | True | False | False | False | - |
| `payment_type` | ChoiceField | True | False | False | False | choices: advance, progress, retention_release, final, other |
| `payment_type_display` | CharField | False | True | False | False | validators: ProhibitNullCharactersValidator, ProhibitSurrogateCharactersValidator |
| `reference_number` | CharField | False | False | False | False | validators: MaxLengthValidator, ProhibitNullCharactersValidator, ProhibitSurrogateCharactersValidator |
| `notes` | CharField | False | False | False | False | validators: ProhibitNullCharactersValidator, ProhibitSurrogateCharactersValidator |
| `created_at` | DateTimeField | False | True | False | False | - |

### `ContractReportFilterSerializer`

| Field | Type | Required | Read-only | Write-only | Allow null | Validation / choices |
|---|---|---:|---:|---:|---:|---|
| `start_date` | DateField | False | False | False | False | - |
| `end_date` | DateField | False | False | False | False | - |
| `export` | ChoiceField | False | False | False | False | choices: json, pdf |
| `project_id` | IntegerField | False | False | False | False | - |
| `subcontractor_id` | IntegerField | False | False | False | False | - |
| `status` | CharField | False | False | False | False | validators: ProhibitNullCharactersValidator, ProhibitSurrogateCharactersValidator |
| `currency` | CharField | False | False | False | False | validators: ProhibitNullCharactersValidator, ProhibitSurrogateCharactersValidator |

### `ContractSummarySerializer`

| Field | Type | Required | Read-only | Write-only | Allow null | Validation / choices |
|---|---|---:|---:|---:|---:|---|
| `total_contracts` | IntegerField | True | False | False | False | - |
| `status_breakdown` | DictField | True | False | False | False | - |
| `total_contract_value_usd` | DecimalField | True | False | False | False | - |
| `total_contract_value_afn` | DecimalField | True | False | False | False | - |
| `total_retention_held_usd` | DecimalField | True | False | False | False | - |
| `total_retention_held_afn` | DecimalField | True | False | False | False | - |
| `avg_completion` | FloatField | True | False | False | False | - |
| `total_payments_made_usd` | DecimalField | True | False | False | False | - |
| `total_payments_made_afn` | DecimalField | True | False | False | False | - |
| `total_payment_count` | IntegerField | True | False | False | False | - |
| `total_approved_variations_usd` | DecimalField | True | False | False | False | - |
| `total_approved_variations_afn` | DecimalField | True | False | False | False | - |
| `variation_count` | IntegerField | True | False | False | False | - |
| `contracts_ending_soon` | ListField | True | False | False | False | - |
| `overdue_contracts` | ListField | True | False | False | False | - |
| `by_currency` | ListField | True | False | False | False | - |

### `ContractVariationCreateSerializer`

| Field | Type | Required | Read-only | Write-only | Allow null | Validation / choices |
|---|---|---:|---:|---:|---:|---|
| `id` | IntegerField | False | True | False | False | - |
| `description` | CharField | True | False | False | False | validators: ProhibitNullCharactersValidator, ProhibitSurrogateCharactersValidator |
| `amount_change` | DecimalField | True | False | False | False | - |
| `days_added` | IntegerField | False | False | False | False | validators: MaxValueValidator, MinValueValidator |
| `date` | DateField | True | False | False | False | - |
| `approved` | BooleanField | False | False | False | False | - |
| `created_at` | DateTimeField | False | True | False | False | - |

### `ContractVariationSerializer`

| Field | Type | Required | Read-only | Write-only | Allow null | Validation / choices |
|---|---|---:|---:|---:|---:|---|
| `id` | IntegerField | False | True | False | False | - |
| `contract` | PrimaryKeyRelatedField | True | False | False | False | choices: 3, 2, 1 |
| `variation_number` | CharField | False | False | False | False | validators: MaxLengthValidator, ProhibitNullCharactersValidator, ProhibitSurrogateCharactersValidator |
| `description` | CharField | True | False | False | False | validators: ProhibitNullCharactersValidator, ProhibitSurrogateCharactersValidator |
| `amount_change` | DecimalField | True | False | False | False | - |
| `days_added` | IntegerField | False | False | False | False | validators: MaxValueValidator, MinValueValidator |
| `date` | DateField | True | False | False | False | - |
| `approved` | BooleanField | False | False | False | False | - |
| `created_at` | DateTimeField | False | True | False | False | - |

### `ContractWriteSerializer`

| Field | Type | Required | Read-only | Write-only | Allow null | Validation / choices |
|---|---|---:|---:|---:|---:|---|
| `project` | PrimaryKeyRelatedField | True | False | False | False | choices: 6, 4, 5 |
| `subcontractor` | PrimaryKeyRelatedField | True | False | False | False | choices: 5, 1, 2, 4, 3 |
| `contract_number` | CharField | False | True | False | False | validators: ProhibitNullCharactersValidator, ProhibitSurrogateCharactersValidator |
| `title` | CharField | True | False | False | False | validators: MaxLengthValidator, ProhibitNullCharactersValidator, ProhibitSurrogateCharactersValidator |
| `scope_of_work` | CharField | False | False | False | False | validators: ProhibitNullCharactersValidator, ProhibitSurrogateCharactersValidator |
| `contract_value` | DecimalField | True | False | False | False | validators: MinValueValidator |
| `currency` | ChoiceField | False | False | False | False | choices: AFN, USD |
| `retention_percentage` | DecimalField | False | False | False | False | validators: MaxValueValidator, MinValueValidator |
| `start_date` | DateField | True | False | False | False | - |
| `end_date` | DateField | True | False | False | False | - |
| `completion_percentage` | DecimalField | False | False | False | False | validators: MaxValueValidator, MinValueValidator |
| `status` | ChoiceField | False | False | False | False | choices: draft, active, completed, terminated, cancelled |
| `notes` | CharField | False | False | False | False | validators: ProhibitNullCharactersValidator, ProhibitSurrogateCharactersValidator |

### `CurrencyAmountSerializer`

| Field | Type | Required | Read-only | Write-only | Allow null | Validation / choices |
|---|---|---:|---:|---:|---:|---|
| `usd` | DecimalField | True | False | False | False | - |
| `afn` | DecimalField | True | False | False | False | - |

### `CurrencySummarySerializer`

| Field | Type | Required | Read-only | Write-only | Allow null | Validation / choices |
|---|---|---:|---:|---:|---:|---|
| `gross_usd` | DecimalField | True | False | False | False | - |
| `gross_afn` | DecimalField | True | False | False | False | - |
| `net_usd` | DecimalField | True | False | False | False | - |
| `net_afn` | DecimalField | True | False | False | False | - |
| `count` | IntegerField | True | False | False | False | - |
| `total_deductions_usd` | DecimalField | False | False | False | False | - |
| `total_deductions_afn` | DecimalField | False | False | False | False | - |
| `total_tax_usd` | DecimalField | False | False | False | False | - |
| `total_tax_afn` | DecimalField | False | False | False | False | - |
| `total_bonus_usd` | DecimalField | False | False | False | False | - |
| `total_bonus_afn` | DecimalField | False | False | False | False | - |
| `total_overtime_usd` | DecimalField | False | False | False | False | - |
| `total_overtime_afn` | DecimalField | False | False | False | False | - |
| `employee_net_usd` | DecimalField | False | False | False | False | - |
| `employee_net_afn` | DecimalField | False | False | False | False | - |
| `daily_worker_net_usd` | DecimalField | False | False | False | False | - |
| `daily_worker_net_afn` | DecimalField | False | False | False | False | - |

### `DailyWorkerListSerializer`

| Field | Type | Required | Read-only | Write-only | Allow null | Validation / choices |
|---|---|---:|---:|---:|---:|---|
| `id` | IntegerField | False | True | False | False | - |
| `worker_id` | CharField | False | True | False | False | validators: ProhibitNullCharactersValidator, ProhibitSurrogateCharactersValidator |
| `full_name` | CharField | True | False | False | False | validators: MaxLengthValidator, ProhibitNullCharactersValidator, ProhibitSurrogateCharactersValidator |
| `phone` | CharField | True | False | False | False | validators: MaxLengthValidator, ProhibitNullCharactersValidator, ProhibitSurrogateCharactersValidator |
| `skill_type` | ChoiceField | False | False | False | False | choices: mason, carpenter, electrician, painter, plumber, steel_fixer, driver, excavator_operator, helper, other |
| `trade` | CharField | False | True | False | False | validators: ProhibitNullCharactersValidator, ProhibitSurrogateCharactersValidator |
| `specialization` | CharField | False | False | False | False | validators: MaxLengthValidator, ProhibitNullCharactersValidator, ProhibitSurrogateCharactersValidator |
| `daily_rate` | DecimalField | True | False | False | False | validators: MinValueValidator |
| `overtime_hourly_rate` | DecimalField | False | False | False | False | validators: MinValueValidator |
| `currency` | ChoiceField | False | False | False | False | choices: AFN, USD |
| `assigned_project` | PrimaryKeyRelatedField | False | False | False | True | choices: 6, 4, 5 |
| `assigned_project_name` | CharField | False | True | False | False | validators: ProhibitNullCharactersValidator, ProhibitSurrogateCharactersValidator |
| `status` | ChoiceField | False | False | False | False | choices: active, inactive |
| `is_active` | BooleanField | False | True | False | False | - |
| `joining_date` | DateField | True | False | False | False | - |

### `DailyWorkerSerializer`

| Field | Type | Required | Read-only | Write-only | Allow null | Validation / choices |
|---|---|---:|---:|---:|---:|---|
| `id` | IntegerField | False | True | False | False | - |
| `assigned_project_name` | CharField | False | True | False | False | validators: ProhibitNullCharactersValidator, ProhibitSurrogateCharactersValidator |
| `total_days_worked` | SerializerMethodField | False | True | False | False | - |
| `total_earnings` | SerializerMethodField | False | True | False | False | - |
| `pending_advances` | SerializerMethodField | False | True | False | False | - |
| `trade` | CharField | False | True | False | False | validators: ProhibitNullCharactersValidator, ProhibitSurrogateCharactersValidator |
| `worker_id` | CharField | False | True | False | False | validators: ProhibitNullCharactersValidator, ProhibitSurrogateCharactersValidator |
| `full_name` | CharField | True | False | False | False | validators: MaxLengthValidator, ProhibitNullCharactersValidator, ProhibitSurrogateCharactersValidator |
| `father_name` | CharField | False | False | False | False | validators: MaxLengthValidator, ProhibitNullCharactersValidator, ProhibitSurrogateCharactersValidator |
| `phone` | CharField | True | False | False | False | validators: MaxLengthValidator, ProhibitNullCharactersValidator, ProhibitSurrogateCharactersValidator |
| `national_id` | CharField | False | False | False | True | validators: MaxLengthValidator, ProhibitNullCharactersValidator, ProhibitSurrogateCharactersValidator |
| `address` | CharField | False | False | False | False | validators: ProhibitNullCharactersValidator, ProhibitSurrogateCharactersValidator |
| `emergency_contact` | CharField | False | False | False | False | validators: MaxLengthValidator, ProhibitNullCharactersValidator, ProhibitSurrogateCharactersValidator |
| `daily_rate` | DecimalField | True | False | False | False | validators: MinValueValidator |
| `overtime_hourly_rate` | DecimalField | False | False | False | False | validators: MinValueValidator |
| `currency` | ChoiceField | False | False | False | False | choices: AFN, USD |
| `skill_type` | ChoiceField | False | False | False | False | choices: mason, carpenter, electrician, painter, plumber, steel_fixer, driver, excavator_operator, helper, other |
| `specialization` | CharField | False | False | False | False | validators: MaxLengthValidator, ProhibitNullCharactersValidator, ProhibitSurrogateCharactersValidator |
| `status` | ChoiceField | False | False | False | False | choices: active, inactive |
| `joining_date` | DateField | True | False | False | False | - |
| `notes` | CharField | False | False | False | False | validators: ProhibitNullCharactersValidator, ProhibitSurrogateCharactersValidator |
| `created_at` | DateTimeField | False | True | False | False | - |
| `updated_at` | DateTimeField | False | True | False | False | - |
| `assigned_project` | PrimaryKeyRelatedField | False | False | False | True | choices: 6, 4, 5 |

### `EmployeeListSerializer`

| Field | Type | Required | Read-only | Write-only | Allow null | Validation / choices |
|---|---|---:|---:|---:|---:|---|
| `id` | IntegerField | False | True | False | False | - |
| `employee_id` | CharField | False | True | False | False | validators: ProhibitNullCharactersValidator, ProhibitSurrogateCharactersValidator |
| `first_name` | CharField | True | False | False | False | validators: MaxLengthValidator, ProhibitNullCharactersValidator, ProhibitSurrogateCharactersValidator |
| `last_name` | CharField | True | False | False | False | validators: MaxLengthValidator, ProhibitNullCharactersValidator, ProhibitSurrogateCharactersValidator |
| `full_name` | ReadOnlyField | False | True | False | False | - |
| `department` | ChoiceField | True | False | False | False | choices: management, engineering, construction, administration, finance, hr, procurement, safety |
| `position` | CharField | True | False | False | False | validators: MaxLengthValidator, ProhibitNullCharactersValidator, ProhibitSurrogateCharactersValidator |
| `employment_type` | ChoiceField | False | False | False | False | choices: full_time, part_time, contract, temporary |
| `is_active` | BooleanField | False | False | False | False | - |
| `salary` | DecimalField | True | False | False | False | - |
| `hire_date` | DateField | True | False | False | False | - |

### `EmployeeReportFilterSerializer`

| Field | Type | Required | Read-only | Write-only | Allow null | Validation / choices |
|---|---|---:|---:|---:|---:|---|
| `department` | CharField | False | False | False | False | validators: ProhibitNullCharactersValidator, ProhibitSurrogateCharactersValidator |
| `employment_type` | CharField | False | False | False | False | validators: ProhibitNullCharactersValidator, ProhibitSurrogateCharactersValidator |
| `is_active` | BooleanField | False | False | False | True | - |
| `export` | ChoiceField | False | False | False | False | choices: json, pdf |

### `EmployeeSerializer`

| Field | Type | Required | Read-only | Write-only | Allow null | Validation / choices |
|---|---|---:|---:|---:|---:|---|
| `id` | IntegerField | False | True | False | False | - |
| `employee_id` | CharField | False | True | False | False | validators: ProhibitNullCharactersValidator, ProhibitSurrogateCharactersValidator |
| `first_name` | CharField | True | False | False | False | validators: MaxLengthValidator, ProhibitNullCharactersValidator, ProhibitSurrogateCharactersValidator |
| `last_name` | CharField | True | False | False | False | validators: MaxLengthValidator, ProhibitNullCharactersValidator, ProhibitSurrogateCharactersValidator |
| `full_name` | ReadOnlyField | False | True | False | False | - |
| `email` | EmailField | False | False | False | True | validators: UniqueValidator, MaxLengthValidator, ProhibitNullCharactersValidator, ProhibitSurrogateCharactersValidator, EmailValidator |
| `phone` | CharField | True | False | False | False | validators: MaxLengthValidator, ProhibitNullCharactersValidator, ProhibitSurrogateCharactersValidator |
| `address` | CharField | True | False | False | False | validators: ProhibitNullCharactersValidator, ProhibitSurrogateCharactersValidator |
| `department` | ChoiceField | True | False | False | False | choices: management, engineering, construction, administration, finance, hr, procurement, safety |
| `position` | CharField | True | False | False | False | validators: MaxLengthValidator, ProhibitNullCharactersValidator, ProhibitSurrogateCharactersValidator |
| `employment_type` | ChoiceField | False | False | False | False | choices: full_time, part_time, contract, temporary |
| `hire_date` | DateField | True | False | False | False | - |
| `termination_date` | DateField | False | False | False | True | - |
| `salary` | DecimalField | True | False | False | False | - |
| `hourly_rate` | DecimalField | False | False | False | True | For part-time/hourly workers |
| `emergency_contact_name` | CharField | False | False | False | False | validators: MaxLengthValidator, ProhibitNullCharactersValidator, ProhibitSurrogateCharactersValidator |
| `emergency_contact_phone` | CharField | False | False | False | False | validators: MaxLengthValidator, ProhibitNullCharactersValidator, ProhibitSurrogateCharactersValidator |
| `is_active` | BooleanField | False | False | False | False | - |
| `notes` | CharField | False | False | False | False | validators: ProhibitNullCharactersValidator, ProhibitSurrogateCharactersValidator |
| `total_payrolls` | SerializerMethodField | False | True | False | False | - |
| `latest_payroll` | SerializerMethodField | False | True | False | False | - |
| `created_at` | DateTimeField | False | True | False | False | - |
| `updated_at` | DateTimeField | False | True | False | False | - |

### `ExpenseReportFilterSerializer`

| Field | Type | Required | Read-only | Write-only | Allow null | Validation / choices |
|---|---|---:|---:|---:|---:|---|
| `start_date` | DateField | False | False | False | False | - |
| `end_date` | DateField | False | False | False | False | - |
| `export` | ChoiceField | False | False | False | False | choices: json, pdf |
| `project_id` | IntegerField | False | False | False | False | - |
| `expense_type` | CharField | False | False | False | False | validators: ProhibitNullCharactersValidator, ProhibitSurrogateCharactersValidator |

### `ExpenseSerializer`

| Field | Type | Required | Read-only | Write-only | Allow null | Validation / choices |
|---|---|---:|---:|---:|---:|---|
| `id` | IntegerField | False | True | False | False | - |
| `project` | PrimaryKeyRelatedField | True | False | False | False | choices: 6, 4, 5 |
| `project_name` | CharField | False | True | False | False | validators: ProhibitNullCharactersValidator, ProhibitSurrogateCharactersValidator |
| `serial_number` | IntegerField | False | True | False | False | Auto-generated per project |
| `expense_date` | DateField | True | False | False | False | - |
| `description` | CharField | True | False | False | False | validators: ProhibitNullCharactersValidator, ProhibitSurrogateCharactersValidator; Details of what the expense was for |
| `remarks` | CharField | False | False | False | False | validators: ProhibitNullCharactersValidator, ProhibitSurrogateCharactersValidator |
| `paid_to` | CharField | False | False | False | False | validators: MaxLengthValidator, ProhibitNullCharactersValidator, ProhibitSurrogateCharactersValidator; Person/company paid |
| `amount_afn` | DecimalField | False | False | False | False | Amount paid in Afghan Afghani |
| `amount_usd` | DecimalField | False | False | False | False | Amount paid in US Dollars |
| `exchange_rate` | DecimalField | False | False | False | False | Exchange rate (AFN per 1 USD) on expense date |
| `expense_type` | ChoiceField | False | False | False | False | choices: general, material, construction, staff_salary, daily_wage, contract_payment, equipment, utility, other |
| `total_usd` | DecimalField | False | True | False | False | - |
| `total_afn` | DecimalField | False | True | False | False | - |
| `created_at` | DateTimeField | False | True | False | False | - |
| `updated_at` | DateTimeField | False | True | False | False | - |

### `ExpenseSummarySerializer`

| Field | Type | Required | Read-only | Write-only | Allow null | Validation / choices |
|---|---|---:|---:|---:|---:|---|
| `total_expenses_afn` | DecimalField | True | False | False | False | - |
| `total_expenses_usd` | DecimalField | True | False | False | False | - |
| `total_expense_count` | IntegerField | True | False | False | False | - |
| `by_expense_type` | ListField | True | False | False | False | - |
| `monthly_trend` | ListField | True | False | False | False | - |
| `recent_expenses` | ListField | True | False | False | False | - |
| `by_project` | ListField | True | False | False | False | - |

### `ExpenseThisMonthSerializer`

| Field | Type | Required | Read-only | Write-only | Allow null | Validation / choices |
|---|---|---:|---:|---:|---:|---|
| `current_month` | DictField | True | False | False | False | - |
| `previous_month` | DictField | True | False | False | False | - |
| `change_percentage` | FloatField | True | False | False | False | - |
| `trend` | CharField | True | False | False | False | validators: ProhibitNullCharactersValidator, ProhibitSurrogateCharactersValidator |

### `FinancialOverviewSerializer`

| Field | Type | Required | Read-only | Write-only | Allow null | Validation / choices |
|---|---|---:|---:|---:|---:|---|
| `total_budget_all_projects` | DictField | True | False | False | False | - |
| `expenses` | DictField | True | False | False | False | - |
| `payroll` | DictField | True | False | False | False | - |
| `contracts` | DictField | True | False | False | False | - |
| `grand_total_outflow` | GrandTotalOutflowSerializer | True | False | False | False | - |

### `FinancialReportFilterSerializer`

| Field | Type | Required | Read-only | Write-only | Allow null | Validation / choices |
|---|---|---:|---:|---:|---:|---|
| `start_date` | DateField | False | False | False | False | - |
| `end_date` | DateField | False | False | False | False | - |
| `export` | ChoiceField | False | False | False | False | choices: json, pdf |
| `project_id` | IntegerField | False | False | False | False | - |

### `FinancialSummarySerializer`

| Field | Type | Required | Read-only | Write-only | Allow null | Validation / choices |
|---|---|---:|---:|---:|---:|---|
| `original_contract_value` | DecimalField | True | False | False | False | - |
| `retention_percentage` | DecimalField | True | False | False | False | - |
| `retention_amount` | DecimalField | True | False | False | False | - |
| `total_variation_amount` | DecimalField | True | False | False | False | - |
| `adjusted_contract_value` | DecimalField | True | False | False | False | - |
| `total_paid` | DecimalField | True | False | False | False | - |
| `remaining_amount` | DecimalField | True | False | False | False | - |
| `retention_balance` | DecimalField | True | False | False | False | - |
| `adjusted_end_date` | DateField | True | False | False | False | - |
| `completion_percentage` | DecimalField | True | False | False | False | - |
| `total_invoiced` | DecimalField | False | True | False | False | - |
| `invoice_balance` | DecimalField | False | True | False | False | - |

### `FullDashboardSerializer`

| Field | Type | Required | Read-only | Write-only | Allow null | Validation / choices |
|---|---|---:|---:|---:|---:|---|
| `project_overview` | ProjectOverviewSerializer | True | False | False | False | - |
| `financial_overview` | FinancialOverviewSerializer | True | False | False | False | - |
| `expense_summary` | ExpenseSummarySerializer | True | False | False | False | - |
| `expense_this_month` | ExpenseThisMonthSerializer | True | False | False | False | - |
| `workforce_summary` | WorkforceSummarySerializer | True | False | False | False | - |
| `attendance_summary` | AttendanceSummarySerializer | True | False | False | False | - |
| `payroll_summary` | PayrollSummarySerializer | True | False | False | False | - |
| `contract_summary` | ContractSummarySerializer | True | False | False | False | - |
| `subcontractor_summary` | SubcontractorSummarySerializer | True | False | False | False | - |
| `budget_comparison` | ListSerializer | True | False | False | False | - |
| `alerts` | AlertsSummarySerializer | True | False | False | False | - |
| `recent_activity` | ListSerializer | True | False | False | False | - |

### `GenerateWorkerPayrollSerializer`

| Field | Type | Required | Read-only | Write-only | Allow null | Validation / choices |
|---|---|---:|---:|---:|---:|---|
| `worker` | IntegerField | False | False | False | True | - |
| `worker_ids` | ListField | False | False | False | False | - |
| `project` | IntegerField | False | False | False | True | - |
| `period_start` | DateField | True | False | False | False | - |
| `period_end` | DateField | True | False | False | False | - |
| `payment_method` | ChoiceField | False | False | False | False | choices: cash, bank_transfer, mobile_money, check |
| `deductions` | DecimalField | False | False | False | False | - |
| `notes` | CharField | False | False | False | False | validators: ProhibitNullCharactersValidator, ProhibitSurrogateCharactersValidator |

### `GrandTotalOutflowSerializer`

| Field | Type | Required | Read-only | Write-only | Allow null | Validation / choices |
|---|---|---:|---:|---:|---:|---|
| `usd` | DecimalField | True | False | False | False | - |
| `afn` | DecimalField | True | False | False | False | - |

### `LoginSerializer`

| Field | Type | Required | Read-only | Write-only | Allow null | Validation / choices |
|---|---|---:|---:|---:|---:|---|
| `username` | CharField | True | False | False | False | validators: ProhibitNullCharactersValidator, ProhibitSurrogateCharactersValidator |
| `password` | CharField | True | False | True | False | validators: ProhibitNullCharactersValidator, ProhibitSurrogateCharactersValidator |

### `PayrollBulkCreateSerializer`

| Field | Type | Required | Read-only | Write-only | Allow null | Validation / choices |
|---|---|---:|---:|---:|---:|---|
| `employee_ids` | ListField | True | False | False | False | List of employee IDs to create payroll for |
| `payroll_period_start` | DateField | True | False | False | False | - |
| `payroll_period_end` | DateField | True | False | False | False | - |
| `bonus` | DecimalField | False | False | False | False | - |
| `allowances` | DecimalField | False | False | False | False | - |
| `deductions` | DecimalField | False | False | False | False | - |
| `tax_percentage` | DecimalField | False | False | False | False | Tax percentage to deduct from gross pay |
| `payment_method` | CharField | False | False | False | False | validators: MaxLengthValidator, ProhibitNullCharactersValidator, ProhibitSurrogateCharactersValidator |
| `notes` | CharField | False | False | False | False | validators: ProhibitNullCharactersValidator, ProhibitSurrogateCharactersValidator |

### `PayrollListSerializer`

| Field | Type | Required | Read-only | Write-only | Allow null | Validation / choices |
|---|---|---:|---:|---:|---:|---|
| `id` | IntegerField | False | True | False | False | - |
| `employee` | PrimaryKeyRelatedField | True | False | False | False | choices: 3, 2 |
| `employee_name` | CharField | False | True | False | False | validators: ProhibitNullCharactersValidator, ProhibitSurrogateCharactersValidator |
| `employee_id` | CharField | False | True | False | False | validators: ProhibitNullCharactersValidator, ProhibitSurrogateCharactersValidator |
| `payroll_period_start` | DateField | True | False | False | False | - |
| `payroll_period_end` | DateField | True | False | False | False | - |
| `currency` | ChoiceField | False | False | False | False | choices: AFN, USD |
| `gross_pay` | DecimalField | True | False | False | False | - |
| `net_pay` | DecimalField | True | False | False | False | - |
| `payment_date` | DateField | False | False | False | True | - |

### `PayrollPaymentMethodSerializer`

| Field | Type | Required | Read-only | Write-only | Allow null | Validation / choices |
|---|---|---:|---:|---:|---:|---|
| `payment_method` | CharField | True | False | False | False | validators: ProhibitNullCharactersValidator, ProhibitSurrogateCharactersValidator |
| `count` | IntegerField | True | False | False | False | - |
| `total_usd` | DecimalField | True | False | False | False | - |
| `total_afn` | DecimalField | True | False | False | False | - |

### `PayrollReportFilterSerializer`

| Field | Type | Required | Read-only | Write-only | Allow null | Validation / choices |
|---|---|---:|---:|---:|---:|---|
| `start_date` | DateField | False | False | False | False | - |
| `end_date` | DateField | False | False | False | False | - |
| `export` | ChoiceField | False | False | False | False | choices: json, pdf |
| `employee_id` | IntegerField | False | False | False | False | - |
| `currency` | CharField | False | False | False | False | validators: ProhibitNullCharactersValidator, ProhibitSurrogateCharactersValidator |
| `payment_method` | CharField | False | False | False | False | validators: ProhibitNullCharactersValidator, ProhibitSurrogateCharactersValidator |

### `PayrollSerializer`

| Field | Type | Required | Read-only | Write-only | Allow null | Validation / choices |
|---|---|---:|---:|---:|---:|---|
| `id` | IntegerField | False | True | False | False | - |
| `employee` | PrimaryKeyRelatedField | True | False | False | False | choices: 3, 2 |
| `employee_name` | CharField | False | True | False | False | validators: ProhibitNullCharactersValidator, ProhibitSurrogateCharactersValidator |
| `employee_id` | CharField | False | True | False | False | validators: ProhibitNullCharactersValidator, ProhibitSurrogateCharactersValidator |
| `payroll_period_start` | DateField | True | False | False | False | - |
| `payroll_period_end` | DateField | True | False | False | False | - |
| `basic_salary` | DecimalField | True | False | False | False | - |
| `overtime_hours` | DecimalField | False | False | False | False | - |
| `overtime_rate` | DecimalField | False | False | False | False | - |
| `overtime_amount` | DecimalField | False | True | False | False | - |
| `bonus` | DecimalField | False | False | False | False | - |
| `allowances` | DecimalField | False | False | False | False | - |
| `deductions` | DecimalField | False | False | False | False | - |
| `tax_deducted` | DecimalField | False | False | False | False | - |
| `currency` | ChoiceField | False | False | False | False | choices: AFN, USD |
| `gross_pay` | DecimalField | False | True | False | False | - |
| `net_pay` | DecimalField | False | True | False | False | - |
| `payment_method` | ChoiceField | False | False | False | False | choices: bank_transfer, check, cash |
| `payment_date` | DateField | False | False | False | True | - |
| `notes` | CharField | False | False | False | False | validators: ProhibitNullCharactersValidator, ProhibitSurrogateCharactersValidator |
| `created_at` | DateTimeField | False | True | False | False | - |
| `updated_at` | DateTimeField | False | True | False | False | - |

### `PayrollSummarySerializer`

| Field | Type | Required | Read-only | Write-only | Allow null | Validation / choices |
|---|---|---:|---:|---:|---:|---|
| `current_month` | CurrencySummarySerializer | True | False | False | False | - |
| `previous_month` | CurrencySummarySerializer | True | False | False | False | - |
| `payment_method_breakdown` | ListSerializer | True | False | False | False | - |
| `recent_payrolls` | ListSerializer | True | False | False | False | - |

### `PermissionSerializer`

| Field | Type | Required | Read-only | Write-only | Allow null | Validation / choices |
|---|---|---:|---:|---:|---:|---|
| `id` | IntegerField | False | True | False | False | - |
| `code` | CharField | True | False | False | False | validators: UniqueValidator, MaxLengthValidator, ProhibitNullCharactersValidator, ProhibitSurrogateCharactersValidator |
| `name` | CharField | True | False | False | False | validators: MaxLengthValidator, ProhibitNullCharactersValidator, ProhibitSurrogateCharactersValidator |
| `module` | CharField | True | False | False | False | validators: MaxLengthValidator, ProhibitNullCharactersValidator, ProhibitSurrogateCharactersValidator |

### `ProjectAssignmentSerializer`

| Field | Type | Required | Read-only | Write-only | Allow null | Validation / choices |
|---|---|---:|---:|---:|---:|---|
| `id` | IntegerField | False | True | False | False | - |
| `user` | PrimaryKeyRelatedField | True | False | False | False | choices: 1, 2, 3, 4, 5 |
| `project` | PrimaryKeyRelatedField | True | False | False | False | choices: 6, 4, 5 |
| `assigned_by` | PrimaryKeyRelatedField | False | True | False | True | - |
| `created_at` | DateTimeField | False | True | False | False | - |

### `ProjectExpenseSerializer`

| Field | Type | Required | Read-only | Write-only | Allow null | Validation / choices |
|---|---|---:|---:|---:|---:|---|
| `id` | IntegerField | False | True | False | False | - |
| `serial_number` | IntegerField | False | True | False | False | Auto-generated per project |
| `total_usd` | ReadOnlyField | False | True | False | False | - |
| `total_afn` | ReadOnlyField | False | True | False | False | - |

### `ProjectListSerializer`

| Field | Type | Required | Read-only | Write-only | Allow null | Validation / choices |
|---|---|---:|---:|---:|---:|---|
| `id` | IntegerField | False | True | False | False | - |
| `name` | CharField | True | False | False | False | validators: MaxLengthValidator, ProhibitNullCharactersValidator, ProhibitSurrogateCharactersValidator |
| `status` | ChoiceField | False | False | False | False | choices: planning, ongoing, completed, on_hold |
| `start_date` | DateField | True | False | False | False | - |
| `location` | CharField | True | False | False | False | validators: MaxLengthValidator, ProhibitNullCharactersValidator, ProhibitSurrogateCharactersValidator |
| `property_type` | ChoiceField | True | False | False | False | choices: residential, commercial, mixed |

### `ProjectOverviewSerializer`

| Field | Type | Required | Read-only | Write-only | Allow null | Validation / choices |
|---|---|---:|---:|---:|---:|---|
| `total_projects` | IntegerField | True | False | False | False | - |
| `status_breakdown` | DictField | True | False | False | False | - |
| `property_type_breakdown` | DictField | True | False | False | False | - |
| `total_estimated_budget` | DictField | True | False | False | False | - |
| `avg_estimated_budget` | DecimalField | True | False | False | False | - |
| `overdue_projects_count` | IntegerField | True | False | False | False | - |
| `overdue_projects` | ListField | True | False | False | False | - |

### `ProjectReportFilterSerializer`

| Field | Type | Required | Read-only | Write-only | Allow null | Validation / choices |
|---|---|---:|---:|---:|---:|---|
| `start_date` | DateField | False | False | False | False | - |
| `end_date` | DateField | False | False | False | False | - |
| `export` | ChoiceField | False | False | False | False | choices: json, pdf |
| `status` | CharField | False | False | False | False | validators: ProhibitNullCharactersValidator, ProhibitSurrogateCharactersValidator |
| `property_type` | CharField | False | False | False | False | validators: ProhibitNullCharactersValidator, ProhibitSurrogateCharactersValidator |

### `ProjectSerializer`

| Field | Type | Required | Read-only | Write-only | Allow null | Validation / choices |
|---|---|---:|---:|---:|---:|---|
| `id` | IntegerField | False | True | False | False | - |
| `total_expenses_usd` | SerializerMethodField | False | True | False | False | - |
| `total_expenses_afn` | SerializerMethodField | False | True | False | False | - |
| `total_contract_value` | SerializerMethodField | False | True | False | False | - |
| `total_contract_payments` | SerializerMethodField | False | True | False | False | - |
| `remaining_contract_balance` | SerializerMethodField | False | True | False | False | - |
| `worker_payroll_summary` | SerializerMethodField | False | True | False | False | - |
| `name` | CharField | True | False | False | False | validators: MaxLengthValidator, ProhibitNullCharactersValidator, ProhibitSurrogateCharactersValidator |
| `description` | CharField | False | False | False | False | validators: ProhibitNullCharactersValidator, ProhibitSurrogateCharactersValidator |
| `property_type` | ChoiceField | True | False | False | False | choices: residential, commercial, mixed |
| `location` | CharField | True | False | False | False | validators: MaxLengthValidator, ProhibitNullCharactersValidator, ProhibitSurrogateCharactersValidator |
| `total_floors` | IntegerField | False | False | False | False | validators: MaxValueValidator, MinValueValidator |
| `start_date` | DateField | True | False | False | False | - |
| `expected_completion_date` | DateField | False | False | False | True | - |
| `actual_completion_date` | DateField | False | False | False | True | - |
| `estimated_budget` | DecimalField | False | False | False | False | - |
| `budget_currency` | ChoiceField | False | False | False | False | choices: AFN, USD |
| `status` | ChoiceField | False | False | False | False | choices: planning, ongoing, completed, on_hold |
| `notes` | CharField | False | False | False | False | validators: ProhibitNullCharactersValidator, ProhibitSurrogateCharactersValidator |
| `created_at` | DateTimeField | False | True | False | False | - |
| `updated_at` | DateTimeField | False | True | False | False | - |

### `RecentPayrollSerializer`

| Field | Type | Required | Read-only | Write-only | Allow null | Validation / choices |
|---|---|---:|---:|---:|---:|---|
| `id` | IntegerField | True | False | False | False | - |
| `employee__first_name` | CharField | True | False | False | False | validators: ProhibitNullCharactersValidator, ProhibitSurrogateCharactersValidator |
| `employee__last_name` | CharField | True | False | False | False | validators: ProhibitNullCharactersValidator, ProhibitSurrogateCharactersValidator |
| `employee__employee_id` | CharField | True | False | False | False | validators: ProhibitNullCharactersValidator, ProhibitSurrogateCharactersValidator |
| `payroll_period_start` | DateField | True | False | False | False | - |
| `payroll_period_end` | DateField | True | False | False | False | - |
| `gross_pay` | DecimalField | True | False | False | False | - |
| `net_pay` | DecimalField | True | False | False | False | - |
| `currency` | CharField | True | False | False | False | validators: ProhibitNullCharactersValidator, ProhibitSurrogateCharactersValidator |
| `payment_date` | DateField | True | False | False | True | - |

### `RolePermissionCreateSerializer`

| Field | Type | Required | Read-only | Write-only | Allow null | Validation / choices |
|---|---|---:|---:|---:|---:|---|
| `id` | IntegerField | False | True | False | False | - |
| `role` | ChoiceField | True | False | False | False | choices: admin, manager, data_entry |
| `permission` | PrimaryKeyRelatedField | True | False | False | False | choices: 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 38, 39, 40, 41, 42, 43, 44, 45, 46, 47, 48, 49, 50, 51, 52, 53, 54, 55, 56, 57, 58, 59, 60, 61, 62, 63, 64, 65, 66, 67, 68, 69, 70, 71, 72, 73, 74, 75, 76, 77, 78, 79 |

### `RolePermissionSerializer`

| Field | Type | Required | Read-only | Write-only | Allow null | Validation / choices |
|---|---|---:|---:|---:|---:|---|
| `id` | IntegerField | False | True | False | False | - |
| `role` | ChoiceField | True | False | False | False | choices: admin, manager, data_entry |
| `permission` | PrimaryKeyRelatedField | True | False | False | False | choices: 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 38, 39, 40, 41, 42, 43, 44, 45, 46, 47, 48, 49, 50, 51, 52, 53, 54, 55, 56, 57, 58, 59, 60, 61, 62, 63, 64, 65, 66, 67, 68, 69, 70, 71, 72, 73, 74, 75, 76, 77, 78, 79 |
| `permission_code` | CharField | False | True | False | False | validators: ProhibitNullCharactersValidator, ProhibitSurrogateCharactersValidator |
| `permission_name` | CharField | False | True | False | False | validators: ProhibitNullCharactersValidator, ProhibitSurrogateCharactersValidator |
| `module` | CharField | False | True | False | False | validators: ProhibitNullCharactersValidator, ProhibitSurrogateCharactersValidator |

### `RoleSerializer`

| Field | Type | Required | Read-only | Write-only | Allow null | Validation / choices |
|---|---|---:|---:|---:|---:|---|
| `value` | CharField | True | False | False | False | validators: ProhibitNullCharactersValidator, ProhibitSurrogateCharactersValidator |
| `label` | CharField | True | False | False | False | validators: ProhibitNullCharactersValidator, ProhibitSurrogateCharactersValidator |

### `SubcontractorDetailSerializer`

| Field | Type | Required | Read-only | Write-only | Allow null | Validation / choices |
|---|---|---:|---:|---:|---:|---|
| `id` | IntegerField | False | True | False | False | - |
| `name` | CharField | True | False | False | False | validators: MaxLengthValidator, ProhibitNullCharactersValidator, ProhibitSurrogateCharactersValidator |
| `contact_person` | CharField | False | False | False | False | validators: MaxLengthValidator, ProhibitNullCharactersValidator, ProhibitSurrogateCharactersValidator |
| `phone` | CharField | False | False | False | False | validators: MaxLengthValidator, ProhibitNullCharactersValidator, ProhibitSurrogateCharactersValidator |
| `email` | EmailField | False | False | False | False | validators: MaxLengthValidator, ProhibitNullCharactersValidator, ProhibitSurrogateCharactersValidator, EmailValidator |
| `address` | CharField | False | False | False | False | validators: ProhibitNullCharactersValidator, ProhibitSurrogateCharactersValidator |
| `tax_number` | CharField | False | False | False | False | validators: MaxLengthValidator, ProhibitNullCharactersValidator, ProhibitSurrogateCharactersValidator |
| `registration_number` | CharField | False | False | False | False | validators: MaxLengthValidator, ProhibitNullCharactersValidator, ProhibitSurrogateCharactersValidator |
| `specialization` | ChoiceField | True | False | False | False | choices: concrete, steel, electrical, plumbing, finishing, excavation, hvac, landscaping, other |
| `specialization_display` | CharField | False | True | False | False | validators: ProhibitNullCharactersValidator, ProhibitSurrogateCharactersValidator |
| `notes` | CharField | False | False | False | False | validators: ProhibitNullCharactersValidator, ProhibitSurrogateCharactersValidator |
| `is_active` | BooleanField | False | False | False | False | - |
| `contracts` | SerializerMethodField | False | True | False | False | - |
| `financial_summary` | SerializerMethodField | False | True | False | False | - |
| `created_at` | DateTimeField | False | True | False | False | - |
| `updated_at` | DateTimeField | False | True | False | False | - |

### `SubcontractorFinancialSummarySerializer`

| Field | Type | Required | Read-only | Write-only | Allow null | Validation / choices |
|---|---|---:|---:|---:|---:|---|
| `total_contracts` | IntegerField | True | False | False | False | - |
| `active_contracts` | IntegerField | True | False | False | False | - |
| `total_contract_value` | DecimalField | True | False | False | False | - |
| `total_variation_amount` | DecimalField | True | False | False | False | - |
| `adjusted_contract_value` | DecimalField | True | False | False | False | - |
| `total_paid` | DecimalField | True | False | False | False | - |
| `remaining_amount` | DecimalField | True | False | False | False | - |
| `total_retention` | DecimalField | True | False | False | False | - |
| `retention_balance` | DecimalField | True | False | False | False | - |

### `SubcontractorListSerializer`

| Field | Type | Required | Read-only | Write-only | Allow null | Validation / choices |
|---|---|---:|---:|---:|---:|---|
| `id` | IntegerField | False | True | False | False | - |
| `name` | CharField | True | False | False | False | validators: MaxLengthValidator, ProhibitNullCharactersValidator, ProhibitSurrogateCharactersValidator |
| `contact_person` | CharField | False | False | False | False | validators: MaxLengthValidator, ProhibitNullCharactersValidator, ProhibitSurrogateCharactersValidator |
| `phone` | CharField | False | False | False | False | validators: MaxLengthValidator, ProhibitNullCharactersValidator, ProhibitSurrogateCharactersValidator |
| `email` | EmailField | False | False | False | False | validators: MaxLengthValidator, ProhibitNullCharactersValidator, ProhibitSurrogateCharactersValidator, EmailValidator |
| `specialization` | ChoiceField | True | False | False | False | choices: concrete, steel, electrical, plumbing, finishing, excavation, hvac, landscaping, other |
| `specialization_display` | CharField | False | True | False | False | validators: ProhibitNullCharactersValidator, ProhibitSurrogateCharactersValidator |
| `is_active` | BooleanField | False | False | False | False | - |
| `contract_count` | SerializerMethodField | False | True | False | False | - |
| `created_at` | DateTimeField | False | True | False | False | - |
| `updated_at` | DateTimeField | False | True | False | False | - |

### `SubcontractorSummarySerializer`

| Field | Type | Required | Read-only | Write-only | Allow null | Validation / choices |
|---|---|---:|---:|---:|---:|---|
| `total_subcontractors` | IntegerField | True | False | False | False | - |
| `active_subcontractors` | IntegerField | True | False | False | False | - |
| `inactive_subcontractors` | IntegerField | True | False | False | False | - |
| `specialization_breakdown` | ListField | True | False | False | False | - |
| `top_subcontractors_by_value` | ListField | True | False | False | False | - |

### `UserCreateSerializer`

| Field | Type | Required | Read-only | Write-only | Allow null | Validation / choices |
|---|---|---:|---:|---:|---:|---|
| `id` | IntegerField | False | True | False | False | - |
| `username` | CharField | True | False | False | False | validators: UnicodeUsernameValidator, UniqueValidator, MaxLengthValidator, ProhibitNullCharactersValidator, ProhibitSurrogateCharactersValidator; Required. 150 characters or fewer. Letters, digits and @/./+/-/_ only. |
| `email` | EmailField | False | False | False | False | validators: MaxLengthValidator, ProhibitNullCharactersValidator, ProhibitSurrogateCharactersValidator, EmailValidator |
| `first_name` | CharField | False | False | False | False | validators: MaxLengthValidator, ProhibitNullCharactersValidator, ProhibitSurrogateCharactersValidator |
| `last_name` | CharField | False | False | False | False | validators: MaxLengthValidator, ProhibitNullCharactersValidator, ProhibitSurrogateCharactersValidator |
| `is_active` | BooleanField | False | False | False | False | Designates whether this user should be treated as active. Unselect this instead of deleting accounts. |
| `role` | CharField | False | False | True | False | validators: ProhibitNullCharactersValidator, ProhibitSurrogateCharactersValidator |
| `permissions` | SerializerMethodField | False | True | False | False | - |
| `password` | CharField | True | False | True | False | validators: MinLengthValidator, ProhibitNullCharactersValidator, ProhibitSurrogateCharactersValidator |

### `UserPermissionOverrideSerializer`

| Field | Type | Required | Read-only | Write-only | Allow null | Validation / choices |
|---|---|---:|---:|---:|---:|---|
| `id` | IntegerField | False | True | False | False | - |
| `user` | PrimaryKeyRelatedField | True | False | False | False | choices: 1, 2, 3, 4, 5 |
| `permission` | PrimaryKeyRelatedField | True | False | False | False | choices: 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 38, 39, 40, 41, 42, 43, 44, 45, 46, 47, 48, 49, 50, 51, 52, 53, 54, 55, 56, 57, 58, 59, 60, 61, 62, 63, 64, 65, 66, 67, 68, 69, 70, 71, 72, 73, 74, 75, 76, 77, 78, 79 |
| `permission_code` | CharField | False | True | False | False | validators: ProhibitNullCharactersValidator, ProhibitSurrogateCharactersValidator |
| `effect` | ChoiceField | False | False | False | False | choices: allow, deny |
| `updated_at` | DateTimeField | False | True | False | False | - |

### `UserSerializer`

| Field | Type | Required | Read-only | Write-only | Allow null | Validation / choices |
|---|---|---:|---:|---:|---:|---|
| `id` | IntegerField | False | True | False | False | - |
| `username` | CharField | True | False | False | False | validators: UnicodeUsernameValidator, UniqueValidator, MaxLengthValidator, ProhibitNullCharactersValidator, ProhibitSurrogateCharactersValidator; Required. 150 characters or fewer. Letters, digits and @/./+/-/_ only. |
| `email` | EmailField | False | False | False | False | validators: MaxLengthValidator, ProhibitNullCharactersValidator, ProhibitSurrogateCharactersValidator, EmailValidator |
| `first_name` | CharField | False | False | False | False | validators: MaxLengthValidator, ProhibitNullCharactersValidator, ProhibitSurrogateCharactersValidator |
| `last_name` | CharField | False | False | False | False | validators: MaxLengthValidator, ProhibitNullCharactersValidator, ProhibitSurrogateCharactersValidator |
| `is_active` | BooleanField | False | False | False | False | Designates whether this user should be treated as active. Unselect this instead of deleting accounts. |
| `role` | CharField | False | False | True | False | validators: ProhibitNullCharactersValidator, ProhibitSurrogateCharactersValidator |
| `permissions` | SerializerMethodField | False | True | False | False | - |

### `WorkerAdvanceSerializer`

| Field | Type | Required | Read-only | Write-only | Allow null | Validation / choices |
|---|---|---:|---:|---:|---:|---|
| `id` | IntegerField | False | True | False | False | - |
| `worker_name` | CharField | False | True | False | False | validators: ProhibitNullCharactersValidator, ProhibitSurrogateCharactersValidator |
| `worker_code` | CharField | False | True | False | False | validators: ProhibitNullCharactersValidator, ProhibitSurrogateCharactersValidator |
| `status` | SerializerMethodField | False | True | False | False | - |
| `amount` | DecimalField | True | False | False | False | validators: MinValueValidator |
| `currency` | ChoiceField | False | False | False | False | choices: AFN, USD |
| `date` | DateField | True | False | False | False | - |
| `description` | CharField | False | False | False | False | validators: ProhibitNullCharactersValidator, ProhibitSurrogateCharactersValidator |
| `remaining_balance` | DecimalField | True | False | False | False | - |
| `created_at` | DateTimeField | False | True | False | False | - |
| `updated_at` | DateTimeField | False | True | False | False | - |
| `worker` | PrimaryKeyRelatedField | True | False | False | False | choices: 1 |
| `created_by` | PrimaryKeyRelatedField | False | True | False | True | - |

### `WorkerAttendanceSerializer`

| Field | Type | Required | Read-only | Write-only | Allow null | Validation / choices |
|---|---|---:|---:|---:|---:|---|
| `id` | IntegerField | False | True | False | False | - |
| `worker_name` | CharField | False | True | False | False | validators: ProhibitNullCharactersValidator, ProhibitSurrogateCharactersValidator |
| `worker_code` | CharField | False | True | False | False | validators: ProhibitNullCharactersValidator, ProhibitSurrogateCharactersValidator |
| `skill_type` | CharField | False | True | False | False | validators: ProhibitNullCharactersValidator, ProhibitSurrogateCharactersValidator |
| `trade` | CharField | False | True | False | False | validators: ProhibitNullCharactersValidator, ProhibitSurrogateCharactersValidator |
| `project_name` | CharField | False | True | False | False | validators: ProhibitNullCharactersValidator, ProhibitSurrogateCharactersValidator |
| `date` | DateField | True | False | False | False | - |
| `status` | ChoiceField | False | False | False | False | choices: present, absent, half_day, overtime |
| `overtime_hours` | DecimalField | False | False | False | False | validators: MinValueValidator |
| `notes` | CharField | False | False | False | False | validators: MaxLengthValidator, ProhibitNullCharactersValidator, ProhibitSurrogateCharactersValidator |
| `created_at` | DateTimeField | False | True | False | False | - |
| `updated_at` | DateTimeField | False | True | False | False | - |
| `worker` | PrimaryKeyRelatedField | True | False | False | False | choices: 1 |
| `project` | PrimaryKeyRelatedField | False | False | False | True | choices: 6, 4, 5 |
| `created_by` | PrimaryKeyRelatedField | False | True | False | True | - |

### `WorkerPayrollSerializer`

| Field | Type | Required | Read-only | Write-only | Allow null | Validation / choices |
|---|---|---:|---:|---:|---:|---|
| `id` | IntegerField | False | True | False | False | - |
| `worker_name` | CharField | False | True | False | False | validators: ProhibitNullCharactersValidator, ProhibitSurrogateCharactersValidator |
| `worker_id_code` | CharField | False | True | False | False | validators: ProhibitNullCharactersValidator, ProhibitSurrogateCharactersValidator |
| `project_name` | CharField | False | True | False | False | validators: ProhibitNullCharactersValidator, ProhibitSurrogateCharactersValidator |
| `total_days_worked` | DecimalField | False | True | False | False | - |
| `total_overtime_hours` | DecimalField | False | True | False | False | - |
| `net_pay` | DecimalField | False | True | False | False | - |
| `is_paid` | BooleanField | False | True | False | False | - |
| `period_start` | DateField | True | False | False | False | - |
| `period_end` | DateField | True | False | False | False | - |
| `present_days` | DecimalField | False | True | False | False | - |
| `half_days` | DecimalField | False | True | False | False | - |
| `absent_days` | DecimalField | False | True | False | False | - |
| `overtime_hours` | DecimalField | False | True | False | False | - |
| `daily_rate_applied` | DecimalField | False | False | False | False | - |
| `overtime_rate_applied` | DecimalField | False | False | False | False | - |
| `gross_amount` | DecimalField | False | True | False | False | - |
| `advances` | DecimalField | False | True | False | False | - |
| `deductions` | DecimalField | False | False | False | False | - |
| `net_amount` | DecimalField | False | True | False | False | - |
| `currency` | ChoiceField | False | False | False | False | choices: AFN, USD |
| `status` | ChoiceField | False | False | False | False | choices: draft, approved, paid |
| `payment_date` | DateField | False | False | False | True | - |
| `payment_method` | ChoiceField | False | False | False | False | choices: cash, bank_transfer, mobile_money, check |
| `notes` | CharField | False | False | False | False | validators: ProhibitNullCharactersValidator, ProhibitSurrogateCharactersValidator |
| `created_at` | DateTimeField | False | True | False | False | - |
| `updated_at` | DateTimeField | False | True | False | False | - |
| `worker` | PrimaryKeyRelatedField | True | False | False | False | choices: 1 |
| `project` | PrimaryKeyRelatedField | False | False | False | True | choices: 6, 4, 5 |
| `created_by` | PrimaryKeyRelatedField | False | True | False | True | - |

### `WorkforceSummarySerializer`

| Field | Type | Required | Read-only | Write-only | Allow null | Validation / choices |
|---|---|---:|---:|---:|---:|---|
| `total_employees` | IntegerField | True | False | False | False | - |
| `active_employees` | IntegerField | True | False | False | False | - |
| `inactive_employees` | IntegerField | True | False | False | False | - |
| `department_breakdown` | ListField | True | False | False | False | - |
| `employment_type_breakdown` | ListField | True | False | False | False | - |
| `total_monthly_salary` | DecimalField | True | False | False | False | - |
| `avg_salary` | DecimalField | True | False | False | False | - |
| `recent_hires` | ListField | True | False | False | False | - |

## Gaps, Duplicates, And Recommendations

### Undocumented Or Custom-Response Endpoints

- `GET /api/employees/attendance/export-pdf/` uses a custom response or no declared serializer (`AttendancePDFExportView`).
- `POST /api/auth/login/` uses a custom response or no declared serializer (`LoginView`).
- `POST /api/auth/logout/` uses a custom response or no declared serializer (`LogoutView`).
- `GET /api/auth/me/` uses a custom response or no declared serializer (`MeView`).
- `GET /api/auth/meta/` uses a custom response or no declared serializer (`roles_and_permissions`).
- `GET /api/contracts/export-pdf/` uses a custom response or no declared serializer (`ContractPDFExportView`).
- `GET /api/contracts/{id}/export-pdf/` uses a custom response or no declared serializer (`ContractDetailPDFView`).
- `GET /api/dashboard/` uses a custom response or no declared serializer (`FullDashboardView`).
- `GET /api/dashboard/activity/` uses a custom response or no declared serializer (`RecentActivityView`).
- `GET /api/dashboard/alerts/` uses a custom response or no declared serializer (`AlertsView`).
- `GET /api/dashboard/attendance/` uses a custom response or no declared serializer (`AttendanceSummaryView`).
- `GET /api/dashboard/budget-comparison/` uses a custom response or no declared serializer (`BudgetComparisonView`).
- `GET /api/dashboard/contracts/` uses a custom response or no declared serializer (`ContractSummaryView`).
- `GET /api/dashboard/expenses/` uses a custom response or no declared serializer (`ExpenseSummaryView`).
- `GET /api/dashboard/expenses/this-month/` uses a custom response or no declared serializer (`ExpenseThisMonthView`).
- `GET /api/dashboard/financial/` uses a custom response or no declared serializer (`FinancialOverviewView`).
- `GET /api/dashboard/payroll/` uses a custom response or no declared serializer (`PayrollSummaryView`).
- `GET /api/dashboard/projects/` uses a custom response or no declared serializer (`ProjectOverviewView`).
- `GET /api/dashboard/subcontractors/` uses a custom response or no declared serializer (`SubcontractorSummaryView`).
- `GET /api/dashboard/workforce/` uses a custom response or no declared serializer (`WorkforceSummaryView`).
- `GET /api/expenses/export-pdf/` uses a custom response or no declared serializer (`ExpensePDFExportView`).
- `GET /api/employees/payrolls/export-pdf/` uses a custom response or no declared serializer (`PayrollPDFExportView`).
- `GET /api/projects/` uses a custom response or no declared serializer (`project_list_create`).
- `POST /api/projects/` uses a custom response or no declared serializer (`project_list_create`).
- `GET /api/projects/{id}/export-pdf/` uses a custom response or no declared serializer (`ProjectPDFExportView`).
- `GET /api/schema/` uses a custom response or no declared serializer (`SchemaView`).

### Duplicate / Overlapping Endpoint Notes

- Format-suffix routes generated by DRF routers were intentionally excluded from this document to avoid duplicate documentation.
- The project exposes employees/payroll/attendance both through module include paths for PDF exports and through the root `/api/` router for REST resources. This is functional but can be confusing.

### Inconsistent Response Recommendations

- Several list endpoints use normal DRF pagination, while `ExpenseViewSet.list` wraps paginated data with a custom `results/totals` object. Standardize paginated response envelopes.
- PDF export endpoints return binary `application/pdf` responses but most do not declare explicit permissions or schema metadata.
- Dashboard and report endpoints return computed dictionaries rather than serializers tied to models; keep these serializers updated when service payloads change.
- Some endpoints use duplicate URL exposure (`/api/projects/` function view and `/api/{resource}/` router resources). Prefer one convention per module.
- Add explicit serializer classes for custom actions where possible to improve generated schema quality.
- Notifications module is not present in the codebase; Settings has permissions and audit retention endpoints but no general settings API.

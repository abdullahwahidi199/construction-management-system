import {
  createBrowserRouter,
  createRoutesFromElements,
  Route,
  RouterProvider,
} from "react-router-dom";
import RootLayout from "./RootLayout";
import { NotFoundPage, UnauthorizedPage } from "./components/common/StatusPage";
import LoginPage from "./auth/LoginPage";
import { ProtectedRoute, RoleRedirect } from "./auth/ProtectedRoute";
import { ADMIN_PANEL_PERMISSIONS, OPERATIONAL_PERMISSIONS, ROLES } from "./auth/roles";
import AdminRootLayout from "./admin/AdminRootLayout";
import AdminDashboard from "./admin/AdminDashboard";
import UserManagement from "./admin/UserManagement";
import PermissionManagement from "./admin/PermissionManagement";
import AuditLogsPage from "./admin/AuditLogsPage";
import SettingsPage from "./admin/SettingsPage";
import DataEntryRootLayout from "./dataEntry/DataEntryRootLayout";
import DataEntryDashboard from "./dataEntry/DataEntryDashboard";
import ManagerRootLayout from "./manager/ManagerRootLayout";
import ProjectsBase from "./manager/Projects/ProjectsBase";
import ProjectDetails from "./manager/Projects/ProjectDetails";
import ExpensesMain from "./manager/Expenses/ExpensesMain";
import ExpenseApprovalsPage from "./manager/Expenses/ExpenseApprovalsPage";
import EmployeesPage from "./components/pages/EmployeesPage";
import PayrollPage from "./components/pages/PayrollPage";
import AttendanceLayout from "./components/pages/attendance/AttendanceLayout";
import ContractsPage from "./components/pages/contracts/ContractsPage";
import ContractDetailsPage from "./components/pages/contracts/ContractDetailsPage";
import SubcontractorsPage from "./components/pages/contracts/SubcontractorsPage";
import ContractPaymentsPage from "./components/pages/contracts/ContractPaymentsPage";
import ContractVariationsPage from "./components/pages/contracts/ContractVariationsPage";
import ContractDocumentsPage from "./components/pages/contracts/ContractDocumentsPage";
import SubcontractorDetails from "./components/pages/contracts/SubctractorsDetailsPage";
import Dashboard from "./components/pages/Dashboard";
import ReportsPage from "./components/pages/reports/ReportsPage";
import DailyWorkersLayout from "./components/pages/DailyWorkersLayout";

const router = createBrowserRouter(
  createRoutesFromElements(
    <Route path="/" element={<RootLayout />}>
      <Route index element={<RoleRedirect />} />
      <Route path="login" element={<LoginPage />} />
      <Route path="unauthorized" element={<UnauthorizedPage />} />

      <Route
        element={
          <ProtectedRoute
            roles={[ROLES.ADMIN]}
            permissions={ADMIN_PANEL_PERMISSIONS}
          />
        }
      >
        <Route path="admin" element={<AdminRootLayout />}>
          <Route index element={<RoleRedirect />} />
          <Route path="dashboard" element={<AdminDashboard />} />
          <Route path="users" element={<UserManagement />} />
          <Route path="permissions" element={<PermissionManagement />} />
          <Route path="audit-logs" element={<AuditLogsPage />} />
          <Route path="settings" element={<SettingsPage />} />
        </Route>
      </Route>

      <Route
        element={
          <ProtectedRoute
            roles={[ROLES.ADMIN, ROLES.MANAGER]}
            permissions={OPERATIONAL_PERMISSIONS}
          />
        }
      >
        <Route path="manager" element={<ManagerRootLayout />}>
          <Route index element={<RoleRedirect />} />
          <Route path="dashboard" element={<Dashboard />} />

          <Route path="projects" element={<ProjectsBase />} />
          <Route path="projects/:id" element={<ProjectDetails />} />

          <Route path="expenses" element={<ExpensesMain />} />
          <Route path="expense-approvals" element={<ExpenseApprovalsPage />} />
          <Route path="employees" element={<EmployeesPage />} />
          <Route path="daily-workers" element={<DailyWorkersLayout />} />

          <Route path="payrolls" element={<PayrollPage />} />
          <Route path="attendance" element={<AttendanceLayout />} />

          <Route path="contracts" element={<ContractsPage />} />
          <Route path="contracts/:id" element={<ContractDetailsPage />} />
          <Route path="subcontractors" element={<SubcontractorsPage />} />
          <Route path="subcontractors/:id" element={<SubcontractorDetails />} />
          <Route path="contract-payments" element={<ContractPaymentsPage />} />
          <Route
            path="contract-variations"
            element={<ContractVariationsPage />}
          />
          <Route
            path="contract-documents"
            element={<ContractDocumentsPage />}
          />
          <Route path="reports" element={<ReportsPage />} />
          <Route path="settings" element={<SettingsPage />} />
        </Route>
      </Route>

      <Route element={<ProtectedRoute roles={[ROLES.DATA_ENTRY]} />}>
        <Route path="data-entry" element={<DataEntryRootLayout />}>
          <Route index element={<RoleRedirect />} />

          <Route path="dashboard" element={<DataEntryDashboard />} />

          <Route path="projects" element={<ProjectsBase />} />
          <Route path="projects/:id" element={<ProjectDetails />} />

          <Route path="expenses" element={<ExpensesMain dataEntryMode />} />

          <Route path="employees" element={<EmployeesPage />} />
          <Route path="daily-workers" element={<DailyWorkersLayout />} />
          <Route path="payrolls" element={<PayrollPage />} />

          <Route path="attendance" element={<AttendanceLayout />} />

          <Route path="contracts" element={<ContractsPage />} />
          <Route path="contracts/:id" element={<ContractDetailsPage />} />

          <Route path="subcontractors" element={<SubcontractorsPage />} />
          <Route path="subcontractors/:id" element={<SubcontractorDetails />} />

          <Route path="contract-payments" element={<ContractPaymentsPage />} />

          <Route
            path="contract-variations"
            element={<ContractVariationsPage />}
          />

          <Route
            path="contract-documents"
            element={<ContractDocumentsPage />}
          />

          <Route path="reports" element={<ReportsPage />} />
        </Route>
      </Route>

      <Route path="*" element={<NotFoundPage />} />
    </Route>,
  ),
);

function App() {
  return <RouterProvider router={router} />;
}

export default App;

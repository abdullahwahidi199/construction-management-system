import "./App.css";
import {
  createBrowserRouter,
  createRoutesFromElements,
  Route,
  RouterProvider,
} from "react-router-dom";
import RootLayout from "./RootLayout";
import LoginPage from "./auth/LoginPage";
import { ProtectedRoute, RoleRedirect } from "./auth/ProtectedRoute";
import { ROLES } from "./auth/roles";
import AdminRootLayout from "./admin/AdminRootLayout";
import AdminDashboard from "./admin/AdminDashboard";
import UserManagement from "./admin/UserManagement";
import PermissionManagement from "./admin/PermissionManagement";
import DataEntryRootLayout from "./dataEntry/DataEntryRootLayout";
import DataEntryDashboard from "./dataEntry/DataEntryDashboard";
import ManagerRootLayout from "./manager/ManagerRootLayout";
import ProjectsBase from "./manager/Projects/ProjectsBase";
import ProjectDetails from "./manager/Projects/ProjectDetails";
import ExpensesMain from "./manager/Expenses/ExpensesMain";
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

      <Route element={<ProtectedRoute roles={[ROLES.ADMIN]} />}>
        <Route path="admin" element={<AdminRootLayout />}>
          <Route index element={<RoleRedirect />} />
          <Route path="dashboard" element={<AdminDashboard />} />
          <Route path="users" element={<UserManagement />} />
          <Route path="permissions" element={<PermissionManagement />} />
        </Route>
      </Route>

      <Route element={<ProtectedRoute roles={[ROLES.ADMIN, ROLES.MANAGER]} />}>
        <Route path="manager" element={<ManagerRootLayout />}>
          <Route index element={<RoleRedirect />} />
          <Route path="dashboard" element={<Dashboard />} />

          <Route path="projects" element={<ProjectsBase />} />
          <Route path="projects/:id" element={<ProjectDetails />} />

          <Route path="expenses" element={<ExpensesMain />} />
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
    </Route>,
  ),
);

function App() {
  return <RouterProvider router={router} />;
}

export default App;

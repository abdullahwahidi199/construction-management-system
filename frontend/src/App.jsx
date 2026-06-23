import "./App.css";
import {
  createBrowserRouter,
  createRoutesFromElements,
  Route,
  RouterProvider,
} from "react-router-dom";
import RootLayout from "./RootLayout";
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

const router = createBrowserRouter(
  createRoutesFromElements(
    <Route path="/" element={<RootLayout />}>
      <Route path="manager" element={<ManagerRootLayout />}>
        <Route path="dashboard" element={<Dashboard />} />

        <Route path="projects" element={<ProjectsBase />} />
        <Route path="projects/:id" element={<ProjectDetails />} />

        <Route path="expenses" element={<ExpensesMain />} />
        <Route path="employees" element={<EmployeesPage />} />
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
        <Route path="contract-documents" element={<ContractDocumentsPage />} />
        <Route path="reports" element={<ReportsPage />} />
      </Route>
    </Route>,
  ),
);

function App() {
  return <RouterProvider router={router} />;
}

export default App;

import { useState } from "react";
import toast from "react-hot-toast";
import useFetch from "../hooks/useFetch";
import useDelete from "../hooks/useDelete";
import Header from "../components/Layout/Header";
import Modal from "../components/common/Modal";
import Loading from "../components/common/Loading";
import EmptyState from "../components/common/EmptyState";
import ConfirmDialog from "../components/common/ConfirmDialog";
import EmployeeCard from "../components/employees/EmployeeCard";
import EmployeeForm from "../components/employees/EmployeeForm";
import EmployeeDetail from "../components/employees/EmployeeDetail";

export default function EmployeesMain() {
  const { data: employees, loading, refetch } = useFetch("/employees/");
  const { deleteData } = useDelete();
  const [showForm, setShowForm] = useState(false);
  const [showDetail, setShowDetail] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [deptFilter, setDeptFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  const handleEdit = (employee) => {
    setSelectedEmployee(employee);
    setShowForm(true);
  };

  const handleView = (id) => {
    const employee = employees.find((emp) => emp.id === id);
    setSelectedEmployee(employee);
    setShowDetail(true);
  };

  const handleDelete = async () => {
    if (deleteConfirm) {
      try {
        await deleteData(`/employees/${deleteConfirm.id}/`);
        setDeleteConfirm(null);
        await refetch();
        toast.success("Employee deleted.");
      } catch {
        // Central API handling displays the user-facing error toast.
      }
    }
  };

  const handleSuccess = () => {
    setShowForm(false);
    setSelectedEmployee(null);
    refetch();
  };

  const filteredEmployees = Array.isArray(employees)
    ? employees.filter((emp) => {
        const matchesSearch =
          !searchQuery ||
          emp.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          emp.employee_id?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          emp.position?.toLowerCase().includes(searchQuery.toLowerCase());

        const matchesDept = !deptFilter || emp.department === deptFilter;
        const matchesStatus =
          !statusFilter ||
          (statusFilter === "active" ? emp.is_active : !emp.is_active);

        return matchesSearch && matchesDept && matchesStatus;
      })
    : [];

  const departments = [
    ...new Set(
      (Array.isArray(employees) ? employees : []).map((emp) => emp.department),
    ),
  ];

  return (
    <div>
      <Header
        title="Employees"
        subtitle={`${filteredEmployees.length} total employees`}
      >
        <button
          onClick={() => {
            setSelectedEmployee(null);
            setShowForm(true);
          }}
          className="px-4 py-2 rounded-lg text-sm font-medium text-white transition-colors"
          style={{ backgroundColor: "var(--primary)" }}
        >
          + Add Employee
        </button>
      </Header>

      {/* Filters */}
      <div className="flex gap-4 mb-6">
        <input
          type="text"
          placeholder="Search employees..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="flex-1 px-4 py-2 rounded-lg border text-sm"
          style={{
            backgroundColor: "var(--card)",
            color: "var(--text)",
            borderColor: "var(--border)",
            maxWidth: "300px",
          }}
        />
        <select
          value={deptFilter}
          onChange={(e) => setDeptFilter(e.target.value)}
          className="px-4 py-2 rounded-lg border text-sm"
          style={{
            backgroundColor: "var(--card)",
            color: "var(--text)",
            borderColor: "var(--border)",
          }}
        >
          <option value="">All Departments</option>
          {departments.map((dept) => (
            <option key={dept} value={dept}>
              {dept.replace("_", " ").toUpperCase()}
            </option>
          ))}
        </select>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-4 py-2 rounded-lg border text-sm"
          style={{
            backgroundColor: "var(--card)",
            color: "var(--text)",
            borderColor: "var(--border)",
          }}
        >
          <option value="">All Status</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
      </div>

      {loading ? (
        <Loading message="Loading employees..." />
      ) : filteredEmployees.length === 0 ? (
        <EmptyState
          icon="👥"
          title="No employees found"
          description="Get started by adding your first employee."
          action={
            <button
              onClick={() => {
                setSelectedEmployee(null);
                setShowForm(true);
              }}
              className="px-4 py-2 rounded-lg text-sm font-medium text-white"
              style={{ backgroundColor: "var(--primary)" }}
            >
              Add Employee
            </button>
          }
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredEmployees.map((employee) => (
            <EmployeeCard
              key={employee.id}
              employee={employee}
              onEdit={handleEdit}
              onView={handleView}
              onDelete={(emp) => setDeleteConfirm(emp)}
            />
          ))}
        </div>
      )}

      {/* Employee Form Modal */}
      <Modal
        isOpen={showForm}
        onClose={() => {
          setShowForm(false);
          setSelectedEmployee(null);
        }}
        title={selectedEmployee ? "Edit Employee" : "Add New Employee"}
        size="lg"
      >
        <EmployeeForm
          employee={selectedEmployee}
          onSuccess={handleSuccess}
          onCancel={() => {
            setShowForm(false);
            setSelectedEmployee(null);
          }}
        />
      </Modal>

      {/* Employee Detail Modal */}
      <Modal
        isOpen={showDetail}
        onClose={() => {
          setShowDetail(false);
          setSelectedEmployee(null);
        }}
        title=""
        size="lg"
      >
        {selectedEmployee && (
          <EmployeeDetail
            employee={selectedEmployee}
            onClose={() => {
              setShowDetail(false);
              setSelectedEmployee(null);
            }}
          />
        )}
      </Modal>

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={!!deleteConfirm}
        onClose={() => setDeleteConfirm(null)}
        onConfirm={handleDelete}
        title="Delete Employee"
        message={`Are you sure you want to delete ${deleteConfirm?.full_name}? This action cannot be undone.`}
      />
    </div>
  );
}

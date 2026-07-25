import { useState } from "react";
import toast from "react-hot-toast";
import useFetch from "../../hooks/useFetch";
import useDelete from "../../hooks/useDelete";
import Header from "../../components/Layout/Header";
import Modal from "../../components/common/Modal";
import Loading from "../../components/common/Loading";
import EmptyState from "../../components/common/EmptyState";
import ConfirmDialog from "../../components/common/ConfirmDialog";
import EmployeeCard from "../../components/employees/EmployeeCard";
import EmployeeForm from "../../components/employees/EmployeeForm";
import EmployeeDetail from "../../components/employees/EmployeeDetail";
import { useLanguage } from "../../hooks/useLanguage";
import { Filter, Search, X } from "lucide-react";

const RTL_LANGS = ["dr", "ps", "fa", "dar", "prs"];

export default function EmployeesPage() {
  const { t, lang } = useLanguage();
  const isRTL = RTL_LANGS.includes(lang);

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
      (Array.isArray(employees) ? employees : [])
        .map((emp) => emp.department)
        .filter(Boolean),
    ),
  ];
  const hasActiveFilters = Boolean(searchQuery || deptFilter || statusFilter);

  const clearFilters = () => {
    setSearchQuery("");
    setDeptFilter("");
    setStatusFilter("");
  };

  return (
    <div dir={isRTL ? "rtl" : "ltr"}>
      <Header
        title={t("EmployeesPage.title")}
        subtitle={t("EmployeesPage.subtitle", {
          count: filteredEmployees.length,
        })}
      >
        <button
          onClick={() => {
            setSelectedEmployee(null);
            setShowForm(true);
          }}
          className="px-4 py-2 rounded-lg text-sm font-medium text-white transition-colors"
          style={{ backgroundColor: "var(--primary)" }}
        >
          + {t("EmployeesPage.addEmployee")}
        </button>
      </Header>

      {/* Filters */}
      <section className="mb-6 rounded-xl border border-[var(--border)] bg-[var(--card)] p-3 sm:p-4">
        <div className="mb-3 flex items-center justify-between gap-3 sm:hidden">
          <div className="flex items-center gap-2 text-sm font-semibold text-[var(--text)]">
            <Filter className="h-4 w-4 text-[var(--primary)]" />
            {t("EmployeesPage.filters.title") || "Filters"}
          </div>
          {hasActiveFilters && (
            <button
              type="button"
              onClick={clearFilters}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-[var(--border)] px-3 text-sm text-[var(--text)]"
            >
              <X className="h-4 w-4" />
              {t("EmployeesPage.filters.clearFilters") || "Clear"}
            </button>
          )}
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-[minmax(14rem,1fr)_minmax(11rem,auto)_minmax(10rem,auto)_auto] sm:items-center">
          <div className="relative min-w-0">
            <Search
              className={`absolute top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--muted)] ${
                isRTL ? "right-3" : "left-3"
              }`}
            />
            <input
              type="text"
              placeholder={t("EmployeesPage.searchPlaceholder")}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={`min-h-12 w-full rounded-lg border border-[var(--border)] bg-[var(--bg)] px-4 py-3 text-base text-[var(--text)] outline-none focus:border-[var(--primary)] sm:min-h-10 sm:py-2 sm:text-sm ${
                isRTL ? "pr-10" : "pl-10"
              }`}
            />
          </div>
          <select
            value={deptFilter}
            onChange={(e) => setDeptFilter(e.target.value)}
            className="min-h-12 w-full rounded-lg border border-[var(--border)] bg-[var(--bg)] px-4 py-3 text-base text-[var(--text)] outline-none focus:border-[var(--primary)] sm:min-h-10 sm:py-2 sm:text-sm"
          >
            <option value="">{t("EmployeesPage.allDepartments")}</option>
            {departments.map((dept) => (
              <option key={dept} value={dept}>
                {dept.replace("_", " ").toUpperCase()}
              </option>
            ))}
          </select>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="min-h-12 w-full rounded-lg border border-[var(--border)] bg-[var(--bg)] px-4 py-3 text-base text-[var(--text)] outline-none focus:border-[var(--primary)] sm:min-h-10 sm:py-2 sm:text-sm"
          >
            <option value="">{t("EmployeesPage.allStatus")}</option>
            <option value="active">{t("EmployeesPage.active")}</option>
            <option value="inactive">{t("EmployeesPage.inactive")}</option>
          </select>
          {hasActiveFilters && (
            <button
              type="button"
              onClick={clearFilters}
              className="hidden h-10 items-center justify-center gap-2 rounded-lg border border-[var(--border)] px-3 text-sm font-medium text-[var(--text)] hover:bg-[var(--hover)] sm:inline-flex"
            >
              <X className="h-4 w-4" />
              {t("EmployeesPage.filters.clearFilters") || "Clear"}
            </button>
          )}
        </div>
      </section>

      {loading ? (
        <Loading message={t("EmployeesPage.loading")} />
      ) : filteredEmployees.length === 0 ? (
        <EmptyState
          icon="👥"
          title={t("EmployeesPage.noEmployeesFound")}
          description={t("EmployeesPage.noEmployeesDescription")}
          action={
            <button
              onClick={() => {
                setSelectedEmployee(null);
                setShowForm(true);
              }}
              className="px-4 py-2 rounded-lg text-sm font-medium text-white"
              style={{ backgroundColor: "var(--primary)" }}
            >
              {t("EmployeesPage.addEmployee")}
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
        title={
          selectedEmployee
            ? t("EmployeesPage.editEmployee")
            : t("EmployeesPage.addNewEmployee")
        }
        size="lg"
      >
        <EmployeeForm
          employeeId={selectedEmployee?.id}
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
            employeeId={selectedEmployee?.id}
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
        title={t("EmployeesPage.deleteTitle")}
        message={t("EmployeesPage.deleteMessage", {
          name: deleteConfirm?.full_name,
        })}
      />
    </div>
  );
}

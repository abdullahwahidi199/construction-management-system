import { useState } from "react";
import useFetch from "../../hooks/useFetch";
import useDelete from "../../hooks/useDelete";
import Header from "../../components/Layout/Header";
import Modal from "../../components/common/Modal";
import Loading from "../../components/common/Loading";
import EmptyState from "../../components/common/EmptyState";
import ConfirmDialog from "../../components/common/ConfirmDialog";
import PayrollForm from "../../components/payroll/PayrollForm";

export default function PayrollPage() {
  const { data: payrolls, loading, refetch } = useFetch("/payrolls/");
  const { data: employees } = useFetch("/employees/");
  const { deleteData } = useDelete();
  const [showForm, setShowForm] = useState(false);
  const [selectedPayroll, setSelectedPayroll] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [statusFilter, setStatusFilter] = useState("");
  const [employeeFilter, setEmployeeFilter] = useState("");

  const handleDelete = async () => {
    if (deleteConfirm) {
      await deleteData(`/payrolls/${deleteConfirm.id}/`);
      setDeleteConfirm(null);
      refetch();
    }
  };

  const handleSuccess = () => {
    setShowForm(false);
    setSelectedPayroll(null);
    refetch();
  };

  const handleStatusUpdate = async (payrollId, newStatus) => {
    try {
      await instance.patch(`/payrolls/${payrollId}/update_payment_status/`, {
        payment_status: newStatus,
      });
      refetch();
    } catch (err) {
      console.error("Error updating status:", err);
    }
  };

  const filteredPayrolls = Array.isArray(payrolls)
    ? payrolls.filter((p) => {
        const matchesStatus =
          !statusFilter || p.payment_status === statusFilter;
        const matchesEmployee =
          !employeeFilter || p.employee === parseInt(employeeFilter);
        return matchesStatus && matchesEmployee;
      })
    : [];

  const getStatusBadge = (status) => {
    const colors = {
      pending: { bg: "#f59e0b20", color: "#f59e0b" },
      processed: { bg: "#3b82f620", color: "#3b82f6" },
      paid: { bg: "#16a34a" + "20", color: "var(--success)" },
      cancelled: { bg: "#dc2626" + "20", color: "var(--danger)" },
    };
    return colors[status] || colors.pending;
  };

  const summaryByCurrency = Array.isArray(payrolls)
    ? payrolls.reduce((acc, p) => {
        const currency = p.currency || "AFN";
        const gross = parseFloat(p.gross_pay || 0);
        const net = parseFloat(p.net_pay || 0);

        if (!acc[currency]) {
          acc[currency] = {
            gross: 0,
            net: 0,
            count: 0,
            paid: 0,
          };
        }

        acc[currency].gross += gross;
        acc[currency].net += net;
        acc[currency].count += 1;

        if (p.payment_status === "paid") {
          acc[currency].paid += 1;
        }

        return acc;
      }, {})
    : {};

  return (
    <div>
      <Header title="Payroll" subtitle={`${filteredPayrolls.length} records`}>
        <button
          onClick={() => {
            setSelectedPayroll(null);
            setShowForm(true);
          }}
          className="px-4 py-2 rounded-lg text-sm font-medium text-white transition-colors"
          style={{ backgroundColor: "var(--primary)" }}
        >
          + New Payroll
        </button>
      </Header>

      {/* Filters */}
      <div className="flex gap-4 mb-6">
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
          <option value="pending">Pending</option>
          <option value="processed">Processed</option>
          <option value="paid">Paid</option>
          <option value="cancelled">Cancelled</option>
        </select>
        <select
          value={employeeFilter}
          onChange={(e) => setEmployeeFilter(e.target.value)}
          className="px-4 py-2 rounded-lg border text-sm"
          style={{
            backgroundColor: "var(--card)",
            color: "var(--text)",
            borderColor: "var(--border)",
          }}
        >
          <option value="">All Employees</option>
          {Array.isArray(employees) &&
            employees.map((emp) => (
              <option key={emp.id} value={emp.id}>
                {emp.full_name}
              </option>
            ))}
        </select>
      </div>

      {/* Summary Cards */}
      {/* Currency-aware Summary */}
      {Object.keys(summaryByCurrency).length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          {Object.entries(summaryByCurrency).map(([currency, data]) => (
            <div
              key={currency}
              className="p-4 rounded-lg border"
              style={{
                backgroundColor: "var(--card)",
                borderColor: "var(--border)",
              }}
            >
              <p
                className="text-sm mb-3 font-medium"
                style={{ color: "var(--text)" }}
              >
                Currency: {currency}
              </p>

              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span style={{ color: "var(--muted)" }}>Total Gross</span>
                  <span style={{ color: "var(--primary)" }}>
                    {currency} {data.gross.toLocaleString()}
                  </span>
                </div>

                <div className="flex justify-between text-sm">
                  <span style={{ color: "var(--muted)" }}>Total Net</span>
                  <span style={{ color: "var(--success)" }}>
                    {currency} {data.net.toLocaleString()}
                  </span>
                </div>

                <div className="flex justify-between text-sm">
                  <span style={{ color: "var(--muted)" }}>Records</span>
                  <span style={{ color: "var(--text)" }}>{data.count}</span>
                </div>

                <div className="flex justify-between text-sm">
                  <span style={{ color: "var(--muted)" }}>Paid</span>
                  <span style={{ color: "var(--success)" }}>{data.paid}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      {loading ? (
        <Loading message="Loading payroll records..." />
      ) : filteredPayrolls.length === 0 ? (
        <EmptyState
          icon="💰"
          title="No payroll records"
          description="Create your first payroll record to get started."
          action={
            <button
              onClick={() => {
                setSelectedPayroll(null);
                setShowForm(true);
              }}
              className="px-4 py-2 rounded-lg text-sm font-medium text-white"
              style={{ backgroundColor: "var(--primary)" }}
            >
              Create Payroll
            </button>
          }
        />
      ) : (
        <div
          className="rounded-xl border overflow-hidden"
          style={{ borderColor: "var(--border)" }}
        >
          <table className="w-full">
            <thead style={{ backgroundColor: "var(--hover)" }}>
              <tr>
                {["Employee", "Period", "Gross Pay", "Net Pay", "Actions"].map(
                  (header) => (
                    <th
                      key={header}
                      className="text-left px-4 py-3 text-xs font-semibold uppercase"
                      style={{ color: "var(--muted)" }}
                    >
                      {header}
                    </th>
                  ),
                )}
              </tr>
            </thead>
            <tbody>
              {filteredPayrolls.map((payroll) => (
                <tr
                  key={payroll.id}
                  className="border-t transition-colors"
                  style={{ borderColor: "var(--border)" }}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.backgroundColor = "var(--hover)")
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.backgroundColor = "transparent")
                  }
                >
                  <td className="px-4 py-3">
                    <p
                      className="font-medium text-sm"
                      style={{ color: "var(--text)" }}
                    >
                      {payroll.employee_name}
                    </p>
                    <p className="text-xs" style={{ color: "var(--muted)" }}>
                      {payroll.employee_id}
                    </p>
                  </td>
                  <td className="px-4 py-3">
                    <p className="text-sm" style={{ color: "var(--text)" }}>
                      {payroll.payroll_period_start}
                    </p>
                    <p className="text-xs" style={{ color: "var(--muted)" }}>
                      to {payroll.payroll_period_end}
                    </p>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className="font-medium text-sm"
                      style={{ color: "var(--text)" }}
                    >
                      {payroll.currency}
                      {parseFloat(payroll.gross_pay).toLocaleString()}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className="font-bold text-sm"
                      style={{ color: "var(--success)" }}
                    >
                      {payroll.currency}
                      {parseFloat(payroll.net_pay).toLocaleString()}
                    </span>
                  </td>

                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          setSelectedPayroll(payroll);
                          setShowForm(true);
                        }}
                        className="text-xs font-medium"
                        style={{ color: "var(--primary)" }}
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => setDeleteConfirm(payroll)}
                        className="text-xs font-medium"
                        style={{ color: "var(--danger)" }}
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Payroll Form Modal */}
      <Modal
        isOpen={showForm}
        onClose={() => {
          setShowForm(false);
          setSelectedPayroll(null);
        }}
        title={selectedPayroll ? "Edit Payroll" : "Create Payroll"}
        size="lg"
      >
        <PayrollForm
          employees={Array.isArray(employees) ? employees : []}
          payrollId={selectedPayroll?.id}
          onSuccess={handleSuccess}
          onCancel={() => {
            setShowForm(false);
            setSelectedPayroll(null);
          }}
        />
      </Modal>

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={!!deleteConfirm}
        onClose={() => setDeleteConfirm(null)}
        onConfirm={handleDelete}
        title="Delete Payroll"
        message={`Are you sure you want to delete this payroll record for ${deleteConfirm?.employee_name}?`}
      />
    </div>
  );
}

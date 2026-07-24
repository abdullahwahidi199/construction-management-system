import { useState } from "react";
import toast from "react-hot-toast";
import useFetch from "../../hooks/useFetch";
import useDelete from "../../hooks/useDelete";
import Header from "../../components/Layout/Header";
import Modal from "../../components/common/Modal";
import Loading from "../../components/common/Loading";
import EmptyState from "../../components/common/EmptyState";
import ConfirmDialog from "../../components/common/ConfirmDialog";
import PayrollForm from "../../components/payroll/PayrollForm";
import instance from "../../api/axiosInstance";
import PermissionWrapper from "../../auth/PermissionWrapper";
import { useLanguage } from "../../hooks/useLanguage";
import PayrollPrintModal from "./payrollPrintModal";
import { getFriendlyErrorMessage } from "../../utils/apiErrors";

export default function PayrollPage() {
  // const { data: payrolls, loading, refetch } = useFetch("/payrolls/");
  const { data: employees } = useFetch("/employees/");
  const { deleteData } = useDelete();
  const [showForm, setShowForm] = useState(false);
  const [selectedPayroll, setSelectedPayroll] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [statusFilter, setStatusFilter] = useState("");
  const [employeeFilter, setEmployeeFilter] = useState("");
  const [startDateFilter, setStartDateFilter] = useState("");
  const [endDateFilter, setEndDateFilter] = useState("");
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [selectedPayrollId, setSelectedPayrollId] = useState(null);
  const [exporting, setExporting] = useState(false);

  const { t } = useLanguage();

  const query = new URLSearchParams();

  // if (statusFilter) query.append("status", statusFilter);
  if (employeeFilter) query.append("employee_id", employeeFilter);
  if (startDateFilter) query.append("start_date", startDateFilter);
  if (endDateFilter) query.append("end_date", endDateFilter);

  const {
    data: payrolls,
    loading,
    refetch,
  } = useFetch(`/payrolls/?${query.toString()}`);
  const handleDelete = async () => {
    if (deleteConfirm) {
      try {
        await deleteData(`/payrolls/${deleteConfirm.id}/`);
        setDeleteConfirm(null);
        await refetch();
        toast.success("Payroll record deleted.");
      } catch {
        // Central API handling displays the user-facing error toast.
      }
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
      await refetch();
      toast.success("Payroll status updated.");
    } catch (err) {
      toast.error(getFriendlyErrorMessage(err, "Unable to save changes."));
    }
  };

  const handleDownloadPDF = async () => {
    setExporting(true);
    try {
      const response = await instance.get(
        `/employees/payrolls/export-pdf/?${query}`,
        {
          responseType: "blob",
        },
      );

      const url = window.URL.createObjectURL(
        new Blob([response.data], { type: "application/pdf" }),
      );

      const link = document.createElement("a");
      link.href = url;
      link.download = `payrolls-${new Date().toISOString().slice(0, 10)}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      toast.success("Payroll PDF exported.");
    } catch (error) {
      toast.error(getFriendlyErrorMessage(error, "Unable to export PDF."));
    } finally {
      setExporting(false);
    }
  };

  // const filteredPayrolls = Array.isArray(payrolls)
  //   ? payrolls.filter((p) => {
  //       const matchesStatus =
  //         !statusFilter || p.payment_status === statusFilter;

  //       const matchesEmployee =
  //         !employeeFilter || p.employee === parseInt(employeeFilter);

  //       const matchesStartDate =
  //         !startDateFilter ||
  //         new Date(p.payroll_period_start) >= new Date(startDateFilter);

  //       const matchesEndDate =
  //         !endDateFilter ||
  //         new Date(p.payroll_period_end) <= new Date(endDateFilter);

  //       return (
  //         matchesStatus && matchesEmployee && matchesStartDate && matchesEndDate
  //       );
  //     })
  //   : [];

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
      <Header
        title={t("PayrollPage.title")}
        subtitle={t("PayrollPage.records", { count: payrolls.length })}
      >
        <div className="flex gap-2">
          <button
            onClick={handleDownloadPDF}
            disabled={exporting}
            className="px-4 py-2 rounded-lg text-sm font-medium text-white transition-colors"
            style={{ backgroundColor: "var(--success)" }}
          >
            {exporting ? t("common.loading") : t("PayrollPage.downloadPdf")}
          </button>

          <button
            onClick={() => {
              setSelectedPayroll(null);
              setShowForm(true);
            }}
            className="px-4 py-2 rounded-lg text-sm font-medium text-white transition-colors"
            style={{ backgroundColor: "var(--primary)" }}
          >
            + {t("PayrollPage.newPayroll")}
          </button>
        </div>
      </Header>

      {/* Filters */}
      <div className="flex flex-wrap gap-4 mb-6">
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
          <option value="">{t("PayrollPage.filters.allStatus")}</option>
          <option value="pending">{t("PayrollPage.filters.pending")}</option>
          <option value="processed">
            {t("PayrollPage.filters.processed")}
          </option>
          <option value="paid">{t("PayrollPage.filters.paid")}</option>
          <option value="cancelled">
            {t("PayrollPage.filters.cancelled")}
          </option>
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
          <option value="">{t("PayrollPage.filters.allEmployees")}</option>
          {Array.isArray(employees) &&
            employees.map((emp) => (
              <option key={emp.id} value={emp.id}>
                {emp.full_name}
              </option>
            ))}
        </select>
        <input
          type="date"
          value={startDateFilter}
          onChange={(e) => setStartDateFilter(e.target.value)}
          className="px-4 py-2 rounded-lg border text-sm"
          style={{
            backgroundColor: "var(--card)",
            color: "var(--text)",
            borderColor: "var(--border)",
          }}
        />

        <input
          type="date"
          value={endDateFilter}
          onChange={(e) => setEndDateFilter(e.target.value)}
          className="px-4 py-2 rounded-lg border text-sm"
          style={{
            backgroundColor: "var(--card)",
            color: "var(--text)",
            borderColor: "var(--border)",
          }}
        />

        <button
          onClick={() => {
            setStatusFilter("");
            setEmployeeFilter("");
            setStartDateFilter("");
            setEndDateFilter("");
          }}
          className="px-4 py-2 rounded-lg text-sm"
          style={{
            backgroundColor: "var(--hover)",
            color: "var(--text)",
          }}
        >
          {t("PayrollPage.filters.clearFilters")}
        </button>
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
                {t("PayrollPage.summary.currency")}: {currency}
              </p>

              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span style={{ color: "var(--muted)" }}>
                    {t("PayrollPage.summary.totalGross")}
                  </span>
                  <span style={{ color: "var(--primary)" }}>
                    {currency} {data.gross.toLocaleString()}
                  </span>
                </div>

                <div className="flex justify-between text-sm">
                  <span style={{ color: "var(--muted)" }}>
                    {t("PayrollPage.summary.totalNet")}
                  </span>
                  <span style={{ color: "var(--success)" }}>
                    {currency} {data.net.toLocaleString()}
                  </span>
                </div>

                <div className="flex justify-between text-sm">
                  <span style={{ color: "var(--muted)" }}>
                    {t("PayrollPage.summary.records")}
                  </span>
                  <span style={{ color: "var(--text)" }}>{data.count}</span>
                </div>

                <div className="flex justify-between text-sm">
                  <span style={{ color: "var(--muted)" }}>
                    {t("PayrollPage.summary.paid")}
                  </span>
                  <span style={{ color: "var(--success)" }}>{data.paid}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      {loading ? (
        <Loading message={t("PayrollPage.loading")} />
      ) : payrolls.length === 0 ? (
        <EmptyState
          icon="💰"
          title={t("PayrollPage.empty.title")}
          description={t("PayrollPage.empty.description")}
          action={
            <button
              onClick={() => {
                setSelectedPayroll(null);
                setShowForm(true);
              }}
              className="px-4 py-2 rounded-lg text-sm font-medium text-white"
              style={{ backgroundColor: "var(--primary)" }}
            >
              {t("PayrollPage.empty.create")}
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
                {[
                  t("PayrollPage.table.employee"),
                  t("PayrollPage.table.period"),
                  t("PayrollPage.table.paymentDate"),
                  t("PayrollPage.table.grossPay"),
                  t("PayrollPage.table.netPay"),
                  t("PayrollPage.table.actions"),
                ].map((header) => (
                  <th
                    key={header}
                    className="text-start px-4 py-3 text-xs font-semibold uppercase"
                    style={{ color: "var(--muted)" }}
                  >
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {payrolls.map((payroll) => (
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
                      {t("PayrollPage.table.to")} {payroll.payroll_period_end}
                    </p>
                  </td>
                  <td className="px-4 py-3">
                    <p className="text-sm" style={{ color: "var(--text)" }}>
                      {payroll.payment_date}
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
                        {t("PayrollPage.table.edit")}
                      </button>
                      <PermissionWrapper permissions={["payrolls.delete"]}>
                        <button
                          onClick={() => setDeleteConfirm(payroll)}
                          className="text-xs font-medium"
                          style={{ color: "var(--danger)" }}
                        >
                          {t("PayrollPage.table.delete")}
                        </button>
                      </PermissionWrapper>
                      <div className="flex gap-2">
                        <button
                          onClick={() => {
                            setSelectedPayrollId(payroll.id);
                            setShowPrintModal(true);
                          }}
                          className="text-xs font-medium"
                          style={{ color: "var(--success)" }}
                        >
                          Print
                        </button>
                      </div>
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
        title={
          selectedPayroll
            ? t("PayrollPage.modal.editPayroll")
            : t("PayrollPage.modal.createPayroll")
        }
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
        title={t("PayrollPage.deleteDialog.title")}
        message={t("PayrollPage.deleteDialog.message", {
          employee: deleteConfirm?.employee_name,
        })}
      />
      <Modal
        isOpen={showPrintModal}
        onClose={() => {
          setShowPrintModal(false);
          setSelectedPayrollId(null);
        }}
        title="Payroll Details"
        size="xl"
      >
        {selectedPayrollId && (
          <PayrollPrintModal
            isOpen={showPrintModal}
            onClose={() => {
              setShowPrintModal(false);
              setSelectedPayrollId(null);
            }}
            payrollID={selectedPayrollId}
          />
        )}
      </Modal>
    </div>
  );
}

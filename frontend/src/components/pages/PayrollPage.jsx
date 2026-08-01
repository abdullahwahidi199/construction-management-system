import { useEffect, useState } from "react";
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
import PayrollPrintModal from "./PayrollPrintModal";
import { getFriendlyErrorMessage } from "../../utils/apiErrors";
import Button from "../ui/Button";
import { Download } from "lucide-react";
import CalendarDatePicker from "../common/CalendarDatePicker";
import CalendarMonthPicker from "../common/CalendarMonthPicker";
import { useCalendar } from "../../hooks/useCalendar";
import { CreditCard, HandCoins, ListChecks, UserRound } from "lucide-react";
import {
  currentMonthKey,
  formatMonthKey,
  monthBoundsFromKey,
  monthKeyFromDate,
} from "../../utils/calendar";

function numeric(value) {
  return Number.parseFloat(value || 0) || 0;
}

function money(value, currency = "AFN") {
  return `${currency} ${numeric(value).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function labelize(value) {
  return String(value || "pending").replace(/_/g, " ");
}

function getAdvanceMonthKey(advance, calendar) {
  return advance?.advance_month || monthKeyFromDate(advance?.date, calendar);
}

function getAdvanceMonthLabel(advance, calendar) {
  const monthKey = getAdvanceMonthKey(advance, calendar);
  return formatMonthKey(monthKey, calendar) || advance?.date || "-";
}

function getAdvanceAmountDeducted(advance) {
  return numeric(advance?.amount_deducted) ||
    Math.max(numeric(advance?.amount) - numeric(advance?.remaining_balance), 0);
}

function getAdvanceStatusLabel(advance) {
  if (advance?.advance_status_label) return advance.advance_status_label;
  if (advance?.status === "cancelled") return "Cancelled";
  if (numeric(advance?.remaining_balance) <= 0) return "Fully Deducted";
  if (numeric(advance?.remaining_balance) < numeric(advance?.amount)) {
    return "Partially Deducted";
  }
  return "Outstanding";
}

function groupAdvancesByMonth(advances, calendar) {
  const groups = new Map();
  [...advances]
    .sort((a, b) => String(b.date || "").localeCompare(String(a.date || "")))
    .forEach((advance) => {
      const monthKey = getAdvanceMonthKey(advance, calendar) || "unknown";
      if (!groups.has(monthKey)) {
        groups.set(monthKey, {
          key: monthKey,
          label: getAdvanceMonthLabel(advance, calendar),
          advances: [],
        });
      }
      groups.get(monthKey).advances.push(advance);
    });
  return [...groups.values()];
}

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
  const [activeSection, setActiveSection] = useState("payrolls");
  const [showAdvanceForm, setShowAdvanceForm] = useState(false);
  const [editingAdvance, setEditingAdvance] = useState(null);
  const [paymentTarget, setPaymentTarget] = useState(null);
  const [summaryEmployee, setSummaryEmployee] = useState("");

  const { t } = useLanguage();
  const { calendar, formatDate } = useCalendar("payroll");

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
  const {
    data: advances,
    loading: advancesLoading,
    refetch: refetchAdvances,
  } = useFetch("/salary-advances/");
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
    refetchAdvances();
  };

  const handlePaymentRecorded = async () => {
    setPaymentTarget(null);
    await refetch();
    toast.success("Payment recorded.");
  };

  const handleAdvanceSaved = async () => {
    setShowAdvanceForm(false);
    setEditingAdvance(null);
    await refetchAdvances();
    toast.success("Salary advance saved.");
  };

  const handleCancelAdvance = async (advance) => {
    try {
      await instance.patch(`/salary-advances/${advance.id}/`, { status: "cancelled" });
      await refetchAdvances();
      toast.success("Salary advance cancelled.");
    } catch (err) {
      toast.error(getFriendlyErrorMessage(err, "Unable to cancel advance."));
    }
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
      partially_paid: { bg: "#3b82f620", color: "#3b82f6" },
      fully_paid: { bg: "#16a34a" + "20", color: "var(--success)" },
      paid: { bg: "#16a34a20", color: "var(--success)" },
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
            advancesPaid: 0,
            advanceDeductions: 0,
            cashOutflow: 0,
            amountPaid: 0,
            balanceDue: 0,
            count: 0,
            paid: 0,
          };
        }

        acc[currency].gross += gross;
        acc[currency].net += net;
        acc[currency].advanceDeductions += numeric(p.advance_deductions);
        acc[currency].cashOutflow += net;
        acc[currency].amountPaid += numeric(p.amount_paid);
        acc[currency].balanceDue += numeric(p.balance_due);
        acc[currency].count += 1;

        if (p.payment_status === "fully_paid" || p.payment_status === "paid") {
          acc[currency].paid += 1;
        }

        return acc;
      }, {})
    : {};
  if (Array.isArray(advances)) {
    advances
      .filter((advance) => advance.status !== "cancelled")
      .forEach((advance) => {
        const currency = "AFN";
        if (!summaryByCurrency[currency]) {
          summaryByCurrency[currency] = {
            gross: 0,
            net: 0,
            advancesPaid: 0,
            advanceDeductions: 0,
            cashOutflow: 0,
            amountPaid: 0,
            balanceDue: 0,
            count: 0,
            paid: 0,
          };
        }
        const amount = numeric(advance.amount);
        summaryByCurrency[currency].advancesPaid += amount;
        summaryByCurrency[currency].cashOutflow += amount;
        summaryByCurrency[currency].amountPaid += amount;
      });
  }

  return (
    <div>
      <Header
        title={t("PayrollPage.title")}
        subtitle={t("PayrollPage.records", { count: payrolls.length })}
      >
        <div className="flex gap-2">
          <Button
            variant="secondary"
            onClick={handleDownloadPDF}
            disabled={exporting}
            leftIcon={<Download className="h-4 w-4" />}
          >
            {exporting ? t("common.loading") : t("PayrollPage.downloadPdf")}
          </Button>

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

      <div className="mb-6 grid grid-cols-1 gap-2 sm:grid-cols-3">
        {[
          ["payrolls", "Payrolls", ListChecks],
          ["advances", "Salary Advances", HandCoins],
          ["employees", "Employee Summary", UserRound],
        ].map(([id, label, Icon]) => (
          <button
            key={id}
            type="button"
            onClick={() => setActiveSection(id)}
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium"
            style={{
              borderColor: "var(--border)",
              backgroundColor: activeSection === id ? "var(--primary)" : "var(--card)",
              color: activeSection === id ? "#fff" : "var(--text)",
            }}
          >
            <Icon className="h-4 w-4" />
            {label}
          </button>
        ))}
      </div>

      {/* Filters */}
      {activeSection === "payrolls" && (
        <>
      <div className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:flex lg:flex-wrap">
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
        <div className="min-w-0 lg:min-w-[160px]">
          <CalendarDatePicker
          value={startDateFilter}
          onChange={setStartDateFilter}
          module="payroll"
          className="h-12 rounded-lg border px-4 py-2 text-base sm:text-sm"
          style={{
            backgroundColor: "var(--card)",
            color: "var(--text)",
            borderColor: "var(--border)",
          }}
          />
        </div>

        <div className="min-w-0 lg:min-w-[160px]">
          <CalendarDatePicker
          value={endDateFilter}
          onChange={setEndDateFilter}
          module="payroll"
          className="h-12 rounded-lg border px-4 py-2 text-base sm:text-sm"
          style={{
            backgroundColor: "var(--card)",
            color: "var(--text)",
            borderColor: "var(--border)",
          }}
          />
        </div>

        <button
          onClick={() => {
            setStatusFilter("");
            setEmployeeFilter("");
            setStartDateFilter("");
            setEndDateFilter("");
          }}
          className="h-12 rounded-lg px-4 py-2 text-sm"
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
                    Advances paid
                  </span>
                  <span style={{ color: "var(--danger)" }}>
                    {currency} {data.advancesPaid.toLocaleString()}
                  </span>
                </div>

                <div className="flex justify-between text-sm">
                  <span style={{ color: "var(--muted)" }}>
                    Advance deductions
                  </span>
                  <span style={{ color: "var(--warning)" }}>
                    {currency} {data.advanceDeductions.toLocaleString()}
                  </span>
                </div>

                <div className="flex justify-between text-sm">
                  <span style={{ color: "var(--muted)" }}>
                    Cash outflow
                  </span>
                  <span style={{ color: "var(--primary)" }}>
                    {currency} {data.cashOutflow.toLocaleString()}
                  </span>
                </div>

                <div className="flex justify-between text-sm">
                  <span style={{ color: "var(--muted)" }}>
                    Paid / balance
                  </span>
                  <span style={{ color: "var(--text)" }}>
                    {currency} {data.amountPaid.toLocaleString()} / {data.balanceDue.toLocaleString()}
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
          <div className="hidden overflow-x-auto md:block mobile-scrollbar">
          <table className="w-full min-w-[920px]">
            <thead style={{ backgroundColor: "var(--hover)" }}>
              <tr>
                {[
                  t("PayrollPage.table.employee"),
                  t("PayrollPage.table.period"),
                  t("PayrollPage.table.paymentDate"),
                  t("PayrollPage.table.grossPay"),
                  "Advances",
                  t("PayrollPage.table.netPay"),
                  "Payment Status",
                  "Paid / Balance",
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
                      {formatDate(payroll.payroll_period_start) || "-"}
                    </p>
                    <p className="text-xs" style={{ color: "var(--muted)" }}>
                      {t("PayrollPage.table.to")}{" "}
                      {formatDate(payroll.payroll_period_end) || "-"}
                    </p>
                  </td>
                  <td className="px-4 py-3">
                    <p className="text-sm" style={{ color: "var(--text)" }}>
                      {formatDate(payroll.payment_date) || "-"}
                    </p>
                  </td>

                  <td className="px-4 py-3">
                    <span
                      className="font-medium text-sm"
                      style={{ color: "var(--text)" }}
                    >
                      {money(payroll.gross_pay, payroll.currency)}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-sm text-[var(--danger)]">
                      {money(payroll.advance_deductions, payroll.currency)}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className="font-bold text-sm"
                      style={{ color: "var(--success)" }}
                    >
                      {money(payroll.net_pay, payroll.currency)}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className="rounded-full px-2.5 py-1 text-xs font-semibold capitalize"
                      style={getStatusBadge(payroll.payment_status)}
                    >
                      {labelize(payroll.payment_status)}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm">
                    <div>{money(payroll.amount_paid, payroll.currency)}</div>
                    <div className="text-xs text-[var(--muted)]">
                      Due {money(payroll.balance_due, payroll.currency)}
                    </div>
                  </td>

                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-2">
                      {numeric(payroll.balance_due) > 0 && (
                        <button
                          onClick={() => setPaymentTarget(payroll)}
                          className="text-xs font-medium"
                          style={{ color: "var(--success)" }}
                        >
                          Record payment
                        </button>
                      )}
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
                          Details
                        </button>
                      </div>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
          <div className="divide-y divide-[var(--border)] md:hidden">
            {payrolls.map((payroll) => (
              <article key={payroll.id} className="grid gap-4 p-4">
                <div className="flex min-w-0 items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h3 className="break-words text-base font-semibold text-[var(--text)]">
                      {payroll.employee_name}
                    </h3>
                    <p className="mt-1 text-sm text-[var(--muted)]">
                      {payroll.employee_id}
                    </p>
                  </div>
                  <span
                    className="shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold capitalize"
                    style={getStatusBadge(payroll.payment_status)}
                  >
                    {payroll.payment_status || "pending"}
                  </span>
                </div>

                <dl className="grid grid-cols-1 gap-3 min-[380px]:grid-cols-2">
                  <div>
                    <dt className="text-[11px] font-semibold uppercase tracking-wide text-[var(--muted)]">
                      {t("PayrollPage.table.period")}
                    </dt>
                    <dd className="mt-1 text-sm font-medium text-[var(--text)]">
                      {formatDate(payroll.payroll_period_start) || "-"}{" "}
                      {t("PayrollPage.table.to")}{" "}
                      {formatDate(payroll.payroll_period_end) || "-"}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-[11px] font-semibold uppercase tracking-wide text-[var(--muted)]">
                      {t("PayrollPage.table.paymentDate")}
                    </dt>
                    <dd className="mt-1 text-sm font-medium text-[var(--text)]">
                      {formatDate(payroll.payment_date) || "-"}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-[11px] font-semibold uppercase tracking-wide text-[var(--muted)]">
                      {t("PayrollPage.table.grossPay")}
                    </dt>
                    <dd className="mt-1 text-sm font-medium text-[var(--text)]">
                      {money(payroll.gross_pay, payroll.currency)}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-[11px] font-semibold uppercase tracking-wide text-[var(--muted)]">
                      Advances
                    </dt>
                    <dd className="mt-1 text-sm font-medium text-[var(--danger)]">
                      {money(payroll.advance_deductions, payroll.currency)}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-[11px] font-semibold uppercase tracking-wide text-[var(--muted)]">
                      {t("PayrollPage.table.netPay")}
                    </dt>
                    <dd className="mt-1 text-sm font-bold text-[var(--success)]">
                      {money(payroll.net_pay, payroll.currency)}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-[11px] font-semibold uppercase tracking-wide text-[var(--muted)]">
                      Paid / Balance
                    </dt>
                    <dd className="mt-1 text-sm font-medium text-[var(--text)]">
                      {money(payroll.amount_paid, payroll.currency)}
                      <span className="block text-xs text-[var(--muted)]">
                        Due {money(payroll.balance_due, payroll.currency)}
                      </span>
                    </dd>
                  </div>
                </dl>

                <div className="flex flex-wrap items-center justify-end gap-2 border-t border-[var(--border)] pt-3">
                  {numeric(payroll.balance_due) > 0 && (
                    <button
                      type="button"
                      onClick={() => setPaymentTarget(payroll)}
                      className="h-12 rounded-xl border border-[var(--border)] px-4 text-sm font-medium text-[var(--success)]"
                    >
                      Record payment
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedPayroll(payroll);
                      setShowForm(true);
                    }}
                    className="h-12 rounded-xl border border-[var(--border)] px-4 text-sm font-medium text-[var(--primary)]"
                  >
                    {t("PayrollPage.table.edit")}
                  </button>
                  <PermissionWrapper permissions={["payrolls.delete"]}>
                    <button
                      type="button"
                      onClick={() => setDeleteConfirm(payroll)}
                      className="h-12 rounded-xl border border-red-500/20 px-4 text-sm font-medium text-[var(--danger)]"
                    >
                      {t("PayrollPage.table.delete")}
                    </button>
                  </PermissionWrapper>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedPayrollId(payroll.id);
                      setShowPrintModal(true);
                    }}
                    className="h-12 rounded-xl border border-[var(--border)] px-4 text-sm font-medium text-[var(--success)]"
                  >
                    Details
                  </button>
                </div>
              </article>
            ))}
          </div>
        </div>
      )}
        </>
      )}

      {activeSection === "advances" && (
        <SalaryAdvancesPanel
          advances={Array.isArray(advances) ? advances : []}
          employees={Array.isArray(employees) ? employees : []}
          loading={advancesLoading}
          onCreate={() => {
            setEditingAdvance(null);
            setShowAdvanceForm(true);
          }}
          onEdit={(advance) => {
            setEditingAdvance(advance);
            setShowAdvanceForm(true);
          }}
          onCancelAdvance={handleCancelAdvance}
          calendar={calendar}
          formatDate={formatDate}
        />
      )}

      {activeSection === "employees" && (
        <EmployeePayrollWorkspace
          employees={Array.isArray(employees) ? employees : []}
          selectedEmployee={summaryEmployee}
          onSelectEmployee={setSummaryEmployee}
          calendar={calendar}
          formatDate={formatDate}
          onOpenPayroll={(payroll) => {
            setSelectedPayrollId(payroll.id);
            setShowPrintModal(true);
          }}
        />
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

      <Modal
        isOpen={showAdvanceForm}
        onClose={() => {
          setShowAdvanceForm(false);
          setEditingAdvance(null);
        }}
        title={editingAdvance ? "Edit Salary Advance" : "New Salary Advance"}
        size="md"
      >
        <SalaryAdvanceForm
          employees={Array.isArray(employees) ? employees : []}
          advance={editingAdvance}
          onSuccess={handleAdvanceSaved}
          onCancel={() => {
            setShowAdvanceForm(false);
            setEditingAdvance(null);
          }}
        />
      </Modal>

      <Modal
        isOpen={Boolean(paymentTarget)}
        onClose={() => setPaymentTarget(null)}
        title="Record Payroll Payment"
        size="md"
      >
        {paymentTarget && (
          <PayrollPaymentForm
            payroll={paymentTarget}
            onSuccess={handlePaymentRecorded}
            onCancel={() => setPaymentTarget(null)}
          />
        )}
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
    </div>
  );
}

function SalaryAdvancesPanel({
  advances,
  employees,
  loading,
  onCreate,
  onEdit,
  onCancelAdvance,
  calendar,
}) {
  const totals = advances.reduce(
    (acc, advance) => {
      if (advance.status !== "cancelled") {
        acc.given += numeric(advance.amount);
        acc.deducted += getAdvanceAmountDeducted(advance);
        acc.outstanding += numeric(advance.remaining_balance);
      }
      if (advance.status !== "cancelled" && numeric(advance.remaining_balance) > 0) {
        acc.active += 1;
      }
      return acc;
    },
    { given: 0, deducted: 0, outstanding: 0, active: 0 },
  );
  const groupedAdvances = groupAdvancesByMonth(advances, calendar);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-[var(--text)]">
            Salary Advances
          </h2>
          <p className="text-sm text-[var(--muted)]">
            Track employee advances until they are deducted from payroll.
          </p>
        </div>
        <button
          type="button"
          onClick={onCreate}
          className="rounded-lg px-4 py-2 text-sm font-medium text-white"
          style={{ backgroundColor: "var(--primary)" }}
        >
          New Advance
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
        <SummaryTile label="Total Given" value={money(totals.given)} />
        <SummaryTile label="Deducted Through Payroll" value={money(totals.deducted)} />
        <SummaryTile label="Outstanding" value={money(totals.outstanding)} tone="danger" />
        <SummaryTile label="Outstanding Advances" value={totals.active} />
      </div>

      <div className="overflow-hidden rounded-xl border" style={{ borderColor: "var(--border)" }}>
        {loading ? (
          <div className="p-5 text-sm text-[var(--muted)]">Loading advances...</div>
        ) : advances.length === 0 ? (
          <div className="p-5 text-sm text-[var(--muted)]">No salary advances recorded.</div>
        ) : (
          <div className="divide-y divide-[var(--border)]">
            {groupedAdvances.map((group) => (
              <section key={group.key} className="divide-y divide-[var(--border)]">
                <div className="bg-[var(--hover)] px-4 py-3">
                  <h3 className="text-sm font-semibold text-[var(--text)]">
                    {group.label}
                  </h3>
                </div>
                {group.advances.map((advance) => (
                  <article
                    key={advance.id}
                    className="grid gap-4 p-4 md:grid-cols-[1.2fr_0.8fr_0.8fr_0.8fr_0.9fr_auto]"
                  >
                    <div>
                      <h3 className="font-semibold text-[var(--text)]">
                        {advance.employee_name ||
                          employees.find((emp) => emp.id === advance.employee)?.full_name ||
                          "Employee"}
                      </h3>
                      <p className="text-sm text-[var(--muted)]">
                        {advance.reason || "No reason provided"}
                      </p>
                    </div>
                    <Metric label="Advance Month" value={getAdvanceMonthLabel(advance, calendar)} />
                    <Metric label="Original Amount" value={money(advance.amount)} />
                    <Metric label="Amount Deducted" value={money(getAdvanceAmountDeducted(advance))} />
                    <Metric label="Remaining" value={money(advance.remaining_balance)} />
                    <div className="flex flex-wrap items-center justify-end gap-2">
                      <span className="rounded-full bg-[var(--hover)] px-2.5 py-1 text-xs font-semibold">
                        {getAdvanceStatusLabel(advance)}
                      </span>
                      <button
                        type="button"
                        onClick={() => onEdit(advance)}
                        className="rounded border px-3 py-2 text-xs font-medium"
                        style={{ borderColor: "var(--border)" }}
                      >
                        Edit
                      </button>
                      {advance.status === "active" && (
                        <button
                          type="button"
                          onClick={() => onCancelAdvance(advance)}
                          className="rounded border border-red-500/20 px-3 py-2 text-xs font-medium text-[var(--danger)]"
                        >
                          Cancel
                        </button>
                      )}
                    </div>
                  </article>
                ))}
              </section>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function SalaryAdvanceForm({ employees, advance, onSuccess, onCancel }) {
  const { calendar } = useCalendar("payroll");
  const initialAdvanceMonth =
    monthKeyFromDate(advance?.date, calendar) || currentMonthKey(calendar);
  const [formData, setFormData] = useState({
    employee: advance?.employee || "",
    amount: advance?.amount || "",
    advance_month: initialAdvanceMonth,
    date: advance?.date || monthBoundsFromKey(initialAdvanceMonth, calendar).start,
    reason: advance?.reason || "",
    notes: advance?.notes || "",
    status: advance?.status || "active",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const advanceMonth =
      monthKeyFromDate(advance?.date, calendar) || currentMonthKey(calendar);
    setFormData((prev) => ({
      ...prev,
      employee: advance?.employee || prev.employee || "",
      amount: advance?.amount || prev.amount || "",
      advance_month: advanceMonth,
      date: advance?.date || monthBoundsFromKey(advanceMonth, calendar).start,
      reason: advance?.reason || prev.reason || "",
      notes: advance?.notes || prev.notes || "",
      status: advance?.status || prev.status || "active",
    }));
  }, [advance, calendar]);

  const handleAdvanceMonthChange = (value) => {
    const bounds = monthBoundsFromKey(value, calendar);
    setFormData((prev) => ({
      ...prev,
      advance_month: value,
      date: bounds.start,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    const bounds = monthBoundsFromKey(formData.advance_month, calendar);
    if (!bounds.start) {
      setError("Please select a valid advance month.");
      return;
    }
    try {
      setSaving(true);
      const payload = {
        ...formData,
        date: bounds.start,
        employee: Number(formData.employee),
        amount: numeric(formData.amount),
      };
      delete payload.advance_month;
      if (advance?.id) {
        await instance.patch(`/salary-advances/${advance.id}/`, payload);
      } else {
        await instance.post("/salary-advances/", payload);
      }
      onSuccess?.();
    } catch (err) {
      setError(getFriendlyErrorMessage(err, "Unable to save salary advance."));
    } finally {
      setSaving(false);
    }
  };

  const inputClass = "min-h-12 w-full rounded-lg border px-3 py-3 text-base sm:min-h-0 sm:py-2 sm:text-sm";
  const inputStyle = {
    backgroundColor: "var(--bg)",
    color: "var(--text)",
    borderColor: "var(--border)",
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && <p className="rounded-lg bg-red-500/10 px-3 py-2 text-sm text-[var(--danger)]">{error}</p>}
      <Field label="Employee">
        <select
          required
          value={formData.employee}
          disabled={Boolean(advance)}
          onChange={(event) => setFormData((prev) => ({ ...prev, employee: event.target.value }))}
          className={inputClass}
          style={inputStyle}
        >
          <option value="">Select employee</option>
          {employees.map((employee) => (
            <option key={employee.id} value={employee.id}>
              {employee.full_name} ({employee.employee_id})
            </option>
          ))}
        </select>
      </Field>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Amount">
          <input
            required
            type="number"
            min="0.01"
            step="0.01"
            value={formData.amount}
            disabled={Boolean(advance)}
            onChange={(event) => setFormData((prev) => ({ ...prev, amount: event.target.value }))}
            className={inputClass}
            style={inputStyle}
          />
        </Field>
        <CalendarMonthPicker
          label="Advance Month"
          required
          value={formData.advance_month}
          onChange={handleAdvanceMonthChange}
          module="payroll"
          calendar={calendar}
          className={inputClass}
          style={inputStyle}
        />
      </div>
      <Field label="Reason">
        <input
          value={formData.reason}
          onChange={(event) => setFormData((prev) => ({ ...prev, reason: event.target.value }))}
          className={inputClass}
          style={inputStyle}
        />
      </Field>
      {advance && (
        <Field label="Status">
          <select
            value={formData.status}
            onChange={(event) => setFormData((prev) => ({ ...prev, status: event.target.value }))}
            className={inputClass}
            style={inputStyle}
          >
            <option value="active">Active</option>
            <option value="deducted">Deducted</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </Field>
      )}
      <Field label="Notes">
        <textarea
          rows={3}
          value={formData.notes}
          onChange={(event) => setFormData((prev) => ({ ...prev, notes: event.target.value }))}
          className={inputClass}
          style={inputStyle}
        />
      </Field>
      <FormActions onCancel={onCancel} saving={saving} submitLabel="Save Advance" />
    </form>
  );
}

function PayrollPaymentForm({ payroll, onSuccess, onCancel }) {
  const [formData, setFormData] = useState({
    amount: payroll.balance_due || "",
    payment_date: "",
    payment_method: payroll.payment_method || "bank_transfer",
    reference_number: "",
    notes: "",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    try {
      setSaving(true);
      await instance.post(`/payrolls/${payroll.id}/record_payment/`, {
        ...formData,
        amount: numeric(formData.amount),
      });
      onSuccess?.();
    } catch (err) {
      setError(getFriendlyErrorMessage(err, "Unable to record payment."));
    } finally {
      setSaving(false);
    }
  };

  const inputClass = "min-h-12 w-full rounded-lg border px-3 py-3 text-base sm:min-h-0 sm:py-2 sm:text-sm";
  const inputStyle = {
    backgroundColor: "var(--bg)",
    color: "var(--text)",
    borderColor: "var(--border)",
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && <p className="rounded-lg bg-red-500/10 px-3 py-2 text-sm text-[var(--danger)]">{error}</p>}
      <div className="rounded-lg bg-[var(--hover)] p-3 text-sm">
        <div className="flex justify-between">
          <span>Net salary</span>
          <strong>{money(payroll.net_pay, payroll.currency)}</strong>
        </div>
        <div className="mt-1 flex justify-between">
          <span>Remaining balance</span>
          <strong>{money(payroll.balance_due, payroll.currency)}</strong>
        </div>
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Amount">
          <input
            required
            type="number"
            min="0.01"
            max={payroll.balance_due}
            step="0.01"
            value={formData.amount}
            onChange={(event) => setFormData((prev) => ({ ...prev, amount: event.target.value }))}
            className={inputClass}
            style={inputStyle}
          />
        </Field>
        <Field label="Payment Date">
          <CalendarDatePicker
            required
            value={formData.payment_date}
            onChange={(value) => setFormData((prev) => ({ ...prev, payment_date: value }))}
            module="payroll"
            className={inputClass}
            style={inputStyle}
          />
        </Field>
      </div>
      <Field label="Payment Method">
        <select
          value={formData.payment_method}
          onChange={(event) => setFormData((prev) => ({ ...prev, payment_method: event.target.value }))}
          className={inputClass}
          style={inputStyle}
        >
          <option value="bank_transfer">Bank Transfer</option>
          <option value="check">Check</option>
          <option value="cash">Cash</option>
        </select>
      </Field>
      <Field label="Reference Number">
        <input
          value={formData.reference_number}
          onChange={(event) => setFormData((prev) => ({ ...prev, reference_number: event.target.value }))}
          className={inputClass}
          style={inputStyle}
        />
      </Field>
      <Field label="Notes">
        <textarea
          rows={3}
          value={formData.notes}
          onChange={(event) => setFormData((prev) => ({ ...prev, notes: event.target.value }))}
          className={inputClass}
          style={inputStyle}
        />
      </Field>
      <FormActions onCancel={onCancel} saving={saving} submitLabel="Record Payment" />
    </form>
  );
}

function EmployeePayrollWorkspace({
  employees,
  selectedEmployee,
  onSelectEmployee,
  calendar,
  formatDate,
  onOpenPayroll,
}) {
  const [summary, setSummary] = useState(null);
  const [payrollHistory, setPayrollHistory] = useState([]);
  const [advanceHistory, setAdvanceHistory] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!selectedEmployee && employees.length > 0) {
      onSelectEmployee(String(employees[0].id));
    }
  }, [employees, onSelectEmployee, selectedEmployee]);

  useEffect(() => {
    if (!selectedEmployee) return;
    const load = async () => {
      try {
        setLoading(true);
        const [summaryRes, payrollRes, advanceRes] = await Promise.all([
          instance.get(`/employees/${selectedEmployee}/payroll_summary/`),
          instance.get(`/employees/${selectedEmployee}/payroll_history/`),
          instance.get(`/employees/${selectedEmployee}/advance_history/`),
        ]);
        setSummary(summaryRes.data);
        setPayrollHistory(payrollRes.data?.results || payrollRes.data || []);
        setAdvanceHistory(advanceRes.data || []);
      } catch {
        setSummary(null);
        setPayrollHistory([]);
        setAdvanceHistory([]);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [selectedEmployee]);

  const selectedEmployeeData = employees.find((employee) => String(employee.id) === String(selectedEmployee));
  const summaryData = summary?.summary || {};
  const currency = "AFN";
  const groupedAdvanceHistory = groupAdvancesByMonth(advanceHistory, calendar);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-[var(--text)]">
            Employee Payroll Summary
          </h2>
          <p className="text-sm text-[var(--muted)]">
            Review salary, advances, payroll history, and payment status in one place.
          </p>
        </div>
        <select
          value={selectedEmployee}
          onChange={(event) => onSelectEmployee(event.target.value)}
          className="min-h-11 rounded-lg border px-3 text-sm"
          style={{
            backgroundColor: "var(--card)",
            color: "var(--text)",
            borderColor: "var(--border)",
          }}
        >
          {employees.map((employee) => (
            <option key={employee.id} value={employee.id}>
              {employee.full_name} ({employee.employee_id})
            </option>
          ))}
        </select>
      </div>

      {loading ? (
        <Loading message="Loading employee payroll summary..." />
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <SummaryTile label="Current Salary" value={money(selectedEmployeeData?.salary, currency)} />
            <SummaryTile label="Outstanding Advances" value={money(summaryData.outstanding_advances, currency)} tone="danger" />
            <SummaryTile label="Advances Given" value={money(summaryData.total_advances_given, currency)} />
            <SummaryTile label="Advances Deducted" value={money(summaryData.total_advances_deducted, currency)} />
            <SummaryTile label="Payrolls Processed" value={summaryData.total_payrolls_processed || 0} />
            <SummaryTile label="Paid This Year" value={money(summaryData.total_amount_paid_this_year, currency)} tone="success" />
            <SummaryTile label="Last Payroll Date" value={formatDate(summaryData.last_payroll_date) || "-"} />
          </div>

          <section className="rounded-xl border" style={{ borderColor: "var(--border)" }}>
            <div className="border-b p-4" style={{ borderColor: "var(--border)" }}>
              <h3 className="font-semibold">Payroll History</h3>
            </div>
            <div className="divide-y divide-[var(--border)]">
              {payrollHistory.length === 0 ? (
                <p className="p-4 text-sm text-[var(--muted)]">No payrolls processed yet.</p>
              ) : (
                payrollHistory.map((payroll) => (
                  <article key={payroll.id} className="grid gap-3 p-4 md:grid-cols-[1fr_repeat(5,0.75fr)_auto]">
                    <Metric
                      label="Period"
                      value={`${formatDate(payroll.payroll_period_start) || "-"} to ${formatDate(payroll.payroll_period_end) || "-"}`}
                    />
                    <Metric label="Gross" value={money(payroll.gross_pay, payroll.currency)} />
                    <Metric label="Deductions" value={money(payroll.total_deductions, payroll.currency)} />
                    <Metric label="Advances" value={money(payroll.advance_deductions, payroll.currency)} />
                    <Metric label="Net" value={money(payroll.net_pay, payroll.currency)} />
                    <Metric label="Payment" value={`${labelize(payroll.payment_status)} ${formatDate(payroll.payment_date) || ""}`} />
                    <button
                      type="button"
                      onClick={() => onOpenPayroll(payroll)}
                      className="rounded border px-3 py-2 text-sm font-medium text-[var(--primary)]"
                      style={{ borderColor: "var(--border)" }}
                    >
                      Open
                    </button>
                  </article>
                ))
              )}
            </div>
          </section>

          <section className="rounded-xl border" style={{ borderColor: "var(--border)" }}>
            <div className="border-b p-4" style={{ borderColor: "var(--border)" }}>
              <h3 className="font-semibold">Advance History</h3>
            </div>
            <div className="divide-y divide-[var(--border)]">
              {advanceHistory.length === 0 ? (
                <p className="p-4 text-sm text-[var(--muted)]">No advances recorded.</p>
              ) : (
                groupedAdvanceHistory.map((group) => (
                  <section key={group.key} className="divide-y divide-[var(--border)]">
                    <div className="bg-[var(--hover)] px-4 py-3">
                      <h4 className="text-sm font-semibold text-[var(--text)]">
                        {group.label}
                      </h4>
                    </div>
                    {group.advances.map((advance) => (
                      <article key={advance.id} className="grid gap-3 p-4 md:grid-cols-[1fr_repeat(4,0.75fr)]">
                        <Metric label="Advance Month" value={getAdvanceMonthLabel(advance, calendar)} />
                        <Metric label="Original Amount" value={money(advance.amount)} />
                        <Metric label="Amount Deducted" value={money(getAdvanceAmountDeducted(advance))} />
                        <Metric label="Remaining" value={money(advance.remaining_balance)} />
                        <Metric
                          label="Status"
                          value={
                            advance.deductions?.length
                              ? `${getAdvanceStatusLabel(advance)} - payroll #${advance.deductions
                                  .map((item) => item.payroll)
                                  .join(", #")}`
                              : getAdvanceStatusLabel(advance)
                          }
                        />
                      </article>
                    ))}
                  </section>
                ))
              )}
            </div>
          </section>
        </>
      )}
    </div>
  );
}

function SummaryTile({ label, value, tone }) {
  const color =
    tone === "danger"
      ? "var(--danger)"
      : tone === "success"
        ? "var(--success)"
        : "var(--text)";
  return (
    <div className="rounded-lg border p-4" style={{ borderColor: "var(--border)", backgroundColor: "var(--card)" }}>
      <p className="text-xs font-semibold uppercase tracking-wide text-[var(--muted)]">{label}</p>
      <p className="mt-2 text-lg font-bold" style={{ color }}>{value}</p>
    </div>
  );
}

function Metric({ label, value }) {
  return (
    <div>
      <dt className="text-[11px] font-semibold uppercase tracking-wide text-[var(--muted)]">{label}</dt>
      <dd className="mt-1 break-words text-sm font-medium text-[var(--text)]">{value || "-"}</dd>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-medium text-[var(--text)]">{label}</span>
      {children}
    </label>
  );
}

function FormActions({ onCancel, saving, submitLabel }) {
  return (
    <div className="flex flex-col-reverse gap-3 border-t border-[var(--border)] pt-4 sm:flex-row sm:justify-end">
      <button
        type="button"
        onClick={onCancel}
        className="min-h-12 rounded-lg px-4 py-2 text-sm font-medium"
        style={{ backgroundColor: "var(--hover)", color: "var(--text)" }}
      >
        Cancel
      </button>
      <button
        type="submit"
        disabled={saving}
        className="min-h-12 rounded-lg px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
        style={{ backgroundColor: "var(--primary)" }}
      >
        {saving ? "Saving..." : submitLabel}
      </button>
    </div>
  );
}

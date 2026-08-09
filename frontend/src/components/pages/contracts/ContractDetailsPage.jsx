// src/pages/contracts/ContractDetailsPage.jsx
import { useState, useCallback, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  ArrowRight,
  ArrowDownLeft,
  ArrowUpRight,
  CalendarDays,
  DollarSign,
  FileText,
  Filter,
  GitBranch,
  TrendingUp,
  Download,
  Loader2,
  Pencil,
  Plus,
  Receipt,
  Wallet,
  Save,
  Search,
  X,
} from "lucide-react";
import useFetch from "../../../hooks/useFetch";
import usePost from "../../../hooks/usePost";
import instance from "../../../api/axiosInstance";
import Card from "../../ui/Card";
import Button from "../../ui/Button";
import DeleteConfirmModal from "../../ui/DeleteConfirmModal";
import ContractStatusBadge from "../../contracts/ContractStatusBadge";
import ProgressBar from "../../contracts/ProgressBar";
import FinancialSummaryCard from "../../contracts/FinancialSummaryCard";
import PaymentTable from "../../contracts/PaymentTable";
import PaymentFormModal from "../../contracts/PaymentFormModal";
import VariationTable from "../../contracts/VariationTable";
import VariationFormModal from "../../contracts/VariationFormModal";
import DocumentTable from "../../contracts/DocumentTable";
import DocumentUploadModal from "../../contracts/DocumentUploadModal";
import ContractInvoicesPage from "./ContractInvoicesPage";
import PermissionWrapper from "../../../auth/PermissionWrapper";
import { useLanguage } from "../../../hooks/useLanguage";
import { useCalendar } from "../../../hooks/useCalendar";
import toast from "react-hot-toast";

export default function ContractDetailsPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState("info");
  const [timelineFilters, setTimelineFilters] = useState({
    type: "",
    search: "",
    date_from: "",
    date_to: "",
  });
  const [showProgressForm, setShowProgressForm] = useState(false);
  const [progressValue, setProgressValue] = useState("");
  const [progressError, setProgressError] = useState("");
  const [progressSaving, setProgressSaving] = useState(false);

  // Modals
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [editingPayment, setEditingPayment] = useState(null);
  const [deletePayment, setDeletePayment] = useState(null);

  const [showVariationForm, setShowVariationForm] = useState(false);
  const [editingVariation, setEditingVariation] = useState(null);
  const [deleteVariation, setDeleteVariation] = useState(null);

  const [showDocUpload, setShowDocUpload] = useState(false);
  const [deleteDoc, setDeleteDoc] = useState(null);
  const { t, lang } = useLanguage();
  const isRTL = lang === "dr" || lang === "ps";
  const BackIcon = isRTL ? ArrowRight : ArrowLeft;
  const { formatDate } = useCalendar("contracts");

  const TABS = [
    {
      key: "info",
      label: t("ContractDetailsPage.information"),
      icon: FileText,
    },
    {
      key: "financial",
      label: t("ContractDetailsPage.financial"),
      icon: DollarSign,
    },
    {
      key: "invoices",
      label: t("ContractDetailsPage.invoices"),
      icon: DollarSign,
    },
    {
      key: "payments",
      label: t("ContractDetailsPage.payments"),
      icon: TrendingUp,
    },
    {
      key: "variations",
      label: t("ContractDetailsPage.variations"),
      icon: GitBranch,
    },
    {
      key: "documents",
      label: t("ContractDetailsPage.documents"),
      icon: FileText,
    },
  ];

  // Fetch contract detail
  const {
    data: contract,
    loading,
    error,
    refetch,
  } = useFetch(`contracts/${id}/`);
  const timelineEndpoint = useMemo(() => {
    const params = new URLSearchParams();
    Object.entries(timelineFilters).forEach(([key, value]) => {
      if (value) params.set(key, value);
    });
    const query = params.toString();
    return `contracts/${id}/financial-timeline/${query ? `?${query}` : ""}`;
  }, [id, timelineFilters]);
  const {
    data: timelineData,
    loading: timelineLoading,
    refetch: refetchTimeline,
  } = useFetch(timelineEndpoint, { skipGlobalErrorToast: true });
  const { postData, loading: posting } = usePost();
  const [actionLoading, setActionLoading] = useState(false);

  const displayDate = (date) =>
    formatDate(date) || t("ContractDetailsPage.noData");

  const fmt = new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  const openCreatePayment = useCallback(() => {
    setActiveTab("payments");
    setEditingPayment(null);
    setShowPaymentForm(true);
  }, []);

  const openProgressForm = () => {
    setProgressValue(String(contract?.completion_percentage ?? 0));
    setProgressError("");
    setShowProgressForm(true);
  };

  const closeProgressForm = () => {
    if (!progressSaving) {
      setShowProgressForm(false);
      setProgressError("");
    }
  };

  const handleUpdateProgress = async (event) => {
    event.preventDefault();
    const rawValue = String(progressValue).trim();
    const parsedValue = Number(rawValue);

    if (
      !rawValue ||
      !Number.isFinite(parsedValue) ||
      parsedValue < 0 ||
      parsedValue > 100
    ) {
      setProgressError(t("ContractDetailsPage.progressRange"));
      return;
    }

    setProgressSaving(true);
    setProgressError("");
    try {
      await instance.patch(`contracts/${id}/`, {
        completion_percentage: parsedValue,
      });
      setShowProgressForm(false);
      refetch();
      toast.success(t("ContractDetailsPage.progressUpdated"));
    } catch (err) {
      // Central axios handling shows the user-facing error.
    } finally {
      setProgressSaving(false);
    }
  };

  // --- Payments ---
  const handleCreatePayment = async (payload) => {
    try {
      await instance.post(`contracts/${id}/payments/`, payload);
      setShowPaymentForm(false);
      refetch();
      refetchTimeline();
      toast.success("Payment added.");
    } catch (err) {
      // Central axios handling shows the user-facing error.
    }
  };

  const handleUpdatePayment = async (payload) => {
    try {
      await instance.put(`contract-payments/${editingPayment.id}/`, payload);
      setEditingPayment(null);
      setShowPaymentForm(false);
      refetch();
      refetchTimeline();
      toast.success("Payment updated.");
    } catch (err) {
      // Central axios handling shows the user-facing error.
    }
  };

  const handleDeletePayment = async () => {
    setActionLoading(true);
    try {
      await instance.delete(`contract-payments/${deletePayment.id}/`);
      setDeletePayment(null);
      refetch();
      refetchTimeline();
      toast.success("Payment deleted.");
    } catch (err) {
      // Central axios handling shows the user-facing error.
    } finally {
      setActionLoading(false);
    }
  };

  // --- Variations ---
  const handleCreateVariation = async (payload) => {
    try {
      await instance.post(`contracts/${id}/variations/`, payload);
      setShowVariationForm(false);
      refetch();
      toast.success("Variation added.");
    } catch (err) {
      // Central axios handling shows the user-facing error.
    }
  };

  const handleUpdateVariation = async (payload) => {
    try {
      await instance.put(
        `contract-variations/${editingVariation.id}/`,
        payload,
      );
      setEditingVariation(null);
      setShowVariationForm(false);
      refetch();
      toast.success("Variation updated.");
    } catch (err) {
      // Central axios handling shows the user-facing error.
    }
  };

  const handleDeleteVariation = async () => {
    setActionLoading(true);
    try {
      await instance.delete(`contract-variations/${deleteVariation.id}/`);
      setDeleteVariation(null);
      refetch();
      toast.success("Variation deleted.");
    } catch (err) {
      // Central axios handling shows the user-facing error.
    } finally {
      setActionLoading(false);
    }
  };

  const handleApproveVariation = async (variation) => {
    try {
      await instance.post(`contract-variations/${variation.id}/approve/`);
      toast.success("Variation approved.");
      refetch();
    } catch (err) {
      // Central axios handling shows the user-facing error.
    }
  };
  const handleDownloadContractPDF = async () => {
    try {
      const response = await instance.get(`contracts/${id}/export-pdf/`, {
        responseType: "blob",
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));

      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `contract_${contract.contract_number}.pdf`);

      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      toast.success("Contract PDF downloaded.");
    } catch (err) {
      // Central axios handling shows the user-facing error.
    }
  };

  // --- Documents ---
  const handleUploadDocument = async (formData) => {
    try {
      await instance.post(`contracts/${id}/documents/`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setShowDocUpload(false);
      refetch();
      toast.success("Document uploaded.");
    } catch (err) {
      // Central axios handling shows the user-facing error.
    }
  };

  const handleDeleteDoc = async () => {
    setActionLoading(true);
    try {
      await instance.delete(`contract-documents/${deleteDoc.id}/`);
      setDeleteDoc(null);
      refetch();
      toast.success("Document deleted.");
    } catch (err) {
      // Central axios handling shows the user-facing error.
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin w-8 h-8 border-2 border-[var(--border)] border-t-[var(--primary)] rounded-full" />
      </div>
    );
  }

  if (error || !contract) {
    return (
      <div className="space-y-4">
        <button
          onClick={() => navigate("/manager/contracts")}
          className="flex items-center gap-2 text-[var(--muted)] hover:text-[var(--text)] transition-colors"
        >
          <BackIcon size={16} /> {t("ContractDetailsPage.backToContracts")}
        </button>
        <Card className="p-12 text-center">
          <p className="text-[var(--danger)]">
            {t("ContractDetailsPage.failedToLoadContractDetails")}
          </p>
        </Card>
      </div>
    );
  }

  const canCreatePayment = ["active", "draft"].includes(contract.status);
  const timelinePayload =
    timelineData?.results?.summary || timelineData?.results?.results
      ? timelineData.results
      : timelineData;
  const timelineRows = Array.isArray(timelinePayload?.results)
    ? timelinePayload.results
    : [];
  const timelineSummary =
    timelinePayload?.summary || contract.financial_summary || {};

  const updateTimelineFilter = (field, value) => {
    setTimelineFilters((prev) => ({ ...prev, [field]: value }));
  };

  const clearTimelineFilters = () => {
    setTimelineFilters({
      type: "",
      search: "",
      date_from: "",
      date_to: "",
    });
  };

  return (
    <div className="space-y-6">
      {/* Back Button */}
      <button
        onClick={() => navigate("/manager/contracts")}
        className="flex items-center gap-2 text-[var(--muted)] hover:text-[var(--text)] transition-colors text-sm"
      >
        <BackIcon size={16} /> {t("ContractDetailsPage.backToContracts")}
      </button>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-[var(--text)]">
              {contract.title}
            </h1>
            <ContractStatusBadge status={contract.status} />
          </div>
          <p className="text-sm text-[var(--muted)] font-mono mt-1">
            {contract.contract_number}
          </p>
        </div>
        <div className="flex flex-col items-stretch gap-3 sm:flex-row sm:items-center sm:justify-end">
          <div className="flex min-w-0 items-center gap-2 rounded-lg border border-[var(--border)] bg-[var(--card)] px-3 py-2">
            <span className="shrink-0 text-sm text-[var(--muted)]">
              {t("ContractDetailsPage.progress")}:
            </span>
            <div className="w-32 min-w-24">
              <ProgressBar value={contract.completion_percentage} size="sm" />
            </div>
            <span className="shrink-0 text-sm font-semibold text-[var(--text)]">
              {contract.completion_percentage}%
            </span>
          </div>
          <PermissionWrapper permissions={["contracts.update"]}>
            <Button
              variant="secondary"
              onClick={openProgressForm}
              leftIcon={<Pencil className="h-4 w-4" />}
            >
              {t("ContractDetailsPage.updateProgress")}
            </Button>
          </PermissionWrapper>
          {canCreatePayment && (
            <PermissionWrapper permissions={["contract_payments.create"]}>
              <Button
                variant="primary"
                onClick={openCreatePayment}
                leftIcon={<Plus className="h-4 w-4" />}
              >
                {t("ContractDetailsPage.addPayment")}
              </Button>
            </PermissionWrapper>
          )}
          <Button
            variant="secondary"
            onClick={handleDownloadContractPDF}
            leftIcon={<Download className="h-4 w-4" />}
          >
            {t("ContractDetailsPage.downloadPdf")}
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-[var(--border)] overflow-x-auto">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
                activeTab === tab.key
                  ? "border-[var(--primary)] text-[var(--primary)]"
                  : "border-transparent text-[var(--muted)] hover:text-[var(--text)]"
              }`}
            >
              <Icon size={16} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      {/* ---- Information ---- */}
      {activeTab === "info" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="p-6 space-y-4">
            <h3 className="text-lg font-semibold text-[var(--text)]">
              {t("ContractDetailsPage.contractDetails")}
            </h3>
            <div className="space-y-3 text-sm">
              <Row
                label={t("ContractDetailsPage.project")}
                value={contract.project_name}
              />
              <Row
                label={t("ContractDetailsPage.subcontractor")}
                value={
                  contract.subcontractor?.name ||
                  t("ContractDetailsPage.noData")
                }
              />
              <Row
                label={t("ContractDetailsPage.scopeOfWork")}
                value={
                  contract.scope_of_work || t("ContractDetailsPage.noData")
                }
              />
              <Row
                label={t("ContractDetailsPage.notes")}
                value={contract.notes || t("ContractDetailsPage.noData")}
              />
            </div>
          </Card>
          <Card className="p-6 space-y-4">
            <h3 className="text-lg font-semibold text-[var(--text)]">
              {t("ContractDetailsPage.timeline")}
            </h3>
            <div className="space-y-3 text-sm">
              <Row
                label={t("ContractDetailsPage.startDate")}
                value={displayDate(contract.start_date)}
              />
              <Row
                label={t("ContractDetailsPage.endDate")}
                value={displayDate(contract.end_date)}
              />
              <Row
                label={t("ContractDetailsPage.adjustedEndDate")}
                value={displayDate(
                  contract.adjusted_end_date ||
                    contract.financial_summary?.adjusted_end_date,
                )}
              />
              <Row
                label={t("ContractDetailsPage.completion")}
                value={`${contract.completion_percentage}%`}
              />
            </div>
            <ProgressBar value={contract.completion_percentage} size="md" />
          </Card>
        </div>
      )}

      {/* ---- Financial ---- */}
      {activeTab === "financial" && (
        <div className="space-y-6">
          <FinancialSummaryCard
            summary={contract.financial_summary}
            currency={contract.currency}
          />
          <ContractFinancialSnapshot
            summary={timelineSummary}
            currency={contract.currency}
            fmt={fmt}
          />
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-[var(--text)] mb-4">
              {t("ContractDetailsPage.financialBreakdown")}
            </h3>
            <div className="space-y-3 text-sm">
              <Row
                label={t("ContractDetailsPage.originalContractValue")}
                value={`${contract.currency}${fmt.format(contract.contract_value)}`}
              />
              <Row
                label={t("ContractDetailsPage.retentionPercentage")}
                value={`${contract.retention_percentage}%`}
              />
              <Row
                label={t("ContractDetailsPage.retentionAmount")}
                value={`${contract.currency}${fmt.format(contract.retention_amount)}`}
              />
              <Row
                label={t("ContractDetailsPage.totalVariationAmount")}
                value={`${contract.currency}${fmt.format(contract.total_variation_amount || 0)}`}
              />
              <Row
                label={t("ContractDetailsPage.adjustedContractValue")}
                value={`${contract.currency}${fmt.format(contract.adjusted_contract_value || 0)}`}
                highlight
              />
            </div>
          </Card>
          <ContractFinancialTimeline
            rows={timelineRows}
            loading={timelineLoading}
            filters={timelineFilters}
            onFilterChange={updateTimelineFilter}
            onClearFilters={clearTimelineFilters}
            displayDate={displayDate}
            fmt={fmt}
          />
        </div>
      )}
      {activeTab === "invoices" && (
        <ContractInvoicesPage
          contractID={contract.id}
          contractCurrency={contract.currency}
        />
      )}

      {/* ---- Payments ---- */}
      {activeTab === "payments" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-[var(--text)]">
              {t("ContractDetailsPage.payments")}
            </h3>
            {canCreatePayment && (
              <PermissionWrapper permissions={["contract_payments.create"]}>
                <Button
                  variant="primary"
                  onClick={openCreatePayment}
                  leftIcon={<Plus className="h-4 w-4" />}
                >
                  {t("ContractDetailsPage.addPayment")}
                </Button>
              </PermissionWrapper>
            )}
          </div>
          <PaymentTable
            currency={contract.currency}
            contractContext={contract}
            payments={contract.payments || []}
            onEdit={(p) => {
              setEditingPayment(p);
              setShowPaymentForm(true);
            }}
            onDelete={(p) => setDeletePayment(p)}
          />
          <PaymentFormModal
            currency={contract.currency}
            isOpen={showPaymentForm}
            onClose={() => {
              setShowPaymentForm(false);
              setEditingPayment(null);
            }}
            onSubmit={
              editingPayment ? handleUpdatePayment : handleCreatePayment
            }
            payment={editingPayment}
            loading={posting}
            maxAmount={
              contract.remaining_amount ??
              contract.financial_summary?.remaining_amount ??
              null
            }
          />
          <DeleteConfirmModal
            isOpen={!!deletePayment}
            onClose={() => setDeletePayment(null)}
            onConfirm={handleDeletePayment}
            loading={actionLoading}
            title={t("ContractDetailsPage.deletePayment")}
            message={t("ContractDetailsPage.deletePaymentMessage")}
          />
        </div>
      )}

      {/* ---- Variations ---- */}
      {activeTab === "variations" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-[var(--text)]">
              {t("ContractDetailsPage.variationsChangeOrders")}
            </h3>
            <Button
              variant="primary"
              onClick={() => {
                setEditingVariation(null);
                setShowVariationForm(true);
              }}
            >
              {t("ContractDetailsPage.addVariation")}
            </Button>
          </div>
          <VariationTable
            currency={contract.currency}
            variations={contract.variations || []}
            onEdit={(v) => {
              setEditingVariation(v);
              setShowVariationForm(true);
            }}
            onDelete={(v) => setDeleteVariation(v)}
            onApprove={handleApproveVariation}
          />
          <VariationFormModal
            currency={contract.currency}
            isOpen={showVariationForm}
            onClose={() => {
              setShowVariationForm(false);
              setEditingVariation(null);
            }}
            onSubmit={
              editingVariation ? handleUpdateVariation : handleCreateVariation
            }
            variation={editingVariation}
            loading={posting}
          />
          <DeleteConfirmModal
            isOpen={!!deleteVariation}
            onClose={() => setDeleteVariation(null)}
            onConfirm={handleDeleteVariation}
            loading={actionLoading}
            title={t("ContractDetailsPage.deleteVariation")}
            message={t("ContractDetailsPage.deleteVariationMessage")}
          />
        </div>
      )}

      {/* ---- Documents ---- */}
      {activeTab === "documents" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-[var(--text)]">
              {t("ContractDetailsPage.documents")}
            </h3>
            <Button variant="primary" onClick={() => setShowDocUpload(true)}>
              {t("ContractDetailsPage.uploadDocument")}
            </Button>
          </div>
          <DocumentTable
            documents={contract.documents || []}
            onDelete={(d) => setDeleteDoc(d)}
          />
          <DocumentUploadModal
            isOpen={showDocUpload}
            onClose={() => setShowDocUpload(false)}
            onSubmit={handleUploadDocument}
            loading={posting}
          />
          <DeleteConfirmModal
            isOpen={!!deleteDoc}
            onClose={() => setDeleteDoc(null)}
            onConfirm={handleDeleteDoc}
            loading={actionLoading}
            title={t("ContractDetailsPage.deleteDocument")}
            message={t("ContractDetailsPage.deleteDocumentMessage", {
              title: deleteDoc?.title,
            })}
          />
        </div>
      )}
      <ProgressUpdateModal
        isOpen={showProgressForm}
        onClose={closeProgressForm}
        onSubmit={handleUpdateProgress}
        value={progressValue}
        onChange={(value) => {
          setProgressValue(value);
          if (progressError) setProgressError("");
        }}
        error={progressError}
        loading={progressSaving}
        t={t}
      />
    </div>
  );
}

function formatCurrency(value, currency, fmt) {
  const numericValue = Number(value || 0);
  return `${currency} ${fmt.format(numericValue)}`;
}

function formatDualCurrency(usdValue, afnValue, fmt) {
  return `USD ${fmt.format(Number(usdValue || 0))} / AFN ${fmt.format(
    Number(afnValue || 0),
  )}`;
}

function SnapshotMetric({
  icon: Icon,
  label,
  value,
  detail,
  tone = "primary",
}) {
  const tones = {
    primary: "bg-[var(--primary)]/10 text-[var(--primary)]",
    success: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-300",
    danger: "bg-red-500/10 text-red-600 dark:text-red-300",
  };

  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-4 shadow-sm">
      <div className="flex items-start gap-3">
        <div
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${
            tones[tone] || tones.primary
          }`}
        >
          <Icon className="h-5 w-5" />
        </div>
        <div className="min-w-0">
          <p className="text-sm font-medium text-[var(--muted)]">{label}</p>
          <p className="mt-1 break-words text-xl font-bold text-[var(--text)]">
            {value}
          </p>
          {detail && (
            <p className="mt-1 break-words text-xs text-[var(--muted)]">
              {detail}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

function ContractFinancialSnapshot({ summary, currency, fmt }) {
  const paymentValue =
    currency === "USD"
      ? (summary.payments_made_usd ?? summary.total_paid)
      : (summary.payments_made_afn ?? summary.total_paid);

  const cashOutflowUsd =
    summary.total_cash_outflow_usd ??
    Math.abs(Number(summary.net_position_usd || 0));

  const cashOutflowAfn =
    summary.total_cash_outflow_afn ??
    Math.abs(Number(summary.net_position_afn || 0));

  const totalInvoiced = Number(summary.total_invoiced);

  const remainingMoney =
    totalInvoiced - (currency === "USD" ? cashOutflowUsd : cashOutflowAfn);

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
      <SnapshotMetric
        icon={ArrowUpRight}
        label="Paid to Subcontractor"
        value={formatCurrency(paymentValue, currency, fmt)}
        detail="Contract payment records"
        tone="danger"
      />

      <SnapshotMetric
        icon={Receipt}
        label="Total Contract Expenses"
        value={formatDualCurrency(
          summary.total_contract_expenses_usd,
          summary.total_contract_expenses_afn,
          fmt,
        )}
        detail="Linked approved expenses only"
        tone="danger"
      />

      <SnapshotMetric
        icon={DollarSign}
        label="Total Cash Outflow"
        value={formatDualCurrency(cashOutflowUsd, cashOutflowAfn, fmt)}
        detail="Payments plus linked approved expenses"
        tone="primary"
      />

      <SnapshotMetric
        icon={Wallet}
        label="Remaining Money"
        value={formatCurrency(remainingMoney, currency, fmt)}
        detail="Total invoiced minus total cash outflow"
        tone={remainingMoney >= 0 ? "success" : "danger"}
      />
    </div>
  );
}

function ContractFinancialTimeline({
  rows,
  loading,
  filters,
  onFilterChange,
  onClearFilters,
  displayDate,
  fmt,
}) {
  const hasFilters = Boolean(
    filters.type || filters.search || filters.date_from || filters.date_to,
  );

  return (
    <Card className="p-0" contentClassName="p-0">
      <div className="border-b border-[var(--border)] p-4 sm:p-5">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h3 className="text-lg font-semibold text-[var(--text)]">
              Financial Timeline
            </h3>
          </div>
          {hasFilters && (
            <button
              type="button"
              onClick={onClearFilters}
              className="inline-flex min-h-10 items-center justify-center rounded-lg border border-[var(--border)] px-3 text-sm font-medium text-[var(--text)] hover:bg-[var(--hover)]"
            >
              Clear
            </button>
          )}
        </div>

        <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-4">
          <div className="relative md:col-span-2">
            <Search className="absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--muted)]" />
            <input
              type="search"
              value={filters.search}
              onChange={(event) => onFilterChange("search", event.target.value)}
              className="min-h-11 w-full rounded-lg border border-[var(--border)] bg-[var(--bg)] px-4 py-2.5 ps-10 text-sm text-[var(--text)] placeholder:text-[var(--muted)] focus:border-[var(--primary)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/20"
              placeholder="Search timeline"
            />
          </div>
          <div className="relative">
            <Filter className="absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--muted)]" />
            <select
              value={filters.type}
              onChange={(event) => onFilterChange("type", event.target.value)}
              className="min-h-11 w-full rounded-lg border border-[var(--border)] bg-[var(--bg)] px-4 py-2.5 ps-10 text-sm text-[var(--text)] focus:border-[var(--primary)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/20"
            >
              <option value="">All types</option>
              <option value="payment">Payments</option>
              <option value="expense">Expenses</option>
            </select>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <input
              type="date"
              value={filters.date_from}
              onChange={(event) =>
                onFilterChange("date_from", event.target.value)
              }
              className="min-h-11 rounded-lg border border-[var(--border)] bg-[var(--bg)] px-3 py-2.5 text-sm text-[var(--text)] focus:border-[var(--primary)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/20"
              title="From date"
            />
            <input
              type="date"
              value={filters.date_to}
              onChange={(event) =>
                onFilterChange("date_to", event.target.value)
              }
              className="min-h-11 rounded-lg border border-[var(--border)] bg-[var(--bg)] px-3 py-2.5 text-sm text-[var(--text)] focus:border-[var(--primary)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/20"
              title="To date"
            />
          </div>
        </div>
      </div>

      <div className="divide-y divide-[var(--border)]">
        {loading && (
          <div className="flex items-center justify-center gap-2 p-8 text-sm text-[var(--muted)]">
            <Loader2 className="h-4 w-4 animate-spin" />
            Loading timeline...
          </div>
        )}

        {!loading && rows.length === 0 && (
          <div className="flex flex-col items-center justify-center p-10 text-center">
            <Receipt className="mb-3 h-8 w-8 text-[var(--muted)]" />
            <p className="text-sm font-medium text-[var(--text)]">
              No financial activity found.
            </p>
          </div>
        )}

        {!loading &&
          rows.map((item) => {
            const isPayment = item.transaction_type === "payment";
            const isOutflow =
              item.direction === "out" || Number(item.signed_amount || 0) < 0;
            const Icon = isOutflow ? ArrowUpRight : ArrowDownLeft;
            const amountPrefix = isOutflow ? "-" : "+";
            const tone = isOutflow
              ? "bg-red-500/10 text-red-600 dark:text-red-300"
              : "bg-emerald-500/10 text-emerald-600 dark:text-emerald-300";
            const amountTone = isOutflow
              ? "text-red-600 dark:text-red-300"
              : "text-emerald-600 dark:text-emerald-300";

            return (
              <article
                key={item.id}
                className="grid gap-3 p-4 sm:grid-cols-[140px_1fr_auto] sm:items-start sm:p-5"
              >
                <div className="flex items-center gap-2 text-sm text-[var(--muted)]">
                  <CalendarDays className="h-4 w-4" />
                  <span>{displayDate(item.date)}</span>
                </div>
                <div className="min-w-0">
                  <div className="mb-1 flex flex-wrap items-center gap-2">
                    <span
                      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${tone}`}
                    >
                      <Icon className="h-3.5 w-3.5" />
                      {isPayment ? "Payment to Subcontractor" : "Expense"}
                    </span>
                    <span className="text-xs text-[var(--muted)]">
                      {item.reference}
                    </span>
                  </div>
                  <h4 className="break-words text-sm font-semibold text-[var(--text)]">
                    {item.description || item.title || item.reference}
                  </h4>
                  {item.counterparty && (
                    <p className="mt-1 break-words text-xs text-[var(--muted)]">
                      {item.counterparty}
                    </p>
                  )}
                </div>
                <div
                  className={`text-start text-base font-bold tabular-nums sm:text-end ${amountTone}`}
                >
                  {amountPrefix}
                  {item.currency} {fmt.format(Number(item.amount || 0))}
                </div>
              </article>
            );
          })}
      </div>
    </Card>
  );
}

function Row({ label, value, highlight = false }) {
  return (
    <div className="flex items-start justify-between gap-4">
      <span className="text-[var(--muted)] flex-shrink-0">{label}</span>
      <span
        className={`text-right ${
          highlight
            ? "font-bold text-[var(--primary)]"
            : "font-medium text-[var(--text)]"
        }`}
      >
        {value}
      </span>
    </div>
  );
}

function ProgressUpdateModal({
  isOpen,
  onClose,
  onSubmit,
  value,
  onChange,
  error,
  loading,
  t,
}) {
  if (!isOpen) return null;

  const numericValue = Number(value);
  const rangeValue = Number.isFinite(numericValue)
    ? Math.min(100, Math.max(0, numericValue))
    : 0;

  return (
    <div
      className="mobile-modal-surface fixed inset-0 z-50 flex"
      role="dialog"
      aria-modal="true"
      aria-labelledby="progress-modal-title"
    >
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />
      <div className="mobile-modal-panel relative w-full max-w-md overflow-hidden rounded-2xl">
        <Card
          className="flex h-full min-h-0 flex-col p-0"
          contentClassName="flex min-h-0 flex-1 flex-col p-0"
        >
          <form onSubmit={onSubmit} className="flex min-h-0 flex-1 flex-col">
            <div className="mobile-modal-header flex items-center justify-between border-b border-[var(--border)] px-6 py-4">
              <h2
                id="progress-modal-title"
                className="text-lg font-semibold text-[var(--text)]"
              >
                {t("ContractDetailsPage.updateProgress")}
              </h2>
              <button
                type="button"
                onClick={onClose}
                disabled={loading}
                className="inline-flex h-11 w-11 items-center justify-center rounded-lg text-[var(--text)] hover:bg-[var(--hover)] disabled:cursor-not-allowed disabled:opacity-50 sm:h-9 sm:w-9"
                aria-label={t("common.close")}
              >
                <X size={20} />
              </button>
            </div>
            <div className="mobile-modal-content space-y-5 px-6 py-5">
              <div className="rounded-lg border border-[var(--border)] bg-[var(--hover)]/60 p-4">
                <div className="mb-3 flex items-center justify-between gap-3">
                  <span className="text-sm font-medium text-[var(--text)]">
                    {t("ContractDetailsPage.progressPercentage")}
                  </span>
                  <span className="text-2xl font-bold text-[var(--primary)]">
                    {rangeValue}%
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  step="0.01"
                  value={rangeValue}
                  onChange={(event) => onChange(event.target.value)}
                  className="h-2 w-full cursor-pointer accent-[var(--primary)]"
                  aria-label={t("ContractDetailsPage.progressPercentage")}
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-[var(--text)]">
                  {t("ContractDetailsPage.progressPercentage")}
                </label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  step="0.01"
                  value={value}
                  onChange={(event) => onChange(event.target.value)}
                  className={`w-full rounded-lg border bg-[var(--card)] px-3 py-3 text-base text-[var(--text)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)] sm:text-sm ${
                    error ? "border-[var(--danger)]" : "border-[var(--border)]"
                  }`}
                />
                {error ? (
                  <p className="mt-1.5 text-xs text-[var(--danger)]">{error}</p>
                ) : (
                  <p className="mt-1.5 text-xs text-[var(--muted)]">
                    {t("ContractDetailsPage.progressHelp")}
                  </p>
                )}
              </div>
            </div>
            <div className="mobile-modal-footer flex items-center justify-end gap-3 border-t border-[var(--border)] px-6 py-4">
              <Button
                type="button"
                variant="secondary"
                onClick={onClose}
                disabled={loading}
              >
                {t("ContractFormModal.buttons.cancel")}
              </Button>
              <Button
                type="submit"
                variant="primary"
                disabled={loading}
                leftIcon={!loading && <Save className="h-4 w-4" />}
              >
                {loading
                  ? t("ContractFormModal.buttons.saving")
                  : t("ContractDetailsPage.saveProgress")}
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </div>
  );
}

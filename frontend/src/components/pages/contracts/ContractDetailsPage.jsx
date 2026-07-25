// src/pages/contracts/ContractDetailsPage.jsx
import { useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  ArrowRight,
  DollarSign,
  Calendar,
  FileText,
  GitBranch,
  TrendingUp,
  Download,
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
import { useLanguage } from "../../../hooks/useLanguage";
import { useCalendar } from "../../../hooks/useCalendar";
import toast from "react-hot-toast";

export default function ContractDetailsPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState("info");

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
  const { postData, loading: posting } = usePost();
  const [actionLoading, setActionLoading] = useState(false);

  const displayDate = (date) =>
    formatDate(date) || t("ContractDetailsPage.noData");

  const fmt = new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  // --- Payments ---
  const handleCreatePayment = async (payload) => {
    try {
      await instance.post(`contracts/${id}/payments/`, payload);
      setShowPaymentForm(false);
      refetch();
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
        <div className="flex items-center gap-2">
          <span className="text-sm text-[var(--muted)]">
            {t("ContractDetailsPage.progress")}:
          </span>
          <div className="w-32">
            <ProgressBar value={contract.completion_percentage} size="sm" />
          </div>
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
                value={contract.subcontractor?.name || t("ContractDetailsPage.noData")}
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
            {contract.status === "active" && (
              <Button
                variant="primary"
                onClick={() => {
                  setEditingPayment(null);
                  setShowPaymentForm(true);
                }}
              >
                {t("ContractDetailsPage.addPayment")}
              </Button>
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
            maxAmount={contract.remaining_amount}
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
    </div>
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

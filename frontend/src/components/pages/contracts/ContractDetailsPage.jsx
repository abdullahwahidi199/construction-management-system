// src/pages/contracts/ContractDetailsPage.jsx
import { useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  DollarSign,
  Calendar,
  FileText,
  GitBranch,
  TrendingUp,
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

const TABS = [
  { key: "info", label: "Information", icon: FileText },
  { key: "financial", label: "Financial", icon: DollarSign },
  { key: "invoices", label: "Invoices", icon: DollarSign },
  { key: "payments", label: "Payments", icon: TrendingUp },
  { key: "variations", label: "Variations", icon: GitBranch },
  { key: "documents", label: "Documents", icon: FileText },
];

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

  // Fetch contract detail
  const {
    data: contract,
    loading,
    error,
    refetch,
  } = useFetch(`contracts/${id}/`);
  const { postData, loading: posting } = usePost();
  const [actionLoading, setActionLoading] = useState(false);

  const formatDate = (d) => (d ? new Date(d).toLocaleDateString() : "—");

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
    } catch (err) {
      console.error(err);
    }
  };

  const handleUpdatePayment = async (payload) => {
    try {
      await instance.put(`contract-payments/${editingPayment.id}/`, payload);
      setEditingPayment(null);
      setShowPaymentForm(false);
      refetch();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeletePayment = async () => {
    setActionLoading(true);
    try {
      await instance.delete(`contract-payments/${deletePayment.id}/`);
      setDeletePayment(null);
      refetch();
    } catch (err) {
      console.error(err);
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
    } catch (err) {
      console.error(err);
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
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteVariation = async () => {
    setActionLoading(true);
    try {
      await instance.delete(`contract-variations/${deleteVariation.id}/`);
      setDeleteVariation(null);
      refetch();
    } catch (err) {
      console.error(err);
    } finally {
      setActionLoading(false);
    }
  };

  const handleApproveVariation = async (variation) => {
    try {
      await instance.post(`contract-variations/${variation.id}/approve/`);
      refetch();
    } catch (err) {
      console.error(err);
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
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteDoc = async () => {
    setActionLoading(true);
    try {
      await instance.delete(`contract-documents/${deleteDoc.id}/`);
      setDeleteDoc(null);
      refetch();
    } catch (err) {
      console.error(err);
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
          <ArrowLeft size={16} /> Back to Contracts
        </button>
        <Card className="p-12 text-center">
          <p className="text-[var(--danger)]">
            Failed to load contract details.
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
        <ArrowLeft size={16} /> Back to Contracts
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
          <span className="text-sm text-[var(--muted)]">Progress:</span>
          <div className="w-32">
            <ProgressBar value={contract.completion_percentage} size="sm" />
          </div>
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
              Contract Details
            </h3>
            <div className="space-y-3 text-sm">
              <Row label="Project" value={contract.project_name} />
              <Row label="Subcontractor" value={contract.subcontractor.name} />
              <Row
                label="Scope of Work"
                value={contract.scope_of_work || "—"}
              />
              <Row label="Notes" value={contract.notes || "—"} />
            </div>
          </Card>
          <Card className="p-6 space-y-4">
            <h3 className="text-lg font-semibold text-[var(--text)]">
              Timeline
            </h3>
            <div className="space-y-3 text-sm">
              <Row label="Start Date" value={formatDate(contract.start_date)} />
              <Row label="End Date" value={formatDate(contract.end_date)} />
              <Row
                label="Adjusted End Date"
                value={formatDate(contract.adjusted_end_date)}
              />
              <Row
                label="Completion"
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
              Financial Breakdown
            </h3>
            <div className="space-y-3 text-sm">
              <Row
                label="Original Contract Value"
                value={`${contract.currency}${fmt.format(contract.contract_value)}`}
              />
              <Row
                label="Retention Percentage"
                value={`${contract.retention_percentage}%`}
              />
              <Row
                label="Retention Amount"
                value={`${contract.currency}${fmt.format(contract.retention_amount)}`}
              />
              <Row
                label="Total Variation Amount"
                value={`${contract.currency}${fmt.format(contract.total_variation_amount || 0)}`}
              />
              <Row
                label="Adjusted Contract Value"
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
              Payments
            </h3>
            {contract.status === "active" && (
              <Button
                variant="primary"
                onClick={() => {
                  setEditingPayment(null);
                  setShowPaymentForm(true);
                }}
              >
                Add Payment
              </Button>
            )}
          </div>
          <PaymentTable
            currency={contract.currency}
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
            title="Delete Payment"
            message="Are you sure you want to delete this payment record?"
          />
        </div>
      )}

      {/* ---- Variations ---- */}
      {activeTab === "variations" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-[var(--text)]">
              Variations / Change Orders
            </h3>
            <Button
              variant="primary"
              onClick={() => {
                setEditingVariation(null);
                setShowVariationForm(true);
              }}
            >
              Add Variation
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
            title="Delete Variation"
            message="Are you sure you want to delete this variation?"
          />
        </div>
      )}

      {/* ---- Documents ---- */}
      {activeTab === "documents" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-[var(--text)]">
              Documents
            </h3>
            <Button variant="primary" onClick={() => setShowDocUpload(true)}>
              Upload Document
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
            title="Delete Document"
            message={`Are you sure you want to delete "${deleteDoc?.title}"?`}
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

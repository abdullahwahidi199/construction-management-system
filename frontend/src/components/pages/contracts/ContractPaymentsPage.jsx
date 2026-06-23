// src/pages/contracts/ContractPaymentsPage.jsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, DollarSign, Plus, Search, X } from "lucide-react";
import useFetch from "../../../hooks/useFetch";
import usePost from "../../../hooks/usePost";
import instance from "../../../api/axiosInstance";
import Card from "../../ui/Card";
import Button from "../../ui/Button";
import DeleteConfirmModal from "../../ui/DeleteConfirmModal";
import PaymentTable from "../../contracts/PaymentTable";
import PaymentFormModal from "../../contracts/PaymentFormModal";
const TYPE_FILTER_OPTIONS = [
  { value: "", label: "All Types" },
  { value: "advance", label: "Advance" },
  { value: "progress", label: "Progress" },
  { value: "retention_release", label: "Retention Release" },
  { value: "final", label: "Final" },
  { value: "other", label: "Other" },
];

export default function ContractPaymentsPage() {
  const navigate = useNavigate();
  const { postData, loading: posting } = usePost();

  const [typeFilter, setTypeFilter] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingPayment, setEditingPayment] = useState(null);
  const [deletingPayment, setDeletingPayment] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const queryParams = new URLSearchParams();
  if (typeFilter) queryParams.set("payment_type", typeFilter);

  const { data, loading, error, refetch } = useFetch(
    `contract-payments/?${queryParams.toString()}`,
  );

  const payments = data?.results || data || [];

  const handleEdit = (payment) => {
    setEditingPayment(payment);
    setShowForm(true);
  };

  const handleUpdate = async (payload) => {
    try {
      await instance.put(`contract-payments/${editingPayment.id}/`, payload);
      setEditingPayment(null);
      setShowForm(false);
      refetch();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async () => {
    if (!deletingPayment) return;
    setDeleteLoading(true);
    try {
      await instance.delete(`contract-payments/${deletingPayment.id}/`);
      setDeletingPayment(null);
      refetch();
    } catch (err) {
      console.error(err);
    } finally {
      setDeleteLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 text-[var(--muted)] hover:text-[var(--text)] transition-colors text-sm"
      >
        <ArrowLeft size={16} /> Back
      </button>

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[var(--text)]">
            All Payments
          </h1>
          <p className="text-sm text-[var(--muted)] mt-1">
            Overview of all payments across contracts
          </p>
        </div>
      </div>

      <Card className="p-4">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--card)] text-[var(--text)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
          >
            {TYPE_FILTER_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          {typeFilter && (
            <button
              onClick={() => setTypeFilter("")}
              className="flex items-center gap-1 px-3 py-2 text-sm text-[var(--danger)] hover:bg-[var(--danger)]/10 rounded-lg transition-colors"
            >
              <X size={14} />
              Clear
            </button>
          )}
        </div>
      </Card>

      {error && (
        <div className="bg-[var(--danger)]/10 border border-[var(--danger)]/20 rounded-xl p-4 text-sm text-[var(--danger)]">
          Failed to load payments.
        </div>
      )}

      <PaymentTable
        payments={payments}
        onEdit={handleEdit}
        onDelete={(p) => setDeletingPayment(p)}
        loading={loading}
      />

      <PaymentFormModal
        isOpen={showForm}
        onClose={() => {
          setShowForm(false);
          setEditingPayment(null);
        }}
        onSubmit={handleUpdate}
        payment={editingPayment}
        loading={posting}
      />

      <DeleteConfirmModal
        isOpen={!!deletingPayment}
        onClose={() => setDeletingPayment(null)}
        onConfirm={handleDelete}
        loading={deleteLoading}
        title="Delete Payment"
        message="Are you sure you want to delete this payment record?"
      />
    </div>
  );
}

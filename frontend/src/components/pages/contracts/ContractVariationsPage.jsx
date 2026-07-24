// src/pages/contracts/ContractVariationsPage.jsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, GitBranch, X } from "lucide-react";
import useFetch from "../../../hooks/useFetch";
import instance from "../../../api/axiosInstance";
import Card from "../../ui/Card";
import Button from "../../ui/Button";
import DeleteConfirmModal from "../../ui/DeleteConfirmModal";
import VariationTable from "../../contracts/VariationTable";
import VariationFormModal from "../../contracts/VariationFormModal";
import toast from "react-hot-toast";
export default function ContractVariationsPage() {
  const navigate = useNavigate();

  const [approvedFilter, setApprovedFilter] = useState("");
  const [editingVariation, setEditingVariation] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [deletingVariation, setDeletingVariation] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  const queryParams = new URLSearchParams();
  if (approvedFilter !== "") queryParams.set("approved", approvedFilter);

  const { data, loading, error, refetch } = useFetch(
    `contract-variations/?${queryParams.toString()}`,
  );

  const variations = data?.results || data || [];

  const handleEdit = (v) => {
    setEditingVariation(v);
    setShowForm(true);
  };

  const handleUpdate = async (payload) => {
    try {
      await instance.put(
        `contract-variations/${editingVariation.id}/`,
        payload,
      );
      setEditingVariation(null);
      setShowForm(false);
      refetch();
      toast.success("Variation updated.");
    } catch (err) {
      // Central axios handling shows the user-facing error.
    }
  };

  const handleApprove = async (variation) => {
    try {
      // We need to know the contract_id — it's nested in the variation data
      // or we can call the variation approve endpoint directly
      await instance.patch(`contract-variations/${variation.id}/`, {
        approved: true,
      });
      toast.success("Variation approved.");
      refetch();
    } catch (err) {
      // Central axios handling shows the user-facing error.
    }
  };

  const handleDelete = async () => {
    if (!deletingVariation) return;
    setActionLoading(true);
    try {
      await instance.delete(`contract-variations/${deletingVariation.id}/`);
      setDeletingVariation(null);
      refetch();
      toast.success("Variation deleted.");
    } catch (err) {
      // Central axios handling shows the user-facing error.
    } finally {
      setActionLoading(false);
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
            All Variations
          </h1>
          <p className="text-sm text-[var(--muted)] mt-1">
            Overview of all change orders across contracts
          </p>
        </div>
      </div>

      <Card className="p-4">
        <div className="flex items-center gap-3">
          <select
            value={approvedFilter}
            onChange={(e) => setApprovedFilter(e.target.value)}
            className="px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--card)] text-[var(--text)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
          >
            <option value="">All Status</option>
            <option value="true">Approved</option>
            <option value="false">Pending</option>
          </select>
          {approvedFilter !== "" && (
            <button
              onClick={() => setApprovedFilter("")}
              className="flex items-center gap-1 px-3 py-2 text-sm text-[var(--danger)] hover:bg-[var(--danger)]/10 rounded-lg transition-colors"
            >
              <X size={14} /> Clear
            </button>
          )}
        </div>
      </Card>

      {error && (
        <div className="bg-[var(--danger)]/10 border border-[var(--danger)]/20 rounded-xl p-4 text-sm text-[var(--danger)]">
          Failed to load variations.
        </div>
      )}

      <VariationTable
        variations={variations}
        onEdit={handleEdit}
        onDelete={(v) => setDeletingVariation(v)}
        onApprove={handleApprove}
        loading={loading}
      />

      <VariationFormModal
        isOpen={showForm}
        onClose={() => {
          setShowForm(false);
          setEditingVariation(null);
        }}
        onSubmit={handleUpdate}
        variation={editingVariation}
      />

      <DeleteConfirmModal
        isOpen={!!deletingVariation}
        onClose={() => setDeletingVariation(null)}
        onConfirm={handleDelete}
        loading={actionLoading}
        title="Delete Variation"
        message="Are you sure you want to delete this variation?"
      />
    </div>
  );
}

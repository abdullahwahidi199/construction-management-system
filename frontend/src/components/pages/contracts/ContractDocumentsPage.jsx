// src/pages/contracts/ContractDocumentsPage.jsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Upload } from "lucide-react";
import useFetch from "../../../hooks/useFetch";
import usePost from "../../../hooks/usePost";
import instance from "../../../api/axiosInstance";
import Button from "../../ui/Button";
import DeleteConfirmModal from "../../ui/DeleteConfirmModal";
import DocumentTable from "../../contracts/DocumentTable";
import DocumentUploadModal from "../../contracts/DocumentUploadModal";
import toast from "react-hot-toast";

export default function ContractDocumentsPage() {
  const navigate = useNavigate();
  const { postData, loading: posting } = usePost();

  const [showUpload, setShowUpload] = useState(false);
  const [deletingDoc, setDeletingDoc] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const { data, loading, error, refetch } = useFetch("contract-documents/");

  const documents = data?.results || data || [];

  const handleUpload = async (formData) => {
    try {
      // Contract ID must be passed via the document's contract field
      // This page shows all documents — the user needs to specify contract
      await instance.post("contract-documents/", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setShowUpload(false);
      refetch();
      toast.success("Document uploaded.");
    } catch (err) {
      // Central axios handling shows the user-facing error.
    }
  };

  const handleDelete = async () => {
    if (!deletingDoc) return;
    setDeleteLoading(true);
    try {
      await instance.delete(`contract-documents/${deletingDoc.id}/`);
      setDeletingDoc(null);
      refetch();
      toast.success("Document deleted.");
    } catch (err) {
      // Central axios handling shows the user-facing error.
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
            All Documents
          </h1>
          <p className="text-sm text-[var(--muted)] mt-1">
            Overview of all contract documents
          </p>
        </div>
        <Button variant="primary" onClick={() => setShowUpload(true)}>
          <Upload size={16} className="mr-1" />
          Upload Document
        </Button>
      </div>

      {error && (
        <div className="bg-[var(--danger)]/10 border border-[var(--danger)]/20 rounded-xl p-4 text-sm text-[var(--danger)]">
          Failed to load documents.
        </div>
      )}

      <DocumentTable
        documents={documents}
        onDelete={(d) => setDeletingDoc(d)}
        loading={loading}
      />

      <DocumentUploadModal
        isOpen={showUpload}
        onClose={() => setShowUpload(false)}
        onSubmit={handleUpload}
        loading={posting}
      />

      <DeleteConfirmModal
        isOpen={!!deletingDoc}
        onClose={() => setDeletingDoc(null)}
        onConfirm={handleDelete}
        loading={deleteLoading}
        title="Delete Document"
        message={`Are you sure you want to delete "${deletingDoc?.title}"?`}
      />
    </div>
  );
}

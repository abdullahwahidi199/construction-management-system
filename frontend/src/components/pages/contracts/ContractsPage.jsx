// src/pages/contracts/ContractsPage.jsx
import { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Search, FileText, Filter, X, Download } from "lucide-react";
import useFetch from "../../../hooks/useFetch";
import usePost from "../../../hooks/usePost";
import usePagination from "../../../hooks/usePagination";
import instance from "../../../api/axiosInstance";
import Card from "../../ui/Card";
import Button from "../../ui/Button";
import Input from "../../ui/Input";
import Select from "../../ui/Select";
import DeleteConfirmModal from "../../ui/DeleteConfirmModal";
import ContractTable from "../../contracts/ContractTable";
import ContractFormModal from "../../contracts/ContractFormModal";
import { useLanguage } from "../../../hooks/useLanguage";
import toast from "react-hot-toast";

export default function ContractsPage() {
  const navigate = useNavigate();
  const { page, pageSize, nextPage, prevPage, setPage } = usePagination();
  const { postData, loading: posting } = usePost();
  const { t } = useLanguage();

  const STATUS_FILTER_OPTIONS = [
    { value: "", label: t("ContractsPage.filters.allStatuses") },
    { value: "draft", label: t("ContractFormModal.statusOptions.draft") },
    { value: "active", label: t("ContractFormModal.statusOptions.active") },
    {
      value: "completed",
      label: t("ContractFormModal.statusOptions.completed"),
    },
    {
      value: "terminated",
      label: t("ContractFormModal.statusOptions.terminated"),
    },
    {
      value: "cancelled",
      label: t("ContractFormModal.statusOptions.cancelled"),
    },
  ];

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingContract, setEditingContract] = useState(null);
  const [deletingContract, setDeletingContract] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [projectFilter, setProjectFilter] = useState("");
  const [subcontractorFilter, setSubcontractorFilter] = useState("");
  const { data: projectsData } = useFetch("projects/");
  const { data: subcontractorsData } = useFetch("subcontractors/");

  const projects = projectsData?.results || projectsData || [];
  const subcontractors =
    subcontractorsData?.results || subcontractorsData || [];

  // Build query string
  const queryParams = new URLSearchParams();
  if (search) queryParams.set("search", search);
  if (statusFilter) queryParams.set("status", statusFilter);
  if (projectFilter) queryParams.set("project", projectFilter);
  if (subcontractorFilter)
    queryParams.set("subcontractor", subcontractorFilter);
  queryParams.set("page", page);
  queryParams.set("page_size", pageSize);
  const queryString = queryParams.toString();

  const { data, loading, error, refetch } = useFetch(
    `contracts/?${queryString}`,
  );

  const contracts = data?.results || data || [];
  const totalCount = data?.count || contracts.length;
  const totalPages = Math.ceil(totalCount / pageSize);
  const hasPrev = page > 1;
  const hasNext = page < totalPages;

  const handleView = useCallback(
    (contract) => navigate(`/manager/contracts/${contract.id}`),
    [navigate],
  );

  const handleCreate = async (payload) => {
    try {
      await postData("contracts/", payload);

      setShowForm(false);
      refetch();
      toast.success("Contract created.");
    } catch (err) {
      // Central axios handling shows the user-facing error.
    }
  };
  const handleEdit = (contract) => {
    setEditingContract(contract);
    setShowForm(true);
  };

  const handleUpdate = async (payload) => {
    try {
      await instance.put(`contracts/${editingContract.id}/`, payload);
      setEditingContract(null);
      setShowForm(false);
      refetch();
      toast.success("Contract updated.");
    } catch (err) {
      // Central axios handling shows the user-facing error.
    }
  };

  const handleDelete = async () => {
    if (!deletingContract) return;
    setDeleteLoading(true);
    try {
      await instance.delete(`contracts/${deletingContract.id}/`);
      setDeletingContract(null);
      refetch();
      toast.success("Contract deleted.");
    } catch (err) {
      // Central axios handling shows the user-facing error.
    } finally {
      setDeleteLoading(false);
    }
  };
  const handleExportPdf = async () => {
    try {
      const response = await instance.get(
        `/contracts/export-pdf/?${queryString}`,
        {
          responseType: "blob",
        },
      );

      const url = window.URL.createObjectURL(
        new Blob([response.data], { type: "application/pdf" }),
      );

      const link = document.createElement("a");
      link.href = url;
      link.download = `contracts-${new Date().toISOString().slice(0, 10)}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      toast.success("Contracts exported.");
    } catch (error) {
      // Central axios handling shows the user-facing error.
    }
  };

  const clearFilters = () => {
    setSearch("");
    setStatusFilter("");
    setProjectFilter("");
    setSubcontractorFilter("");
    setPage(1);
  };

  const hasFilters =
    search || statusFilter || projectFilter || subcontractorFilter;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="text-2xl font-bold text-[var(--text)]">
            {t("ContractsPage.title")}
          </h1>
          <p className="text-sm text-[var(--muted)] mt-1">
            {t("ContractsPage.subtitle")}
          </p>
        </div>
        <div>
          <Button
            variant="primary"
            onClick={() => {
              setEditingContract(null);
              setShowForm(true);
            }}
          >
            <Plus size={16} className="mr-1" />
            {t("ContractsPage.buttons.newContract")}
          </Button>
          <Button
            variant="secondary"
            onClick={handleExportPdf}
            leftIcon={<Download size={16} />}
          >
            {t("ProjectDetails.downloadPdf")}
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card className="p-4">
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center gap-3">
          <div className="flex-1 relative">
            <Search
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted)]"
            />
            <input
              type="text"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              placeholder={t("ContractsPage.filters.searchPlaceholder")}
              className="w-full pl-9 pr-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--card)] text-[var(--text)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            className="px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--card)] text-[var(--text)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
          >
            {STATUS_FILTER_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          <select
            value={projectFilter}
            onChange={(e) => {
              setProjectFilter(e.target.value);
              setPage(1);
            }}
            className="px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--card)] text-[var(--text)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
          >
            <option value="">{t("ContractsPage.filters.allProjects")}</option>
            {projects.map((project) => (
              <option key={project.id} value={project.id}>
                {project.name}
              </option>
            ))}
          </select>

          <select
            value={subcontractorFilter}
            onChange={(e) => {
              setSubcontractorFilter(e.target.value);
              setPage(1);
            }}
            className="px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--card)] text-[var(--text)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
          >
            <option value="">
              {t("ContractsPage.filters.allSubcontractors")}
            </option>
            {subcontractors.map((subcontractor) => (
              <option key={subcontractor.id} value={subcontractor.id}>
                {subcontractor.name}
              </option>
            ))}
          </select>
          {hasFilters && (
            <button
              onClick={clearFilters}
              className="flex items-center gap-1 px-3 py-2 text-sm text-[var(--danger)] hover:bg-[var(--danger)]/10 rounded-lg transition-colors"
            >
              <X size={14} />
              {t("ContractsPage.buttons.clearFilters")}
            </button>
          )}
        </div>
      </Card>

      {/* Error */}
      {error && (
        <div className="bg-[var(--danger)]/10 border border-[var(--danger)]/20 rounded-xl p-4 text-sm text-[var(--danger)]">
          {t("ContractsPage.messages.loadError")}
        </div>
      )}

      {/* Table */}
      <ContractTable
        contracts={contracts}
        onView={handleView}
        onEdit={handleEdit}
        onDelete={(c) => setDeletingContract(c)}
        loading={loading}
      />

      {/* Pagination */}
      {totalCount > pageSize && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-[var(--muted)]">
            {t("ContractsPage.messages.showing")} {(page - 1) * pageSize + 1}-
            {Math.min(page * pageSize, totalCount)}{" "}
            {t("ContractsPage.messages.of")} {totalCount}
          </p>
          <div className="flex items-center gap-2">
            <Button variant="secondary" onClick={prevPage} disabled={!hasPrev}>
              {t("ContractsPage.buttons.previous")}
            </Button>
            <span className="text-sm text-[var(--muted)] px-2">
              {t("ContractsPage.messages.page")} {page}{" "}
              {t("ContractsPage.messages.of")} {totalPages}
            </span>
            <Button variant="secondary" onClick={nextPage} disabled={!hasNext}>
              {t("ContractsPage.buttons.next")}
            </Button>
          </div>
        </div>
      )}

      {/* Form Modal */}
      <ContractFormModal
        isOpen={showForm}
        onClose={() => {
          setShowForm(false);
          setEditingContract(null);
        }}
        onSubmit={editingContract ? handleUpdate : handleCreate}
        contract={editingContract}
        loading={posting}
      />

      {/* Delete Modal */}
      <DeleteConfirmModal
        isOpen={!!deletingContract}
        onClose={() => setDeletingContract(null)}
        onConfirm={handleDelete}
        loading={deleteLoading}
        title="Delete Contract"
        message={`Are you sure you want to delete contract "${deletingContract?.contract_number}"? This action cannot be undone.`}
      />
    </div>
  );
}

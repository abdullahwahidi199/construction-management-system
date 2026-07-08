// src/pages/contracts/SubcontractorsPage.jsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Search, X, Building2 } from "lucide-react";
import useFetch from "../../../hooks/useFetch";
import usePost from "../../../hooks/usePost";
import usePagination from "../../../hooks/usePagination";
import instance from "../../../api/axiosInstance";
import Card from "../../ui/Card";
import Button from "../../ui/Button";
import DeleteConfirmModal from "../../ui/DeleteConfirmModal";
import SubcontractorTable from "../../contracts/SubcontractorTable";
import SubcontractorFormModal from "../../contracts/SubcontractorFormModal";
import { useLanguage } from "../../../hooks/useLanguage";

export default function SubcontractorsPage() {
  const navigate = useNavigate();
  const { page, pageSize, nextPage, prevPage, setPage } = usePagination();
  const { postData, loading: posting } = usePost();
  const { t } = useLanguage();

  const SPECIALIZATION_OPTIONS = [
    { value: "", label: t("SubcontractorsPage.filters.specialization_all") },
    {
      value: "concrete",
      label: t("SubcontractorsPage.specializations.concrete"),
    },
    { value: "steel", label: t("SubcontractorsPage.specializations.steel") },
    {
      value: "electrical",
      label: t("SubcontractorsPage.specializations.electrical"),
    },
    {
      value: "plumbing",
      label: t("SubcontractorsPage.specializations.plumbing"),
    },
    {
      value: "finishing",
      label: t("SubcontractorsPage.specializations.finishing"),
    },
    {
      value: "excavation",
      label: t("SubcontractorsPage.specializations.excavation"),
    },
    { value: "hvac", label: t("SubcontractorsPage.specializations.hvac") },
    {
      value: "landscaping",
      label: t("SubcontractorsPage.specializations.landscaping"),
    },
    { value: "other", label: t("SubcontractorsPage.specializations.other") },
  ];

  const [search, setSearch] = useState("");
  const [specFilter, setSpecFilter] = useState("");
  const [activeFilter, setActiveFilter] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingSub, setEditingSub] = useState(null);
  const [deletingSub, setDeletingSub] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const queryParams = new URLSearchParams();
  if (search) queryParams.set("search", search);
  if (specFilter) queryParams.set("specialization", specFilter);
  if (activeFilter) queryParams.set("is_active", activeFilter);
  queryParams.set("page", page);
  queryParams.set("page_size", pageSize);

  const { data, loading, error, refetch } = useFetch(
    `subcontractors/?${queryParams.toString()}`,
  );

  const subcontractors = data?.results || data || [];
  const totalCount = data?.count || subcontractors.length;
  const totalPages = Math.ceil(totalCount / pageSize);
  const hasPrev = page > 1;
  const hasNext = page < totalPages;

  const handleView = (sub) => {
    navigate(`/manager/subcontractors/${sub.id}`);
  };

  const handleCreate = async (payload) => {
    try {
      await postData("subcontractors/", payload);
      setShowForm(false);
      refetch();
    } catch (err) {
      console.error(err);
    }
  };

  const handleEdit = (sub) => {
    setEditingSub(sub);
    setShowForm(true);
  };

  const handleUpdate = async (payload) => {
    try {
      await instance.put(`subcontractors/${editingSub.id}/`, payload);
      setEditingSub(null);
      setShowForm(false);
      refetch();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async () => {
    if (!deletingSub) return;
    setDeleteLoading(true);
    try {
      await instance.delete(`subcontractors/${deletingSub.id}/`);
      setDeletingSub(null);
      refetch();
    } catch (err) {
      console.error(err);
    } finally {
      setDeleteLoading(false);
    }
  };

  const hasFilters = search || specFilter || activeFilter;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[var(--text)]">
            {t("SubcontractorsPage.title")}
          </h1>
          <p className="text-sm text-[var(--muted)] mt-1">
            {t("SubcontractorsPage.subtitle")}
          </p>
        </div>
        <Button
          variant="primary"
          onClick={() => {
            setEditingSub(null);
            setShowForm(true);
          }}
        >
          <Plus size={16} className="mr-1" />
          {t("SubcontractorsPage.actions.new")}
        </Button>
      </div>

      {/* Filters */}
      <Card className="p-4">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
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
              placeholder={t("SubcontractorsPage.filters.search_placeholder")}
              className="w-full pl-9 pr-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--card)] text-[var(--text)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
            />
          </div>
          <select
            value={specFilter}
            onChange={(e) => {
              setSpecFilter(e.target.value);
              setPage(1);
            }}
            className="px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--card)] text-[var(--text)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
          >
            {SPECIALIZATION_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          <select
            value={activeFilter}
            onChange={(e) => {
              setActiveFilter(e.target.value);
              setPage(1);
            }}
            className="px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--card)] text-[var(--text)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
          >
            <option value="">
              {t("SubcontractorsPage.filters.status_all")}
            </option>
            <option value="true">
              {t("SubcontractorsPage.filters.active")}
            </option>
            <option value="false">
              {t("SubcontractorsPage.filters.inactive")}
            </option>
          </select>
          {hasFilters && (
            <button
              onClick={() => {
                setSearch("");
                setSpecFilter("");
                setActiveFilter("");
                setPage(1);
              }}
              className="flex items-center gap-1 px-3 py-2 text-sm text-[var(--danger)] hover:bg-[var(--danger)]/10 rounded-lg transition-colors"
            >
              <X size={14} />
              {t("SubcontractorsPage.actions.clear_filters")}
            </button>
          )}
        </div>
      </Card>

      {error && (
        <div className="bg-[var(--danger)]/10 border border-[var(--danger)]/20 rounded-xl p-4 text-sm text-[var(--danger)]">
          {t("SubcontractorsPage.messages.error_load")}
        </div>
      )}

      <SubcontractorTable
        subcontractors={subcontractors}
        onView={handleView}
        onEdit={handleEdit}
        onDelete={(s) => setDeletingSub(s)}
        loading={loading}
      />

      {/* Pagination */}
      {totalCount > pageSize && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-[var(--muted)]">
            {t("SubcontractorsPage.pagination.showing")}{" "}
            {(page - 1) * pageSize + 1}-{Math.min(page * pageSize, totalCount)}{" "}
            {t("SubcontractorsPage.pagination.of")} {totalCount}
          </p>
          <div className="flex items-center gap-2">
            <Button variant="secondary" onClick={prevPage} disabled={!hasPrev}>
              {t("SubcontractorsPage.pagination.previous")}
            </Button>
            <span className="text-sm text-[var(--muted)] px-2">
              {page} / {totalPages}
            </span>
            <Button variant="secondary" onClick={nextPage} disabled={!hasNext}>
              {t("SubcontractorsPage.pagination.next")}
            </Button>
          </div>
        </div>
      )}

      <SubcontractorFormModal
        isOpen={showForm}
        onClose={() => {
          setShowForm(false);
          setEditingSub(null);
        }}
        onSubmit={editingSub ? handleUpdate : handleCreate}
        subcontractor={editingSub}
        loading={posting}
      />

      <DeleteConfirmModal
        isOpen={!!deletingSub}
        onClose={() => setDeletingSub(null)}
        onConfirm={handleDelete}
        loading={deleteLoading}
        title={t("SubcontractorsPage.delete.title")}
        message={t("SubcontractorsPage.delete.message", {
          name: deletingSub?.name,
        })}
      />
    </div>
  );
}

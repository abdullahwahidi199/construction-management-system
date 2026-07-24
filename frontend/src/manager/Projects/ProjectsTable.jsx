import React, { useState } from "react";
import {
  Pencil,
  Trash2,
  FolderKanban,
  Search,
  MapPin,
  Calendar,
  Building2,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  Eye,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import DeleteConfirmModal from "../../components/ui/DeleteConfirmModal";
import PermissionWrapper from "../../auth/PermissionWrapper";
import { useLanguage } from "../../hooks/useLanguage";

const formatDate = (dateString) => {
  if (!dateString) return "—";
  return dateString;
};

const getStatusConfig = (status) => {
  const s = status?.toLowerCase();
  if (s === "active" || s === "in progress" || s === "ongoing")
    return {
      bg: "bg-emerald-500/10",
      text: "text-emerald-600 dark:text-emerald-400",
      dot: "bg-emerald-500",
      border: "border-emerald-500/20",
    };
  if (s === "completed")
    return {
      bg: "bg-blue-500/10",
      text: "text-blue-600 dark:text-blue-400",
      dot: "bg-blue-500",
      border: "border-blue-500/20",
    };
  if (s === "planning")
    return {
      bg: "bg-violet-500/10",
      text: "text-violet-600 dark:text-violet-400",
      dot: "bg-violet-500",
      border: "border-violet-500/20",
    };
  if (s === "pending" || s === "on hold" || s === "hold" || s === "on_hold")
    return {
      bg: "bg-amber-500/10",
      text: "text-amber-600 dark:text-amber-400",
      dot: "bg-amber-500",
      border: "border-amber-500/20",
    };
  if (s === "cancelled")
    return {
      bg: "bg-red-500/10",
      text: "text-red-600 dark:text-red-400",
      dot: "bg-red-500",
      border: "border-red-500/20",
    };
  return {
    bg: "bg-[var(--hover)]",
    text: "text-[var(--muted)]",
    dot: "bg-[var(--muted)]",
    border: "border-[var(--border)]",
  };
};

export default function ProjectsTable({ projects = [], onEdit, onDelete }) {
  const [searchQuery, setSearchQuery] = useState("");
  const [sortKey, setSortKey] = useState(null);
  const [sortDir, setSortDir] = useState("asc");
  const [currentPage, setCurrentPage] = useState(1);

  // ✅ Store the full project object so we can show the name in the modal
  const [projectToDelete, setProjectToDelete] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const { t } = useLanguage();

  const columns = [
    { key: "name", label: t("ProjectsTable.projectName"), icon: FolderKanban },
    { key: "property_type", label: t("ProjectsTable.type"), icon: Building2 },
    { key: "location", label: t("ProjectsTable.location"), icon: MapPin },
    { key: "start_date", label: t("ProjectsTable.startDate"), icon: Calendar },
    { key: "status", label: t("ProjectsTable.status") },
    { key: "actions", label: "" },
  ];

  const rowsPerPage = 8;
  const navigate = useNavigate();

  // ── Filter ──
  const filtered = projects.filter((p) =>
    [p.name, p.property_type, p.location, p.status]
      .filter(Boolean)
      .some((v) => v.toLowerCase().includes(searchQuery.toLowerCase())),
  );

  // ── Sort ──
  const sorted = [...filtered].sort((a, b) => {
    if (!sortKey) return 0;
    const aVal = a[sortKey] ?? "";
    const bVal = b[sortKey] ?? "";
    const cmp = String(aVal).localeCompare(String(bVal), undefined, {
      numeric: true,
    });
    return sortDir === "asc" ? cmp : -cmp;
  });

  // ── Paginate ──
  const totalPages = Math.max(1, Math.ceil(sorted.length / rowsPerPage));
  const paginated = sorted.slice(
    (currentPage - 1) * rowsPerPage,
    currentPage * rowsPerPage,
  );

  const handleSort = (key) => {
    if (key === "actions") return;
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
  };

  // ✅ Handle delete confirmation
  const handleDeleteConfirm = async () => {
    if (!projectToDelete) return;
    try {
      setDeleteLoading(true);
      await onDelete(projectToDelete.id);
      setProjectToDelete(null); // Close modal on success
    } catch (err) {
      toast.error(err?.userMessage || "Unable to delete this project.");
    } finally {
      setDeleteLoading(false);
    }
  };

  return (
    <div className="w-full space-y-0 rounded-xl border border-[var(--border)] bg-[var(--card)] shadow-sm">
      {/* ── Toolbar ─────────────────────────────────── */}
      <div className="flex flex-col gap-3 border-b border-[var(--border)] px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--primary)]/10">
            <FolderKanban
              className="h-4 w-4 text-[var(--primary)]"
              strokeWidth={2}
            />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-[var(--text)]">
              {t("ProjectsTable.project")}
            </h2>
            <p className="text-xs text-[var(--muted)]">
              {filtered.length}{" "}
              {filtered.length === 1
                ? t("ProjectsTable.project")
                : t("ProjectsTable.projectsPlural")}{" "}
              {t("ProjectsTable.found")}
            </p>
          </div>
        </div>

        <div className="relative w-full sm:max-w-xs">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--muted)]" />
          <input
            type="text"
            placeholder={t("ProjectsTable.searchProjects")}
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            className="h-9 w-full rounded-lg border border-[var(--border)] bg-[var(--bg)] pl-9 pr-3 text-sm text-[var(--text)] placeholder-[var(--muted)] outline-none transition-all focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary)]/20"
          />
        </div>
      </div>

      {/* ── Table ───────────────────────────────────── */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-[var(--border)]">
              {columns.map((col) => (
                <th
                  key={col.key}
                  onClick={() => handleSort(col.key)}
                  className={`whitespace-nowrap px-4 py-3 text-xs font-semibold uppercase tracking-wider text-[var(--muted)] ${
                    col.key !== "actions"
                      ? "cursor-pointer select-none transition-colors hover:text-[var(--text)]"
                      : ""
                  }`}
                >
                  <span className="inline-flex items-center gap-1.5">
                    {col.label}
                    {col.key !== "actions" && (
                      <ArrowUpDown
                        className={`h-3 w-3 transition-opacity ${
                          sortKey === col.key
                            ? "opacity-100 text-[var(--primary)]"
                            : "opacity-30"
                        }`}
                      />
                    )}
                  </span>
                </th>
              ))}
            </tr>
          </thead>

          <tbody className="divide-y divide-[var(--border)]">
            {paginated.length > 0 ? (
              paginated.map((project, idx) => {
                const status = getStatusConfig(project.status);
                return (
                  <tr
                    key={project.id ?? idx}
                    className="group transition-colors duration-150 hover:bg-[var(--hover)] "
                  >
                    {/* Name */}
                    <td className="whitespace-nowrap px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[var(--primary)]/10 text-xs font-bold text-[var(--primary)]">
                          {project.name?.charAt(0)?.toUpperCase() ?? "P"}
                        </div>
                        <span className="max-w-[180px] truncate font-medium text-[var(--text)]">
                          {project.name}
                        </span>
                      </div>
                    </td>

                    {/* Type */}
                    <td className="whitespace-nowrap px-4 py-3">
                      <span className="inline-flex items-center gap-1.5 text-[var(--text)]">
                        <Building2
                          className="h-3.5 w-3.5 text-[var(--muted)]"
                          strokeWidth={1.8}
                        />
                        {project.property_type || "—"}
                      </span>
                    </td>

                    {/* Location */}
                    <td className="whitespace-nowrap px-4 py-3">
                      <span className="inline-flex items-center gap-1.5 text-[var(--text)]">
                        <MapPin
                          className="h-3.5 w-3.5 text-[var(--muted)]"
                          strokeWidth={1.8}
                        />
                        <span className="max-w-[140px] truncate">
                          {project.location || "—"}
                        </span>
                      </span>
                    </td>

                    {/* Date */}
                    <td className="whitespace-nowrap px-4 py-3 tabular-nums text-[var(--muted)]">
                      {formatDate(
                        project.formatted_start_date || project.start_date,
                      )}
                    </td>

                    {/* Status */}
                    <td className="whitespace-nowrap px-4 py-3">
                      <span
                        className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium ${status.bg} ${status.text} ${status.border}`}
                      >
                        <span
                          className={`h-1.5 w-1.5 rounded-full ${status.dot}`}
                        />
                        {project.status}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="whitespace-nowrap px-4 py-3">
                      <div className="flex items-center justify-end gap-1 opacity-0 transition-opacity duration-200 group-hover:opacity-100">
                        <button
                          onClick={() =>
                            navigate(`/manager/projects/${project.id}`)
                          }
                          className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-[var(--muted)] transition-all hover:bg-[var(--primary)]/10 hover:text-[var(--primary)]"
                          title={t("ProjectsTable.viewProject")}
                        >
                          <Eye size={15} strokeWidth={1.8} />
                        </button>
                        <PermissionWrapper permissions={["projects.delete"]}>
                          <button
                            onClick={() => setProjectToDelete(project)}
                            className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-[var(--muted)] transition-all hover:bg-red-500/10 hover:text-[var(--danger)]"
                            title={t("ProjectsTable.deleteProject")}
                          >
                            <Trash2 size={15} strokeWidth={1.8} />
                          </button>
                        </PermissionWrapper>
                      </div>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan={columns.length} className="px-4 py-16 text-center">
                  <div className="flex flex-col items-center gap-2">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[var(--hover)]">
                      <FolderKanban
                        className="h-6 w-6 text-[var(--muted)]"
                        strokeWidth={1.5}
                      />
                    </div>
                    <p className="text-sm font-medium text-[var(--text)]">
                      {t("ProjectsTable.noProjectsFound")}
                    </p>
                    <p className="text-xs text-[var(--muted)]">
                      {searchQuery
                        ? t("ProjectsTable.adjustSearch")
                        : t("ProjectsTable.createFirstProject")}
                    </p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* ── Pagination Footer ───────────────────────── */}
      {filtered.length > rowsPerPage && (
        <div className="flex items-center justify-between border-t border-[var(--border)] px-4 py-3">
          <p className="text-xs text-[var(--muted)]">
            {t("ProjectsTable.showing")}{" "}
            <span className="font-medium text-[var(--text)]">
              {(currentPage - 1) * rowsPerPage + 1}
            </span>
            –
            <span className="font-medium text-[var(--text)]">
              {Math.min(currentPage * rowsPerPage, filtered.length)}
            </span>{" "}
            {t("ProjectsTable.of")}{" "}
            <span className="font-medium text-[var(--text)]">
              {filtered.length}
            </span>
          </p>

          <div className="flex items-center gap-1">
            <button
              disabled={currentPage === 1}
              onClick={() => setCurrentPage((p) => p - 1)}
              className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-[var(--border)] text-[var(--muted)] transition-all hover:bg-[var(--hover)] hover:text-[var(--text)] disabled:pointer-events-none disabled:opacity-40"
            >
              <ChevronLeft size={16} />
            </button>

            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <button
                key={page}
                onClick={() => setCurrentPage(page)}
                className={`inline-flex h-8 w-8 items-center justify-center rounded-lg text-xs font-medium transition-all ${
                  page === currentPage
                    ? "bg-[var(--primary)] text-white shadow-sm"
                    : "text-[var(--muted)] hover:bg-[var(--hover)] hover:text-[var(--text)]"
                }`}
              >
                {page}
              </button>
            ))}

            <button
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage((p) => p + 1)}
              className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-[var(--border)] text-[var(--muted)] transition-all hover:bg-[var(--hover)] hover:text-[var(--text)] disabled:pointer-events-none disabled:opacity-40"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}

      {/* ✅ Delete Confirm Modal — properly wired */}
      <DeleteConfirmModal
        open={!!projectToDelete}
        onClose={() => setProjectToDelete(null)}
        onConfirm={handleDeleteConfirm}
        itemName={projectToDelete?.name || t("ProjectsTable.thisProject")}
        loading={deleteLoading}
      />
    </div>
  );
}

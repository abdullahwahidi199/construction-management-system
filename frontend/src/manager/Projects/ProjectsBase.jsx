import { useState } from "react";
import {
  FolderKanban,
  Plus,
  RefreshCw,
  Loader2,
} from "lucide-react";
import toast from "react-hot-toast";
import useFetch from "../../hooks/useFetch";
import usePost from "../../hooks/usePost";
import useDelete from "../../hooks/useDelete";
import ProjectCreateModal from "../../components/reusableComponents/ProjectCreateModal";
import ProjectsTable from "./ProjectsTable";
import { useLanguage } from "../../hooks/useLanguage";

export default function ProjectsBase() {
  const { data: projects, loading: fetching, refetch } = useFetch("projects/");
  const { postData, loading, error } = usePost();
  const { deleteData } = useDelete();

  const [open, setOpen] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const createProject = async (formData) => {
    try {
      await postData("projects/", formData);
      setOpen(false);
      await refetch();
      toast.success("Project created.");
    } catch (err) {
      // Central API handling displays the user-facing error toast.
      throw err;
    }
  };

  const handleProjectDelete = async (id) => {
    try {
      await deleteData(`projects/${id}/`);
      await refetch();
      toast.success("Project deleted.");
    } catch (err) {
      // Central API handling displays the user-facing error toast.
      throw err;
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await refetch();
    } finally {
      setTimeout(() => setRefreshing(false), 600);
    }
  };

  /* ── Stat helpers ─────────────────────────────── */
  const projectList = Array.isArray(projects) ? projects : [];
  const totalProjects = projectList.length;
  const { t } = useLanguage();
  const activeProjects = projectList.filter((p) =>
    ["active", "in progress", "ongoing"].includes(p.status?.toLowerCase()),
  ).length;
  const planningProjects = projectList.filter(
    (p) => p.status?.toLowerCase() === "planning",
  ).length;
  const completedProjects = projectList.filter(
    (p) => p.status?.toLowerCase() === "completed",
  ).length;

  const stats = [
    {
      label: t("ProjectsBase.totalProjects"),
      value: totalProjects,
      color: "bg-[var(--primary)]/10 text-[var(--primary)]",
      dotColor: "bg-[var(--primary)]",
    },
    {
      label: t("ProjectsBase.active"),
      value: activeProjects,
      color: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
      dotColor: "bg-emerald-500",
    },
    {
      label: t("ProjectsBase.planning"),
      value: planningProjects,
      color: "bg-violet-500/10 text-violet-600 dark:text-violet-400",
      dotColor: "bg-violet-500",
    },
    {
      label: t("ProjectsBase.completed"),
      value: completedProjects,
      color: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
      dotColor: "bg-blue-500",
    },
  ];

  return (
    <div className="space-y-6">
      {/* ── Page Header ──────────────────────────── */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        {/* Left: Title */}
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[var(--primary)]/10 shadow-sm">
            <FolderKanban
              className="h-6 w-6 text-[var(--primary)]"
              strokeWidth={1.8}
            />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-[var(--text)]">
              {t("ProjectsBase.title")}
            </h1>
            <p className="text-sm text-[var(--muted)]">
              {t("ProjectsBase.subtitle")}
            </p>
          </div>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-2.5">
          {/* Refresh */}
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-[var(--border)] bg-[var(--card)] text-[var(--muted)] shadow-sm transition-all hover:bg-[var(--hover)] hover:text-[var(--text)] disabled:opacity-50"
            title={t("ProjectsBase.refresh")}
          >
            <RefreshCw
              className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`}
              strokeWidth={2}
            />
          </button>

          {/* Create Button */}
          <button
            onClick={() => setOpen(true)}
            className="inline-flex items-center gap-2 rounded-xl bg-[var(--primary)] px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-[var(--primary)]/25 transition-all hover:opacity-90 active:scale-[0.98]"
          >
            <Plus className="h-4 w-4" strokeWidth={2.5} />
            {t("ProjectsBase.newProject")}
          </button>
        </div>
      </div>

      {/* ── Stats Row ────────────────────────────── */}
      <div className="grid grid-cols-1 gap-3 min-[380px]:grid-cols-2 sm:grid-cols-4">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="group flex items-center gap-3 rounded-xl border border-[var(--border)] bg-[var(--card)] p-4 shadow-sm transition-all hover:shadow-md"
          >
            <div
              className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${stat.color} transition-transform group-hover:scale-105`}
            >
              <span className="text-base font-bold">{stat.value}</span>
            </div>
            <div>
              <p className="text-xs font-medium text-[var(--muted)]">
                {stat.label}
              </p>
              <div className="mt-1 flex items-center gap-1.5">
                <span className={`h-1.5 w-1.5 rounded-full ${stat.dotColor}`} />
                <span className="text-xs text-[var(--muted)]">
                  {totalProjects > 0
                    ? `${Math.round((stat.value / totalProjects) * 100)}%`
                    : "0%"}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* ── Loading State ────────────────────────── */}
      {fetching && !projectList.length ? (
        <div className="flex items-center justify-center rounded-xl border border-[var(--border)] bg-[var(--card)] py-20 shadow-sm">
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="h-8 w-8 animate-spin text-[var(--primary)]" />
            <p className="text-sm text-[var(--muted)]">
              {t("ProjectsBase.loadingProjects")}
            </p>
          </div>
        </div>
      ) : (
        /* ── Table ────────────────────────────────── */
        <ProjectsTable projects={projectList} onDelete={handleProjectDelete} />
      )}

      {/* ── Empty state when no projects at all ──── */}
      {!fetching && projectList.length === 0 && (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-[var(--border)] bg-[var(--card)] py-20 text-center">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-[var(--primary)]/10">
            <FolderKanban
              className="h-8 w-8 text-[var(--primary)]"
              strokeWidth={1.5}
            />
          </div>
          <h3 className="mb-1 text-lg font-semibold text-[var(--text)]">
            {t("ProjectsBase.noProjectsTitle")}
          </h3>
          <p className="mb-5 max-w-sm text-sm text-[var(--muted)]">
            {t("ProjectsBase.noProjectsDescription")}
          </p>
          <button
            onClick={() => setOpen(true)}
            className="inline-flex items-center gap-2 rounded-xl bg-[var(--primary)] px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-[var(--primary)]/25 transition-all hover:opacity-90"
          >
            <Plus className="h-4 w-4" strokeWidth={2.5} />
            {t("ProjectsBase.createFirstProject")}
          </button>
        </div>
      )}

      {/* ── Create Modal ─────────────────────────── */}
      <ProjectCreateModal
        open={open}
        onClose={() => setOpen(false)}
        onSubmit={createProject}
        loading={loading}
        error={error}
      />
    </div>
  );
}

import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  ArrowRight,
  Pencil,
  Trash2,
  MapPin,
  Calendar,
  CalendarCheck,
  CalendarClock,
  Building2,
  Layers,
  DollarSign,
  Clock,
  FileText,
  StickyNote,
  FolderKanban,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Timer,
  TrendingUp,
  Download,
} from "lucide-react";
import instance from "../../api/axiosInstance";
import ProjectEditView from "../../components/reusableComponents/ProjectEditView";
import DeleteConfirmModal from "../../components/ui/DeleteConfirmModal";
import Button from "../../components/ui/Button";
import PermissionWrapper from "../../auth/PermissionWrapper";
import { useLanguage } from "../../hooks/useLanguage";
import useRealtimeEvents from "../../hooks/useRealtimeEvents";
import toast from "react-hot-toast";
const getStatusConfig = (status, t) => {
  const s = status?.toLowerCase();
  if (s === "active" || s === "in progress")
    return {
      bg: "bg-emerald-500/10",
      text: "text-emerald-600 dark:text-emerald-400",
      dot: "bg-emerald-500",
      border: "border-emerald-500/20",
      icon: TrendingUp,
      label: t("ProjectDetails.status.inProgress"),
    };
  if (s === "completed")
    return {
      bg: "bg-blue-500/10",
      text: "text-blue-600 dark:text-blue-400",
      dot: "bg-blue-500",
      border: "border-blue-500/20",
      icon: CheckCircle2,
      label: t("ProjectDetails.status.completed"),
    };
  if (s === "planning")
    return {
      bg: "bg-violet-500/10",
      text: "text-violet-600 dark:text-violet-400",
      dot: "bg-violet-500",
      border: "border-violet-500/20",
      icon: FileText,
      label: t("ProjectDetails.status.planning"),
    };
  if (s === "pending" || s === "on hold" || s === "hold")
    return {
      bg: "bg-amber-500/10",
      text: "text-amber-600 dark:text-amber-400",
      dot: "bg-amber-500",
      border: "border-amber-500/20",
      icon: Timer,
      label: t("ProjectDetails.status.onHold"),
    };
  if (s === "cancelled")
    return {
      bg: "bg-red-500/10",
      text: "text-red-600 dark:text-red-400",
      dot: "bg-red-500",
      border: "border-red-500/20",
      icon: AlertCircle,
      label: t("ProjectDetails.status.cancelled"),
    };
  return {
    bg: "bg-[var(--hover)]",
    text: "text-[var(--muted)]",
    dot: "bg-[var(--muted)]",
    border: "border-[var(--border)]",
    icon: Clock,
    label: status || t("ProjectDetails.status.unknown"),
  };
};

/* ── Helpers ────────────────────────────────────── */
const formatDate = (dateString) => {
  if (!dateString) return null;
  return dateString;
};

const formatCurrency = (amount) => {
  if (!amount || parseFloat(amount) === 0) return null;
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

const formatRelativeDate = (dateString, t) => {
  if (!dateString) return null;
  if (/^\d{4}-/.test(dateString) && Number(dateString.slice(0, 4)) < 1700) {
    return null;
  }

  const date = new Date(dateString);
  const now = new Date();
  const diffMs = date - now;
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays < 0)
    return t("ProjectDetails.relativeDate.daysAgo", {
      count: Math.abs(diffDays),
    });

  if (diffDays === 0) return t("ProjectDetails.relativeDate.today");

  if (diffDays === 1) return t("ProjectDetails.relativeDate.tomorrow");

  return t("ProjectDetails.relativeDate.inDays", {
    count: diffDays,
  });
};

const isGregorianDateString = (dateString) =>
  /^\d{4}-/.test(dateString || "") && Number(dateString.slice(0, 4)) >= 1700;

const capitalize = (str) => {
  if (!str) return "—";
  return str.charAt(0).toUpperCase() + str.slice(1);
};

/* ── Detail Item component ──────────────────────── */
function DetailItem({ icon: Icon, label, value, muted = false }) {
  if (!value && value !== 0) return null;
  return (
    <div className="flex items-start gap-3">
      <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[var(--hover)]">
        <Icon className="h-4 w-4 text-[var(--muted)]" strokeWidth={1.8} />
      </div>
      <div className="min-w-0">
        <p className="text-xs font-medium uppercase tracking-wider text-[var(--muted)]">
          {label}
        </p>
        <p
          className={`mt-0.5 text-sm font-medium ${
            muted ? "text-[var(--muted)]" : "text-[var(--text)]"
          }`}
        >
          {value}
        </p>
      </div>
    </div>
  );
}

/* ── Stat Card component ────────────────────────── */
function StatCard({ icon: Icon, label, value, color = "primary" }) {
  const colorMap = {
    primary: "bg-[var(--primary)]/10 text-[var(--primary)]",
    success: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
    warning: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
    violet: "bg-violet-500/10 text-violet-600 dark:text-violet-400",
  };

  return (
    <div className="flex items-center gap-3 rounded-xl border border-[var(--border)] bg-[var(--card)] p-4 transition-all hover:shadow-sm">
      <div
        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${colorMap[color]}`}
      >
        <Icon className="h-5 w-5" strokeWidth={1.8} />
      </div>
      <div>
        <p className="text-xs text-[var(--muted)]">{label}</p>
        <p className="text-base font-semibold text-[var(--text)]">
          {value || "—"}
        </p>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════
   ██  MAIN COMPONENT
   ══════════════════════════════════════════════════ */
export default function ProjectDetails() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [projectDetails, setProjectDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Modals
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const { t, lang } = useLanguage();
  const isRTL = lang === "dr" || lang === "ps";
  /* ── Fetch ─────────────────────────────────────── */
  const fetchProjectDetails = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await instance.get(`/projects/${id}/`);
      setProjectDetails(response.data);
    } catch (err) {
      setError(err.userMessage || "The requested item could not be found.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjectDetails();
  }, [id]);

  useRealtimeEvents((message) => {
    if (
      message.event?.startsWith("expense.") &&
      String(message.payload?.project_id) === String(id)
    ) {
        fetchProjectDetails();
    }
  });

  /* ── Delete handler ────────────────────────────── */
  const handleDelete = async () => {
    try {
      setDeleting(true);
      await instance.delete(`/projects/${id}/`);
      setDeleteOpen(false);
      toast.success("Project deleted.");
      navigate("/manager/projects");
    } catch (err) {
      // Central axios handling shows the user-facing error.
    } finally {
      setDeleting(false);
    }
  };

  const handleDownloadContractPDF = async () => {
    try {
      const response = await instance.get(`projects/${id}/export-pdf/`, {
        responseType: "blob",
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));

      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `project_${project.name}.pdf`);

      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      toast.success("Project PDF downloaded.");
    } catch (err) {
      // Central axios handling shows the user-facing error.
    }
  };
  const formatAFN = (amount) => {
    if (!amount || parseFloat(amount) === 0) return null;

    return new Intl.NumberFormat("en-US", {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };
  const formatAmount = (amount) =>
    new Intl.NumberFormat("en-US", {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(Number(amount || 0));

  /* ── Loading state ─────────────────────────────── */
  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-[var(--primary)]" />
          <p className="text-sm text-[var(--muted)]">
            {t("ProjectDetails.loading")}
          </p>
        </div>
      </div>
    );
  }

  /* ── Error state ───────────────────────────────── */
  if (error) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="flex flex-col items-center gap-3 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-red-500/10">
            <AlertCircle className="h-7 w-7 text-[var(--danger)]" />
          </div>
          <p className="text-sm font-medium text-[var(--text)]">
            {t("ProjectDetails.failedToLoad")}
          </p>
          <p className="max-w-xs text-xs text-[var(--muted)]">{error}</p>
          <button
            onClick={fetchProjectDetails}
            className="mt-2 rounded-lg bg-[var(--primary)] px-4 py-2 text-sm font-medium text-white transition-all hover:opacity-90"
          >
            {t("ProjectDetails.retry")}
          </button>
        </div>
      </div>
    );
  }

  if (!projectDetails) return null;

  const project = projectDetails;
  const status = getStatusConfig(project.status, t);
  const StatusIcon = status.icon;

  /* ── Compute progress timeline ─────────────────── */
  const getTimelineProgress = () => {
    if (!project.start_date) return 0;
    if (
      !isGregorianDateString(project.start_date) ||
      (project.expected_completion_date &&
        !isGregorianDateString(project.expected_completion_date))
    ) {
      return null;
    }
    const start = new Date(project.start_date);
    const end = project.expected_completion_date
      ? new Date(project.expected_completion_date)
      : null;
    const now = new Date();

    if (project.status?.toLowerCase() === "completed") return 100;
    if (!end) return null;
    if (now < start) return 0;
    if (now > end) return 100;

    const total = end - start;
    const elapsed = now - start;
    return Math.round((elapsed / total) * 100);
  };

  const progress = getTimelineProgress();
  const ArrowIcon = isRTL ? ArrowRight : ArrowLeft;
  return (
    <>
      <div className="space-y-6">
        {/* ── Back + Actions bar ────────────────────── */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <button
            onClick={() => navigate("/manager/projects")}
            className="inline-flex w-fit items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-[var(--muted)] transition-all hover:bg-[var(--hover)] hover:text-[var(--text)]"
          >
            <ArrowIcon className="h-4 w-4" />
            {t("ProjectDetails.backToProjects")}
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setEditOpen(true)}
              className="inline-flex items-center gap-2 rounded-lg border border-[var(--border)] bg-[var(--card)] px-4 py-2 text-sm font-medium text-[var(--text)] shadow-sm transition-all hover:bg-[var(--hover)]"
            >
              <Pencil className="h-4 w-4" strokeWidth={1.8} />
              {t("ProjectDetails.edit")}
            </button>
            <PermissionWrapper
              permissions={["projects.delete"]}
              fallback={
                <Button
                  type="submit"
                  variant="primary"
                  disabled
                  title="You do not have permission for this action"
                >
                  {t("ProjectDetails.delete")}
                </Button>
              }
            >
              <button
                onClick={() => setDeleteOpen(true)}
                className="inline-flex items-center gap-2 rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-2 text-sm font-medium text-[var(--danger)] shadow-sm transition-all hover:bg-red-500/20"
              >
                <Trash2 className="h-4 w-4" strokeWidth={1.8} />
                {t("ProjectDetails.delete")}
              </button>
            </PermissionWrapper>
            <Button
              variant="secondary"
              onClick={handleDownloadContractPDF}
              leftIcon={<Download className="h-4 w-4" />}
            >
              {t("ProjectDetails.downloadPdf")}
            </Button>
          </div>
        </div>

        {/* ── Header Card ──────────────────────────── */}
        <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-6 shadow-sm">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            {/* Left: avatar + name */}
            <div className="flex items-start gap-4">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-[var(--primary)]/10 text-xl font-bold text-[var(--primary)]">
                {project.name?.charAt(0)?.toUpperCase() ?? "P"}
              </div>
              <div>
                <h1 className="text-2xl font-bold text-[var(--text)]">
                  {project.name}
                </h1>
                <div className="mt-1 flex flex-wrap items-center gap-3 text-sm text-[var(--muted)]">
                  {project.location && (
                    <span className="inline-flex items-center gap-1">
                      <MapPin className="h-3.5 w-3.5" strokeWidth={1.8} />
                      {project.location}
                    </span>
                  )}
                  {project.property_type && (
                    <span className="inline-flex items-center gap-1">
                      <Building2 className="h-3.5 w-3.5" strokeWidth={1.8} />
                      {capitalize(project.property_type)}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Right: status badge */}
            <span
              className={`inline-flex w-fit items-center gap-2 rounded-full border px-3 py-1.5 text-sm font-medium ${status.bg} ${status.text} ${status.border}`}
            >
              <StatusIcon className="h-4 w-4" strokeWidth={2} />
              {status.label}
            </span>
          </div>

          {/* Description */}
          {project.description && (
            <div className="mt-4 rounded-lg bg-[var(--hover)] p-4">
              <p className="text-sm leading-relaxed text-[var(--text)]">
                {project.description}
              </p>
            </div>
          )}
        </div>

        {/* ── Quick Stats ──────────────────────────── */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
          <StatCard
            icon={Layers}
            label={t("ProjectDetails.totalFloors")}
            value={project.total_floors || "—"}
            color="violet"
          />

          <StatCard
            icon={DollarSign}
            label={t("ProjectDetails.estimatedBudget")}
            value={formatCurrency(project.estimated_budget) || "Not set"}
            color="success"
          />

          <StatCard
            icon={DollarSign}
            label={t("ProjectDetails.expensesUsd")}
            value={formatCurrency(project.total_expenses_usd) || "$0"}
            color="success"
          />

          <StatCard
            icon={DollarSign}
            label={t("ProjectDetails.expensesAfn")}
            value={formatAFN(project.total_expenses_afn) || "0"}
            color="warning"
          />

          <StatCard
            icon={Calendar}
            label={t("ProjectDetails.startDate")}
            value={formatDate(project.start_date) || "Not set"}
            color="primary"
          />

          <StatCard
            icon={CalendarCheck}
            label={t("ProjectDetails.expectedCompletion")}
            value={formatDate(project.expected_completion_date) || "Not set"}
            color="warning"
          />
        </div>
        {/* ── Contract Financial Summary ───────────────── */}
        <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-6 shadow-sm">
          <h3 className="mb-5 flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-[var(--muted)]">
            <DollarSign className="h-4 w-4" />
            {t("ProjectDetails.contractFinancialSummary")}
          </h3>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            {/* Contract Value */}
            <div className="rounded-xl border border-[var(--border)] p-4">
              <h4 className="mb-3 text-sm font-medium text-[var(--muted)]">
                {t("ProjectDetails.totalContractValue")}
              </h4>

              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>{t("ProjectDetails.currency.usd")}</span>
                  <span className="font-semibold">
                    ${formatAFN(project.total_contract_value?.USD)}
                  </span>
                </div>

                <div className="flex justify-between">
                  <span>{t("ProjectDetails.currency.afn")}</span>
                  <span className="font-semibold">
                    {formatAFN(project.total_contract_value?.AFN)}
                    {t("ProjectDetails.currency.afn")}
                  </span>
                </div>
              </div>
            </div>

            {/* Payments */}
            <div className="rounded-xl border border-[var(--border)] p-4">
              <h4 className="mb-3 text-sm font-medium text-[var(--muted)]">
                {t("ProjectDetails.totalPayments")}
              </h4>

              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>{t("ProjectDetails.currency.usd")} </span>
                  <span className="font-semibold">
                    ${formatAFN(project.total_contract_payments?.USD)}
                  </span>
                </div>

                <div className="flex justify-between">
                  <span>{t("ProjectDetails.currency.afn")} </span>
                  <span className="font-semibold">
                    {formatAFN(project.total_contract_payments?.AFN)}{" "}
                    {t("ProjectDetails.currency.afn")}
                  </span>
                </div>
              </div>
            </div>

            {/* Remaining */}
            <div className="rounded-xl border border-[var(--border)] p-4">
              <h4 className="mb-3 text-sm font-medium text-[var(--muted)]">
                {t("ProjectDetails.remainingBalance")}
              </h4>

              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>{t("ProjectDetails.currency.usd")} </span>
                  <span className="font-semibold text-emerald-600">
                    ${formatAFN(project.remaining_contract_balance?.USD)}
                  </span>
                </div>

                <div className="flex justify-between">
                  <span>{t("ProjectDetails.currency.afn")} </span>
                  <span className="font-semibold text-emerald-600">
                    {formatAFN(project.remaining_contract_balance?.AFN)}{" "}
                    {t("ProjectDetails.currency.afn")}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ── Timeline Progress ────────────────────── */}
        <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-6 shadow-sm">
          <h3 className="mb-5 flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-[var(--muted)]">
            <DollarSign className="h-4 w-4" />
            Daily Worker Payroll
          </h3>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {["USD", "AFN"].map((currency) => {
              const row = project.worker_payroll_summary?.[currency] || {};
              return (
                <div
                  key={currency}
                  className="rounded-xl border border-[var(--border)] p-4"
                >
                  <div className="mb-3 flex items-center justify-between">
                    <h4 className="text-sm font-medium text-[var(--muted)]">
                      {currency}
                    </h4>
                    <span className="rounded-full bg-[var(--hover)] px-2 py-1 text-xs text-[var(--muted)]">
                      {row.count || 0} records
                    </span>
                  </div>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Gross</span>
                      <span className="font-semibold">
                        {currency} {formatAmount(row.gross)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Advances</span>
                      <span className="font-semibold">
                        {currency} {formatAmount(row.advances)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Deductions</span>
                      <span className="font-semibold">
                        {currency} {formatAmount(row.deductions)}
                      </span>
                    </div>
                    <div className="flex justify-between border-t border-[var(--border)] pt-2">
                      <span>Net payroll</span>
                      <span className="font-semibold text-emerald-600">
                        {currency} {formatAmount(row.net)}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {progress !== null && (
          <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-6 shadow-sm">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-[var(--text)]">
                {t("ProjectDetails.timelineProgress")}
              </h3>
              <span className="text-sm font-medium text-[var(--primary)]">
                {progress}%
              </span>
            </div>
            <div className="h-2.5 w-full overflow-hidden rounded-full bg-[var(--hover)]">
              <div
                className="h-full rounded-full bg-[var(--primary)] transition-all duration-700 ease-out"
                style={{ width: `${progress}%` }}
              />
            </div>
            <div className="mt-2 flex items-center justify-between text-xs text-[var(--muted)]">
              <span>{formatDate(project.start_date)}</span>
              {project.expected_completion_date && (
                <span>
                  {formatRelativeDate(project.expected_completion_date, t)}
                </span>
              )}
            </div>
          </div>
        )}

        {/* ── Details Grid ─────────────────────────── */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Left: Project Information */}
          <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-6 shadow-sm">
            <h3 className="mb-5 flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-[var(--muted)]">
              <FolderKanban className="h-4 w-4" />
              {t("ProjectDetails.projectInformation")}
            </h3>
            <div className="space-y-5">
              <DetailItem
                icon={FolderKanban}
                label={t("ProjectDetails.projectName")}
                value={project.name}
              />
              <DetailItem
                icon={Building2}
                label={t("ProjectDetails.propertyType")}
                value={capitalize(project.property_type)}
              />
              <DetailItem
                icon={MapPin}
                label={t("ProjectDetails.location")}
                value={project.location || "—"}
              />
              <DetailItem
                icon={Layers}
                label={t("ProjectDetails.totalFloors")}
                value={project.total_floors}
              />
              <DetailItem
                icon={DollarSign}
                label={t("ProjectDetails.estimatedBudget")}
                value={formatCurrency(project.estimated_budget) || "Not set"}
              />
            </div>
          </div>

          {/* Right: Dates & Notes */}
          <div className="space-y-6">
            {/* Dates Card */}
            <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-6 shadow-sm">
              <h3 className="mb-5 flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-[var(--muted)]">
                <Calendar className="h-4 w-4" />
                {t("ProjectDetails.importantDates")}
              </h3>
              <div className="space-y-5">
                <DetailItem
                  icon={Calendar}
                  label={t("ProjectDetails.startDate")}
                  value={formatDate(project.start_date)}
                />
                <DetailItem
                  icon={CalendarClock}
                  label={t("ProjectDetails.expectedCompletion")}
                  value={
                    formatDate(project.expected_completion_date) || "Not set"
                  }
                />
                <DetailItem
                  icon={CalendarCheck}
                  label={t("ProjectDetails.actualCompletion")}
                  value={
                    formatDate(project.actual_completion_date) || "Not yet"
                  }
                  muted={!project.actual_completion_date}
                />
                <DetailItem
                  icon={Clock}
                  label={t("ProjectDetails.created")}
                  value={formatDate(project.created_at)}
                  muted
                />
                <DetailItem
                  icon={Clock}
                  label={t("ProjectDetails.lastUpdated")}
                  value={formatDate(project.updated_at)}
                  muted
                />
              </div>
            </div>

            {/* Notes Card */}
            {project.notes && (
              <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-6 shadow-sm">
                <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-[var(--muted)]">
                  <StickyNote className="h-4 w-4" />
                  {t("ProjectDetails.notes")}
                </h3>
                <div className="rounded-lg bg-[var(--hover)] p-4">
                  <p className="whitespace-pre-wrap text-sm leading-relaxed text-[var(--text)]">
                    {project.notes}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Edit Modal ─────────────────────────────── */}
      {editOpen && (
        <ProjectEditView
          projectId={project.id}
          open={editOpen}
          onClose={() => setEditOpen(false)}
          onSaved={() => {
            setEditOpen(false);
            fetchProjectDetails(); // Refresh data after save
          }}
        />
      )}

      {/* ── Delete Confirm Modal ───────────────────── */}
      <DeleteConfirmModal
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        onConfirm={handleDelete}
        itemName={project.name}
        loading={deleting}
      />
    </>
  );
}

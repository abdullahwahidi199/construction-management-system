import { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import {
  Calendar,
  CheckCircle2,
  ClipboardCheck,
  Filter,
  Loader2,
  RefreshCw,
  Search,
  User,
  X,
  XCircle,
} from "lucide-react";
import toast from "react-hot-toast";
import instance from "../../api/axiosInstance";
import PermissionWrapper from "../../auth/PermissionWrapper";
import useRealtimeEvents from "../../hooks/useRealtimeEvents";
import { getFriendlyErrorMessage } from "../../utils/apiErrors";

const STATUS_OPTIONS = [
  { value: "pending", label: "Pending" },
  { value: "approved", label: "Approved" },
  { value: "rejected", label: "Rejected" },
];

const statusClass = {
  pending: "bg-amber-500/10 text-amber-700 dark:text-amber-300",
  approved: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
  rejected: "bg-red-500/10 text-red-700 dark:text-red-300",
};

function formatDate(value) {
  if (!value) return "-";
  return String(value).replace("T", " ").slice(0, 16);
}

function money(value, currency) {
  const number = Number(value || 0);
  return `${currency} ${number.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function DetailItem({ label, value }) {
  return (
    <div>
      <p className="text-xs font-medium uppercase tracking-wide text-[var(--muted)]">
        {label}
      </p>
      <p className="mt-1 break-words text-sm font-medium text-[var(--text)]">
        {value || "-"}
      </p>
    </div>
  );
}

function expenseFromRealtimePayload(payload = {}) {
  return {
    id: payload.expense_id,
    project: payload.project_id,
    project_name: payload.project_name || "",
    serial_number: payload.serial_number,
    expense_date: payload.expense_date || "",
    description: payload.description || "",
    remarks: payload.remarks || "",
    paid_to: payload.paid_to || "",
    expense_type: payload.expense_type || "",
    amount_afn: payload.amount_afn || "0.00",
    amount_usd: payload.amount_usd || "0.00",
    exchange_rate: payload.exchange_rate || "0.00",
    total_usd: payload.total_usd || "0.00",
    total_afn: payload.total_afn || "0.00",
    created_by: payload.created_by,
    created_by_name: payload.created_by_name || "",
    approval_status: payload.approval_status,
    approved_by: payload.approved_by,
    approved_by_name: payload.approved_by_name || "",
    approved_at: payload.approved_at || "",
    rejected_by: payload.rejected_by,
    rejected_by_name: payload.rejected_by_name || "",
    rejected_at: payload.rejected_at || "",
    approval_notes: payload.approval_notes || "",
    approval_history: payload.approval_history || [],
    created_at: payload.created_at || "",
    updated_at: payload.updated_at || "",
  };
}

function rowMatchesFilters(expense, filters) {
  if (!expense?.id) return false;
  if (filters.status && expense.approval_status !== filters.status) return false;
  if (filters.project && String(expense.project) !== String(filters.project)) return false;
  if (filters.creator && String(expense.created_by) !== String(filters.creator)) return false;
  if (filters.date_from && expense.expense_date && expense.expense_date < filters.date_from) {
    return false;
  }
  if (filters.date_to && expense.expense_date && expense.expense_date > filters.date_to) {
    return false;
  }
  if (filters.search) {
    const query = filters.search.toLowerCase();
    const haystack = [
      expense.serial_number,
      expense.description,
      expense.remarks,
      expense.paid_to,
      expense.project_name,
      expense.created_by_name,
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();
    if (!haystack.includes(query)) return false;
  }
  return true;
}

export default function ExpenseApprovalsPage() {
  const [searchParams] = useSearchParams();
  const highlightedExpenseId = Number(searchParams.get("expense") || 0);
  const seenRealtimeEventsRef = useRef(new Set());
  const fetchedHighlightRef = useRef(null);
  const [rows, setRows] = useState([]);
  const [summary, setSummary] = useState({
    pending: 0,
    approved: 0,
    rejected: 0,
    approval_enabled: false,
  });
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [selectedExpense, setSelectedExpense] = useState(null);
  const [actionTarget, setActionTarget] = useState(null);
  const [actionMode, setActionMode] = useState(null);
  const [notes, setNotes] = useState("");
  const [filters, setFilters] = useState({
    status: "pending",
    search: "",
    project: "",
    creator: "",
    date_from: "",
    date_to: "",
  });

  const activeFilters = useMemo(
    () => Object.values(filters).filter(Boolean).length,
    [filters],
  );

  const buildParams = () => {
    const params = {};
    if (filters.status) params.status = filters.status;
    if (filters.search) params.search = filters.search;
    if (filters.project) params.project = filters.project;
    if (filters.creator) params.creator = filters.creator;
    if (filters.date_from) params.expense_date__gte = filters.date_from;
    if (filters.date_to) params.expense_date__lte = filters.date_to;
    return params;
  };

  const fetchQueue = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await instance.get("expenses/approvals/", {
        params: buildParams(),
      });
      const payload = res.data?.results || res.data || {};
      const list = Array.isArray(payload.results)
        ? payload.results
        : Array.isArray(payload)
          ? payload
          : [];
      setRows(list);
      setSummary(payload.summary || res.data?.summary || summary);
      if (selectedExpense) {
        const fresh = list.find((item) => item.id === selectedExpense.id);
        if (fresh) setSelectedExpense(fresh);
      }
    } catch (err) {
      setError(
        getFriendlyErrorMessage(err, "Unable to load expense approval queue."),
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQueue();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters.status]);

  useEffect(() => {
    instance
      .get("projects/")
      .then((res) => setProjects(Array.isArray(res.data) ? res.data : []))
      .catch(() => setProjects([]));
  }, []);

  useEffect(() => {
    if (!highlightedExpenseId) return;
    const match = rows.find((item) => Number(item.id) === highlightedExpenseId);
    if (match) {
      setSelectedExpense(match);
      return;
    }

    if (fetchedHighlightRef.current === highlightedExpenseId) return;
    fetchedHighlightRef.current = highlightedExpenseId;

    let active = true;
    instance
      .get(`expenses/${highlightedExpenseId}/`)
      .then((res) => {
        if (active) setSelectedExpense(res.data);
      })
      .catch(() => {
        if (active) fetchedHighlightRef.current = null;
        toast.error("The requested item could not be found.");
      });

    return () => {
      active = false;
    };
  }, [highlightedExpenseId, rows]);

  useRealtimeEvents((message) => {
    if (!message.event?.startsWith("expense.")) return;

    const payload = message.payload || {};
    const eventId = payload.id || `${message.event}:${payload.expense_id}`;
    if (seenRealtimeEventsRef.current.has(eventId)) return;
    seenRealtimeEventsRef.current.add(eventId);

    if (message.event === "expense.approval.request") {
      const expense = expenseFromRealtimePayload({
        ...payload,
        approval_status: "pending",
      });
      const alreadyLoaded = rows.some(
        (item) => Number(item.id) === Number(expense.id),
      );

      if (!alreadyLoaded) {
        setSummary((current) => ({
          ...current,
          pending: (Number(current.pending) || 0) + 1,
        }));
      }

      setRows((current) => {
        if (current.some((item) => Number(item.id) === Number(expense.id))) {
          return current;
        }
        if (!rowMatchesFilters(expense, filters)) return current;
        return [expense, ...current];
      });

      if (highlightedExpenseId === expense.id) {
        setSelectedExpense(expense);
      }
      return;
    }

    if (message.event === "expense.approval") {
      const nextStatus = payload.event;
      if (!["approved", "rejected"].includes(nextStatus)) return;

      const expense = expenseFromRealtimePayload({
        ...payload,
        approval_status: nextStatus,
      });

      setSummary((current) => ({
        ...current,
        pending: Math.max(0, (Number(current.pending) || 0) - 1),
        [nextStatus]: (Number(current[nextStatus]) || 0) + 1,
      }));

      setRows((current) => {
        const withoutExpense = current.filter(
          (item) => Number(item.id) !== Number(expense.id),
        );
        if (!rowMatchesFilters(expense, filters)) return withoutExpense;
        return [expense, ...withoutExpense];
      });

      setSelectedExpense((current) =>
        Number(current?.id) === Number(expense.id) ? expense : current,
      );
    }
  });

  const updateFilter = (key, value) => {
    setFilters((current) => ({ ...current, [key]: value }));
  };

  const resetFilters = () => {
    setFilters({
      status: "pending",
      search: "",
      project: "",
      creator: "",
      date_from: "",
      date_to: "",
    });
  };

  const openAction = (expense, mode) => {
    setActionTarget(expense);
    setActionMode(mode);
    setNotes("");
  };

  const closeAction = () => {
    setActionTarget(null);
    setActionMode(null);
    setNotes("");
  };

  const submitAction = async () => {
    if (!actionTarget || !actionMode) return;
    if (actionMode === "reject" && !notes.trim()) {
      setError("A rejection reason is required.");
      toast.error("A rejection reason is required.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      await instance.post(`expenses/${actionTarget.id}/${actionMode}/`, {
        approval_notes: notes,
      });
      toast.success(
        actionMode === "approve" ? "Expense approved." : "Expense rejected.",
      );
      closeAction();
      await fetchQueue();
    } catch (err) {
      setError(
        getFriendlyErrorMessage(err, `Unable to ${actionMode} expense.`),
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <PermissionWrapper
      permissions={["expenses.approve"]}
      fallback={
        <div className="rounded-lg border border-[var(--border)] bg-[var(--card)] p-6 text-sm text-[var(--muted)]">
          You do not have permission to approve expenses.
        </div>
      }
    >
      <div className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[var(--primary)]/10">
              <ClipboardCheck className="h-6 w-6 text-[var(--primary)]" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-[var(--text)]">
                Expense Approvals
              </h1>
              <p className="text-sm text-[var(--muted)]">
                {summary.approval_enabled
                  ? "Approval workflow is enabled"
                  : "Approval workflow is disabled"}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={fetchQueue}
            disabled={loading}
            className="inline-flex h-10 items-center gap-2 rounded-xl border border-[var(--border)] bg-[var(--card)] px-4 text-sm font-medium text-[var(--text)] hover:bg-[var(--hover)]"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </button>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          {STATUS_OPTIONS.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => updateFilter("status", option.value)}
              className={`rounded-xl border border-[var(--border)] bg-[var(--card)] p-4 text-left transition hover:bg-[var(--hover)] ${
                filters.status === option.value ? "ring-2 ring-[var(--primary)]/30" : ""
              }`}
            >
              <p className="text-sm text-[var(--muted)]">{option.label}</p>
              <p className="mt-1 text-2xl font-bold text-[var(--text)]">
                {summary[option.value] || 0}
              </p>
            </button>
          ))}
        </div>

        <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-4">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-6">
            <div className="relative md:col-span-2">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--muted)]" />
              <input
                value={filters.search}
                onChange={(event) => updateFilter("search", event.target.value)}
                placeholder="Search expenses"
                className="h-10 w-full rounded-lg border border-[var(--border)] bg-[var(--bg)] pl-9 pr-3 text-sm text-[var(--text)] outline-none focus:border-[var(--primary)]"
              />
            </div>
            <select
              value={filters.project}
              onChange={(event) => updateFilter("project", event.target.value)}
              className="h-10 rounded-lg border border-[var(--border)] bg-[var(--bg)] px-3 text-sm text-[var(--text)] outline-none focus:border-[var(--primary)]"
            >
              <option value="">All projects</option>
              {projects.map((project) => (
                <option key={project.id} value={project.id}>
                  {project.name}
                </option>
              ))}
            </select>
            <div className="relative">
              <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--muted)]" />
              <input
                value={filters.creator}
                onChange={(event) => updateFilter("creator", event.target.value)}
                placeholder="Creator ID"
                className="h-10 w-full rounded-lg border border-[var(--border)] bg-[var(--bg)] pl-9 pr-3 text-sm text-[var(--text)] outline-none focus:border-[var(--primary)]"
              />
            </div>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--muted)]" />
              <input
                type="date"
                value={filters.date_from}
                onChange={(event) => updateFilter("date_from", event.target.value)}
                className="h-10 w-full rounded-lg border border-[var(--border)] bg-[var(--bg)] pl-9 pr-3 text-sm text-[var(--text)] outline-none focus:border-[var(--primary)]"
              />
            </div>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--muted)]" />
              <input
                type="date"
                value={filters.date_to}
                onChange={(event) => updateFilter("date_to", event.target.value)}
                className="h-10 w-full rounded-lg border border-[var(--border)] bg-[var(--bg)] pl-9 pr-3 text-sm text-[var(--text)] outline-none focus:border-[var(--primary)]"
              />
            </div>
          </div>
          <div className="mt-3 flex items-center gap-2">
            <button
              type="button"
              onClick={fetchQueue}
              className="inline-flex h-9 items-center gap-2 rounded-lg bg-[var(--primary)] px-3 text-sm font-medium text-white hover:opacity-90"
            >
              <Filter className="h-4 w-4" />
              Apply Filters
            </button>
            {activeFilters > 1 && (
              <button
                type="button"
                onClick={resetFilters}
                className="inline-flex h-9 items-center gap-2 rounded-lg border border-[var(--border)] px-3 text-sm text-[var(--text)] hover:bg-[var(--hover)]"
              >
                <X className="h-4 w-4" />
                Reset
              </button>
            )}
          </div>
        </div>

        {error && (
          <div className="rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-600">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1fr)_28rem]">
          <div className="overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--card)]">
            {loading ? (
              <div className="flex items-center justify-center py-20 text-[var(--muted)]">
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Loading approvals
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="border-b border-[var(--border)] bg-[var(--bg)]/60">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-[var(--muted)]">
                        Expense
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-[var(--muted)]">
                        Project
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-[var(--muted)]">
                        Creator
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-[var(--muted)]">
                        Amount
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-[var(--muted)]">
                        Status
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-semibold uppercase text-[var(--muted)]">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--border)]">
                    {rows.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="px-4 py-12 text-center text-sm text-[var(--muted)]">
                          No expenses found
                        </td>
                      </tr>
                    ) : (
                      rows.map((expense) => (
                        <tr
                          key={expense.id}
                          onClick={() => setSelectedExpense(expense)}
                          className="cursor-pointer hover:bg-[var(--hover)]"
                        >
                          <td className="px-4 py-3">
                            <p className="font-semibold text-[var(--text)]">
                              #{expense.serial_number}
                            </p>
                            <p className="max-w-sm truncate text-xs text-[var(--muted)]">
                              {expense.description}
                            </p>
                          </td>
                          <td className="px-4 py-3 text-sm text-[var(--text)]">
                            {expense.project_name || "-"}
                          </td>
                          <td className="px-4 py-3 text-sm text-[var(--text)]">
                            {expense.created_by_name || "-"}
                          </td>
                          <td className="px-4 py-3 text-sm text-[var(--text)]">
                            <div>{money(expense.total_usd, "USD")}</div>
                            <div className="text-xs text-[var(--muted)]">
                              {money(expense.total_afn, "AFN")}
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold capitalize ${statusClass[expense.approval_status]}`}>
                              {expense.approval_status}
                            </span>
                            {expense.approval_status === "approved" && (
                              <p className="mt-1 text-xs text-[var(--muted)]">
                                {expense.approved_by_name || "-"} - {formatDate(expense.approved_at)}
                              </p>
                            )}
                            {expense.approval_status === "rejected" && (
                              <p className="mt-1 max-w-xs truncate text-xs text-[var(--muted)]">
                                {expense.approval_notes || "No reason"}
                              </p>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex justify-end gap-2">
                              {expense.approval_status === "pending" && (
                                <>
                                  <button
                                    type="button"
                                    onClick={(event) => {
                                      event.stopPropagation();
                                      openAction(expense, "approve");
                                    }}
                                    className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-emerald-600 px-3 text-xs font-semibold text-white hover:opacity-90"
                                  >
                                    <CheckCircle2 className="h-4 w-4" />
                                    Approve
                                  </button>
                                  <button
                                    type="button"
                                    onClick={(event) => {
                                      event.stopPropagation();
                                      openAction(expense, "reject");
                                    }}
                                    className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-red-600 px-3 text-xs font-semibold text-white hover:opacity-90"
                                  >
                                    <XCircle className="h-4 w-4" />
                                    Reject
                                  </button>
                                </>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <aside className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-4">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-[var(--muted)]">
              Expense Details
            </h2>
            {!selectedExpense ? (
              <p className="mt-6 text-sm text-[var(--muted)]">
                Select an expense to review its full details.
              </p>
            ) : (
              <div className="mt-4 space-y-5">
                <div className="rounded-xl border border-[var(--border)] bg-[var(--bg)] p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="text-lg font-semibold text-[var(--text)]">
                        #{selectedExpense.serial_number}
                      </p>
                      <p className="mt-1 text-sm text-[var(--muted)]">
                        {selectedExpense.project_name || "-"}
                      </p>
                    </div>
                    <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold capitalize ${statusClass[selectedExpense.approval_status]}`}>
                      {selectedExpense.approval_status || "approved"}
                    </span>
                  </div>
                  <p className="mt-4 whitespace-pre-wrap text-sm text-[var(--text)]">
                    {selectedExpense.description || "-"}
                  </p>
                </div>

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <DetailItem label="Expense Date" value={formatDate(selectedExpense.expense_date)} />
                  <DetailItem label="Type" value={selectedExpense.expense_type} />
                  <DetailItem label="Paid To" value={selectedExpense.paid_to} />
                  <DetailItem label="Prepared By" value={selectedExpense.created_by_name} />
                  <DetailItem label="Created" value={formatDate(selectedExpense.created_at)} />
                  <DetailItem label="Updated" value={formatDate(selectedExpense.updated_at)} />
                </div>

                <div className="rounded-xl border border-[var(--border)] p-4">
                  <p className="mb-3 text-sm font-semibold text-[var(--text)]">
                    Financial Details
                  </p>
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <DetailItem label="Amount USD" value={money(selectedExpense.amount_usd, "USD")} />
                    <DetailItem label="Amount AFN" value={money(selectedExpense.amount_afn, "AFN")} />
                    <DetailItem label="Exchange Rate" value={selectedExpense.exchange_rate} />
                    <DetailItem label="Total USD" value={money(selectedExpense.total_usd, "USD")} />
                    <DetailItem label="Total AFN" value={money(selectedExpense.total_afn, "AFN")} />
                  </div>
                </div>

                {(selectedExpense.remarks || selectedExpense.approval_notes) && (
                  <div className="space-y-3">
                    {selectedExpense.remarks && (
                      <div className="rounded-xl border border-[var(--border)] p-4">
                        <p className="text-xs font-medium uppercase tracking-wide text-[var(--muted)]">
                          Remarks
                        </p>
                        <p className="mt-2 whitespace-pre-wrap text-sm text-[var(--text)]">
                          {selectedExpense.remarks}
                        </p>
                      </div>
                    )}
                    {selectedExpense.approval_notes && (
                      <div className="rounded-xl border border-[var(--border)] p-4">
                        <p className="text-xs font-medium uppercase tracking-wide text-[var(--muted)]">
                          Approval Notes / Rejection Reason
                        </p>
                        <p className="mt-2 whitespace-pre-wrap text-sm text-[var(--text)]">
                          {selectedExpense.approval_notes}
                        </p>
                      </div>
                    )}
                  </div>
                )}

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <DetailItem label="Approved By" value={selectedExpense.approved_by_name} />
                  <DetailItem label="Approved At" value={formatDate(selectedExpense.approved_at)} />
                  <DetailItem label="Rejected By" value={selectedExpense.rejected_by_name} />
                  <DetailItem label="Rejected At" value={formatDate(selectedExpense.rejected_at)} />
                </div>

                {selectedExpense.approval_status === "pending" && (
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => openAction(selectedExpense, "approve")}
                      className="inline-flex h-10 flex-1 items-center justify-center gap-2 rounded-lg bg-emerald-600 px-3 text-sm font-semibold text-white hover:opacity-90"
                    >
                      <CheckCircle2 className="h-4 w-4" />
                      Approve
                    </button>
                    <button
                      type="button"
                      onClick={() => openAction(selectedExpense, "reject")}
                      className="inline-flex h-10 flex-1 items-center justify-center gap-2 rounded-lg bg-red-600 px-3 text-sm font-semibold text-white hover:opacity-90"
                    >
                      <XCircle className="h-4 w-4" />
                      Reject
                    </button>
                  </div>
                )}

                <div className="rounded-xl border border-[var(--border)] p-4">
                  <p className="mb-3 text-sm font-semibold text-[var(--text)]">
                    Approval History
                  </p>
                  <div className="space-y-4">
                {(selectedExpense.approval_history || []).map((entry, index) => (
                  <div key={`${entry.status}-${index}`} className="border-l-2 border-[var(--border)] pl-3">
                    <p className="text-sm font-semibold capitalize text-[var(--text)]">
                      {entry.status}
                    </p>
                    <p className="text-xs text-[var(--muted)]">
                      {formatDate(entry.at)} - {entry.by || "-"}
                    </p>
                    {entry.notes && (
                      <p className="mt-1 text-sm text-[var(--text)]">
                        {entry.notes}
                      </p>
                    )}
                  </div>
                ))}
                    {(selectedExpense.approval_history || []).length === 0 && (
                      <p className="text-sm text-[var(--muted)]">
                        No approval history available.
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}
          </aside>
        </div>

        {actionTarget && (
          <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/50 p-4">
            <div className="w-full max-w-lg rounded-xl border border-[var(--border)] bg-[var(--card)] p-5 shadow-2xl">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-lg font-semibold capitalize text-[var(--text)]">
                    {actionMode} Expense #{actionTarget.serial_number}
                  </h2>
                  <p className="mt-1 text-sm text-[var(--muted)]">
                    {actionTarget.description}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={closeAction}
                  className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-[var(--muted)] hover:bg-[var(--hover)]"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              <textarea
                value={notes}
                onChange={(event) => setNotes(event.target.value)}
                rows={4}
                placeholder={actionMode === "reject" ? "Reject reason" : "Approval notes"}
                className="mt-4 w-full rounded-lg border border-[var(--border)] bg-[var(--bg)] px-3 py-2 text-sm text-[var(--text)] outline-none focus:border-[var(--primary)]"
              />
              <div className="mt-5 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={closeAction}
                  className="rounded-lg border border-[var(--border)] px-4 py-2 text-sm text-[var(--text)] hover:bg-[var(--hover)]"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={saving}
                  onClick={submitAction}
                  className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold text-white disabled:opacity-60 ${
                    actionMode === "approve" ? "bg-emerald-600" : "bg-red-600"
                  }`}
                >
                  {saving && <Loader2 className="h-4 w-4 animate-spin" />}
                  {actionMode === "approve" ? "Approve" : "Reject"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </PermissionWrapper>
  );
}

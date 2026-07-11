/* eslint-disable react-hooks/exhaustive-deps, react-hooks/set-state-in-effect */
import { useEffect, useMemo, useState } from "react";
import {
  Activity,
  AlertTriangle,
  CalendarClock,
  Download,
  FileSpreadsheet,
  Filter,
  Search,
  ShieldCheck,
  User,
  X,
} from "lucide-react";
import api from "../api/axiosInstance";
import Card from "../components/ui/Card";
import Button from "../components/ui/Button";

const PAGE_SIZE = 25;

const inputClass =
  "h-10 w-full rounded-lg border border-[var(--border)] bg-[var(--bg)] px-3 text-sm text-[var(--text)] shadow-sm outline-none transition focus:border-[var(--primary)] focus:ring-2 focus:ring-[color:rgba(37,99,235,0.18)]";

const formatDateTime = (value) => {
  if (!value) return "-";
  return new Date(value).toLocaleString();
};

const formatValue = (value) => {
  if (value === null || value === undefined || value === "") return "-";
  if (typeof value === "object") return JSON.stringify(value, null, 2);
  return String(value);
};

function SummaryCard({ icon: Icon, label, value, tone = "var(--primary)" }) {
  return (
    <div className="rounded-lg border border-[var(--border)] bg-[var(--card)] p-4 shadow-sm">
      <div className="flex items-center gap-3">
        <span
          className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg"
          style={{ background: `${tone}1F`, color: tone }}
        >
          <Icon className="h-5 w-5" />
        </span>
        <div className="min-w-0">
          <div className="text-2xl font-bold text-[var(--text)]">{value ?? 0}</div>
          <div className="text-sm text-[var(--muted)]">{label}</div>
        </div>
      </div>
    </div>
  );
}

function InfoRow({ label, value, wrap = false }) {
  return (
    <div className="grid gap-1 border-b border-[var(--border)] py-2 last:border-b-0 sm:grid-cols-[140px_1fr]">
      <dt className="text-xs font-semibold uppercase tracking-wide text-[var(--muted)]">
        {label}
      </dt>
      <dd
        className={`text-sm font-medium text-[var(--text)] ${
          wrap ? "break-all" : ""
        }`}
      >
        {value || "-"}
      </dd>
    </div>
  );
}

function ChangeRow({ field, change, financial }) {
  const isCurrency = field.toLowerCase().includes("currency");
  const highlighted = financial || isCurrency;

  return (
    <div
      className={`rounded-lg border p-3 shadow-sm ${
        highlighted
          ? "border-yellow-500/50 bg-yellow-500/10"
          : "border-[var(--border)] bg-[var(--bg)]"
      }`}
    >
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
        <div className="text-xs font-semibold uppercase tracking-wide text-[var(--muted)]">
          {field}
        </div>
        {highlighted && (
          <span className="rounded-full bg-yellow-500/15 px-2 py-1 text-xs font-medium text-yellow-700 dark:text-yellow-300">
            {isCurrency ? "Currency" : "Financial"}
          </span>
        )}
      </div>
      <div className="grid gap-2 text-sm lg:grid-cols-[1fr_auto_1fr] lg:items-stretch">
        <pre className="max-h-48 overflow-auto whitespace-pre-wrap rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-2 font-sans text-[var(--text)]">
          {formatValue(change.old)}
        </pre>
        <div className="flex items-center justify-center text-xs font-semibold uppercase tracking-wide text-[var(--muted)]">
          changed to
        </div>
        <pre className="max-h-48 overflow-auto whitespace-pre-wrap rounded-lg border border-green-500/20 bg-green-500/10 px-3 py-2 font-sans text-[var(--text)]">
          {formatValue(change.new)}
        </pre>
      </div>
    </div>
  );
}

function DetailPanel({ log, onClose }) {
  if (!log) return null;
  const changes = log.field_changes || {};
  const financialFields = new Set(Object.keys(log.financial_changes || {}));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 p-3 backdrop-blur-sm">
      <section className="flex max-h-[92vh] w-full max-w-5xl flex-col overflow-hidden rounded-lg border border-[var(--border)] bg-[var(--bg)] shadow-2xl">
        <header className="flex items-start justify-between gap-3 border-b border-[var(--border)] bg-[var(--card)] px-5 py-4">
          <div className="min-w-0">
            <div className="mb-1 flex flex-wrap items-center gap-2">
              <h2 className="text-xl font-bold text-[var(--text)]">Audit Detail</h2>
              <span
                className={`rounded-full px-2 py-1 text-xs font-semibold ${
                  log.status === "failed"
                    ? "bg-red-500/10 text-red-600"
                    : "bg-green-500/10 text-green-600"
                }`}
              >
                {log.status}
              </span>
            </div>
            <p className="break-all text-sm text-[var(--muted)]">{log.action}</p>
          </div>
          <button
            className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-[var(--muted)] transition hover:bg-[var(--hover)] hover:text-[var(--text)]"
            onClick={onClose}
            title="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </header>

        <div className="overflow-y-auto p-5">
          {log.warnings?.length > 0 && (
            <div className="mb-4 rounded-lg border border-yellow-500/40 bg-yellow-500/10 p-3 text-sm text-yellow-700 dark:text-yellow-300">
              {log.warnings.map((warning) => (
                <div key={warning} className="flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 shrink-0" />
                  <span>{warning}</span>
                </div>
              ))}
            </div>
          )}

          <div className="mb-4 grid gap-4 lg:grid-cols-2">
            <Card title="Request">
              <dl>
                <InfoRow label="User" value={log.username || "System"} />
                <InfoRow label="Timestamp" value={formatDateTime(log.timestamp)} />
                <InfoRow label="IP address" value={log.ip_address || "-"} />
                <InfoRow label="Method" value={log.request_method || "-"} />
                <InfoRow label="Endpoint" value={log.endpoint || "-"} wrap />
              </dl>
            </Card>

            <Card title="Object">
              <dl>
                <InfoRow label="Model" value={log.model_name || "-"} />
                <InfoRow label="Object ID" value={log.object_id || "-"} />
                <InfoRow label="Object" value={log.object_repr || "-"} wrap />
                <InfoRow label="Description" value={log.description || "-"} wrap />
              </dl>
            </Card>
          </div>

          <Card
            title="Field Changes"
            right={
              <span className="text-sm text-[var(--muted)]">
                {Object.keys(changes).length} changed fields
              </span>
            }
          >
            {Object.keys(changes).length === 0 ? (
              <div className="rounded-lg border border-[var(--border)] bg-[var(--bg)] p-4 text-sm text-[var(--muted)]">
                No field-level changes recorded.
              </div>
            ) : (
              <div className="space-y-3">
                {Object.entries(changes).map(([field, change]) => (
                  <ChangeRow
                    key={field}
                    field={field}
                    change={change}
                    financial={financialFields.has(field)}
                  />
                ))}
              </div>
            )}
          </Card>
        </div>
      </section>
    </div>
  );
}

export default function AuditLogsPage() {
  const [logs, setLogs] = useState([]);
  const [summary, setSummary] = useState(null);
  const [options, setOptions] = useState({ actions: [], models: [], users: [] });
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [count, setCount] = useState(0);
  const [filters, setFilters] = useState({
    search: "",
    start_date: "",
    end_date: "",
    user: "",
    action: "",
    model: "",
    status: "",
  });

  const query = useMemo(() => {
    const params = new URLSearchParams();
    params.set("page", page);
    params.set("page_size", PAGE_SIZE);
    Object.entries(filters).forEach(([key, value]) => {
      if (value) params.set(key, value);
    });
    return params.toString();
  }, [filters, page]);

  const loadLogs = async () => {
    setLoading(true);
    try {
      const res = await api.get(`audit/logs/?${query}`);
      setLogs(res.data.results || []);
      setCount(res.data.count || 0);
    } finally {
      setLoading(false);
    }
  };

  const loadSummary = async () => {
    const res = await api.get("audit/logs/summary/");
    setSummary(res.data);
  };

  const loadOptions = async () => {
    const res = await api.get("audit/logs/options/");
    setOptions(res.data || { actions: [], models: [], users: [] });
  };

  useEffect(() => {
    loadLogs();
  }, [query]);

  useEffect(() => {
    loadSummary();
    loadOptions();
  }, []);

  const updateFilter = (key, value) => {
    setPage(1);
    setFilters((current) => ({ ...current, [key]: value }));
  };

  const resetFilters = () => {
    setPage(1);
    setFilters({
      search: "",
      start_date: "",
      end_date: "",
      user: "",
      action: "",
      model: "",
      status: "",
    });
  };

  const openDetail = async (id) => {
    const res = await api.get(`audit/logs/${id}/`);
    setSelected(res.data);
  };

  const exportFile = async (type) => {
    const params = new URLSearchParams(query);
    params.delete("page");
    params.delete("page_size");
    const res = await api.get(`audit/logs/export/${type}/?${params.toString()}`, {
      responseType: "blob",
    });
    const url = window.URL.createObjectURL(new Blob([res.data]));
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `audit_logs.${type === "excel" ? "xlsx" : "csv"}`);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  };

  const totalPages = Math.max(1, Math.ceil(count / PAGE_SIZE));

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[var(--text)]">Audit Logs</h1>
          <p className="text-sm text-[var(--muted)]">
            Security, financial, and operational activity across the system.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button onClick={() => exportFile("csv")}>
            <Download className="h-4 w-4" />
            CSV
          </Button>
          <Button onClick={() => exportFile("excel")}>
            <FileSpreadsheet className="h-4 w-4" />
            Excel
          </Button>
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-4">
        <SummaryCard icon={ShieldCheck} label="Total audit logs" value={summary?.total_logs} />
        <SummaryCard icon={AlertTriangle} label="Failed actions" value={summary?.failed_actions} tone="var(--danger)" />
        <SummaryCard icon={CalendarClock} label="Financial changes today" value={summary?.financial_modifications_today} tone="var(--warning)" />
        <SummaryCard icon={Activity} label="Recent activity" value={summary?.recent_activity?.length} tone="var(--success)" />
      </div>

      <Card
        title="Filters"
        right={
          <button className="text-sm font-medium text-[var(--primary)]" onClick={resetFilters}>
            Reset
          </button>
        }
      >
        <div className="grid gap-3 md:grid-cols-4">
          <label className="relative md:col-span-2">
            <Search className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-[var(--muted)]" />
            <input
              className={`${inputClass} pl-9`}
              placeholder="Search action, model, endpoint, object..."
              value={filters.search}
              onChange={(e) => updateFilter("search", e.target.value)}
            />
          </label>
          <input
            className={inputClass}
            type="date"
            value={filters.start_date}
            onChange={(e) => updateFilter("start_date", e.target.value)}
          />
          <input
            className={inputClass}
            type="date"
            value={filters.end_date}
            onChange={(e) => updateFilter("end_date", e.target.value)}
          />
          <select
            className={inputClass}
            value={filters.user}
            onChange={(e) => updateFilter("user", e.target.value)}
          >
            <option value="">All users</option>
            {options.users.map((user) => (
              <option key={user.id} value={user.id}>
                {user.username}
              </option>
            ))}
          </select>
          <select
            className={inputClass}
            value={filters.action}
            onChange={(e) => updateFilter("action", e.target.value)}
          >
            <option value="">All actions</option>
            {options.actions.map((action) => (
              <option key={action} value={action}>
                {action}
              </option>
            ))}
          </select>
          <select
            className={inputClass}
            value={filters.model}
            onChange={(e) => updateFilter("model", e.target.value)}
          >
            <option value="">All models</option>
            {options.models.map((model) => (
              <option key={model} value={model}>
                {model}
              </option>
            ))}
          </select>
          <select
            className={inputClass}
            value={filters.status}
            onChange={(e) => updateFilter("status", e.target.value)}
          >
            <option value="">All statuses</option>
            <option value="success">Success</option>
            <option value="failed">Failed</option>
          </select>
        </div>
      </Card>

      <Card
        title="Activity"
        right={
          <div className="flex items-center gap-2 text-sm text-[var(--muted)]">
            <Filter className="h-4 w-4" />
            {count} records
          </div>
        }
      >
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b border-[var(--border)] text-xs uppercase text-[var(--muted)]">
              <tr>
                <th className="px-3 py-2">Timestamp</th>
                <th className="px-3 py-2">User</th>
                <th className="px-3 py-2">Action</th>
                <th className="px-3 py-2">Object</th>
                <th className="px-3 py-2">Status</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td className="px-3 py-6 text-center text-[var(--muted)]" colSpan="5">
                    Loading audit logs...
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td className="px-3 py-6 text-center text-[var(--muted)]" colSpan="5">
                    No audit logs found.
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr
                    key={log.id}
                    className="cursor-pointer border-b border-[var(--border)] transition hover:bg-[var(--hover)]"
                    onClick={() => openDetail(log.id)}
                  >
                    <td className="whitespace-nowrap px-3 py-3 text-[var(--text)]">
                      {formatDateTime(log.timestamp)}
                    </td>
                    <td className="px-3 py-3 text-[var(--text)]">
                      <span className="inline-flex items-center gap-1">
                        <User className="h-3.5 w-3.5 text-[var(--muted)]" />
                        {log.username || "System"}
                      </span>
                    </td>
                    <td className="px-3 py-3 font-medium text-[var(--text)]">{log.action}</td>
                    <td className="px-3 py-3 text-[var(--text)]">
                      <div>{log.model_name || "-"}</div>
                      <div className="max-w-xs truncate text-xs text-[var(--muted)]">
                        {log.object_repr || log.object_id}
                      </div>
                    </td>
                    <td className="px-3 py-3">
                      <span
                        className={`rounded-full px-2 py-1 text-xs font-semibold ${
                          log.status === "failed"
                            ? "bg-red-500/10 text-red-600"
                            : "bg-green-500/10 text-green-600"
                        }`}
                      >
                        {log.status}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="mt-4 flex items-center justify-between">
          <Button disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>
            Previous
          </Button>
          <span className="text-sm text-[var(--muted)]">
            Page {page} of {totalPages}
          </span>
          <Button disabled={page >= totalPages} onClick={() => setPage((p) => Math.min(totalPages, p + 1))}>
            Next
          </Button>
        </div>
      </Card>

      <DetailPanel log={selected} onClose={() => setSelected(null)} />
    </div>
  );
}

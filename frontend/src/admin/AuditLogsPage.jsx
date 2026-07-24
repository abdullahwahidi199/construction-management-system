/* eslint-disable react-hooks/exhaustive-deps */
import { useEffect, useMemo, useState } from "react";
import {
  Activity,
  AlertTriangle,
  CalendarClock,
  CheckCircle2,
  Download,
  FileSpreadsheet,
  Filter,
  Info,
  Search,
  ShieldCheck,
  User,
  X,
  XCircle,
} from "lucide-react";
import api from "../api/axiosInstance";
import Card from "../components/ui/Card";
import Button from "../components/ui/Button";

const PAGE_SIZE = 25;

const inputClass =
  "h-10 w-full rounded-lg border border-[var(--border)] bg-[var(--bg)] px-3 text-sm text-[var(--text)] shadow-sm outline-none transition focus:border-[var(--primary)] focus:ring-2 focus:ring-[color:rgba(37,99,235,0.18)]";

const ACTION_LABELS = {
  "auth.login": "Signed in",
  "auth.login_failed": "Tried to sign in",
  "auth.logout": "Signed out",
  "auth.password_change": "Changed a password",
  "audit_logs.export_csv": "Downloaded audit logs as CSV",
  "audit_logs.export_excel": "Downloaded audit logs as Excel",
  "audit_logs.delete": "Deleted an audit log",
  "audit_retention.update": "Updated audit retention",
};

const VERB_BY_ACTION = {
  create: "Created",
  update: "Updated",
  delete: "Deleted",
  view: "Viewed",
  export: "Downloaded",
  login: "Signed in",
  logout: "Signed out",
};

const AREA_LABELS = {
  application_settings: "Settings",
  attendance: "Attendance",
  contract: "Contracts",
  contractdocument: "Contract documents",
  contractinvoice: "Contract invoices",
  contractpayment: "Contract payments",
  contractvariation: "Contract variations",
  employee: "Employees",
  expense: "Expenses",
  payroll: "Payroll",
  project: "Projects",
  subcontractor: "Subcontractors",
  user: "Users",
  workeradvance: "Worker advances",
  workerattendance: "Worker attendance",
  workerpayroll: "Worker payroll",
};

const formatDateTime = (value) => {
  if (!value) return "-";
  return new Date(value).toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });
};

const formatValue = (value) => {
  if (value === null || value === undefined || value === "") return "-";
  if (typeof value === "boolean") return value ? "Yes" : "No";
  if (typeof value === "object") return JSON.stringify(value, null, 2);
  return String(value);
};

const titleCase = (value = "") =>
  String(value)
    .replace(/[_-]+/g, " ")
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .trim()
    .replace(/\w\S*/g, (word) => word[0].toUpperCase() + word.slice(1).toLowerCase());

const getActionPart = (action = "") => action.split(".").pop() || action;

const getAreaLabel = (log = {}) => {
  const modelKey = String(log.model_name || "").replace(/\s+/g, "").toLowerCase();
  if (AREA_LABELS[modelKey]) return AREA_LABELS[modelKey];
  const actionArea = String(log.action || "").split(".")[0];
  return titleCase(log.model_name || actionArea || "System");
};

const getActionLabel = (action = "") => {
  if (ACTION_LABELS[action]) return ACTION_LABELS[action];
  const actionPart = getActionPart(action);
  const area = action.split(".")[0];
  const verb = VERB_BY_ACTION[actionPart] || titleCase(actionPart || "Changed");
  if (!area || area === actionPart) return verb;
  return `${verb} ${titleCase(area)}`;
};

const getActivityText = (log = {}) => {
  if (log.description) return log.description;
  const actionPart = getActionPart(log.action);
  const verb = VERB_BY_ACTION[actionPart] || getActionLabel(log.action);
  const target = log.object_repr || getAreaLabel(log);
  return `${verb} ${target}`;
};

const getChangeSummary = (log = {}) => {
  const count = log.changed_field_count ?? Object.keys(log.field_changes || {}).length;
  if (count > 0) return `${count} detail${count === 1 ? "" : "s"} changed`;
  if (log.is_financial) return "Financial activity";
  return "No detailed changes";
};

const getStatusMeta = (status) =>
  status === "failed"
    ? {
        label: "Needs attention",
        icon: XCircle,
        className: "bg-red-500/10 text-red-600",
      }
    : {
        label: "Completed",
        icon: CheckCircle2,
        className: "bg-green-500/10 text-green-600",
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

function Pill({ children, className = "" }) {
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-semibold ${className}`}>
      {children}
    </span>
  );
}

function InfoRow({ label, value, wrap = false }) {
  return (
    <div className="grid gap-1 border-b border-[var(--border)] py-2 last:border-b-0 sm:grid-cols-[150px_1fr]">
      <dt className="text-xs font-semibold uppercase tracking-wide text-[var(--muted)]">
        {label}
      </dt>
      <dd className={`text-sm font-medium text-[var(--text)] ${wrap ? "break-all" : ""}`}>
        {value || "-"}
      </dd>
    </div>
  );
}

function ChangeRow({ field, change, financial }) {
  const highlighted = financial || field.toLowerCase().includes("currency");

  return (
    <div
      className={`rounded-lg border p-3 ${
        highlighted
          ? "border-yellow-500/50 bg-yellow-500/10"
          : "border-[var(--border)] bg-[var(--bg)]"
      }`}
    >
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
        <div className="text-sm font-semibold text-[var(--text)]">{titleCase(field)}</div>
        {highlighted && (
          <Pill className="bg-yellow-500/15 text-yellow-700 dark:text-yellow-300">
            Financial
          </Pill>
        )}
      </div>
      <div className="grid gap-2 text-sm lg:grid-cols-[1fr_auto_1fr] lg:items-stretch">
        <div className="rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-2">
          <div className="mb-1 text-xs font-semibold uppercase text-[var(--muted)]">Before</div>
          <pre className="max-h-36 overflow-auto whitespace-pre-wrap font-sans text-[var(--text)]">
            {formatValue(change.old)}
          </pre>
        </div>
        <div className="flex items-center justify-center text-xs font-semibold uppercase tracking-wide text-[var(--muted)]">
          changed to
        </div>
        <div className="rounded-lg border border-green-500/20 bg-green-500/10 px-3 py-2">
          <div className="mb-1 text-xs font-semibold uppercase text-[var(--muted)]">After</div>
          <pre className="max-h-36 overflow-auto whitespace-pre-wrap font-sans text-[var(--text)]">
            {formatValue(change.new)}
          </pre>
        </div>
      </div>
    </div>
  );
}

function DetailPanel({ log, onClose }) {
  if (!log) return null;

  const changes = log.field_changes || {};
  const financialFields = new Set(Object.keys(log.financial_changes || {}));
  const status = getStatusMeta(log.status);
  const StatusIcon = status.icon;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 p-3 backdrop-blur-sm">
      <section className="flex max-h-[92vh] w-full max-w-5xl flex-col overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--bg)] shadow-2xl">
        <header className="flex items-start justify-between gap-3 border-b border-[var(--border)] bg-[var(--card)] px-5 py-4">
          <div className="min-w-0">
            <div className="mb-2 flex flex-wrap items-center gap-2">
              <Pill className={status.className}>
                <StatusIcon className="h-3.5 w-3.5" />
                {status.label}
              </Pill>
              {log.is_financial || Object.keys(log.financial_changes || {}).length > 0 ? (
                <Pill className="bg-yellow-500/15 text-yellow-700 dark:text-yellow-300">
                  Financial
                </Pill>
              ) : null}
            </div>
            <h2 className="text-xl font-bold text-[var(--text)]">{getActivityText(log)}</h2>
            <p className="mt-1 text-sm text-[var(--muted)]">
              {log.username || "System"} in {getAreaLabel(log)} on {formatDateTime(log.timestamp)}
            </p>
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
            <Card title="Activity Summary">
              <dl>
                <InfoRow label="Person" value={log.username || "System"} />
                <InfoRow label="Activity" value={getActionLabel(log.action)} />
                <InfoRow label="Area" value={getAreaLabel(log)} />
                <InfoRow label="When" value={formatDateTime(log.timestamp)} />
                <InfoRow label="Result" value={status.label} />
              </dl>
            </Card>

            <Card title="Record Affected">
              <dl>
                <InfoRow label="Name" value={log.object_repr || getAreaLabel(log)} wrap />
                <InfoRow label="Notes" value={log.description || "No extra note was recorded."} wrap />
                <InfoRow label="Changed" value={getChangeSummary(log)} />
                <InfoRow label="Location" value={log.ip_address ? `IP ${log.ip_address}` : "Not recorded"} />
              </dl>
            </Card>
          </div>

          <Card
            title="What Changed"
            right={<span className="text-sm text-[var(--muted)]">{Object.keys(changes).length} changes</span>}
          >
            {Object.keys(changes).length === 0 ? (
              <div className="rounded-lg border border-[var(--border)] bg-[var(--bg)] p-4 text-sm text-[var(--muted)]">
                This activity did not record individual field changes.
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

          <details className="mt-4 rounded-xl border border-[var(--border)] bg-[var(--card)]">
            <summary className="cursor-pointer px-4 py-3 text-sm font-semibold text-[var(--text)]">
              Technical information
            </summary>
            <div className="border-t border-[var(--border)] p-4">
              <dl>
                <InfoRow label="Action code" value={log.action} wrap />
                <InfoRow label="Method" value={log.request_method || "-"} />
                <InfoRow label="Endpoint" value={log.endpoint || "-"} wrap />
                <InfoRow label="Internal type" value={log.model_name || "-"} />
                <InfoRow label="Record ID" value={log.object_id || "-"} wrap />
                <InfoRow label="User agent" value={log.user_agent || "-"} wrap />
              </dl>
            </div>
          </details>
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
          <h1 className="text-2xl font-bold text-[var(--text)]">Activity History</h1>
          <p className="text-sm text-[var(--muted)]">
            A readable timeline of important work, security events, and financial changes.
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
        <SummaryCard icon={ShieldCheck} label="Total activities" value={summary?.total_logs} />
        <SummaryCard icon={AlertTriangle} label="Needs attention" value={summary?.failed_actions} tone="var(--danger)" />
        <SummaryCard icon={CalendarClock} label="Financial changes today" value={summary?.financial_modifications_today} tone="var(--warning)" />
        <SummaryCard icon={Activity} label="Recent activity" value={summary?.recent_activity?.length} tone="var(--success)" />
      </div>

      <Card
        title="Find Activity"
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
              placeholder="Search by person, activity, record, or page..."
              value={filters.search}
              onChange={(e) => updateFilter("search", e.target.value)}
            />
          </label>
          <input
            className={inputClass}
            type="date"
            value={filters.start_date}
            onChange={(e) => updateFilter("start_date", e.target.value)}
            title="From date"
          />
          <input
            className={inputClass}
            type="date"
            value={filters.end_date}
            onChange={(e) => updateFilter("end_date", e.target.value)}
            title="To date"
          />
          <select
            className={inputClass}
            value={filters.user}
            onChange={(e) => updateFilter("user", e.target.value)}
          >
            <option value="">Everyone</option>
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
            <option value="">Any activity</option>
            {options.actions.map((action) => (
              <option key={action} value={action}>
                {getActionLabel(action)}
              </option>
            ))}
          </select>
          <select
            className={inputClass}
            value={filters.model}
            onChange={(e) => updateFilter("model", e.target.value)}
          >
            <option value="">Any area</option>
            {options.models.map((model) => (
              <option key={model} value={model}>
                {getAreaLabel({ model_name: model })}
              </option>
            ))}
          </select>
          <select
            className={inputClass}
            value={filters.status}
            onChange={(e) => updateFilter("status", e.target.value)}
          >
            <option value="">Any result</option>
            <option value="success">Completed</option>
            <option value="failed">Needs attention</option>
          </select>
        </div>
      </Card>

      <Card
        title="Activity Timeline"
        right={
          <div className="flex items-center gap-2 text-sm text-[var(--muted)]">
            <Filter className="h-4 w-4" />
            {count} records
          </div>
        }
      >
        <div className="space-y-2">
          {loading ? (
            <div className="rounded-lg border border-[var(--border)] bg-[var(--bg)] px-4 py-8 text-center text-sm text-[var(--muted)]">
              Loading activity...
            </div>
          ) : logs.length === 0 ? (
            <div className="rounded-lg border border-[var(--border)] bg-[var(--bg)] px-4 py-8 text-center text-sm text-[var(--muted)]">
              No activity found.
            </div>
          ) : (
            logs.map((log) => {
              const status = getStatusMeta(log.status);
              const StatusIcon = status.icon;

              return (
                <button
                  key={log.id}
                  type="button"
                  className="grid w-full gap-3 rounded-lg border border-[var(--border)] bg-[var(--bg)] p-4 text-left transition hover:border-[var(--primary)]/40 hover:bg-[var(--hover)] lg:grid-cols-[minmax(0,1fr)_170px_150px]"
                  onClick={() => openDetail(log.id)}
                >
                  <div className="min-w-0">
                    <div className="mb-2 flex flex-wrap items-center gap-2">
                      <Pill className={status.className}>
                        <StatusIcon className="h-3.5 w-3.5" />
                        {status.label}
                      </Pill>
                      {log.is_financial ? (
                        <Pill className="bg-yellow-500/15 text-yellow-700 dark:text-yellow-300">
                          Financial
                        </Pill>
                      ) : null}
                    </div>
                    <div className="text-sm font-semibold text-[var(--text)]">
                      {getActivityText(log)}
                    </div>
                    <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-[var(--muted)]">
                      <span className="inline-flex items-center gap-1">
                        <User className="h-3.5 w-3.5" />
                        {log.username || "System"}
                      </span>
                      <span>{getAreaLabel(log)}</span>
                      <span>{getChangeSummary(log)}</span>
                    </div>
                  </div>

                  <div className="text-sm text-[var(--text)]">
                    <div className="font-medium">{formatDateTime(log.timestamp)}</div>
                    <div className="mt-1 text-xs text-[var(--muted)]">
                      {log.ip_address ? `From ${log.ip_address}` : "Location not recorded"}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 text-xs text-[var(--muted)] lg:justify-end">
                    <Info className="h-4 w-4" />
                    View details
                  </div>
                </button>
              );
            })
          )}
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

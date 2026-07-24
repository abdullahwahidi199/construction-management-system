import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import instance from "../api/axiosInstance";
import { useAuth } from "../auth/AuthContext";
import Button from "../components/ui/Button";
import { getFriendlyErrorMessage } from "../utils/apiErrors";
import {
  CALENDAR_MODULES,
  CALENDAR_TYPES,
  defaultCalendarSettings,
  normalizeCalendarSettings,
} from "../utils/calendar";

const OPTIONS = [
  { value: CALENDAR_TYPES.INHERIT, label: "Inherit global calendar" },
  { value: CALENDAR_TYPES.SHAMSI, label: "Afghan Hijri Shamsi" },
  { value: CALENDAR_TYPES.GREGORIAN, label: "Gregorian" },
];

const GLOBAL_OPTIONS = OPTIONS.filter((option) => option.value !== CALENDAR_TYPES.INHERIT);

function moduleLabel(module) {
  return module
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export default function SettingsPage() {
  const { permissions = [] } = useAuth();
  const canView =
    permissions.includes("*") ||
    permissions.includes("settings.view") ||
    permissions.includes("settings.manage");
  const canManage =
    permissions.includes("*") || permissions.includes("settings.manage");
  const [settings, setSettings] = useState(defaultCalendarSettings);
  const [expenseApproval, setExpenseApproval] = useState({ enabled: false });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [approvalSaving, setApprovalSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [approvalMessage, setApprovalMessage] = useState("");
  const [loadError, setLoadError] = useState("");

  useEffect(() => {
    setLoadError("");
    Promise.all([
      instance.get("auth/settings/calendar/"),
      instance.get("expenses/approval-settings/"),
    ])
      .then(([calendarRes, approvalRes]) => {
        setSettings(normalizeCalendarSettings(calendarRes.data));
        setExpenseApproval({ enabled: Boolean(approvalRes.data?.enabled) });
      })
      .catch((err) => {
        const message = getFriendlyErrorMessage(err, "Unable to load settings.");
        setLoadError(message);
        toast.error(message);
      })
      .finally(() => setLoading(false));
  }, []);

  const updateModule = (module, value) => {
    setSettings((current) => ({
      ...current,
      modules: { ...current.modules, [module]: value },
    }));
  };

  const save = async () => {
    setSaving(true);
    setMessage("");
    try {
      const res = await instance.put("auth/settings/calendar/", settings);
      const normalized = normalizeCalendarSettings(res.data);
      setSettings(normalized);
      localStorage.setItem("cms.calendar.settings", JSON.stringify(normalized));
      setMessage("Calendar settings saved.");
      toast.success("Settings saved.");
    } catch (err) {
      const message = getFriendlyErrorMessage(err, "Unable to save changes.");
      setMessage(message);
    } finally {
      setSaving(false);
    }
  };

  const saveExpenseApproval = async () => {
    setApprovalSaving(true);
    setApprovalMessage("");
    try {
      const res = await instance.put("expenses/approval-settings/", expenseApproval);
      setExpenseApproval({ enabled: Boolean(res.data?.enabled) });
      setApprovalMessage("Expense approval settings saved.");
      toast.success("Expense approval settings saved.");
    } catch (err) {
      const message = getFriendlyErrorMessage(err, "Unable to save changes.");
      setApprovalMessage(message);
    } finally {
      setApprovalSaving(false);
    }
  };

  if (loading) {
    return <div className="text-sm text-[var(--muted)]">Loading settings...</div>;
  }

  if (loadError) {
    return (
      <div className="rounded-lg border border-red-500/20 bg-red-500/10 p-5 text-sm text-red-600">
        {loadError}
      </div>
    );
  }

  if (!canView) {
    return <div className="text-sm text-[var(--muted)]">You do not have permission to view settings.</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-[var(--text)]">Settings</h1>
        <p className="mt-1 text-sm text-[var(--muted)]">Calendar settings apply globally and can be overridden per module.</p>
      </div>

      <section className="rounded-lg border border-[var(--border)] bg-[var(--card)] p-5">
        <h2 className="text-lg font-semibold text-[var(--text)]">Calendar Settings</h2>
        <div className="mt-4 max-w-md">
          <label className="mb-1.5 block text-sm font-medium text-[var(--text)]">Global calendar</label>
          <select
            value={settings.default_calendar}
            disabled={!canManage}
            onChange={(event) => setSettings((current) => ({ ...current, default_calendar: event.target.value }))}
            className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg)] px-3 py-2.5 text-sm text-[var(--text)] focus:border-[var(--primary)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/20"
          >
            {GLOBAL_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
          </select>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {CALENDAR_MODULES.map((module) => (
            <label key={module} className="block">
              <span className="mb-1.5 block text-sm font-medium text-[var(--text)]">{moduleLabel(module)}</span>
              <select
                value={settings.modules[module] || CALENDAR_TYPES.INHERIT}
                disabled={!canManage}
                onChange={(event) => updateModule(module, event.target.value)}
                className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg)] px-3 py-2.5 text-sm text-[var(--text)] focus:border-[var(--primary)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/20"
              >
                {OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
              </select>
            </label>
          ))}
        </div>

        <div className="mt-6 flex items-center gap-3">
          {canManage && <Button onClick={save} disabled={saving}>{saving ? "Saving..." : "Save Settings"}</Button>}
          {message && <span className="text-sm text-[var(--muted)]">{message}</span>}
        </div>
      </section>

      <section className="rounded-lg border border-[var(--border)] bg-[var(--card)] p-5">
        <h2 className="text-lg font-semibold text-[var(--text)]">Expense Approval</h2>
        <div className="mt-4 flex items-center justify-between gap-4 rounded-lg border border-[var(--border)] bg-[var(--bg)] p-4">
          <div>
            <p className="text-sm font-medium text-[var(--text)]">
              Expense Approval Enabled
            </p>
            <p className="mt-1 text-sm text-[var(--muted)]">
              {expenseApproval.enabled ? "Pending approval workflow is active." : "Expenses are approved immediately."}
            </p>
          </div>
          <button
            type="button"
            disabled={!canManage}
            onClick={() =>
              setExpenseApproval((current) => ({
                enabled: !current.enabled,
              }))
            }
            className={`relative h-7 w-12 rounded-full transition ${
              expenseApproval.enabled ? "bg-[var(--primary)]" : "bg-[var(--border)]"
            } disabled:cursor-not-allowed disabled:opacity-60`}
            aria-pressed={expenseApproval.enabled}
          >
            <span
              className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow transition ${
                expenseApproval.enabled ? "left-6" : "left-1"
              }`}
            />
          </button>
        </div>
        <div className="mt-4 flex items-center gap-3">
          {canManage && (
            <Button onClick={saveExpenseApproval} disabled={approvalSaving}>
              {approvalSaving ? "Saving..." : "Save Expense Approval"}
            </Button>
          )}
          {approvalMessage && (
            <span className="text-sm text-[var(--muted)]">{approvalMessage}</span>
          )}
        </div>
      </section>
    </div>
  );
}

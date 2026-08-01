import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import {
  Bell,
  Building2,
  CalendarDays,
  CalendarRange,
  Check,
  CheckCircle2,
  ChevronRight,
  ClipboardList,
  Edit2,
  FileText,
  Globe2,
  HardHat,
  History,
  Image as ImageIcon,
  KeyRound,
  Languages,
  MapPin,
  Moon,
  Palette,
  Plus,
  Save,
  Search,
  ShieldCheck,
  Sparkles,
  Sun,
  Trash2,
  Upload,
  X,
} from "lucide-react";
import instance from "../api/axiosInstance";
import { useAuth } from "../auth/AuthContext";
import Button from "../components/ui/Button";
import CalendarDatePicker from "../components/common/CalendarDatePicker";
import InlineAlert from "../components/common/InlineAlert";
import {
  COMPANY_INFO_UPDATED_EVENT,
  normalizeCompanyInfo,
  useCompany,
} from "../context/CompanyContext";
import { useTheme } from "../context/ThemeContext";
import { getLanguage, setLanguage } from "../i18n";
import { getFriendlyErrorMessage } from "../utils/apiErrors";
import {
  CALENDAR_MODULES,
  CALENDAR_TYPES,
  WORK_CALENDAR_WEEKDAYS,
  currentMonthKey,
  defaultCalendarSettings,
  formatDate,
  formatMonthKey,
  getDateInfo,
  getDatesInRange,
  monthBoundsFromKey,
  normalizeCalendarSettings,
  normalizeWorkCalendar,
  todayIso,
} from "../utils/calendar";

const EMPTY_COMPANY_FORM = {
  company_name: "",
  legal_company_name: "",
  address: "",
  city: "",
  province_state: "",
  country: "",
  postal_code: "",
  phone_number: "",
  alternative_phone: "",
  email: "",
  website: "",
  tax_number: "",
  registration_number: "",
  company_description: "",
  print_footer_text: "",
};

const DEFAULT_PREFERENCES = {
  appearance: { theme: "construction" },
  language: { language: "en" },
  notifications: {
    in_app: true,
    email: false,
    real_time: true,
  },
  security: {
    session_timeout_minutes: 60,
    password_min_length: 8,
    require_uppercase: true,
    require_number: true,
    login_lockout_enabled: true,
  },
};

const CALENDAR_OPTIONS = [
  { value: CALENDAR_TYPES.INHERIT, label: "Inherit global calendar" },
  { value: CALENDAR_TYPES.SHAMSI, label: "Afghan Hijri Shamsi" },
  { value: CALENDAR_TYPES.GREGORIAN, label: "Gregorian" },
];

const GLOBAL_CALENDAR_OPTIONS = CALENDAR_OPTIONS.filter(
  (option) => option.value !== CALENDAR_TYPES.INHERIT,
);

const LANGUAGE_OPTIONS = [
  { value: "en", label: "English", native: "English", locale: "EN" },
  { value: "dr", label: "Dari", native: "دری", locale: "DR" },
  { value: "ps", label: "Pashto", native: "پښتو", locale: "PS" },
];

const THEME_SEGMENTS = [
  {
    value: "light",
    label: "Light",
    description: "Bright, high-contrast workspace",
    icon: Sun,
  },
  {
    value: "dark",
    label: "Dark",
    description: "Low-light interface, easy on the eyes",
    icon: Moon,
  },
  {
    value: "construction",
    label: "Construction",
    description: "Hi-vis inspired brand theme",
    icon: HardHat,
  },
];

const HOLIDAY_PAYMENT_OPTIONS = [
  { value: "paid", label: "Paid" },
  { value: "unpaid", label: "Unpaid" },
  { value: "attendance_based", label: "Attendance Based" },
];

const SECTIONS = [
  {
    key: "company",
    label: "Company Information",
    description: "Branding, legal & contact details",
    icon: Building2,
    tint: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
  },
  {
    key: "calendar",
    label: "Calendar Settings",
    description: "Hijri Shamsi, Gregorian & holidays",
    icon: CalendarDays,
    tint: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  },
  {
    key: "appearance",
    label: "Appearance",
    description: "Theme & visual preferences",
    icon: Palette,
    tint: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
  },
  {
    key: "language",
    label: "Language",
    description: "Interface language & locale",
    icon: Languages,
    tint: "bg-sky-500/10 text-sky-600 dark:text-sky-400",
  },
  {
    key: "notifications",
    label: "Notifications",
    description: "Channels & delivery rules",
    icon: Bell,
    tint: "bg-violet-500/10 text-violet-600 dark:text-violet-400",
  },
  {
    key: "security",
    label: "Security",
    description: "Sessions, passwords & lockout",
    icon: ShieldCheck,
    tint: "bg-rose-500/10 text-rose-600 dark:text-rose-400",
  },
  {
    key: "audit",
    label: "Audit Logs",
    description: "History of every change",
    icon: ClipboardList,
    tint: "bg-slate-500/10 text-slate-600 dark:text-slate-400",
  },
];

const FADE_IN_CSS = `
  @keyframes settingsSectionIn {
    from { opacity: 0; transform: translateY(8px); }
    to { opacity: 1; transform: translateY(0); }
  }
  .settings-section-enter {
    animation: settingsSectionIn 240ms ease-out both;
  }
`;

const inputClasses =
  "h-11 w-full rounded-xl border border-[var(--border)] bg-[var(--bg)] px-3.5 text-sm text-[var(--text)] shadow-[0_1px_2px_rgba(15,23,42,0.04)] outline-none transition-all placeholder:text-[var(--muted)]/70 hover:border-[var(--muted)]/40 focus:border-[var(--primary)] focus:ring-4 focus:ring-[var(--primary)]/15 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:border-[var(--border)]";

function cx(...classes) {
  return classes.filter(Boolean).join(" ");
}

function moduleLabel(module) {
  return module
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function createHolidayDraft(date = "") {
  const selectedDate = date || "";
  return {
    id: `holiday-${Date.now()}`,
    name: "",
    start_date: selectedDate,
    end_date: selectedDate,
    description: "",
    paid_holiday: true,
    active: true,
    payment_policy: "paid",
  };
}

function holidayRangesOverlap(left, right) {
  return left.start_date <= right.end_date && right.start_date <= left.end_date;
}

function buildPreviewDays(monthKey, settings) {
  const calendar = settings.default_calendar || CALENDAR_TYPES.GREGORIAN;
  const { start, end } = monthBoundsFromKey(monthKey, calendar);
  if (!start || !end) return [];

  const [startYear, startMonth, startDay] = start.split("-").map(Number);
  const firstDate = new Date(Date.UTC(startYear, startMonth - 1, startDay));
  const startOffset =
    calendar === CALENDAR_TYPES.SHAMSI
      ? (firstDate.getUTCDay() + 1) % 7
      : (firstDate.getUTCDay() + 6) % 7;

  const cells = Array.from({ length: startOffset }, (_, index) => ({
    key: `empty-start-${index}`,
    empty: true,
  }));

  getDatesInRange(start, end).forEach((iso) => {
    const formatted = formatDate(iso, calendar);
    cells.push({
      key: iso,
      date: iso,
      day: Number(formatted.split("-")[2]) || "",
      displayDate: formatted,
      info: getDateInfo(iso, settings),
    });
  });

  while (cells.length % 7 !== 0) {
    cells.push({ key: `empty-end-${cells.length}`, empty: true });
  }

  return cells;
}

function workCalendarBadgeClasses(info) {
  if (info?.is_holiday) {
    return "border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-800 dark:bg-rose-950/30 dark:text-rose-200";
  }
  if (info?.is_weekly_off) {
    return "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-800 dark:bg-amber-950/30 dark:text-amber-200";
  }
  return "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-200";
}

function workCalendarDotClasses(info) {
  if (info?.is_holiday) return "bg-rose-500";
  if (info?.is_weekly_off) return "bg-amber-500";
  return "bg-emerald-500";
}

function workCalendarLabel(info) {
  if (info?.is_holiday) return "Official Holiday";
  if (info?.is_weekly_off) return "Weekly Off Day";
  return "Working Day";
}

function normalizePreferences(value = {}) {
  return {
    appearance: {
      ...DEFAULT_PREFERENCES.appearance,
      ...(value.appearance || {}),
    },
    language: {
      ...DEFAULT_PREFERENCES.language,
      ...(value.language || {}),
    },
    notifications: {
      ...DEFAULT_PREFERENCES.notifications,
      ...(value.notifications || {}),
    },
    security: {
      ...DEFAULT_PREFERENCES.security,
      ...(value.security || {}),
    },
  };
}

function timestamp(value) {
  if (!value) return "—";
  try {
    return new Date(value).toLocaleString();
  } catch {
    return value;
  }
}

function displayValue(value) {
  if (value === null || value === undefined || value === "") return "—";
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
}

/* ------------------------------------------------------------------ */
/*  UI primitives                                                      */
/* ------------------------------------------------------------------ */

function SectionTitle({ icon: Icon, title, eyebrow, description }) {
  return (
    <div className="mb-5 flex min-w-0 items-start gap-3 sm:mb-7 sm:gap-4">
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[var(--primary)] to-[var(--primary)]/60 text-white shadow-lg shadow-[var(--primary)]/25 sm:h-12 sm:w-12 sm:rounded-2xl">
        <Icon className="h-4 w-4 sm:h-5 sm:w-5" />
      </span>
      <div className="min-w-0 pt-0.5">
        <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-[var(--primary)]">
          {eyebrow}
        </p>
        <h1 className="mt-0.5 text-xl font-bold tracking-tight text-[var(--text)] sm:text-[22px]">
          {title}
        </h1>
        {description && (
          <p className="mt-1 max-w-2xl text-[13px] leading-relaxed text-[var(--muted)] sm:text-sm">
            {description}
          </p>
        )}
      </div>
    </div>
  );
}

function SectionCard({ icon: Icon, title, description, action, children }) {
  return (
    <section className="min-w-0 overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--bg)]/50 sm:rounded-2xl">
      <div className="flex flex-col items-stretch gap-3 border-b border-[var(--border)] px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
        <div className="flex min-w-0 items-center gap-3">
          {Icon && (
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[var(--card)] text-[var(--primary)] ring-1 ring-[var(--border)]">
              <Icon className="h-4 w-4" />
            </span>
          )}
          <div className="min-w-0">
            <h2 className="text-[15px] font-semibold text-[var(--text)]">
              {title}
            </h2>
            {description && (
              <p className="mt-0.5 text-[13px] leading-relaxed text-[var(--muted)]">
                {description}
              </p>
            )}
          </div>
        </div>
        {action && (
          <div className="flex shrink-0 max-sm:w-full max-sm:[&>*]:w-full sm:justify-end">
            {action}
          </div>
        )}
      </div>
      <div className="p-4 sm:p-5">{children}</div>
    </section>
  );
}

function SaveBar({ hint, children }) {
  return (
    <div className="sticky bottom-3 z-10 mt-2 flex flex-col gap-3 rounded-xl border border-[var(--border)] bg-[var(--card)]/95 p-3 shadow-xl shadow-black/5 backdrop-blur sm:bottom-4 sm:rounded-2xl sm:p-3.5 md:flex-row md:items-center md:justify-between">
      <p className="hidden pl-1 text-[13px] text-[var(--muted)] sm:block">
        {hint}
      </p>
      <div className="flex flex-col-reverse justify-end gap-2 sm:flex-row sm:items-center sm:[&>button]:w-auto">
        {children}
      </div>
    </div>
  );
}

function Field({
  label,
  name,
  value,
  onChange,
  type = "text",
  disabled,
  placeholder,
}) {
  return (
    <label className="block min-w-0">
      <span className="mb-1.5 block text-[13px] font-semibold text-[var(--text)]">
        {label}
      </span>
      <input
        type={type}
        name={name}
        value={value || ""}
        disabled={disabled}
        placeholder={placeholder}
        onChange={(event) => onChange(name, event.target.value)}
        className={inputClasses}
      />
    </label>
  );
}

function TextArea({ label, name, value, onChange, disabled, rows = 4 }) {
  return (
    <label className="block min-w-0">
      <span className="mb-1.5 block text-[13px] font-semibold text-[var(--text)]">
        {label}
      </span>
      <textarea
        name={name}
        value={value || ""}
        disabled={disabled}
        rows={rows}
        onChange={(event) => onChange(name, event.target.value)}
        className={cx(inputClasses, "h-auto resize-y py-2.5")}
      />
    </label>
  );
}

function SelectField({ label, value, onChange, disabled, options }) {
  return (
    <label className="block min-w-0">
      <span className="mb-1.5 block text-[13px] font-semibold text-[var(--text)]">
        {label}
      </span>
      <div className="relative">
        <select
          value={value}
          disabled={disabled}
          onChange={(event) => onChange(event.target.value)}
          className={cx(inputClasses, "appearance-none pr-10")}
        >
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <ChevronRight className="pointer-events-none absolute right-3.5 top-1/2 h-4 w-4 -translate-y-1/2 rotate-90 text-[var(--muted)]" />
      </div>
    </label>
  );
}

function Toggle({ checked, onChange, disabled }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={cx(
        "relative h-6 w-11 shrink-0 rounded-full outline-none transition-colors duration-200 focus-visible:ring-4 focus-visible:ring-[var(--primary)]/25 disabled:cursor-not-allowed disabled:opacity-50",
        checked ? "bg-[var(--primary)]" : "bg-[var(--border)]",
      )}
    >
      <span
        className={cx(
          "absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition-transform duration-200",
          checked && "translate-x-5",
        )}
      />
    </button>
  );
}

function ToggleRow({ title, description, checked, onChange, disabled }) {
  return (
    <div className="group -mx-2 flex items-center justify-between gap-4 rounded-xl px-2 py-4 transition-colors hover:bg-[var(--hover)]/50">
      <div className="min-w-0">
        <p className="text-sm font-semibold text-[var(--text)]">{title}</p>
        {description && (
          <p className="mt-0.5 text-[13px] leading-relaxed text-[var(--muted)]">
            {description}
          </p>
        )}
      </div>
      <Toggle checked={checked} onChange={onChange} disabled={disabled} />
    </div>
  );
}

function SegmentedControl({ value, onChange, options, disabled }) {
  return (
    <div className="grid gap-3 sm:grid-cols-3">
      {options.map((option) => {
        const selected = value === option.value;
        const Icon = option.icon;
        return (
          <button
            key={option.value}
            type="button"
            disabled={disabled}
            onClick={() => onChange(option.value)}
            className={cx(
              "relative flex min-w-0 items-center gap-3 rounded-xl border-2 p-4 text-left transition-all disabled:cursor-not-allowed disabled:opacity-60 sm:flex-col sm:gap-2.5 sm:rounded-2xl sm:p-5 sm:text-center",
              selected
                ? "border-[var(--primary)] bg-[var(--primary)]/10"
                : "border-[var(--border)] bg-[var(--card)] hover:border-[var(--muted)]/40 hover:bg-[var(--hover)]",
            )}
          >
            {selected && (
              <span className="absolute right-3 top-3 flex h-5 w-5 items-center justify-center rounded-full bg-[var(--primary)] text-white shadow">
                <Check className="h-3 w-3" strokeWidth={3} />
              </span>
            )}
            <span
              className={cx(
                "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition-colors sm:h-11 sm:w-11",
                selected
                  ? "bg-[var(--primary)] text-white shadow-lg shadow-[var(--primary)]/30"
                  : "bg-[var(--primary)]/10 text-[var(--primary)]",
              )}
            >
              <Icon className="h-5 w-5" />
            </span>
            <span className="min-w-0 flex-1 sm:flex-none">
              <span
                className={cx(
                  "block text-sm font-bold",
                  selected ? "text-[var(--primary)]" : "text-[var(--text)]",
                )}
              >
                {option.label}
              </span>
              {option.description && (
                <span className="mt-0.5 block text-xs leading-snug text-[var(--muted)]">
                  {option.description}
                </span>
              )}
            </span>
          </button>
        );
      })}
    </div>
  );
}

function ImageUpload({
  label,
  value,
  preview,
  onFile,
  onClear,
  disabled,
  compact = false,
}) {
  return (
    <div className="min-w-0">
      <p className="mb-1.5 text-[13px] font-semibold text-[var(--text)]">
        {label}
      </p>
      <div className="flex flex-col gap-4 rounded-2xl border border-dashed border-[var(--border)] bg-[var(--card)] p-4 transition-colors hover:border-[var(--primary)]/40 sm:flex-row sm:items-center">
        <div
          className={cx(
            "flex shrink-0 items-center justify-center overflow-hidden rounded-xl bg-[var(--bg)] ring-1 ring-[var(--border)]",
            compact ? "h-14 w-14" : "h-20 w-20",
          )}
        >
          {preview || value ? (
            <img
              src={preview || value}
              alt=""
              className="h-full w-full object-contain p-1.5"
            />
          ) : (
            <ImageIcon className="h-5 w-5 text-[var(--muted)]" />
          )}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap gap-2">
            <label className="inline-flex min-h-10 cursor-pointer items-center justify-center gap-2 rounded-xl border border-[var(--primary)]/25 bg-[var(--primary)]/10 px-4 text-[13px] font-semibold text-[var(--primary)] transition hover:bg-[var(--primary)]/15">
              <Upload className="h-4 w-4" />
              Upload
              <input
                type="file"
                accept="image/png,image/jpeg,image/webp,image/x-icon"
                disabled={disabled}
                className="sr-only"
                onChange={(event) => onFile(event.target.files?.[0] || null)}
              />
            </label>
            {(preview || value) && (
              <button
                type="button"
                disabled={disabled}
                onClick={onClear}
                className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border border-[var(--border)] px-4 text-[13px] font-semibold text-[var(--muted)] transition hover:bg-[var(--hover)] hover:text-[var(--text)] disabled:cursor-not-allowed disabled:opacity-60"
              >
                <Trash2 className="h-4 w-4" />
                Clear
              </button>
            )}
          </div>
          <p className="mt-2 text-xs text-[var(--muted)]">
            PNG, JPG, WEBP or ICO
          </p>
        </div>
      </div>
    </div>
  );
}

function StatusBadge({ tone, children }) {
  const tones = {
    emerald:
      "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-200",
    slate:
      "border-slate-200 bg-slate-100 text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300",
    blue: "border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-800 dark:bg-blue-950/40 dark:text-blue-200",
    amber:
      "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-200",
  };
  return (
    <span
      className={cx(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-semibold",
        tones[tone] || tones.slate,
      )}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current opacity-70" />
      {children}
    </span>
  );
}

/* ------------------------------------------------------------------ */
/*  Page                                                               */
/* ------------------------------------------------------------------ */

export default function SettingsPage() {
  const { permissions = [] } = useAuth();
  const { theme, setTheme } = useTheme();
  const { setCompany } = useCompany();

  const canView =
    permissions.includes("*") ||
    permissions.includes("settings.view") ||
    permissions.includes("settings.manage");
  const canManage =
    permissions.includes("*") || permissions.includes("settings.manage");

  const [activeSection, setActiveSection] = useState("company");
  const [companyForm, setCompanyForm] = useState(EMPTY_COMPANY_FORM);
  const [companyAssets, setCompanyAssets] = useState({
    logoUrl: "",
    faviconUrl: "",
    logoFile: null,
    faviconFile: null,
    logoPreview: "",
    faviconPreview: "",
    clearLogo: false,
    clearFavicon: false,
  });
  const [calendarSettings, setCalendarSettings] = useState(
    defaultCalendarSettings,
  );
  const [holidayDraft, setHolidayDraft] = useState(() => createHolidayDraft());
  const [holidaySearch, setHolidaySearch] = useState("");
  const [holidayYearFilter, setHolidayYearFilter] = useState("all");
  const [previewMonth, setPreviewMonth] = useState(() =>
    currentMonthKey(CALENDAR_TYPES.SHAMSI),
  );
  const [selectedPreviewDate, setSelectedPreviewDate] = useState(() =>
    todayIso(),
  );
  const [preferences, setPreferences] = useState(() =>
    normalizePreferences({
      appearance: { theme },
      language: { language: getLanguage() },
    }),
  );
  const [expenseApproval, setExpenseApproval] = useState({ enabled: false });
  const [auditLogs, setAuditLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [saving, setSaving] = useState("");

  const section = useMemo(
    () => SECTIONS.find((item) => item.key === activeSection) || SECTIONS[0],
    [activeSection],
  );

  const calendarType =
    calendarSettings.default_calendar || CALENDAR_TYPES.SHAMSI;

  const workCalendar = useMemo(
    () => normalizeWorkCalendar(calendarSettings.work_calendar, calendarType),
    [calendarSettings.work_calendar, calendarType],
  );

  const previewWeekdays = useMemo(
    () =>
      calendarType === CALENDAR_TYPES.SHAMSI
        ? [
            { value: "sat", shortLabel: "Sat" },
            { value: "sun", shortLabel: "Sun" },
            { value: "mon", shortLabel: "Mon" },
            { value: "tue", shortLabel: "Tue" },
            { value: "wed", shortLabel: "Wed" },
            { value: "thu", shortLabel: "Thu" },
            { value: "fri", shortLabel: "Fri" },
          ]
        : WORK_CALENDAR_WEEKDAYS,
    [calendarType],
  );

  const holidayYears = useMemo(() => {
    const years = new Set(
      workCalendar.holidays
        .map((holiday) =>
          formatDate(holiday.start_date, calendarType)?.slice(0, 4),
        )
        .filter(Boolean),
    );
    return [...years].sort((a, b) => Number(b) - Number(a));
  }, [calendarType, workCalendar.holidays]);

  const filteredHolidays = useMemo(() => {
    const search = holidaySearch.trim().toLowerCase();
    return workCalendar.holidays.filter((holiday) => {
      const matchesSearch =
        !search ||
        holiday.name.toLowerCase().includes(search) ||
        holiday.description.toLowerCase().includes(search);
      const startDisplay = formatDate(holiday.start_date, calendarType);
      const endDisplay = formatDate(holiday.end_date, calendarType);
      const matchesYear =
        holidayYearFilter === "all" ||
        startDisplay.startsWith(holidayYearFilter) ||
        endDisplay.startsWith(holidayYearFilter);
      return matchesSearch && matchesYear;
    });
  }, [calendarType, holidaySearch, holidayYearFilter, workCalendar.holidays]);

  const previewDays = useMemo(
    () => buildPreviewDays(previewMonth, calendarSettings),
    [calendarSettings, previewMonth],
  );

  const selectedDateInfo = useMemo(
    () => getDateInfo(selectedPreviewDate, calendarSettings),
    [calendarSettings, selectedPreviewDate],
  );

  const activeHolidayCount = useMemo(
    () => workCalendar.holidays.filter((holiday) => holiday.active).length,
    [workCalendar.holidays],
  );

  const editingExistingHoliday = useMemo(
    () =>
      workCalendar.holidays.some((holiday) => holiday.id === holidayDraft.id),
    [workCalendar.holidays, holidayDraft.id],
  );

  const calendarLabel =
    GLOBAL_CALENDAR_OPTIONS.find(
      (option) => option.value === calendarSettings.default_calendar,
    )?.label || "—";
  const themeLabel =
    THEME_SEGMENTS.find(
      (option) => option.value === preferences.appearance.theme,
    )?.label || "—";
  const languageLabel =
    LANGUAGE_OPTIONS.find(
      (option) => option.value === preferences.language.language,
    )?.label || "—";

  useEffect(() => {
    setPreviewMonth(currentMonthKey(calendarType));
    setHolidayYearFilter("all");
  }, [calendarType]);

  useEffect(() => {
    if (!canView) {
      setLoading(false);
      return;
    }
    setLoadError("");
    Promise.all([
      instance.get("auth/settings/company/"),
      instance.get("auth/settings/calendar/"),
      instance.get("auth/settings/preferences/"),
      instance.get("expenses/approval-settings/"),
      instance.get("auth/settings/audit-logs/?limit=30", {
        skipGlobalErrorToast: true,
      }),
    ])
      .then(
        ([companyRes, calendarRes, preferencesRes, approvalRes, auditRes]) => {
          const company = normalizeCompanyInfo(companyRes.data);
          setCompanyForm({
            ...EMPTY_COMPANY_FORM,
            ...Object.fromEntries(
              Object.keys(EMPTY_COMPANY_FORM).map((key) => [
                key,
                company[key] || "",
              ]),
            ),
          });
          setCompanyAssets((current) => ({
            ...current,
            logoUrl: company.company_logo_url || "",
            faviconUrl: company.favicon_url || "",
            logoFile: null,
            faviconFile: null,
            logoPreview: "",
            faviconPreview: "",
            clearLogo: false,
            clearFavicon: false,
          }));
          setCalendarSettings(normalizeCalendarSettings(calendarRes.data));
          setPreferences(
            normalizePreferences({
              ...preferencesRes.data,
              appearance: { theme },
              language: { language: getLanguage() },
            }),
          );
          setExpenseApproval({ enabled: Boolean(approvalRes.data?.enabled) });
          setAuditLogs(Array.isArray(auditRes.data) ? auditRes.data : []);
        },
      )
      .catch((err) => {
        const message = getFriendlyErrorMessage(
          err,
          "Unable to load settings.",
        );
        setLoadError(message);
        toast.error(message);
      })
      .finally(() => setLoading(false));
  }, [canView, setCompany]);

  useEffect(() => {
    return () => {
      if (companyAssets.logoPreview)
        URL.revokeObjectURL(companyAssets.logoPreview);
      if (companyAssets.faviconPreview)
        URL.revokeObjectURL(companyAssets.faviconPreview);
    };
  }, [companyAssets.logoPreview, companyAssets.faviconPreview]);

  const updateCompanyField = (name, value) => {
    setCompanyForm((current) => ({ ...current, [name]: value }));
  };

  const updateCompanyAsset = (key, file) => {
    setCompanyAssets((current) => {
      const previewKey = key === "logo" ? "logoPreview" : "faviconPreview";
      const fileKey = key === "logo" ? "logoFile" : "faviconFile";
      const clearKey = key === "logo" ? "clearLogo" : "clearFavicon";
      if (current[previewKey]) URL.revokeObjectURL(current[previewKey]);
      return {
        ...current,
        [fileKey]: file,
        [previewKey]: file ? URL.createObjectURL(file) : "",
        [clearKey]: false,
      };
    });
  };

  const clearCompanyAsset = (key) => {
    setCompanyAssets((current) => {
      const previewKey = key === "logo" ? "logoPreview" : "faviconPreview";
      const fileKey = key === "logo" ? "logoFile" : "faviconFile";
      const urlKey = key === "logo" ? "logoUrl" : "faviconUrl";
      const clearKey = key === "logo" ? "clearLogo" : "clearFavicon";
      if (current[previewKey]) URL.revokeObjectURL(current[previewKey]);
      return {
        ...current,
        [fileKey]: null,
        [previewKey]: "",
        [urlKey]: "",
        [clearKey]: true,
      };
    });
  };

  const saveCompanyInformation = async () => {
    setSaving("company");
    try {
      const formData = new FormData();
      Object.entries(companyForm).forEach(([key, value]) => {
        formData.append(key, value || "");
      });
      if (companyAssets.logoFile)
        formData.append("company_logo", companyAssets.logoFile);
      if (companyAssets.faviconFile)
        formData.append("favicon", companyAssets.faviconFile);
      if (companyAssets.clearLogo)
        formData.append("clear_company_logo", "true");
      if (companyAssets.clearFavicon) formData.append("clear_favicon", "true");

      const response = await instance.patch("auth/settings/company/", formData);
      const company = normalizeCompanyInfo(response.data);
      setCompany(company);
      window.dispatchEvent(
        new CustomEvent(COMPANY_INFO_UPDATED_EVENT, { detail: company }),
      );
      setCompanyForm({
        ...EMPTY_COMPANY_FORM,
        ...Object.fromEntries(
          Object.keys(EMPTY_COMPANY_FORM).map((key) => [
            key,
            company[key] || "",
          ]),
        ),
      });
      setCompanyAssets({
        logoUrl: company.company_logo_url || "",
        faviconUrl: company.favicon_url || "",
        logoFile: null,
        faviconFile: null,
        logoPreview: "",
        faviconPreview: "",
        clearLogo: false,
        clearFavicon: false,
      });
      await loadAuditLogs();
      toast.success("Company information saved.");
    } catch (err) {
      toast.error(
        getFriendlyErrorMessage(err, "Unable to save company information."),
      );
    } finally {
      setSaving("");
    }
  };

  const updateCalendarModule = (module, value) => {
    setCalendarSettings((current) => ({
      ...current,
      modules: { ...current.modules, [module]: value },
    }));
  };

  const replaceWorkCalendar = (updates) => {
    setCalendarSettings((current) => {
      const normalized = normalizeWorkCalendar(
        current.work_calendar,
        current.default_calendar,
      );
      return {
        ...current,
        work_calendar: {
          ...normalized,
          ...updates,
        },
      };
    });
  };

  const toggleWeeklyOffDay = (day) => {
    const days = new Set(workCalendar.weekly_off_days);
    if (days.has(day)) {
      days.delete(day);
    } else {
      days.add(day);
    }
    replaceWorkCalendar({
      weekly_off_days: [...days].sort((a, b) => a - b),
    });
  };

  const updateHolidayDraft = (field, value) => {
    setHolidayDraft((current) => {
      const next = { ...current, [field]: value };
      if (field === "paid_holiday") {
        next.payment_policy = value ? "paid" : "unpaid";
      }
      if (field === "payment_policy") {
        next.paid_holiday = value !== "unpaid";
      }
      return next;
    });
  };

  const editHoliday = (holiday) => {
    setHolidayDraft({
      ...createHolidayDraft(),
      ...holiday,
    });
  };

  const startHolidayForDate = (date) => {
    const existingHoliday = getDateInfo(date, calendarSettings).holiday;
    setSelectedPreviewDate(date);
    if (existingHoliday) {
      editHoliday(existingHoliday);
    } else {
      setHolidayDraft(createHolidayDraft(date));
    }
  };

  const saveHolidayDraft = () => {
    const draft = {
      ...holidayDraft,
      end_date: holidayDraft.end_date || holidayDraft.start_date,
    };

    const normalizedHoliday = normalizeWorkCalendar(
      {
        policies: workCalendar.policies,
        holidays: [draft],
      },
      calendarType,
    ).holidays[0];

    if (!normalizedHoliday) {
      toast.error("Holiday name and start date are required.");
      return;
    }

    if (normalizedHoliday.end_date < normalizedHoliday.start_date) {
      toast.error("Holiday end date cannot be before start date.");
      return;
    }

    const siblings = workCalendar.holidays.filter(
      (holiday) => holiday.id !== normalizedHoliday.id,
    );

    const duplicate = siblings.some(
      (holiday) =>
        holiday.name.toLowerCase() === normalizedHoliday.name.toLowerCase() &&
        holiday.start_date === normalizedHoliday.start_date &&
        holiday.end_date === normalizedHoliday.end_date,
    );
    if (duplicate) {
      toast.error("Duplicate holiday configuration.");
      return;
    }

    const overlapping = siblings.some(
      (holiday) =>
        holiday.active &&
        normalizedHoliday.active &&
        holidayRangesOverlap(holiday, normalizedHoliday),
    );
    if (overlapping) {
      toast.error("Official holiday ranges cannot overlap.");
      return;
    }

    replaceWorkCalendar({
      holidays: [...siblings, normalizedHoliday].sort(
        (left, right) =>
          left.start_date.localeCompare(right.start_date) ||
          left.name.localeCompare(right.name),
      ),
    });
    setHolidayDraft(createHolidayDraft());
    toast.success("Holiday saved.");
  };

  const removeHoliday = (holidayId) => {
    replaceWorkCalendar({
      holidays: workCalendar.holidays.filter(
        (holiday) => holiday.id !== holidayId,
      ),
    });
    if (holidayDraft.id === holidayId) {
      setHolidayDraft(createHolidayDraft());
    }
  };

  const saveCalendarSettings = async () => {
    setSaving("calendar");
    try {
      const response = await instance.put(
        "auth/settings/calendar/",
        calendarSettings,
      );
      const normalized = normalizeCalendarSettings(response.data);
      setCalendarSettings(normalized);
      localStorage.setItem("cms.calendar.settings", JSON.stringify(normalized));
      await loadAuditLogs();
      toast.success("Calendar settings saved.");
    } catch (err) {
      toast.error(
        getFriendlyErrorMessage(err, "Unable to save calendar settings."),
      );
    } finally {
      setSaving("");
    }
  };

  const updatePreference = (sectionName, key, value) => {
    setPreferences((current) => ({
      ...current,
      [sectionName]: {
        ...current[sectionName],
        [key]: value,
      },
    }));
    if (sectionName === "appearance" && key === "theme") {
      setTheme(value);
    }
    if (sectionName === "language" && key === "language") {
      setLanguage(value);
    }
  };

  const savePreferences = async () => {
    setSaving("preferences");
    try {
      const response = await instance.put(
        "auth/settings/preferences/",
        preferences,
      );
      setPreferences(normalizePreferences(response.data));
      await loadAuditLogs();
      toast.success("Settings saved.");
    } catch (err) {
      toast.error(getFriendlyErrorMessage(err, "Unable to save settings."));
    } finally {
      setSaving("");
    }
  };

  const saveExpenseApproval = async () => {
    setSaving("expenseApproval");
    try {
      const response = await instance.put(
        "expenses/approval-settings/",
        expenseApproval,
      );
      setExpenseApproval({ enabled: Boolean(response.data?.enabled) });
      toast.success("Expense approval settings saved.");
    } catch (err) {
      toast.error(
        getFriendlyErrorMessage(err, "Unable to save expense approval."),
      );
    } finally {
      setSaving("");
    }
  };

  const saveSecuritySettings = async () => {
    setSaving("security");
    try {
      const [preferencesRes, approvalRes] = await Promise.all([
        instance.put("auth/settings/preferences/", preferences),
        instance.put("expenses/approval-settings/", expenseApproval),
      ]);
      setPreferences(normalizePreferences(preferencesRes.data));
      setExpenseApproval({ enabled: Boolean(approvalRes.data?.enabled) });
      await loadAuditLogs();
      toast.success("Security settings saved.");
    } catch (err) {
      toast.error(
        getFriendlyErrorMessage(err, "Unable to save security settings."),
      );
    } finally {
      setSaving("");
    }
  };

  async function loadAuditLogs() {
    try {
      const response = await instance.get(
        "auth/settings/audit-logs/?limit=30",
        {
          skipGlobalErrorToast: true,
        },
      );
      setAuditLogs(Array.isArray(response.data) ? response.data : []);
    } catch {
      setAuditLogs([]);
    }
  }

  /* ------------------------------ states --------------------------- */

  if (loading) {
    return (
      <div className="space-y-6 pb-8">
        <style>{FADE_IN_CSS}</style>
        <div className="h-44 animate-pulse rounded-3xl bg-[var(--border)]/30" />
        <div className="grid gap-5 lg:grid-cols-[19rem_1fr]">
          <div className="hidden h-[560px] animate-pulse rounded-3xl bg-[var(--border)]/30 lg:block" />
          <div className="space-y-4">
            <div className="h-12 w-64 animate-pulse rounded-2xl bg-[var(--border)]/30" />
            <div className="h-40 animate-pulse rounded-2xl bg-[var(--border)]/30" />
            <div className="h-56 animate-pulse rounded-2xl bg-[var(--border)]/30" />
            <div className="h-40 animate-pulse rounded-2xl bg-[var(--border)]/30" />
          </div>
        </div>
      </div>
    );
  }

  if (!canView) {
    return (
      <InlineAlert type="warning" title="Permission required">
        You do not have permission to view settings.
      </InlineAlert>
    );
  }

  if (loadError) {
    return (
      <InlineAlert type="error" title="Settings unavailable">
        {loadError}
      </InlineAlert>
    );
  }

  /* ------------------------------ render --------------------------- */

  return (
    <div className="min-w-0 space-y-4 pb-8 sm:space-y-6 sm:pb-10">
      <style>{FADE_IN_CSS}</style>

      {/* Hero header */}
      <div className="relative hidden overflow-hidden rounded-2xl bg-gradient-to-br from-[var(--primary)] via-[var(--primary)] to-[var(--primary)]/70 text-white shadow-xl shadow-[var(--primary)]/20 sm:block sm:rounded-3xl">
        <div className="pointer-events-none absolute -right-16 -top-20 h-64 w-64 rounded-full bg-white/10 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 right-1/3 h-52 w-52 rounded-full bg-black/10 blur-3xl" />
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.12]"
          style={{
            backgroundImage:
              "radial-gradient(circle at 1px 1px, rgba(255,255,255,0.9) 1px, transparent 0)",
            backgroundSize: "22px 22px",
          }}
        />
        {/* <div className="relative flex flex-col gap-6 p-6 sm:p-8 lg:flex-row lg:items-end lg:justify-between">
          <div className="min-w-0">
            <p className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.22em] text-white/70">
              <Sparkles className="h-3.5 w-3.5" />
              Administration
            </p>
            <h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
              Settings
            </h1>
            <p className="mt-2 max-w-xl text-sm leading-relaxed text-white/80">
              Branding, calendars, preferences and security — everything that
              shapes how your workspace looks and behaves, in one place.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {[
              { icon: CalendarDays, label: calendarLabel },
              {
                icon: CheckCircle2,
                label: `${activeHolidayCount} active ${activeHolidayCount === 1 ? "holiday" : "holidays"}`,
              },
              { icon: Palette, label: themeLabel },
              { icon: Languages, label: languageLabel },
            ].map((chip) => (
              <span
                key={chip.label}
                className="inline-flex items-center gap-2 rounded-xl border border-white/25 bg-white/10 px-3.5 py-2 text-xs font-semibold backdrop-blur-sm"
              >
                <chip.icon className="h-3.5 w-3.5" />
                {chip.label}
              </span>
            ))}
          </div>
        </div> */}
      </div>

      {/* Shell */}
      <div className="min-w-0 overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--card)] shadow-sm sm:rounded-3xl">
        <div className="grid lg:min-h-[720px] lg:grid-cols-[19rem_1fr]">
          {/* Sidebar */}
          <aside className="flex flex-col border-b border-[var(--border)] bg-[var(--bg)]/60 lg:border-b-0 lg:border-r">
            <div className="hidden border-b border-[var(--border)] px-5 py-4 lg:block">
              <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[var(--muted)]">
                Configuration
              </p>
            </div>
            <nav className="flex snap-x gap-2 overflow-x-auto p-2.5 mobile-scrollbar sm:p-3 lg:grid lg:flex-1 lg:snap-none lg:content-start lg:gap-1.5 lg:overflow-visible">
              {SECTIONS.map((item) => {
                const Icon = item.icon;
                const active = activeSection === item.key;
                return (
                  <button
                    key={item.key}
                    type="button"
                    onClick={() => setActiveSection(item.key)}
                    className={cx(
                      "group flex w-[12.5rem] shrink-0 snap-start items-center gap-2.5 rounded-xl border px-3 py-2.5 text-left transition-all sm:w-[14rem] sm:gap-3 lg:w-full",
                      active
                        ? "border-[var(--primary)]/25 bg-[var(--primary)]/10 shadow-sm"
                        : "border-transparent hover:border-[var(--border)] hover:bg-[var(--card)]",
                    )}
                  >
                    <span
                      className={cx(
                        "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg transition-colors",
                        active
                          ? "bg-[var(--primary)] text-white shadow-md shadow-[var(--primary)]/30"
                          : item.tint,
                      )}
                    >
                      <Icon className="h-4 w-4" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span
                        className={cx(
                          "block truncate text-sm font-semibold lg:whitespace-normal",
                          active
                            ? "text-[var(--primary)]"
                            : "text-[var(--text)]",
                        )}
                      >
                        {item.label}
                      </span>
                      <span className="mt-0.5 hidden truncate text-[11px] text-[var(--muted)] lg:block">
                        {item.description}
                      </span>
                    </span>
                    <ChevronRight
                      className={cx(
                        "hidden h-4 w-4 shrink-0 transition-all lg:block",
                        active
                          ? "translate-x-0 text-[var(--primary)] opacity-100"
                          : "-translate-x-1 opacity-0 group-hover:translate-x-0 group-hover:opacity-50",
                      )}
                    />
                  </button>
                );
              })}
            </nav>
            <div className="mx-3 mb-3 mt-3 hidden rounded-2xl border border-[var(--border)] bg-[var(--card)] p-4 lg:mt-auto lg:block">
              <div className="flex items-start gap-2.5">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                  <ShieldCheck className="h-4 w-4" />
                </span>
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-[var(--text)]">
                    Protected changes
                  </p>
                  <p className="mt-0.5 text-[11px] leading-relaxed text-[var(--muted)]">
                    Every update is recorded in the audit log for full
                    accountability.
                  </p>
                </div>
              </div>
            </div>
          </aside>

          {/* Content */}
          <main className="min-w-0 overflow-hidden p-3.5 sm:p-6 lg:p-8">
            <div key={activeSection} className="settings-section-enter">
              {/* -------------------------- COMPANY -------------------------- */}
              {activeSection === "company" && (
                <section>
                  <SectionTitle
                    icon={section.icon}
                    eyebrow="Branding"
                    title="Company Information"
                    description="Logos, legal identity and contact details used across the system and on printed documents."
                  />
                  <div className="space-y-5">
                    <SectionCard
                      icon={ImageIcon}
                      title="Brand assets"
                      description="Shown in the sidebar, login screen and browser tab."
                    >
                      <div className="grid gap-4 md:grid-cols-2">
                        <ImageUpload
                          label="Company Logo"
                          value={companyAssets.logoUrl}
                          preview={companyAssets.logoPreview}
                          onFile={(file) => updateCompanyAsset("logo", file)}
                          onClear={() => clearCompanyAsset("logo")}
                          disabled={!canManage}
                        />
                        <ImageUpload
                          label="Favicon"
                          value={companyAssets.faviconUrl}
                          preview={companyAssets.faviconPreview}
                          onFile={(file) => updateCompanyAsset("favicon", file)}
                          onClear={() => clearCompanyAsset("favicon")}
                          disabled={!canManage}
                          compact
                        />
                      </div>
                    </SectionCard>

                    <SectionCard
                      icon={Building2}
                      title="Legal identity"
                      description="Official names and registration numbers used on formal documents."
                    >
                      <div className="grid gap-4 md:grid-cols-2">
                        <Field
                          label="Company Name"
                          name="company_name"
                          value={companyForm.company_name}
                          onChange={updateCompanyField}
                          disabled={!canManage}
                        />
                        <Field
                          label="Legal Company Name"
                          name="legal_company_name"
                          value={companyForm.legal_company_name}
                          onChange={updateCompanyField}
                          disabled={!canManage}
                        />
                        <Field
                          label="Tax Number / TIN"
                          name="tax_number"
                          value={companyForm.tax_number}
                          onChange={updateCompanyField}
                          disabled={!canManage}
                        />
                        <Field
                          label="Registration Number"
                          name="registration_number"
                          value={companyForm.registration_number}
                          onChange={updateCompanyField}
                          disabled={!canManage}
                        />
                      </div>
                    </SectionCard>

                    <SectionCard
                      icon={MapPin}
                      title="Contact & address"
                      description="Where the company is located and how partners can reach it."
                    >
                      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                        <Field
                          label="Address"
                          name="address"
                          value={companyForm.address}
                          onChange={updateCompanyField}
                          disabled={!canManage}
                        />
                        <Field
                          label="City"
                          name="city"
                          value={companyForm.city}
                          onChange={updateCompanyField}
                          disabled={!canManage}
                        />
                        <Field
                          label="Province/State"
                          name="province_state"
                          value={companyForm.province_state}
                          onChange={updateCompanyField}
                          disabled={!canManage}
                        />
                        <Field
                          label="Country"
                          name="country"
                          value={companyForm.country}
                          onChange={updateCompanyField}
                          disabled={!canManage}
                        />
                        <Field
                          label="Postal Code"
                          name="postal_code"
                          value={companyForm.postal_code}
                          onChange={updateCompanyField}
                          disabled={!canManage}
                        />
                        <Field
                          label="Phone Number"
                          name="phone_number"
                          value={companyForm.phone_number}
                          onChange={updateCompanyField}
                          disabled={!canManage}
                        />
                        <Field
                          label="Alternative Phone"
                          name="alternative_phone"
                          value={companyForm.alternative_phone}
                          onChange={updateCompanyField}
                          disabled={!canManage}
                        />
                        <Field
                          label="Email"
                          name="email"
                          type="email"
                          value={companyForm.email}
                          onChange={updateCompanyField}
                          disabled={!canManage}
                        />
                        <Field
                          label="Website"
                          name="website"
                          type="url"
                          value={companyForm.website}
                          onChange={updateCompanyField}
                          disabled={!canManage}
                        />
                      </div>
                    </SectionCard>

                    <SectionCard
                      icon={FileText}
                      title="Print & description"
                      description="Text that appears on reports and official printouts."
                    >
                      <div className="grid gap-4 md:grid-cols-2">
                        <TextArea
                          label="Company Description"
                          name="company_description"
                          value={companyForm.company_description}
                          onChange={updateCompanyField}
                          disabled={!canManage}
                        />
                        <TextArea
                          label="Footer Text for Printed Documents"
                          name="print_footer_text"
                          value={companyForm.print_footer_text}
                          onChange={updateCompanyField}
                          disabled={!canManage}
                        />
                      </div>
                    </SectionCard>

                    {canManage && (
                      <SaveBar hint="Company details appear on reports, exports and printed documents.">
                        <Button
                          onClick={saveCompanyInformation}
                          disabled={saving === "company"}
                          leftIcon={<Save className="h-4 w-4" />}
                        >
                          {saving === "company"
                            ? "Saving…"
                            : "Save Company Information"}
                        </Button>
                      </SaveBar>
                    )}
                  </div>
                </section>
              )}

              {/* -------------------------- CALENDAR -------------------------- */}
              {activeSection === "calendar" && (
                <section>
                  <SectionTitle
                    icon={section.icon}
                    eyebrow="Dates"
                    title="Calendar Settings"
                    description="Choose the calendar system, weekly rest days and official holidays used across all modules."
                  />
                  <div className="space-y-5">
                    <SectionCard
                      icon={Globe2}
                      title="Calendar type"
                      description="A global default, with optional per-module overrides."
                    >
                      <div className="max-w-md">
                        <SelectField
                          label="Global Calendar"
                          value={calendarSettings.default_calendar}
                          disabled={!canManage}
                          onChange={(value) =>
                            setCalendarSettings((current) => ({
                              ...current,
                              default_calendar: value,
                            }))
                          }
                          options={GLOBAL_CALENDAR_OPTIONS}
                        />
                      </div>
                      <div className="mt-6 border-t border-[var(--border)] pt-5">
                        <p className="mb-3 flex flex-wrap items-baseline gap-x-2 text-[13px] font-semibold text-[var(--text)]">
                          Per-module overrides
                          <span className="font-normal text-[var(--muted)]">
                            leave on “Inherit” to follow the global calendar
                          </span>
                        </p>
                        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                          {CALENDAR_MODULES.map((module) => (
                            <SelectField
                              key={module}
                              label={moduleLabel(module)}
                              value={
                                calendarSettings.modules[module] ||
                                CALENDAR_TYPES.INHERIT
                              }
                              disabled={!canManage}
                              onChange={(value) =>
                                updateCalendarModule(module, value)
                              }
                              options={CALENDAR_OPTIONS}
                            />
                          ))}
                        </div>
                      </div>
                    </SectionCard>

                    <SectionCard
                      icon={CalendarDays}
                      title="Work calendar & holidays"
                      description="Weekly off days and official holiday ranges."
                      action={
                        <span className="inline-flex items-center gap-1.5 rounded-full border border-[var(--border)] bg-[var(--card)] px-3 py-1 text-[11px] font-semibold text-[var(--muted)]">
                          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                          {activeHolidayCount} active holidays
                        </span>
                      }
                    >
                      <div>
                        <p className="mb-3 text-[13px] font-semibold text-[var(--text)]">
                          Weekly off days
                        </p>
                        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-7">
                          {WORK_CALENDAR_WEEKDAYS.map((day) => {
                            const selected =
                              workCalendar.weekly_off_days.includes(day.value);
                            return (
                              <button
                                key={day.value}
                                type="button"
                                disabled={!canManage}
                                aria-pressed={selected}
                                onClick={() => toggleWeeklyOffDay(day.value)}
                                className={cx(
                                  "group flex min-h-[46px] items-center justify-between gap-2 rounded-xl border px-3 text-sm font-semibold transition-all disabled:cursor-not-allowed disabled:opacity-60 sm:min-h-[52px] sm:px-3.5",
                                  selected
                                    ? "border-amber-300 bg-amber-50 text-amber-800 shadow-sm dark:border-amber-700/60 dark:bg-amber-950/40 dark:text-amber-200"
                                    : "border-[var(--border)] bg-[var(--card)] text-[var(--text)] hover:border-[var(--muted)]/40 hover:bg-[var(--hover)]",
                                )}
                              >
                                <span>{day.label}</span>
                                <span
                                  className={cx(
                                    "flex h-5 w-5 shrink-0 items-center justify-center rounded-full transition-all",
                                    selected
                                      ? "bg-amber-500 text-white"
                                      : "border border-[var(--border)] text-transparent group-hover:border-[var(--muted)]/60",
                                  )}
                                >
                                  <Check className="h-3 w-3" strokeWidth={3} />
                                </span>
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      <div className="mt-6 grid gap-5 border-t border-[var(--border)] pt-6 xl:grid-cols-[minmax(0,1fr)_minmax(340px,380px)] xl:items-start">
                        {/* Holiday list */}
                        <div className="min-w-0 space-y-4">
                          <div className="flex flex-wrap items-center justify-between gap-3">
                            <h3 className="text-[13px] font-semibold text-[var(--text)]">
                              Official holidays
                            </h3>
                            <Button
                              variant="secondary"
                              size="sm"
                              disabled={!canManage}
                              onClick={() =>
                                setHolidayDraft(
                                  createHolidayDraft(selectedPreviewDate),
                                )
                              }
                              leftIcon={<Plus className="h-4 w-4" />}
                            >
                              Add Holiday
                            </Button>
                          </div>

                          <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_140px]">
                            <label className="relative block">
                              <span className="sr-only">Search holidays</span>
                              <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--muted)]" />
                              <input
                                type="search"
                                value={holidaySearch}
                                onChange={(event) =>
                                  setHolidaySearch(event.target.value)
                                }
                                placeholder="Search holidays"
                                className={cx(inputClasses, "pl-10")}
                              />
                            </label>
                            <div className="relative">
                              <select
                                value={holidayYearFilter}
                                onChange={(event) =>
                                  setHolidayYearFilter(event.target.value)
                                }
                                className={cx(
                                  inputClasses,
                                  "appearance-none pr-9",
                                )}
                              >
                                <option value="all">All years</option>
                                {holidayYears.map((year) => (
                                  <option key={year} value={year}>
                                    {year}
                                  </option>
                                ))}
                              </select>
                              <ChevronRight className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 rotate-90 text-[var(--muted)]" />
                            </div>
                          </div>

                          <div className="space-y-3 md:hidden">
                            {filteredHolidays.length === 0 ? (
                              <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] px-4 py-10 text-center">
                                <CalendarDays className="mx-auto h-8 w-8 text-[var(--muted)]/50" />
                                <p className="mt-3 text-sm font-medium text-[var(--text)]">
                                  No holidays found
                                </p>
                                <p className="mt-1 text-xs text-[var(--muted)]">
                                  Adjust your search or add a new holiday.
                                </p>
                              </div>
                            ) : (
                              filteredHolidays.map((holiday) => (
                                <article
                                  key={holiday.id}
                                  className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-4"
                                >
                                  <div className="flex items-start justify-between gap-3">
                                    <div className="min-w-0">
                                      <h4 className="truncate text-sm font-semibold text-[var(--text)]">
                                        {holiday.name}
                                      </h4>
                                      <p className="mt-1 text-xs font-medium text-[var(--muted)]">
                                        {formatDate(
                                          holiday.start_date,
                                          calendarType,
                                        )}
                                        {holiday.end_date !==
                                          holiday.start_date && (
                                          <>
                                            {" -> "}
                                            {formatDate(
                                              holiday.end_date,
                                              calendarType,
                                            )}
                                          </>
                                        )}
                                      </p>
                                    </div>
                                    <div className="flex shrink-0 gap-1.5">
                                      <button
                                        type="button"
                                        disabled={!canManage}
                                        onClick={() => editHoliday(holiday)}
                                        className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-[var(--border)] text-[var(--muted)] transition hover:border-[var(--primary)]/40 hover:bg-[var(--primary)]/10 hover:text-[var(--primary)] disabled:cursor-not-allowed disabled:opacity-60"
                                        aria-label={`Edit ${holiday.name}`}
                                        title="Edit"
                                      >
                                        <Edit2 className="h-4 w-4" />
                                      </button>
                                      <button
                                        type="button"
                                        disabled={!canManage}
                                        onClick={() => removeHoliday(holiday.id)}
                                        className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-[var(--border)] text-[var(--muted)] transition hover:border-rose-300 hover:bg-rose-50 hover:text-rose-600 disabled:cursor-not-allowed disabled:opacity-60 dark:hover:border-rose-800 dark:hover:bg-rose-950/30"
                                        aria-label={`Delete ${holiday.name}`}
                                        title="Delete"
                                      >
                                        <Trash2 className="h-4 w-4" />
                                      </button>
                                    </div>
                                  </div>
                                  {holiday.description && (
                                    <p className="mt-3 line-clamp-2 text-xs leading-relaxed text-[var(--muted)]">
                                      {holiday.description}
                                    </p>
                                  )}
                                  <div className="mt-3 flex flex-wrap gap-2">
                                    <StatusBadge
                                      tone={
                                        holiday.paid_holiday
                                          ? "emerald"
                                          : "slate"
                                      }
                                    >
                                      {holiday.paid_holiday
                                        ? "Paid"
                                        : "Unpaid"}
                                    </StatusBadge>
                                    <StatusBadge
                                      tone={holiday.active ? "blue" : "slate"}
                                    >
                                      {holiday.active ? "Active" : "Inactive"}
                                    </StatusBadge>
                                  </div>
                                </article>
                              ))
                            )}
                          </div>

                          <div className="hidden overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--card)] md:block">
                            <div className="overflow-x-auto mobile-scrollbar">
                              <table className="w-full min-w-[720px] text-left text-sm">
                                <thead className="bg-[var(--bg)] text-[11px] uppercase tracking-[0.08em] text-[var(--muted)]">
                                  <tr>
                                    <th className="px-4 py-3 font-semibold">
                                      Holiday
                                    </th>
                                    <th className="px-4 py-3 font-semibold">
                                      Dates
                                    </th>
                                    <th className="px-4 py-3 font-semibold">
                                      Payment
                                    </th>
                                    <th className="px-4 py-3 font-semibold">
                                      Status
                                    </th>
                                    <th className="px-4 py-3 text-right font-semibold">
                                      Actions
                                    </th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-[var(--border)]">
                                  {filteredHolidays.length === 0 ? (
                                    <tr>
                                      <td
                                        colSpan={5}
                                        className="px-4 py-12 text-center"
                                      >
                                        <CalendarDays className="mx-auto h-8 w-8 text-[var(--muted)]/50" />
                                        <p className="mt-3 text-sm font-medium text-[var(--text)]">
                                          No holidays found
                                        </p>
                                        <p className="mt-1 text-xs text-[var(--muted)]">
                                          Adjust your search or add a new
                                          holiday.
                                        </p>
                                      </td>
                                    </tr>
                                  ) : (
                                    filteredHolidays.map((holiday) => (
                                      <tr
                                        key={holiday.id}
                                        className="transition-colors hover:bg-[var(--hover)]/60"
                                      >
                                        <td className="px-4 py-3.5 align-top">
                                          <p className="font-semibold text-[var(--text)]">
                                            {holiday.name}
                                          </p>
                                          {holiday.description && (
                                            <p className="mt-0.5 max-w-xs truncate text-xs text-[var(--muted)]">
                                              {holiday.description}
                                            </p>
                                          )}
                                        </td>
                                        <td className="whitespace-nowrap px-4 py-3.5 align-top text-[var(--text)]">
                                          {formatDate(
                                            holiday.start_date,
                                            calendarType,
                                          )}
                                          {holiday.end_date !==
                                            holiday.start_date && (
                                            <span className="text-[var(--muted)]">
                                              {" → "}
                                              {formatDate(
                                                holiday.end_date,
                                                calendarType,
                                              )}
                                            </span>
                                          )}
                                        </td>
                                        <td className="px-4 py-3.5 align-top">
                                          <StatusBadge
                                            tone={
                                              holiday.paid_holiday
                                                ? "emerald"
                                                : "slate"
                                            }
                                          >
                                            {holiday.paid_holiday
                                              ? "Paid"
                                              : "Unpaid"}
                                          </StatusBadge>
                                        </td>
                                        <td className="px-4 py-3.5 align-top">
                                          <StatusBadge
                                            tone={
                                              holiday.active ? "blue" : "slate"
                                            }
                                          >
                                            {holiday.active
                                              ? "Active"
                                              : "Inactive"}
                                          </StatusBadge>
                                        </td>
                                        <td className="px-4 py-3.5 align-top">
                                          <div className="flex justify-end gap-2">
                                            <button
                                              type="button"
                                              disabled={!canManage}
                                              onClick={() =>
                                                editHoliday(holiday)
                                              }
                                              className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-[var(--border)] text-[var(--muted)] transition hover:border-[var(--primary)]/40 hover:bg-[var(--primary)]/10 hover:text-[var(--primary)] disabled:cursor-not-allowed disabled:opacity-60"
                                              aria-label={`Edit ${holiday.name}`}
                                              title="Edit"
                                            >
                                              <Edit2 className="h-3.5 w-3.5" />
                                            </button>
                                            <button
                                              type="button"
                                              disabled={!canManage}
                                              onClick={() =>
                                                removeHoliday(holiday.id)
                                              }
                                              className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-[var(--border)] text-[var(--muted)] transition hover:border-rose-300 hover:bg-rose-50 hover:text-rose-600 disabled:cursor-not-allowed disabled:opacity-60 dark:hover:border-rose-800 dark:hover:bg-rose-950/30"
                                              aria-label={`Delete ${holiday.name}`}
                                              title="Delete"
                                            >
                                              <Trash2 className="h-3.5 w-3.5" />
                                            </button>
                                          </div>
                                        </td>
                                      </tr>
                                    ))
                                  )}
                                </tbody>
                              </table>
                            </div>
                          </div>
                        </div>

                        {/* Holiday editor */}
                        <div className="space-y-4 rounded-xl border border-[var(--border)] bg-[var(--card)] p-4 shadow-sm sm:rounded-2xl sm:p-5 xl:sticky xl:top-6">
                          <div className="flex items-center justify-between gap-3">
                            <div className="flex items-center gap-2">
                              <h3 className="text-sm font-bold text-[var(--text)]">
                                {editingExistingHoliday
                                  ? "Edit holiday"
                                  : "New holiday"}
                              </h3>
                              <StatusBadge
                                tone={editingExistingHoliday ? "amber" : "blue"}
                              >
                                {editingExistingHoliday ? "Editing" : "Draft"}
                              </StatusBadge>
                            </div>
                            <button
                              type="button"
                              disabled={!canManage}
                              onClick={() =>
                                setHolidayDraft(createHolidayDraft())
                              }
                              className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-[var(--border)] text-[var(--muted)] transition hover:bg-[var(--hover)] hover:text-[var(--text)] disabled:cursor-not-allowed disabled:opacity-60"
                              aria-label="Clear holiday form"
                              title="Clear"
                            >
                              <X className="h-4 w-4" />
                            </button>
                          </div>

                          <Field
                            label="Holiday Name"
                            name="name"
                            value={holidayDraft.name}
                            disabled={!canManage}
                            onChange={updateHolidayDraft}
                            placeholder="Eid al-Fitr"
                          />
                          <div className="grid gap-4 sm:grid-cols-2">
                            <CalendarDatePicker
                              label="Start Date"
                              name="start_date"
                              value={holidayDraft.start_date}
                              disabled={!canManage}
                              onChange={(value) =>
                                updateHolidayDraft("start_date", value)
                              }
                              calendarOverride={calendarType}
                              module="reports"
                            />
                            <CalendarDatePicker
                              label="End Date"
                              name="end_date"
                              value={holidayDraft.end_date}
                              disabled={!canManage}
                              onChange={(value) =>
                                updateHolidayDraft("end_date", value)
                              }
                              calendarOverride={calendarType}
                              module="reports"
                            />
                          </div>
                          <TextArea
                            label="Description"
                            name="description"
                            value={holidayDraft.description}
                            disabled={!canManage}
                            rows={3}
                            onChange={updateHolidayDraft}
                          />
                          <SelectField
                            label="Holiday Payment Policy"
                            value={holidayDraft.payment_policy}
                            disabled={!canManage}
                            onChange={(value) =>
                              updateHolidayDraft("payment_policy", value)
                            }
                            options={HOLIDAY_PAYMENT_OPTIONS}
                          />
                          <div className="divide-y divide-[var(--border)] rounded-xl border border-[var(--border)] bg-[var(--bg)] px-4">
                            <ToggleRow
                              title="Paid Holiday"
                              checked={holidayDraft.paid_holiday}
                              disabled={!canManage}
                              onChange={(value) =>
                                updateHolidayDraft("paid_holiday", value)
                              }
                            />
                            <ToggleRow
                              title="Active"
                              checked={holidayDraft.active}
                              disabled={!canManage}
                              onChange={(value) =>
                                updateHolidayDraft("active", value)
                              }
                            />
                          </div>
                          <Button
                            fullWidth
                            disabled={!canManage}
                            onClick={saveHolidayDraft}
                            leftIcon={<Save className="h-4 w-4" />}
                          >
                            {editingExistingHoliday
                              ? "Update Holiday"
                              : "Save Holiday"}
                          </Button>
                        </div>
                      </div>
                    </SectionCard>

                    <SectionCard
                      icon={CalendarRange}
                      title="Calendar preview"
                      description={`${formatMonthKey(previewMonth, calendarType)} — click any day to add or edit a holiday.`}
                      action={
                        <input
                          type={
                            calendarType === CALENDAR_TYPES.GREGORIAN
                              ? "month"
                              : "text"
                          }
                          value={previewMonth}
                          placeholder="YYYY-MM"
                          onChange={(event) =>
                            setPreviewMonth(event.target.value)
                          }
                          className={cx(inputClasses, "w-full sm:w-44")}
                        />
                      }
                    >
                      <div className="mb-4 flex flex-wrap gap-2">
                        {[
                          { label: "Working Day", dot: "bg-emerald-500" },
                          { label: "Weekly Off Day", dot: "bg-amber-500" },
                          { label: "Official Holiday", dot: "bg-rose-500" },
                        ].map((item) => (
                          <span
                            key={item.label}
                            className="inline-flex items-center gap-1.5 rounded-full border border-[var(--border)] bg-[var(--card)] px-3 py-1 text-[11px] font-semibold text-[var(--muted)]"
                          >
                            <span
                              className={cx(
                                "h-1.5 w-1.5 rounded-full",
                                item.dot,
                              )}
                            />
                            {item.label}
                          </span>
                        ))}
                      </div>

                      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_300px] xl:items-start">
                        <div className="min-w-0 overflow-hidden rounded-xl border border-[var(--border)] shadow-sm">
                          <div className="grid grid-cols-7 border-b border-[var(--border)] bg-[var(--bg)] text-center text-[11px] font-bold uppercase tracking-wider text-[var(--muted)]">
                            {previewWeekdays.map((day) => (
                              <div key={day.value} className="px-1 py-2 sm:px-2 sm:py-2.5">
                                {day.shortLabel}
                              </div>
                            ))}
                          </div>
                          <div className="grid grid-cols-7 bg-[var(--card)]">
                            {previewDays.map((cell) => {
                              if (cell.empty) {
                                return (
                                  <div
                                    key={cell.key}
                                    className="min-h-[52px] border-b border-r border-[var(--border)] bg-[var(--bg)]/60 last:border-r-0 sm:min-h-[88px]"
                                  />
                                );
                              }
                              const selected =
                                selectedPreviewDate === cell.date;
                              const isToday = cell.date === todayIso();
                              return (
                                <button
                                  key={cell.key}
                                  type="button"
                                  onClick={() => startHolidayForDate(cell.date)}
                                  className={cx(
                                    "group min-h-[52px] border-b border-r border-[var(--border)] p-1.5 text-left transition-all hover:z-10 hover:bg-[var(--hover)] focus:outline-none focus:ring-2 focus:ring-inset focus:ring-[var(--primary)] sm:min-h-[88px] sm:p-2",
                                    cell.info.is_holiday
                                      ? "bg-rose-50 dark:bg-rose-950/20"
                                      : cell.info.is_weekly_off
                                        ? "bg-amber-50 dark:bg-amber-950/20"
                                        : "bg-[var(--card)]",
                                    selected &&
                                      "z-10 ring-2 ring-inset ring-[var(--primary)]",
                                  )}
                                >
                                  <div className="flex items-start justify-between gap-1">
                                    <span
                                      className={cx(
                                        "flex h-6 w-6 items-center justify-center rounded-full text-xs font-semibold sm:text-[13px]",
                                        isToday
                                          ? "bg-[var(--primary)] text-white shadow-sm"
                                          : selected
                                            ? "text-[var(--primary)]"
                                            : "text-[var(--text)]",
                                      )}
                                    >
                                      {cell.day}
                                    </span>
                                    <span
                                      className={cx(
                                        "mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full",
                                        workCalendarDotClasses(cell.info),
                                      )}
                                    />
                                  </div>
                                  <span className="mt-1.5 hidden text-[11px] font-medium leading-tight text-[var(--muted)] sm:line-clamp-2 sm:block">
                                    {cell.info.label}
                                  </span>
                                </button>
                              );
                            })}
                          </div>
                        </div>

                        <aside className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-4 shadow-sm sm:rounded-2xl sm:p-5 xl:sticky xl:top-6">
                          <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-[var(--muted)]">
                            Selected day
                          </p>
                          <div className="mt-2 flex items-start justify-between gap-3">
                            <p className="text-base font-bold leading-tight text-[var(--text)]">
                              {formatDate(selectedPreviewDate, calendarType)}
                            </p>
                            <StatusBadge
                              tone={
                                selectedDateInfo?.is_holiday
                                  ? "amber"
                                  : selectedDateInfo?.is_weekly_off
                                    ? "amber"
                                    : "emerald"
                              }
                            >
                              {workCalendarLabel(selectedDateInfo)}
                            </StatusBadge>
                          </div>

                          <div className="mt-5 space-y-2.5">
                            {[
                              {
                                label: "Holiday name",
                                value: selectedDateInfo.holiday?.name || "—",
                              },
                              {
                                label: "Day type",
                                value: workCalendarLabel(selectedDateInfo),
                              },
                              {
                                label: "Paid / unpaid",
                                value: selectedDateInfo.holiday
                                  ? selectedDateInfo.holiday.paid_holiday
                                    ? "Paid"
                                    : "Unpaid"
                                  : "—",
                              },
                            ].map((row) => (
                              <div
                                key={row.label}
                                className="rounded-xl border border-[var(--border)] bg-[var(--bg)] px-3.5 py-2.5"
                              >
                                <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-[var(--muted)]">
                                  {row.label}
                                </p>
                                <p className="mt-0.5 truncate text-sm font-medium text-[var(--text)]">
                                  {row.value}
                                </p>
                              </div>
                            ))}
                          </div>

                          <div className="mt-5">
                            <Button
                              fullWidth
                              variant="secondary"
                              disabled={!canManage || !selectedPreviewDate}
                              onClick={() =>
                                startHolidayForDate(selectedPreviewDate)
                              }
                              leftIcon={
                                selectedDateInfo.holiday ? (
                                  <Edit2 className="h-4 w-4" />
                                ) : (
                                  <Plus className="h-4 w-4" />
                                )
                              }
                            >
                              {selectedDateInfo.holiday
                                ? "Edit Holiday"
                                : "Add Holiday"}
                            </Button>
                          </div>
                        </aside>
                      </div>
                    </SectionCard>

                    {canManage && (
                      <SaveBar hint="Calendar changes affect attendance, payroll and date pickers everywhere.">
                        <Button
                          onClick={saveCalendarSettings}
                          disabled={saving === "calendar"}
                          leftIcon={<Save className="h-4 w-4" />}
                        >
                          {saving === "calendar"
                            ? "Saving…"
                            : "Save Calendar Settings"}
                        </Button>
                      </SaveBar>
                    )}
                  </div>
                </section>
              )}

              {/* -------------------------- APPEARANCE -------------------------- */}
              {activeSection === "appearance" && (
                <section>
                  <SectionTitle
                    icon={section.icon}
                    eyebrow="Theme"
                    title="Appearance"
                    description="Pick how the whole workspace looks. Changes apply instantly."
                  />
                  <div className="space-y-5">
                    <SectionCard
                      icon={Palette}
                      title="Theme"
                      description="Your selection applies immediately and is remembered on this device."
                    >
                      <SegmentedControl
                        value={preferences.appearance.theme}
                        onChange={(value) =>
                          updatePreference("appearance", "theme", value)
                        }
                        disabled={!canManage}
                        options={THEME_SEGMENTS}
                      />
                    </SectionCard>
                    {canManage && (
                      <SaveBar hint="Theme applies right away — saving syncs it to your account.">
                        <Button
                          onClick={savePreferences}
                          disabled={saving === "preferences"}
                          leftIcon={<Save className="h-4 w-4" />}
                        >
                          {saving === "preferences"
                            ? "Saving…"
                            : "Save Appearance"}
                        </Button>
                      </SaveBar>
                    )}
                  </div>
                </section>
              )}

              {/* -------------------------- LANGUAGE -------------------------- */}
              {activeSection === "language" && (
                <section>
                  <SectionTitle
                    icon={section.icon}
                    eyebrow="Localization"
                    title="Language"
                    description="Interface language for menus, labels and messages."
                  />
                  <div className="space-y-5">
                    <SectionCard
                      icon={Languages}
                      title="Interface language"
                      description="Applies immediately across the whole application."
                    >
                      <div className="grid gap-3 sm:grid-cols-3">
                        {LANGUAGE_OPTIONS.map((option) => {
                          const selected =
                            preferences.language.language === option.value;
                          return (
                            <button
                              key={option.value}
                              type="button"
                              disabled={!canManage}
                              onClick={() =>
                                updatePreference(
                                  "language",
                                  "language",
                                  option.value,
                                )
                              }
                              className={cx(
                                "relative flex min-h-[92px] flex-col justify-center gap-1 rounded-2xl border-2 p-5 text-left transition-all disabled:cursor-not-allowed disabled:opacity-60",
                                selected
                                  ? "border-[var(--primary)] bg-[var(--primary)]/10"
                                  : "border-[var(--border)] bg-[var(--card)] hover:border-[var(--muted)]/40 hover:bg-[var(--hover)]",
                              )}
                            >
                              {selected && (
                                <span className="absolute right-3 top-3 flex h-5 w-5 items-center justify-center rounded-full bg-[var(--primary)] text-white shadow">
                                  <Check className="h-3 w-3" strokeWidth={3} />
                                </span>
                              )}
                              <span
                                className={cx(
                                  "text-base font-bold",
                                  selected
                                    ? "text-[var(--primary)]"
                                    : "text-[var(--text)]",
                                )}
                              >
                                {option.label}
                              </span>
                              <span className="text-sm font-medium text-[var(--muted)]">
                                {option.native}
                              </span>
                              <span className="absolute bottom-3 right-4 rounded-md bg-[var(--primary)]/10 px-2 py-0.5 text-[10px] font-bold tracking-wider text-[var(--primary)]">
                                {option.locale}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    </SectionCard>
                    {canManage && (
                      <SaveBar hint="Language applies right away — saving syncs it to your account.">
                        <Button
                          onClick={savePreferences}
                          disabled={saving === "preferences"}
                          leftIcon={<Save className="h-4 w-4" />}
                        >
                          {saving === "preferences"
                            ? "Saving…"
                            : "Save Language"}
                        </Button>
                      </SaveBar>
                    )}
                  </div>
                </section>
              )}

              {/* -------------------------- NOTIFICATIONS -------------------------- */}
              {activeSection === "notifications" && (
                <section>
                  <SectionTitle
                    icon={section.icon}
                    eyebrow="Messaging"
                    title="Notifications"
                    description="Choose which channels deliver operational updates."
                  />
                  <div className="space-y-5">
                    <SectionCard
                      icon={Bell}
                      title="Delivery channels"
                      description="Control how and where you receive notifications."
                    >
                      <div className="divide-y divide-[var(--border)] px-2">
                        <ToggleRow
                          title="In-app Notifications"
                          description="Show operational notifications inside the application."
                          checked={preferences.notifications.in_app}
                          disabled={!canManage}
                          onChange={(value) =>
                            updatePreference("notifications", "in_app", value)
                          }
                        />
                        <ToggleRow
                          title="Email Notifications"
                          description="Prepare settings for email delivery."
                          checked={preferences.notifications.email}
                          disabled={!canManage}
                          onChange={(value) =>
                            updatePreference("notifications", "email", value)
                          }
                        />
                        <ToggleRow
                          title="Real-time Notifications"
                          description="Receive live updates from the notification center."
                          checked={preferences.notifications.real_time}
                          disabled={!canManage}
                          onChange={(value) =>
                            updatePreference(
                              "notifications",
                              "real_time",
                              value,
                            )
                          }
                        />
                      </div>
                    </SectionCard>
                    {canManage && (
                      <SaveBar hint="Notification preferences are saved to your account.">
                        <Button
                          onClick={savePreferences}
                          disabled={saving === "preferences"}
                          leftIcon={<Save className="h-4 w-4" />}
                        >
                          {saving === "preferences"
                            ? "Saving…"
                            : "Save Notifications"}
                        </Button>
                      </SaveBar>
                    )}
                  </div>
                </section>
              )}

              {/* -------------------------- SECURITY -------------------------- */}
              {activeSection === "security" && (
                <section>
                  <SectionTitle
                    icon={section.icon}
                    eyebrow="Access"
                    title="Security"
                    description="Session limits, password rules and approval safeguards."
                  />
                  <div className="space-y-5">
                    <SectionCard
                      icon={KeyRound}
                      title="Password & session policy"
                      description="Rules enforced for every user account."
                    >
                      <div className="grid gap-4 sm:grid-cols-2">
                        <Field
                          label="Session Timeout (minutes)"
                          name="session_timeout_minutes"
                          type="number"
                          value={preferences.security.session_timeout_minutes}
                          disabled={!canManage}
                          onChange={(_, value) =>
                            updatePreference(
                              "security",
                              "session_timeout_minutes",
                              value,
                            )
                          }
                        />
                        <Field
                          label="Minimum Password Length"
                          name="password_min_length"
                          type="number"
                          value={preferences.security.password_min_length}
                          disabled={!canManage}
                          onChange={(_, value) =>
                            updatePreference(
                              "security",
                              "password_min_length",
                              value,
                            )
                          }
                        />
                      </div>
                      <div className="mt-4 divide-y divide-[var(--border)] border-t border-[var(--border)] px-2 pt-1">
                        <ToggleRow
                          title="Require Uppercase Letter"
                          description="Passwords must include at least one capital letter."
                          checked={preferences.security.require_uppercase}
                          disabled={!canManage}
                          onChange={(value) =>
                            updatePreference(
                              "security",
                              "require_uppercase",
                              value,
                            )
                          }
                        />
                        <ToggleRow
                          title="Require Number"
                          description="Passwords must include at least one digit."
                          checked={preferences.security.require_number}
                          disabled={!canManage}
                          onChange={(value) =>
                            updatePreference(
                              "security",
                              "require_number",
                              value,
                            )
                          }
                        />
                        <ToggleRow
                          title="Login Lockout"
                          description="Temporarily lock accounts after repeated failed attempts."
                          checked={preferences.security.login_lockout_enabled}
                          disabled={!canManage}
                          onChange={(value) =>
                            updatePreference(
                              "security",
                              "login_lockout_enabled",
                              value,
                            )
                          }
                        />
                      </div>
                    </SectionCard>

                    <SectionCard
                      icon={ClipboardList}
                      title="Expense approval"
                      description="Require review before expenses are finalized."
                    >
                      <div className="px-2">
                        <ToggleRow
                          title="Expense Approval Enabled"
                          description={
                            expenseApproval.enabled
                              ? "Pending approval workflow is active."
                              : "Expenses are approved immediately."
                          }
                          checked={expenseApproval.enabled}
                          disabled={!canManage}
                          onChange={(value) =>
                            setExpenseApproval({ enabled: value })
                          }
                        />
                      </div>
                    </SectionCard>

                    {canManage && (
                      <SaveBar hint="Security rules apply to all users on their next sign-in.">
                        <Button
                          variant="secondary"
                          onClick={saveExpenseApproval}
                          disabled={saving === "expenseApproval"}
                          leftIcon={<Save className="h-4 w-4" />}
                        >
                          {saving === "expenseApproval"
                            ? "Saving…"
                            : "Save Expense Approval"}
                        </Button>
                        <Button
                          onClick={saveSecuritySettings}
                          disabled={saving === "security"}
                          leftIcon={<Save className="h-4 w-4" />}
                        >
                          {saving === "security"
                            ? "Saving…"
                            : "Save Security"}
                        </Button>
                      </SaveBar>
                    )}
                  </div>
                </section>
              )}

              {/* -------------------------- AUDIT -------------------------- */}
              {activeSection === "audit" && (
                <section>
                  <SectionTitle
                    icon={section.icon}
                    eyebrow="History"
                    title="Audit Logs"
                    description="A record of every settings change — who, when and what changed."
                  />
                  <SectionCard
                    icon={History}
                    title="Change history"
                    description="The 30 most recent settings modifications."
                    action={
                      <Button variant="ghost" size="sm" onClick={loadAuditLogs}>
                        Refresh
                      </Button>
                    }
                  >
                    {auditLogs.length === 0 ? (
                      <div className="flex flex-col items-center px-4 py-14 text-center">
                        <span className="flex h-12 w-12 items-center justify-center rounded-full bg-[var(--primary)]/10 text-[var(--muted)]">
                          <History className="h-5 w-5" />
                        </span>
                        <p className="mt-4 text-sm font-semibold text-[var(--text)]">
                          No settings changes recorded yet
                        </p>
                        <p className="mt-1 max-w-sm text-[13px] text-[var(--muted)]">
                          Updates to company, calendar or preference settings
                          will show up here.
                        </p>
                      </div>
                    ) : (
                      <>
                      <div className="space-y-3 md:hidden">
                        {auditLogs.map((log) => {
                          const firstChange = Object.entries(
                            log.field_changes || {},
                          )[0];
                          const username = log.username || "—";
                          return (
                            <article
                              key={log.id}
                              className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-4"
                            >
                              <div className="flex items-start justify-between gap-3">
                                <div className="flex min-w-0 items-center gap-2.5">
                                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[var(--primary)]/10 text-[11px] font-bold uppercase text-[var(--primary)]">
                                    {username.slice(0, 2)}
                                  </span>
                                  <div className="min-w-0">
                                    <p className="truncate text-sm font-semibold text-[var(--text)]">
                                      {username}
                                    </p>
                                    <p className="mt-0.5 text-xs text-[var(--muted)]">
                                      {timestamp(log.timestamp)}
                                    </p>
                                  </div>
                                </div>
                                <span className="inline-flex shrink-0 rounded-full bg-[var(--primary)]/10 px-2.5 py-1 text-xs font-semibold text-[var(--primary)]">
                                  {log.action}
                                </span>
                              </div>
                              <div className="mt-3 grid gap-2">
                                <div className="rounded-lg border border-[var(--border)] bg-[var(--bg)] px-3 py-2">
                                  <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-[var(--muted)]">
                                    Previous
                                  </p>
                                  <p className="mt-0.5 truncate font-mono text-xs text-[var(--muted)]">
                                    {firstChange
                                      ? displayValue(firstChange[1].old)
                                      : "—"}
                                  </p>
                                </div>
                                <div className="rounded-lg border border-[var(--border)] bg-[var(--bg)] px-3 py-2">
                                  <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-[var(--muted)]">
                                    New
                                  </p>
                                  <p className="mt-0.5 truncate font-mono text-xs font-medium text-[var(--text)]">
                                    {firstChange
                                      ? displayValue(firstChange[1].new)
                                      : "—"}
                                  </p>
                                </div>
                              </div>
                            </article>
                          );
                        })}
                      </div>

                      <div className="hidden overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--card)] md:block">
                        <div className="overflow-x-auto mobile-scrollbar">
                          <table className="w-full min-w-[760px] text-left text-sm">
                            <thead className="bg-[var(--bg)] text-[11px] uppercase tracking-[0.08em] text-[var(--muted)]">
                              <tr>
                                <th className="px-4 py-3 font-semibold">
                                  Date & Time
                                </th>
                                <th className="px-4 py-3 font-semibold">
                                  User
                                </th>
                                <th className="px-4 py-3 font-semibold">
                                  Action
                                </th>
                                <th className="px-4 py-3 font-semibold">
                                  Previous Value
                                </th>
                                <th className="px-4 py-3 font-semibold">
                                  New Value
                                </th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-[var(--border)]">
                              {auditLogs.map((log) => {
                                const firstChange = Object.entries(
                                  log.field_changes || {},
                                )[0];
                                const username = log.username || "—";
                                return (
                                  <tr
                                    key={log.id}
                                    className="transition-colors hover:bg-[var(--hover)]/60"
                                  >
                                    <td className="whitespace-nowrap px-4 py-3.5 align-top text-[var(--muted)]">
                                      {timestamp(log.timestamp)}
                                    </td>
                                    <td className="px-4 py-3.5 align-top">
                                      <span className="flex items-center gap-2.5">
                                        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--primary)]/10 text-[11px] font-bold uppercase text-[var(--primary)]">
                                          {username.slice(0, 2)}
                                        </span>
                                        <span className="font-semibold text-[var(--text)]">
                                          {username}
                                        </span>
                                      </span>
                                    </td>
                                    <td className="px-4 py-3.5 align-top">
                                      <span className="inline-flex rounded-full bg-[var(--primary)]/10 px-2.5 py-1 text-xs font-semibold text-[var(--primary)]">
                                        {log.action}
                                      </span>
                                    </td>
                                    <td className="max-w-56 px-4 py-3.5 align-top">
                                      <span className="block truncate font-mono text-xs text-[var(--muted)]">
                                        {firstChange
                                          ? displayValue(firstChange[1].old)
                                          : "—"}
                                      </span>
                                    </td>
                                    <td className="max-w-56 px-4 py-3.5 align-top">
                                      <span className="block truncate font-mono text-xs font-medium text-[var(--text)]">
                                        {firstChange
                                          ? displayValue(firstChange[1].new)
                                          : "—"}
                                      </span>
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      </div>
                      </>
                    )}
                  </SectionCard>
                </section>
              )}
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}

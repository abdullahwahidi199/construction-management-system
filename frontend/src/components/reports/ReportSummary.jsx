import { useLanguage } from "../../hooks/useLanguage";
import {
  formatLabel,
  formatValue,
  translateOrFallback,
  translateReportKey,
} from "./reportUtils";

const TONE_STYLES = {
  contract: {
    key: "contract",
    accent: "var(--success)",
    bg: "bg-success/10",
    text: "text-success",
    chip: "Contract",
    description: "Contract value or payment metric",
  },
  payroll: {
    key: "payroll",
    accent: "var(--primary)",
    bg: "bg-[color:color-mix(in_srgb,var(--primary)_12%,transparent)]",
    text: "text-[var(--primary)]",
    chip: "Payroll",
    description: "Employee and daily worker payroll metric",
  },
  outflow: {
    key: "outflow",
    accent: "var(--danger)",
    bg: "bg-danger/10",
    text: "text-danger",
    chip: "Outflow",
    description: "Expense or cash outflow metric",
  },
  balance: {
    key: "balance",
    accent: "var(--primary)",
    bg: "bg-[color:color-mix(in_srgb,var(--primary)_12%,transparent)]",
    text: "text-[var(--primary)]",
    chip: "Balance",
    description: "Remaining balance or net position",
  },
  warning: {
    key: "warning",
    accent: "var(--warning)",
    bg: "bg-warning/10",
    text: "text-warning",
    chip: "Attention",
    description: "Needs management attention",
  },
  neutral: {
    key: "neutral",
    accent: "var(--muted)",
    bg: "bg-hover",
    text: "text-muted",
    chip: "Metric",
    description: "Current report view",
  },
};

const includesAny = (value, words) => words.some((word) => value.includes(word));

const getMetricTone = (key) => {
  const normalized = key.toLowerCase();

  if (
    includesAny(normalized, [
      "pending",
      "overdue",
      "unpaid",
      "warning",
      "on_hold",
      "hold",
      "leave",
      "absent",
    ])
  ) {
    return TONE_STYLES.warning;
  }

  if (
    includesAny(normalized, [
      "expense",
      "expenses",
      "cost",
      "spent",
      "outflow",
      "payroll",
      "salary",
      "wage",
      "gross_pay",
      "net_pay",
      "total_gross",
      "total_net",
      "amount_paid",
      "balance_due",
      "deduction",
      "tax",
      "cash_outflow",
      "advance",
    ])
  ) {
    return includesAny(normalized, [
      "payroll",
      "salary",
      "wage",
      "gross_pay",
      "net_pay",
      "total_gross",
      "total_net",
      "amount_paid",
      "balance_due",
    ])
      ? TONE_STYLES.payroll
      : TONE_STYLES.outflow;
  }

  if (
    includesAny(normalized, [
      "remaining",
      "balance",
      "net_position",
      "budget_remaining",
    ])
  ) {
    return TONE_STYLES.balance;
  }

  if (
    includesAny(normalized, [
      "contract",
      "contract_value",
      "invoice",
      "received",
      "paid",
      "payment",
    ])
  ) {
    return TONE_STYLES.contract;
  }

  return TONE_STYLES.neutral;
};

const getMetricDescription = (key, value, tone) => {
  const normalized = key.toLowerCase();

  if (typeof value === "boolean") return "Yes or no status";
  if (typeof value === "string" && Number.isNaN(Number(value))) {
    return "Current report status";
  }
  if (includesAny(normalized, ["count", "records", "total_projects", "total_"])) {
    return "Total in the selected view";
  }
  if (includesAny(normalized, ["usd", "afn", "currency", "amount", "value"])) {
    return tone.description;
  }

  return tone.description;
};

export default function ReportSummary({ summary }) {
  const { t } = useLanguage();
  if (!summary) return null;

  const scalarEntries = Object.entries(summary).filter(
    ([, v]) => typeof v !== "object" || v === null,
  );

  if (scalarEntries.length === 0) return null;

  return (
    <section className="grid gap-3 sm:gap-4 grid-cols-[repeat(auto-fit,minmax(min(100%,220px),1fr))]">
      {scalarEntries.map(([key, value]) => {
        const tone = getMetricTone(key);
        const title = translateReportKey(t, "metrics", key, formatLabel(key));
        const description = translateOrFallback(
          t,
          `reports.metricDescriptions.${tone.key}`,
          getMetricDescription(key, value, tone),
        );
        const chip = translateOrFallback(
          t,
          `reports.metricTones.${tone.key}`,
          tone.chip,
        );

        return (
          <div
            key={key}
            className="group min-w-0 overflow-hidden rounded-md border border-[color:color-mix(in_srgb,var(--border)_72%,transparent)] bg-card px-4 py-4 transition-colors hover:border-[color:color-mix(in_srgb,var(--primary)_28%,var(--border))]"
          >
            <div className="flex items-start justify-between gap-3">
              <p className="min-w-0 text-[11px] font-semibold uppercase leading-5 tracking-wide text-muted">
                {title}
              </p>
              <span
                className={`inline-flex shrink-0 items-center rounded-full px-2 py-0.5 text-[11px] font-semibold ${tone.bg} ${tone.text}`}
              >
                {chip}
              </span>
            </div>
            <p className="mt-3 break-words text-2xl font-semibold leading-tight text-text sm:text-[1.65rem]">
              {formatValue(value)}
            </p>
            <div className="mt-3 flex items-center gap-2">
              <span
                className="h-1.5 w-1.5 shrink-0 rounded-full"
                style={{ background: tone.accent }}
                aria-hidden="true"
              />
              <p className="min-w-0 truncate text-xs text-muted">
                {description}
              </p>
            </div>
          </div>
        );
      })}
    </section>
  );
}

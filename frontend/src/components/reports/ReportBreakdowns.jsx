import { useLanguage } from "../../hooks/useLanguage";
import {
  formatLabel,
  formatValue,
  toNumber,
  translateOrFallback,
  translateReportKey,
} from "./reportUtils";

const RESERVED_KEYS = new Set([
  "rows",
  "preview",
  "summary",
  "generated_at",
  "report_name",
  "filters",
]);

const getBreakdownLists = (data) => {
  if (!data) return [];

  const topLevel = Object.entries(data).filter(
    ([key, value]) =>
      !RESERVED_KEYS.has(key) && Array.isArray(value) && value.length > 0,
  );

  const summaryLists = Object.entries(data.summary || {}).filter(
    ([, value]) => Array.isArray(value) && value.length > 0,
  );

  const seen = new Set();
  return [...topLevel, ...summaryLists].filter(([key]) => {
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
};

const getPrimaryNumber = (item) => {
  const preferred = [
    "total_usd",
    "total_afn",
    "total_value",
    "total_contract_value",
    "total_paid",
    "total_net",
    "total_gross",
    "total_salary",
    "count",
    "present",
    "total_overtime",
  ];

  for (const key of preferred) {
    if (item[key] !== undefined && item[key] !== null) return toNumber(item[key]);
  }

  const firstNumber = Object.values(item).find(
    (value) => typeof value === "number" || !Number.isNaN(Number(value)),
  );
  return toNumber(firstNumber);
};

const getItemTitle = (item, t) => {
  const candidates = [
    "expense_type",
    "status",
    "currency",
    "department",
    "month",
    "employee__first_name",
    "name",
  ];

  if (item.employee__first_name || item.employee__last_name) {
    return `${item.employee__first_name || ""} ${
      item.employee__last_name || ""
    }`.trim();
  }

  for (const key of candidates) {
    if (item[key]) {
      return translateReportKey(t, "values", item[key], formatLabel(item[key]));
    }
  }

  return translateOrFallback(t, "reports.record", "Record");
};

export default function ReportBreakdowns({ data }) {
  const { t } = useLanguage();
  const lists = getBreakdownLists(data);

  if (lists.length === 0) return null;

  return (
    <section className="grid gap-5 xl:grid-cols-2">
      {lists.map(([name, arr]) => {
        const values = arr.map(getPrimaryNumber);
        const max = Math.max(...values, 1);

        return (
          <div
            key={name}
            className="overflow-hidden rounded-lg bg-card shadow-sm shadow-black/5"
          >
            <div className="px-5 py-4">
              <h3 className="text-sm font-semibold text-text">
                {translateReportKey(t, "breakdowns", name, formatLabel(name))}
              </h3>
              <p className="mt-1 text-xs text-muted">
                {translateOrFallback(
                  t,
                  "reports.groupedRecords",
                  "{{count}} grouped records",
                  { count: formatValue(arr.length) },
                )}
              </p>
            </div>

            <div className="divide-y divide-[color:color-mix(in_srgb,var(--border)_55%,transparent)]">
              {arr.slice(0, 6).map((item, index) => {
                const numericValue = getPrimaryNumber(item);
                const detailFields = Object.entries(item)
                  .filter(([, value]) => value !== null && value !== "")
                  .slice(0, 4);

                return (
                  <div key={index} className="px-5 py-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-text truncate">
                          {getItemTitle(item, t)}
                        </p>
                        <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1">
                          {detailFields.map(([key, value]) => (
                            <span key={key} className="text-xs text-muted">
                              {translateReportKey(t, "metrics", key, formatLabel(key))}:{" "}
                              {formatValue(value)}
                            </span>
                          ))}
                        </div>
                      </div>
                      <p className="text-sm font-semibold text-text whitespace-nowrap">
                        {formatValue(numericValue)}
                      </p>
                    </div>

                    <div className="mt-3 h-2 overflow-hidden rounded-full bg-hover">
                      <div
                        className="h-full rounded-full bg-[var(--primary)]"
                        style={{
                          width: `${Math.max((numericValue / max) * 100, 5)}%`,
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </section>
  );
}

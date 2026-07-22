export const EMPTY_VALUE = "-";

export const formatLabel = (key) =>
  String(key || "")
    .replace(/__/g, "_")
    .replace(/_/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());

export const translateOrFallback = (t, key, fallback, params) => {
  const translated = t(key, params);
  return translated === key ? fallback : translated;
};

export const translateReportKey = (t, group, key, fallback) =>
  translateOrFallback(t, `reports.${group}.${key}`, fallback ?? formatLabel(key));

export const toNumber = (value) => {
  if (value === null || value === undefined || value === "") return 0;
  const number = Number(value);
  return Number.isFinite(number) ? number : 0;
};

export const formatValue = (value, options = {}) => {
  if (value === null || value === undefined || value === "") return EMPTY_VALUE;

  if (typeof value === "boolean") return value ? "Yes" : "No";

  if (typeof value === "number" || !Number.isNaN(Number(value))) {
    return Number(value).toLocaleString(undefined, {
      maximumFractionDigits: options.maximumFractionDigits ?? 2,
      minimumFractionDigits: options.minimumFractionDigits ?? 0,
    });
  }

  return String(value);
};

export const formatMoney = (value, currency) => {
  const formatted = formatValue(toNumber(value), {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  return currency ? `${formatted} ${currency}` : formatted;
};

export const humanizeStatus = (value) => formatLabel(value || EMPTY_VALUE);

export const getArrayData = (data, key) => {
  const direct = data?.[key];
  if (Array.isArray(direct)) return direct;

  const nested = data?.summary?.[key];
  if (Array.isArray(nested)) return nested;

  return [];
};

export const getReportRows = (data) => {
  if (Array.isArray(data?.rows)) return data.rows;
  if (Array.isArray(data?.preview)) return data.preview;
  return [];
};

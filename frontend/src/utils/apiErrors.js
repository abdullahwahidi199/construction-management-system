const STATUS_MESSAGES = {
  400: "Please check the highlighted fields and try again.",
  401: "Your session has expired. Please log in again.",
  403: "You don't have permission to perform this action.",
  404: "The requested item could not be found. It may have been moved or deleted.",
  405: "This action is not available here.",
  409: "This record already exists or is already being reviewed. Please refresh and try again.",
  413: "The uploaded file is too large. Please choose a smaller file and try again.",
  422: "Please check the highlighted fields and try again.",
  429: "Too many requests. Please wait a moment and try again.",
  500: "Something went wrong. Please try again in a moment.",
  503: "The service is temporarily unavailable. Please try again in a moment.",
};

const TECHNICAL_PATTERNS = [
  /axioserror/i,
  /traceback/i,
  /integrityerror/i,
  /databaseerror/i,
  /operationalerror/i,
  /serializer/i,
  /sql/i,
  /exception/i,
  /request failed with status code/i,
  /doctype html/i,
];
const ACRONYM_LABELS = {
  afn: "AFN",
  usd: "USD",
  id: "ID",
};

const RESOURCE_LABELS = {
  activities: "activities",
  attendance: "attendance",
  auth: "your account",
  contracts: "contracts",
  "contract-documents": "contract documents",
  "contract-invoices": "contract invoices",
  "contract-payments": "contract payments",
  "contract-variations": "contract variations",
  dashboard: "the dashboard",
  employees: "employees",
  expenses: "expenses",
  payroll: "payroll",
  payrolls: "payroll",
  permissions: "permissions",
  projects: "projects",
  reports: "reports",
  roles: "roles",
  settings: "settings",
  subcontractors: "subcontractors",
  users: "users",
  "user-permissions": "user permissions",
  "role-permissions": "role permissions",
};

const IGNORED_PATH_SEGMENTS = new Set(["api", "v1", "v2", "auth"]);
const ACTION_PATH_SEGMENTS = new Set([
  "approve",
  "approved",
  "approval",
  "approvals",
  "bulk",
  "cancel",
  "delete",
  "download",
  "export",
  "export-csv",
  "export-excel",
  "export-pdf",
  "financial_summary",
  "reject",
  "rejected",
  "upload",
]);

function isPlainObject(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function isTechnicalMessage(value = "") {
  return TECHNICAL_PATTERNS.some((pattern) => pattern.test(String(value)));
}

function friendlyTechnicalMessage(value = "") {
  const text = String(value);
  const lowered = text.toLowerCase();
  if (lowered.includes("unique") || lowered.includes("duplicate")) {
    return "This record already exists. Please review the existing record before trying again.";
  }
  if (lowered.includes("file") && (lowered.includes("large") || lowered.includes("size"))) {
    return "The uploaded file is too large. Please choose a smaller file and try again.";
  }
  if (lowered.includes("unsupported") && lowered.includes("file")) {
    return "This file type is not supported. Please upload one of the accepted file formats.";
  }
  return "";
}

function fieldLabel(key = "") {
  if (key === "non_field_errors") return "Error";
  return key
    .replaceAll("_", " ")
    .split(" ")
    .map((part) => ACRONYM_LABELS[part.toLowerCase()] || part.replace(/\b\w/g, (char) => char.toUpperCase()))
    .join(" ");
}

function getRequestConfig(error) {
  return error?.config || error?.response?.config || {};
}

function getRequestPath(config = {}) {
  const url = config.url || "";
  if (!url || typeof url !== "string") return "";

  try {
    return new URL(url, "http://app.local").pathname;
  } catch {
    return String(url).split("?")[0] || "";
  }
}

function getRequestSegments(config = {}) {
  return getRequestPath(config)
    .split("/")
    .map((segment) => segment.trim().toLowerCase())
    .filter(Boolean);
}

function humanizeResource(segment = "") {
  const normalized = String(segment).trim().toLowerCase();
  if (!normalized) return "";
  return RESOURCE_LABELS[normalized] || normalized.replaceAll("-", " ").replaceAll("_", " ");
}

function getPermissionResource(config = {}) {
  if (config.permissionResourceLabel) return config.permissionResourceLabel;
  if (config.permissionResource) return humanizeResource(config.permissionResource);

  const segments = getRequestSegments(config);
  const resourceSegment = segments.find(
    (segment) =>
      !IGNORED_PATH_SEGMENTS.has(segment) &&
      !ACTION_PATH_SEGMENTS.has(segment) &&
      !/^\d+$/.test(segment),
  );

  return humanizeResource(resourceSegment);
}

function getPermissionAction(config = {}) {
  if (config.permissionAction) return config.permissionAction;

  const method = String(config.method || "get").toLowerCase();
  const segments = getRequestSegments(config);

  if (config.responseType === "blob" || segments.some((segment) => segment.startsWith("export"))) {
    return "export";
  }
  if (segments.some((segment) => segment.includes("approve"))) return "approve";
  if (segments.some((segment) => segment.includes("reject"))) return "reject";
  if (segments.some((segment) => segment.includes("download"))) return "download";
  if (segments.some((segment) => segment.includes("upload"))) return "upload";

  if (method === "post") return "create";
  if (method === "put" || method === "patch") return "update";
  if (method === "delete") return "delete";
  if (method === "get") return "view";

  return "";
}

function getPermissionDeniedMessage(error) {
  const config = getRequestConfig(error);
  const action = getPermissionAction(config);
  const resource = getPermissionResource(config);

  if (action && resource) {
    return `You don't have permission to ${action} ${resource}.`;
  }
  if (resource) {
    return `You don't have permission to access ${resource}.`;
  }

  return STATUS_MESSAGES[403];
}

function pushReadable(messages, label, value) {
  if (value === null || value === undefined || value === "") return;

  if (Array.isArray(value)) {
    value.forEach((item) => pushReadable(messages, label, item));
    return;
  }

  if (isPlainObject(value)) {
    Object.entries(value).forEach(([key, item]) => {
      pushReadable(messages, fieldLabel(key), item);
    });
    return;
  }

  const text = String(value).trim();
  if (!text) return;
  if (isTechnicalMessage(text)) {
    const replacement = friendlyTechnicalMessage(text);
    if (replacement) messages.push(label ? `${label}: ${replacement}` : replacement);
    return;
  }
  messages.push(label ? `${label}: ${text}` : text);
}

function retryAfterSeconds(error) {
  const value =
    error?.response?.data?.retry_after ||
    error?.response?.headers?.["retry-after"] ||
    error?.response?.headers?.["Retry-After"];
  const seconds = Number(value);
  return Number.isFinite(seconds) && seconds > 0 ? seconds : 0;
}

export function formatRetryAfterMessage(seconds) {
  const minutes = Math.max(1, Math.ceil(Number(seconds || 0) / 60));
  return `Too many login attempts. Please wait ${minutes} minute${minutes === 1 ? "" : "s"} before trying again.`;
}

export function extractValidationMessages(data) {
  const messages = [];

  if (typeof data === "string") {
    pushReadable(messages, "", data);
  } else if (Array.isArray(data)) {
    data.forEach((item) => pushReadable(messages, "", item));
  } else if (isPlainObject(data)) {
    Object.entries(data).forEach(([key, value]) => {
      if (key === "detail" || key === "message" || key === "error") {
        pushReadable(messages, "", value);
      } else if (key === "errors" && isPlainObject(value)) {
        Object.entries(value).forEach(([field, item]) => {
          pushReadable(messages, fieldLabel(field), item);
        });
      } else {
        pushReadable(messages, fieldLabel(key), value);
      }
    });
  }

  return [...new Set(messages)].slice(0, 4);
}

export function getFriendlyErrorMessage(error, fallback = "Unable to complete the request.") {
  if (typeof error === "string") {
    return isTechnicalMessage(error) ? fallback : error;
  }

  if (error?.code === "ECONNABORTED") {
    return "The request timed out. Please check your connection and try again.";
  }

  if (error?.isOffline || (typeof navigator !== "undefined" && !navigator.onLine)) {
    return "Network connection lost. Please check your internet connection and try again.";
  }

  if (error?.message === "Network Error" || !error?.response) {
    return "Network connection lost. Please check your internet connection and try again.";
  }

  const status = error.response?.status;
  if (status >= 500) return STATUS_MESSAGES[status] || STATUS_MESSAGES[500];
  if (status === 429) {
    const retryAfter = retryAfterSeconds(error);
    if (retryAfter) return formatRetryAfterMessage(retryAfter);
    const messages = extractValidationMessages(error.response?.data);
    return messages[0] || STATUS_MESSAGES[429];
  }
  if (status === 403) {
    return getPermissionDeniedMessage(error);
  }
  if ([409, 413].includes(status)) {
    const messages = extractValidationMessages(error.response?.data);
    return messages[0] || STATUS_MESSAGES[status];
  }
  if (STATUS_MESSAGES[status] && ![400, 422].includes(status)) {
    return STATUS_MESSAGES[status];
  }

  const validationMessages = extractValidationMessages(error.response?.data);
  if (validationMessages.length > 0) {
    return validationMessages.join(" ");
  }

  return STATUS_MESSAGES[status] || fallback;
}

export function getFieldErrors(error) {
  const data = error?.response?.data;
  const source = isPlainObject(data?.errors) ? data.errors : data;

  if (!isPlainObject(source)) return {};

  return Object.entries(source).reduce((acc, [key, value]) => {
    const messages = [];
    pushReadable(messages, "", value);
    if (messages.length > 0) acc[key] = messages.join(" ");
    return acc;
  }, {});
}

export function attachFriendlyError(error) {
  const friendlyMessage = getFriendlyErrorMessage(error);
  error.userMessage = friendlyMessage;
  error.validationErrors = getFieldErrors(error);
  return error;
}


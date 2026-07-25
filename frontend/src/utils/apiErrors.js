const STATUS_MESSAGES = {
  400: "Please check the highlighted fields and try again.",
  401: "Your session has expired. Please log in again.",
  403: "You don't have permission to perform this action.",
  404: "The requested item could not be found.",
  405: "This action is not available.",
  409: "This record was changed by someone else. Please refresh and try again.",
  422: "Please check the highlighted fields and try again.",
  429: "Too many requests. Please wait a moment and try again.",
  500: "Something went wrong. Please try again later.",
  503: "The service is temporarily unavailable. Please try again later.",
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

function isPlainObject(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function isTechnicalMessage(value = "") {
  return TECHNICAL_PATTERNS.some((pattern) => pattern.test(String(value)));
}

function fieldLabel(key = "") {
  if (key === "non_field_errors") return "Error";
  return key
    .replaceAll("_", " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
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
  if (!text || isTechnicalMessage(text)) return;
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
    return "The request timed out. Please try again.";
  }

  if (error?.isOffline || (typeof navigator !== "undefined" && !navigator.onLine)) {
    return "Network connection lost.";
  }

  if (error?.message === "Network Error" || !error?.response) {
    return "Network connection lost.";
  }

  const status = error.response?.status;
  if (status >= 500) return STATUS_MESSAGES[status] || STATUS_MESSAGES[500];
  if (status === 429) {
    const retryAfter = retryAfterSeconds(error);
    if (retryAfter) return formatRetryAfterMessage(retryAfter);
    const messages = extractValidationMessages(error.response?.data);
    return messages[0] || STATUS_MESSAGES[429];
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


import axios from "axios";
import toast from "react-hot-toast";
import { attachFriendlyError, getFriendlyErrorMessage } from "../utils/apiErrors";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000/api/";
const SESSION_EXPIRED_EVENT = "cms:session-expired";
const SESSION_NOTICE_KEY = "cms.auth.notice";
let lastToast = { message: "", at: 0 };

function withTrailingSlash(value) {
  return value.endsWith("/") ? value : `${value}/`;
}

function shouldSkipGlobalToast(config = {}) {
  return Boolean(config.skipGlobalErrorToast || config.silent);
}

function isLoginRequest(config = {}) {
  return String(config.url || "").includes("auth/login");
}

function showErrorToast(message, options = {}) {
  const now = Date.now();
  if (lastToast.message === message && now - lastToast.at < 1800) return;
  lastToast = { message, at: now };
  toast.error(message, options);
}

const instance = axios.create({
  baseURL: withTrailingSlash(API_BASE_URL),
  timeout: 20000,
});

export const setAuthToken = (token) => {
  if (token) {
    instance.defaults.headers.common.Authorization = `Token ${token}`;
  } else {
    delete instance.defaults.headers.common.Authorization;
  }
};

const storedToken = localStorage.getItem("cms.auth.token");
if (storedToken) {
  setAuthToken(storedToken);
}

instance.interceptors.request.use((config) => {
  if (typeof navigator !== "undefined" && !navigator.onLine) {
    const offlineError = new Error("Network connection lost.");
    offlineError.isOffline = true;
    offlineError.config = config;
    return Promise.reject(attachFriendlyError(offlineError));
  }
  return config;
});

instance.interceptors.response.use(
  (response) => response,
  (error) => {
    const normalized = attachFriendlyError(error);
    const status = normalized.response?.status;
    const message = getFriendlyErrorMessage(normalized);

    if (status === 401 && !isLoginRequest(normalized.config)) {
      localStorage.setItem(
        SESSION_NOTICE_KEY,
        "Your session has expired. Please log in again.",
      );
      window.dispatchEvent(new CustomEvent(SESSION_EXPIRED_EVENT));
      showErrorToast("Your session has expired. Please log in again.", {
        id: "session-expired",
      });
    } else if (!shouldSkipGlobalToast(normalized.config)) {
      showErrorToast(message);
    }

    return Promise.reject(normalized);
  },
);

export default instance;
export { SESSION_EXPIRED_EVENT, SESSION_NOTICE_KEY };

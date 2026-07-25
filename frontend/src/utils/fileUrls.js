import instance from "../api/axiosInstance";

function isLoopbackOrigin(origin) {
  try {
    const { hostname } = new URL(origin);
    return ["localhost", "127.0.0.1", "0.0.0.0"].includes(hostname);
  } catch {
    return false;
  }
}

function getApiOrigin() {
  const fallbackOrigin =
    typeof window !== "undefined" ? window.location.origin : "";

  try {
    const origin = new URL(instance.defaults.baseURL || "/", fallbackOrigin)
      .origin;
    if (
      fallbackOrigin &&
      isLoopbackOrigin(origin) &&
      !isLoopbackOrigin(fallbackOrigin)
    ) {
      return fallbackOrigin;
    }
    return origin;
  } catch {
    return fallbackOrigin;
  }
}

function getMediaBaseUrl() {
  const value = import.meta.env.VITE_MEDIA_BASE_URL;
  return value ? value.replace(/\/+$/, "") : "";
}

export function resolveFileUrl(file) {
  if (!file) return "";
  const rawFile = String(file).trim();
  if (/^https?:\/\//i.test(rawFile)) return rawFile;

  if (rawFile.startsWith("//")) {
    const protocol =
      typeof window !== "undefined" ? window.location.protocol : "https:";
    return `${protocol}${rawFile}`;
  }

  const mediaBaseUrl = getMediaBaseUrl();
  if (mediaBaseUrl) {
    const relativePath = rawFile.replace(/^\/+/, "").replace(/^media\/?/, "");
    return `${mediaBaseUrl}/${relativePath}`;
  }

  const path = rawFile.startsWith("/") ? rawFile : `/${rawFile}`;
  return `${getApiOrigin()}${path}`;
}

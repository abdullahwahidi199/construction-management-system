import { useCallback, useEffect, useMemo, useState } from "react";
import instance from "../api/axiosInstance";
import {
  defaultCalendarSettings,
  formatByModule as formatByModuleValue,
  formatDate as formatDateValue,
  formatDateTime as formatDateTimeValue,
  getModuleCalendar as getModuleCalendarValue,
  normalizeCalendarSettings,
  parseDate as parseDateValue,
} from "../utils/calendar";

const STORAGE_KEY = "cms.calendar.settings";

export function useCalendar(module = "dashboard") {
  const [settings, setSettings] = useState(() => {
    try {
      return normalizeCalendarSettings(JSON.parse(localStorage.getItem(STORAGE_KEY)));
    } catch {
      return defaultCalendarSettings;
    }
  });

  useEffect(() => {
    let cancelled = false;
    instance
      .get("auth/settings/calendar/")
      .then((res) => {
        if (cancelled) return;
        const normalized = normalizeCalendarSettings(res.data);
        setSettings(normalized);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(normalized));
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  const calendar = useMemo(() => getModuleCalendarValue(module, settings), [module, settings]);
  const getModuleCalendar = useCallback((moduleName) => getModuleCalendarValue(moduleName, settings), [settings]);
  const formatDate = useCallback((value) => formatDateValue(value, calendar), [calendar]);
  const formatDateTime = useCallback((value) => formatDateTimeValue(value, calendar), [calendar]);
  const formatByModule = useCallback((value, moduleName) => formatByModuleValue(value, moduleName, settings), [settings]);
  const parseDate = useCallback((value) => parseDateValue(value, calendar), [calendar]);

  return { calendar, settings, setSettings, getModuleCalendar, formatDate, formatDateTime, formatByModule, parseDate };
}

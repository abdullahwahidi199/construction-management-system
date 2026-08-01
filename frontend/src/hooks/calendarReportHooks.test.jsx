import React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { act, renderHook, waitFor } from "@testing-library/react";

const api = vi.hoisted(() => ({
  get: vi.fn(),
}));

vi.mock("../api/axiosInstance", () => ({
  default: api,
}));

import { CALENDAR_TYPES } from "../utils/calendar";
import { useCalendar } from "./useCalendar";
import useReport from "./useReport";

describe("calendar and report hooks", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it("useCalendar loads remote settings, caches them, and formats by module", async () => {
    api.get.mockResolvedValueOnce({
      data: {
        default_calendar: CALENDAR_TYPES.GREGORIAN,
        modules: { payroll: CALENDAR_TYPES.SHAMSI },
      },
    });

    const { result } = renderHook(() => useCalendar("payroll"));

    await waitFor(() => expect(localStorage.getItem("cms.calendar.settings")).toContain("payroll"));
    expect(result.current.calendar).toBe(CALENDAR_TYPES.SHAMSI);
    expect(result.current.formatDate("2026-03-21")).toBe("1405-01-01");
    expect(result.current.formatDateTime("2026-03-21T10:15:00Z")).toBe("1405-01-01 10:15");
    expect(result.current.formatByModule("2026-03-21", "projects")).toBe("2026-03-21");
    expect(result.current.parseDate("1405-01-01")).toBe("2026-03-21");
  });

  it("useCalendar tolerates failed settings fetches and accepts manual settings", async () => {
    api.get.mockRejectedValueOnce(new Error("offline"));
    const { result } = renderHook(() => useCalendar("projects"));

    await waitFor(() =>
      expect(api.get).toHaveBeenCalledWith("auth/settings/calendar/", {
        skipGlobalErrorToast: true,
      }),
    );
    expect(result.current.calendar).toBe(CALENDAR_TYPES.SHAMSI);

    act(() => {
      result.current.setSettings({
        default_calendar: CALENDAR_TYPES.GREGORIAN,
        modules: { projects: CALENDAR_TYPES.INHERIT },
      });
    });
    expect(result.current.calendar).toBe(CALENDAR_TYPES.GREGORIAN);
  });

  it("useReport filters empty params and stores loaded data", async () => {
    api.get.mockResolvedValueOnce({ data: { summary: { total: 2 } } });
    const { result } = renderHook(() => useReport("reports/projects/"));

    await act(async () => {
      await result.current.fetchReport({ status: "ongoing", empty: "", unset: undefined });
    });

    expect(api.get).toHaveBeenCalledWith("reports/projects/", {
      params: { status: "ongoing" },
      skipGlobalErrorToast: true,
    });
    expect(result.current.data).toEqual({ summary: { total: 2 } });
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it("useReport handles load errors and exports PDF blobs", async () => {
    const click = vi.fn();
    const appendChild = vi.spyOn(document.body, "appendChild");
    const createObjectURL = vi.fn(() => "blob:report");
    const revokeObjectURL = vi.fn();
    const originalCreate = document.createElement.bind(document);
    vi.stubGlobal("URL", { createObjectURL, revokeObjectURL });
    vi.spyOn(document, "createElement").mockImplementation((tagName) => {
      const element = originalCreate(tagName);
      if (tagName === "a") {
        element.click = click;
      }
      return element;
    });

    api.get
      .mockRejectedValueOnce({ response: { status: 500 } })
      .mockResolvedValueOnce({ data: "pdf-bytes" });

    const { result } = renderHook(() => useReport("reports/expenses/"));

    await act(async () => {
      await result.current.fetchReport({ status: "approved" });
    });
    expect(result.current.error).toBe("Something went wrong. Please try again in a moment.");
    expect(result.current.data).toBeNull();

    await act(async () => {
      await result.current.exportPdf({ start_date: "2026-01-01", blank: null }, "expenses.pdf");
    });

    expect(api.get).toHaveBeenLastCalledWith("reports/expenses/", {
      params: { start_date: "2026-01-01", export: "pdf" },
      responseType: "blob",
    });
    expect(createObjectURL).toHaveBeenCalledOnce();
    expect(appendChild).toHaveBeenCalled();
    expect(click).toHaveBeenCalledOnce();
    expect(revokeObjectURL).toHaveBeenCalledWith("blob:report");
    vi.unstubAllGlobals();
  });
});

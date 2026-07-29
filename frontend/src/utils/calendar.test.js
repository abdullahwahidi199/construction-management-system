import { describe, expect, it, vi } from "vitest";

import {
  CALENDAR_TYPES,
  currentMonthKey,
  defaultCalendarSettings,
  formatByModule,
  formatDate,
  formatDateTime,
  formatMonthKey,
  getModuleCalendar,
  isShamsiLeapYear,
  monthBoundsFromKey,
  monthKeyFromDate,
  normalizeCalendarSettings,
  normalizeDateInput,
  normalizeDigits,
  parseDate,
  shamsiMonthLength,
  todayIso,
  toGregorian,
  toShamsi,
} from "./calendar";

describe("calendar utilities", () => {
  it("normalizes settings and resolves inherited module calendars", () => {
    const settings = normalizeCalendarSettings({
      default_calendar: CALENDAR_TYPES.GREGORIAN,
      modules: {
        payroll: CALENDAR_TYPES.SHAMSI,
        expenses: "bad-value",
        custom: CALENDAR_TYPES.GREGORIAN,
      },
    });

    expect(settings.default_calendar).toBe(CALENDAR_TYPES.GREGORIAN);
    expect(settings.modules.payroll).toBe(CALENDAR_TYPES.SHAMSI);
    expect(settings.modules.expenses).toBe(CALENDAR_TYPES.INHERIT);
    expect(settings.modules.custom).toBe(CALENDAR_TYPES.GREGORIAN);
    expect(getModuleCalendar("projects", settings)).toBe(CALENDAR_TYPES.GREGORIAN);
    expect(getModuleCalendar("payroll", settings)).toBe(CALENDAR_TYPES.SHAMSI);
  });

  it("falls back to safe defaults for malformed settings", () => {
    expect(normalizeCalendarSettings(null)).toEqual(defaultCalendarSettings);
    expect(normalizeCalendarSettings({ default_calendar: "lunar" }).default_calendar).toBe(
      CALENDAR_TYPES.SHAMSI,
    );
  });

  it("converts and validates gregorian and shamsi dates", () => {
    expect(toShamsi("2026-03-21")).toEqual({ year: 1405, month: 1, day: 1 });
    expect(toGregorian("1405-01-01")).toBe("2026-03-21");
    expect(toGregorian("1404-12-30")).toBe("");
    expect(parseDate("2026/02/28")).toBe("2026-02-28");
    expect(parseDate("2026-02-31")).toBe("");
    expect(normalizeDateInput("1405/01/01", CALENDAR_TYPES.SHAMSI)).toBe("2026-03-21");
  });

  it("formats dates, datetimes, module-specific values, and non-latin digits", () => {
    expect(normalizeDigits("۱۲۳٤٥")).toBe("12345");
    expect(formatDate("2026-03-21", CALENDAR_TYPES.SHAMSI)).toBe("1405-01-01");
    expect(formatDate("1405-01-01", CALENDAR_TYPES.SHAMSI)).toBe("1405-01-01");
    expect(formatDateTime("2026-03-21T14:45:30Z", CALENDAR_TYPES.SHAMSI)).toBe(
      "1405-01-01 14:45",
    );
    expect(
      formatByModule(
        "2026-03-21",
        "reports",
        normalizeCalendarSettings({ default_calendar: CALENDAR_TYPES.GREGORIAN }),
      ),
    ).toBe("2026-03-21");
  });

  it("computes shamsi month lengths and today in ISO format", () => {
    expect(isShamsiLeapYear(1403)).toBe(true);
    expect(shamsiMonthLength(1405, 1)).toBe(31);
    expect(shamsiMonthLength(1405, 7)).toBe(30);
    expect(shamsiMonthLength(1405, 13)).toBe(0);

    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-07-25T08:00:00Z"));
    expect(todayIso()).toBe("2026-07-25");
    vi.useRealTimers();
  });

  it("derives month keys and bounds for Gregorian payroll months", () => {
    expect(monthKeyFromDate("2026-07-15", CALENDAR_TYPES.GREGORIAN)).toBe("2026-07");
    expect(formatMonthKey("2026-07", CALENDAR_TYPES.GREGORIAN)).toBe("July 2026");
    expect(monthBoundsFromKey("2026-07", CALENDAR_TYPES.GREGORIAN)).toEqual({
      start: "2026-07-01",
      end: "2026-07-31",
    });
    expect(monthBoundsFromKey("2026-02", CALENDAR_TYPES.GREGORIAN)).toEqual({
      start: "2026-02-01",
      end: "2026-02-28",
    });
  });

  it("derives month keys and bounds for Shamsi payroll months", () => {
    expect(monthKeyFromDate("2026-03-21", CALENDAR_TYPES.SHAMSI)).toBe("1405-01");
    expect(monthKeyFromDate("1405-01-01", CALENDAR_TYPES.SHAMSI)).toBe("1405-01");
    expect(formatMonthKey("1405-01", CALENDAR_TYPES.SHAMSI)).toBe("Hamal 1405");
    expect(monthBoundsFromKey("1405-01", CALENDAR_TYPES.SHAMSI)).toEqual({
      start: "2026-03-21",
      end: "2026-04-20",
    });
  });

  it("defaults the current month using the requested calendar", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-07-25T08:00:00Z"));
    expect(currentMonthKey(CALENDAR_TYPES.GREGORIAN)).toBe("2026-07");
    expect(currentMonthKey(CALENDAR_TYPES.SHAMSI)).toBe("1405-05");
    vi.useRealTimers();
  });
});

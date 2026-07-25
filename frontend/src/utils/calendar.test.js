import { describe, expect, it, vi } from "vitest";

import {
  CALENDAR_TYPES,
  defaultCalendarSettings,
  formatByModule,
  formatDate,
  formatDateTime,
  getModuleCalendar,
  isShamsiLeapYear,
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
});

export const CALENDAR_TYPES = {
  SHAMSI: "shamsi",
  GREGORIAN: "gregorian",
  INHERIT: "inherit",
};

export const CALENDAR_MODULES = [
  "dashboard",
  "projects",
  "contracts",
  "employees",
  "payroll",
  "attendance",
  "expenses",
  "daily_workers",
  "invoices",
  "payments",
  "reports",
  "notifications",
  "documents",
  "subcontractors",
  "worker_advances",
  "daily_worker_attendance",
  "daily_worker_payroll",
  "contract_payments",
  "contract_variations",
];

export const WORK_CALENDAR_WEEKDAYS = [
  { value: 0, label: "Monday", shortLabel: "Mon" },
  { value: 1, label: "Tuesday", shortLabel: "Tue" },
  { value: 2, label: "Wednesday", shortLabel: "Wed" },
  { value: 3, label: "Thursday", shortLabel: "Thu" },
  { value: 4, label: "Friday", shortLabel: "Fri" },
  { value: 5, label: "Saturday", shortLabel: "Sat" },
  { value: 6, label: "Sunday", shortLabel: "Sun" },
];

export const AFGHAN_MONTH_NAMES = {
  "fa-AF": [
    "حمل",
    "ثور",
    "جوزا",
    "سرطان",
    "اسد",
    "سنبله",
    "میزان",
    "عقرب",
    "قوس",
    "جدی",
    "دلو",
    "حوت",
  ],
  "ps-AF": [
    "وری",
    "غویی",
    "غبرګولی",
    "چنګاښ",
    "زمری",
    "وږی",
    "تله",
    "لړم",
    "لیندۍ",
    "مرغومی",
    "سلواغه",
    "کب",
  ],
  en: [
    "Hamal",
    "Sawr",
    "Jawza",
    "Saratan",
    "Asad",
    "Sunbula",
    "Mizan",
    "Aqrab",
    "Qaws",
    "Jadi",
    "Dalwa",
    "Hut",
  ],
};

export const defaultCalendarSettings = {
  default_calendar: CALENDAR_TYPES.SHAMSI,
  modules: Object.fromEntries(
    CALENDAR_MODULES.map((module) => [module, CALENDAR_TYPES.INHERIT]),
  ),
  work_calendar: {
    weekly_off_days: [],
    holidays: [],
    policies: {
      holiday_payment: "paid",
      attendance_on_holidays: "allowed",
    },
  },
};

const VALID_GLOBAL = new Set([CALENDAR_TYPES.SHAMSI, CALENDAR_TYPES.GREGORIAN]);
const VALID_MODULE = new Set([
  CALENDAR_TYPES.SHAMSI,
  CALENDAR_TYPES.GREGORIAN,
  CALENDAR_TYPES.INHERIT,
]);
const VALID_HOLIDAY_PAYMENT_POLICIES = new Set([
  "paid",
  "unpaid",
  "attendance_based",
]);

function boolValue(value, fallback = false) {
  if (typeof value === "boolean") return value;
  if (value == null || value === "") return fallback;
  if (typeof value === "string")
    return ["1", "true", "yes", "on"].includes(value.trim().toLowerCase());
  return Boolean(value);
}

export function normalizeWorkCalendar(value = {}, calendar = CALENDAR_TYPES.GREGORIAN) {
  const incoming = value && typeof value === "object" ? value : {};
  const weeklyOffDays = [
    ...new Set(
      (Array.isArray(incoming.weekly_off_days) ? incoming.weekly_off_days : [])
        .map((day) => Number(day))
        .filter((day) => Number.isInteger(day) && day >= 0 && day <= 6),
    ),
  ].sort((a, b) => a - b);

  const incomingPolicies =
    incoming.policies && typeof incoming.policies === "object"
      ? incoming.policies
      : {};
  const holidayPayment = VALID_HOLIDAY_PAYMENT_POLICIES.has(
    incomingPolicies.holiday_payment,
  )
    ? incomingPolicies.holiday_payment
    : "paid";

  const holidays = (Array.isArray(incoming.holidays) ? incoming.holidays : [])
    .map((item) => {
      if (!item || typeof item !== "object") return null;
      const name = String(item.name || "").trim();
      const startDate = parseDate(item.start_date, calendar);
      const endDate =
        parseDate(item.end_date || item.start_date, calendar) ||
        startDate;
      if (!name || !startDate) return null;
      const paidHoliday = boolValue(item.paid_holiday, true);
      let paymentPolicy = item.payment_policy || holidayPayment;
      if (!VALID_HOLIDAY_PAYMENT_POLICIES.has(paymentPolicy)) {
        paymentPolicy = paidHoliday ? "paid" : "unpaid";
      }
      return {
        id:
          String(item.id || "").trim() ||
          `holiday-${name.toLowerCase().replace(/\s+/g, "-")}-${startDate}`,
        name,
        start_date: startDate,
        end_date: endDate,
        description: String(item.description || "").trim(),
        paid_holiday: paidHoliday,
        active: boolValue(item.active, true),
        payment_policy: paymentPolicy,
      };
    })
    .filter(Boolean)
    .sort((a, b) => a.start_date.localeCompare(b.start_date) || a.name.localeCompare(b.name));

  return {
    weekly_off_days: weeklyOffDays,
    holidays,
    policies: {
      holiday_payment: holidayPayment,
      attendance_on_holidays:
        incomingPolicies.attendance_on_holidays || "allowed",
    },
  };
}

export function normalizeCalendarSettings(value) {
  const incoming = value && typeof value === "object" ? value : {};
  const defaultCalendar = VALID_GLOBAL.has(incoming.default_calendar)
    ? incoming.default_calendar
    : CALENDAR_TYPES.SHAMSI;
  const modules = { ...defaultCalendarSettings.modules };
  const incomingModules =
    incoming.modules && typeof incoming.modules === "object"
      ? incoming.modules
      : {};
  Object.keys(incomingModules).forEach((module) => {
    modules[module] = VALID_MODULE.has(incomingModules[module])
      ? incomingModules[module]
      : CALENDAR_TYPES.INHERIT;
  });
  return {
    default_calendar: defaultCalendar,
    modules,
    work_calendar: normalizeWorkCalendar(incoming.work_calendar, defaultCalendar),
  };
}

export function getModuleCalendar(module, settings = defaultCalendarSettings) {
  const normalized = normalizeCalendarSettings(settings);
  const value = normalized.modules[module] || CALENDAR_TYPES.INHERIT;
  return value === CALENDAR_TYPES.INHERIT ? normalized.default_calendar : value;
}

export function normalizeDigits(value) {
  if (value == null) return "";
  const persian = "۰۱۲۳۴۵۶۷۸۹";
  const arabic = "٠١٢٣٤٥٦٧٨٩";
  return String(value).replace(/[۰-۹٠-٩]/g, (digit) => {
    const p = persian.indexOf(digit);
    if (p >= 0) return String(p);
    return String(arabic.indexOf(digit));
  });
}

function parseYmd(value) {
  if (!value) return null;
  const match = normalizeDigits(value)
    .trim()
    .replace(/\//g, "-")
    .match(/^(-?\d{1,4})-(\d{1,2})-(\d{1,2})/);
  if (!match) return null;
  return {
    year: Number(match[1]),
    month: Number(match[2]),
    day: Number(match[3]),
  };
}

function pad(value) {
  return String(value).padStart(2, "0");
}

function parseMonthKey(value) {
  if (!value) return null;
  const match = normalizeDigits(value)
    .trim()
    .replace(/\//g, "-")
    .match(/^(-?\d{1,4})-(\d{1,2})$/);
  if (!match) return null;
  const year = Number(match[1]);
  const month = Number(match[2]);
  if (!year || month < 1 || month > 12) return null;
  return { year, month };
}

function gregorianToJdn(year, month, day) {
  return (
    Math.floor((1461 * (year + 4800 + Math.floor((month - 14) / 12))) / 4) +
    Math.floor((367 * (month - 2 - 12 * Math.floor((month - 14) / 12))) / 12) -
    Math.floor(
      (3 * Math.floor((year + 4900 + Math.floor((month - 14) / 12)) / 100)) / 4,
    ) +
    day -
    32075
  );
}

function jdnToGregorian(jdn) {
  let l = jdn + 68569;
  const n = Math.floor((4 * l) / 146097);
  l -= Math.floor((146097 * n + 3) / 4);
  const i = Math.floor((4000 * (l + 1)) / 1461001);
  l = l - Math.floor((1461 * i) / 4) + 31;
  const j = Math.floor((80 * l) / 2447);
  const day = l - Math.floor((2447 * j) / 80);
  l = Math.floor(j / 11);
  const month = j + 2 - 12 * l;
  const year = 100 * (n - 49) + i + l;
  return { year, month, day };
}

function jalaliToJdn(year, month, day) {
  const epbase = year >= 0 ? year - 474 : year - 473;
  const epyear = 474 + positiveMod(epbase, 2820);
  return (
    day +
    (month <= 7 ? (month - 1) * 31 : (month - 1) * 30 + 6) +
    Math.floor((epyear * 682 - 110) / 2816) +
    (epyear - 1) * 365 +
    Math.floor(epbase / 2820) * 1029983 +
    1948320
  );
}

function jdnToJalali(jdn) {
  const depoch = jdn - jalaliToJdn(475, 1, 1);
  const cycle = Math.floor(depoch / 1029983);
  const cyear = positiveMod(depoch, 1029983);
  let ycycle;
  if (cyear === 1029982) {
    ycycle = 2820;
  } else {
    const aux1 = Math.floor(cyear / 366);
    const aux2 = cyear % 366;
    ycycle =
      Math.floor((2134 * aux1 + 2816 * aux2 + 2815) / 1028522) + aux1 + 1;
  }
  let year = ycycle + 2820 * cycle + 474;
  if (year <= 0) year -= 1;
  const yday = jdn - jalaliToJdn(year, 1, 1) + 1;
  const month = yday <= 186 ? Math.ceil(yday / 31) : Math.ceil((yday - 6) / 30);
  const day = jdn - jalaliToJdn(year, month, 1) + 1;
  return { year, month, day };
}

function positiveMod(value, divisor) {
  return ((value % divisor) + divisor) % divisor;
}

export function isShamsiLeapYear(year) {
  const lastDay = toShamsi(`${Number(year) + 622}-03-20`);
  return (
    lastDay?.year === Number(year) && lastDay.month === 12 && lastDay.day === 30
  );
}

export function shamsiMonthLength(year, month) {
  if (month < 1 || month > 12) return 0;
  if (month <= 6) return 31;
  if (month <= 11) return 30;
  return isShamsiLeapYear(year) ? 30 : 29;
}

export function toShamsi(value) {
  const parsed = parseYmd(value);
  if (!parsed) return null;
  const date = new Date(Date.UTC(parsed.year, parsed.month - 1, parsed.day));
  if (Number.isNaN(date.getTime())) return null;

  const parts = new Intl.DateTimeFormat("en-US-u-ca-persian", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    timeZone: "UTC",
  }).formatToParts(date);

  const getPart = (type) =>
    Number(parts.find((part) => part.type === type)?.value);
  const year = getPart("year");
  const month = getPart("month");
  const day = getPart("day");
  return year && month && day ? { year, month, day } : null;
}

export function toGregorian(value) {
  const parsed = parseYmd(value);
  if (!parsed) return "";
  if (
    parsed.month < 1 ||
    parsed.month > 12 ||
    parsed.day < 1 ||
    parsed.day > shamsiMonthLength(parsed.year, parsed.month)
  )
    return "";
  const g = jdnToGregorian(jalaliToJdn(parsed.year, parsed.month, parsed.day));
  return `${g.year}-${pad(g.month)}-${pad(g.day)}`;
}

export function parseDate(value, calendar = CALENDAR_TYPES.GREGORIAN) {
  if (!value) return "";
  const parsed = parseYmd(value);
  if (!parsed) return "";
  if (calendar === CALENDAR_TYPES.SHAMSI) {
    if (parsed.year >= 1700) {
      return parseDate(value, CALENDAR_TYPES.GREGORIAN);
    }
    return toGregorian(
      `${parsed.year}-${pad(parsed.month)}-${pad(parsed.day)}`,
    );
  }
  const max = new Date(parsed.year, parsed.month, 0).getDate();
  if (
    parsed.month < 1 ||
    parsed.month > 12 ||
    parsed.day < 1 ||
    parsed.day > max
  )
    return "";
  return `${parsed.year}-${pad(parsed.month)}-${pad(parsed.day)}`;
}

export function normalizeDateInput(value, calendar = CALENDAR_TYPES.GREGORIAN) {
  return parseDate(value, calendar);
}

export function formatDate(
  value,
  calendar = CALENDAR_TYPES.GREGORIAN,
  locale = "en",
) {
  if (!value) return "";
  if (calendar !== CALENDAR_TYPES.SHAMSI)
    return parseDate(value, CALENDAR_TYPES.GREGORIAN) || "";
  const parsed = parseYmd(value);
  if (parsed && parsed.year < 1700) {
    return `${parsed.year}-${pad(parsed.month)}-${pad(parsed.day)}`;
  }
  const shamsi = toShamsi(value);
  return shamsi ? `${shamsi.year}-${pad(shamsi.month)}-${pad(shamsi.day)}` : "";
}

export function formatDateTime(
  value,
  calendar = CALENDAR_TYPES.GREGORIAN,
  locale = "en",
) {
  if (!value) return "";
  const [datePart, timePart = ""] = String(value).replace("T", " ").split(" ");
  const formattedDate = formatDate(datePart, calendar, locale);
  return formattedDate
    ? `${formattedDate}${timePart ? ` ${timePart.slice(0, 5)}` : ""}`
    : "";
}

export function formatByModule(value, module, settings, locale = "en") {
  return formatDate(value, getModuleCalendar(module, settings), locale);
}

export function todayIso() {
  const today = new Date();
  return `${today.getFullYear()}-${pad(today.getMonth() + 1)}-${pad(today.getDate())}`;
}

function isoToUtcDate(value) {
  const iso = parseDate(value, CALENDAR_TYPES.GREGORIAN);
  if (!iso) return null;
  const [year, month, day] = iso.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  return Number.isNaN(date.getTime()) ? null : date;
}

function isoWeekday(value) {
  const date = isoToUtcDate(value);
  if (!date) return null;
  return (date.getUTCDay() + 6) % 7;
}

export function getDatesInRange(start, end) {
  const startDate = isoToUtcDate(start);
  const endDate = isoToUtcDate(end);
  if (!startDate || !endDate || startDate > endDate) return [];

  const dates = [];
  const cursor = new Date(startDate);
  while (cursor <= endDate) {
    dates.push(cursor.toISOString().slice(0, 10));
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }
  return dates;
}

export function getHolidayForDate(
  value,
  settings = defaultCalendarSettings,
) {
  const iso = parseDate(value, CALENDAR_TYPES.GREGORIAN);
  if (!iso) return null;
  const normalized = normalizeCalendarSettings(settings);
  return (
    normalized.work_calendar.holidays.find((holiday) => {
      if (!holiday.active) return false;
      return holiday.start_date <= iso && iso <= holiday.end_date;
    }) || null
  );
}

export function isWeeklyOff(
  value,
  settings = defaultCalendarSettings,
) {
  const weekday = isoWeekday(value);
  if (weekday == null) return false;
  const normalized = normalizeCalendarSettings(settings);
  return normalized.work_calendar.weekly_off_days.includes(weekday);
}

export function isHoliday(
  value,
  settings = defaultCalendarSettings,
) {
  return Boolean(getHolidayForDate(value, settings));
}

export function isWorkingDay(
  value,
  settings = defaultCalendarSettings,
) {
  return !isWeeklyOff(value, settings) && !isHoliday(value, settings);
}

export function getDateInfo(
  value,
  settings = defaultCalendarSettings,
) {
  const holiday = getHolidayForDate(value, settings);
  const weeklyOff = isWeeklyOff(value, settings);
  const dayType = holiday ? "official_holiday" : weeklyOff ? "weekly_off" : "working_day";
  return {
    date: parseDate(value, CALENDAR_TYPES.GREGORIAN),
    is_working_day: dayType === "working_day",
    is_weekly_off: weeklyOff,
    is_holiday: Boolean(holiday),
    day_type: dayType,
    label: holiday?.name || (weeklyOff ? "Weekly Off Day" : "Working Day"),
    holiday,
  };
}

export function getWorkingDays(
  start,
  end,
  settings = defaultCalendarSettings,
) {
  return getDatesInRange(start, end).filter((date) =>
    isWorkingDay(date, settings),
  );
}

export function currentMonthKey(calendar = CALENDAR_TYPES.GREGORIAN) {
  const today = todayIso();
  if (calendar === CALENDAR_TYPES.SHAMSI) {
    const shamsi = toShamsi(today);
    return shamsi ? `${shamsi.year}-${pad(shamsi.month)}` : "";
  }
  const parsed = parseYmd(today);
  return parsed ? `${parsed.year}-${pad(parsed.month)}` : "";
}

export function monthKeyFromDate(value, calendar = CALENDAR_TYPES.GREGORIAN) {
  const parsed = parseYmd(value);
  if (!parsed) return "";

  if (calendar === CALENDAR_TYPES.SHAMSI) {
    if (parsed.year < 1700) return `${parsed.year}-${pad(parsed.month)}`;
    const shamsi = toShamsi(value);
    return shamsi ? `${shamsi.year}-${pad(shamsi.month)}` : "";
  }

  if (parsed.year < 1700) {
    const gregorian = toGregorian(
      `${parsed.year}-${pad(parsed.month)}-${pad(parsed.day)}`,
    );
    const gregorianParsed = parseYmd(gregorian);
    return gregorianParsed
      ? `${gregorianParsed.year}-${pad(gregorianParsed.month)}`
      : "";
  }

  const gregorian = parseDate(value, CALENDAR_TYPES.GREGORIAN);
  const gregorianParsed = parseYmd(gregorian);
  return gregorianParsed
    ? `${gregorianParsed.year}-${pad(gregorianParsed.month)}`
    : "";
}

export function monthBoundsFromKey(monthKey, calendar = CALENDAR_TYPES.GREGORIAN) {
  const parsed = parseMonthKey(monthKey);
  if (!parsed) return { start: "", end: "" };

  if (calendar === CALENDAR_TYPES.SHAMSI) {
    const start = toGregorian(`${parsed.year}-${pad(parsed.month)}-01`);
    const endDay = shamsiMonthLength(parsed.year, parsed.month);
    const end = toGregorian(`${parsed.year}-${pad(parsed.month)}-${pad(endDay)}`);
    return { start, end };
  }

  const endDay = new Date(Date.UTC(parsed.year, parsed.month, 0)).getUTCDate();
  return {
    start: `${parsed.year}-${pad(parsed.month)}-01`,
    end: `${parsed.year}-${pad(parsed.month)}-${pad(endDay)}`,
  };
}

export function formatMonthKey(
  monthKey,
  calendar = CALENDAR_TYPES.GREGORIAN,
  locale = "en",
) {
  const parsed = parseMonthKey(monthKey);
  if (!parsed) return "";

  if (calendar === CALENDAR_TYPES.SHAMSI) {
    const names = AFGHAN_MONTH_NAMES[locale] || AFGHAN_MONTH_NAMES.en;
    return `${names[parsed.month - 1]} ${parsed.year}`;
  }

  return new Intl.DateTimeFormat("en-US", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(Date.UTC(parsed.year, parsed.month - 1, 1)));
}

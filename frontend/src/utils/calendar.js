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
  "purchases",
  "inventory",
  "equipment",
  "subcontractors",
  "worker_advances",
  "daily_worker_attendance",
  "daily_worker_payroll",
  "contract_payments",
  "contract_variations",
];

export const AFGHAN_MONTH_NAMES = {
  "fa-AF": ["حمل", "ثور", "جوزا", "سرطان", "اسد", "سنبله", "میزان", "عقرب", "قوس", "جدی", "دلو", "حوت"],
  "ps-AF": ["وری", "غویی", "غبرګولی", "چنګاښ", "زمری", "وږی", "تله", "لړم", "لیندۍ", "مرغومی", "سلواغه", "کب"],
  en: ["Hamal", "Sawr", "Jawza", "Saratan", "Asad", "Sunbula", "Mizan", "Aqrab", "Qaws", "Jadi", "Dalwa", "Hut"],
};

export const defaultCalendarSettings = {
  default_calendar: CALENDAR_TYPES.SHAMSI,
  modules: Object.fromEntries(CALENDAR_MODULES.map((module) => [module, CALENDAR_TYPES.INHERIT])),
};

const VALID_GLOBAL = new Set([CALENDAR_TYPES.SHAMSI, CALENDAR_TYPES.GREGORIAN]);
const VALID_MODULE = new Set([CALENDAR_TYPES.SHAMSI, CALENDAR_TYPES.GREGORIAN, CALENDAR_TYPES.INHERIT]);

export function normalizeCalendarSettings(value) {
  const incoming = value && typeof value === "object" ? value : {};
  const modules = { ...defaultCalendarSettings.modules };
  const incomingModules = incoming.modules && typeof incoming.modules === "object" ? incoming.modules : {};
  Object.keys(incomingModules).forEach((module) => {
    modules[module] = VALID_MODULE.has(incomingModules[module]) ? incomingModules[module] : CALENDAR_TYPES.INHERIT;
  });
  return {
    default_calendar: VALID_GLOBAL.has(incoming.default_calendar) ? incoming.default_calendar : CALENDAR_TYPES.SHAMSI,
    modules,
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
  const match = normalizeDigits(value).trim().replace(/\//g, "-").match(/^(-?\d{1,4})-(\d{1,2})-(\d{1,2})/);
  if (!match) return null;
  return { year: Number(match[1]), month: Number(match[2]), day: Number(match[3]) };
}

function pad(value) {
  return String(value).padStart(2, "0");
}

function gregorianToJdn(year, month, day) {
  return Math.floor((1461 * (year + 4800 + Math.floor((month - 14) / 12))) / 4)
    + Math.floor((367 * (month - 2 - 12 * Math.floor((month - 14) / 12))) / 12)
    - Math.floor((3 * Math.floor((year + 4900 + Math.floor((month - 14) / 12)) / 100)) / 4)
    + day - 32075;
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
  return day
    + (month <= 7 ? (month - 1) * 31 : (month - 1) * 30 + 6)
    + Math.floor((epyear * 682 - 110) / 2816)
    + (epyear - 1) * 365
    + Math.floor(epbase / 2820) * 1029983
    + 1948320;
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
    ycycle = Math.floor((2134 * aux1 + 2816 * aux2 + 2815) / 1028522) + aux1 + 1;
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
  return jalaliToJdn(Number(year) + 1, 1, 1) - jalaliToJdn(Number(year), 1, 1) === 366;
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
  return jdnToJalali(gregorianToJdn(parsed.year, parsed.month, parsed.day));
}

export function toGregorian(value) {
  const parsed = parseYmd(value);
  if (!parsed) return "";
  if (parsed.month < 1 || parsed.month > 12 || parsed.day < 1 || parsed.day > shamsiMonthLength(parsed.year, parsed.month)) return "";
  const g = jdnToGregorian(jalaliToJdn(parsed.year, parsed.month, parsed.day));
  return `${g.year}-${pad(g.month)}-${pad(g.day)}`;
}

export function parseDate(value, calendar = CALENDAR_TYPES.GREGORIAN) {
  if (!value) return "";
  const parsed = parseYmd(value);
  if (!parsed) return "";
  if (calendar === CALENDAR_TYPES.SHAMSI) return toGregorian(`${parsed.year}-${pad(parsed.month)}-${pad(parsed.day)}`);
  const max = new Date(parsed.year, parsed.month, 0).getDate();
  if (parsed.month < 1 || parsed.month > 12 || parsed.day < 1 || parsed.day > max) return "";
  return `${parsed.year}-${pad(parsed.month)}-${pad(parsed.day)}`;
}

export function normalizeDateInput(value, calendar = CALENDAR_TYPES.GREGORIAN) {
  return parseDate(value, calendar);
}

export function formatDate(value, calendar = CALENDAR_TYPES.GREGORIAN, locale = "en") {
  if (!value) return "";
  if (calendar !== CALENDAR_TYPES.SHAMSI) return parseDate(value, CALENDAR_TYPES.GREGORIAN) || "";
  const parsed = parseYmd(value);
  if (parsed && parsed.year < 1700) {
    return `${parsed.year}-${pad(parsed.month)}-${pad(parsed.day)}`;
  }
  const shamsi = toShamsi(value);
  return shamsi ? `${shamsi.year}-${pad(shamsi.month)}-${pad(shamsi.day)}` : "";
}

export function formatDateTime(value, calendar = CALENDAR_TYPES.GREGORIAN, locale = "en") {
  if (!value) return "";
  const [datePart, timePart = ""] = String(value).replace("T", " ").split(" ");
  const formattedDate = formatDate(datePart, calendar, locale);
  return formattedDate ? `${formattedDate}${timePart ? ` ${timePart.slice(0, 5)}` : ""}` : "";
}

export function formatByModule(value, module, settings, locale = "en") {
  return formatDate(value, getModuleCalendar(module, settings), locale);
}

export function todayIso() {
  const today = new Date();
  return `${today.getFullYear()}-${pad(today.getMonth() + 1)}-${pad(today.getDate())}`;
}

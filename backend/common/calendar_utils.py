from calendar import monthrange
from copy import deepcopy
from datetime import date, datetime, time, timedelta

from django.utils import timezone
from rest_framework import serializers

CALENDAR_GREGORIAN = "gregorian"
CALENDAR_SHAMSI = "shamsi"
CALENDAR_INHERIT = "inherit"

CALENDAR_MODULES = [
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
]

AFGHAN_MONTH_NAMES = {
    "fa-AF": ["حمل", "ثور", "جوزا", "سرطان", "اسد", "سنبله", "میزان", "عقرب", "قوس", "جدی", "دلو", "حوت"],
    "ps-AF": ["وری", "غویی", "غبرګولی", "چنګاښ", "زمری", "وږی", "تله", "لړم", "لیندۍ", "مرغومی", "سلواغه", "کب"],
    "en": ["Hamal", "Sawr", "Jawza", "Saratan", "Asad", "Sunbula", "Mizan", "Aqrab", "Qaws", "Jadi", "Dalwa", "Hut"],
}

DEFAULT_CALENDAR_SETTINGS = {
    "default_calendar": CALENDAR_SHAMSI,
    "modules": {module: CALENDAR_INHERIT for module in CALENDAR_MODULES},
}

_VALID_GLOBAL = {CALENDAR_GREGORIAN, CALENDAR_SHAMSI}
_VALID_MODULE = {CALENDAR_GREGORIAN, CALENDAR_SHAMSI, CALENDAR_INHERIT}


def normalize_calendar_settings(settings_value=None):
    settings_value = settings_value if isinstance(settings_value, dict) else {}
    normalized = deepcopy(DEFAULT_CALENDAR_SETTINGS)
    default_calendar = settings_value.get("default_calendar")
    if default_calendar in _VALID_GLOBAL:
        normalized["default_calendar"] = default_calendar

    module_values = settings_value.get("modules")
    if isinstance(module_values, dict):
        for module in set(CALENDAR_MODULES) | set(module_values.keys()):
            value = module_values.get(module, CALENDAR_INHERIT)
            normalized["modules"][module] = value if value in _VALID_MODULE else CALENDAR_INHERIT
    return normalized


def tenant_calendar_settings(request=None):
    try:
        from accounts.models import ApplicationSettings

        return ApplicationSettings.get_solo().calendar_settings
    except Exception:
        return normalize_calendar_settings()


def get_module_calendar(module, settings_value=None, request=None):
    settings_value = normalize_calendar_settings(settings_value or tenant_calendar_settings(request))
    module_value = settings_value["modules"].get(module, CALENDAR_INHERIT)
    if module_value == CALENDAR_INHERIT:
        return settings_value["default_calendar"]
    return module_value if module_value in _VALID_GLOBAL else settings_value["default_calendar"]


def _pad(number):
    return str(int(number)).zfill(2)


def _parse_ymd(value):
    if isinstance(value, datetime):
        return value.year, value.month, value.day
    if isinstance(value, date):
        return value.year, value.month, value.day
    if not isinstance(value, str):
        raise ValueError("Date must be in YYYY-MM-DD format.")
    parts = value.strip().replace("/", "-").split("-")
    if len(parts) != 3:
        raise ValueError("Date must be in YYYY-MM-DD format.")
    try:
        return int(parts[0]), int(parts[1]), int(parts[2])
    except ValueError as exc:
        raise ValueError("Date must contain numeric year, month, and day.") from exc


def is_shamsi_leap_year(year):
    breaks = [-61, 9, 38, 199, 426, 686, 756, 818, 1111, 1181, 1210, 1635, 2060, 2097, 2192, 2262, 2324, 2394, 2456, 3178]
    gy = year + 621
    leap_j = -14
    jp = breaks[0]
    if year < jp or year >= breaks[-1]:
        raise ValueError("Shamsi year is out of supported range.")
    for jm in breaks[1:]:
        jump = jm - jp
        if year < jm:
            break
        leap_j += (jump // 33) * 8 + ((jump % 33) // 4)
        jp = jm
    n = year - jp
    leap_j += (n // 33) * 8 + (((n % 33) + 3) // 4)
    if jump % 33 == 4 and jump - n == 4:
        leap_j += 1
    leap_g = gy // 4 - (((gy // 100) + 1) * 3 // 4) - 150
    march = 20 + leap_j - leap_g
    if jump - n < 6:
        n = n - jump + ((jump + 4) // 33) * 33
    leap = (((n + 1) % 33) - 1) % 4
    if leap == -1:
        leap = 4
    return leap == 0


def shamsi_month_length(year, month):
    if month < 1 or month > 12:
        raise ValueError("Invalid Shamsi month.")
    if month <= 6:
        return 31
    if month <= 11:
        return 30
    return 30 if is_shamsi_leap_year(year) else 29


def _jalali_to_jdn(jy, jm, jd):
    jy = int(jy)
    jm = int(jm)
    jd = int(jd)
    epbase = jy - 474 if jy >= 0 else jy - 473
    epyear = 474 + (epbase % 2820)
    return (
        jd
        + ((jm - 1) * 31 if jm <= 7 else ((jm - 1) * 30) + 6)
        + (((epyear * 682) - 110) // 2816)
        + (epyear - 1) * 365
        + (epbase // 2820) * 1029983
        + 1948320
    )


def _jdn_to_jalali(jdn):
    depoch = jdn - _jalali_to_jdn(475, 1, 1)
    cycle = depoch // 1029983
    cyear = depoch % 1029983
    if cyear == 1029982:
        ycycle = 2820
    else:
        aux1 = cyear // 366
        aux2 = cyear % 366
        ycycle = ((2134 * aux1 + 2816 * aux2 + 2815) // 1028522) + aux1 + 1
    jy = ycycle + 2820 * cycle + 474
    if jy <= 0:
        jy -= 1
    yday = jdn - _jalali_to_jdn(jy, 1, 1) + 1
    if yday <= 186:
        jm = ((yday - 1) // 31) + 1
        jd = ((yday - 1) % 31) + 1
    else:
        jm = ((yday - 187) // 30) + 7
        jd = ((yday - 187) % 30) + 1
    return jy, jm, jd


def to_shamsi(value):
    if isinstance(value, datetime):
        value = timezone.localtime(value) if timezone.is_aware(value) else value
        value = value.date()
    if not isinstance(value, date):
        value = parse_gregorian_date(value)
    return _jdn_to_jalali(value.toordinal() + 1721425)


def to_gregorian(value):
    jy, jm, jd = _parse_ymd(value)
    if jd < 1 or jd > shamsi_month_length(jy, jm):
        raise ValueError("Invalid Shamsi date.")
    return date.fromordinal(_jalali_to_jdn(jy, jm, jd) - 1721425)


def parse_shamsi_date(value):
    if value in ("", None):
        return None
    return to_gregorian(value)


def parse_gregorian_date(value):
    if value in ("", None):
        return None
    year, month, day = _parse_ymd(value)
    try:
        return date(year, month, day)
    except ValueError as exc:
        raise ValueError("Invalid Gregorian date.") from exc


def parse_calendar_date(value, calendar_type):
    if calendar_type == CALENDAR_SHAMSI and value not in ("", None):
        year, _, _ = _parse_ymd(value)
        if year >= 1700:
            return parse_gregorian_date(value)
        return parse_shamsi_date(value)
    return parse_gregorian_date(value)


def format_shamsi_date(value, locale="en"):
    if not value:
        return ""
    jy, jm, jd = to_shamsi(value)
    return f"{jy}-{_pad(jm)}-{_pad(jd)}"


def format_gregorian_date(value):
    if not value:
        return ""
    if isinstance(value, datetime):
        value = value.date()
    if isinstance(value, date):
        return value.isoformat()
    return parse_gregorian_date(value).isoformat()


def format_calendar_date(value, calendar_type, locale="en"):
    return format_shamsi_date(value, locale) if calendar_type == CALENDAR_SHAMSI else format_gregorian_date(value)


def parse_calendar_datetime(value, calendar_type):
    if value in ("", None):
        return None
    if isinstance(value, datetime):
        return value
    text = str(value).strip()
    date_text, _, time_text = text.replace("T", " ").partition(" ")
    parsed_date = parse_calendar_date(date_text, calendar_type)
    parsed_time = time.fromisoformat(time_text[:8]) if time_text else time.min
    return datetime.combine(parsed_date, parsed_time)


def format_calendar_datetime(value, calendar_type, locale="en"):
    if not value:
        return ""
    local_value = timezone.localtime(value) if isinstance(value, datetime) and timezone.is_aware(value) else value
    date_text = format_calendar_date(local_value.date() if isinstance(local_value, datetime) else local_value, calendar_type, locale)
    if isinstance(local_value, datetime):
        return f"{date_text} {local_value.strftime('%H:%M')}"
    return date_text


def convert_query_date_params(params, field_names, calendar_type):
    converted = {}
    suffixes = ["", "__gte", "__lte", "__gt", "__lt", "_from", "_to"]
    for key, value in params.items():
        new_value = value
        base = key
        for suffix in suffixes:
            if suffix and key.endswith(suffix):
                base = key[: -len(suffix)]
                break
        if base in field_names and value:
            new_value = parse_calendar_date(value, calendar_type).isoformat()
        converted[key] = new_value
    return converted


def calendar_month_bounds(year, month, calendar_type):
    year = int(year)
    month = int(month)
    if calendar_type == CALENDAR_SHAMSI:
        start = to_gregorian(f"{year}-{_pad(month)}-01")
        end = to_gregorian(f"{year}-{_pad(month)}-{_pad(shamsi_month_length(year, month))}")
        return start, end
    return date(year, month, 1), date(year, month, monthrange(year, month)[1])


def calendar_year_bounds(year, calendar_type):
    year = int(year)
    if calendar_type == CALENDAR_SHAMSI:
        return to_gregorian(f"{year}-01-01"), to_gregorian(f"{year}-12-{shamsi_month_length(year, 12)}")
    return date(year, 1, 1), date(year, 12, 31)


def format_date_fields(row, field_names, calendar_type, locale="en"):
    data = dict(row)
    data["calendar_type"] = calendar_type
    for field in field_names:
        if field in data:
            data[f"formatted_{field}"] = format_calendar_date(data.get(field), calendar_type, locale) if data.get(field) else ""
    return data


class CalendarDateField(serializers.DateField):
    def __init__(self, *args, calendar_module=None, **kwargs):
        self.calendar_module = calendar_module
        super().__init__(*args, **kwargs)

    def _calendar(self):
        request = self.context.get("request") if hasattr(self, "context") else None
        return get_module_calendar(self.calendar_module, request=request)

    def to_internal_value(self, value):
        if isinstance(value, date):
            return value
        try:
            return parse_calendar_date(value, self._calendar())
        except ValueError as exc:
            raise serializers.ValidationError(str(exc)) from exc

    def to_representation(self, value):
        return format_calendar_date(value, self._calendar())

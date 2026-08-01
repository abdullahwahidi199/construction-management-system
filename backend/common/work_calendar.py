from datetime import date, datetime, timedelta

from common.calendar_utils import normalize_calendar_settings, parse_gregorian_date


def _to_date(value):
    if isinstance(value, datetime):
        return value.date()
    if isinstance(value, date):
        return value
    return parse_gregorian_date(value)


class WorkCalendarService:
    def __init__(self, settings_value=None):
        self.settings = normalize_calendar_settings(settings_value)
        self.config = self.settings.get("work_calendar") or {}

    @classmethod
    def from_settings(cls):
        from accounts.models import ApplicationSettings

        return cls(ApplicationSettings.get_solo().calendar_settings)

    def get_holiday(self, value):
        target_date = _to_date(value)
        for holiday in self.config.get("holidays") or []:
            if not holiday.get("active", True):
                continue
            start = _to_date(holiday.get("start_date"))
            end = _to_date(holiday.get("end_date") or holiday.get("start_date"))
            if start <= target_date <= end:
                return holiday
        return None

    def is_weekly_off(self, value):
        target_date = _to_date(value)
        return target_date.weekday() in set(self.config.get("weekly_off_days") or [])

    def is_holiday(self, value):
        return self.get_holiday(value) is not None

    def is_working_day(self, value):
        return not self.is_weekly_off(value) and not self.is_holiday(value)

    def each_date(self, start_date, end_date):
        start = _to_date(start_date)
        end = _to_date(end_date)
        if start > end:
            return
        cursor = start
        while cursor <= end:
            yield cursor
            cursor += timedelta(days=1)

    def get_working_days(self, start_date, end_date):
        return [
            day
            for day in self.each_date(start_date, end_date)
            if self.is_working_day(day)
        ]

    def get_date_info(self, value):
        target_date = _to_date(value)
        holiday = self.get_holiday(target_date)
        weekly_off = self.is_weekly_off(target_date)
        if holiday:
            day_type = "official_holiday"
        elif weekly_off:
            day_type = "weekly_off"
        else:
            day_type = "working_day"
        return {
            "date": target_date.isoformat(),
            "is_working_day": day_type == "working_day",
            "is_weekly_off": weekly_off,
            "is_holiday": holiday is not None,
            "day_type": day_type,
            "label": (
                holiday.get("name")
                if holiday
                else "Weekly Off Day"
                if weekly_off
                else "Working Day"
            ),
            "holiday": holiday,
        }

    def get_range_summary(self, start_date, end_date):
        days = list(self.each_date(start_date, end_date))
        infos = [self.get_date_info(day) for day in days]
        return {
            "total_calendar_days": len(days),
            "total_working_days": sum(1 for info in infos if info["is_working_day"]),
            "weekly_off_days": sum(1 for info in infos if info["is_weekly_off"]),
            "official_holidays": sum(1 for info in infos if info["is_holiday"]),
            "days": infos,
        }


def get_work_calendar_service(settings_value=None):
    if settings_value is not None:
        return WorkCalendarService(settings_value)
    return WorkCalendarService.from_settings()


def isWorkingDay(value):
    return get_work_calendar_service().is_working_day(value)


def isWeeklyOff(value):
    return get_work_calendar_service().is_weekly_off(value)


def isHoliday(value):
    return get_work_calendar_service().is_holiday(value)


def getWorkingDays(start_date, end_date):
    return get_work_calendar_service().get_working_days(start_date, end_date)


# Pythonic aliases for new backend code.
is_working_day = isWorkingDay
is_weekly_off = isWeeklyOff
is_holiday = isHoliday
get_working_days = getWorkingDays

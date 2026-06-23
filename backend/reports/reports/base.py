from datetime import datetime
from decimal import Decimal


class BaseReport:
    """
    Base class for all reports.
    Each subclass must implement generate() returning a dict.
    """
    report_name = "Base Report"

    def __init__(self, filters: dict = None):
        self.filters = filters or {}
        self.generated_at = datetime.now()

    def get_date_range(self):
        """Parse start_date and end_date from filters."""
        start = self.filters.get("start_date")
        end = self.filters.get("end_date")
        return start, end

    def parse_decimal(self, value):
        return Decimal(str(value or 0))

    def generate(self) -> dict:
        raise NotImplementedError("Subclasses must implement generate()")

    def get_metadata(self):
        return {
            "report_name": self.report_name,
            "generated_at": self.generated_at.strftime("%Y-%m-%d %H:%M:%S"),
            "filters": self.filters,
        }
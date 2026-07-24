from rest_framework import serializers
from common.calendar_utils import get_module_calendar, parse_calendar_date


class BaseReportFilterSerializer(serializers.Serializer):
    start_date = serializers.DateField(required=False)
    end_date = serializers.DateField(required=False)
    export = serializers.ChoiceField(
        choices=["json", "pdf"], required=False, default="json"
    )

    calendar_module = "reports"

    def to_internal_value(self, data):
        if isinstance(data, dict):
            data = data.copy()
            calendar_type = get_module_calendar(self.calendar_module, request=self.context.get("request"))
            for field in ["start_date", "end_date"]:
                if data.get(field):
                    data[field] = parse_calendar_date(data[field], calendar_type)
        return super().to_internal_value(data)

    def validate(self, data):
        start = data.get("start_date")
        end = data.get("end_date")
        if start and end and start > end:
            raise serializers.ValidationError(
                "start_date cannot be after end_date."
            )
        return data


class ProjectReportFilterSerializer(BaseReportFilterSerializer):
    status = serializers.CharField(required=False)
    property_type = serializers.CharField(required=False)


class ExpenseReportFilterSerializer(BaseReportFilterSerializer):
    project_id = serializers.IntegerField(required=False)
    expense_type = serializers.CharField(required=False)
    status = serializers.ChoiceField(
        choices=["pending", "approved", "rejected"],
        required=False,
    )
    approval_status = serializers.ChoiceField(
        choices=["pending", "approved", "rejected"],
        required=False,
    )


class PayrollReportFilterSerializer(BaseReportFilterSerializer):
    source_type = serializers.ChoiceField(
        choices=["employee", "daily_worker"],
        required=False,
    )
    employee_id = serializers.IntegerField(required=False)
    currency = serializers.CharField(required=False)
    payment_method = serializers.CharField(required=False)


class AttendanceReportFilterSerializer(BaseReportFilterSerializer):
    source_type = serializers.ChoiceField(
        choices=["employee", "daily_worker"],
        required=False,
    )
    employee_id = serializers.IntegerField(required=False)
    status = serializers.CharField(required=False)


class EmployeeReportFilterSerializer(serializers.Serializer):
    department = serializers.CharField(required=False)
    employment_type = serializers.CharField(required=False)
    is_active = serializers.BooleanField(required=False, allow_null=True)
    export = serializers.ChoiceField(
        choices=["json", "pdf"], required=False, default="json"
    )


class ContractReportFilterSerializer(BaseReportFilterSerializer):
    project_id = serializers.IntegerField(required=False)
    subcontractor_id = serializers.IntegerField(required=False)
    status = serializers.CharField(required=False)
    currency = serializers.CharField(required=False)


class FinancialReportFilterSerializer(BaseReportFilterSerializer):
    project_id = serializers.IntegerField(required=False)

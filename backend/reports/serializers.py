from rest_framework import serializers


class BaseReportFilterSerializer(serializers.Serializer):
    start_date = serializers.DateField(required=False)
    end_date = serializers.DateField(required=False)
    export = serializers.ChoiceField(
        choices=["json", "pdf"], required=False, default="json"
    )

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


class PayrollReportFilterSerializer(BaseReportFilterSerializer):
    employee_id = serializers.IntegerField(required=False)
    currency = serializers.CharField(required=False)
    payment_method = serializers.CharField(required=False)


class AttendanceReportFilterSerializer(BaseReportFilterSerializer):
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
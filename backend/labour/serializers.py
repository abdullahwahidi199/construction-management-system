from rest_framework import serializers
from .models import DailyWorker, WorkerAttendance, WorkerPayroll
from datetime import date

class DailyWorkerSerializer(serializers.ModelSerializer):
    full_name = serializers.ReadOnlyField()

    class Meta:
        model = DailyWorker
        fields = '__all__'
        read_only_fields = ['worker_id', 'created_at', 'updated_at', 'joined_date']

class WorkerAttendanceSerializer(serializers.ModelSerializer):
    worker_name = serializers.CharField(source='worker.full_name', read_only=True)
    trade = serializers.CharField(source='worker.get_trade_display', read_only=True)

    class Meta:
        model = WorkerAttendance
        fields = '__all__'
        read_only_fields = ['created_at', 'updated_at', 'created_by']

    def validate_date(self, value):
        if value > date.today():
            raise serializers.ValidationError("Cannot mark attendance for future dates.")
        return value

class BulkWorkerAttendanceSerializer(serializers.Serializer):
    date = serializers.DateField()
    project_site = serializers.CharField(required=False, allow_blank=True)
    records = serializers.ListField(
        child=serializers.DictField(),
        help_text="[{'worker': id, 'status': 'present/absent/half_day', 'overtime_hours': 2, 'notes': ''}]"
    )

    def validate_date(self, value):
        if value > date.today():
            raise serializers.ValidationError("Cannot mark attendance for future dates.")
        return value

class WorkerPayrollSerializer(serializers.ModelSerializer):
    worker_name = serializers.CharField(source='worker.full_name', read_only=True)
    worker_id_code = serializers.CharField(source='worker.worker_id', read_only=True)

    class Meta:
        model = WorkerPayroll
        fields = '__all__'
        read_only_fields = ['total_days_worked', 'total_overtime_hours', 'base_pay', 'overtime_pay', 'net_pay', 'created_at', 'created_by']

class GenerateWorkerPayrollSerializer(serializers.Serializer):
    worker_ids = serializers.ListField(child=serializers.IntegerField(), required=False)
    period_start = serializers.DateField()
    period_end = serializers.DateField()
    payment_method = serializers.CharField(default="cash")
    
    def validate(self, data):
        if data['period_start'] > data['period_end']:
            raise serializers.ValidationError("Start date must be before end date.")
        return data
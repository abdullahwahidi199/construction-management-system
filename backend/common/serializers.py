from django.db import models
from rest_framework import serializers

from .calendar_utils import (
    format_calendar_date,
    format_calendar_datetime,
    get_module_calendar,
    parse_calendar_date,
    parse_calendar_datetime,
)


class CalendarModelSerializer(serializers.ModelSerializer):
    calendar_module = None

    def get_fields(self):
        fields = super().get_fields()
        model = getattr(getattr(self, "Meta", None), "model", None)
        if not model:
            return fields
        for model_field in model._meta.fields:
            field = fields.get(model_field.name)
            if not field or getattr(field, "read_only", False):
                continue
            if isinstance(model_field, models.DateField) and not isinstance(model_field, models.DateTimeField):
                field.input_formats = ["%Y-%m-%d"]
            if isinstance(model_field, models.DateTimeField):
                field.input_formats = ["iso-8601", "%Y-%m-%d %H:%M", "%Y-%m-%d"]
        return fields

    def _calendar_type(self):
        return get_module_calendar(self.calendar_module, request=self.context.get("request"))

    def to_internal_value(self, data):
        if isinstance(data, dict):
            data = data.copy()
            calendar_type = self._calendar_type()
            model = getattr(getattr(self, "Meta", None), "model", None)
            if model:
                for model_field in model._meta.fields:
                    if model_field.name not in data or data.get(model_field.name) in ("", None):
                        continue
                    try:
                        if isinstance(model_field, models.DateTimeField):
                            data[model_field.name] = parse_calendar_datetime(data[model_field.name], calendar_type)
                        elif isinstance(model_field, models.DateField):
                            data[model_field.name] = parse_calendar_date(data[model_field.name], calendar_type)
                    except ValueError as exc:
                        raise serializers.ValidationError({model_field.name: str(exc)}) from exc
        return super().to_internal_value(data)

    def to_representation(self, instance):
        data = super().to_representation(instance)
        calendar_type = self._calendar_type()
        data["calendar_type"] = calendar_type
        model = getattr(getattr(self, "Meta", None), "model", None)
        if not model:
            return data
        for model_field in model._meta.fields:
            value = getattr(instance, model_field.name, None)
            if isinstance(model_field, models.DateTimeField):
                data[model_field.name] = format_calendar_datetime(value, calendar_type)
                data[f"formatted_{model_field.name}"] = data[model_field.name] or ""
            elif isinstance(model_field, models.DateField):
                data[model_field.name] = format_calendar_date(value, calendar_type)
                data[f"formatted_{model_field.name}"] = data[model_field.name] or ""
        return data

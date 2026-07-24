from django.db.models import Count, Q
from django.utils import timezone
from rest_framework import mixins, status, viewsets
from rest_framework.decorators import action
from rest_framework.pagination import PageNumberPagination
from rest_framework.response import Response

from .models import AuditLog, AuditRetentionPolicy
from .permissions import AuditLogPermission
from .serializers import (
    AuditLogDetailSerializer,
    AuditLogListSerializer,
    AuditRetentionPolicySerializer,
)
from .utils import create_audit_log, export_csv, export_excel


class AuditLogPagination(PageNumberPagination):
    page_size = 25
    page_size_query_param = "page_size"
    max_page_size = 200


class AuditLogViewSet(
    mixins.ListModelMixin,
    mixins.RetrieveModelMixin,
    mixins.DestroyModelMixin,
    viewsets.GenericViewSet,
):
    queryset = AuditLog.objects.select_related("user")
    permission_classes = [AuditLogPermission]
    pagination_class = AuditLogPagination

    def get_serializer_class(self):
        if self.action == "retrieve":
            return AuditLogDetailSerializer
        return AuditLogListSerializer

    def get_queryset(self):
        qs = super().get_queryset()
        params = self.request.query_params

        search = params.get("search")
        user = params.get("user")
        action_name = params.get("action")
        model = params.get("model")
        status_value = params.get("status")
        start_date = params.get("start_date")
        end_date = params.get("end_date")

        if search:
            qs = qs.filter(
                Q(action__icontains=search)
                | Q(model_name__icontains=search)
                | Q(object_id__icontains=search)
                | Q(object_repr__icontains=search)
                | Q(description__icontains=search)
                | Q(endpoint__icontains=search)
                | Q(user__username__icontains=search)
            )
        if user:
            qs = qs.filter(user_id=user)
        if action_name:
            qs = qs.filter(action=action_name)
        if model:
            qs = qs.filter(model_name=model)
        if status_value:
            qs = qs.filter(status=status_value)
        if start_date:
            qs = qs.filter(timestamp__date__gte=start_date)
        if end_date:
            qs = qs.filter(timestamp__date__lte=end_date)

        return qs

    @action(detail=False, methods=["get"])
    def options(self, request):
        actions = list(
            AuditLog.objects.exclude(action="")
            .order_by("action")
            .values_list("action", flat=True)
            .distinct()
        )
        models = list(
            AuditLog.objects.exclude(model_name="")
            .order_by("model_name")
            .values_list("model_name", flat=True)
            .distinct()
        )
        users = list(
            AuditLog.objects.exclude(user__isnull=True)
            .order_by("user__username")
            .values("user_id", "user__username")
            .distinct()
        )
        return Response({
            "actions": actions,
            "models": models,
            "users": [
                {"id": row["user_id"], "username": row["user__username"]}
                for row in users
            ],
        })

    @action(detail=False, methods=["get"])
    def summary(self, request):
        today = timezone.now().date()
        qs = self.get_queryset()
        recent = qs[:10]
        most_active = list(
            qs.exclude(user__isnull=True)
            .values("user_id", "user__username")
            .annotate(count=Count("id"))
            .order_by("-count")[:5]
        )
        return Response({
            "total_logs": qs.count(),
            "failed_actions": qs.filter(status=AuditLog.Status.FAILED).count(),
            "financial_modifications_today": qs.filter(
                timestamp__date=today,
                extra_metadata__is_financial=True,
            ).count(),
            "most_active_users": most_active,
            "recent_activity": AuditLogListSerializer(recent, many=True).data,
        })

    @action(detail=False, methods=["get"], url_path="export/csv")
    def export_csv(self, request):
        response = export_csv(self.get_queryset())
        create_audit_log(
            user=request.user,
            action="audit_logs.export_csv",
            description="Exported audit logs as CSV",
            request=request,
            extra_metadata={"count": self.get_queryset().count()},
        )
        return response

    @action(detail=False, methods=["get"], url_path="export/excel")
    def export_excel(self, request):
        response = export_excel(self.get_queryset())
        create_audit_log(
            user=request.user,
            action="audit_logs.export_excel",
            description="Exported audit logs as Excel",
            request=request,
            extra_metadata={"count": self.get_queryset().count()},
        )
        return response

    @action(detail=False, methods=["get", "put"], url_path="retention")
    def retention(self, request):
        policy, _ = AuditRetentionPolicy.objects.get_or_create(pk=1)
        if request.method == "GET":
            return Response(AuditRetentionPolicySerializer(policy).data)

        serializer = AuditRetentionPolicySerializer(policy, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        old_data = AuditRetentionPolicySerializer(policy).data
        serializer.save(updated_by=request.user)
        create_audit_log(
            user=request.user,
            action="audit_retention.update",
            model_name="AuditRetentionPolicy",
            object_id=policy.pk,
            object_repr=policy,
            old_data=old_data,
            new_data=AuditRetentionPolicySerializer(policy).data,
            description="Updated audit retention policy",
            request=request,
        )
        return Response(serializer.data)

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        old_data = AuditLogDetailSerializer(instance).data
        instance.delete()
        create_audit_log(
            user=request.user,
            action="audit_logs.delete",
            model_name="AuditLog",
            object_id=old_data["id"],
            object_repr=f"AuditLog {old_data['id']}",
            old_data=old_data,
            new_data={},
            description=f"Deleted audit log {old_data['id']}",
            request=request,
        )
        return Response(status=status.HTTP_204_NO_CONTENT)

from django.utils import timezone
from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from .models import Notification
from .serializers import NotificationSerializer
from .services import broadcast_event, unread_count, user_group_name


class NotificationViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = NotificationSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        queryset = Notification.objects.filter(recipient=self.request.user)
        unread = self.request.query_params.get("unread")
        notification_type = self.request.query_params.get("type")
        if unread in {"1", "true", "True"}:
            queryset = queryset.filter(read_at__isnull=True)
        if notification_type:
            queryset = queryset.filter(notification_type=notification_type)
        return queryset

    @action(detail=False, methods=["get"], url_path="unread-count")
    def unread_count(self, request):
        return Response({"unread_count": unread_count(request.user)})

    @action(detail=True, methods=["post"], url_path="mark-read")
    def mark_read(self, request, pk=None):
        notification = self.get_object()
        if notification.read_at is None:
            notification.read_at = timezone.now()
            notification.save(update_fields=["read_at"])
        count = unread_count(request.user)
        broadcast_event(
            user_group_name(request.user.id),
            "notification.read",
            {"id": notification.id, "unread_count": count},
        )
        return Response({"unread_count": count})

    @action(detail=False, methods=["post"], url_path="mark-all-read")
    def mark_all_read(self, request):
        now = timezone.now()
        self.get_queryset().filter(read_at__isnull=True).update(read_at=now)
        broadcast_event(
            user_group_name(request.user.id),
            "notification.read_all",
            {"unread_count": 0},
        )
        return Response({"unread_count": 0})


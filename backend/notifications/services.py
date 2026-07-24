from asgiref.sync import async_to_sync
from channels.layers import get_channel_layer

from .models import Notification
from .serializers import NotificationSerializer


def user_group_name(user_id):
    return f"user_{user_id}"


def unread_count(user):
    return Notification.objects.filter(recipient=user, read_at__isnull=True).count()


def broadcast_event(group, event, payload):
    channel_layer = get_channel_layer()
    if channel_layer is None:
        return
    async_to_sync(channel_layer.group_send)(
        group,
        {
            "type": "notify.message",
            "event": event,
            "payload": payload,
        },
    )


def create_notification(*, recipient, title, message="", notification_type="system", payload=None):
    if not recipient:
        return None
    notification = Notification.objects.create(
        recipient=recipient,
        title=title,
        message=message,
        notification_type=notification_type,
        payload=payload or {},
    )
    broadcast_event(
        user_group_name(recipient.id),
        "notification.created",
        {
            "notification": NotificationSerializer(notification).data,
            "unread_count": unread_count(recipient),
        },
    )
    return notification


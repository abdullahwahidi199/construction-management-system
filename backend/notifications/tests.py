from channels.testing import WebsocketCommunicator
from channels.db import database_sync_to_async
from django.test import TransactionTestCase
from rest_framework.authtoken.models import Token
from rest_framework.test import APITestCase

from common.test_helpers import create_admin, create_notification
from config.asgi import application
from notifications.models import Notification


class NotificationAPITests(APITestCase):
    def setUp(self):
        self.user = create_admin()
        self.other = create_admin(username="other-admin")
        self.client.force_authenticate(self.user)
        create_notification(self.user, title="Mine unread")
        create_notification(self.user, title="System", notification_type="system")
        create_notification(self.other, title="Other user")

    def test_notifications_are_scoped_to_recipient_and_filterable(self):
        response = self.client.get("/api/notifications/?unread=true&type=expense_approval")

        self.assertEqual(response.status_code, 200, response.data)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]["title"], "Mine unread")

    def test_unread_count_mark_read_and_mark_all_read(self):
        notification = Notification.objects.filter(recipient=self.user).first()

        count = self.client.get("/api/notifications/unread-count/")
        marked = self.client.post(f"/api/notifications/{notification.id}/mark-read/")
        all_read = self.client.post("/api/notifications/mark-all-read/")

        self.assertEqual(count.status_code, 200)
        self.assertEqual(count.data["unread_count"], 2)
        self.assertEqual(marked.status_code, 200)
        self.assertEqual(all_read.data["unread_count"], 0)

    def test_notification_api_requires_authentication(self):
        self.client.force_authenticate(None)

        response = self.client.get("/api/notifications/")

        self.assertEqual(response.status_code, 401)


class NotificationWebSocketTests(TransactionTestCase):
    async def test_websocket_rejects_missing_token_and_accepts_valid_token(self):
        rejected = WebsocketCommunicator(application, "/ws/notifications/")
        connected, _ = await rejected.connect()
        self.assertFalse(connected)

        user = await database_sync_to_async(create_admin)(username="ws-admin")
        token = await database_sync_to_async(Token.objects.create)(user=user)
        accepted = WebsocketCommunicator(application, f"/ws/notifications/?token={token.key}")
        connected, _ = await accepted.connect()
        self.assertTrue(connected)
        await accepted.disconnect()

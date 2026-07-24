import { useEffect, useMemo, useState } from "react";
import { Bell, Check, CheckCheck } from "lucide-react";
import instance from "../../api/axiosInstance";
import useRealtimeEvents from "../../hooks/useRealtimeEvents";

function formatTime(value) {
  if (!value) return "";
  return new Date(value).toLocaleString();
}

export default function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    let active = true;

    async function loadInitial() {
      try {
        const [listRes, countRes] = await Promise.all([
          instance.get("notifications/"),
          instance.get("notifications/unread-count/"),
        ]);
        if (!active) return;
        const list = Array.isArray(listRes.data)
          ? listRes.data
          : listRes.data?.results || [];
        setNotifications(list.slice(0, 12));
        setUnreadCount(Number(countRes.data?.unread_count) || 0);
      } catch {
        if (active) {
          setNotifications([]);
          setUnreadCount(0);
        }
      }
    }

    loadInitial();
    return () => {
      active = false;
    };
  }, []);

  useRealtimeEvents((message) => {
    if (message.event === "notification.created") {
      const item = message.payload?.notification;
      if (item) {
        setNotifications((current) => [item, ...current].slice(0, 12));
      }
      setUnreadCount(Number(message.payload?.unread_count) || 0);
    }

    if (message.event === "notification.read") {
      const id = message.payload?.id;
      setNotifications((current) =>
        current.map((item) =>
          item.id === id ? { ...item, is_read: true, read_at: new Date().toISOString() } : item,
        ),
      );
      setUnreadCount(Number(message.payload?.unread_count) || 0);
    }

    if (message.event === "notification.read_all") {
      setNotifications((current) =>
        current.map((item) => ({
          ...item,
          is_read: true,
          read_at: item.read_at || new Date().toISOString(),
        })),
      );
      setUnreadCount(0);
    }
  });

  const hasUnread = unreadCount > 0;
  const visibleCount = useMemo(() => Math.min(unreadCount, 99), [unreadCount]);

  const markRead = async (id) => {
    try {
      const res = await instance.post(`notifications/${id}/mark-read/`);
      setNotifications((current) =>
        current.map((item) =>
          item.id === id ? { ...item, is_read: true, read_at: new Date().toISOString() } : item,
        ),
      );
      setUnreadCount(Number(res.data?.unread_count) || 0);
    } catch {
      // The websocket will correct local state on the next event.
    }
  };

  const markAllRead = async () => {
    try {
      await instance.post("notifications/mark-all-read/");
      setUnreadCount(0);
      setNotifications((current) =>
        current.map((item) => ({
          ...item,
          is_read: true,
          read_at: item.read_at || new Date().toISOString(),
        })),
      );
    } catch {
      // Keep the current state if the API rejects the action.
    }
  };

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="relative inline-flex h-10 w-10 items-center justify-center rounded-lg text-(--muted) transition hover:bg-(--hover) hover:text-(--text)"
        aria-label="Notifications"
        title="Notifications"
      >
        <Bell className="h-5 w-5" />
        {hasUnread && (
          <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
            {visibleCount}
          </span>
        )}
      </button>

      {open && (
        <>
          <button
            type="button"
            aria-label="Close notifications"
            className="fixed inset-0 z-[80] cursor-default"
            onClick={() => setOpen(false)}
          />
          <div className="absolute right-0 z-[90] mt-3 w-[min(24rem,calc(100vw-1.5rem))] overflow-hidden rounded-xl border border-(--border) bg-(--card) shadow-2xl shadow-black/15">
            <div className="flex items-center justify-between border-b border-(--border) px-4 py-3">
              <div>
                <h2 className="text-sm font-semibold text-(--text)">Notifications</h2>
                <p className="text-xs text-(--muted)">{unreadCount} unread</p>
              </div>
              <button
                type="button"
                onClick={markAllRead}
                className="inline-flex h-8 items-center gap-1.5 rounded-lg px-2.5 text-xs font-medium text-(--muted) hover:bg-(--hover) hover:text-(--text)"
              >
                <CheckCheck className="h-3.5 w-3.5" />
                Read all
              </button>
            </div>

            <div className="max-h-96 overflow-y-auto p-2">
              {notifications.length === 0 ? (
                <div className="px-3 py-8 text-center text-sm text-(--muted)">
                  No notifications
                </div>
              ) : (
                notifications.map((item) => (
                  <div
                    key={item.id}
                    className={`rounded-lg px-3 py-3 text-sm ${
                      item.is_read ? "text-(--muted)" : "bg-(--primary)/10 text-(--text)"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="font-semibold">{item.title}</p>
                        {item.message && (
                          <p className="mt-1 text-xs leading-5 text-(--muted)">
                            {item.message}
                          </p>
                        )}
                        <p className="mt-2 text-[11px] text-(--muted)">
                          {formatTime(item.created_at)}
                        </p>
                      </div>
                      {!item.is_read && (
                        <button
                          type="button"
                          onClick={() => markRead(item.id)}
                          className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-md hover:bg-(--hover)"
                          title="Mark as read"
                        >
                          <Check className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

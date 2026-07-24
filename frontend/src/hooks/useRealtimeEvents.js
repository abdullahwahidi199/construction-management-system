import { useEffect, useRef } from "react";
import instance from "../api/axiosInstance";
import { useAuth } from "../auth/AuthContext";

const subscribers = new Set();
let socket = null;
let activeToken = null;
let reconnectTimer = null;
let reconnectAttempts = 0;

function websocketUrl(token) {
  const base = new URL(instance.defaults.baseURL || "http://127.0.0.1:8000/api/");
  base.protocol = base.protocol === "https:" ? "wss:" : "ws:";
  base.pathname = "/ws/notifications/";
  base.search = `token=${encodeURIComponent(token)}`;
  return base.toString();
}

function closeSocket() {
  if (reconnectTimer) {
    window.clearTimeout(reconnectTimer);
    reconnectTimer = null;
  }
  if (socket) {
    socket.onopen = null;
    socket.onmessage = null;
    socket.onclose = null;
    socket.onerror = null;
    socket.close();
    socket = null;
  }
}

function connect(token) {
  if (!token) return;
  if (
    socket &&
    activeToken === token &&
    [WebSocket.CONNECTING, WebSocket.OPEN].includes(socket.readyState)
  ) {
    return;
  }

  closeSocket();
  activeToken = token;
  socket = new WebSocket(websocketUrl(token));

  socket.onopen = () => {
    reconnectAttempts = 0;
  };

  socket.onmessage = (event) => {
    try {
      const message = JSON.parse(event.data);
      subscribers.forEach((subscriber) => subscriber(message));
    } catch {
      // Ignore malformed realtime frames.
    }
  };

  socket.onclose = () => {
    socket = null;
    if (subscribers.size === 0 || !activeToken) return;
    reconnectAttempts += 1;
    const delay = Math.min(1000 * reconnectAttempts, 5000);
    reconnectTimer = window.setTimeout(() => connect(activeToken), delay);
  };
}

export default function useRealtimeEvents(onMessage) {
  const { token } = useAuth();
  const callbackRef = useRef(onMessage);

  useEffect(() => {
    callbackRef.current = onMessage;
  }, [onMessage]);

  useEffect(() => {
    if (!token) return undefined;

    const subscriber = (message) => callbackRef.current?.(message);
    subscribers.add(subscriber);
    connect(token);

    return () => {
      subscribers.delete(subscriber);
      if (subscribers.size === 0) {
        closeSocket();
        activeToken = null;
      }
    };
  }, [token]);
}

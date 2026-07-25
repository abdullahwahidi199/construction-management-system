import React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";

const realtime = vi.hoisted(() => ({
  callback: null,
}));

const api = vi.hoisted(() => ({
  get: vi.fn(),
  post: vi.fn(),
}));

vi.mock("../../api/axiosInstance", () => ({
  default: api,
}));

vi.mock("../../hooks/useRealtimeEvents", () => ({
  default: (callback) => {
    realtime.callback = callback;
  },
}));

import NotificationBell from "./NotificationBell";

describe("NotificationBell", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    realtime.callback = null;
    api.get.mockImplementation((url) => {
      if (url === "notifications/unread-count/") {
        return Promise.resolve({ data: { unread_count: 2 } });
      }
      return Promise.resolve({
        data: [
          {
            id: 1,
            title: "Expense submitted",
            message: "Needs approval",
            is_read: false,
            created_at: "2026-01-01T00:00:00Z",
          },
        ],
      });
    });
  });

  it("loads badge count and opens notification menu", async () => {
    render(<NotificationBell />);

    await waitFor(() => expect(screen.getByText("2")).toBeInTheDocument());
    fireEvent.click(screen.getByRole("button", { name: "Notifications" }));

    expect(screen.getByText("Expense submitted")).toBeInTheDocument();
    expect(screen.getByText("2 unread")).toBeInTheDocument();
  });

  it("marks a notification read and updates unread count", async () => {
    api.post.mockResolvedValueOnce({ data: { unread_count: 1 } });
    render(<NotificationBell />);

    await waitFor(() => expect(screen.getByText("2")).toBeInTheDocument());
    fireEvent.click(screen.getByRole("button", { name: "Notifications" }));
    fireEvent.click(screen.getByTitle("Mark as read"));

    await waitFor(() => expect(api.post).toHaveBeenCalledWith("notifications/1/mark-read/"));
    expect(screen.getByText("1")).toBeInTheDocument();
  });

  it("applies realtime create/read-all events", async () => {
    render(<NotificationBell />);

    await waitFor(() => expect(realtime.callback).toBeTypeOf("function"));
    await act(async () => {
      realtime.callback({
        event: "notification.created",
        payload: {
          unread_count: 3,
          notification: {
            id: 2,
            title: "Payroll ready",
            message: "",
            is_read: false,
            created_at: "2026-01-02T00:00:00Z",
          },
        },
      });
    });

    fireEvent.click(screen.getByRole("button", { name: "Notifications" }));
    expect(screen.getByText("Payroll ready")).toBeInTheDocument();
    expect(screen.getByText("3 unread")).toBeInTheDocument();

    await act(async () => {
      realtime.callback({ event: "notification.read_all", payload: { unread_count: 0 } });
    });
    await waitFor(() => expect(screen.getByText("0 unread")).toBeInTheDocument());
  });
});

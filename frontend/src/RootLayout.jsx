import React from "react";
import { Outlet } from "react-router-dom";
import RealtimeNotificationCenter from "./components/notifications/RealtimeNotificationCenter";

export default function RootLayout() {
  return (
    <RealtimeNotificationCenter>
      <Outlet />
    </RealtimeNotificationCenter>
  );
}

import React, { useEffect, useState } from "react";
import { Outlet } from "react-router-dom";
import RealtimeNotificationCenter from "./components/notifications/RealtimeNotificationCenter";
import useBodyScrollLock from "./hooks/useBodyScrollLock";

const overlaySelector =
  ".mobile-modal-surface, .mobile-bottom-sheet, [role='dialog'][aria-modal='true']";

export default function RootLayout() {
  const [overlayOpen, setOverlayOpen] = useState(false);

  useEffect(() => {
    const updateOverlayState = () => {
      const activeOverlay = Array.from(
        document.querySelectorAll(overlaySelector),
      ).some((element) => element.getAttribute("aria-hidden") !== "true");
      setOverlayOpen(activeOverlay);
    };

    updateOverlayState();
    const observer = new MutationObserver(updateOverlayState);
    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ["class", "style", "aria-hidden"],
    });

    return () => observer.disconnect();
  }, []);

  useBodyScrollLock(overlayOpen);

  return (
    <RealtimeNotificationCenter>
      <Outlet />
    </RealtimeNotificationCenter>
  );
}

import React, { useEffect, useState } from "react";
import { Outlet } from "react-router-dom";
import RealtimeNotificationCenter from "./components/notifications/RealtimeNotificationCenter";
import useBodyScrollLock from "./hooks/useBodyScrollLock";

const overlaySelector =
  ".mobile-modal-surface, .mobile-bottom-sheet, [role='dialog'][aria-modal='true']";

function isVisibleOverlay(element) {
  if (element.getAttribute("aria-hidden") === "true") return false;

  const style = window.getComputedStyle(element);
  if (
    style.display === "none" ||
    style.visibility === "hidden" ||
    style.pointerEvents === "none"
  ) {
    return false;
  }

  return element.getClientRects().length > 0;
}

export default function RootLayout() {
  const [overlayOpen, setOverlayOpen] = useState(false);

  useEffect(() => {
    let frameId = 0;

    const updateOverlayState = () => {
      window.cancelAnimationFrame(frameId);
      frameId = window.requestAnimationFrame(() => {
        const activeOverlay = Array.from(
          document.querySelectorAll(overlaySelector),
        ).some(isVisibleOverlay);
        setOverlayOpen(activeOverlay);
      });
    };

    updateOverlayState();
    const observer = new MutationObserver(updateOverlayState);
    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ["class", "style", "aria-hidden"],
    });

    return () => {
      window.cancelAnimationFrame(frameId);
      observer.disconnect();
    };
  }, []);

  useBodyScrollLock(overlayOpen);

  return (
    <RealtimeNotificationCenter>
      <Outlet />
    </RealtimeNotificationCenter>
  );
}

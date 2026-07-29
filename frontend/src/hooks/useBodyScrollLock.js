import { useEffect } from "react";

const activeLocks = new Set();
let previousStyles = null;

function applyScrollLock() {
  if (previousStyles) return;

  previousStyles = {
    htmlOverflow: document.documentElement.style.overflow,
    bodyOverflow: document.body.style.overflow,
  };

  document.documentElement.style.overflow = "hidden";
  document.body.style.overflow = "hidden";
  document.body.dataset.scrollLocked = "true";
}

function releaseScrollLock() {
  if (activeLocks.size > 0 || !previousStyles) return;

  document.documentElement.style.overflow = previousStyles.htmlOverflow;
  document.body.style.overflow = previousStyles.bodyOverflow;
  delete document.body.dataset.scrollLocked;
  previousStyles = null;
}

export default function useBodyScrollLock(locked) {
  useEffect(() => {
    if (!locked || typeof document === "undefined") return undefined;

    const lockId = Symbol("body-scroll-lock");
    activeLocks.add(lockId);
    applyScrollLock();

    return () => {
      activeLocks.delete(lockId);
      releaseScrollLock();
    };
  }, [locked]);
}

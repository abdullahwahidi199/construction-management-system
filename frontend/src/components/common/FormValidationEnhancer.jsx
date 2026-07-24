import { useEffect, useRef } from "react";
import toast from "react-hot-toast";

export default function FormValidationEnhancer() {
  const lastShownRef = useRef(0);

  useEffect(() => {
    const handleInvalid = (event) => {
      const now = Date.now();
      if (now - lastShownRef.current > 800) {
        toast.error("Please check the highlighted fields.");
        lastShownRef.current = now;
      }

      event.target?.scrollIntoView?.({
        behavior: "smooth",
        block: "center",
      });
    };

    document.addEventListener("invalid", handleInvalid, true);
    return () => {
      document.removeEventListener("invalid", handleInvalid, true);
    };
  }, []);

  return null;
}


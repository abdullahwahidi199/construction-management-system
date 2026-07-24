import { useEffect } from "react";
import toast from "react-hot-toast";

const OFFLINE_TOAST_ID = "app-offline";

export default function OfflineNotifier() {
  useEffect(() => {
    const showOffline = () => {
      toast.error("You are currently offline.", {
        id: OFFLINE_TOAST_ID,
        duration: Infinity,
      });
    };

    const showOnline = () => {
      toast.dismiss(OFFLINE_TOAST_ID);
      toast.success("Connection restored.");
    };

    if (!navigator.onLine) showOffline();

    window.addEventListener("offline", showOffline);
    window.addEventListener("online", showOnline);

    return () => {
      window.removeEventListener("offline", showOffline);
      window.removeEventListener("online", showOnline);
    };
  }, []);

  return null;
}


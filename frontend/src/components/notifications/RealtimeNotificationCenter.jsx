import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { CheckCircle2, X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import instance from "../../api/axiosInstance";
import { useAuth } from "../../auth/AuthContext";
import useRealtimeEvents from "../../hooks/useRealtimeEvents";

const RealtimeNotificationContext = createContext({
  pendingExpenseApprovals: 0,
});

const TOAST_TIMEOUT_MS = 12000;

function canApproveExpenses(permissions = []) {
  return permissions.includes("*") || permissions.includes("expenses.approve");
}

function formatAmount(payload) {
  const value = Number(payload?.amount || 0);
  const currency = payload?.currency || "";
  return `${currency} ${value.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function formatTime(value) {
  if (!value) return "";
  return new Date(value).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function useRealtimeNotifications() {
  return useContext(RealtimeNotificationContext);
}

export default function RealtimeNotificationCenter({ children }) {
  const { permissions = [], user } = useAuth();
  const navigate = useNavigate();
  const [toasts, setToasts] = useState([]);
  const [pendingExpenseApprovals, setPendingExpenseApprovals] = useState(0);
  const seenEventsRef = useRef(new Set());
  const audioRef = useRef(null);
  const audioUnlockedRef = useRef(false);
  const pendingBlockedSoundRef = useRef(false);
  const toastTimeoutsRef = useRef(new Map());
  const approveAllowed = canApproveExpenses(permissions);

  useEffect(() => {
    audioRef.current = new Audio("/notification.mp3");
    audioRef.current.preload = "auto";

    const unlockAudio = () => {
      if (audioUnlockedRef.current || !audioRef.current) return;
      audioRef.current
        .play()
        .then(() => {
          audioRef.current.pause();
          audioRef.current.currentTime = 0;
          audioUnlockedRef.current = true;
          window.removeEventListener("pointerdown", unlockAudio);
          window.removeEventListener("keydown", unlockAudio);
          if (pendingBlockedSoundRef.current) {
            pendingBlockedSoundRef.current = false;
            audioRef.current.play().catch(() => {
              pendingBlockedSoundRef.current = true;
            });
          }
        })
        .catch(() => {
          audioUnlockedRef.current = false;
        });
    };

    window.addEventListener("pointerdown", unlockAudio);
    window.addEventListener("keydown", unlockAudio);

    return () => {
      window.removeEventListener("pointerdown", unlockAudio);
      window.removeEventListener("keydown", unlockAudio);
      audioRef.current?.pause();
      audioRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (!approveAllowed) {
      setPendingExpenseApprovals(0);
      return;
    }

    let active = true;
    instance
      .get("expenses/approval-summary/")
      .then((res) => {
        if (active) {
          setPendingExpenseApprovals(Number(res.data?.pending) || 0);
        }
      })
      .catch(() => {
        if (active) setPendingExpenseApprovals(0);
      });

    return () => {
      active = false;
    };
  }, [approveAllowed]);

  const removeToast = useCallback((id) => {
    const timeoutId = toastTimeoutsRef.current.get(id);
    if (timeoutId) {
      window.clearTimeout(timeoutId);
      toastTimeoutsRef.current.delete(id);
    }
    setToasts((current) => current.filter((toast) => toast.id !== id));
  }, []);

  useEffect(
    () => () => {
      toastTimeoutsRef.current.forEach((timeoutId) => {
        window.clearTimeout(timeoutId);
      });
      toastTimeoutsRef.current.clear();
    },
    [],
  );

  const openToastAction = useCallback(
    (toast) => {
      removeToast(toast.id);
      if (toast.actionPath) {
        navigate(toast.actionPath);
      }
    },
    [navigate, removeToast],
  );

  const playApprovalSound = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.currentTime = 0;
    audio.play().catch(() => {
      audioUnlockedRef.current = false;
      pendingBlockedSoundRef.current = true;
    });
  }, []);

  const pushToast = useCallback(
    (toast) => {
      const nextToast = {
        ...toast,
        id: toast.id || `notification:${Date.now()}`,
      };

      setToasts((current) => {
        const next = [nextToast, ...current].slice(0, 5);
        const nextIds = new Set(next.map((item) => item.id));
        current.forEach((item) => {
          if (!nextIds.has(item.id)) {
            const timeoutId = toastTimeoutsRef.current.get(item.id);
            if (timeoutId) window.clearTimeout(timeoutId);
            toastTimeoutsRef.current.delete(item.id);
          }
        });
        return next;
      });
      const timeoutId = window.setTimeout(
        () => removeToast(nextToast.id),
        TOAST_TIMEOUT_MS,
      );
      toastTimeoutsRef.current.set(nextToast.id, timeoutId);
    },
    [removeToast],
  );

  useRealtimeEvents((message) => {
    if (!approveAllowed) return;

    const payload = message.payload || {};
    const eventId = payload.id || `${message.event}:${payload.expense_id}`;
    const isOwnExpense = payload.created_by && user?.id === payload.created_by;

    if (message.event === "expense.approval.request") {
      if (isOwnExpense) return;
      if (seenEventsRef.current.has(eventId)) return;
      seenEventsRef.current.add(eventId);

      setPendingExpenseApprovals((count) => count + 1);
      playApprovalSound();
      pushToast({
        id: eventId,
        title: "New Expense Approval Request",
        primaryText: `Expense #${payload.serial_number} - ${
          payload.project_name || "-"
        }`,
        secondaryText: `Submitted by ${
          payload.created_by_name || "-"
        } - ${formatAmount(payload)} - ${formatTime(payload.created_at)}`,
        actionLabel: "Review",
        actionPath: `/manager/expense-approvals?expense=${payload.expense_id}`,
      });
      return;
    }

    if (message.event === "expense.approval") {
      if (payload.event === "approved" || payload.event === "rejected") {
        if (seenEventsRef.current.has(eventId)) return;
        seenEventsRef.current.add(eventId);
        setPendingExpenseApprovals((count) => Math.max(0, count - 1));
      }
    }
  });

  const contextValue = useMemo(
    () => ({ pendingExpenseApprovals }),
    [pendingExpenseApprovals],
  );

  return (
    <RealtimeNotificationContext.Provider value={contextValue}>
      {children}
      <div className="fixed inset-x-3 bottom-[calc(5rem+var(--safe-bottom))] z-[200] flex flex-col gap-3 sm:inset-x-auto sm:right-4 sm:top-4 sm:bottom-auto sm:w-[min(24rem,calc(100vw-2rem))]">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className="overflow-hidden rounded-xl border border-amber-300/60 bg-[var(--card)] shadow-2xl shadow-black/20 ring-1 ring-amber-400/30"
          >
            <button
              type="button"
              onClick={() => openToastAction(toast)}
              className="block w-full p-4 text-left hover:bg-[var(--hover)]"
            >
              <div className="flex items-start gap-3">
                <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-amber-500/15 text-amber-600">
                  <CheckCircle2 className="h-5 w-5" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-bold text-[var(--text)]">
                    {toast.title}
                  </span>
                  <span className="mt-1 block text-sm text-[var(--text)]">
                    {toast.primaryText}
                  </span>
                  <span className="mt-1 block text-xs text-[var(--muted)]">
                    {toast.secondaryText}
                  </span>
                </span>
              </div>
            </button>
            <div className="flex items-center justify-end gap-2 border-t border-[var(--border)] px-3 py-2">
              <button
                type="button"
                onClick={() => removeToast(toast.id)}
                className="inline-flex min-h-10 items-center gap-1.5 rounded-lg px-2.5 text-xs font-medium text-[var(--muted)] hover:bg-[var(--hover)] hover:text-[var(--text)]"
              >
                <X className="h-3.5 w-3.5" />
                Close
              </button>
              <button
                type="button"
                onClick={() => openToastAction(toast)}
                className="inline-flex min-h-10 items-center rounded-lg bg-[var(--primary)] px-3 text-xs font-semibold text-white hover:opacity-90"
              >
                {toast.actionLabel || "Open"}
              </button>
            </div>
          </div>
        ))}
      </div>
    </RealtimeNotificationContext.Provider>
  );
}

import React, { useEffect, useMemo, useState } from "react";
import { CalendarCheck, HandCoins, HardHat, Wallet } from "lucide-react";
import WorkersList from "../dailyWorkers/WorkerList";
import WorkerBulkAttendance from "../dailyWorkers/WorkerBulkAttendance";
import WorkerPayrollManager from "../dailyWorkers/WorkerPayrollManager";
import WorkerAdvancesManager from "../dailyWorkers/WorkerAdvancesManager";
import { useLanguage } from "../../hooks/useLanguage";
import { useAuth } from "../../auth/AuthContext";
import { hasAnyPermission } from "../../../utils/permissions";

function DailyWorkersLayout() {
  const [activeTab, setActiveTab] = useState("workers");
  const { t } = useLanguage();
  const { permissions } = useAuth();

  const tabs = useMemo(
    () =>
      [
        {
          id: "workers",
          label: t("dailyWorkers.tabs.workers", "Workers List"),
          icon: HardHat,
          visible: hasAnyPermission(permissions, [
            "daily_workers.view",
            "daily_workers.create",
            "daily_workers.update",
            "daily_workers.delete",
          ]),
        },
        {
          id: "attendance",
          label: t("dailyWorkers.tabs.attendance", "Daily Attendance"),
          icon: CalendarCheck,
          visible: hasAnyPermission(permissions, [
            "daily_worker_attendance.view",
            "daily_worker_attendance.create",
            "daily_worker_attendance.update",
            "daily_worker_attendance.delete",
          ]),
        },
        {
          id: "advances",
          label: t("dailyWorkers.tabs.advances", "Advances"),
          icon: HandCoins,
          visible: hasAnyPermission(permissions, [
            "worker_advances.view",
            "worker_advances.create",
            "worker_advances.update",
            "worker_advances.delete",
          ]),
        },
        {
          id: "payroll",
          label: t("dailyWorkers.tabs.payroll", "Payroll Management"),
          icon: Wallet,
          visible: hasAnyPermission(permissions, [
            "daily_worker_payroll.view",
            "daily_worker_payroll.create",
            "daily_worker_payroll.update",
            "daily_worker_payroll.delete",
          ]),
        },
      ].filter((tab) => tab.visible),
    [permissions, t],
  );

  useEffect(() => {
    if (!tabs.some((tab) => tab.id === activeTab)) {
      setActiveTab(tabs[0]?.id || "");
    }
  }, [activeTab, tabs]);

  return (
    <div
      className="min-h-screen"
      style={{ backgroundColor: "var(--bg)", color: "var(--text)" }}
    >
      <header
        className="border-b"
        style={{ borderColor: "var(--border)", backgroundColor: "var(--card)" }}
      >
        <div className="max-w-9xl mx-auto px-4 py-4 sm:px-6 lg:px-8">
          <h1 className="break-words text-xl font-bold sm:text-2xl">
            {t("dailyWorkers.title", "Daily Workers Management")}
          </h1>
          <p className="break-words text-sm" style={{ color: "var(--muted)" }}>
            {t(
              "dailyWorkers.subtitle",
              "Manage site laborers, track daily attendance, and auto-generate payrolls",
            )}
          </p>
        </div>
      </header>

      <nav
        className="border-b"
        style={{ borderColor: "var(--border)", backgroundColor: "var(--card)" }}
      >
        <div className="max-w-9xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 gap-2 py-2 min-[360px]:grid-cols-2 md:flex md:flex-wrap md:gap-1">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className="inline-flex min-h-11 min-w-0 items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-all md:px-4"
                  style={{
                    backgroundColor:
                      activeTab === tab.id ? "var(--primary)" : "transparent",
                    color: activeTab === tab.id ? "#fff" : "var(--text)",
                  }}
                >
                  <Icon className="h-4 w-4" />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>
      </nav>

      <main className="max-w-9xl mx-auto px-4 py-5 sm:px-6 sm:py-8 lg:px-8">
        {tabs.length === 0 && (
          <div
            className="rounded-lg border p-6 text-sm"
            style={{
              borderColor: "var(--border)",
              backgroundColor: "var(--card)",
            }}
          >
            {t(
              "dailyWorkers.noPermission",
              "You do not have permission to access daily worker records.",
            )}
          </div>
        )}
        {activeTab === "workers" && <WorkersList />}
        {activeTab === "attendance" && <WorkerBulkAttendance />}
        {activeTab === "advances" && <WorkerAdvancesManager />}
        {activeTab === "payroll" && <WorkerPayrollManager />}
      </main>
    </div>
  );
}

export default DailyWorkersLayout;

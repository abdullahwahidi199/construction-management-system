import React, { useState } from "react";
import WorkersList from "../dailyWorkers/WorkerList";
import WorkerBulkAttendance from "../dailyWorkers/WorkerBulkAttendance";
import WorkerPayrollManager from "../dailyWorkers/WorkerPayrollManager";
import { useLanguage } from "../../hooks/useLanguage";
function DailyWorkersLayout() {
  const [activeTab, setActiveTab] = useState("workers");
  const { t } = useLanguage();

  const tabs = [
    {
      id: "workers",
      label: t("dailyWorkers.tabs.workers", "Workers List"),
      icon: "👷",
    },
    {
      id: "attendance",
      label: t("dailyWorkers.tabs.attendance", "Daily Attendance"),
      icon: "📋",
    },
    {
      id: "payroll",
      label: t("dailyWorkers.tabs.payroll", "Payroll Management"),
      icon: "💵",
    },
  ];

  return (
    <div
      className="min-h-screen"
      style={{ backgroundColor: "var(--bg)", color: "var(--text)" }}
    >
      {/* Header */}
      <header
        className="border-b"
        style={{ borderColor: "var(--border)", backgroundColor: "var(--card)" }}
      >
        <div className="max-w-9xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <h1 className="text-2xl font-bold">
            {t("dailyWorkers.title", "Daily Workers Management")}
          </h1>
          <p className="text-sm" style={{ color: "var(--muted)" }}>
            {t(
              "dailyWorkers.subtitle",
              "Manage site laborers, track daily attendance, and auto-generate payrolls",
            )}
          </p>
        </div>
      </header>

      {/* Navigation Tabs */}
      <nav
        className="border-b"
        style={{ borderColor: "var(--border)", backgroundColor: "var(--card)" }}
      >
        <div className="max-w-9xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-1 py-2">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className="px-4 py-2 rounded-lg text-sm font-medium transition-all"
                style={{
                  backgroundColor:
                    activeTab === tab.id ? "var(--primary)" : "transparent",
                  color: activeTab === tab.id ? "#fff" : "var(--text)",
                }}
              >
                <span className="mr-2">{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-9xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === "workers" && <WorkersList />}
        {activeTab === "attendance" && <WorkerBulkAttendance />}
        {activeTab === "payroll" && <WorkerPayrollManager />}
      </main>
    </div>
  );
}

export default DailyWorkersLayout;

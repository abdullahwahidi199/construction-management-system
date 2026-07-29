import React, { useState } from "react";
import AttendanceList from "./AttendanceList";
import BulkAttendance from "./BulkAttendance";
import DailyAttendance from "./DailyAttendance";
import MonthlySummary from "./MonthlySummary";
import { useLanguage } from "../../../hooks/useLanguage";
function AttendanceLayout() {
  const [activeTab, setActiveTab] = useState("list");
  const { t } = useLanguage();

  const tabs = [
    { id: "list", label: t("AttendanceLayout.tabs.list"), icon: "📋" },
    { id: "bulk", label: t("AttendanceLayout.tabs.bulk"), icon: "👥" },
    { id: "daily", label: t("AttendanceLayout.tabs.daily"), icon: "📅" },
    { id: "summary", label: t("AttendanceLayout.tabs.summary"), icon: "📊" },
  ];

  return (
    <div
      className="min-h-0"
      style={{ backgroundColor: "var(--bg)", color: "var(--text)" }}
    >
      {/* Header */}
      <header
        className="border-b"
        style={{ borderColor: "var(--border)", backgroundColor: "var(--card)" }}
      >
        <div className="max-w-9xl mx-auto px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex min-w-0 items-center justify-between">
            <div className="min-w-0">
              <h1 className="break-words text-xl font-bold sm:text-2xl">
                {t("AttendanceLayout.title")}
              </h1>
              <p className="break-words text-sm" style={{ color: "var(--muted)" }}>
                {t("AttendanceLayout.subtitle")}
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation Tabs */}
      <nav
        className="border-b"
        style={{ borderColor: "var(--border)", backgroundColor: "var(--card)" }}
      >
        <div className="max-w-9xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 gap-2 py-2 min-[360px]:grid-cols-2 md:flex md:flex-wrap md:gap-1">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className="inline-flex min-h-11 min-w-0 items-center justify-center rounded-lg px-3 py-2 text-sm font-medium transition-all md:px-4"
                style={{
                  backgroundColor:
                    activeTab === tab.id ? "var(--primary)" : "transparent",
                  color: activeTab === tab.id ? "#fff" : "var(--text)",
                }}
              >
                <span className="mr-2 shrink-0">{tab.icon}</span>
                <span className="min-w-0 truncate">{tab.label}</span>
              </button>
            ))}
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-9xl mx-auto px-4 py-5 sm:px-6 sm:py-8 lg:px-8">
        {activeTab === "list" && <AttendanceList />}
        {activeTab === "bulk" && <BulkAttendance />}
        {activeTab === "daily" && <DailyAttendance />}
        {activeTab === "summary" && <MonthlySummary />}
      </main>
    </div>
  );
}

export default AttendanceLayout;

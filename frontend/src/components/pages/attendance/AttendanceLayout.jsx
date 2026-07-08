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
      className="min-h-screen"
      style={{ backgroundColor: "var(--bg)", color: "var(--text)" }}
    >
      {/* Header */}
      <header
        className="border-b"
        style={{ borderColor: "var(--border)", backgroundColor: "var(--card)" }}
      >
        <div className="max-w-9xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">
                {t("AttendanceLayout.title")}
              </h1>
              <p className="text-sm" style={{ color: "var(--muted)" }}>
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
        {activeTab === "list" && <AttendanceList />}
        {activeTab === "bulk" && <BulkAttendance />}
        {activeTab === "daily" && <DailyAttendance />}
        {activeTab === "summary" && <MonthlySummary />}
      </main>
    </div>
  );
}

export default AttendanceLayout;

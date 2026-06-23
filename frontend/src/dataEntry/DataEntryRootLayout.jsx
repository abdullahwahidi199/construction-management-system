import React from "react";
import { NavLink, Outlet } from "react-router-dom";
import { ClipboardPenLine, Receipt, CalendarCheck, LogOut } from "lucide-react";
import { useAuth } from "../auth/AuthContext";
import LanguageSwitcher from "../components/LanguageSwitcher";
import ThemeToggle from "../components/ui/ToggleButton";
import { useLanguage } from "../hooks/useLanguage";

export default function DataEntryRootLayout() {
  const { logout, user } = useAuth();
  const { t } = useLanguage();
  const links = [
    { label: t("dataEntry.nav.dashboard"), to: "/data-entry/dashboard", icon: ClipboardPenLine },
    { label: t("dataEntry.nav.expenses"), to: "/data-entry/expenses", icon: Receipt },
    { label: t("dataEntry.nav.attendance"), to: "/data-entry/attendance", icon: CalendarCheck },
  ];

  return (
    <div className="min-h-screen bg-(--bg) text-(--text)">
      <nav className="sticky top-0 z-50 border-b border-(--border) bg-(--bg)/90 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-9xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2 font-bold">
            <ClipboardPenLine className="h-5 w-5 text-(--primary)" />
            {t("dataEntry.title")}
          </div>
          <div className="hidden items-center gap-1 md:flex">
            {links.map(({ label, to, icon: Icon }) => (
              <NavLink key={to} to={to} className={({ isActive }) => `inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm ${isActive ? "bg-(--primary)/10 text-(--primary)" : "text-(--muted) hover:bg-(--hover)"}`}>
                <Icon className="h-4 w-4" />
                {label}
              </NavLink>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <span className="hidden text-sm text-(--muted) sm:inline">{user?.username}</span>
            <LanguageSwitcher />
            <ThemeToggle />
            <button onClick={logout} className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-(--muted) hover:bg-(--hover)" title={t("auth.logout")}>
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </nav>
      <main className="mx-auto max-w-9xl px-4 py-6 sm:px-6 lg:px-8">
        <Outlet />
      </main>
    </div>
  );
}

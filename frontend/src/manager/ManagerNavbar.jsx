import React, { useState } from "react";
import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  FolderKanban,
  Handshake,
  Receipt,
  Users,
  CalendarCheck,
  Menu,
  X,
  Sun,
  Moon,
} from "lucide-react";
import ThemeToggle from "../components/ui/ToggleButton";
import { useLanguage } from "../hooks/useLanguage";
import LanguageSwitcher from "../components/LanguageSwitcher";

export default function ManagerNavbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { t } = useLanguage();

  const options = [
    {
      name: t("managerNavbar.dashboard"),
      path: "/manager/dashboard",
      icon: LayoutDashboard,
    },
    {
      name: t("managerNavbar.projects"),
      path: "/manager/projects",
      icon: FolderKanban,
    },
    {
      name: t("managerNavbar.subContractors"),
      path: "/manager/subcontractors",
      icon: Handshake,
    },
    {
      name: t("managerNavbar.contracts"),
      path: "/manager/contracts",
      icon: Handshake,
    },
    {
      name: t("managerNavbar.expenses"),
      path: "/manager/expenses",
      icon: Receipt,
    },
    {
      name: t("managerNavbar.employees"),
      path: "/manager/employees",
      icon: Users,
    },
    {
      name: t("managerNavbar.payrolls"),
      path: "/manager/payrolls",
      icon: Users,
    },
    {
      name: t("managerNavbar.attendance"),
      path: "/manager/attendance",
      icon: CalendarCheck,
    },
  ];

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-(--border) bg-(--bg)/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-9xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* ── Logo / Brand ───────────────────────────── */}
        <div className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-(--primary)">
            <LayoutDashboard className="h-5 w-5 text-white" />
          </div>
          <span className="text-lg font-bold tracking-tight text-(--text)">
            {t("managerNavbar.brand")}
          </span>
        </div>
        <LanguageSwitcher />
        {/* ── Desktop Links ──────────────────────────── */}
        <ul className="hidden items-center gap-1 md:flex">
          {options.map(({ name, path, icon: Icon }) => (
            <li key={name}>
              <NavLink
                to={path}
                className={({ isActive }) =>
                  `group flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-200 ${
                    isActive
                      ? "bg-(--primary)/10 text-(--primary)"
                      : "text-(--muted) hover:bg-(--hover) hover:text-(--text)"
                  }`
                }
              >
                <Icon
                  className="h-4 w-4 shrink-0 transition-transform duration-200 group-hover:scale-110"
                  strokeWidth={1.8}
                />
                <span>{name}</span>
              </NavLink>
            </li>
          ))}
        </ul>

        {/* ── Right Actions ──────────────────────────── */}
        <div className="flex items-center gap-2">
          <ThemeToggle />
          {/* Avatar */}
          <div className="hidden h-9 w-9 items-center justify-center rounded-full bg-(--primary) text-sm font-semibold text-white sm:flex">
            M
          </div>

          {/* Mobile Hamburger */}
          <button
            onClick={() => setMobileOpen((prev) => !prev)}
            className="flex h-9 w-9 items-center justify-center rounded-lg text-(--muted) transition-colors hover:bg-(--hover) hover:text-(--text) md:hidden"
            aria-label="Toggle menu"
          >
            {mobileOpen ? (
              <X className="h-5 w-5" strokeWidth={1.8} />
            ) : (
              <Menu className="h-5 w-5" strokeWidth={1.8} />
            )}
          </button>
        </div>
      </div>

      {/* ── Mobile Drawer ──────────────────────────── */}
      <div
        className={`overflow-hidden transition-all duration-300 ease-in-out md:hidden ${
          mobileOpen ? "max-h-96 border-t border-(--border)" : "max-h-0"
        }`}
      >
        <ul className="flex flex-col gap-1 px-4 py-3">
          {options.map(({ name, path, icon: Icon }) => (
            <li key={name}>
              <NavLink
                to={path}
                onClick={() => setMobileOpen(false)}
                className={({ isActive }) =>
                  `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200 ${
                    isActive
                      ? "bg-(--primary)/10 text-(--primary)"
                      : "text-(--muted) hover:bg-(--hover) hover:text-(--text)"
                  }`
                }
              >
                <Icon className="h-5 w-5 shrink-0" strokeWidth={1.8} />
                <span>{name}</span>
              </NavLink>
            </li>
          ))}
        </ul>
      </div>
    </nav>
  );
}

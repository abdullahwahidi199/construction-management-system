import React from "react";
import { NavLink, Outlet } from "react-router-dom";
import { LayoutDashboard, ScrollText, Settings, ShieldCheck, Users, LogOut } from "lucide-react";
import { useLanguage } from "../hooks/useLanguage";
import LanguageSwitcher from "../components/LanguageSwitcher";
import ThemeToggle from "../components/ui/ToggleButton";
import { useAuth } from "../auth/AuthContext";
import { hasAnyPermission } from "../auth/roles";

export default function AdminRootLayout() {
  const { t } = useLanguage();
  const { logout, user } = useAuth();
  const permissions = user?.permissions || [];
  const links = [
    { label: t("admin.nav.dashboard"), to: "/admin/dashboard", icon: LayoutDashboard },
    {
      label: t("admin.nav.users"),
      to: "/admin/users",
      icon: Users,
      permissions: ["users.view", "users.create", "users.update", "users.delete"],
    },
    {
      label: t("admin.nav.permissions"),
      to: "/admin/permissions",
      icon: ShieldCheck,
      permissions: [
        "roles.view",
        "roles.create",
        "roles.update",
        "roles.delete",
        "permissions.view",
        "permissions.manage",
      ],
    },
    {
      label: "Audit Logs",
      to: "/admin/audit-logs",
      icon: ScrollText,
      permissions: ["audit_logs.view"],
    },
    {
      label: "Settings",
      to: "/admin/settings",
      icon: Settings,
      permissions: ["settings.view", "settings.manage"],
    },
  ].filter((link) => !link.permissions || hasAnyPermission(permissions, link.permissions));

  return (
    <div className="min-h-screen bg-(--bg) text-(--text)">
      <nav className="sticky top-0 z-50 border-b border-(--border) bg-(--bg)/90 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-9xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2 font-bold">
            <ShieldCheck className="h-5 w-5 text-(--primary)" />
            {t("admin.title")}
          </div>
          <div className="hidden items-center gap-1 md:flex">
            {links.map(({ label, to, icon: Icon }) => (
              <NavLink
                key={to}
                to={to}
                className={({ isActive }) =>
                  `inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm ${
                    isActive ? "bg-(--primary)/10 text-(--primary)" : "text-(--muted) hover:bg-(--hover)"
                  }`
                }
              >
                <Icon className="h-4 w-4" />
                {label}
              </NavLink>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <span className="hidden text-sm text-(--muted) sm:inline">{user?.username}</span>
            <LanguageSwitcher />
            <ThemeToggle />
            <button
              onClick={logout}
              className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-(--muted) hover:bg-(--hover)"
              title={t("auth.logout")}
            >
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

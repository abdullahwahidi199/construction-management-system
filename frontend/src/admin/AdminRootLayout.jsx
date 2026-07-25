import { LayoutDashboard, ScrollText, Settings, ShieldCheck, Users } from "lucide-react";
import { useLanguage } from "../hooks/useLanguage";
import LanguageSwitcher from "../components/LanguageSwitcher";
import ThemeToggle from "../components/ui/ToggleButton";
import { useAuth } from "../auth/AuthContext";
import { hasAnyPermission } from "../auth/roles";
import ResponsiveAppShell from "../components/navigation/ResponsiveAppShell";

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
    <ResponsiveAppShell
      title={t("admin.title")}
      brandIcon={ShieldCheck}
      links={links}
      user={user}
      logout={logout}
      logoutLabel={t("auth.logout")}
      tools={
        <>
          <LanguageSwitcher />
          <ThemeToggle />
        </>
      }
    />
  );
}

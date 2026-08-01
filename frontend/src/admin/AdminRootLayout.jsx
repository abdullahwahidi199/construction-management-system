import { LayoutDashboard, ScrollText, ShieldCheck, Users } from "lucide-react";
import { useLanguage } from "../hooks/useLanguage";
import { useAuth } from "../auth/AuthContext";
import { hasAnyPermission } from "../auth/roles";
import ResponsiveAppShell from "../components/navigation/ResponsiveAppShell";
import { useCompany } from "../context/CompanyContext";

export default function AdminRootLayout() {
  const { t } = useLanguage();
  const { logout, user } = useAuth();
  const { company } = useCompany();
  const permissions = user?.permissions || [];
  const canOpenSettings = hasAnyPermission(permissions, ["settings.view", "settings.manage"]);
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
  ].filter((link) => !link.permissions || hasAnyPermission(permissions, link.permissions));

  return (
    <ResponsiveAppShell
      title={t("admin.title")}
      brandIcon={ShieldCheck}
      brandName={company.company_name}
      brandLogo={company.company_logo_url}
      brandSubtitle={t("admin.title")}
      links={links}
      settingsTo={canOpenSettings ? "/admin/settings" : undefined}
      settingsLabel="Settings"
      user={user}
      logout={logout}
      logoutLabel={t("auth.logout")}
    />
  );
}

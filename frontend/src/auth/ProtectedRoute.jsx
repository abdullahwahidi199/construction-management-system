import React from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "./AuthContext";
import { hasAnyPermission, homeForUser } from "./roles";
import { useLanguage } from "../hooks/useLanguage";

export function ProtectedRoute({ roles, permissions }) {
  const { initializing, isAuthenticated, role, permissions: userPermissions = [] } = useAuth();
  const location = useLocation();
  const { t } = useLanguage();

  if (initializing) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-(--bg) text-(--text)">
        <div className="flex flex-col items-center gap-3">
          <span className="h-10 w-10 animate-spin rounded-full border-4 border-[var(--border)] border-t-[var(--primary)]" />
          <span className="text-sm text-(--muted)">{t("common.loading")}</span>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  const roleAllowed = !roles?.length || roles.includes(role);
  const permissionAllowed =
    permissions?.length && hasAnyPermission(userPermissions, permissions);

  if (!roleAllowed && !permissionAllowed) {
    return <Navigate to="/unauthorized" replace state={{ from: location }} />;
  }

  return <Outlet />;
}

export function RoleRedirect() {
  const { initializing, isAuthenticated, role, permissions = [] } = useAuth();

  if (initializing) return null;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return <Navigate to={homeForUser(role, permissions)} replace />;
}

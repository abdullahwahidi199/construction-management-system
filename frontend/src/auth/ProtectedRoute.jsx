import React from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "./AuthContext";
import { roleHome } from "./roles";
import { useLanguage } from "../hooks/useLanguage";

export function ProtectedRoute({ roles }) {
  const { initializing, isAuthenticated, role } = useAuth();
  const location = useLocation();
  const { t } = useLanguage();

  if (initializing) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-(--bg) text-(--text)">
        {t("common.loading")}
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  if (roles?.length && !roles.includes(role)) {
    return <Navigate to={roleHome[role] || "/login"} replace />;
  }

  return <Outlet />;
}

export function RoleRedirect() {
  const { initializing, isAuthenticated, role } = useAuth();

  if (initializing) return null;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return <Navigate to={roleHome[role] || "/login"} replace />;
}

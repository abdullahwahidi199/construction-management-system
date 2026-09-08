// components/auth/PermissionWrapper.jsx

import { useAuth } from "./AuthContext";

export default function PermissionWrapper({
  permissions = [],
  children,
  fallback = null,
  requireAll = false,
}) {
  const { permissions: userPermissions = [] } = useAuth();

  const allowed =
    userPermissions.includes("*") || //  admin
    (requireAll
      ? permissions.every((permission) => userPermissions.includes(permission))
      : permissions.some((permission) => userPermissions.includes(permission)));

  return allowed ? children : fallback;
}

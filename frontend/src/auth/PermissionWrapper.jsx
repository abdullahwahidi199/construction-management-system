// components/auth/PermissionWrapper.jsx

import { useAuth } from "./AuthContext";

export default function PermissionWrapper({
  permissions = [],
  children,
  fallback = null,
}) {
  const { permissions: userPermissions = [] } = useAuth();

  const allowed =
    userPermissions.includes("*") || //  admin
    permissions.some((permission) => userPermissions.includes(permission));

  return allowed ? children : fallback;
}

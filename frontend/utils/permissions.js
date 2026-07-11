// utils/permissions.js

export const hasAnyPermission = (permissions, requiredPermissions) => {
  if (permissions.includes("*")) return true;
  return requiredPermissions.some((permission) =>
    permissions.includes(permission),
  );
};

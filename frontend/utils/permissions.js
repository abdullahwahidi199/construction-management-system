// utils/permissions.js

export const hasAnyPermission = (permissions, requiredPermissions) => {
  return requiredPermissions.some((permission) =>
    permissions.includes(permission),
  );
};

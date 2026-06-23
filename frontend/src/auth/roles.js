export const ROLES = {
  ADMIN: "admin",
  MANAGER: "manager",
  DATA_ENTRY: "data_entry",
};

export const roleHome = {
  [ROLES.ADMIN]: "/admin/dashboard",
  [ROLES.MANAGER]: "/manager/dashboard",
  [ROLES.DATA_ENTRY]: "/data-entry/dashboard",
};

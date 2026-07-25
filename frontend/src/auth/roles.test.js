import { describe, expect, it } from "vitest";

import {
  hasAnyPermission,
  homeForUser,
  ROLES,
} from "./roles";

describe("role and permission helpers", () => {
  it("allows wildcard permissions", () => {
    expect(hasAnyPermission(["*"], ["projects.delete"])).toBe(true);
  });

  it("requires at least one matching permission", () => {
    expect(hasAnyPermission(["projects.view"], ["projects.view", "projects.update"])).toBe(true);
    expect(hasAnyPermission(["expenses.view"], ["projects.view"])).toBe(false);
  });

  it("returns fixed homes for built-in roles", () => {
    expect(homeForUser(ROLES.ADMIN, [])).toBe("/admin/dashboard");
    expect(homeForUser(ROLES.MANAGER, [])).toBe("/manager/dashboard");
    expect(homeForUser(ROLES.DATA_ENTRY, [])).toBe("/data-entry/dashboard");
  });

  it("routes custom roles by first allowed permission", () => {
    expect(homeForUser("accountant", ["reports.view"])).toBe("/manager/reports");
    expect(homeForUser("hr", ["users.view"])).toBe("/admin/users");
    expect(homeForUser("laborer", [])).toBe("/login");
  });
});

import React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { act, fireEvent, render, screen, waitFor, within } from "@testing-library/react";

const api = vi.hoisted(() => ({
  get: vi.fn(),
  post: vi.fn(),
  delete: vi.fn(),
}));

const authState = vi.hoisted(() => ({
  permissions: ["roles.create", "roles.delete", "permissions.manage"],
}));

const toast = vi.hoisted(() => ({
  success: vi.fn(),
  error: vi.fn(),
}));

const translate = vi.hoisted(() => (key) =>
  ({
    "admin.permissions.title": "Permissions",
    "admin.permissions.subtitle": "Control access",
    "admin.permissions.rolesShown": "Roles",
    "admin.permissions.count": "Showing",
    "admin.permissions.permissions": "permissions",
    "admin.permissions.searchPlaceholder": "Search permissions",
    "admin.permissions.tipClickBoxes": "Click boxes",
    "admin.permissions.permission": "Permission",
    "admin.permissions.revoke": "Revoke",
    "admin.permissions.grant": "Grant",
    "common.refresh": "Refresh",
    "common.search": "Search",
    "common.clear": "Clear",
    "common.module": "Module",
    "common.all": "All",
    "common.clearFilters": "Clear filters",
    "common.error": "Error",
    "common.retry": "Retry",
    "common.noResults": "No results",
    "common.tryDifferentSearch": "Try another search",
    "common.saving": "Saving",
    "common.remove": "Remove",
  })[key] || key,
);

vi.mock("../api/axiosInstance", () => ({
  default: api,
}));

vi.mock("../auth/AuthContext", () => ({
  useAuth: () => ({ permissions: authState.permissions }),
}));

vi.mock("../hooks/useLanguage", () => ({
  useLanguage: () => ({ t: translate }),
}));

vi.mock("react-hot-toast", () => ({
  default: toast,
}));

import PermissionManagement from "./PermissionManagement";

const roles = [
  { id: 1, value: "admin", label: "Admin", is_system: true },
  { id: 2, value: "manager", label: "Manager", is_system: true },
  { id: 3, value: "site", label: "Site Role", is_system: false },
];

const permissions = [
  { id: 101, name: "View Projects", code: "projects.view", module: "Projects" },
  { id: 102, name: "Create Projects", code: "projects.create", module: "Projects" },
  { id: 201, name: "View Reports", code: "reports.view", module: "Reports" },
  { id: 301, name: "View Users", code: "users.view" },
];

const rolePermissions = [
  { id: 501, role: "admin", permission: 101 },
  { id: 502, role: "admin", permission: 102 },
  { id: 503, role: "manager", permission: 101 },
];

function mockLoads({
  meta = { roles, permissions },
  assignments = { results: rolePermissions },
} = {}) {
  api.get.mockImplementation((endpoint) => {
    if (endpoint === "auth/meta/") return Promise.resolve({ data: meta });
    if (endpoint === "auth/role-permissions/") {
      return Promise.resolve({ data: assignments });
    }
    return Promise.reject(new Error(`Unexpected GET ${endpoint}`));
  });
}

async function renderLoaded() {
  render(<PermissionManagement />);
  expect(await screen.findByRole("heading", { name: "Permissions" })).toBeInTheDocument();
}

describe("PermissionManagement", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    authState.permissions = ["roles.create", "roles.delete", "permissions.manage"];
    mockLoads();
    api.post.mockImplementation((endpoint, payload) =>
      Promise.resolve({
        data: {
          id: 900 + Number(payload?.permission || 0),
          ...payload,
        },
      }),
    );
    api.delete.mockResolvedValue({ data: {} });
  });

  it("renders loading, loaded roles, grouped permissions, badges, collapse controls, and filter states", async () => {
    render(<PermissionManagement />);
    expect(document.querySelector(".animate-pulse")).toBeInTheDocument();
    expect(await screen.findByText("Control access")).toBeInTheDocument();

    expect(screen.getByText("Roles 3")).toBeInTheDocument();
    expect(screen.getByText("Showing 4 permissions")).toBeInTheDocument();
    expect(screen.getAllByText("System")).toHaveLength(2);
    expect(screen.getByText("Custom")).toBeInTheDocument();
    expect(screen.getAllByText("General").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Projects").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Reports").length).toBeGreaterThan(0);

    fireEvent.click(screen.getByRole("button", { name: /projects 2 permissions/i }));
    expect(screen.getByRole("button", { name: /projects 2 permissions/i })).toHaveAttribute(
      "aria-expanded",
      "false",
    );
    fireEvent.click(screen.getByRole("button", { name: "Expand all" }));
    expect(screen.getByRole("button", { name: /projects 2 permissions/i })).toHaveAttribute(
      "aria-expanded",
      "true",
    );
    fireEvent.click(screen.getByRole("button", { name: "Collapse all" }));
    expect(screen.getByRole("button", { name: /reports 1 permissions/i })).toHaveAttribute(
      "aria-expanded",
      "false",
    );
    fireEvent.click(screen.getByRole("button", { name: "Expand all" }));

    fireEvent.change(screen.getByLabelText("Search"), { target: { value: "reports" } });
    expect(screen.queryByText("View Projects")).not.toBeInTheDocument();
    expect(screen.getByText("View Reports")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Clear" }));
    fireEvent.change(screen.getByLabelText("Module"), { target: { value: "General" } });
    expect(screen.getByText("View Users")).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText("Search"), { target: { value: "missing" } });
    expect(screen.getByText("No results")).toBeInTheDocument();
    fireEvent.click(screen.getAllByRole("button", { name: "Clear filters" }).at(-1));
    expect(screen.getByText("View Projects")).toBeInTheDocument();
  });

  it("grants, revokes, and reports errors for individual permissions", async () => {
    await renderLoaded();

    fireEvent.click(screen.getByLabelText("Manager - Create Projects"));
    await waitFor(() =>
      expect(api.post).toHaveBeenCalledWith("auth/role-permissions/", {
        role: "manager",
        permission: 102,
      }),
    );
    expect(screen.getByLabelText("Manager - Create Projects")).toHaveAttribute(
      "aria-pressed",
      "true",
    );

    fireEvent.click(screen.getByLabelText("Admin - View Projects"));
    await waitFor(() =>
      expect(api.delete).toHaveBeenCalledWith("auth/role-permissions/501/"),
    );
    expect(screen.getByLabelText("Admin - View Projects")).toHaveAttribute(
      "aria-pressed",
      "false",
    );

    api.post.mockRejectedValueOnce({ response: { data: { detail: "Denied." } } });
    fireEvent.click(screen.getByLabelText("Site Role - View Reports"));
    expect(await screen.findByText("Denied.")).toBeInTheDocument();
  });

  it("grants and revokes whole permission modules and reloads after module save errors", async () => {
    await renderLoaded();

    fireEvent.click(screen.getByTitle("Site Role - all Projects permissions"));
    await waitFor(() =>
      expect(api.post).toHaveBeenCalledWith("auth/role-permissions/", {
        role: "site",
        permission: 101,
      }),
    );
    expect(api.post).toHaveBeenCalledWith("auth/role-permissions/", {
      role: "site",
      permission: 102,
    });

    fireEvent.click(screen.getByTitle("Admin - all Projects permissions"));
    await waitFor(() =>
      expect(api.delete).toHaveBeenCalledWith("auth/role-permissions/501/"),
    );
    expect(api.delete).toHaveBeenCalledWith("auth/role-permissions/502/");

    api.post.mockRejectedValueOnce({ response: { data: { detail: "Module denied." } } });
    fireEvent.click(screen.getByTitle("Site Role - all Reports permissions"));
    expect(await screen.findByText("Module denied.")).toBeInTheDocument();
    expect(api.get).toHaveBeenCalledTimes(4);
  });

  it("creates custom roles with optional keys and renders saving and API error states", async () => {
    await renderLoaded();

    fireEvent.change(screen.getByPlaceholderText("Site Supervisor"), {
      target: { value: " Quality Lead " },
    });
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Add role" }));
    });
    expect(api.post).toHaveBeenCalledWith("auth/roles/", { label: "Quality Lead" });
    expect(toast.success).toHaveBeenCalledWith("Role created.");

    fireEvent.change(screen.getByPlaceholderText("Site Supervisor"), {
      target: { value: "Safety Lead" },
    });
    fireEvent.change(screen.getByPlaceholderText("site_supervisor"), {
      target: { value: " safety_lead " },
    });
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Add role" }));
    });
    expect(api.post).toHaveBeenCalledWith("auth/roles/", {
      label: "Safety Lead",
      value: "safety_lead",
    });

    let resolveCreate;
    api.post.mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          resolveCreate = resolve;
        }),
    );
    fireEvent.change(screen.getByPlaceholderText("Site Supervisor"), {
      target: { value: "Slow Role" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Add role" }));
    expect(await screen.findByRole("button", { name: "Saving" })).toBeDisabled();
    await act(async () => resolveCreate({ data: {} }));

    api.post.mockRejectedValueOnce({ response: { data: { detail: "Duplicate role." } } });
    fireEvent.change(screen.getByPlaceholderText("Site Supervisor"), {
      target: { value: "Duplicate" },
    });
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Add role" }));
    });
    expect(await screen.findByText("Duplicate role.")).toBeInTheDocument();
  });

  it("deletes custom roles through confirmation and handles delete failures and cancel", async () => {
    await renderLoaded();

    const removeButton = screen.getByRole("button", { name: "Remove" });
    expect(removeButton).toBeInTheDocument();
    expect(screen.getAllByRole("button", { name: "Remove" })).toHaveLength(1);

    fireEvent.click(removeButton);
    expect(screen.getByRole("heading", { name: "Delete role" })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Cancel" }));
    expect(screen.queryByRole("heading", { name: "Delete role" })).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Remove" }));
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Delete" }));
    });
    expect(api.delete).toHaveBeenCalledWith("auth/roles/3/");
    expect(toast.success).toHaveBeenCalledWith("Role deleted.");

    api.delete.mockRejectedValueOnce({ response: { data: { detail: "Role in use." } } });
    fireEvent.click(screen.getByRole("button", { name: "Remove" }));
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Delete" }));
    });
    expect(await screen.findByText("Role in use.")).toBeInTheDocument();
  });

  it("blocks management UI and permission actions for read-only users and supports retry after load failure", async () => {
    authState.permissions = [];
    await renderLoaded();

    expect(screen.queryByRole("button", { name: "Add role" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Remove" })).not.toBeInTheDocument();
    expect(screen.getByLabelText("Manager - Create Projects")).toBeDisabled();
    fireEvent.click(screen.getByLabelText("Manager - Create Projects"));
    expect(api.post).not.toHaveBeenCalled();

    vi.clearAllMocks();
    api.get.mockRejectedValueOnce({ response: { data: { detail: "Load failed." } } });
    render(<PermissionManagement />);
    expect(await screen.findByText("Load failed.")).toBeInTheDocument();
    mockLoads({ assignments: rolePermissions });
    fireEvent.click(screen.getByRole("button", { name: "Retry" }));
    expect(await screen.findByText("Control access")).toBeInTheDocument();
  });
});

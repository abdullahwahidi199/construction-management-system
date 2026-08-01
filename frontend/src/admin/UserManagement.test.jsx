import React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { act, fireEvent, render, screen, waitFor, within } from "@testing-library/react";

const api = vi.hoisted(() => ({
  get: vi.fn(),
  post: vi.fn(),
  patch: vi.fn(),
}));

const hookState = vi.hoisted(() => ({
  postData: vi.fn(),
  creating: false,
  createError: null,
}));

const toast = vi.hoisted(() => ({
  success: vi.fn(),
  error: vi.fn(),
}));

vi.mock("../api/axiosInstance", () => ({
  default: api,
}));

vi.mock("../hooks/usePost", () => ({
  default: () => ({
    postData: hookState.postData,
    loading: hookState.creating,
    error: hookState.createError,
  }),
}));

vi.mock("../hooks/useLanguage", () => ({
  useLanguage: () => ({
    t: (key) =>
      ({
        "admin.users.title": "Users",
        "admin.users.subtitle": "Manage accounts",
        "admin.users.username": "Username",
        "admin.users.email": "Email",
        "admin.users.role": "Role",
        "admin.users.status": "Status",
        "admin.users.actions": "Actions",
        "admin.users.edit": "Edit",
        "admin.users.disable": "Disable",
        "admin.users.enable": "Enable",
        "admin.users.empty": "No users yet",
        "admin.users.create": "Create User",
        "admin.users.update": "Update User",
        "admin.users.changePassword": "Change Password",
        "admin.users.leaveBlankPassword": "Leave blank to keep password",
        "admin.users.newPassword": "New Password",
        "admin.users.confirmNewPassword": "Confirm New Password",
        "admin.users.password": "Password",
        "admin.users.confirmPassword": "Confirm Password",
        "admin.users.errors.username": "Username is required.",
        "admin.users.errors.passwordLength": "Password must be at least 6 characters.",
        "admin.users.errors.passwordMatch": "Passwords do not match.",
        "common.create": "Create",
        "common.active": "Active",
        "common.inactive": "Inactive",
        "common.cancel": "Cancel",
        "common.saving": "Saving",
        "common.error": "Something went wrong.",
      })[key] || key,
  }),
}));

vi.mock("react-hot-toast", () => ({
  default: toast,
}));

import UserManagement from "./UserManagement";

const roles = [
  { value: "admin", label: "Admin" },
  { value: "manager", label: "Manager" },
  { value: "accountant", label: "Accountant" },
];

const users = [
  {
    id: 1,
    username: "amina",
    email: "amina@example.com",
    role: "admin",
    is_active: true,
  },
  {
    id: 2,
    username: "bilal",
    email: "",
    role: "manager",
    is_active: false,
  },
];

function mockSuccessfulLoad({ userPayload = { results: users }, rolePayload = { roles } } = {}) {
  api.get.mockImplementation((endpoint) => {
    if (endpoint === "auth/users/") return Promise.resolve({ data: userPayload });
    if (endpoint === "auth/meta/") return Promise.resolve({ data: rolePayload });
    return Promise.reject(new Error(`Unexpected GET ${endpoint}`));
  });
}

async function renderLoaded() {
  render(<UserManagement />);
  expect(await screen.findByText("Users")).toBeInTheDocument();
}

function desktopTable() {
  return screen.getByRole("table");
}

function modalPanel(name) {
  return screen.getByRole("heading", { name }).closest(".mobile-modal-panel");
}

function modalField(modal, label) {
  return within(modal).getByLabelText(label);
}

describe("UserManagement", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    hookState.postData = vi.fn(() => Promise.resolve({ id: 9 }));
    hookState.creating = false;
    hookState.createError = null;
    api.post.mockResolvedValue({ data: {} });
    api.patch.mockResolvedValue({ data: {} });
    mockSuccessfulLoad();
  });

  it("loads users and metadata, renders active/inactive table rows, hover states, and an empty list", async () => {
    await renderLoaded();

    expect(screen.getByText("Manage accounts")).toBeInTheDocument();
    expect(screen.getAllByText("amina").length).toBeGreaterThan(0);
    expect(screen.getAllByText("bilal").length).toBeGreaterThan(0);
    expect(screen.getAllByText("amina@example.com").length).toBeGreaterThan(0);
    expect(screen.getAllByText("-").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Active").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Inactive").length).toBeGreaterThan(0);

    const row = within(desktopTable()).getByText("amina").closest("tr");
    fireEvent.mouseEnter(row);
    expect(row.style.backgroundColor).toBe("var(--hover)");
    fireEvent.mouseLeave(row);
    expect(row.style.backgroundColor).toBe("transparent");

    const createButton = screen.getByRole("button", { name: /\+ create/i });
    fireEvent.mouseEnter(createButton);
    expect(createButton.style.filter).toBe("brightness(1.1)");
    fireEvent.mouseLeave(createButton);
    expect(createButton.style.filter).toBe("none");

    vi.clearAllMocks();
    mockSuccessfulLoad({ userPayload: [] });
    render(<UserManagement />);
    expect((await screen.findAllByText("No users yet")).length).toBeGreaterThan(0);
  });

  it("shows the loading skeleton and reports load failures with a friendly toast", async () => {
    let rejectLoad;
    api.get.mockImplementation(
      () =>
        new Promise((_, reject) => {
          rejectLoad = reject;
        }),
    );

    render(<UserManagement />);
    expect(document.querySelector(".animate-pulse")).toBeInTheDocument();

    await act(async () => {
      rejectLoad({ response: { data: { detail: "No permission." } } });
    });

    await waitFor(() => expect(toast.error).toHaveBeenCalledWith("No permission."));
    expect((await screen.findAllByText("No users yet")).length).toBeGreaterThan(0);
  });

  it("updates roles and active status, then reloads after successful mutations", async () => {
    await renderLoaded();

    fireEvent.change(screen.getAllByDisplayValue("Admin")[0], {
      target: { value: "manager" },
    });
    await waitFor(() =>
      expect(api.post).toHaveBeenCalledWith("auth/users/1/set_role/", { role: "manager" }),
    );
    expect(toast.success).toHaveBeenCalledWith("User role updated.");
    expect(api.get).toHaveBeenCalledTimes(4);

    fireEvent.click(within(desktopTable()).getByRole("button", { name: "Disable" }));
    await waitFor(() =>
      expect(api.patch).toHaveBeenCalledWith("auth/users/1/", { is_active: false }),
    );
    expect(toast.success).toHaveBeenCalledWith("User disabled.");

    fireEvent.click(within(desktopTable()).getByRole("button", { name: "Enable" }));
    await waitFor(() =>
      expect(api.patch).toHaveBeenCalledWith("auth/users/2/", { is_active: true }),
    );
    expect(toast.success).toHaveBeenCalledWith("User enabled.");

    const toggle = within(desktopTable()).getByRole("button", { name: "Disable" });
    fireEvent.mouseEnter(toggle);
    expect(toggle.style.backgroundColor).toContain("var(--danger) 22%");
    fireEvent.mouseLeave(toggle);
    expect(toggle.style.backgroundColor).toContain("var(--danger) 12%");
  });

  it("shows mutation errors for role updates and active toggles", async () => {
    await renderLoaded();
    api.post.mockRejectedValueOnce({ response: { data: { detail: "Role denied." } } });
    api.patch.mockRejectedValueOnce({ response: { data: { detail: "Patch denied." } } });

    fireEvent.change(screen.getAllByDisplayValue("Admin")[0], {
      target: { value: "accountant" },
    });
    await waitFor(() => expect(toast.error).toHaveBeenCalledWith("Role denied."));

    fireEvent.click(within(desktopTable()).getByRole("button", { name: "Disable" }));
    await waitFor(() => expect(toast.error).toHaveBeenCalledWith("Patch denied."));
  });

  it("validates and submits the create-user modal, including API error rendering and close behavior", async () => {
    const { rerender } = render(<UserManagement />);
    expect(await screen.findByText("Users")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /\+ create/i }));
    let createModal = modalPanel("Create User");
    expect(createModal).toBeInTheDocument();

    fireEvent.submit(within(createModal).getByRole("button", { name: "Create" }).closest("form"));
    expect(await screen.findByText("Username is required.")).toBeInTheDocument();

    fireEvent.change(modalField(createModal, "Username"), { target: { value: "  newuser  " } });
    fireEvent.change(modalField(createModal, "Password"), { target: { value: "123" } });
    fireEvent.change(modalField(createModal, "Confirm Password"), { target: { value: "123" } });
    fireEvent.click(within(createModal).getByRole("button", { name: "Create" }));
    expect(await screen.findByText("Password must be at least 6 characters.")).toBeInTheDocument();

    fireEvent.change(modalField(createModal, "Password"), { target: { value: "123456" } });
    fireEvent.change(modalField(createModal, "Confirm Password"), { target: { value: "654321" } });
    fireEvent.click(within(createModal).getByRole("button", { name: "Create" }));
    expect(await screen.findByText("Passwords do not match.")).toBeInTheDocument();

    fireEvent.change(modalField(createModal, "Email"), { target: { value: " new@example.com " } });
    fireEvent.change(modalField(createModal, "Confirm Password"), { target: { value: "123456" } });
    fireEvent.change(modalField(createModal, "Role"), { target: { value: "accountant" } });
    await act(async () => {
      fireEvent.click(within(createModal).getByRole("button", { name: "Create" }));
    });

    expect(hookState.postData).toHaveBeenCalledWith("auth/users/", {
      username: "newuser",
      email: "new@example.com",
      password: "123456",
      role: "accountant",
    });
    expect(toast.success).toHaveBeenCalledWith("User created.");
    await waitFor(() =>
      expect(screen.queryByRole("heading", { name: "Create User" })).not.toBeInTheDocument(),
    );

    hookState.createError = "Duplicate username.";
    rerender(<UserManagement />);
    fireEvent.click(screen.getByRole("button", { name: /\+ create/i }));
    createModal = modalPanel("Create User");
    expect(screen.getByText("Duplicate username.")).toBeInTheDocument();

    hookState.createError = { username: ["Already taken."] };
    rerender(<UserManagement />);
    expect(screen.getByText("Something went wrong.")).toBeInTheDocument();

    fireEvent.click(within(createModal).getByText("Cancel"));
    expect(screen.queryByRole("heading", { name: "Create User" })).not.toBeInTheDocument();

    hookState.postData = vi.fn(() => Promise.reject(new Error("server")));
    hookState.createError = null;
    rerender(<UserManagement />);
    fireEvent.click(screen.getByRole("button", { name: /\+ create/i }));
    createModal = modalPanel("Create User");
    fireEvent.change(modalField(createModal, "Username"), { target: { value: "failed" } });
    fireEvent.change(modalField(createModal, "Password"), { target: { value: "123456" } });
    fireEvent.change(modalField(createModal, "Confirm Password"), { target: { value: "123456" } });
    await act(async () => {
      fireEvent.click(within(createModal).getByRole("button", { name: "Create" }));
    });
    expect(screen.getByRole("heading", { name: "Create User" })).toBeInTheDocument();
  });

  it("validates edit-user passwords, saves profile/role/password changes, and handles API errors", async () => {
    await renderLoaded();

    fireEvent.click(within(desktopTable()).getAllByRole("button", { name: /edit/i })[0]);
    let editModal = modalPanel("Edit");
    expect(editModal).toBeInTheDocument();

    fireEvent.change(modalField(editModal, "New Password"), { target: { value: "123" } });
    fireEvent.click(within(editModal).getByRole("button", { name: "Update User" }));
    expect(await screen.findByText("Password must be at least 6 characters.")).toBeInTheDocument();

    fireEvent.change(modalField(editModal, "New Password"), { target: { value: "123456" } });
    fireEvent.change(modalField(editModal, "Confirm New Password"), { target: { value: "abcdef" } });
    fireEvent.click(within(editModal).getByRole("button", { name: "Update User" }));
    expect(await screen.findByText("Passwords do not match.")).toBeInTheDocument();

    fireEvent.change(modalField(editModal, "Username"), { target: { value: " amina2 " } });
    fireEvent.change(modalField(editModal, "Email"), { target: { value: " amina2@example.com " } });
    fireEvent.change(modalField(editModal, "Role"), { target: { value: "manager" } });
    fireEvent.change(modalField(editModal, "Confirm New Password"), { target: { value: "123456" } });
    await act(async () => {
      fireEvent.click(within(editModal).getByRole("button", { name: "Update User" }));
    });

    expect(api.patch).toHaveBeenCalledWith("auth/users/1/", {
      username: "amina2",
      email: "amina2@example.com",
    });
    expect(api.post).toHaveBeenCalledWith("auth/users/1/set_role/", { role: "manager" });
    expect(api.post).toHaveBeenCalledWith("auth/users/1/set_password/", {
      new_password: "123456",
    });
    expect(toast.success).toHaveBeenCalledWith("User updated.");
    await waitFor(() =>
      expect(screen.queryByRole("heading", { name: "Edit" })).not.toBeInTheDocument(),
    );

    api.patch.mockRejectedValueOnce({ response: { data: { detail: "Cannot save." } } });
    fireEvent.click(within(desktopTable()).getAllByRole("button", { name: /edit/i })[0]);
    editModal = modalPanel("Edit");
    await act(async () => {
      fireEvent.click(within(editModal).getByRole("button", { name: "Update User" }));
    });
    expect(await screen.findByText("Cannot save.")).toBeInTheDocument();

    const cancel = within(editModal).getByText("Cancel");
    fireEvent.mouseEnter(cancel);
    expect(cancel.style.backgroundColor).toBe("var(--hover)");
    fireEvent.mouseLeave(cancel);
    expect(cancel.style.backgroundColor).toBe("var(--card)");
    fireEvent.click(editModal.parentElement);
    expect(screen.queryByRole("heading", { name: "Edit" })).not.toBeInTheDocument();
  });
});

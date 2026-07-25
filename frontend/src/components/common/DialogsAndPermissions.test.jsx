import React from "react";
import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";

import ConfirmDialog from "./ConfirmDialog";
import Modal from "./Modal";
import PermissionWrapper from "../../auth/PermissionWrapper";

const authState = vi.hoisted(() => ({
  permissions: [],
}));

vi.mock("../../auth/AuthContext", () => ({
  useAuth: () => ({ permissions: authState.permissions }),
}));

describe("modal and permission components", () => {
  it("does not render a closed modal and restores body overflow", () => {
    const { rerender } = render(
      <Modal isOpen={false} onClose={() => {}} title="Hidden">
        Secret
      </Modal>,
    );

    expect(screen.queryByText("Secret")).not.toBeInTheDocument();

    rerender(
      <Modal isOpen onClose={() => {}} title="Visible">
        Modal body
      </Modal>,
    );
    expect(screen.getByText("Visible")).toBeInTheDocument();
    expect(document.body.style.overflow).toBe("hidden");
  });

  it("calls close and confirm handlers from confirmation dialog", () => {
    const onClose = vi.fn();
    const onConfirm = vi.fn();

    render(
      <ConfirmDialog
        isOpen
        onClose={onClose}
        onConfirm={onConfirm}
        title="Delete record"
        message="This cannot be undone."
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Cancel" }));
    fireEvent.click(screen.getByRole("button", { name: "Confirm" }));

    expect(onClose).toHaveBeenCalled();
    expect(onConfirm).toHaveBeenCalled();
  });

  it("renders permission children for matching and wildcard permissions", () => {
    authState.permissions = ["projects.view"];
    const { rerender } = render(
      <PermissionWrapper permissions={["projects.view"]} fallback={<span>Denied</span>}>
        <span>Allowed</span>
      </PermissionWrapper>,
    );
    expect(screen.getByText("Allowed")).toBeInTheDocument();

    authState.permissions = ["*"];
    rerender(
      <PermissionWrapper permissions={["users.delete"]} fallback={<span>Denied</span>}>
        <span>Allowed wildcard</span>
      </PermissionWrapper>,
    );
    expect(screen.getByText("Allowed wildcard")).toBeInTheDocument();
  });

  it("renders fallback when permission is missing", () => {
    authState.permissions = ["attendance.view"];

    render(
      <PermissionWrapper permissions={["projects.delete"]} fallback={<span>Denied</span>}>
        <span>Allowed</span>
      </PermissionWrapper>,
    );

    expect(screen.getByText("Denied")).toBeInTheDocument();
  });
});

import React from "react";
import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";

import { ProtectedRoute, RoleRedirect } from "./ProtectedRoute";

const authState = vi.hoisted(() => ({
  value: {
    initializing: false,
    isAuthenticated: false,
    role: null,
    permissions: [],
  },
}));

vi.mock("./AuthContext", () => ({
  useAuth: () => authState.value,
}));

vi.mock("../hooks/useLanguage", () => ({
  useLanguage: () => ({ t: (key) => key }),
}));

function renderProtected(initialPath = "/manager/projects", routeProps = {}) {
  return render(
    <MemoryRouter initialEntries={[initialPath]}>
      <Routes>
        <Route element={<ProtectedRoute {...routeProps} />}>
          <Route path="/manager/projects" element={<div>Projects page</div>} />
        </Route>
        <Route path="/login" element={<div>Login page</div>} />
        <Route path="/unauthorized" element={<div>Unauthorized page</div>} />
      </Routes>
    </MemoryRouter>,
  );
}

describe("ProtectedRoute", () => {
  it("shows a loading state while auth initializes", () => {
    authState.value = {
      initializing: true,
      isAuthenticated: false,
      role: null,
      permissions: [],
    };

    renderProtected();

    expect(screen.getByText("common.loading")).toBeInTheDocument();
  });

  it("redirects unauthenticated users to login", () => {
    authState.value = {
      initializing: false,
      isAuthenticated: false,
      role: null,
      permissions: [],
    };

    renderProtected();

    expect(screen.getByText("Login page")).toBeInTheDocument();
  });

  it("renders protected content when role is allowed", () => {
    authState.value = {
      initializing: false,
      isAuthenticated: true,
      role: "manager",
      permissions: [],
    };

    renderProtected("/manager/projects", { roles: ["manager"] });

    expect(screen.getByText("Projects page")).toBeInTheDocument();
  });

  it("renders protected content when permission is allowed", () => {
    authState.value = {
      initializing: false,
      isAuthenticated: true,
      role: "accountant",
      permissions: ["projects.view"],
    };

    renderProtected("/manager/projects", { roles: ["manager"], permissions: ["projects.view"] });

    expect(screen.getByText("Projects page")).toBeInTheDocument();
  });

  it("redirects authenticated users without required access", () => {
    authState.value = {
      initializing: false,
      isAuthenticated: true,
      role: "laborer",
      permissions: ["attendance.view"],
    };

    renderProtected("/manager/projects", { roles: ["manager"], permissions: ["projects.view"] });

    expect(screen.getByText("Unauthorized page")).toBeInTheDocument();
  });
});

describe("RoleRedirect", () => {
  it("sends custom roles to the first permission-backed home", () => {
    authState.value = {
      initializing: false,
      isAuthenticated: true,
      role: "accountant",
      permissions: ["reports.view"],
    };

    render(
      <MemoryRouter initialEntries={["/"]}>
        <Routes>
          <Route path="/" element={<RoleRedirect />} />
          <Route path="/manager/reports" element={<div>Reports page</div>} />
        </Routes>
      </MemoryRouter>,
    );

    expect(screen.getByText("Reports page")).toBeInTheDocument();
  });
});

import React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, within } from "@testing-library/react";
import { MemoryRouter, Route, Routes, useLocation } from "react-router-dom";

const authState = vi.hoisted(() => ({
  user: null,
  logout: vi.fn(),
}));

const realtimeState = vi.hoisted(() => ({
  pendingExpenseApprovals: 0,
}));

vi.mock("../auth/AuthContext", () => ({
  useAuth: () => authState,
}));

vi.mock("../hooks/useLanguage", () => ({
  useLanguage: () => ({
    t: (key) =>
      ({
        "auth.logout": "Logout",
        "dailyWorkers.title": "Daily Workers",
        "managerNavbar.attendance": "Attendance",
        "managerNavbar.brand": "Lanader Manager",
        "managerNavbar.closeMenu": "Close menu",
        "managerNavbar.contracts": "Contracts",
        "managerNavbar.dashboard": "Dashboard",
        "managerNavbar.employees": "Employees",
        "managerNavbar.expenses": "Expenses",
        "managerNavbar.finance": "Finance",
        "managerNavbar.matchingPages": "Matching pages",
        "managerNavbar.more": "More",
        "managerNavbar.noPagesFound": "No pages found",
        "managerNavbar.openMenu": "Open menu",
        "managerNavbar.operations": "Operations",
        "managerNavbar.payrolls": "Payrolls",
        "managerNavbar.people": "People",
        "managerNavbar.profile": "Profile",
        "managerNavbar.projects": "Projects",
        "managerNavbar.recentPages": "Recent pages",
        "managerNavbar.reports": "Reports",
        "managerNavbar.searchPlaceholder": "Search pages",
        "managerNavbar.settings": "Settings",
        "managerNavbar.subContractors": "Subcontractors",
      })[key] || key,
  }),
}));

vi.mock("../components/ui/ToggleButton", () => ({
  default: () => <button type="button">Theme toggle</button>,
}));

vi.mock("../components/LanguageSwitcher", () => ({
  default: () => <button type="button">Language switcher</button>,
}));

vi.mock("../components/notifications/NotificationBell", () => ({
  default: () => <button type="button">Notifications</button>,
}));

vi.mock("../components/notifications/RealtimeNotificationCenter", () => ({
  useRealtimeNotifications: () => realtimeState,
}));

import ManagerNavbar from "./ManagerNavbar";

function LocationProbe() {
  const location = useLocation();
  return <div data-testid="location">{location.pathname}</div>;
}

function renderNavbar(initialPath = "/manager/dashboard") {
  return render(
    <MemoryRouter initialEntries={[initialPath]}>
      <ManagerNavbar />
      <Routes>
        <Route path="*" element={<LocationProbe />} />
      </Routes>
    </MemoryRouter>,
  );
}

const allPermissions = [
  "projects.view",
  "contracts.view",
  "employees.view",
  "daily_workers.view",
  "subcontractors.view",
  "expenses.view",
  "expenses.approve",
  "payrolls.view",
  "attendance.view",
  "reports.view",
  "settings.view",
];

describe("ManagerNavbar", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    authState.user = {
      username: "Amina Manager",
      role: "manager",
      permissions: allPermissions,
    };
    realtimeState.pendingExpenseApprovals = 120;
  });

  it("renders permitted desktop navigation, more menu groups, profile actions, and capped badges", () => {
    renderNavbar("/manager/expense-approvals");

    expect(screen.getAllByText("Lanader Manager").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Dashboard").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Projects").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Contracts").length).toBeGreaterThan(0);

    fireEvent.click(screen.getByRole("button", { name: /more/i }));
    const moreMenu = screen.getByRole("menu");
    expect(within(moreMenu).getByText("People")).toBeInTheDocument();
    expect(within(moreMenu).getByText("Finance")).toBeInTheDocument();
    expect(within(moreMenu).getByText("Expense Approvals")).toBeInTheDocument();
    expect(within(moreMenu).getByText("99+")).toBeInTheDocument();

    fireEvent.click(screen.getByLabelText("Close more menu"));
    expect(screen.queryByRole("menu")).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /AM Amina Manager manager/i }));
    expect(screen.getByRole("menu")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("menuitem", { name: /logout/i }));
    expect(authState.logout).toHaveBeenCalledOnce();
  });

  it("filters restricted links and renders no more menu when only dashboard is allowed", () => {
    authState.user = {
      username: "Limited User",
      role: "employee",
      permissions: [],
    };
    realtimeState.pendingExpenseApprovals = 0;

    renderNavbar();

    expect(screen.getAllByText("Dashboard").length).toBeGreaterThan(0);
    expect(screen.queryByText("Projects")).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /more/i })).not.toBeInTheDocument();
    expect(screen.queryByText("99+")).not.toBeInTheDocument();
  });

  it("opens mobile drawer, renders grouped mobile links, closes on link selection, and logs out", () => {
    realtimeState.pendingExpenseApprovals = 7;
    renderNavbar();

    fireEvent.click(screen.getByRole("button", { name: "Open menu" }));
    const drawer = document.querySelector("#manager-mobile-drawer");
    expect(drawer).toHaveAttribute("aria-hidden", "false");
    expect(within(drawer).getByText("Amina Manager")).toBeInTheDocument();
    expect(within(drawer).getByText("People")).toBeInTheDocument();
    expect(within(drawer).getByText("Finance")).toBeInTheDocument();
    expect(within(drawer).getByText("7")).toBeInTheDocument();

    fireEvent.click(within(drawer).getByText("Employees"));
    expect(screen.getByTestId("location")).toHaveTextContent("/manager/employees");
    expect(drawer).toHaveAttribute("aria-hidden", "true");

    fireEvent.click(screen.getByRole("button", { name: "Open menu" }));
    fireEvent.click(within(drawer).getByRole("button", { name: /logout/i }));
    expect(authState.logout).toHaveBeenCalledOnce();
  });

  it("searches recent and matching pages, supports keyboard navigation, empty state, escape, and click navigation", () => {
    renderNavbar();

    fireEvent.click(screen.getByRole("button", { name: "Search pages" }));
    expect(screen.getAllByText("Recent pages").length).toBeGreaterThan(0);

    const searchInputs = screen.getAllByPlaceholderText("Search pages");
    const desktopInput = searchInputs[0];
    fireEvent.change(desktopInput, { target: { value: "pay" } });
    expect(screen.getAllByText("Matching pages").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Payrolls").length).toBeGreaterThan(0);

    fireEvent.keyDown(desktopInput, { key: "ArrowDown" });
    fireEvent.keyDown(desktopInput, { key: "ArrowUp" });
    fireEvent.keyDown(desktopInput, { key: "Enter" });
    expect(screen.getByTestId("location")).toHaveTextContent("/manager/payrolls");

    fireEvent.click(screen.getByRole("button", { name: "Search pages" }));
    fireEvent.change(screen.getAllByPlaceholderText("Search pages")[0], {
      target: { value: "no-match-route" },
    });
    expect(screen.getAllByText("No pages found").length).toBeGreaterThan(0);

    fireEvent.keyDown(screen.getAllByPlaceholderText("Search pages")[0], { key: "Escape" });
    expect(screen.queryByText("No pages found")).not.toBeInTheDocument();
  });

  it("handles global shortcuts, default user labels, and closes overlays on Escape", () => {
    authState.user = null;
    renderNavbar();

    expect(screen.getAllByText("Manager").length).toBeGreaterThan(0);
    fireEvent.keyDown(window, { key: "k", ctrlKey: true });
    expect(screen.getAllByText("Recent pages").length).toBeGreaterThan(0);

    fireEvent.click(screen.getByRole("button", { name: "Open menu" }));
    expect(document.querySelector("#manager-mobile-drawer")).toHaveAttribute("aria-hidden", "false");

    fireEvent.keyDown(window, { key: "Escape" });
    expect(document.querySelector("#manager-mobile-drawer")).toHaveAttribute("aria-hidden", "true");
    expect(screen.getAllByText("Recent pages").length).toBeGreaterThan(0);
  });
});

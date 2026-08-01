import React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { act, cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";

const api = vi.hoisted(() => ({
  get: vi.fn(),
  post: vi.fn(),
}));

const authState = vi.hoisted(() => ({
  canApprove: true,
}));

const realtime = vi.hoisted(() => ({
  callback: null,
}));

const toast = vi.hoisted(() => ({
  success: vi.fn(),
  error: vi.fn(),
}));

vi.mock("../../api/axiosInstance", () => ({
  default: api,
}));

vi.mock("../../auth/PermissionWrapper", () => ({
  default: ({ children, fallback }) => (authState.canApprove ? children : fallback),
}));

vi.mock("../../hooks/useRealtimeEvents", () => ({
  default: (callback) => {
    realtime.callback = callback;
  },
}));

vi.mock("react-hot-toast", () => ({
  default: toast,
}));

import ExpenseApprovalsPage from "./ExpenseApprovalsPage";

const pendingExpense = {
  id: 11,
  project: 4,
  project_name: "Tower",
  serial_number: "EXP-11",
  expense_date: "2026-01-10",
  description: "Concrete delivery",
  remarks: "urgent pour",
  paid_to: "Supplier A",
  expense_type: "materials",
  amount_afn: "7000",
  amount_usd: "100",
  exchange_rate: "70",
  total_usd: "100",
  total_afn: "7000",
  created_by: 3,
  created_by_name: "Engineer One",
  approval_status: "pending",
  approved_by_name: "",
  approved_at: "",
  rejected_by_name: "",
  rejected_at: "",
  approval_notes: "",
  approval_history: [],
  created_at: "2026-01-10T08:00:00Z",
  updated_at: "2026-01-10T09:00:00Z",
};

const approvedExpense = {
  ...pendingExpense,
  id: 12,
  serial_number: "EXP-12",
  description: "Steel payment",
  approval_status: "approved",
  approved_by_name: "Manager",
  approved_at: "2026-01-12T10:00:00Z",
  approval_history: [{ status: "approved", at: "2026-01-12T10:00:00Z", by: "Manager" }],
};

const rejectedExpense = {
  ...pendingExpense,
  id: 13,
  serial_number: "EXP-13",
  description: "Duplicate receipt",
  approval_status: "rejected",
  rejected_by_name: "Manager",
  rejected_at: "2026-01-13T10:00:00Z",
  approval_notes: "Duplicate",
};

const summary = {
  pending: 2,
  approved: 3,
  rejected: 1,
  approval_enabled: true,
};

function mockDefaultApi({ rows = [pendingExpense], queueData, projects = [{ id: 4, name: "Tower" }] } = {}) {
  api.get.mockImplementation((endpoint) => {
    if (endpoint === "expenses/approvals/") {
      return Promise.resolve({
        data:
          queueData || {
            results: { results: rows, summary },
          },
      });
    }
    if (endpoint === "projects/") {
      return Promise.resolve({ data: projects });
    }
    if (endpoint.startsWith("expenses/")) {
      return Promise.resolve({ data: approvedExpense });
    }
    return Promise.reject(new Error(`Unexpected GET ${endpoint}`));
  });
  api.post.mockResolvedValue({ data: {} });
}

async function renderPage(route = "/manager/expense-approvals") {
  render(
    <MemoryRouter initialEntries={[route]}>
      <ExpenseApprovalsPage />
    </MemoryRouter>,
  );
  expect(await screen.findByRole("heading", { name: "Expense Approvals" })).toBeInTheDocument();
}

function actionDialog(name) {
  return screen.getByRole("heading", { name }).closest(".fixed");
}

describe("ExpenseApprovalsPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    authState.canApprove = true;
    realtime.callback = null;
    mockDefaultApi();
  });

  it("renders permission fallback, loading, loaded queue, summary cards, details, and status metadata", async () => {
    authState.canApprove = false;
    render(
      <MemoryRouter>
        <ExpenseApprovalsPage />
      </MemoryRouter>,
    );
    expect(screen.getByText(/You do not have permission to approve expenses/)).toBeInTheDocument();

    cleanup();
    authState.canApprove = true;
    mockDefaultApi({ rows: [pendingExpense, approvedExpense, rejectedExpense] });
    render(
      <MemoryRouter>
        <ExpenseApprovalsPage />
      </MemoryRouter>,
    );
    expect(screen.getByText("Loading approvals")).toBeInTheDocument();
    expect((await screen.findAllByText("#EXP-11")).length).toBeGreaterThan(0);
    expect(screen.getAllByText("Approval workflow is enabled").length).toBeGreaterThan(0);
    expect(screen.getByRole("button", { name: /pending 2/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /approved 3/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /rejected 1/i })).toBeInTheDocument();
    expect(screen.getAllByText("Steel payment").length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Manager/).length).toBeGreaterThan(0);
    expect(screen.getAllByText("Duplicate").length).toBeGreaterThan(0);
    expect(screen.getByText("Select an expense to review its full details.")).toBeInTheDocument();

    fireEvent.click(screen.getAllByText("#EXP-11")[0].closest("tr"));
    expect(screen.getByText("Financial Details")).toBeInTheDocument();
    expect(screen.getByText("urgent pour")).toBeInTheDocument();
    expect(screen.getByText("No approval history available.")).toBeInTheDocument();
  });

  it("builds filter params, resets filters, refreshes manually, and renders empty and load-error states", async () => {
    await renderPage();

    fireEvent.change(screen.getByPlaceholderText("Search expenses"), {
      target: { value: "concrete" },
    });
    fireEvent.change(screen.getByDisplayValue("All projects"), { target: { value: "4" } });
    fireEvent.change(screen.getByPlaceholderText("Creator ID"), { target: { value: "3" } });
    const dateInputs = screen.getAllByPlaceholderText("YYYY-MM-DD");
    fireEvent.change(dateInputs[0], { target: { value: "2026-01-01" } });
    fireEvent.change(dateInputs[1], { target: { value: "2026-01-31" } });

    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Apply Filters" }));
    });
    expect(api.get).toHaveBeenLastCalledWith("expenses/approvals/", {
      params: {
        status: "pending",
        search: "concrete",
        project: "4",
        creator: "3",
        expense_date__gte: "2647-03-21",
        expense_date__lte: "2647-04-20",
      },
    });

    fireEvent.click(screen.getByRole("button", { name: "Reset" }));
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: /approved 3/i }));
    });
    expect(api.get).toHaveBeenLastCalledWith("expenses/approvals/", {
      params: { status: "approved" },
    });

    mockDefaultApi({ rows: [] });
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Refresh" }));
    });
    expect(screen.getAllByText("No expenses found").length).toBeGreaterThan(0);

    cleanup();
    api.get.mockImplementation((endpoint) => {
      if (endpoint === "projects/") return Promise.reject(new Error("projects"));
      return Promise.reject({ response: { data: { detail: "Cannot load queue." } } });
    });
    render(
      <MemoryRouter>
        <ExpenseApprovalsPage />
      </MemoryRouter>,
    );
    expect(await screen.findByText("Cannot load queue.")).toBeInTheDocument();
  });

  it("loads highlighted expenses from query params and handles missing highlighted records", async () => {
    mockDefaultApi({ rows: [pendingExpense] });
    await renderPage("/manager/expense-approvals?expense=11");
    expect(screen.getByText("Financial Details")).toBeInTheDocument();

    cleanup();
    vi.clearAllMocks();
    mockDefaultApi({ rows: [pendingExpense] });
    api.get.mockImplementation((endpoint) => {
      if (endpoint === "expenses/approvals/") {
        return Promise.resolve({ data: { results: { results: [pendingExpense], summary } } });
      }
      if (endpoint === "projects/") return Promise.resolve({ data: [] });
      if (endpoint === "expenses/99/") return Promise.resolve({ data: approvedExpense });
      return Promise.reject(new Error(endpoint));
    });
    await renderPage("/manager/expense-approvals?expense=99");
    expect(await screen.findByText("#EXP-12")).toBeInTheDocument();

    cleanup();
    vi.clearAllMocks();
    api.get.mockImplementation((endpoint) => {
      if (endpoint === "expenses/approvals/") {
        return Promise.resolve({ data: { results: { results: [pendingExpense], summary } } });
      }
      if (endpoint === "projects/") return Promise.resolve({ data: [] });
      if (endpoint === "expenses/404/") return Promise.reject(new Error("missing"));
      return Promise.reject(new Error(endpoint));
    });
    await renderPage("/manager/expense-approvals?expense=404");
    await waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith("The requested item could not be found."),
    );
  });

  it("approves and rejects expenses, validates rejection notes, and reports action API failures", async () => {
    await renderPage();

    fireEvent.click(screen.getAllByRole("button", { name: "Approve" })[0]);
    expect(screen.getByRole("heading", { name: "approve Expense #EXP-11" })).toBeInTheDocument();
    fireEvent.change(screen.getByPlaceholderText("Approval notes"), {
      target: { value: "looks good" },
    });
    await act(async () => {
      fireEvent.click(within(actionDialog("approve Expense #EXP-11")).getByRole("button", { name: "Approve" }));
    });
    expect(api.post).toHaveBeenCalledWith("expenses/11/approve/", {
      approval_notes: "looks good",
    });
    expect(toast.success).toHaveBeenCalledWith("Expense approved.");

    fireEvent.click(screen.getAllByRole("button", { name: "Reject" })[0]);
    await act(async () => {
      fireEvent.click(within(actionDialog("reject Expense #EXP-11")).getByRole("button", { name: "Reject" }));
    });
    expect(toast.error).toHaveBeenCalledWith("A rejection reason is required.");
    fireEvent.change(screen.getByPlaceholderText("Reject reason"), {
      target: { value: "duplicate" },
    });
    await act(async () => {
      fireEvent.click(within(actionDialog("reject Expense #EXP-11")).getByRole("button", { name: "Reject" }));
    });
    expect(api.post).toHaveBeenCalledWith("expenses/11/reject/", {
      approval_notes: "duplicate",
    });
    expect(toast.success).toHaveBeenCalledWith("Expense rejected.");

    api.post.mockRejectedValueOnce({ response: { data: { detail: "Approval denied." } } });
    fireEvent.click(screen.getAllByRole("button", { name: "Approve" })[0]);
    await act(async () => {
      fireEvent.click(within(actionDialog("approve Expense #EXP-11")).getByRole("button", { name: "Approve" }));
    });
    expect(await screen.findByText("Approval denied.")).toBeInTheDocument();
  });

  it("applies realtime request and approval events with duplicate, filter, selected, and invalid-event branches", async () => {
    await renderPage("/manager/expense-approvals?expense=55");
    expect(realtime.callback).toBeTypeOf("function");

    act(() => realtime.callback({ event: "notification.created", payload: {} }));
    expect(screen.queryByText("#EXP-55")).not.toBeInTheDocument();

    act(() =>
      realtime.callback({
        event: "expense.approval.request",
        payload: {
          id: "event-55",
          expense_id: 55,
          project_id: 4,
          project_name: "Tower",
          serial_number: "EXP-55",
          expense_date: "2026-01-11",
          description: "Realtime concrete",
          paid_to: "Supplier B",
          created_by: 3,
          created_by_name: "Engineer One",
          total_usd: "30",
          total_afn: "2100",
        },
      }),
    );
    expect(screen.getAllByText("#EXP-55").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Realtime concrete").length).toBeGreaterThan(0);
    expect(screen.getByText("Financial Details")).toBeInTheDocument();

    const duplicateCount = screen.getAllByText("#EXP-55").length;
    act(() =>
      realtime.callback({
        event: "expense.approval.request",
        payload: { id: "event-55", expense_id: 55 },
      }),
    );
    expect(screen.getAllByText("#EXP-55")).toHaveLength(duplicateCount);

    act(() =>
      realtime.callback({
        event: "expense.approval",
        payload: {
          id: "event-approve-55",
          event: "approved",
          expense_id: 55,
          project_id: 4,
          serial_number: "EXP-55",
          description: "Realtime concrete",
          approved_by_name: "Manager",
          approved_at: "2026-01-11T10:00:00Z",
        },
      }),
    );
    expect(screen.getByText("approved")).toBeInTheDocument();
    expect(screen.getByText("Approved By")).toBeInTheDocument();
    expect(screen.getAllByText("Manager").length).toBeGreaterThan(0);

    act(() =>
      realtime.callback({
        event: "expense.approval",
        payload: { id: "ignored", event: "reviewed", expense_id: 55 },
      }),
    );
  });
});

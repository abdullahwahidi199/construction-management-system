import React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";

const state = vi.hoisted(() => ({
  expenses: null,
  projects: [],
  loading: false,
  lang: "en",
  refetch: vi.fn(),
  postData: vi.fn(),
  deleteData: vi.fn(),
  endpoints: [],
  realtimeCallback: null,
}));

const api = vi.hoisted(() => ({
  get: vi.fn(),
  put: vi.fn(),
}));

const toast = vi.hoisted(() => ({
  success: vi.fn(),
  error: vi.fn(),
}));

vi.mock("../../hooks/useFetch", () => ({
  default: (endpoint) => {
    state.endpoints.push(endpoint);
    if (endpoint === "projects/") {
      return { data: state.projects, loading: false, refetch: vi.fn() };
    }
    return { data: state.expenses, loading: state.loading, refetch: state.refetch };
  },
}));

vi.mock("../../hooks/usePost", () => ({
  default: () => ({ postData: state.postData, loading: false, error: null }),
}));

vi.mock("../../hooks/useDelete", () => ({
  default: () => ({ deleteData: state.deleteData }),
}));

vi.mock("../../api/axiosInstance", () => ({
  default: api,
}));

vi.mock("../../hooks/useLanguage", () => ({
  useLanguage: () => ({
    lang: state.lang,
    t: (key) =>
      ({
        "ExpensesMain.title": "Expenses",
        "ExpensesMain.subtitle": "Track project expenses",
        "ExpensesMain.refresh": "Refresh",
        "ExpensesMain.newExpense": "New Expense",
        "ExpensesMain.currencies.usd": "USD",
        "ExpensesMain.currencies.afn": "AFN",
        "ExpensesMain.cards.totalSpendingUsd": "Total USD",
        "ExpensesMain.cards.totalSpendingAfn": "Total AFN",
        "ExpensesMain.cards.count": "Count",
        "ExpensesMain.cards.totalEntries": "Total Entries",
        "ExpensesMain.cards.avg": "Average",
        "ExpensesMain.cards.avgPerEntry": "Average Per Entry",
        "ExpensesMain.search.placeholder": "Search expenses",
        "ExpensesMain.filters.button": "Filters",
        "ExpensesMain.filters.project.label": "Project",
        "ExpensesMain.filters.project.all": "All Projects",
        "ExpensesMain.filters.scope.label": "Expense Type",
        "ExpensesMain.filters.scope.all": "All Expenses",
        "ExpensesMain.filters.scope.project": "Project Expenses",
        "ExpensesMain.filters.scope.office": "Office Expenses",
        "ExpensesMain.filters.type.label": "Type",
        "ExpensesMain.filters.type.all": "All Types",
        "ExpensesMain.filters.date.from": "From",
        "ExpensesMain.filters.date.to": "To",
        "ExpensesMain.filters.clearAll": "Clear All",
        "ExpensesMain.activeFilters.label": "Active filters:",
        "ExpensesMain.activeFilters.search": "Search",
        "ExpensesMain.activeFilters.project": "Project",
        "ExpensesMain.activeFilters.scope": "Expense Type",
        "ExpensesMain.activeFilters.type": "Type",
        "ExpensesMain.activeFilters.date": "Date",
        "ExpensesMain.activeFilters.sort": "Sort",
        "ExpensesMain.pagination.showing": "Showing",
        "ExpensesMain.pagination.of": "of",
        "ExpensesMain.pagination.expenses": "expenses",
        "ExpensesMain.pagination.found": "Found",
        "ExpensesMain.pagination.resultsFor": "results for",
        "ExpensesMain.pagination.firstPage": "First page",
        "ExpensesMain.pagination.prevPage": "Previous page",
        "ExpensesMain.pagination.nextPage": "Next page",
        "ExpensesMain.pagination.lastPage": "Last page",
        "ExpensesMain.loading": "Loading expenses",
        "ExpensesMain.empty.noMatch": "No matching expenses",
        "ExpensesMain.empty.noExpenses": "No expenses",
        "ExpensesMain.empty.messageMatch": "Adjust filters",
        "ExpensesMain.empty.messageDefault": "Create the first expense",
        "ExpensesMain.empty.clearFilters": "Clear Filters",
        "ExpensesMain.empty.addFirst": "Add First Expense",
        "ExpensesMain.sortOptions.dateNewest": "Newest",
        "ExpensesMain.sortOptions.dateOldest": "Oldest",
        "ExpensesMain.sortOptions.serialHighLow": "Serial high",
        "ExpensesMain.sortOptions.serialLowHigh": "Serial low",
        "ExpensesMain.sortOptions.amountHighLow": "Amount high",
        "ExpensesMain.sortOptions.amountLowHigh": "Amount low",
        "ExpensesMain.types.general": "General",
        "ExpensesMain.types.material": "Material",
        "ExpensesMain.types.staffSalary": "Staff Salary",
        "ExpensesMain.types.dailyWage": "Daily Wage",
        "ExpensesMain.types.contractPayment": "Contract Payment",
        "ExpensesMain.types.equipment": "Equipment",
        "ExpensesMain.types.utility": "Utility",
        "ExpensesMain.types.officeRent": "Office Rent",
        "ExpensesMain.types.utilities": "Utilities",
        "ExpensesMain.types.internet": "Internet",
        "ExpensesMain.types.officeSupplies": "Office Supplies",
        "ExpensesMain.types.staffMeals": "Staff Meals",
        "ExpensesMain.types.transportation": "Transportation",
        "ExpensesMain.types.fuel": "Fuel",
        "ExpensesMain.types.cleaning": "Cleaning",
        "ExpensesMain.types.maintenance": "Maintenance",
        "ExpensesMain.types.softwareSubscriptions": "Software & Subscriptions",
        "ExpensesMain.types.salaries": "Salaries",
        "ExpensesMain.types.miscellaneous": "Miscellaneous",
        "ExpensesMain.types.other": "Other",
        "ProjectDetails.downloadPdf": "Download PDF",
      })[key] || key,
  }),
}));

vi.mock("../../hooks/useRealtimeEvents", () => ({
  default: (callback) => {
    state.realtimeCallback = callback;
  },
}));

vi.mock("react-hot-toast", () => ({
  default: toast,
}));

vi.mock("./ExpenseList", () => ({
  default: ({ expenses, onDelete, onUpdate, onRefresh, canDelete }) => (
    <section aria-label="expense-list">
      <div>Rows: {expenses.length}</div>
      <div>Can delete: {String(canDelete)}</div>
      <button type="button" onClick={() => onDelete?.(11)}>
        Delete row
      </button>
      <button type="button" onClick={() => onUpdate?.(11, { remarks: "updated" })}>
        Update row
      </button>
      <button type="button" onClick={onRefresh}>
        Refresh list
      </button>
    </section>
  ),
}));

vi.mock("./ExpenseCreateModal", () => ({
  default: ({ isOpen, onClose, onCreate, projects }) =>
    isOpen ? (
      <div role="dialog" aria-label="create-expense">
        <div>Modal projects: {projects.length}</div>
        <button type="button" onClick={() => onCreate({ description: "Concrete" })}>
          Submit modal
        </button>
        <button type="button" onClick={onClose}>
          Close modal
        </button>
      </div>
    ) : null,
}));

import ExpensesMain from "./ExpensesMain";

const populatedExpenses = {
  count: 60,
  next: "/api/expenses/?page=2",
  previous: null,
  results: {
    totals: { usd: "300", afn: "6800" },
    results: [{ id: 11, description: "Concrete" }],
  },
};

function renderPage(props) {
  return render(<ExpensesMain {...props} />);
}

describe("ExpensesMain", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    state.expenses = populatedExpenses;
    state.projects = [
      { id: 1, name: "Tower" },
      { id: 2, name: "Bridge" },
    ];
    state.loading = false;
    state.lang = "en";
    state.refetch = vi.fn(() => Promise.resolve());
    state.postData = vi.fn(() => Promise.resolve({ id: 99 }));
    state.deleteData = vi.fn(() => Promise.resolve());
    state.endpoints = [];
    state.realtimeCallback = null;
    api.get.mockResolvedValue({ data: "pdf" });
    api.put.mockResolvedValue({ data: { id: 11 } });
    window.scrollTo = vi.fn();
    vi.stubGlobal("URL", {
      createObjectURL: vi.fn(() => "blob:expenses"),
      revokeObjectURL: vi.fn(),
    });
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it("renders populated totals, list, pagination, refresh, CRUD callbacks, and realtime refresh", async () => {
    renderPage();

    expect(screen.getByText("Expenses")).toBeInTheDocument();
    expect(screen.getByText("$300.00")).toBeInTheDocument();
    expect(screen.getByText("Rows: 1")).toBeInTheDocument();
    expect(
      screen.getAllByText((_, node) => node?.textContent?.includes("Showing")).length,
    ).toBeGreaterThan(0);

    await act(async () => {
      fireEvent.click(screen.getByTitle("Next page"));
    });
    expect(window.scrollTo).toHaveBeenCalled();

    await act(async () => {
      fireEvent.click(screen.getByText("Delete row"));
    });
    expect(state.deleteData).toHaveBeenCalledWith("expenses/11/");
    expect(state.refetch).toHaveBeenCalled();
    expect(toast.success).toHaveBeenCalledWith("Expense deleted.");

    await act(async () => {
      fireEvent.click(screen.getByText("Update row"));
    });
    expect(api.put).toHaveBeenCalledWith("expenses/11/", { remarks: "updated" });
    expect(toast.success).toHaveBeenCalledWith("Expense updated.");

    await act(async () => {
      fireEvent.click(screen.getByTitle("Refresh"));
    });
    expect(state.refetch).toHaveBeenCalled();
    act(() => vi.advanceTimersByTime(600));

    act(() => state.realtimeCallback({ event: "expense.created" }));
    expect(state.refetch).toHaveBeenCalled();
    act(() => state.realtimeCallback({ event: "project.created" }));
  });

  it("builds search, filter, sort, date, project, status query params and clears filters", async () => {
    renderPage();

    fireEvent.change(screen.getByPlaceholderText("Search expenses"), {
      target: { value: "cement" },
    });
    act(() => vi.advanceTimersByTime(400));
    expect(state.endpoints.at(-2)).toContain("search=cement");

    fireEvent.click(screen.getByRole("button", { name: /filters/i }));
    fireEvent.change(screen.getByDisplayValue("All Projects"), { target: { value: "1" } });
    fireEvent.change(screen.getByDisplayValue("All Expenses"), { target: { value: "project" } });
    fireEvent.change(screen.getByDisplayValue("All Types"), { target: { value: "material" } });
    fireEvent.change(screen.getByDisplayValue("All statuses"), { target: { value: "approved" } });
    fireEvent.change(screen.getAllByDisplayValue("")[0], { target: { value: "2026-01-01" } });
    fireEvent.change(screen.getAllByDisplayValue("")[0], { target: { value: "2026-01-31" } });
    fireEvent.change(screen.getByDisplayValue("Newest"), { target: { value: "expense_date" } });

    const latestEndpoint = state.endpoints.at(-2);
    expect(latestEndpoint).toContain("project=1");
    expect(latestEndpoint).toContain("expense_scope=project");
    expect(latestEndpoint).toContain("expense_type=material");
    expect(latestEndpoint).toContain("status=approved");
    expect(latestEndpoint).toContain("ordering=expense_date");

    expect(screen.getByText("Clear All")).toBeInTheDocument();
    fireEvent.click(screen.getByText("Clear All"));
    expect(screen.getByDisplayValue("Newest")).toBeInTheDocument();
  });

  it("creates expenses through the modal and handles create/delete/update failures without success toasts", async () => {
    const { rerender } = renderPage();
    fireEvent.click(screen.getByText("New Expense"));
    expect(screen.getByRole("dialog", { name: "create-expense" })).toBeInTheDocument();

    await act(async () => {
      fireEvent.click(screen.getByText("Submit modal"));
    });
    expect(state.postData).toHaveBeenCalledWith("expenses/", { description: "Concrete" });
    expect(toast.success).toHaveBeenCalledWith("Expense submitted successfully.");
    expect(screen.queryByRole("dialog", { name: "create-expense" })).not.toBeInTheDocument();

    vi.clearAllMocks();
    state.postData = vi.fn(() => Promise.reject(new Error("bad create")));
    state.deleteData = vi.fn(() => Promise.reject(new Error("bad delete")));
    api.put.mockRejectedValueOnce(new Error("bad update"));
    rerender(<ExpensesMain />);

    fireEvent.click(screen.getByText("New Expense"));
    await act(async () => {
      fireEvent.click(screen.getByText("Submit modal"));
    });
    await act(async () => {
      fireEvent.click(screen.getByText("Delete row"));
    });
    await act(async () => {
      fireEvent.click(screen.getByText("Update row"));
    });

    expect(toast.success).not.toHaveBeenCalled();
  });

  it("exports only approved expenses and downloads the generated PDF", async () => {
    renderPage();

    fireEvent.click(screen.getByRole("button", { name: /filters/i }));
    fireEvent.change(screen.getByDisplayValue("All statuses"), { target: { value: "pending" } });
    expect(screen.getByRole("button", { name: "Download PDF" })).toBeDisabled();

    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Download PDF" }));
    });
    expect(api.get).not.toHaveBeenCalledWith(
      expect.stringContaining("/expenses/export-pdf/?"),
      expect.anything(),
    );

    fireEvent.change(screen.getByDisplayValue("Pending"), { target: { value: "approved" } });
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Download PDF" }));
    });

    expect(api.get).toHaveBeenCalledWith(expect.stringContaining("/expenses/export-pdf/?"), {
      responseType: "blob",
    });
    expect(window.URL.createObjectURL).toHaveBeenCalled();
    expect(toast.success).toHaveBeenCalledWith("Expense report exported.");

    api.get.mockRejectedValueOnce(new Error("export failed"));
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Download PDF" }));
    });
  });

  it("renders loading, empty default, empty filtered, data-entry, zero-average, and RTL states", () => {
    state.loading = true;
    state.expenses = { count: 0, results: { totals: {}, results: [] } };
    const { rerender } = renderPage();

    expect(screen.getByText("Loading expenses")).toBeInTheDocument();

    state.loading = false;
    rerender(<ExpensesMain />);
    expect(screen.getByText("No expenses")).toBeInTheDocument();
    expect(screen.getAllByText("$0.00").length).toBeGreaterThan(0);

    fireEvent.change(screen.getByPlaceholderText("Search expenses"), {
      target: { value: "missing" },
    });
    act(() => vi.advanceTimersByTime(400));
    expect(screen.getByText("No matching expenses")).toBeInTheDocument();
    fireEvent.click(screen.getByText("Clear Filters"));
    expect(screen.getByText("No expenses")).toBeInTheDocument();

    state.lang = "dr";
    rerender(<ExpensesMain dataEntryMode />);
    expect(document.querySelector("[dir='rtl']")).toBeInTheDocument();
    expect(screen.getByText("Can delete: false")).toBeInTheDocument();
  });
});

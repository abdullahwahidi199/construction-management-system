import React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { act, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";

const api = vi.hoisted(() => ({
  get: vi.fn(),
  delete: vi.fn(),
}));

const nav = vi.hoisted(() => ({
  navigate: vi.fn(),
}));

const authState = vi.hoisted(() => ({
  canDelete: true,
}));

const languageState = vi.hoisted(() => ({
  lang: "en",
}));

const realtime = vi.hoisted(() => ({
  callback: null,
}));

const toast = vi.hoisted(() => ({
  success: vi.fn(),
}));

const translate = vi.hoisted(() => (key, params) => {
  const dictionary = {
    "ProjectDetails.loading": "Loading project",
    "ProjectDetails.failedToLoad": "Failed to load project",
    "ProjectDetails.retry": "Retry",
    "ProjectDetails.backToProjects": "Back to projects",
    "ProjectDetails.edit": "Edit",
    "ProjectDetails.delete": "Delete",
    "ProjectDetails.downloadPdf": "Download PDF",
    "ProjectDetails.status.inProgress": "In progress",
    "ProjectDetails.status.completed": "Completed",
    "ProjectDetails.status.planning": "Planning",
    "ProjectDetails.status.onHold": "On hold",
    "ProjectDetails.status.cancelled": "Cancelled",
    "ProjectDetails.status.unknown": "Unknown",
    "ProjectDetails.totalFloors": "Total floors",
    "ProjectDetails.estimatedBudget": "Estimated budget",
    "ProjectDetails.expensesUsd": "Expenses USD",
    "ProjectDetails.expensesAfn": "Expenses AFN",
    "ProjectDetails.startDate": "Start date",
    "ProjectDetails.expectedCompletion": "Expected completion",
    "ProjectDetails.contractFinancialSummary": "Contract financial summary",
    "ProjectDetails.totalContractValue": "Total contract value",
    "ProjectDetails.totalPayments": "Total payments",
    "ProjectDetails.remainingBalance": "Remaining balance",
    "ProjectDetails.currency.usd": "USD",
    "ProjectDetails.currency.afn": "AFN",
    "ProjectDetails.timelineProgress": "Timeline progress",
    "ProjectDetails.projectInformation": "Project information",
    "ProjectDetails.projectName": "Project name",
    "ProjectDetails.propertyType": "Property type",
    "ProjectDetails.location": "Location",
    "ProjectDetails.importantDates": "Important dates",
    "ProjectDetails.actualCompletion": "Actual completion",
    "ProjectDetails.created": "Created",
    "ProjectDetails.lastUpdated": "Last updated",
    "ProjectDetails.notes": "Notes",
    "ProjectDetails.relativeDate.daysAgo": `${params?.count} days ago`,
    "ProjectDetails.relativeDate.today": "today",
    "ProjectDetails.relativeDate.tomorrow": "tomorrow",
    "ProjectDetails.relativeDate.inDays": `in ${params?.count} days`,
  };
  return dictionary[key] || key;
});

vi.mock("../../api/axiosInstance", () => ({
  default: api,
}));

vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return {
    ...actual,
    useNavigate: () => nav.navigate,
  };
});

vi.mock("../../auth/PermissionWrapper", () => ({
  default: ({ children, fallback }) => (authState.canDelete ? children : fallback),
}));

vi.mock("../../hooks/useLanguage", () => ({
  useLanguage: () => ({ t: translate, lang: languageState.lang }),
}));

vi.mock("../../hooks/useRealtimeEvents", () => ({
  default: (callback) => {
    realtime.callback = callback;
  },
}));

vi.mock("react-hot-toast", () => ({
  default: toast,
}));

vi.mock("../../components/reusableComponents/ProjectEditView", () => ({
  default: ({ projectId, onClose, onSaved }) => (
    <div role="dialog" aria-label="Edit project">
      <p>Editing project {projectId}</p>
      <button onClick={onSaved}>Save edit</button>
      <button onClick={onClose}>Close edit</button>
    </div>
  ),
}));

vi.mock("../../components/ui/DeleteConfirmModal", () => ({
  default: ({ open, onClose, onConfirm, itemName, loading }) =>
    open ? (
      <div role="dialog" aria-label="Delete project">
        <p>Delete {itemName}</p>
        <button onClick={onClose}>Cancel delete</button>
        <button onClick={onConfirm} disabled={loading}>
          {loading ? "Deleting" : "Confirm delete"}
        </button>
      </div>
    ) : null,
}));

import ProjectDetails from "./ProjectDetails";

const fullProject = {
  id: 7,
  name: "River Tower",
  location: "Kabul",
  property_type: "commercial",
  description: "Mixed-use high rise",
  status: "active",
  total_floors: 12,
  estimated_budget: "250000",
  total_expenses_usd: "12000",
  total_expenses_afn: "840000",
  start_date: "2026-01-01",
  expected_completion_date: "2026-07-31",
  actual_completion_date: "",
  created_at: "2025-12-01",
  updated_at: "2026-02-01",
  notes: "Use reinforced concrete.",
  total_contract_value: { USD: 200000, AFN: 14000000 },
  total_contract_payments: { USD: 50000, AFN: 3500000 },
  remaining_contract_balance: { USD: 150000, AFN: 10500000 },
  worker_payroll_summary: {
    USD: { count: 2, gross: 1000, advances: 100, deductions: 50, net: 850 },
    AFN: { count: 3, gross: 70000, advances: 5000, deductions: 1000, net: 64000 },
  },
};

function project(overrides = {}) {
  return {
    ...fullProject,
    ...overrides,
    total_contract_value: {
      ...fullProject.total_contract_value,
      ...(overrides.total_contract_value || {}),
    },
    total_contract_payments: {
      ...fullProject.total_contract_payments,
      ...(overrides.total_contract_payments || {}),
    },
    remaining_contract_balance: {
      ...fullProject.remaining_contract_balance,
      ...(overrides.remaining_contract_balance || {}),
    },
    worker_payroll_summary: {
      ...fullProject.worker_payroll_summary,
      ...(overrides.worker_payroll_summary || {}),
    },
  };
}

function renderProject(route = "/manager/projects/7") {
  return render(
    <MemoryRouter initialEntries={[route]}>
      <Routes>
        <Route path="/manager/projects/:id" element={<ProjectDetails />} />
      </Routes>
    </MemoryRouter>,
  );
}

describe("ProjectDetails", () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(new Date("2026-07-25T12:00:00Z"));
    api.get.mockReset();
    api.delete.mockReset();
    nav.navigate.mockReset();
    toast.success.mockReset();
    authState.canDelete = true;
    languageState.lang = "en";
    realtime.callback = null;
    window.URL.createObjectURL = vi.fn(() => "blob:project-pdf");
    window.URL.revokeObjectURL = vi.fn();
  });

  it("renders loading, rich project details, financial summaries, timeline, navigation, and PDF download", async () => {
    api.get.mockResolvedValueOnce({ data: fullProject }).mockResolvedValueOnce({ data: "pdf" });
    const clickSpy = vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => {});

    renderProject();

    expect(screen.getByText("Loading project")).toBeInTheDocument();
    expect(await screen.findByRole("heading", { name: "River Tower" })).toBeInTheDocument();
    expect(screen.getAllByText("Kabul").length).toBeGreaterThan(1);
    expect(screen.getAllByText("Commercial").length).toBeGreaterThan(1);
    expect(screen.getByText("Mixed-use high rise")).toBeInTheDocument();
    expect(screen.getByText("In progress")).toBeInTheDocument();
    expect(screen.getAllByText("$250,000").length).toBeGreaterThan(1);
    expect(screen.getByText("$12,000")).toBeInTheDocument();
    expect(screen.getAllByText("840,000").length).toBeGreaterThan(0);
    expect(screen.getByText("Contract financial summary")).toBeInTheDocument();
    expect(screen.getByText("Daily Worker Payroll")).toBeInTheDocument();
    expect(screen.getByText("2 records")).toBeInTheDocument();
    expect(screen.getByText("Timeline progress")).toBeInTheDocument();
    expect(screen.getByText("in 6 days")).toBeInTheDocument();
    expect(screen.getByText("Use reinforced concrete.")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /back to projects/i }));
    expect(nav.navigate).toHaveBeenCalledWith("/manager/projects");

    fireEvent.click(screen.getByRole("button", { name: /download pdf/i }));
    await waitFor(() => expect(api.get).toHaveBeenCalledWith("projects/7/export-pdf/", { responseType: "blob" }));
    expect(clickSpy).toHaveBeenCalled();
    expect(window.URL.revokeObjectURL).toHaveBeenCalledWith("blob:project-pdf");
    expect(toast.success).toHaveBeenCalledWith("Project PDF downloaded.");

    clickSpy.mockRestore();
  });

  it("shows fetch errors and retries into a successful detail view", async () => {
    api.get
      .mockRejectedValueOnce({ userMessage: "Not found" })
      .mockResolvedValueOnce({ data: project({ name: "Recovered Project" }) });

    renderProject();

    expect(await screen.findByText("Failed to load project")).toBeInTheDocument();
    expect(screen.getByText("Not found")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Retry" }));

    expect(await screen.findByRole("heading", { name: "Recovered Project" })).toBeInTheDocument();
    expect(api.get).toHaveBeenCalledTimes(2);
  });

  it("opens edit modal, closes it, saves edits, and refreshes project data", async () => {
    api.get
      .mockResolvedValueOnce({ data: project({ name: "Before Edit" }) })
      .mockResolvedValueOnce({ data: project({ name: "After Edit" }) });

    const { unmount } = renderProject();

    expect(await screen.findByRole("heading", { name: "Before Edit" })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Edit" }));
    expect(screen.getByRole("dialog", { name: "Edit project" })).toHaveTextContent("Editing project 7");

    fireEvent.click(screen.getByRole("button", { name: "Close edit" }));
    expect(screen.queryByRole("dialog", { name: "Edit project" })).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Edit" }));
    fireEvent.click(screen.getByRole("button", { name: "Save edit" }));

    expect(await screen.findByRole("heading", { name: "After Edit" })).toBeInTheDocument();
    expect(screen.queryByRole("dialog", { name: "Edit project" })).not.toBeInTheDocument();
  });

  it("handles delete permissions, cancel, successful delete, and delete API failures", async () => {
    api.get.mockResolvedValue({ data: project({ name: "Delete Candidate" }) });
    api.delete.mockRejectedValueOnce(new Error("denied")).mockResolvedValueOnce({});

    const { unmount } = renderProject();

    expect(await screen.findByRole("heading", { name: "Delete Candidate" })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Delete" }));
    const firstDialog = screen.getByRole("dialog", { name: "Delete project" });
    fireEvent.click(within(firstDialog).getByRole("button", { name: "Cancel delete" }));
    expect(screen.queryByRole("dialog", { name: "Delete project" })).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Delete" }));
    fireEvent.click(screen.getByRole("button", { name: "Confirm delete" }));
    await waitFor(() => expect(api.delete).toHaveBeenCalledWith("/projects/7/"));
    expect(nav.navigate).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole("button", { name: "Confirm delete" }));
    await waitFor(() => expect(nav.navigate).toHaveBeenCalledWith("/manager/projects"));
    expect(toast.success).toHaveBeenCalledWith("Project deleted.");
    unmount();

    authState.canDelete = false;
    api.get.mockResolvedValueOnce({ data: project({ name: "Read Only" }) });
    renderProject();

    expect(await screen.findByRole("heading", { name: "Read Only" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Delete" })).toBeDisabled();
  });

  it("refreshes for matching realtime project expense events and ignores unrelated messages", async () => {
    api.get
      .mockResolvedValueOnce({ data: project({ name: "Realtime One" }) })
      .mockResolvedValueOnce({ data: project({ name: "Realtime Updated" }) });

    renderProject();

    expect(await screen.findByRole("heading", { name: "Realtime One" })).toBeInTheDocument();
    act(() => realtime.callback({ event: "project.updated", payload: { project_id: 7 } }));
    act(() => realtime.callback({ event: "expense.created", payload: { project_id: 99 } }));
    expect(api.get).toHaveBeenCalledTimes(1);

    act(() => realtime.callback({ event: "expense.created", payload: { project_id: "7" } }));
    expect(await screen.findByRole("heading", { name: "Realtime Updated" })).toBeInTheDocument();
    expect(api.get).toHaveBeenCalledTimes(2);
  });

  it("covers status variants and timeline progress edge cases", async () => {
    const variants = [
      { status: "completed", expected: "Completed", progress: "100%", actual_completion_date: "2026-07-20" },
      { status: "planning", expected: "Planning", expected_completion_date: null, progress: null },
      { status: "on hold", expected: "On hold", start_date: "2026-07-30", expected_completion_date: "2026-08-01", progress: "0%" },
      { status: "cancelled", expected: "Cancelled", start_date: "2026-01-01", expected_completion_date: "2026-07-01", progress: "100%" },
      { status: "mystery", expected: "mystery", start_date: "1402-01-01", expected_completion_date: "1402-02-01", progress: null },
    ];

    for (const variant of variants) {
      api.get.mockResolvedValueOnce({
        data: project({
          name: `Project ${variant.expected}`,
          ...variant,
        }),
      });
      const { unmount } = renderProject();
      expect(await screen.findByRole("heading", { name: `Project ${variant.expected}` })).toBeInTheDocument();
      expect(screen.getByText(variant.expected)).toBeInTheDocument();
      if (variant.progress) {
        expect(screen.getByText(variant.progress)).toBeInTheDocument();
      } else {
        expect(screen.queryByText("Timeline progress")).not.toBeInTheDocument();
      }
      unmount();
    }
  });

  it("renders nullable defaults, missing project body, RTL language, and PDF failures without success toast", async () => {
    languageState.lang = "dr";
    api.get
      .mockResolvedValueOnce({
        data: project({
          name: "",
          location: "",
          property_type: "",
          description: "",
          status: "",
          total_floors: 0,
          estimated_budget: "0",
          total_expenses_usd: "0",
          total_expenses_afn: "0",
          start_date: "",
          expected_completion_date: "",
          created_at: "",
          updated_at: "",
          notes: "",
          total_contract_value: { USD: 0, AFN: 0 },
          total_contract_payments: { USD: 0, AFN: 0 },
          remaining_contract_balance: { USD: 0, AFN: 0 },
          worker_payroll_summary: { USD: {}, AFN: {} },
        }),
      })
      .mockRejectedValueOnce(new Error("download failed"));

    renderProject();

    await waitFor(() => expect(screen.getByText("Project information")).toBeInTheDocument());
    expect(screen.getByText("Unknown")).toBeInTheDocument();
    expect(screen.getAllByText("Not set").length).toBeGreaterThan(1);
    expect(screen.getAllByText("$0").length).toBeGreaterThan(0);
    expect(screen.getAllByText("0 records")).toHaveLength(2);

    fireEvent.click(screen.getByRole("button", { name: /download pdf/i }));
    await waitFor(() => expect(api.get).toHaveBeenCalledWith("projects/7/export-pdf/", { responseType: "blob" }));
    expect(toast.success).not.toHaveBeenCalled();

    api.get.mockResolvedValueOnce({ data: null });
    const { container } = renderProject();
    await waitFor(() => expect(api.get).toHaveBeenCalledTimes(3));
    expect(container).toBeEmptyDOMElement();
  });
});

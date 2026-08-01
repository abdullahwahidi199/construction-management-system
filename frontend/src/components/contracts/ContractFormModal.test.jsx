import React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";

vi.mock("../../auth/PermissionWrapper", () => ({
  default: ({ children }) => children,
}));

vi.mock("../../hooks/useFetch", () => ({
  default: (endpoint) => {
    if (endpoint === "projects/") {
      return { data: [{ id: 1, name: "Tower" }] };
    }
    if (endpoint === "subcontractors/") {
      return { data: [{ id: 7, name: "Kabul Concrete" }] };
    }
    return { data: [] };
  },
}));

vi.mock("../../hooks/useLanguage", () => ({
  useLanguage: () => ({
    t: (key) =>
      ({
        "ContractFormModal.titleCreate": "Create Contract",
        "ContractFormModal.fields.project": "Project",
        "ContractFormModal.fields.subcontractor": "Subcontractor",
        "ContractFormModal.fields.title": "Title",
        "ContractFormModal.fields.scopeOfWork": "Scope of Work",
        "ContractFormModal.fields.currency": "Currency",
        "ContractFormModal.fields.contractValue": "Contract Value",
        "ContractFormModal.fields.retentionPercentage": "Retention %",
        "ContractFormModal.fields.completionPercentage": "Completion %",
        "ContractFormModal.fields.startDate": "Start Date",
        "ContractFormModal.fields.endDate": "End Date",
        "ContractFormModal.fields.status": "Status",
        "ContractFormModal.fields.notes": "Notes",
        "ContractFormModal.placeholders.project": "Choose project",
        "ContractFormModal.placeholders.subcontractor": "Choose subcontractor",
        "ContractFormModal.placeholders.title": "Short title",
        "ContractFormModal.placeholders.scopeOfWork": "Scope",
        "ContractFormModal.placeholders.retentionPercentage": "5",
        "ContractFormModal.placeholders.completionPercentage": "0",
        "ContractFormModal.placeholders.notes": "Notes",
        "ContractFormModal.statusOptions.draft": "Draft",
        "ContractFormModal.statusOptions.active": "Active",
        "ContractFormModal.statusOptions.completed": "Completed",
        "ContractFormModal.statusOptions.terminated": "Terminated",
        "ContractFormModal.statusOptions.cancelled": "Cancelled",
        "ContractFormModal.validation.projectRequired": "Project is required",
        "ContractFormModal.validation.subcontractorRequired":
          "Subcontractor is required",
        "ContractFormModal.validation.titleRequired": "Title is required",
        "ContractFormModal.validation.currencyRequired": "Currency is required",
        "ContractFormModal.validation.contractValuePositive":
          "Contract value must be positive",
        "ContractFormModal.validation.startDateRequired":
          "Start date is required",
        "ContractFormModal.validation.endDateInvalid":
          "End date must be after start date",
        "ContractFormModal.validation.progressRange":
          "Progress must be 0 to 100",
        "ContractFormModal.buttons.cancel": "Cancel",
        "ContractFormModal.buttons.create": "Create",
        "ContractFormModal.buttons.saving": "Saving",
        "common.close": "Close",
      })[key] || key,
  }),
}));

vi.mock("../common/CalendarDatePicker", () => ({
  default: ({ name, value, onChange, error }) => (
    <label>
      {name}
      <input
        aria-label={name}
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
      {error && <span>{error}</span>}
    </label>
  ),
}));

import ContractFormModal from "./ContractFormModal";

describe("ContractFormModal", () => {
  let onSubmit;

  beforeEach(() => {
    onSubmit = vi.fn(() => Promise.resolve());
  });

  it("submits selected dates with the default currency instead of requiring them again", async () => {
    render(
      <ContractFormModal
        isOpen
        onClose={vi.fn()}
        onSubmit={onSubmit}
        loading={false}
      />,
    );

    fireEvent.change(screen.getByRole("combobox", { name: /Project/ }), {
      target: { value: "1" },
    });
    fireEvent.change(screen.getByRole("combobox", { name: /Subcontractor/ }), {
      target: { value: "7" },
    });
    fireEvent.change(screen.getByPlaceholderText("Short title"), {
      target: { value: "Foundation package" },
    });
    fireEvent.change(screen.getByPlaceholderText("AFN 0.00"), {
      target: { value: "120000" },
    });
    fireEvent.change(screen.getByLabelText("start_date"), {
      target: { value: "2026-07-01" },
    });
    fireEvent.change(screen.getByLabelText("end_date"), {
      target: { value: "2026-08-01" },
    });

    fireEvent.click(screen.getByRole("button", { name: "Create" }));

    await waitFor(() => expect(onSubmit).toHaveBeenCalledOnce());
    expect(onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({
        currency: "AFN",
        start_date: "2026-07-01",
        end_date: "2026-08-01",
        contract_value: 120000,
      }),
    );
  });
});

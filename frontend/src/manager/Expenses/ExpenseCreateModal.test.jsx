import React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";

vi.mock("../../auth/PermissionWrapper", () => ({
  default: ({ children }) => children,
}));

vi.mock("../../hooks/useLanguage", () => ({
  useLanguage: () => ({
    lang: "en",
    t: (key) =>
      ({
        "ExpenseCreateModal.title": "Create Expense",
        "ExpenseCreateModal.subtitle": "Create a new expense record",
        "ExpenseCreateModal.description": "Description",
        "ExpenseCreateModal.expenseDate": "Expense Date",
        "ExpenseCreateModal.amountUsd": "Amount in USD",
        "ExpenseCreateModal.amountAfn": "Amount in AFN",
        "ExpenseCreateModal.exchangeRate": "Exchange Rate",
        "ExpenseCreateModal.paidTo": "Paid To",
        "ExpenseCreateModal.expenseType": "Expense Type",
        "ExpenseCreateModal.category": "Category",
        "ExpenseCreateModal.project": "Project",
        "ExpenseCreateModal.remarks": "Remarks",
        "ExpenseCreateModal.enterDescription": "Enter expense description",
        "ExpenseCreateModal.paidToPlaceholder": "Who was this paid to?",
        "ExpenseCreateModal.remarksPlaceholder": "Any additional notes...",
        "ExpenseCreateModal.selectProject": "Select Project",
        "ExpenseCreateModal.projectExpense": "Project Expense",
        "ExpenseCreateModal.officeExpense": "Office Expense",
        "ExpenseCreateModal.general": "General",
        "ExpenseCreateModal.construction": "Construction",
        "ExpenseCreateModal.material": "Material",
        "ExpenseCreateModal.staffSalary": "Staff Salary",
        "ExpenseCreateModal.dailyWage": "Daily Wage",
        "ExpenseCreateModal.equipment": "Equipment",
        "ExpenseCreateModal.utility": "Utility",
        "ExpenseCreateModal.contractPayment": "Contract Payment",
        "ExpenseCreateModal.other": "Other",
        "ExpenseCreateModal.officeRent": "Office Rent",
        "ExpenseCreateModal.utilities": "Utilities",
        "ExpenseCreateModal.internet": "Internet",
        "ExpenseCreateModal.officeSupplies": "Office Supplies",
        "ExpenseCreateModal.staffMeals": "Staff Meals",
        "ExpenseCreateModal.transportation": "Transportation",
        "ExpenseCreateModal.fuel": "Fuel",
        "ExpenseCreateModal.cleaning": "Cleaning",
        "ExpenseCreateModal.maintenance": "Maintenance",
        "ExpenseCreateModal.softwareSubscriptions": "Software & Subscriptions",
        "ExpenseCreateModal.salaries": "Salaries",
        "ExpenseCreateModal.miscellaneous": "Miscellaneous",
        "ExpenseCreateModal.cancel": "Cancel",
        "ExpenseCreateModal.createExpense": "Create Expense",
        "ExpenseCreateModal.creating": "Creating...",
        "ExpenseCreateModal.descriptionRequired": "Description is required",
        "ExpenseCreateModal.dateRequired": "Date is required",
        "ExpenseCreateModal.amountRequired": "At least one amount is required",
        "ExpenseCreateModal.projectRequired": "Project is required",
        "ExpenseCreateModal.createFailed": "Failed to create expense",
        "ExpenseCreateModal.noPermission": "No permission",
      })[key] || key,
  }),
}));

vi.mock("../../components/common/CalendarDatePicker", () => ({
  default: ({ value, onChange }) => (
    <input
      aria-label="expense-date"
      value={value}
      onChange={(event) => onChange(event.target.value)}
    />
  ),
}));

import ExpenseCreateModal from "./ExpenseCreateModal";

describe("ExpenseCreateModal", () => {
  let onCreate;

  beforeEach(() => {
    onCreate = vi.fn(() => Promise.resolve());
  });

  it("creates office expenses without a project and with office categories", async () => {
    render(
      <ExpenseCreateModal
        isOpen
        onClose={vi.fn()}
        onCreate={onCreate}
        projects={[{ id: 1, name: "Tower" }]}
      />,
    );

    await waitFor(() => expect(screen.getByDisplayValue("Project Expense")).toBeInTheDocument());

    fireEvent.change(screen.getByDisplayValue("Project Expense"), {
      target: { value: "office" },
    });

    expect(screen.queryByDisplayValue("Select Project")).not.toBeInTheDocument();
    expect(screen.getByDisplayValue("Office Rent")).toBeInTheDocument();

    fireEvent.change(screen.getByPlaceholderText("Enter expense description"), {
      target: { value: "Monthly office rent" },
    });
    fireEvent.change(screen.getByLabelText("expense-date"), {
      target: { value: "2026-07-01" },
    });
    fireEvent.change(screen.getAllByPlaceholderText("0.00")[0], {
      target: { value: "500" },
    });

    fireEvent.click(screen.getByRole("button", { name: "Create Expense" }));

    await waitFor(() => expect(onCreate).toHaveBeenCalledOnce());
    expect(onCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        expense_scope: "office",
        expense_type: "office_rent",
        project: null,
        amount_usd: 500,
      }),
    );
  });

  it("requires a project for project expenses", async () => {
    render(
      <ExpenseCreateModal
        isOpen
        onClose={vi.fn()}
        onCreate={onCreate}
        projects={[{ id: 1, name: "Tower" }]}
      />,
    );

    await waitFor(() => expect(screen.getByDisplayValue("Project Expense")).toBeInTheDocument());
    fireEvent.change(screen.getByPlaceholderText("Enter expense description"), {
      target: { value: "Concrete" },
    });
    fireEvent.change(screen.getAllByPlaceholderText("0.00")[0], {
      target: { value: "200" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Create Expense" }));

    expect(await screen.findByText("Project is required")).toBeInTheDocument();
    expect(onCreate).not.toHaveBeenCalled();
  });
});

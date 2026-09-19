import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("../../hooks/useCalendar", () => ({
  useCalendar: () => ({
    formatDate: (value) => value || "",
    formatDateTime: (value) => value || "",
  }),
}));

vi.mock("../../hooks/useBodyScrollLock", () => ({
  default: vi.fn(),
}));

vi.mock("../../context/CompanyContext", () => ({
  useCompany: () => ({ company: { name: "Lanader" } }),
}));

vi.mock("../../components/common/PrintBranding", () => ({
  PrintBrandHeader: ({ title }) => <div>{title}</div>,
  PrintBrandFooter: () => <div>Footer</div>,
  renderPrintBrandHeader: () => "<header>Expense Receipt</header>",
  renderPrintBrandFooter: () => "<footer>Footer</footer>",
  renderPrintBrandingStyles: () => "",
}));

import ExpenseReceiptPrintModal from "./ExpenseReceiptPrintModal";

describe("ExpenseReceiptPrintModal", () => {
  it("shows cumulative contract payments and linked approved expenses", () => {
    render(
      <ExpenseReceiptPrintModal
        isOpen
        onClose={vi.fn()}
        expense={{
          id: 1,
          serial_number: 10,
          approval_status: "approved",
          expense_scope: "project",
          project_name: "Tower",
          expense_type: "contract_payment",
          description: "Plumbing installment",
          amount_usd: "50.00",
          amount_afn: "0.00",
          exchange_rate: "70.0000",
          total_usd_equivalent: "50.00",
          total_afn_equivalent: "3500.00",
          contract: 7,
          contract_label: "CNT-007 - Plumbing Works",
          contract_financial_summary: {
            payments_made_usd: "800.00",
            payments_made_afn: "0.00",
            total_contract_expenses_usd: "500.00",
            total_contract_expenses_afn: "0.00",
            total_cash_outflow_usd: "1300.00",
            total_cash_outflow_afn: "0.00",
          },
        }}
      />,
    );

    expect(screen.getByText("Contract Payment History")).toBeInTheDocument();
    expect(screen.getByText("CNT-007 - Plumbing Works")).toBeInTheDocument();
    expect(screen.getByText("$800.00")).toBeInTheDocument();
    expect(screen.getByText("$500.00")).toBeInTheDocument();
    expect(screen.getByText("$1,300.00")).toBeInTheDocument();
  });
});

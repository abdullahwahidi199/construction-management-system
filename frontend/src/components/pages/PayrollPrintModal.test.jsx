import React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";

const fetchState = vi.hoisted(() => ({
  data: null,
  loading: false,
  endpoint: null,
}));

vi.mock("../../hooks/useFetch", () => ({
  default: (endpoint) => {
    fetchState.endpoint = endpoint;
    return { data: fetchState.data, loading: fetchState.loading };
  },
}));

import PayrollPrintModal from "./PayrollPrintModal";

const richPayroll = {
  employee_name: "Ahmad Rahimi",
  employee_id: "EMP-105",
  position: "Site Engineer",
  project_name: "Tower A",
  payment_date: "2026-07-25",
  payroll_period_start: "2026-07-01",
  payroll_period_end: "2026-07-31",
  currency: "USD",
  basic_salary: 3000,
  overtime_amount: 250.5,
  overtime_hours: 12,
  bonus: 150,
  allowances: 75,
  deductions: 50,
  tax_deducted: 25,
  net_pay: 3400.5,
  amount_in_words: "Three thousand four hundred dollars",
};

function renderModal(props = {}) {
  return render(
    <PayrollPrintModal
      isOpen
      onClose={vi.fn()}
      payrollID={5}
      {...props}
    />,
  );
}

describe("PayrollPrintModal", () => {
  beforeEach(() => {
    fetchState.data = null;
    fetchState.loading = false;
    fetchState.endpoint = null;
    document.body.style.overflow = "";
    vi.restoreAllMocks();
  });

  it("does not render when closed and still builds a safe fetch endpoint", () => {
    const { container, unmount } = render(
      <PayrollPrintModal isOpen={false} onClose={vi.fn()} payrollID={null} />,
    );

    expect(container).toBeEmptyDOMElement();
    expect(fetchState.endpoint).toBeNull();
    expect(document.body.style.overflow).toBe("");

    unmount();
    expect(document.body.style.overflow).toBe("");
  });

  it("locks scroll while open, renders loading and empty states, and disables print without payroll", () => {
    fetchState.loading = true;
    const { rerender } = renderModal();

    expect(fetchState.endpoint).toBe("/payrolls/5/");
    expect(document.body.style.overflow).toBe("hidden");
    expect(screen.getByText("Loading payroll data...")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /print/i })).toBeDisabled();

    fetchState.loading = false;
    fetchState.data = null;
    rerender(<PayrollPrintModal isOpen onClose={vi.fn()} payrollID={5} />);

    expect(screen.getByText("No payroll data found.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /print/i })).toBeDisabled();
  });

  it("renders voucher data, closes from header and backdrop, and keeps inner clicks inside the modal", () => {
    const onClose = vi.fn();
    fetchState.data = richPayroll;

    renderModal({ onClose });

    expect(screen.getAllByText("Cash Payment Voucher").length).toBeGreaterThan(0);
    expect(screen.getByText("Tower A")).toBeInTheDocument();
    expect(screen.getAllByText("Ahmad Rahimi").length).toBeGreaterThan(1);
    expect(screen.getByText("Site Engineer")).toBeInTheDocument();
    expect(screen.getByText("105")).toBeInTheDocument();
    expect(screen.getByText("2026-07-25")).toBeInTheDocument();
    expect(screen.getAllByText(/2026-07-01 - 2026-07-31/).length).toBeGreaterThan(0);
    expect(screen.getAllByText("30").length).toBeGreaterThan(0);
    expect(screen.getAllByText(/USD\s+3,000/).length).toBeGreaterThan(0);
    expect(screen.getByText(/USD\s+250.5/)).toBeInTheDocument();
    expect(screen.getAllByText(/USD\s+75/).length).toBeGreaterThan(0);
    expect(screen.getByText(/USD\s+3,400.5/)).toBeInTheDocument();
    expect(screen.getByText(/Three thousand four hundred dollars/)).toBeInTheDocument();

    fireEvent.click(screen.getByText("Cash Payment Voucher Preview"));
    expect(onClose).not.toHaveBeenCalled();

    fireEvent.click(screen.getAllByRole("button").at(-1));
    expect(onClose).toHaveBeenCalledTimes(1);

    fireEvent.click(document.querySelector(".fixed.inset-0.bg-black\\/50"));
    expect(onClose).toHaveBeenCalledTimes(2);
  });

  it("writes the printable voucher, prints, closes, and handles blocked print windows", () => {
    vi.useFakeTimers();
    fetchState.data = richPayroll;
    const printableDocument = {
      write: vi.fn(),
      close: vi.fn(),
    };
    const printWindow = {
      document: printableDocument,
      focus: vi.fn(),
      print: vi.fn(),
      close: vi.fn(),
    };
    const open = vi.spyOn(window, "open").mockReturnValueOnce(printWindow).mockReturnValueOnce(null);

    renderModal();

    fireEvent.click(screen.getByRole("button", { name: /print/i }));

    expect(open).toHaveBeenCalledWith("", "_blank", "width=1050,height=750");
    expect(printableDocument.write).toHaveBeenCalledTimes(1);
    const html = printableDocument.write.mock.calls[0][0];
    expect(html).toContain("Cash Payment Voucher - Ahmad Rahimi");
    expect(html).toContain("Tower A");
    expect(html).toContain("USD 3,000");
    expect(html).toContain("USD 12.50");
    expect(html).toContain("USD 3,400.5");
    expect(printableDocument.close).toHaveBeenCalled();
    expect(printWindow.focus).toHaveBeenCalled();

    vi.advanceTimersByTime(300);
    expect(printWindow.print).toHaveBeenCalled();
    expect(printWindow.close).toHaveBeenCalled();

    fireEvent.click(screen.getByRole("button", { name: /print/i }));
    expect(open).toHaveBeenCalledTimes(2);

    vi.useRealTimers();
  });

  it("renders fallback payroll values and prints date, period, and number defaults", () => {
    fetchState.data = {
      employee_name: "",
      employee_id: "",
      position: "",
      project_name: "",
      payment_date: "",
      payroll_period_start: "",
      payroll_period_end: "",
      currency: "",
      basic_salary: "",
      overtime_amount: null,
      overtime_hours: undefined,
      bonus: 0,
      allowances: "",
      deductions: "",
      tax_deducted: "",
      net_pay: 0,
      amount_in_words: "",
    };
    const printableDocument = {
      write: vi.fn(),
      close: vi.fn(),
    };
    const printWindow = {
      document: printableDocument,
      focus: vi.fn(),
      print: vi.fn(),
      close: vi.fn(),
    };
    vi.spyOn(window, "open").mockReturnValue(printWindow);

    renderModal();

    expect(screen.getByText("PROJECT")).toBeInTheDocument();
    expect(screen.getByText("__ / __ / ____")).toBeInTheDocument();
    expect(screen.getAllByText("—").length).toBeGreaterThan(0);
    expect(screen.getAllByText("0").length).toBeGreaterThan(0);

    fireEvent.click(screen.getByRole("button", { name: /print/i }));

    const html = printableDocument.write.mock.calls[0][0];
    expect(html).toContain("Cash Payment Voucher - ");
    expect(html).toContain("PROJECT");
    expect(html).toContain("LALANDER 5 Employee's Payroll Voucher");
    expect(html).toContain("__ / __ / ____");
    expect(html).toContain("Salary for</span>");
    expect(html).toContain("<strong>30</strong> days");
    expect(html).toContain("H/R <strong>AFN 0</strong>");
  });
});

import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const api = vi.hoisted(() => ({ post: vi.fn(), patch: vi.fn() }));
const toast = vi.hoisted(() => ({ success: vi.fn() }));
const invoice = vi.hoisted(() => ({ props: null }));

vi.mock("../../api/axiosInstance", () => ({ default: api }));
vi.mock("../../auth/PermissionWrapper", () => ({ default: ({ children }) => children }));
vi.mock("../../hooks/useLanguage", () => ({
  useLanguage: () => ({ t: (key) => key, lang: "en" }),
}));
vi.mock("react-hot-toast", () => ({ default: toast }));
vi.mock("../../components/common/PrintableReceiptModal", () => ({
  default: (props) => {
    invoice.props = props;
    return props.isOpen ? <div role="dialog">{props.title}</div> : null;
  },
}));
vi.mock("../../components/common/CalendarDatePicker", () => ({
  default: ({ label, value, onChange, name, required }) => (
    <label>
      {label}
      <input
        aria-label={label}
        name={name}
        required={required}
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
    </label>
  ),
}));

import ApartmentSalesPanel from "./ApartmentSalesPanel";

const project = { id: 7, name: "River Tower", budget_currency: "USD" };
const apartment = { id: 11, apartment_number: "101", status: "AVAILABLE" };
const customer = { id: 4, name: "Amina Ahmadi", phone: "0700000000" };

describe("ApartmentSalesPanel", () => {
  beforeEach(() => {
    sessionStorage.clear();
    api.post.mockReset();
    api.patch.mockReset();
    toast.success.mockReset();
    invoice.props = null;
  });

  it("preserves a closed sale draft and clears it after a successful sale", async () => {
    api.post.mockResolvedValue({ data: { id: 20 } });
    const onRefresh = vi.fn().mockResolvedValue();
    render(
      <ApartmentSalesPanel
        apartment={apartment}
        customers={[customer]}
        sale={null}
        project={project}
        onRefresh={onRefresh}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Sell Apartment" }));
    fireEvent.change(screen.getByRole("combobox", { name: "Customer" }), { target: { value: "4" } });
    fireEvent.change(screen.getByRole("textbox", { name: "Sale date" }), { target: { value: "2026-09-01" } });
    fireEvent.change(screen.getByRole("spinbutton", { name: "Sale price" }), { target: { value: "100000" } });

    fireEvent.click(screen.getByRole("button", { name: "Close sale form" }));
    fireEvent.click(screen.getByRole("button", { name: "Sell Apartment" }));
    expect(screen.getByRole("spinbutton", { name: "Sale price" })).toHaveValue(100000);

    fireEvent.click(screen.getByRole("button", { name: "Confirm Sale" }));
    await waitFor(() => expect(api.post).toHaveBeenCalledWith("/projects/apartment-sales/", {
      apartment: 11,
      customer: 4,
      sale_date: "2026-09-01",
      sale_price: "100000",
      currency: "USD",
      notes: "",
    }));
    await waitFor(() => expect(sessionStorage.getItem("cms.apartment-sale.11")).toBeNull());
    expect(onRefresh).toHaveBeenCalled();
    expect(toast.success).toHaveBeenCalledWith("Apartment sale recorded.");
  });

  it("shows sale totals/history and preserves a closed payment draft", async () => {
    const sale = {
      id: 20,
      apartment: 11,
      customer: 4,
      customer_name: "Amina Ahmadi",
      customer_phone: "0700000000",
      customer_email: "amina@example.com",
      customer_address: "Kabul",
      project_name: "River Tower",
      building_name: "Tower A",
      floor_number: 1,
      apartment_number: "101",
      reference_number: "SALE-101",
      sale_date: "2026-09-01",
      sale_price: "100000.00",
      total_paid: "40000.00",
      remaining_balance: "60000.00",
      payment_status: "PARTIALLY_PAID",
      currency: "USD",
      payments: [{
        id: 30,
        receipt_number: "RCPT-100",
        payment_date: "2026-09-02",
        amount: "40000.00",
        currency: "USD",
        payment_method: "BANK_TRANSFER",
        payment_method_display: "Bank Transfer",
        reference: "BANK-1",
        recorded_by_name: "finance.manager",
        notes: "Second installment",
      }],
    };
    render(
      <ApartmentSalesPanel
        apartment={{ ...apartment, status: "SOLD" }}
        customers={[customer]}
        sale={sale}
        project={project}
        onRefresh={vi.fn().mockResolvedValue()}
      />,
    );

    expect(screen.getByText("PARTIALLY PAID")).toBeInTheDocument();
    expect(screen.getByText("RCPT-100")).toBeInTheDocument();
    expect(screen.getByText("BANK-1")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Print Invoice" }));
    expect(screen.getByRole("dialog")).toHaveTextContent("Sale Invoice");
    expect(invoice.props.numberLabel).toBe("Invoice No.");
    expect(invoice.props.receiptNumber).toBe("SALE-101");
    expect(invoice.props.tables[0].rows[0]).toMatchObject({
      receipt: "RCPT-100",
      reference: "BANK-1",
      amount: "USD 40,000.00",
    });

    fireEvent.click(screen.getByRole("button", { name: "Print Receipt" }));
    expect(invoice.props.title).toBe("Payment Receipt");
    expect(invoice.props.numberLabel).toBe("Receipt No.");
    expect(invoice.props.receiptNumber).toBe("RCPT-100");
    expect(invoice.props.amount).toBe("40000.00");
    expect(invoice.props.details).toEqual(expect.arrayContaining([
      { label: "Customer", value: "Amina Ahmadi" },
      { label: "Sale/reference number", value: "SALE-101" },
    ]));
    expect(invoice.props.sections[1].rows).toEqual(expect.arrayContaining([
      { label: "Payment Method", value: "Bank Transfer" },
      { label: "Recorded By", value: "finance.manager" },
    ]));
    expect(invoice.props.sections[2].rows).toEqual(expect.arrayContaining([
      { label: "Remaining", value: "USD 60,000.00" },
    ]));
    expect(invoice.props.notes).toBe("Second installment");

    fireEvent.click(screen.getByRole("button", { name: "Record Payment" }));
    fireEvent.change(screen.getByRole("spinbutton", { name: "Amount" }), { target: { value: "10000" } });
    fireEvent.change(screen.getByRole("textbox", { name: "Payment date" }), { target: { value: "2026-09-03" } });
    fireEvent.click(screen.getByRole("button", { name: "Close payment form" }));
    fireEvent.click(screen.getByRole("button", { name: "Record Payment" }));

    expect(screen.getByRole("spinbutton", { name: "Amount" })).toHaveValue(10000);
  });

  it("clears the payment draft after a successful payment", async () => {
    api.post.mockResolvedValue({ data: { id: 31 } });
    const sale = {
      id: 20,
      apartment: 11,
      customer: 4,
      customer_name: "Amina Ahmadi",
      reference_number: "SALE-101",
      sale_date: "2026-09-01",
      sale_price: "100000.00",
      total_paid: "40000.00",
      remaining_balance: "60000.00",
      payment_status: "PARTIALLY_PAID",
      currency: "USD",
      payments: [],
    };
    const onRefresh = vi.fn().mockResolvedValue();
    render(
      <ApartmentSalesPanel
        apartment={{ ...apartment, status: "SOLD" }}
        customers={[customer]}
        sale={sale}
        project={project}
        onRefresh={onRefresh}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Record Payment" }));
    fireEvent.change(screen.getByRole("spinbutton", { name: "Amount" }), { target: { value: "10000" } });
    fireEvent.change(screen.getByRole("textbox", { name: "Payment date" }), { target: { value: "2026-09-03" } });
    fireEvent.click(screen.getAllByRole("button", { name: "Record Payment" }).at(-1));

    await waitFor(() => expect(api.post).toHaveBeenCalledWith("/projects/apartment-payments/", {
      sale: 20,
      customer: 4,
      amount: "10000",
      currency: "USD",
      payment_date: "2026-09-03",
      payment_method: "CASH",
      reference: "",
      notes: "",
    }));
    await waitFor(() => expect(sessionStorage.getItem("cms.apartment-payment.20")).toBeNull());
    expect(onRefresh).toHaveBeenCalled();
  });

  it("edits and cancels an active sale", async () => {
    api.patch.mockResolvedValue({ data: {} });
    api.post.mockResolvedValue({ data: {} });
    const onRefresh = vi.fn().mockResolvedValue();
    const sale = {
      id: 20,
      apartment: 11,
      customer: 4,
      customer_name: "Amina Ahmadi",
      reference_number: "SALE-AUTO",
      sale_date: "2026-09-01",
      sale_price: "100000.00",
      total_paid: "0.00",
      remaining_balance: "100000.00",
      payment_status: "UNPAID",
      status: "ACTIVE",
      currency: "USD",
      payments: [],
      notes: "",
    };
    render(
      <ApartmentSalesPanel
        apartment={{ ...apartment, status: "SOLD" }}
        customers={[customer]}
        sale={sale}
        project={project}
        onRefresh={onRefresh}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Edit Sale" }));
    fireEvent.change(screen.getByRole("spinbutton", { name: "Sale price" }), { target: { value: "110000" } });
    fireEvent.change(screen.getByRole("combobox", { name: "Currency" }), { target: { value: "AFN" } });
    fireEvent.click(screen.getByRole("button", { name: "Save Changes" }));
    await waitFor(() => expect(api.patch).toHaveBeenCalledWith(
      "/projects/apartment-sales/20/",
      expect.objectContaining({ sale_price: "110000", currency: "AFN" }),
    ));

    fireEvent.click(screen.getByRole("button", { name: "Cancel Sale" }));
    fireEvent.change(screen.getByRole("textbox", { name: "Cancellation reason" }), { target: { value: "Buyer withdrew" } });
    fireEvent.click(screen.getAllByRole("button", { name: "Cancel Sale" }).at(-1));
    await waitFor(() => expect(api.post).toHaveBeenCalledWith(
      "/projects/apartment-sales/20/cancel/",
      { reason: "Buyer withdrew" },
    ));
    expect(onRefresh).toHaveBeenCalledTimes(2);
  });

  it("shows the cancellation reason and disables active-sale actions", () => {
    render(
      <ApartmentSalesPanel
        apartment={{ ...apartment, status: "AVAILABLE" }}
        customers={[customer]}
        sale={{
          id: 20,
          apartment: 11,
          customer: 4,
          customer_name: "Amina Ahmadi",
          reference_number: "SALE-AUTO",
          sale_date: "2026-09-01",
          sale_price: "100000.00",
          total_paid: "0.00",
          remaining_balance: "100000.00",
          payment_status: "CANCELLED",
          status: "CANCELLED",
          currency: "USD",
          payments: [],
          cancellation_reason: "Buyer withdrew from the agreement",
          cancelled_by_name: "sales-admin",
          cancelled_at: "2026-09-08T10:00:00Z",
        }}
        project={project}
        onRefresh={vi.fn()}
      />,
    );

    expect(screen.getByText("Buyer withdrew from the agreement")).toBeInTheDocument();
    expect(screen.getByText(/sales-admin/)).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Edit Sale" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Record Payment" })).not.toBeInTheDocument();
  });
});

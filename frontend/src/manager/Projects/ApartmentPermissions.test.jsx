import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const api = vi.hoisted(() => ({ get: vi.fn() }));
const auth = vi.hoisted(() => ({ permissions: [] }));

vi.mock("../../api/axiosInstance", () => ({ default: api }));
vi.mock("../../auth/AuthContext", () => ({
  useAuth: () => ({ permissions: auth.permissions }),
}));
vi.mock("../../hooks/useLanguage", () => ({
  useLanguage: () => ({ t: (key) => key, lang: "en" }),
}));

import ApartmentManagement from "./ApartmentManagement";
import ApartmentSalesPanel from "./ApartmentSalesPanel";

describe("Apartment management permissions", () => {
  beforeEach(() => {
    auth.permissions = ["buildings.view", "floors.view", "apartments.view"];
    api.get.mockReset();
    api.get.mockResolvedValue({ data: [] });
  });

  it("hides mutation actions when the matching resource permission is absent", async () => {
    render(<ApartmentManagement project={{ id: 7, name: "River Tower" }} />);
    fireEvent.click(screen.getByRole("button", { name: /apartment management/i }));
    fireEvent.click(await screen.findByRole("tab", { name: /manage structure/i }));

    expect(await screen.findByText("No buildings yet.")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Add Building" })).not.toBeInTheDocument();
  });

  it("shows a structure action only when its exact permission is present", async () => {
    auth.permissions = ["buildings.create"];
    render(<ApartmentManagement project={{ id: 7, name: "River Tower" }} />);
    fireEvent.click(screen.getByRole("button", { name: /apartment management/i }));
    fireEvent.click(await screen.findByRole("tab", { name: /manage structure/i }));

    expect((await screen.findAllByRole("button", { name: "Add Building" })).length)
      .toBeGreaterThan(0);
    expect(screen.queryByRole("button", { name: "Bulk Floors" }))
      .not.toBeInTheDocument();
  });

  it("keeps sale edit, cancel, payment, and print actions independently permissioned", () => {
    const sale = {
      id: 20,
      customer: 4,
      customer_name: "Amina Ahmadi",
      reference_number: "SALE-101",
      sale_date: "2026-09-01",
      sale_price: "100000.00",
      total_paid: "1000.00",
      remaining_balance: "99000.00",
      payment_status: "PARTIALLY_PAID",
      status: "ACTIVE",
      currency: "USD",
      payments: [{
        id: 30,
        receipt_number: "RCPT-101",
        payment_date: "2026-09-02",
        amount: "1000.00",
        currency: "USD",
        payment_method: "CASH",
      }],
    };
    const props = {
      apartment: { id: 11, apartment_number: "101", status: "SOLD" },
      customers: [{ id: 4, name: "Amina Ahmadi" }],
      sale,
      project: { id: 7, name: "River Tower", budget_currency: "USD" },
      onRefresh: vi.fn(),
    };

    auth.permissions = ["apartment_sales.update", "apartment_payments.view"];
    const { unmount } = render(<ApartmentSalesPanel {...props} />);
    expect(screen.getByRole("button", { name: "Edit Sale" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Cancel Sale" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Record Payment" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Print Invoice" })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Print Receipt" })).toBeInTheDocument();
    unmount();

    auth.permissions = [
      "apartment_sales.view",
      "apartment_sales.cancel",
      "apartment_payments.create",
    ];
    render(<ApartmentSalesPanel {...props} />);
    expect(screen.queryByRole("button", { name: "Edit Sale" })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Cancel Sale" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Record Payment" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Print Invoice" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Print Receipt" })).not.toBeInTheDocument();
  });
});

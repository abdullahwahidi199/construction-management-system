import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("../../hooks/useLanguage", () => ({
  useLanguage: () => ({ t: (key) => key }),
}));

import ApartmentSummary from "./ApartmentSummary";

describe("ApartmentSummary", () => {
  it("renders real inventory, statuses, and separated currency totals", () => {
    render(<ApartmentSummary data={{
      can_view_inventory: true,
      can_view_sales: true,
      inventory: { total: 3, available: 1, sold: 2 },
      sale_count: 2,
      payment_status: { unpaid: 0, partially_paid: 1, paid: 1 },
      currencies: {
        AFN: { sales: "200000", received: "50000", outstanding: "150000" },
        USD: { sales: "100000", received: "100000", outstanding: "0" },
      },
    }} />);

    expect(screen.getByText("Total Apartment Sales: 2")).toBeInTheDocument();
    expect(screen.getByText("200,000 AFN")).toBeInTheDocument();
    expect(screen.getAllByText("100,000 USD").length).toBeGreaterThan(0);
    expect(screen.getByText("Partially Paid: 1")).toBeInTheDocument();
  });
});

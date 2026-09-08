import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
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
vi.mock("../../components/common/CalendarDatePicker", () => ({
  default: ({ label, value, onChange }) => (
    <label>
      {label}
      <input aria-label={label} value={value} onChange={(event) => onChange(event.target.value)} />
    </label>
  ),
}));
vi.mock("./ApartmentSalesPanel", () => ({
  default: ({ sale }) => <div data-testid="sale-detail-panel">{sale.reference_number}</div>,
}));

import ApartmentSalesPage from "./ApartmentSalesPage";

const sales = [
  {
    id: 1,
    project: 7,
    project_name: "River Project",
    building: 3,
    building_name: "Tower A",
    floor_number: 2,
    apartment: 11,
    apartment_number: "201",
    customer: 4,
    customer_name: "Amina Ahmadi",
    customer_phone: "0700000000",
    reference_number: "SALE-101",
    sale_price: "100000.00",
    currency: "USD",
    total_paid: "40000.00",
    remaining_balance: "60000.00",
    payment_status: "PARTIALLY_PAID",
    sale_date: "2026-09-01",
  },
];

describe("ApartmentSalesPage", () => {
  beforeEach(() => {
    auth.permissions = ["apartment_sales.view", "apartments.view"];
    api.get.mockReset();
    api.get.mockResolvedValue({ data: sales });
  });

  it("shows real sale columns and applies the simple filters", async () => {
    render(<MemoryRouter><ApartmentSalesPage /></MemoryRouter>);

    expect((await screen.findAllByText("Amina Ahmadi")).length).toBeGreaterThan(0);
    expect(screen.getByRole("columnheader", { name: "Building" })).toBeInTheDocument();
    expect(screen.getByRole("columnheader", { name: "Floor" })).toBeInTheDocument();
    expect(screen.getByRole("columnheader", { name: "Payment Status" })).toBeInTheDocument();
    expect(screen.getAllByText("PARTIALLY PAID").length).toBeGreaterThan(0);

    fireEvent.change(screen.getByRole("combobox", { name: "Project" }), {
      target: { value: "7" },
    });
    fireEvent.change(screen.getByRole("textbox", { name: "Date" }), {
      target: { value: "2026-09-02" },
    });
    expect(screen.getByText("No apartment sales found.")).toBeInTheDocument();
  });

  it("loads the outstanding-only endpoint and uses the compact report columns", async () => {
    render(<MemoryRouter><ApartmentSalesPage outstandingOnly /></MemoryRouter>);

    await waitFor(() => expect(api.get).toHaveBeenCalledWith(
      "/projects/apartment-sales/",
      { params: { outstanding: true } },
    ));
    expect(screen.getByRole("heading", { name: "Outstanding Payments" })).toBeInTheDocument();
    expect(screen.getByRole("columnheader", { name: "Remaining" })).toBeInTheDocument();
    expect(screen.queryByRole("columnheader", { name: "Payment Status" })).not.toBeInTheDocument();
  });

  it("opens and closes a functioning sale detail workflow from the sales list", async () => {
    render(<MemoryRouter><ApartmentSalesPage /></MemoryRouter>);
    await screen.findAllByText("Amina Ahmadi");

    fireEvent.click(screen.getAllByRole("button", { name: "View Details" })[0]);
    expect(screen.getByRole("heading", { name: "Sale Details" })).toBeInTheDocument();
    expect(screen.getByTestId("sale-detail-panel")).toHaveTextContent("SALE-101");

    fireEvent.click(screen.getByRole("button", { name: "Close sale details" }));
    expect(screen.queryByTestId("sale-detail-panel")).not.toBeInTheDocument();
  });

  it("provides a visible route to the apartment sale workflow", async () => {
    render(<MemoryRouter initialEntries={["/manager/apartment-sales"]}><ApartmentSalesPage /></MemoryRouter>);

    await screen.findAllByText("Amina Ahmadi");
    expect(screen.getByRole("link", { name: "Manage Apartments / Sell Apartment" }))
      .toHaveAttribute("href", "/manager/apartment-management");
  });

  it("does not load or render sales without the sale view permission", () => {
    auth.permissions = ["apartment_sales.update", "apartment_sales.cancel"];

    render(<MemoryRouter><ApartmentSalesPage /></MemoryRouter>);

    expect(screen.getByText("You do not have permission to view apartment sales."))
      .toBeInTheDocument();
    expect(api.get).not.toHaveBeenCalled();
  });

  it("hides the apartment-management link without an apartment permission", async () => {
    auth.permissions = ["apartment_sales.view"];

    render(<MemoryRouter><ApartmentSalesPage /></MemoryRouter>);

    await screen.findAllByText("Amina Ahmadi");
    expect(screen.queryByRole("link", { name: "Manage Apartments / Sell Apartment" }))
      .not.toBeInTheDocument();
  });
});

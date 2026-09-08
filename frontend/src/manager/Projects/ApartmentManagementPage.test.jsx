import { fireEvent, render, screen, waitFor } from "@testing-library/react";
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
vi.mock("./ApartmentManagement", () => ({
  default: ({ project, defaultExpanded }) => (
    <div data-testid="apartment-management">
      {project.name}:{project.budget_currency}:{String(defaultExpanded)}
    </div>
  ),
}));

import ApartmentManagementPage from "./ApartmentManagementPage";

describe("ApartmentManagementPage", () => {
  beforeEach(() => {
    auth.permissions = ["apartments.view"];
    api.get.mockReset();
    api.get.mockImplementation((url) => {
      if (url === "/projects/") {
        return Promise.resolve({
          data: [
            { id: 7, name: "River Tower" },
            { id: 8, name: "Garden Homes" },
          ],
        });
      }
      if (url === "/projects/7/") {
        return Promise.resolve({ data: { id: 7, name: "River Tower", budget_currency: "USD" } });
      }
      return Promise.resolve({ data: { id: 8, name: "Garden Homes", budget_currency: "AFN" } });
    });
  });

  it("selects an accessible project and opens apartment management immediately", async () => {
    render(<ApartmentManagementPage />);

    expect(await screen.findByTestId("apartment-management"))
      .toHaveTextContent("River Tower:USD:true");
    expect(api.get).toHaveBeenCalledWith("/projects/7/");

    fireEvent.change(screen.getByRole("combobox", { name: "Select Project" }), {
      target: { value: "8" },
    });

    await waitFor(() => expect(screen.getByTestId("apartment-management"))
      .toHaveTextContent("Garden Homes:AFN:true"));
    expect(api.get).toHaveBeenCalledWith("/projects/8/");
  });

  it("allows one matching apartment permission and rejects unrelated permissions", async () => {
    auth.permissions = ["buildings.create"];
    const { unmount } = render(<ApartmentManagementPage />);
    expect(await screen.findByTestId("apartment-management")).toBeInTheDocument();
    unmount();

    auth.permissions = ["expenses.view"];
    api.get.mockClear();
    render(<ApartmentManagementPage />);
    expect(screen.getByText("You do not have permission to access apartment management."))
      .toBeInTheDocument();
    expect(screen.queryByTestId("apartment-management")).not.toBeInTheDocument();
    expect(api.get).not.toHaveBeenCalled();
  });
});

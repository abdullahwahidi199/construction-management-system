import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";

const api = vi.hoisted(() => ({
  get: vi.fn(),
  post: vi.fn(),
  patch: vi.fn(),
  delete: vi.fn(),
}));
const toast = vi.hoisted(() => ({ success: vi.fn() }));

vi.mock("../../api/axiosInstance", () => ({ default: api }));
vi.mock("../../auth/PermissionWrapper", () => ({ default: ({ children }) => children }));
vi.mock("../../hooks/useLanguage", () => ({
  useLanguage: () => ({ t: (key) => key, lang: "en" }),
}));
vi.mock("react-hot-toast", () => ({ default: toast }));

import ApartmentManagement from "./ApartmentManagement";

const project = { id: 7, name: "River Tower" };

function mockLists() {
  api.get.mockImplementation((url) => {
    if (url.includes("buildings")) {
      return Promise.resolve({ data: [{ id: 1, project: 7, name: "Tower A", description: "" }] });
    }
    if (url.includes("floors")) {
      return Promise.resolve({ data: [{ id: 2, project: 7, building: 1, floor_number: 1, name: "Ground" }] });
    }
    return Promise.resolve({ data: [] });
  });
}

async function openManagement() {
  fireEvent.click(screen.getByRole("button", { name: /apartment management/i }));
  fireEvent.click(await screen.findByRole("tab", { name: /manage structure/i }));
  await screen.findByText("Tower A");
}

describe("ApartmentManagement drafts", () => {
  beforeEach(() => {
    sessionStorage.clear();
    Object.values(api).forEach((mock) => mock.mockReset());
    toast.success.mockReset();
    mockLists();
  });

  it("can open immediately on a dedicated management page", async () => {
    render(<ApartmentManagement project={project} defaultExpanded />);

    expect(screen.getByRole("button", { name: /apartment management/i })).toHaveAttribute("aria-expanded", "true");
    fireEvent.click(await screen.findByRole("tab", { name: /manage structure/i }));
    expect(await screen.findByText("Tower A")).toBeInTheDocument();
  });

  it("preserves both bulk drafts when their forms are closed and reopened", async () => {
    render(<ApartmentManagement project={project} />);
    await openManagement();

    fireEvent.click(screen.getByText("Tower A"));
    fireEvent.click(screen.getByRole("button", { name: "Bulk Add Floors" }));
    fireEvent.change(screen.getByRole("spinbutton", { name: "Floor number 1" }), {
      target: { value: "4" },
    });
    fireEvent.change(screen.getByRole("textbox", { name: "Floor name 1" }), {
      target: { value: "Third Floor" },
    });
    fireEvent.click(screen.getAllByRole("button", { name: "Close" }).at(-1));
    expect(screen.queryByRole("form", { name: "Bulk Add Floors" })).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Bulk Add Floors" }));
    expect(screen.getByRole("spinbutton", { name: "Floor number 1" })).toHaveValue(4);
    expect(screen.getByRole("textbox", { name: "Floor name 1" })).toHaveValue("Third Floor");

    fireEvent.click(screen.getByRole("button", { name: /Ground/ }));
    fireEvent.click(screen.getByRole("button", { name: "Bulk Add Apartments" }));
    fireEvent.change(screen.getByRole("textbox", { name: "Apartment number 1" }), {
      target: { value: "101-A" },
    });
    fireEvent.click(screen.getAllByRole("button", { name: "Close" }).at(-1));
    fireEvent.click(screen.getByRole("button", { name: "Bulk Add Apartments" }));
    expect(screen.getByRole("textbox", { name: "Apartment number 1" })).toHaveValue("101-A");
  });

  it("clears a bulk floor draft only after successful submission", async () => {
    api.post.mockResolvedValue({ data: [{ id: 3, floor_number: 4 }] });
    render(<ApartmentManagement project={project} />);
    await openManagement();

    fireEvent.click(screen.getByText("Tower A"));
    fireEvent.click(screen.getByRole("button", { name: "Bulk Add Floors" }));
    fireEvent.change(screen.getByRole("spinbutton", { name: "Floor number 1" }), {
      target: { value: "4" },
    });
    fireEvent.click(screen.getByRole("button", { name: /^Create Floors/ }));

    await waitFor(() =>
      expect(api.post).toHaveBeenCalledWith("/projects/floors/bulk/", {
        building: 1,
        rows: [{ floor_number: 4, name: "" }],
      }),
    );
    await waitFor(() => expect(sessionStorage.getItem("cms.apartment-management.floors.7")).toBeNull());
    expect(toast.success).toHaveBeenCalledWith("Floors created.");

    fireEvent.click(screen.getByRole("button", { name: "Bulk Add Floors" }));
    expect(screen.getByRole("spinbutton", { name: "Floor number 1" })).toHaveValue(null);
  });

  it("explicitly discards floor and apartment drafts", async () => {
    render(<ApartmentManagement project={project} />);
    await openManagement();
    fireEvent.click(screen.getByText("Tower A"));

    fireEvent.click(screen.getByRole("button", { name: "Bulk Add Floors" }));
    fireEvent.change(screen.getByRole("spinbutton", { name: "Floor number 1" }), {
      target: { value: "9" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Discard Draft" }));
    expect(screen.getByRole("spinbutton", { name: "Floor number 1" })).toHaveValue(null);
    expect(sessionStorage.getItem("cms.apartment-management.floors.7")).toBeNull();

    fireEvent.click(screen.getByRole("button", { name: /Ground/ }));
    fireEvent.click(screen.getByRole("button", { name: "Bulk Add Apartments" }));
    fireEvent.change(screen.getByRole("textbox", { name: "Apartment number 1" }), {
      target: { value: "901" },
    });
    fireEvent.click(screen.getAllByRole("button", { name: "Discard Draft" }).at(-1));
    expect(screen.getByRole("textbox", { name: "Apartment number 1" })).toHaveValue("");
    expect(sessionStorage.getItem("cms.apartment-management.apartments.7")).toBeNull();
  });

  it("clears an apartment draft after successful bulk submission", async () => {
    api.post.mockResolvedValue({ data: [{ id: 10, apartment_number: "101" }] });
    render(<ApartmentManagement project={project} />);
    await openManagement();
    fireEvent.click(screen.getByText("Tower A"));
    fireEvent.click(screen.getByRole("button", { name: /Ground/ }));
    fireEvent.click(screen.getByRole("button", { name: "Bulk Add Apartments" }));
    fireEvent.change(screen.getByRole("textbox", { name: "Apartment number 1" }), {
      target: { value: "101" },
    });
    fireEvent.click(screen.getByRole("button", { name: /^Create Apartments/ }));

    await waitFor(() => expect(api.post).toHaveBeenCalledWith(
      "/projects/apartments/bulk/",
      {
        project: 7,
        building: 1,
        floor: 2,
        rows: [{
          apartment_number: "101",
          apartment_type: "",
          area: null,
          bedrooms: null,
          description: "",
        }],
      },
    ));
    await waitFor(() => expect(sessionStorage.getItem("cms.apartment-management.apartments.7")).toBeNull());
  });
});

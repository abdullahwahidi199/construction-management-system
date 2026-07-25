import React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";

vi.mock("../common/CalendarDatePicker", () => ({
  default: ({ label, value, onChange, module, error }) => (
    <label>
      {label}
      <input
        aria-label={label}
        data-module={module}
        value={value}
        onChange={(event) => onChange?.(event.target.value)}
      />
      {error && <span>{error}</span>}
    </label>
  ),
}));

vi.mock("../../hooks/useLanguage", () => ({
  useLanguage: () => ({ t: (key) => key }),
}));

import { ThemeProvider } from "../../context/ThemeContext";
import Button from "./Button";
import Card from "./Card";
import DeleteConfirmModal from "./DeleteConfirmModal";
import Input from "./Input";
import Select from "./Select";
import ThemeToggle from "./ToggleButton";

describe("UI primitives", () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.className = "";
  });

  it("Button renders icons, variants, disabled state, and click handling", () => {
    const onClick = vi.fn();
    render(
      <Button leftIcon={<span>Left</span>} rightIcon={<span>Right</span>} onClick={onClick}>
        Save
      </Button>,
    );

    fireEvent.click(screen.getByRole("button", { name: /left save right/i }));
    expect(onClick).toHaveBeenCalledOnce();
    expect(screen.getByText("Left")).toBeInTheDocument();
    expect(screen.getByText("Right")).toBeInTheDocument();
  });

  it("Input handles text fields, errors, and inferred date modules", () => {
    const onChange = vi.fn();
    const { rerender } = render(
      <Input label="Project name" value="Tower" onChange={onChange} error="Required" />,
    );

    fireEvent.change(screen.getByDisplayValue("Tower"), { target: { value: "Bridge" } });
    expect(onChange).toHaveBeenCalledWith("Bridge");
    expect(screen.getByText("Required")).toBeInTheDocument();

    rerender(
      <Input
        label="Payroll date"
        name="period_start"
        type="date"
        value="2026-01-01"
        onChange={onChange}
      />,
    );
    expect(screen.getByLabelText("Payroll date")).toHaveAttribute("data-module", "payroll");
  });

  it("Select renders placeholder/options and reports selected values", () => {
    const onChange = vi.fn();
    render(
      <Select
        label="Status"
        placeholder="Choose"
        value=""
        onChange={onChange}
        options={[
          { value: "active", label: "Active" },
          { value: "paused", label: "Paused" },
        ]}
      />,
    );

    fireEvent.change(screen.getByLabelText("Status"), { target: { value: "paused" } });
    expect(onChange).toHaveBeenCalledWith("paused");
  });

  it("Card renders optional header and body content", () => {
    render(
      <Card title="Finance" right={<button type="button">Export</button>}>
        Totals
      </Card>,
    );

    expect(screen.getByText("Finance")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Export" })).toBeInTheDocument();
    expect(screen.getByText("Totals")).toBeInTheDocument();
  });

  it("DeleteConfirmModal supports open aliases, loading state, and actions", () => {
    const onClose = vi.fn();
    const onConfirm = vi.fn();
    const { rerender } = render(
      <DeleteConfirmModal open={false} onClose={onClose} onConfirm={onConfirm} />,
    );
    expect(screen.queryByText("DeleteConfirmModal.title")).not.toBeInTheDocument();

    rerender(
      <DeleteConfirmModal
        isOpen
        title="Remove project"
        message="This action is permanent."
        loading
        onClose={onClose}
        onConfirm={onConfirm}
      />,
    );
    expect(screen.getByText("Remove project")).toBeInTheDocument();
    expect(screen.getByText("DeleteConfirmModal.deleting")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /deleting/i })).toBeDisabled();
  });

  it("ThemeProvider and ThemeToggle apply selected theme classes", () => {
    render(
      <ThemeProvider>
        <ThemeToggle />
      </ThemeProvider>,
    );

    const buttons = screen.getAllByRole("button");
    fireEvent.click(buttons[1]);
    expect(localStorage.getItem("theme")).toBe("dark");
    expect(document.documentElement.classList.contains("dark")).toBe(true);

    fireEvent.click(buttons[0]);
    expect(localStorage.getItem("theme")).toBe("light");
    expect(document.documentElement.classList.contains("dark")).toBe(false);
  });
});

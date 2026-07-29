import React, { useState } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import CalendarDatePicker from "./CalendarDatePicker";

vi.mock("../../hooks/useCalendar", () => ({
  useCalendar: () => ({ calendar: "shamsi" }),
}));

function WrappedPicker() {
  const [value, setValue] = useState("");

  return (
    <label>
      <span>Date</span>
      <CalendarDatePicker
        value={value}
        onChange={setValue}
        module="daily_worker_payroll"
      />
    </label>
  );
}

describe("CalendarDatePicker", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-03-21T12:00:00Z"));
  });

  afterEach(() => {
    cleanup();
    vi.useRealTimers();
  });

  it("closes the Shamsi picker after selecting a date inside a wrapping label", () => {
    render(<WrappedPicker />);

    const input = screen.getByLabelText("Date");
    fireEvent.focus(input);
    fireEvent.click(screen.getByRole("button", { name: "2" }));

    expect(input).toHaveValue("1405-01-02");
    expect(screen.queryByRole("button", { name: "Today" })).not.toBeInTheDocument();
  });

  it("keeps Today and Close controls working inside a wrapping label", () => {
    render(<WrappedPicker />);

    const input = screen.getByLabelText("Date");
    fireEvent.focus(input);
    fireEvent.click(screen.getByRole("button", { name: "Close" }));
    expect(screen.queryByRole("button", { name: "Today" })).not.toBeInTheDocument();

    fireEvent.focus(input);
    fireEvent.click(screen.getByRole("button", { name: "Today" }));

    expect(input).toHaveValue("1405-01-01");
    expect(screen.queryByRole("button", { name: "Today" })).not.toBeInTheDocument();
  });
});

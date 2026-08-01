import React from "react";
import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";

vi.mock("../../hooks/useLanguage", () => ({
  useLanguage: () => ({
    t: (key, params) => {
      const translations = {
        "reports.actions.apply": "Apply",
        "reports.actions.reset": "Reset",
        "reports.actions.exportPdf": "Export PDF",
        "reports.actions.exporting": "Exporting...",
        "reports.center": "Report Center",
        "reports.executiveReport": "Executive Report",
        "reports.filtersTitle": "Report Filters",
        "reports.generated": `Generated ${params?.date}`,
        "reports.groupedRecords": `${params?.count} grouped records`,
        "reports.table.recordCount": `${params?.count} records in this report view`,
        "reports.table.detailedRecords": "Detailed Records",
        "reports.states.noRecords": "No records found.",
      };
      return translations[key] ?? key;
    },
  }),
}));

vi.mock("../../hooks/useCalendar", () => ({
  useCalendar: () => ({ formatDate: (value) => `formatted-${value}` }),
}));

vi.mock("../common/CalendarDatePicker", () => ({
  default: ({ value, onChange }) => (
    <input
      aria-label="date-filter"
      value={value}
      onChange={(event) => onChange(event.target.value)}
    />
  ),
}));

import { REPORTS, REPORT_LIST } from "../../config/reportConfig";
import ReportBreakdowns from "./ReportBreakdowns";
import ReportFilters from "./ReportFilters";
import ReportSidebar from "./ReportSidebar";
import ReportSummary from "./ReportSummary";
import ReportTable from "./ReportTable";
import ReportToolbar from "./ReportToolbar";

describe("report components", () => {
  it("report config exposes all expected report definitions", () => {
    expect(REPORT_LIST.length).toBeGreaterThanOrEqual(7);
    expect(REPORTS.projects.endpoint).toBe("reports/projects/");
    expect(REPORTS.expenses.filters.some((field) => field.name === "status")).toBe(true);
    expect(REPORTS.expenses.filters.some((field) => field.name === "expense_scope")).toBe(true);
    expect(REPORT_LIST.every((report) => report.key && report.label && report.endpoint)).toBe(true);
  });

  it("ReportFilters changes select/text/date values and applies or resets", () => {
    const onChange = vi.fn();
    const onApply = vi.fn();
    const onReset = vi.fn();
    render(
      <ReportFilters
        filters={[
          {
            name: "status",
            label: "Status",
            type: "select",
            options: [
              { value: "", label: "All" },
              { value: "approved", label: "Approved" },
            ],
          },
          { name: "project_id", label: "Project ID", type: "number" },
          { name: "start_date", label: "Start Date", type: "date" },
        ]}
        values={{ status: "", project_id: "", start_date: "" }}
        onChange={onChange}
        onApply={onApply}
        onReset={onReset}
      />,
    );

    fireEvent.change(screen.getByDisplayValue("All"), { target: { value: "approved" } });
    expect(onChange).toHaveBeenCalledWith({ status: "approved", project_id: "", start_date: "" });

    fireEvent.change(screen.getByPlaceholderText("Project ID"), { target: { value: "42" } });
    expect(onChange).toHaveBeenCalledWith({ status: "", project_id: "42", start_date: "" });

    fireEvent.change(screen.getByLabelText("date-filter"), { target: { value: "2026-01-01" } });
    expect(onChange).toHaveBeenCalledWith({ status: "", project_id: "", start_date: "2026-01-01" });

    fireEvent.click(screen.getByRole("button", { name: /apply/i }));
    expect(onApply).toHaveBeenCalledOnce();
    fireEvent.click(screen.getByRole("button", { name: /reset/i }));
    expect(onReset).toHaveBeenCalledOnce();
  });

  it("ReportSummary renders scalar summary values and ignores nested objects", () => {
    const { rerender } = render(<ReportSummary summary={null} />);
    expect(screen.queryByText("Total Usd")).not.toBeInTheDocument();

    rerender(<ReportSummary summary={{ total_usd: 1250.5, status: "approved", nested: [] }} />);
    expect(screen.getByText("Total Usd")).toBeInTheDocument();
    expect(screen.getByText("1,250.5")).toBeInTheDocument();
    expect(screen.getByText("approved")).toBeInTheDocument();
  });

  it("ReportSummary does not present contract or payroll amounts as income", () => {
    render(
      <ReportSummary
        summary={{
          contract_value_usd: 1000,
          total_gross: 750,
          overall_total_expenses_usd: 500,
        }}
      />,
    );

    expect(screen.queryByText("Income")).not.toBeInTheDocument();
    expect(screen.getByText("Contract")).toBeInTheDocument();
    expect(screen.getByText("Payroll")).toBeInTheDocument();
    expect(screen.getByText("Outflow")).toBeInTheDocument();
  });

  it("ReportTable renders empty, numeric, date, boolean, and badge states", () => {
    const columns = [
      { key: "name", label: "Name" },
      { key: "date", label: "Date", type: "date" },
      { key: "amount", label: "Amount", type: "currency" },
      { key: "paid", label: "Paid", type: "bool" },
      { key: "status", label: "Status", type: "badge" },
    ];
    const { rerender } = render(<ReportTable columns={columns} rows={[]} />);
    expect(screen.getByText("No records found.")).toBeInTheDocument();

    rerender(
      <ReportTable
        columns={columns}
        rows={[
          {
            id: 1,
            name: "Tower",
            date: "2026-01-01",
            amount: 1000,
            paid: true,
            status: "completed",
          },
        ]}
      />,
    );
    expect(screen.getByText("Detailed Records")).toBeInTheDocument();
    expect(screen.getAllByText("Tower").length).toBeGreaterThan(0);
    expect(screen.getAllByText("formatted-2026-01-01").length).toBeGreaterThan(0);
    expect(screen.getAllByText("1,000.00").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Yes").length).toBeGreaterThan(0);
    expect(screen.getAllByText("completed").length).toBeGreaterThan(0);
  });

  it("ReportToolbar exports, shows disabled state, and renders generated timestamp", () => {
    const onExportPdf = vi.fn();
    const { rerender } = render(
      <ReportToolbar
        report={REPORTS.projects}
        onExportPdf={onExportPdf}
        exporting={false}
        generatedAt="2026-07-25"
      />,
    );

    expect(screen.getByText("Executive Report")).toBeInTheDocument();
    expect(screen.getByText("Generated 2026-07-25")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /export pdf/i }));
    expect(onExportPdf).toHaveBeenCalledOnce();

    rerender(<ReportToolbar report={REPORTS.projects} onExportPdf={onExportPdf} exporting />);
    expect(screen.getByRole("button", { name: /exporting/i })).toBeDisabled();
  });

  it("ReportSidebar supports mobile select and desktop navigation", () => {
    const onSelect = vi.fn();
    render(<ReportSidebar activeKey="projects" onSelect={onSelect} />);

    expect(screen.getByText("Report Center")).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText("Select report"), { target: { value: "expenses" } });
    expect(onSelect).toHaveBeenCalledWith("expenses");

    fireEvent.click(screen.getAllByRole("button", { name: /expenses/i })[0]);
    expect(onSelect).toHaveBeenCalledWith("expenses");
  });

  it("ReportBreakdowns renders top-level and summary grouped records", () => {
    const { rerender } = render(<ReportBreakdowns data={{ rows: [] }} />);
    expect(screen.queryByText("By Status")).not.toBeInTheDocument();

    rerender(
      <ReportBreakdowns
        data={{
          by_status: [{ status: "approved", count: 5 }],
          summary: {
            by_currency: [{ currency: "USD", total_usd: 1200 }],
          },
        }}
      />,
    );
    expect(screen.getByText("By Status")).toBeInTheDocument();
    expect(screen.getByText("Approved")).toBeInTheDocument();
    expect(screen.getByText("By Currency")).toBeInTheDocument();
    expect(screen.getAllByText("USD").length).toBeGreaterThan(0);
  });
});

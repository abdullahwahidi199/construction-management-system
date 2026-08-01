import React from "react";
import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";

const passthrough = vi.hoisted(
  () =>
    (name) =>
    ({ children, ...props }) => (
      <div data-chart={name} data-props={JSON.stringify(Object.keys(props))}>
        {children}
      </div>
    ),
);

vi.mock("recharts", () => ({
  Area: passthrough("Area"),
  AreaChart: passthrough("AreaChart"),
  Bar: passthrough("Bar"),
  BarChart: passthrough("BarChart"),
  CartesianGrid: passthrough("CartesianGrid"),
  Cell: passthrough("Cell"),
  Legend: passthrough("Legend"),
  Line: passthrough("Line"),
  LineChart: passthrough("LineChart"),
  Pie: passthrough("Pie"),
  PieChart: passthrough("PieChart"),
  ResponsiveContainer: passthrough("ResponsiveContainer"),
  Tooltip: passthrough("Tooltip"),
  XAxis: passthrough("XAxis"),
  YAxis: passthrough("YAxis"),
}));

vi.mock("../../hooks/useLanguage", () => ({
  useLanguage: () => ({
    t: (key, params) => {
      const translations = {
        "reports.states.noChartData": "No chart data available",
        "reports.metricTones.contract": "Contract",
        "reports.metricTones.outflow": "Outflow",
        "reports.metricTones.payroll": "Payroll",
        "reports.summary.contractPayments": "Contract Payments",
      };
      if (params?.count) return `${params.count} records`;
      return translations[key] ?? key.split(".").at(-1);
    },
  }),
}));

import ReportVisuals from "./ReportVisuals";

describe("ReportVisuals", () => {
  it.each([
    ["projects", "projectSpendProfile"],
    ["expenses", "monthlyExpenseTrend"],
    ["payroll", "payrollByWorkforce"],
    ["attendance", "attendanceStatus"],
    ["employees", "departmentWorkforce"],
    ["contracts", "contractCurrencyExposure"],
    ["financial", "operatingCostMix"],
  ])("renders the %s visual panel", (reportKey, title) => {
    render(<ReportVisuals reportKey={reportKey} data={{ summary: {} }} rows={[]} />);
    expect(screen.getByText(title)).toBeInTheDocument();
  });

  it("renders chart primitives when report data is present", () => {
    render(
      <ReportVisuals
        reportKey="projects"
        data={{
          summary: { by_status: [{ status: "ongoing", count: 2 }] },
        }}
        rows={[
          {
            name: "Tower",
            status: "ongoing",
            expenses_usd: 100,
            expenses_afn: 200,
            contracts_usd: 50,
            contracts_afn: 75,
            worker_payroll_usd: 25,
            worker_payroll_afn: 40,
            total_spent_usd: 175,
            total_spent_afn: 315,
          },
        ]}
      />,
    );

    expect(screen.getByText("projectSpendProfile")).toBeInTheDocument();
    expect(document.querySelectorAll("[data-chart='BarChart']").length).toBeGreaterThan(0);
  });

  it("returns nothing for missing data or unknown report keys", () => {
    const { container, rerender } = render(<ReportVisuals reportKey="projects" data={null} />);
    expect(container).toBeEmptyDOMElement();

    rerender(<ReportVisuals reportKey="unknown" data={{ summary: {} }} />);
    expect(container).toBeEmptyDOMElement();
  });
});

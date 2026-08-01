import React from "react";
import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";

vi.mock("../../hooks/useLanguage", () => ({
  useLanguage: () => ({
    t: (key) =>
      ({
        "kpi.totalProjects": "Total Projects",
        "kpi.ongoing": "ongoing",
        "kpi.completed": "completed",
        "kpi.totalOutflow": "Total Outflow",
        "kpi.activeContracts": "Active Contracts",
        "kpi.activeEmployees": "Active Employees",
        "kpi.officeExpensesThisMonth": "Office Expenses This Month",
        "kpi.projectExpensesThisMonth": "Project Expenses This Month",
        "kpi.totalExpenses": "Total Expenses",
        "kpi.thisMonthExpenses": "This Month Expenses",
        "kpi.overdueProjects": "Overdue Projects",
        "kpi.allOnTrack": "All on track",
        "kpi.needAttention": "Need attention",
      })[key] || key,
  }),
}));

import KPICards from "./KPICards";

describe("KPICards", () => {
  it("shows dashboard expense and outflow cards as raw USD/AFN buckets", () => {
    render(
      <KPICards
        projects={{
          total_projects: 2,
          status_breakdown: { ongoing: 1, completed: 1 },
          overdue_projects_count: 0,
        }}
        financial={{
          grand_total_outflow: { usd: 999, afn: 7000 },
          contracts: {
            total_contract_value_usd: 300,
            total_contract_value_afn: 21000,
          },
          expenses: {
            total_usd: 100,
            total_afn: 7000,
            total_usd_equivalent: 2254565,
          },
        }}
        workforce={{ active_employees: 4 }}
        contracts={{ status_breakdown: { active: 3 } }}
        expenseMonth={{
          trend: "stable",
          change_percentage: 0,
          current_month: {
            total_usd: 40,
            total_afn: 2100,
            total_usd_equivalent: 70,
            office: {
              total_usd: 10,
              total_afn: 700,
              total_usd_equivalent: 20,
            },
            project: {
              total_usd: 30,
              total_afn: 1400,
              total_usd_equivalent: 50,
            },
          },
        }}
      />,
    );

    expect(screen.queryByText("$20")).not.toBeInTheDocument();
    expect(screen.queryByText("$50")).not.toBeInTheDocument();
    expect(screen.queryByText("$2,254,565")).not.toBeInTheDocument();
    expect(screen.queryByText("$70")).not.toBeInTheDocument();
    expect(screen.getAllByText(/USD: \$10/).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/AFN: 700/).length).toBeGreaterThan(0);
    expect(screen.queryByText("$999")).not.toBeInTheDocument();
    expect(screen.getAllByText(/USD: \$999/).length).toBeGreaterThan(0);
  });
});

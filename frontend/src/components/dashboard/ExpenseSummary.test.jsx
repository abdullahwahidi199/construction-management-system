import React from "react";
import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";

vi.mock("../../hooks/useLanguage", () => ({
  useLanguage: () => ({
    t: (key) =>
      ({
        "expenseSummary.title": "Expense Summary",
        "expenseSummary.entries": "entries",
        "expenseSummary.monthlyTrend": "Monthly Trend",
        "expenseSummary.noData": "No data",
        "expenseSummary.general": "General",
        "expenseSummary.materials": "Materials",
        "expenseSummary.staffSalary": "Staff Salary",
        "expenseSummary.dailyWages": "Daily Wages",
        "expenseSummary.contracts": "Contracts",
        "expenseSummary.equipment": "Equipment",
        "expenseSummary.utilities": "Utilities",
        "expenseSummary.other": "Other",
        "expenseSummary.jan": "Jan",
        "expenseSummary.feb": "Feb",
        "expenseSummary.mar": "Mar",
        "expenseSummary.apr": "Apr",
        "expenseSummary.may": "May",
        "expenseSummary.jun": "Jun",
        "expenseSummary.jul": "Jul",
        "expenseSummary.aug": "Aug",
        "expenseSummary.sep": "Sep",
        "expenseSummary.oct": "Oct",
        "expenseSummary.nov": "Nov",
        "expenseSummary.dec": "Dec",
      })[key] || key,
  }),
}));

vi.mock("../ui/Card", () => ({
  default: ({ title, right, children }) => (
    <section>
      <h2>{title}</h2>
      <div>{right}</div>
      {children}
    </section>
  ),
}));

import ExpenseSummary from "./ExpenseSummary";

describe("ExpenseSummary", () => {
  it("uses USD EQ for category/project values and always includes office expenses", () => {
    render(
      <ExpenseSummary
        data={{
          total_expenses_usd: "1331281.23",
          total_expenses_usd_equivalent: "2256515.43",
          total_expense_count: 3883,
          office_expenses: {
            total_usd: "195092.00",
            total_usd_equivalent: "257410.00",
            count: 1020,
          },
          by_expense_type: [
            {
              expense_type: "general",
              total_usd: "1136189.23",
              total_usd_equivalent: "1999105.43",
              count: 2863,
            },
            {
              expense_type: "miscellaneous",
              total_usd: "195092.00",
              total_usd_equivalent: "257410.00",
              count: 1020,
            },
          ],
          by_project: [
            {
              project__id: 4,
              project__name: "Lalandar 4",
              expense_scope: "project",
              total_usd: "645030.00",
              total_usd_equivalent: "722835.26",
            },
          ],
          monthly_trend: [],
        }}
      />,
    );

    expect(screen.getByText("$2,256,515.43 USD EQ")).toBeInTheDocument();
    expect(screen.getByText("$2.0M USD EQ (2863)")).toBeInTheDocument();
    expect(screen.getByText("$723K USD EQ")).toBeInTheDocument();
    expect(screen.getByText("Office Expenses")).toBeInTheDocument();
    expect(screen.getByText("$257K USD EQ")).toBeInTheDocument();
    expect(screen.queryByText("$645K USD EQ")).not.toBeInTheDocument();
  });
});

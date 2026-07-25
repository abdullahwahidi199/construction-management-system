import { describe, expect, it } from "vitest";

import reports from "./reports";

describe("report translations", () => {
  it("provides report labels, actions, states, and chart text for supported locales", () => {
    expect(Object.keys(reports)).toEqual(["en", "dr", "ps"]);

    for (const locale of Object.values(reports)) {
      expect(locale.actions.exportPdf).toBeTruthy();
      expect(locale.actions.exporting).toBeTruthy();
      expect(locale.states.noRecords).toBeTruthy();
      expect(locale.table.detailedRecords).toBeTruthy();
      expect(locale.reportTypes.projects.label).toBeTruthy();
      expect(locale.reportTypes.expenses.description).toBeTruthy();
      expect(locale.charts.projectStatusMix).toBeTruthy();
      expect(locale.metrics.total_usd).toBeTruthy();
    }
  });
});

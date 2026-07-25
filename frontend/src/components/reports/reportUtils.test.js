import { describe, expect, it } from "vitest";

import {
  EMPTY_VALUE,
  formatLabel,
  formatMoney,
  formatValue,
  getArrayData,
  getReportRows,
  humanizeStatus,
  toNumber,
  translateOrFallback,
  translateReportKey,
} from "./reportUtils";

describe("report utilities", () => {
  it("formats labels, values, numbers, money and statuses", () => {
    expect(formatLabel("total__net_pay")).toBe("Total Net Pay");
    expect(formatValue(null)).toBe(EMPTY_VALUE);
    expect(formatValue(true)).toBe("Yes");
    expect(formatValue("1234.5")).toBe("1,234.5");
    expect(formatMoney("25", "USD")).toBe("25.00 USD");
    expect(humanizeStatus("partially_paid")).toBe("Partially Paid");
    expect(toNumber("bad")).toBe(0);
  });

  it("falls back when translation keys are missing", () => {
    const t = (key) => key;
    expect(translateOrFallback(t, "missing.key", "Fallback")).toBe("Fallback");
    expect(translateReportKey(t, "summary", "net_pay")).toBe("Net Pay");
  });

  it("extracts array data and report rows from supported shapes", () => {
    expect(getArrayData({ rows: [1] }, "rows")).toEqual([1]);
    expect(getArrayData({ summary: { rows: [2] } }, "rows")).toEqual([2]);
    expect(getArrayData({}, "rows")).toEqual([]);
    expect(getReportRows({ rows: [{ id: 1 }] })).toEqual([{ id: 1 }]);
    expect(getReportRows({ preview: [{ id: 2 }] })).toEqual([{ id: 2 }]);
  });
});

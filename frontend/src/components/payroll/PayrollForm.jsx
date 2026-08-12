import { useState, useEffect } from "react";
import toast from "react-hot-toast";
import usePost from "../../hooks/usePost";
import instance from "../../api/axiosInstance";
import PermissionWrapper from "../../auth/PermissionWrapper";
import Button from "../ui/Button";
import { useLanguage } from "../../hooks/useLanguage";
import { useCalendar } from "../../hooks/useCalendar";
import { getFriendlyErrorMessage } from "../../utils/apiErrors";
import CalendarDatePicker from "../common/CalendarDatePicker";
import CalendarMonthPicker from "../common/CalendarMonthPicker";
import {
  currentMonthKey,
  formatMonthKey,
  monthBoundsFromKey,
  monthKeyFromDate,
} from "../../utils/calendar";

const initialFormData = {
  employee: "",
  payroll_month: "",
  payroll_period_start: "",
  payroll_period_end: "",
  basic_salary: "",
  currency: "",
  overtime_hours: "",
  overtime_rate: "",
  bonus: "0",
  allowances: "0",
  deductions: "0",
  tax_deducted: "0",
  social_security: "0",
  payment_method: "cash",
  payment_date: "", // ADD THIS
  notes: "",
};

function numeric(value) {
  return Number.parseFloat(value || 0) || 0;
}

function money(value, currency = "AFN") {
  return `${currency} ${numeric(value).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function payrollPeriodFromMonth(monthKey, calendar) {
  const bounds = monthBoundsFromKey(monthKey, calendar);
  return {
    payroll_month: monthKey,
    payroll_period_start: bounds.start,
    payroll_period_end: bounds.end,
  };
}

export default function PayrollForm({
  employees,
  payrollId,
  onSuccess,
  onCancel,
}) {
  const [formData, setFormData] = useState(initialFormData);
  const { postData, loading, error } = usePost();
  const [payroll, setPayroll] = useState(null);
  const [saving, setSaving] = useState(false);
  const [localError, setLocalError] = useState("");
  const [outstandingAdvances, setOutstandingAdvances] = useState([]);
  const [loadingAdvances, setLoadingAdvances] = useState(false);
  const [advanceMode, setAdvanceMode] = useState(
    payrollId ? "keep" : "selected",
  );
  const [selectedAdvanceAmounts, setSelectedAdvanceAmounts] = useState({});
  const [partialAdvanceAmount, setPartialAdvanceAmount] = useState("");
  const [monthTouched, setMonthTouched] = useState(false);
  const { t } = useLanguage();
  const { calendar, formatDate } = useCalendar("payroll");

  useEffect(() => {
    if (!payrollId) return;

    const fetchPayroll = async () => {
      try {
        const res = await instance.get(`/payrolls/${payrollId}/`);
        setPayroll(res.data);
      } catch (err) {
        setLocalError(
          getFriendlyErrorMessage(
            err,
            "The requested item could not be found.",
          ),
        );
      }
    };

    fetchPayroll();
  }, [payrollId]);

  useEffect(() => {
    if (!payroll) return;

    const payrollMonth =
      monthKeyFromDate(payroll.payroll_period_start, calendar) ||
      currentMonthKey(calendar);
    const period = payrollPeriodFromMonth(payrollMonth, calendar);

    setFormData({
      employee: payroll.employee?.toString() || "",
      ...period,
      basic_salary: payroll.basic_salary || "",
      currency: payroll.currency || "AFN",
      overtime_hours: payroll.overtime_hours || "",
      overtime_rate: payroll.overtime_rate || "",
      bonus: payroll.bonus || "0",
      allowances: payroll.allowances || "0",
      deductions: payroll.deductions || "0",
      tax_deducted: payroll.tax_deducted || "0",
      social_security: payroll.social_security || "0",
      payment_method: payroll.payment_method || "cash",
      payment_date: payroll.payment_date || "", // ADD THIS
      notes: payroll.notes || "",
    });
    setAdvanceMode("keep");
    setMonthTouched(false);
  }, [payroll, calendar]);

  useEffect(() => {
    if (payroll || monthTouched) return;

    const payrollMonth = currentMonthKey(calendar);
    const period = payrollPeriodFromMonth(payrollMonth, calendar);
    setFormData((prev) => {
      if (
        prev.payroll_month === period.payroll_month &&
        prev.payroll_period_start === period.payroll_period_start &&
        prev.payroll_period_end === period.payroll_period_end
      ) {
        return prev;
      }
      return { ...prev, ...period };
    });
  }, [calendar, payroll, monthTouched]);

  useEffect(() => {
    if (!formData.employee || !formData.payroll_period_end) {
      setOutstandingAdvances([]);
      setSelectedAdvanceAmounts({});
      return;
    }

    const fetchOutstandingAdvances = async () => {
      try {
        setLoadingAdvances(true);
        const res = await instance.get(
          `/payrolls/outstanding_advances/?employee=${formData.employee}&period_end=${formData.payroll_period_end}`,
        );
        const advances = res.data?.advances || [];
        setOutstandingAdvances(advances);
        setSelectedAdvanceAmounts(
          Object.fromEntries(
            advances.map((advance) => [advance.id, advance.remaining_balance]),
          ),
        );
      } catch (err) {
        setOutstandingAdvances([]);
      } finally {
        setLoadingAdvances(false);
      }
    };

    fetchOutstandingAdvances();
  }, [formData.employee, formData.payroll_period_end]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    // Auto-fill salary when employee is selected
    if (name === "employee" && value) {
      const selectedEmployee = employees.find(
        (emp) => emp.id === parseInt(value),
      );
      if (selectedEmployee) {
        setFormData((prev) => ({
          ...prev,
          basic_salary: selectedEmployee.salary,
          currency: prev.currency || "AFN",
        }));
      }
    }
  };

  const handleDateChange = (name, value) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handlePayrollMonthChange = (value) => {
    setMonthTouched(true);
    setFormData((prev) => ({
      ...prev,
      ...payrollPeriodFromMonth(value, calendar),
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLocalError("");

    const period = payrollPeriodFromMonth(
      formData.payroll_month || currentMonthKey(calendar),
      calendar,
    );
    if (!period.payroll_period_start || !period.payroll_period_end) {
      setLocalError("Please select a valid payroll month.");
      return;
    }

    if (breakdown.net < 0) {
      setLocalError(
        "Payroll cannot be saved because net pay would be negative.",
      );
      return;
    }

    if (breakdown.advanceDeduction > breakdown.payableBeforeAdvances) {
      setLocalError(
        "Advance deductions cannot exceed the remaining payable salary.",
      );
      return;
    }

    const payload = {};
    const submissionData = { ...formData, ...period };
    Object.keys(submissionData).forEach((key) => {
      if (key === "payroll_month") return;
      if (submissionData[key] !== "") {
        payload[key] =
          key === "employee"
            ? parseInt(submissionData[key])
            : [
                  "basic_salary",
                  "overtime_hours",
                  "overtime_rate",
                  "bonus",
                  "allowances",
                  "deductions",
                  "tax_deducted",
                ].includes(key)
              ? parseFloat(submissionData[key]) || 0
              : submissionData[key];
      }
    });

    payload.advance_deduction_mode = advanceMode;
    if (advanceMode === "selected") {
      payload.advance_deductions_payload = Object.entries(
        selectedAdvanceAmounts,
      )
        .filter(([advanceId]) => selectedAdvanceIds.has(Number(advanceId)))
        .map(([advanceId, amount]) => ({
          advance: Number(advanceId),
          amount: numeric(amount),
        }))
        .filter((item) => item.amount > 0);
    }
    if (advanceMode === "partial") {
      payload.partial_advance_amount = numeric(partialAdvanceAmount);
    }

    try {
      setSaving(true);
      if (payroll?.id) {
        await instance.put(`/payrolls/${payroll.id}/`, payload);
        toast.success("Payroll updated.");
      } else {
        await postData("/payrolls/", payload);
        toast.success("Payroll created.");
      }
      onSuccess?.();
    } catch (err) {
      setLocalError(getFriendlyErrorMessage(err, "Unable to save changes."));
    } finally {
      setSaving(false);
    }
  };

  const inputClass =
    "min-h-12 w-full rounded-lg border px-3 py-3 text-base transition-colors focus:outline-none focus:ring-2 focus:ring-[var(--primary)] sm:min-h-0 sm:py-2 sm:text-sm";
  const labelClass = "block text-sm font-medium mb-1";

  const selectedAdvanceIds = new Set(
    Object.entries(selectedAdvanceAmounts)
      .filter(([_id, amount]) => numeric(amount) > 0)
      .map(([id]) => Number(id)),
  );
  const outstandingTotal = outstandingAdvances.reduce(
    (total, advance) => total + numeric(advance.remaining_balance),
    0,
  );
  const selectedAdvanceTotal = outstandingAdvances.reduce((total, advance) => {
    if (!selectedAdvanceIds.has(advance.id)) return total;
    return total + numeric(selectedAdvanceAmounts[advance.id]);
  }, 0);
  const breakdown = {
    basic: numeric(formData.basic_salary),
    overtime:
      numeric(formData.overtime_hours) * numeric(formData.overtime_rate),
    bonus: numeric(formData.bonus),
    allowances: numeric(formData.allowances),
    deductions: numeric(formData.deductions),
    tax: numeric(formData.tax_deducted),
  };
  breakdown.gross =
    breakdown.basic +
    breakdown.overtime +
    breakdown.bonus +
    breakdown.allowances;
  breakdown.payableBeforeAdvances =
    breakdown.gross - breakdown.deductions - breakdown.tax;
  breakdown.advanceDeduction =
    advanceMode === "keep"
      ? numeric(payroll?.advance_deductions)
      : advanceMode === "all"
        ? outstandingTotal
        : advanceMode === "selected"
          ? selectedAdvanceTotal
          : advanceMode === "partial"
            ? numeric(partialAdvanceAmount)
            : 0;
  breakdown.net = breakdown.payableBeforeAdvances - breakdown.advanceDeduction;

  const updateSelectedAdvance = (advanceId, checked) => {
    const advance = outstandingAdvances.find((item) => item.id === advanceId);
    setSelectedAdvanceAmounts((prev) => ({
      ...prev,
      [advanceId]: checked ? advance?.remaining_balance || "0" : "0",
    }));
  };

  const advanceMonthLabel = (advance) =>
    formatMonthKey(
      advance.advance_month || monthKeyFromDate(advance.date, calendar),
      calendar,
    ) ||
    formatDate(advance.date) ||
    advance.date;

  const advanceStatusLabel = (advance) => {
    if (advance.advance_status_label) return advance.advance_status_label;
    if (advance.status === "cancelled") return "Cancelled";
    if (numeric(advance.remaining_balance) <= 0) return "Fully Deducted";
    if (numeric(advance.remaining_balance) < numeric(advance.amount)) {
      return "Partially Deducted";
    }
    return "Outstanding";
  };
  const selectedEmployee = employees?.find(
    (emp) => emp.id === parseInt(formData.employee),
  );

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {(localError || error) && (
        <div
          className="p-3 rounded-lg text-sm"
          style={{ backgroundColor: "var(--danger)", color: "#fff" }}
        >
          {localError || error}
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className={labelClass} style={{ color: "var(--text)" }}>
            {t("PayrollForm.employee")} *
          </label>
          <select
            name="employee"
            value={formData.employee}
            onChange={handleChange}
            className={inputClass}
            style={{
              backgroundColor: "var(--bg)",
              color: "var(--text)",
              borderColor: "var(--border)",
            }}
            required
          >
            <option value="">{t("PayrollForm.selectEmployee")}</option>
            {employees?.map((emp) => (
              <option key={emp.id} value={emp.id}>
                {emp.full_name} ({emp.employee_id})
              </option>
            ))}
          </select>
          {selectedEmployee && (
            <p className="mt-1 text-xs text-[var(--muted)]">
              {selectedEmployee.employment_type_display ||
                (selectedEmployee.employment_type === "PROJECT"
                  ? "Project Employee"
                  : "Office Employee")}
              {selectedEmployee.project_name
                ? ` - ${selectedEmployee.project_name}`
                : ""}
            </p>
          )}
        </div>
        <div>
          <label className={labelClass} style={{ color: "var(--text)" }}>
            {t("PayrollForm.basicSalary")} *
          </label>
          <input
            type="number"
            name="basic_salary"
            value={formData.basic_salary}
            onChange={handleChange}
            className={inputClass}
            style={{
              backgroundColor: "var(--bg)",
              color: "var(--text)",
              borderColor: "var(--border)",
            }}
            step="0.01"
            required
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <CalendarMonthPicker
          label={`${t("PayrollForm.payrollMonth")} *`}
          name="payroll_month"
          value={formData.payroll_month}
          onChange={handlePayrollMonthChange}
          module="payroll"
          calendar={calendar}
          className={inputClass}
          style={{
            backgroundColor: "var(--bg)",
            color: "var(--text)",
            borderColor: "var(--border)",
          }}
          required
        />
        <div
          className="rounded-lg border px-4 py-3"
          style={{
            backgroundColor: "var(--hover)",
            borderColor: "var(--border)",
          }}
        >
          <div className="text-xs font-medium text-[var(--muted)]">
            {t("PayrollForm.periodPreview")}
          </div>
          <div className="mt-1 text-sm font-semibold text-[var(--text)]">
            {formatDate(formData.payroll_period_start) || "-"} -{" "}
            {formatDate(formData.payroll_period_end) || "-"}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div>
          <label className={labelClass} style={{ color: "var(--text)" }}>
            {t("PayrollForm.overtimeHours")}
          </label>
          <input
            type="number"
            name="overtime_hours"
            value={formData.overtime_hours}
            onChange={handleChange}
            className={inputClass}
            style={{
              backgroundColor: "var(--bg)",
              color: "var(--text)",
              borderColor: "var(--border)",
            }}
            step="0.5"
          />
        </div>
        <div>
          <label className={labelClass} style={{ color: "var(--text)" }}>
            {t("PayrollForm.overtimeRate")}
          </label>
          <input
            type="number"
            name="overtime_rate"
            value={formData.overtime_rate}
            onChange={handleChange}
            className={inputClass}
            style={{
              backgroundColor: "var(--bg)",
              color: "var(--text)",
              borderColor: "var(--border)",
            }}
            step="0.01"
          />
        </div>
        <div>
          <label className={labelClass} style={{ color: "var(--text)" }}>
            {t("PayrollForm.bonus")}
          </label>
          <input
            type="number"
            name="bonus"
            value={formData.bonus}
            onChange={handleChange}
            className={inputClass}
            style={{
              backgroundColor: "var(--bg)",
              color: "var(--text)",
              borderColor: "var(--border)",
            }}
            step="0.01"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div>
          <label className={labelClass} style={{ color: "var(--text)" }}>
            {t("PayrollForm.allowances")}
          </label>
          <input
            type="number"
            name="allowances"
            value={formData.allowances}
            onChange={handleChange}
            className={inputClass}
            style={{
              backgroundColor: "var(--bg)",
              color: "var(--text)",
              borderColor: "var(--border)",
            }}
            step="0.01"
          />
        </div>
        <div>
          <label className={labelClass} style={{ color: "var(--text)" }}>
            {t("PayrollForm.deductions")}
          </label>
          <input
            type="number"
            name="deductions"
            value={formData.deductions}
            onChange={handleChange}
            className={inputClass}
            style={{
              backgroundColor: "var(--bg)",
              color: "var(--text)",
              borderColor: "var(--border)",
            }}
            step="0.01"
          />
        </div>
        <div>
          <label className={labelClass} style={{ color: "var(--text)" }}>
            {t("PayrollForm.taxDeducted")}
          </label>
          <input
            type="number"
            name="tax_deducted"
            value={formData.tax_deducted}
            onChange={handleChange}
            className={inputClass}
            style={{
              backgroundColor: "var(--bg)",
              color: "var(--text)",
              borderColor: "var(--border)",
            }}
            step="0.01"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className={labelClass} style={{ color: "var(--text)" }}>
            {t("PayrollForm.currency")}
          </label>
          <select
            name="currency"
            value={formData.currency}
            onChange={handleChange}
            className={inputClass}
            style={{
              backgroundColor: "var(--bg)",
              color: "var(--text)",
              borderColor: "var(--border)",
            }}
          >
            <option value="AFN">AFN</option>
            <option value="USD">USD</option>
          </select>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className={labelClass} style={{ color: "var(--text)" }}>
              {t("PayrollForm.paymentMethod")}
            </label>
            <select
              name="payment_method"
              value={formData.payment_method}
              onChange={handleChange}
              className={inputClass}
              style={{
                backgroundColor: "var(--bg)",
                color: "var(--text)",
                borderColor: "var(--border)",
              }}
            >
              <option value="bank_transfer">
                {t("PayrollForm.paymentMethods.bankTransfer")}
              </option>
              <option value="check">
                {t("PayrollForm.paymentMethods.check")}
              </option>
              <option value="cash">
                {t("PayrollForm.paymentMethods.cash")}
              </option>
            </select>
          </div>

          <div>
            <label className={labelClass} style={{ color: "var(--text)" }}>
              {t("PayrollForm.paymentDate")}
            </label>
            <CalendarDatePicker
              name="payment_date"
              value={formData.payment_date}
              onChange={(value) => handleDateChange("payment_date", value)}
              module="payroll"
              className={inputClass}
              style={{
                backgroundColor: "var(--bg)",
                color: "var(--text)",
                borderColor: "var(--border)",
              }}
            />
          </div>
        </div>
      </div>

      <div>
        <label className={labelClass} style={{ color: "var(--text)" }}>
          {t("PayrollForm.notes")}
        </label>
        <textarea
          name="notes"
          value={formData.notes}
          onChange={handleChange}
          className={inputClass}
          style={{
            backgroundColor: "var(--bg)",
            color: "var(--text)",
            borderColor: "var(--border)",
          }}
          rows="2"
        />
      </div>

      {formData.employee && (
        <section
          className="rounded-lg border p-4"
          style={{ borderColor: "var(--border)" }}
        >
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <div>
              <h3 className="text-sm font-semibold text-[var(--text)]">
                Salary Advances
              </h3>
              <p className="text-xs text-[var(--muted)]">
                Includes outstanding advances through the selected payroll
                month.
              </p>
            </div>
            <span className="rounded-full bg-[var(--hover)] px-3 py-1 text-xs font-semibold">
              Outstanding: {money(outstandingTotal, formData.currency || "AFN")}
            </span>
          </div>

          {loadingAdvances ? (
            <p className="text-sm text-[var(--muted)]">Loading advances...</p>
          ) : outstandingAdvances.length === 0 && advanceMode !== "keep" ? (
            <p className="text-sm text-[var(--muted)]">
              No outstanding salary advances for this employee.
            </p>
          ) : (
            <div className="space-y-3">
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-4">
                {[
                  ["all", "Deduct all"],
                  ["selected", "Review each advance"],
                  ["partial", "Partial amount"],
                  ["none", "Leave for future"],
                ].map(([value, label]) => (
                  <label
                    key={value}
                    className="flex min-h-11 items-center gap-2 rounded-lg border px-3 py-2 text-sm"
                    style={{ borderColor: "var(--border)" }}
                  >
                    <input
                      type="radio"
                      name="advance_mode"
                      checked={advanceMode === value}
                      onChange={() => setAdvanceMode(value)}
                    />
                    {label}
                  </label>
                ))}
                {payroll && (
                  <label
                    className="flex min-h-11 items-center gap-2 rounded-lg border px-3 py-2 text-sm"
                    style={{ borderColor: "var(--border)" }}
                  >
                    <input
                      type="radio"
                      name="advance_mode"
                      checked={advanceMode === "keep"}
                      onChange={() => setAdvanceMode("keep")}
                    />
                    Keep current
                  </label>
                )}
              </div>

              {advanceMode === "selected" && (
                <div
                  className="overflow-hidden rounded-lg border"
                  style={{ borderColor: "var(--border)" }}
                >
                  {outstandingAdvances.map((advance) => (
                    <div
                      key={advance.id}
                      className="grid gap-3 border-b p-3 last:border-0 lg:grid-cols-[1.4fr_0.8fr_0.8fr_0.8fr_140px]"
                      style={{ borderColor: "var(--border)" }}
                    >
                      <label className="flex items-start gap-3 text-sm">
                        <input
                          type="checkbox"
                          className="mt-1"
                          checked={selectedAdvanceIds.has(advance.id)}
                          onChange={(event) =>
                            updateSelectedAdvance(
                              advance.id,
                              event.target.checked,
                            )
                          }
                        />
                        <span>
                          <span className="block font-medium">
                            {advanceMonthLabel(advance)}
                          </span>
                          <span className="block text-xs text-[var(--muted)]">
                            {advance.reason || "Salary advance"}
                          </span>
                        </span>
                      </label>
                      <div className="text-sm">
                        <span className="block text-xs font-semibold uppercase text-[var(--muted)]">
                          Original
                        </span>
                        <span className="font-medium">
                          {money(advance.amount, formData.currency || "AFN")}
                        </span>
                      </div>
                      <div className="text-sm">
                        <span className="block text-xs font-semibold uppercase text-[var(--muted)]">
                          Deducted
                        </span>
                        <span className="font-medium">
                          {money(
                            advance.amount_deducted,
                            formData.currency || "AFN",
                          )}
                        </span>
                      </div>
                      <div className="text-sm">
                        <span className="block text-xs font-semibold uppercase text-[var(--muted)]">
                          Remaining
                        </span>
                        <span className="font-medium">
                          {money(
                            advance.remaining_balance,
                            formData.currency || "AFN",
                          )}
                        </span>
                        <span className="mt-1 block text-xs text-[var(--muted)]">
                          {advanceStatusLabel(advance)}
                        </span>
                      </div>
                      <input
                        type="number"
                        min="0"
                        max={advance.remaining_balance}
                        step="0.01"
                        value={selectedAdvanceAmounts[advance.id] || "0"}
                        onChange={(event) =>
                          setSelectedAdvanceAmounts((prev) => ({
                            ...prev,
                            [advance.id]: event.target.value,
                          }))
                        }
                        className={inputClass}
                        style={{
                          backgroundColor: "var(--bg)",
                          color: "var(--text)",
                          borderColor: "var(--border)",
                        }}
                      />
                    </div>
                  ))}
                </div>
              )}

              {advanceMode === "partial" && (
                <div className="max-w-sm">
                  <label
                    className={labelClass}
                    style={{ color: "var(--text)" }}
                  >
                    Partial advance deduction
                  </label>
                  <input
                    type="number"
                    min="0"
                    max={outstandingTotal}
                    step="0.01"
                    value={partialAdvanceAmount}
                    onChange={(event) =>
                      setPartialAdvanceAmount(event.target.value)
                    }
                    className={inputClass}
                    style={{
                      backgroundColor: "var(--bg)",
                      color: "var(--text)",
                      borderColor: "var(--border)",
                    }}
                  />
                </div>
              )}
            </div>
          )}
        </section>
      )}

      <section
        className="rounded-lg border p-4"
        style={{ borderColor: "var(--border)" }}
      >
        <h3 className="mb-3 text-sm font-semibold text-[var(--text)]">
          Payroll Breakdown
        </h3>
        <div className="space-y-2 text-sm">
          {[
            ["Basic Salary", breakdown.basic, "plus"],
            ["Overtime", breakdown.overtime, "plus"],
            ["Allowances", breakdown.allowances, "plus"],
            ["Bonuses", breakdown.bonus, "plus"],
            ["Salary Advances", breakdown.advanceDeduction, "minus"],
            ["Deductions", breakdown.deductions, "minus"],
            ["Tax Deducted", breakdown.tax, "minus"],
          ].map(([label, amount, type]) => (
            <div key={label} className="flex justify-between gap-3">
              <span className="text-[var(--muted)]">
                {type === "minus" ? "- " : "+ "}
                {label}
              </span>
              <span className="font-medium">
                {money(amount, formData.currency || "AFN")}
              </span>
            </div>
          ))}
          <div
            className="flex justify-between border-t pt-3 text-base font-bold"
            style={{ borderColor: "var(--border)" }}
          >
            <span>= Net Pay</span>
            <span
              className={
                breakdown.net < 0
                  ? "text-[var(--danger)]"
                  : "text-[var(--success)]"
              }
            >
              {money(breakdown.net, formData.currency || "AFN")}
            </span>
          </div>
          {breakdown.advanceDeduction > breakdown.payableBeforeAdvances && (
            <p className="rounded-lg bg-red-500/10 px-3 py-2 text-sm text-[var(--danger)]">
              Advance deductions exceed the payable salary. Choose a partial
              amount or leave advances for a future payroll.
            </p>
          )}
        </div>
      </section>

      <div
        className="flex flex-col-reverse gap-3 border-t pt-4 sm:flex-row sm:justify-end"
        style={{ borderColor: "var(--border)" }}
      >
        <button
          type="button"
          onClick={onCancel}
          className="min-h-12 rounded-lg px-4 py-2 text-sm font-medium transition-colors sm:min-h-0"
          style={{ backgroundColor: "var(--hover)", color: "var(--text)" }}
        >
          {t("PayrollForm.buttons.cancel")}
        </button>
        <PermissionWrapper
          permissions={[payroll ? "payrolls.update" : "payrolls.create"]}
          fallback={
            <Button
              type="submit"
              variant="primary"
              disabled
              title={t("PayrollForm.permissions.noPermission")}
            >
              {payroll
                ? t("PayrollForm.buttons.update")
                : t("PayrollForm.buttons.create")}
            </Button>
          }
        >
          <button
            type="submit"
            disabled={loading || saving}
            className="min-h-12 rounded-lg px-4 py-2 text-sm font-medium text-white transition-colors disabled:opacity-50 sm:min-h-0"
            style={{ backgroundColor: "var(--primary)" }}
          >
            {loading || saving
              ? t("PayrollForm.buttons.processing")
              : payroll
                ? t("PayrollForm.buttons.update")
                : t("PayrollForm.buttons.create")}
          </button>
        </PermissionWrapper>
      </div>
    </form>
  );
}

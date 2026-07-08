import { useState, useEffect } from "react";
import usePost from "../../hooks/usePost";
import instance from "../../api/axiosInstance";
import PermissionWrapper from "../../auth/PermissionWrapper";
import Button from "../ui/Button";
import { useLanguage } from "../../hooks/useLanguage";

const initialFormData = {
  employee: "",
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
  payment_method: "bank_transfer",
  payment_date: "", // ADD THIS
  notes: "",
};

export default function PayrollForm({
  employees,
  payrollId,
  onSuccess,
  onCancel,
}) {
  const [formData, setFormData] = useState(initialFormData);
  const { postData, loading, error } = usePost();
  const [payroll, setPayroll] = useState(null);
  const { t } = useLanguage();

  console.log(payrollId);

  useEffect(() => {
    if (!payrollId) return;

    const fetchPayroll = async () => {
      try {
        const res = await instance.get(`/payrolls/${payrollId}/`);
        setPayroll(res.data);
      } catch (err) {
        console.error(err);
      }
    };

    fetchPayroll();
  }, [payrollId]);

  useEffect(() => {
    if (!payroll) return;

    setFormData({
      employee: payroll.employee?.toString() || "",
      payroll_period_start: payroll.payroll_period_start || "",
      payroll_period_end: payroll.payroll_period_end || "",
      basic_salary: payroll.basic_salary || "",
      currency: payroll.currency || "AFN",
      overtime_hours: payroll.overtime_hours || "",
      overtime_rate: payroll.overtime_rate || "",
      bonus: payroll.bonus || "0",
      allowances: payroll.allowances || "0",
      deductions: payroll.deductions || "0",
      tax_deducted: payroll.tax_deducted || "0",
      social_security: payroll.social_security || "0",
      payment_method: payroll.payment_method || "bank_transfer",
      payment_date: payroll.payment_date || "", // ADD THIS
      notes: payroll.notes || "",
    });
  }, [payroll]);

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
        }));
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const payload = {};
    Object.keys(formData).forEach((key) => {
      if (formData[key] !== "") {
        payload[key] =
          key === "employee"
            ? parseInt(formData[key])
            : [
                  "basic_salary",
                  "overtime_hours",
                  "overtime_rate",
                  "bonus",
                  "allowances",
                  "deductions",
                  "tax_deducted",
                ].includes(key)
              ? parseFloat(formData[key]) || 0
              : formData[key];
      }
    });

    try {
      if (payroll?.id) {
        await instance.put(`/payrolls/${payroll.id}/`, payload);
      } else {
        await postData("/payrolls/", payload);
      }
      onSuccess?.();
    } catch (err) {
      console.error("Error saving payroll:", err);
    }
  };

  const inputClass =
    "w-full px-3 py-2 rounded-lg border text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-[var(--primary)]";
  const labelClass = "block text-sm font-medium mb-1";

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div
          className="p-3 rounded-lg text-sm"
          style={{ backgroundColor: "var(--danger)", color: "#fff" }}
        >
          {typeof error === "object" ? JSON.stringify(error) : error}
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
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

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={labelClass} style={{ color: "var(--text)" }}>
            {t("PayrollForm.periodStart")} *
          </label>
          <input
            type="date"
            name="payroll_period_start"
            value={formData.payroll_period_start}
            onChange={handleChange}
            className={inputClass}
            style={{
              backgroundColor: "var(--bg)",
              color: "var(--text)",
              borderColor: "var(--border)",
            }}
            required
          />
        </div>
        <div>
          <label className={labelClass} style={{ color: "var(--text)" }}>
            {t("PayrollForm.periodEnd")} *
          </label>
          <input
            type="date"
            name="payroll_period_end"
            value={formData.payroll_period_end}
            onChange={handleChange}
            className={inputClass}
            style={{
              backgroundColor: "var(--bg)",
              color: "var(--text)",
              borderColor: "var(--border)",
            }}
            required
          />
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
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

      <div className="grid grid-cols-3 gap-4">
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

      <div className="grid grid-cols-2 gap-4">
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
        <div className="grid grid-cols-2 gap-4">
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
            <input
              type="date"
              name="payment_date"
              value={formData.payment_date}
              onChange={handleChange}
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

      <div
        className="flex gap-3 justify-end pt-4 border-t"
        style={{ borderColor: "var(--border)" }}
      >
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 rounded-lg text-sm font-medium transition-colors"
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
            disabled={loading}
            className="px-4 py-2 rounded-lg text-sm font-medium text-white transition-colors disabled:opacity-50"
            style={{ backgroundColor: "var(--primary)" }}
          >
            {loading
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

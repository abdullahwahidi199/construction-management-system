import React, { useState, useEffect } from "react";
import { useDailyWorkers } from "../../hooks/useDailyWorkers";
import { useLanguage } from "../../hooks/useLanguage";

function WorkerPayrollManager() {
  const { fetchPayrolls, generatePayrolls, markPayrollPaid, loading, error } =
    useDailyWorkers();
  const { t, language } = useLanguage();
  const isRTL = ["fa", "ps", "dari", "pashto"].includes(language);
  const textAlignment = isRTL ? "text-right" : "text-left";

  const [payrolls, setPayrolls] = useState([]);

  // Generator states
  const [periodStart, setPeriodStart] = useState("");
  const [periodEnd, setPeriodEnd] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("cash");

  useEffect(() => {
    loadPayrolls();
  }, []);

  const loadPayrolls = async () => {
    try {
      const data = await fetchPayrolls();
      setPayrolls(data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleGenerate = async (e) => {
    e.preventDefault();
    if (!periodStart || !periodEnd) return alert("Select date range");

    try {
      const res = await generatePayrolls({
        period_start: periodStart,
        period_end: periodEnd,
        payment_method: paymentMethod,
      });
      alert(res.message);
      loadPayrolls();
    } catch (err) {
      console.error(err);
    }
  };

  const handleMarkPaid = async (id) => {
    if (window.confirm("Confirm payment sent to worker?")) {
      await markPayrollPaid(id, new Date().toISOString().split("T")[0]);
      loadPayrolls();
    }
  };

  return (
    <div className="space-y-6" dir={isRTL ? "rtl" : "ltr"}>
      {/* Generation Panel */}
      <div
        className="rounded-lg border p-6"
        style={{ backgroundColor: "var(--card)", borderColor: "var(--border)" }}
      >
        <h2 className="text-lg font-semibold mb-4">Auto-Generate Payroll</h2>
        <p className="text-sm mb-4" style={{ color: "var(--muted)" }}>
          Select a date range (e.g. this week). The system will automatically
          calculate base pay and overtime based on the daily attendance marked
          by the foreman.
        </p>

        <form
          onSubmit={handleGenerate}
          className="flex flex-wrap gap-4 items-end"
        >
          <div>
            <label
              className="block text-sm mb-1"
              style={{ color: "var(--muted)" }}
            >
              Period Start
            </label>
            <input
              type="date"
              required
              value={periodStart}
              onChange={(e) => setPeriodStart(e.target.value)}
              className="rounded border px-3 py-2"
              style={{
                borderColor: "var(--border)",
                backgroundColor: "var(--bg)",
                color: "var(--text)",
              }}
            />
          </div>
          <div>
            <label
              className="block text-sm mb-1"
              style={{ color: "var(--muted)" }}
            >
              Period End
            </label>
            <input
              type="date"
              required
              value={periodEnd}
              onChange={(e) => setPeriodEnd(e.target.value)}
              className="rounded border px-3 py-2"
              style={{
                borderColor: "var(--border)",
                backgroundColor: "var(--bg)",
                color: "var(--text)",
              }}
            />
          </div>
          <div>
            <label
              className="block text-sm mb-1"
              style={{ color: "var(--muted)" }}
            >
              Default Method
            </label>
            <select
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value)}
              className="rounded border px-3 py-2"
              style={{
                borderColor: "var(--border)",
                backgroundColor: "var(--bg)",
                color: "var(--text)",
              }}
            >
              <option value="cash">Cash on Site</option>
              <option value="bank_transfer">Bank Transfer</option>
              <option value="mobile_money">Mobile Money</option>
            </select>
          </div>
          <button
            type="submit"
            disabled={loading}
            className="rounded px-6 py-2 font-medium text-white transition disabled:opacity-50"
            style={{ backgroundColor: "var(--primary)" }}
          >
            {loading ? "Generating..." : "Generate Payroll"}
          </button>
        </form>
        {error && <p className="text-red-500 mt-2 text-sm">{error}</p>}
      </div>

      {/* Payrolls List Table */}
      <div
        className="rounded-lg border"
        style={{ borderColor: "var(--border)", backgroundColor: "var(--bg)" }}
      >
        <div
          className="p-4 border-b"
          style={{
            borderColor: "var(--border)",
            backgroundColor: "var(--card)",
          }}
        >
          <h3 className="font-semibold">Generated Payrolls History</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead
              className="uppercase text-xs"
              style={{ backgroundColor: "var(--hover)", color: "var(--muted)" }}
            >
              <tr>
                <th className={`px-4 py-3 font-medium ${textAlignment}`}>
                  Worker
                </th>
                <th className={`px-4 py-3 font-medium ${textAlignment}`}>
                  Period
                </th>
                <th className={`px-4 py-3 font-medium ${textAlignment}`}>
                  Days Worked
                </th>
                <th className={`px-4 py-3 font-medium ${textAlignment}`}>
                  Net Pay
                </th>
                <th className={`px-4 py-3 font-medium ${textAlignment}`}>
                  Status
                </th>
                <th className={`px-4 py-3 font-medium ${textAlignment}`}>
                  Actions
                </th>
              </tr>
            </thead>
            <tbody
              className="divide-y"
              style={{ borderColor: "var(--border)" }}
            >
              {payrolls.length === 0 && (
                <tr>
                  <td
                    colSpan="6"
                    className="text-center py-6"
                    style={{ color: "var(--muted)" }}
                  >
                    No payrolls generated yet.
                  </td>
                </tr>
              )}
              {payrolls.map((pay) => (
                <tr key={pay.id}>
                  <td className={`px-4 py-3 ${textAlignment}`}>
                    <div className="font-medium">{pay.worker_name}</div>
                    <div className="text-xs" style={{ color: "var(--muted)" }}>
                      {pay.worker_id_code}
                    </div>
                  </td>
                  <td className={`px-4 py-3 ${textAlignment}`}>
                    {pay.period_start} to {pay.period_end}
                  </td>
                  <td className={`px-4 py-3 ${textAlignment}`}>
                    {pay.total_days_worked} Days
                    <br />
                    <span className="text-xs" style={{ color: "var(--muted)" }}>
                      + {pay.total_overtime_hours}h OT
                    </span>
                  </td>
                  <td
                    className={`px-4 py-3 font-bold ${textAlignment}`}
                    style={{ color: "var(--success)" }}
                  >
                    {pay.net_pay} {pay.currency}
                  </td>
                  <td className={`px-4 py-3 ${textAlignment}`}>
                    {pay.is_paid ? (
                      <span className="px-2 py-1 rounded bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300 text-xs">
                        Paid on {pay.payment_date}
                      </span>
                    ) : (
                      <span className="px-2 py-1 rounded bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300 text-xs">
                        Unpaid
                      </span>
                    )}
                  </td>
                  <td className={`px-4 py-3 ${textAlignment}`}>
                    {!pay.is_paid && (
                      <button
                        onClick={() => handleMarkPaid(pay.id)}
                        className="text-xs font-medium text-blue-600 hover:text-blue-800 transition"
                      >
                        Mark as Paid
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default WorkerPayrollManager;

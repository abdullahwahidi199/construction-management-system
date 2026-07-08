import React, { useState } from "react";
import { useDailyWorkers } from "../../hooks/useDailyWorkers";

function AddWorkerModal({ isOpen, onClose, onSuccess }) {
  const { createWorker, loading } = useDailyWorkers();

  const [formData, setFormData] = useState({
    first_name: "",
    last_name: "",
    phone: "",
    national_id: "",
    trade: "laborer",
    daily_rate: "",
    overtime_hourly_rate: "0",
    currency: "AFN",
  });

  if (!isOpen) return null;

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await createWorker(formData);
      onSuccess(); // Refresh the list
      onClose(); // Close the modal
      setFormData({
        // Reset form
        first_name: "",
        last_name: "",
        phone: "",
        national_id: "",
        trade: "laborer",
        daily_rate: "",
        overtime_hourly_rate: "0",
        currency: "AFN",
      });
    } catch (err) {
      console.error(err);
      alert("Failed to create worker. Check console for details.");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <div
        className="w-full max-w-lg rounded-lg shadow-lg"
        style={{ backgroundColor: "var(--card)", color: "var(--text)" }}
      >
        <div
          className="flex justify-between items-center border-b p-4"
          style={{ borderColor: "var(--border)" }}
        >
          <h2 className="text-lg font-bold">Add New Worker</h2>
          <button
            onClick={onClose}
            className="text-xl leading-none hover:opacity-70"
          >
            &times;
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label
                className="block text-sm mb-1"
                style={{ color: "var(--muted)" }}
              >
                First Name *
              </label>
              <input
                required
                type="text"
                name="first_name"
                value={formData.first_name}
                onChange={handleChange}
                className="w-full rounded border px-3 py-2 text-sm"
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
                Last Name *
              </label>
              <input
                required
                type="text"
                name="last_name"
                value={formData.last_name}
                onChange={handleChange}
                className="w-full rounded border px-3 py-2 text-sm"
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
                Phone
              </label>
              <input
                type="text"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                className="w-full rounded border px-3 py-2 text-sm"
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
                National ID / Tazkira
              </label>
              <input
                type="text"
                name="national_id"
                value={formData.national_id}
                onChange={handleChange}
                className="w-full rounded border px-3 py-2 text-sm"
                style={{
                  borderColor: "var(--border)",
                  backgroundColor: "var(--bg)",
                  color: "var(--text)",
                }}
              />
            </div>

            <div className="col-span-2">
              <label
                className="block text-sm mb-1"
                style={{ color: "var(--muted)" }}
              >
                Trade / Skill *
              </label>
              <select
                name="trade"
                value={formData.trade}
                onChange={handleChange}
                className="w-full rounded border px-3 py-2 text-sm"
                style={{
                  borderColor: "var(--border)",
                  backgroundColor: "var(--bg)",
                  color: "var(--text)",
                }}
              >
                <option value="laborer">General Laborer</option>
                <option value="mason">Mason</option>
                <option value="carpenter">Carpenter</option>
                <option value="electrician">Electrician</option>
                <option value="plumber">Plumber</option>
                <option value="painter">Painter</option>
                <option value="welder">Welder</option>
                <option value="steel_fixer">Steel Fixer</option>
                <option value="other">Other</option>
              </select>
            </div>

            <div>
              <label
                className="block text-sm mb-1"
                style={{ color: "var(--muted)" }}
              >
                Daily Rate *
              </label>
              <input
                required
                type="number"
                step="0.01"
                name="daily_rate"
                value={formData.daily_rate}
                onChange={handleChange}
                className="w-full rounded border px-3 py-2 text-sm"
                placeholder="e.g. 500"
                style={{
                  borderColor: "var(--border)",
                  backgroundColor: "var(--bg)",
                  color: "var(--text)",
                }}
              />
            </div>
            <div className="flex gap-2">
              <div className="flex-1">
                <label
                  className="block text-sm mb-1"
                  style={{ color: "var(--muted)" }}
                >
                  Overtime Rate/hr
                </label>
                <input
                  required
                  type="number"
                  step="0.01"
                  name="overtime_hourly_rate"
                  value={formData.overtime_hourly_rate}
                  onChange={handleChange}
                  className="w-full rounded border px-3 py-2 text-sm"
                  style={{
                    borderColor: "var(--border)",
                    backgroundColor: "var(--bg)",
                    color: "var(--text)",
                  }}
                />
              </div>
              <div className="w-1/3">
                <label
                  className="block text-sm mb-1"
                  style={{ color: "var(--muted)" }}
                >
                  Currency
                </label>
                <select
                  name="currency"
                  value={formData.currency}
                  onChange={handleChange}
                  className="w-full rounded border px-3 py-2 text-sm"
                  style={{
                    borderColor: "var(--border)",
                    backgroundColor: "var(--bg)",
                    color: "var(--text)",
                  }}
                >
                  <option value="AFN">AFN</option>
                  <option value="USD">USD</option>
                </select>
              </div>
            </div>
          </div>

          <div
            className="mt-6 flex justify-end gap-3 pt-4 border-t"
            style={{ borderColor: "var(--border)" }}
          >
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded text-sm border"
              style={{ borderColor: "var(--border)" }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 rounded text-sm text-white transition disabled:opacity-50"
              style={{ backgroundColor: "var(--primary)" }}
            >
              {loading ? "Saving..." : "Save Worker"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default AddWorkerModal;

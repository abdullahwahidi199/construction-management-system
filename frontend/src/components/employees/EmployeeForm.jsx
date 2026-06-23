import { useState, useEffect } from "react";
import usePost from "../../hooks/usePost";
import instance from "../../api/axiosInstance";
import Loading from "../common/Loading";

const initialFormData = {
  first_name: "",
  last_name: "",
  email: "",
  phone: "",
  address: "",
  department: "construction",
  position: "",
  employment_type: "full_time",
  hire_date: "",
  salary: "",
  hourly_rate: "",
  emergency_contact_name: "",
  emergency_contact_phone: "",
  is_active: true,
  notes: "",
};

export default function EmployeeForm({ employeeId, onSuccess, onCancel }) {
  const [formData, setFormData] = useState(initialFormData);
  const { postData, loading, error } = usePost();
  const [employee, setEmployee] = useState("");
  const [fetchloading, setLoading] = useState(false);

  const fetchEmployeeDetails = async () => {
    setLoading(true);
    try {
      const response = await instance.get(`/employees/${employeeId}/`);
      setEmployee(response.data);
    } catch (error) {
      console.log(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (employeeId) {
      fetchEmployeeDetails();
    }
  }, [employeeId]);

  useEffect(() => {
    if (employee && employee.id) {
      setFormData({
        ...initialFormData,
        ...employee,
        salary: employee.salary ?? "",
        hourly_rate: employee.hourly_rate ?? "",
        hire_date: employee.hire_date ? employee.hire_date.split("T")[0] : "",
      });
    }
  }, [employee]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const payload = {
      ...formData,
      salary: parseFloat(formData.salary) || 0,
      hourly_rate: formData.hourly_rate
        ? parseFloat(formData.hourly_rate)
        : null,
    };

    try {
      if (employee?.id) {
        await instance.put(`/employees/${employee.id}/`, payload);
      } else {
        await postData("/employees/", payload);
      }
      onSuccess?.();
    } catch (err) {
      console.error("Error saving employee:", err);
    }
  };

  if (fetchloading) {
    return <Loading />;
  }
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
            Email *
          </label>
          <input
            type="email"
            name="email"
            value={formData.email}
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

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={labelClass} style={{ color: "var(--text)" }}>
            First Name *
          </label>
          <input
            type="text"
            name="first_name"
            value={formData.first_name}
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
            Last Name *
          </label>
          <input
            type="text"
            name="last_name"
            value={formData.last_name}
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

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={labelClass} style={{ color: "var(--text)" }}>
            Phone *
          </label>
          <input
            type="text"
            name="phone"
            value={formData.phone}
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
            Address
          </label>
          <input
            type="text"
            name="address"
            value={formData.address}
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

      <div className="grid grid-cols-3 gap-4">
        <div>
          <label className={labelClass} style={{ color: "var(--text)" }}>
            Department
          </label>
          <select
            name="department"
            value={formData.department}
            onChange={handleChange}
            className={inputClass}
            style={{
              backgroundColor: "var(--bg)",
              color: "var(--text)",
              borderColor: "var(--border)",
            }}
          >
            <option value="management">Management</option>
            <option value="engineering">Engineering</option>
            <option value="construction">Construction</option>
            <option value="administration">Administration</option>
            <option value="finance">Finance</option>
            <option value="hr">Human Resources</option>
            <option value="procurement">Procurement</option>
            <option value="safety">Safety</option>
          </select>
        </div>
        <div>
          <label className={labelClass} style={{ color: "var(--text)" }}>
            Position *
          </label>
          <input
            type="text"
            name="position"
            value={formData.position}
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
            Employment Type
          </label>
          <select
            name="employment_type"
            value={formData.employment_type}
            onChange={handleChange}
            className={inputClass}
            style={{
              backgroundColor: "var(--bg)",
              color: "var(--text)",
              borderColor: "var(--border)",
            }}
          >
            <option value="full_time">Full Time</option>
            <option value="part_time">Part Time</option>
            <option value="contract">Contract</option>
            <option value="temporary">Temporary</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div>
          <label className={labelClass} style={{ color: "var(--text)" }}>
            Hire Date *
          </label>
          <input
            type="date"
            name="hire_date"
            value={formData.hire_date}
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
            Salary *
          </label>
          <input
            type="number"
            name="salary"
            value={formData.salary}
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
        <div>
          <label className={labelClass} style={{ color: "var(--text)" }}>
            Hourly Rate
          </label>
          <input
            type="number"
            name="hourly_rate"
            value={formData.hourly_rate}
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
            Emergency Contact
          </label>
          <input
            type="text"
            name="emergency_contact_name"
            value={formData.emergency_contact_name}
            onChange={handleChange}
            className={inputClass}
            style={{
              backgroundColor: "var(--bg)",
              color: "var(--text)",
              borderColor: "var(--border)",
            }}
          />
        </div>
        <div>
          <label className={labelClass} style={{ color: "var(--text)" }}>
            Emergency Phone
          </label>
          <input
            type="text"
            name="emergency_contact_phone"
            value={formData.emergency_contact_phone}
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

      <div>
        <label className={labelClass} style={{ color: "var(--text)" }}>
          Notes
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
          rows="3"
        />
      </div>

      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          name="is_active"
          checked={formData.is_active}
          onChange={handleChange}
          className="w-4 h-4"
        />
        <label className="text-sm font-medium" style={{ color: "var(--text)" }}>
          Active Employee
        </label>
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
          Cancel
        </button>
        <button
          type="submit"
          disabled={loading}
          className="px-4 py-2 rounded-lg text-sm font-medium text-white transition-colors disabled:opacity-50"
          style={{ backgroundColor: "var(--primary)" }}
        >
          {loading
            ? "Saving..."
            : employee
              ? "Update Employee"
              : "Add Employee"}
        </button>
      </div>
    </form>
  );
}

import { useState, useEffect } from "react";
import toast from "react-hot-toast";
import usePost from "../../hooks/usePost";
import instance from "../../api/axiosInstance";
import Loading from "../common/Loading";
import PermissionWrapper from "../../auth/PermissionWrapper";
import Button from "../ui/Button";
import { fieldControlClass, fieldLabelClass } from "../ui/formStyles.jsx";
import { useLanguage } from "../../hooks/useLanguage";
import { getFriendlyErrorMessage } from "../../utils/apiErrors";
import CalendarDatePicker from "../common/CalendarDatePicker";

const RTL_LANGS = ["dr", "ps", "fa", "dar", "prs"];

const initialFormData = {
  first_name: "",
  last_name: "",
  email: "",
  phone: "",
  address: "",
  department: "construction",
  position: "",
  employment_type: "OFFICE",
  project: "",
  job_type: "full_time",
  hire_date: "",
  salary: "",
  hourly_rate: "",
  emergency_contact_name: "",
  emergency_contact_phone: "",
  is_active: true,
  notes: "",
};

export default function EmployeeForm({ employee, employeeId, onSuccess, onCancel }) {
  const { t, lang } = useLanguage();
  const isRTL = RTL_LANGS.includes(lang);
  const effectiveEmployeeId = employeeId || employee?.id;

  const [formData, setFormData] = useState(initialFormData);
  const { postData, loading, error } = usePost();
  const [currentEmployee, setCurrentEmployee] = useState(employee || null);
  const [fetchloading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [localError, setLocalError] = useState("");
  const [projects, setProjects] = useState([]);

  const fetchEmployeeDetails = async () => {
    setLoading(true);
    setLocalError("");
    try {
      const response = await instance.get(`/employees/${effectiveEmployeeId}/`);
      setCurrentEmployee(response.data);
    } catch (error) {
      setLocalError(
        getFriendlyErrorMessage(error, "The requested item could not be found."),
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (employee?.id) {
      setCurrentEmployee(employee);
      return;
    }
    if (effectiveEmployeeId) {
      fetchEmployeeDetails();
    }
  }, [employee?.id, effectiveEmployeeId]);

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const response = await instance.get("/projects/");
        setProjects(Array.isArray(response.data) ? response.data : []);
      } catch {
        setProjects([]);
      }
    };
    fetchProjects();
  }, []);

  useEffect(() => {
    if (currentEmployee && currentEmployee.id) {
      setFormData({
        ...initialFormData,
        ...currentEmployee,
        salary: currentEmployee.salary ?? "",
        hourly_rate: currentEmployee.hourly_rate ?? "",
        project: currentEmployee.project ?? "",
        hire_date: currentEmployee.hire_date ? currentEmployee.hire_date.split("T")[0] : "",
      });
    }
  }, [currentEmployee]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
      ...(name === "employment_type" && value === "OFFICE" ? { project: "" } : {}),
    }));
  };

  const handleDateChange = (name, value) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLocalError("");

    const payload = {
      ...formData,
      salary: parseFloat(formData.salary) || 0,
      hourly_rate: formData.hourly_rate
        ? parseFloat(formData.hourly_rate)
        : null,
      project: formData.employment_type === "PROJECT" ? formData.project || null : null,
    };

    try {
      setSaving(true);
      if (currentEmployee?.id) {
        await instance.put(`/employees/${currentEmployee.id}/`, payload);
        toast.success("Employee updated.");
      } else {
        await postData("/employees/", payload);
        toast.success("Employee created.");
      }
      onSuccess?.();
    } catch (err) {
      setLocalError(getFriendlyErrorMessage(err, "Unable to save changes."));
    } finally {
      setSaving(false);
    }
  };

  if (fetchloading) {
    return <Loading />;
  }

  const inputClass = fieldControlClass;
  const labelClass = fieldLabelClass;

  return (
    <form
      dir={isRTL ? "rtl" : "ltr"}
      onSubmit={handleSubmit}
      className="space-y-5"
    >
      {(localError || error) && (
        <div
          className="p-3 rounded-lg text-sm"
          style={{ backgroundColor: "var(--danger)", color: "#fff" }}
        >
          {localError || error}
        </div>
      )}

      {/* Email — full width */}
      <div>
        <label className={labelClass} style={{ color: "var(--text)" }}>
          {t("EmployeeForm.email")}
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
        />
      </div>

      {/* First Name / Last Name */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className={labelClass} style={{ color: "var(--text)" }}>
            {t("EmployeeForm.firstName")}{" "}
            <span className="text-red-500">*</span>
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
            {t("EmployeeForm.lastName")} <span className="text-red-500">*</span>
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

      {/* Phone / Address */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className={labelClass} style={{ color: "var(--text)" }}>
            {t("EmployeeForm.phone")} <span className="text-red-500">*</span>
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
            {t("EmployeeForm.address")}
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

      {/* Department / Position / Employment Type */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <div>
          <label className={labelClass} style={{ color: "var(--text)" }}>
            {t("EmployeeForm.department")}
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
            <option value="management">
              {t("EmployeeForm.departments.management")}
            </option>
            <option value="engineering">
              {t("EmployeeForm.departments.engineering")}
            </option>
            <option value="construction">
              {t("EmployeeForm.departments.construction")}
            </option>
            <option value="administration">
              {t("EmployeeForm.departments.administration")}
            </option>
            <option value="finance">
              {t("EmployeeForm.departments.finance")}
            </option>
            <option value="hr">{t("EmployeeForm.departments.hr")}</option>
            <option value="procurement">
              {t("EmployeeForm.departments.procurement")}
            </option>
            <option value="safety">
              {t("EmployeeForm.departments.safety")}
            </option>
          </select>
        </div>
        <div>
          <label className={labelClass} style={{ color: "var(--text)" }}>
            {t("EmployeeForm.position")} <span className="text-red-500">*</span>
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
            {t("EmployeeForm.employmentType")}
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
            required
          >
            <option value="PROJECT">Project Employee</option>
            <option value="OFFICE">Office Employee</option>
          </select>
        </div>
        {formData.employment_type === "PROJECT" && (
          <div>
            <label className={labelClass} style={{ color: "var(--text)" }}>
              Project <span className="text-red-500">*</span>
            </label>
            <select
              name="project"
              value={formData.project || ""}
              onChange={handleChange}
              className={inputClass}
              style={{
                backgroundColor: "var(--bg)",
                color: "var(--text)",
                borderColor: "var(--border)",
              }}
              required
            >
              <option value="">Select Project</option>
              {projects.map((project) => (
                <option key={project.id} value={project.id}>
                  {project.name}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Hire Date / Salary / Hourly Rate */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <div>
          <label className={labelClass} style={{ color: "var(--text)" }}>
            {t("EmployeeForm.hireDate")} <span className="text-red-500">*</span>
          </label>
          <CalendarDatePicker
            name="hire_date"
            value={formData.hire_date}
            onChange={(value) => handleDateChange("hire_date", value)}
            module="employees"
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
            {t("EmployeeForm.salary")} <span className="text-red-500">*</span>
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
            {t("EmployeeForm.hourlyRate")}
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

      {/* Emergency Contact / Emergency Phone */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className={labelClass} style={{ color: "var(--text)" }}>
            {t("EmployeeForm.emergencyContact")}
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
            {t("EmployeeForm.emergencyPhone")}
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

      {/* Notes — full width */}
      <div>
        <label className={labelClass} style={{ color: "var(--text)" }}>
          {t("EmployeeForm.notes")}
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

      {/* Active checkbox */}
      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          name="is_active"
          checked={formData.is_active}
          onChange={handleChange}
          className="w-4 h-4 rounded border-[var(--border)] text-[var(--primary)] focus:ring-[var(--primary)]"
        />
        <label className="text-sm font-medium" style={{ color: "var(--text)" }}>
          {t("EmployeeForm.activeEmployee")}
        </label>
      </div>

      {/* Actions */}
      <div
        className="flex gap-3 justify-end pt-4 border-t"
        style={{ borderColor: "var(--border)" }}
      >
        <Button type="button" variant="secondary" onClick={onCancel}>
          {t("EmployeeForm.cancel")}
        </Button>
        <PermissionWrapper
          permissions={[effectiveEmployeeId ? "employees.update" : "employees.create"]}
          fallback={
            <Button
              type="submit"
              variant="primary"
              disabled
              title={t("EmployeeForm.noPermission")}
            >
              {employeeId
                ? t("EmployeeForm.updateEmployee")
                : t("EmployeeForm.createEmployee")}
            </Button>
          }
        >
          <Button type="submit" variant="primary" disabled={loading || saving}>
            {loading || saving
              ? t("EmployeeForm.saving")
              : currentEmployee
                ? t("EmployeeForm.updateEmployee")
                : t("EmployeeForm.addEmployee")}
          </Button>
        </PermissionWrapper>
      </div>
    </form>
  );
}

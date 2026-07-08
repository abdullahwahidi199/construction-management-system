import { useEffect, useState } from "react";
import useFetch from "../../hooks/useFetch";
import Loading from "../common/Loading";
import instance from "../../api/axiosInstance";
import { useLanguage } from "../../hooks/useLanguage";

const RTL_LANGS = ["dr", "ps", "fa", "dar", "prs"];

export default function EmployeeDetail({ employeeId, onClose }) {
  const { t, lang } = useLanguage();
  const isRTL = RTL_LANGS.includes(lang);

  const [activeTab, setActiveTab] = useState("info");
  const [employee, setEmployee] = useState("");
  const [loading, setLoading] = useState(false);

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
    fetchEmployeeDetails();
  }, []);

  if (loading) {
    <Loading />;
  }
  const { data: payrollHistory } = useFetch(
    `/employees/${employeeId}/payroll_history/`,
  );

  const tabs = [
    { key: "info", label: t("EmployeeDetail.tabs.info") },
    { key: "payroll", label: t("EmployeeDetail.tabs.payroll") },
    { key: "documents", label: t("EmployeeDetail.tabs.documents") },
  ];

  return (
    <div dir={isRTL ? "rtl" : "ltr"} className="space-y-6">
      {/* Employee Header */}
      <div
        className="flex items-center gap-6 pb-6 border-b"
        style={{ borderColor: "var(--border)" }}
      >
        <div
          className="w-20 h-20 rounded-full flex items-center justify-center text-3xl font-bold shrink-0"
          style={{ backgroundColor: "var(--primary)", color: "#fff" }}
        >
          {employee.first_name}
          {employee.last_name}
        </div>
        <div>
          <h2 className="text-2xl font-bold" style={{ color: "var(--text)" }}>
            {employee.full_name}
          </h2>
          <p className="text-sm mt-1" style={{ color: "var(--muted)" }}>
            {employee.position} • {employee.employee_id}
          </p>
          <span
            className="inline-block mt-2 px-3 py-1 rounded-full text-xs font-medium"
            style={{
              backgroundColor: employee.is_active
                ? 'var(--success) + "20"'
                : 'var(--danger) + "20"',
              color: employee.is_active ? "var(--success)" : "var(--danger)",
            }}
          >
            {employee.is_active
              ? t("EmployeeDetail.active")
              : t("EmployeeDetail.inactive")}
          </span>
        </div>
      </div>

      {/* Tabs */}
      <div
        className="flex gap-1 border-b"
        style={{ borderColor: "var(--border)" }}
      >
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className="px-4 py-2 text-sm font-medium border-b-2 transition-colors"
            style={{
              color: activeTab === tab.key ? "var(--primary)" : "var(--muted)",
              borderColor:
                activeTab === tab.key ? "var(--primary)" : "transparent",
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === "info" && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div>
            <h3
              className="text-sm font-semibold mb-4"
              style={{ color: "var(--text)" }}
            >
              {t("EmployeeDetail.personalInformation")}
            </h3>
            <div className="space-y-3">
              {[
                {
                  label: t("EmployeeDetail.email"),
                  value: employee.email,
                },
                {
                  label: t("EmployeeDetail.phone"),
                  value: employee.phone,
                },
                {
                  label: t("EmployeeDetail.address"),
                  value: employee.address,
                },
                {
                  label: t("EmployeeDetail.emergencyContact"),
                  value: employee.emergency_contact_name,
                },
                {
                  label: t("EmployeeDetail.emergencyPhone"),
                  value: employee.emergency_contact_phone,
                },
              ].map((item) => (
                <div key={item.label}>
                  <label className="text-xs" style={{ color: "var(--muted)" }}>
                    {item.label}
                  </label>
                  <p className="text-sm" style={{ color: "var(--text)" }}>
                    {item.value || t("EmployeeDetail.emptyValue")}
                  </p>
                </div>
              ))}
            </div>
          </div>
          <div>
            <h3
              className="text-sm font-semibold mb-4"
              style={{ color: "var(--text)" }}
            >
              {t("EmployeeDetail.employmentDetails")}
            </h3>
            <div className="space-y-3">
              {[
                {
                  label: t("EmployeeDetail.department"),
                  value: employee.department,
                },
                {
                  label: t("EmployeeDetail.employmentType"),
                  value: employee.employment_type,
                },
                {
                  label: t("EmployeeDetail.hireDate"),
                  value: new Date(employee.hire_date).toLocaleDateString(),
                },
                {
                  label: t("EmployeeDetail.salary"),
                  value: `${t("EmployeeDetail.currency")}${parseFloat(employee.salary).toLocaleString()}`,
                },
                {
                  label: t("EmployeeDetail.hourlyRate"),
                  value: employee.hourly_rate
                    ? `${t("EmployeeDetail.currency")}${employee.hourly_rate}`
                    : t("EmployeeDetail.notAvailable"),
                },
              ].map((item) => (
                <div key={item.label}>
                  <label className="text-xs" style={{ color: "var(--muted)" }}>
                    {item.label}
                  </label>
                  <p className="text-sm" style={{ color: "var(--text)" }}>
                    {item.value || t("EmployeeDetail.emptyValue")}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeTab === "payroll" && (
        <div>
          <h3
            className="text-sm font-semibold mb-4"
            style={{ color: "var(--text)" }}
          >
            {t("EmployeeDetail.payrollHistory")}
          </h3>
          {loading ? (
            <p style={{ color: "var(--muted)" }}>
              {t("EmployeeDetail.loadingPayrollHistory")}
            </p>
          ) : payrollHistory?.length === 0 ? (
            <p style={{ color: "var(--muted)" }}>
              {t("EmployeeDetail.noPayrollRecords")}
            </p>
          ) : (
            <div className="space-y-3">
              {Array.isArray(payrollHistory) &&
                payrollHistory.map((payroll) => (
                  <div
                    key={payroll.id}
                    className="flex justify-between items-center p-4 rounded-lg"
                    style={{ backgroundColor: "var(--hover)" }}
                  >
                    <div>
                      <p
                        className="font-medium"
                        style={{ color: "var(--text)" }}
                      >
                        {payroll.payroll_period_start} {t("EmployeeDetail.to")}{" "}
                        {payroll.payroll_period_end}
                      </p>
                      <p className="text-xs" style={{ color: "var(--muted)" }}>
                        {t("EmployeeDetail.status")}: {payroll.payment_status}
                      </p>
                    </div>
                    <div className={isRTL ? "text-left" : "text-right"}>
                      <p className="font-bold" style={{ color: "var(--text)" }}>
                        {t("EmployeeDetail.currency")}
                        {parseFloat(payroll.net_pay).toLocaleString()}
                      </p>
                      <p className="text-xs" style={{ color: "var(--muted)" }}>
                        {t("EmployeeDetail.netPay")}
                      </p>
                    </div>
                  </div>
                ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

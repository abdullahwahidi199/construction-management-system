import { useState } from "react";
import instance from "../../api/axiosInstance";
import Loading from "../common/Loading";
import { useLanguage } from "../../hooks/useLanguage";
import { useCalendar } from "../../hooks/useCalendar";

const RTL_LANGS = ["dr", "ps", "fa", "dar", "prs"];

export default function EmployeeCard({ employee, onEdit, onView, onDelete }) {
  const { t, lang } = useLanguage();
  const { formatDate } = useCalendar("employees");
  const isRTL = RTL_LANGS.includes(lang);

  const statusColor = employee.is_active ? "var(--success)" : "var(--danger)";

  return (
    <div
      dir={isRTL ? "rtl" : "ltr"}
      className="rounded-xl border p-6 transition-all hover:shadow-lg cursor-pointer"
      style={{
        backgroundColor: "var(--card)",
        borderColor: "var(--border)",
      }}
      onClick={() => onView(employee.id)}
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-4">
          <div
            className="w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold"
            style={{
              backgroundColor: "var(--primary)",
              color: "#fff",
            }}
          >
            {employee.first_name[0]}
            {employee.last_name[0]}
          </div>
          <div>
            <h3
              className="font-semibold text-lg"
              style={{ color: "var(--text)" }}
            >
              {employee.full_name}
            </h3>
            <p className="text-sm" style={{ color: "var(--muted)" }}>
              {employee.employee_id}
            </p>
          </div>
        </div>
        <span
          className="px-3 py-1 rounded-full text-xs font-medium"
          style={{
            backgroundColor: statusColor + "20",
            color: statusColor,
          }}
        >
          {employee.is_active
            ? t("EmployeeCard.active")
            : t("EmployeeCard.inactive")}
        </span>
      </div>

      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span style={{ color: "var(--muted)" }}>
            {t("EmployeeCard.department")}
          </span>
          <span style={{ color: "var(--text)" }}>
            {employee.get_department_display || employee.department}
          </span>
        </div>
        <div className="flex justify-between text-sm">
          <span style={{ color: "var(--muted)" }}>
            {t("EmployeeCard.position")}
          </span>
          <span style={{ color: "var(--text)" }}>{employee.position}</span>
        </div>
        <div className="flex justify-between gap-3 text-sm">
          <span style={{ color: "var(--muted)" }}>Type</span>
          <span className="text-right" style={{ color: "var(--text)" }}>
            {employee.employment_type_display ||
              (employee.employment_type === "PROJECT"
                ? "Project Employee"
                : "Office Employee")}
          </span>
        </div>
        {employee.employment_type === "PROJECT" && (
          <div className="flex justify-between gap-3 text-sm">
            <span style={{ color: "var(--muted)" }}>Project</span>
            <span className="text-right" style={{ color: "var(--text)" }}>
              {employee.project_name || "-"}
            </span>
          </div>
        )}
        <div className="flex justify-between text-sm">
          <span style={{ color: "var(--muted)" }}>
            {t("EmployeeCard.salary")}
          </span>
          <span className="font-medium" style={{ color: "var(--text)" }}>
            {t("EmployeeCard.currency")}
            {parseFloat(employee.salary).toLocaleString()}
          </span>
        </div>
        <div className="flex justify-between text-sm">
          <span style={{ color: "var(--muted)" }}>
            {t("EmployeeCard.hired")}
          </span>
          <span style={{ color: "var(--text)" }}>
            {formatDate(employee.hire_date) ||
              employee.formatted_hire_date ||
              "-"}
          </span>
        </div>
      </div>

      <div
        className="flex gap-2 mt-4 pt-4 border-t"
        style={{ borderColor: "var(--border)" }}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={() => onEdit(employee)}
          className="flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors"
          style={{
            backgroundColor: "var(--primary)",
            color: "#fff",
          }}
        >
          {t("EmployeeCard.edit")}
        </button>
      </div>
    </div>
  );
}

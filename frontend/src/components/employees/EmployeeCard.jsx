import { useState } from "react";
import instance from "../../api/axiosInstance";
import Loading from "../common/Loading";

export default function EmployeeCard({ employee, onEdit, onView, onDelete }) {
  const statusColor = employee.is_active ? "var(--success)" : "var(--danger)";

  return (
    <div
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
          {employee.is_active ? "Active" : "Inactive"}
        </span>
      </div>

      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span style={{ color: "var(--muted)" }}>Department</span>
          <span style={{ color: "var(--text)" }}>
            {employee.get_department_display || employee.department}
          </span>
        </div>
        <div className="flex justify-between text-sm">
          <span style={{ color: "var(--muted)" }}>Position</span>
          <span style={{ color: "var(--text)" }}>{employee.position}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span style={{ color: "var(--muted)" }}>Salary</span>
          <span className="font-medium" style={{ color: "var(--text)" }}>
            AFN{parseFloat(employee.salary).toLocaleString()}
          </span>
        </div>
        <div className="flex justify-between text-sm">
          <span style={{ color: "var(--muted)" }}>Hired</span>
          <span style={{ color: "var(--text)" }}>
            {new Date(employee.hire_date).toLocaleDateString()}
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
          Edit
        </button>
      </div>
    </div>
  );
}

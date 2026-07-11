import React from "react";
import { Link } from "react-router-dom";
import {
  CalendarCheck,
  Receipt,
  FolderKanban,
  FileText,
  Users,
  Wallet,
  ClipboardList,
  BarChart3,
  HardHat,
} from "lucide-react";

import { useLanguage } from "../hooks/useLanguage";
import { useAuth } from "../auth/AuthContext";
import { hasAnyPermission } from "../../utils/permissions";

export default function DataEntryDashboard() {
  const { t } = useLanguage();
  const { permissions } = useAuth();

  const actions = [
    {
      title: t("dataEntry.cards.expenses"),
      body: t("dataEntry.cards.expensesText"),
      to: "/data-entry/expenses",
      icon: Receipt,
      visible: hasAnyPermission(permissions, [
        "expenses.view",
        "expenses.create",
        "expenses.update",
        "expenses.delete",
      ]),
    },

    {
      title: t("dataEntry.cards.attendance"),
      body: t("dataEntry.cards.attendanceText"),
      to: "/data-entry/attendance",
      icon: CalendarCheck,
      visible: hasAnyPermission(permissions, [
        "attendance.view",
        "attendance.create",
        "attendance.update",
        "attendance.delete",
      ]),
    },

    {
      title: "Projects",
      body: "View and manage projects",
      to: "/data-entry/projects",
      icon: FolderKanban,
      visible: hasAnyPermission(permissions, [
        "projects.view",
        "projects.create",
        "projects.update",
        "projects.delete",
      ]),
    },

    {
      title: "Contracts",
      body: "View and manage contracts",
      to: "/data-entry/contracts",
      icon: FileText,
      visible: hasAnyPermission(permissions, [
        "contracts.view",
        "contracts.create",
        "contracts.update",
        "contracts.delete",
      ]),
    },

    {
      title: "Employees",
      body: "Manage employees",
      to: "/data-entry/employees",
      icon: Users,
      visible: hasAnyPermission(permissions, [
        "employees.view",
        "employees.create",
        "employees.update",
        "employees.delete",
      ]),
    },

    {
      title: "Payrolls",
      body: "Manage payrolls",
      to: "/data-entry/payrolls",
      icon: Wallet,
      visible: hasAnyPermission(permissions, [
        "payrolls.view",
        "payrolls.create",
        "payrolls.update",
        "payrolls.delete",
      ]),
    },

    {
      title: "Daily Workers",
      body: "Manage daily workers, attendance, and worker payrolls",
      to: "/data-entry/daily-workers",
      icon: HardHat,
      visible: hasAnyPermission(permissions, [
        "daily_workers.view",
        "daily_workers.create",
        "daily_workers.update",
        "daily_workers.delete",
        "daily_worker_attendance.view",
        "daily_worker_attendance.create",
        "daily_worker_attendance.update",
        "daily_worker_payroll.view",
        "daily_worker_payroll.create",
        "daily_worker_payroll.update",
        "worker_advances.view",
      ]),
    },

    {
      title: "Reports",
      body: "View reports",
      to: "/data-entry/reports",
      icon: BarChart3,
      visible: hasAnyPermission(permissions, [
        "reports.view",
        "reports.create",
      ]),
    },

    {
      title: "Subcontractors",
      body: "Manage subcontractors",
      to: "/data-entry/subcontractors",
      icon: ClipboardList,
      visible: hasAnyPermission(permissions, [
        "subcontractors.view",
        "subcontractors.create",
        "subcontractors.update",
        "subcontractors.delete",
      ]),
    },
  ].filter((item) => item.visible);

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold">{t("dataEntry.dashboard.title")}</h1>
        <p className="text-sm text-(--muted)">
          {t("dataEntry.dashboard.subtitle")}
        </p>
      </header>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {actions.map(({ title, body, to, icon: Icon }) => (
          <Link
            key={to}
            to={to}
            className="rounded-lg border border-(--border) bg-(--card) p-4 transition hover:border-(--primary)"
          >
            <Icon className="mb-3 h-5 w-5 text-(--primary)" />
            <h2 className="font-semibold">{title}</h2>
            <p className="mt-1 text-sm text-(--muted)">{body}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}

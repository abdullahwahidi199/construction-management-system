import React from "react";
import { Link } from "react-router-dom";
import { CalendarCheck, Receipt } from "lucide-react";
import { useLanguage } from "../hooks/useLanguage";

export default function DataEntryDashboard() {
  const { t } = useLanguage();
  const actions = [
    { title: t("dataEntry.cards.expenses"), body: t("dataEntry.cards.expensesText"), to: "/data-entry/expenses", icon: Receipt },
    { title: t("dataEntry.cards.attendance"), body: t("dataEntry.cards.attendanceText"), to: "/data-entry/attendance", icon: CalendarCheck },
  ];

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold">{t("dataEntry.dashboard.title")}</h1>
        <p className="text-sm text-(--muted)">{t("dataEntry.dashboard.subtitle")}</p>
      </header>
      <div className="grid gap-4 md:grid-cols-2">
        {actions.map(({ title, body, to, icon: Icon }) => (
          <Link key={to} to={to} className="rounded-lg border border-(--border) bg-(--card) p-4 transition hover:border-(--primary)">
            <Icon className="mb-3 h-5 w-5 text-(--primary)" />
            <h2 className="font-semibold">{title}</h2>
            <p className="mt-1 text-sm text-(--muted)">{body}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}

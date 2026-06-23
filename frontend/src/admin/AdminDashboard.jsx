import React from "react";
import { Link } from "react-router-dom";
import { ShieldCheck, Users, Settings } from "lucide-react";
import { useLanguage } from "../hooks/useLanguage";

export default function AdminDashboard() {
  const { t } = useLanguage();
  const cards = [
    { title: t("admin.cards.users"), body: t("admin.cards.usersText"), to: "/admin/users", icon: Users },
    { title: t("admin.cards.roles"), body: t("admin.cards.rolesText"), to: "/admin/permissions", icon: ShieldCheck },
    { title: t("admin.cards.system"), body: t("admin.cards.systemText"), to: "/manager/dashboard", icon: Settings },
  ];

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold">{t("admin.dashboard.title")}</h1>
        <p className="text-sm text-(--muted)">{t("admin.dashboard.subtitle")}</p>
      </header>
      <div className="grid gap-4 md:grid-cols-3">
        {cards.map(({ title, body, to, icon: Icon }) => (
          <Link
            key={title}
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

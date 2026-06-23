import React, { useEffect, useState } from "react";
import instance from "../api/axiosInstance";
import { useLanguage } from "../hooks/useLanguage";

export default function PermissionManagement() {
  const { t } = useLanguage();
  const [meta, setMeta] = useState({ roles: [], permissions: [] });
  const [overrides, setOverrides] = useState([]);
  const [form, setForm] = useState({ role: "manager", permission: "", effect: "allow" });

  const load = async () => {
    const [metaRes, overridesRes] = await Promise.all([
      instance.get("auth/meta/"),
      instance.get("auth/role-permissions/"),
    ]);
    setMeta(metaRes.data);
    setOverrides(overridesRes.data.results || overridesRes.data);
    setForm((prev) => ({
      ...prev,
      permission: prev.permission || metaRes.data.permissions?.[0] || "",
    }));
  };

  useEffect(() => {
    load();
  }, []);

  const save = async (event) => {
    event.preventDefault();
    await instance.post("auth/role-permissions/", form);
    load();
  };

  const remove = async (id) => {
    await instance.delete(`auth/role-permissions/${id}/`);
    load();
  };

  return (
    <div className="space-y-4">
      <header>
        <h1 className="text-2xl font-bold">{t("admin.permissions.title")}</h1>
        <p className="text-sm text-(--muted)">{t("admin.permissions.subtitle")}</p>
      </header>
      <form className="grid gap-3 rounded-lg border border-(--border) bg-(--card) p-4 md:grid-cols-4" onSubmit={save}>
        <select className="rounded-md border border-(--border) bg-(--bg) px-3 py-2" value={form.role} onChange={(event) => setForm((prev) => ({ ...prev, role: event.target.value }))}>
          {meta.roles.map((role) => (
            <option key={role.value} value={role.value}>{role.label}</option>
          ))}
        </select>
        <select className="rounded-md border border-(--border) bg-(--bg) px-3 py-2" value={form.permission} onChange={(event) => setForm((prev) => ({ ...prev, permission: event.target.value }))}>
          {meta.permissions.map((permission) => (
            <option key={permission} value={permission}>{permission}</option>
          ))}
        </select>
        <select className="rounded-md border border-(--border) bg-(--bg) px-3 py-2" value={form.effect} onChange={(event) => setForm((prev) => ({ ...prev, effect: event.target.value }))}>
          <option value="allow">{t("admin.permissions.allow")}</option>
          <option value="deny">{t("admin.permissions.deny")}</option>
        </select>
        <button className="rounded-md bg-(--primary) px-4 py-2 font-semibold text-white">{t("common.save")}</button>
      </form>
      <div className="rounded-lg border border-(--border) bg-(--card)">
        {overrides.map((override) => (
          <div key={override.id} className="flex items-center justify-between border-b border-(--border) px-4 py-3 text-sm">
            <span>{override.role} / {override.permission} / {override.effect}</span>
            <button className="rounded-md border border-(--border) px-3 py-1 hover:bg-(--hover)" onClick={() => remove(override.id)}>
              {t("common.remove")}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

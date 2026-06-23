import React, { useEffect, useMemo, useState } from "react";
import instance from "../api/axiosInstance";
import { useLanguage } from "../hooks/useLanguage";

export default function UserManagement() {
  const { t } = useLanguage();
  const [users, setUsers] = useState([]);
  const [meta, setMeta] = useState({ roles: [] });
  const [loading, setLoading] = useState(true);

  const roles = useMemo(() => meta.roles || [], [meta]);

  const load = async () => {
    setLoading(true);
    const [usersRes, metaRes] = await Promise.all([
      instance.get("auth/users/"),
      instance.get("auth/meta/"),
    ]);
    setUsers(usersRes.data.results || usersRes.data);
    setMeta(metaRes.data);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const updateRole = async (id, role) => {
    await instance.post(`auth/users/${id}/set_role/`, { role });
    load();
  };

  const toggleActive = async (user) => {
    await instance.patch(`auth/users/${user.id}/`, { is_active: !user.is_active });
    load();
  };

  if (loading) return <p>{t("common.loading")}</p>;

  return (
    <div className="space-y-4">
      <header>
        <h1 className="text-2xl font-bold">{t("admin.users.title")}</h1>
        <p className="text-sm text-(--muted)">{t("admin.users.subtitle")}</p>
      </header>
      <div className="overflow-hidden rounded-lg border border-(--border) bg-(--card)">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-(--border) bg-(--hover)">
            <tr>
              <th className="px-4 py-3">{t("admin.users.username")}</th>
              <th className="px-4 py-3">{t("admin.users.email")}</th>
              <th className="px-4 py-3">{t("admin.users.role")}</th>
              <th className="px-4 py-3">{t("admin.users.status")}</th>
              <th className="px-4 py-3">{t("admin.users.actions")}</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.id} className="border-b border-(--border)">
                <td className="px-4 py-3 font-medium">{user.username}</td>
                <td className="px-4 py-3">{user.email || "-"}</td>
                <td className="px-4 py-3">
                  <select
                    className="rounded-md border border-(--border) bg-(--bg) px-2 py-1"
                    value={user.role}
                    onChange={(event) => updateRole(user.id, event.target.value)}
                  >
                    {roles.map((role) => (
                      <option key={role.value} value={role.value}>
                        {role.label}
                      </option>
                    ))}
                  </select>
                </td>
                <td className="px-4 py-3">{user.is_active ? t("common.active") : t("common.inactive")}</td>
                <td className="px-4 py-3">
                  <button
                    className="rounded-md border border-(--border) px-3 py-1 text-sm hover:bg-(--hover)"
                    onClick={() => toggleActive(user)}
                  >
                    {user.is_active ? t("admin.users.disable") : t("admin.users.enable")}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

import React, { useCallback, useEffect, useMemo, useState } from "react";
import instance from "../api/axiosInstance";
import { useLanguage } from "../hooks/useLanguage";

function cn(...classes) {
  return classes.filter(Boolean).join(" ");
}

function Badge({ children, tone = "neutral" }) {
  const tones = {
    neutral: "bg-black/5 text-(--text) border-(--border)",
    danger: "bg-red-50 text-red-700 border-red-200",
    info: "bg-blue-50 text-blue-700 border-blue-200",
    success: "bg-green-50 text-green-700 border-green-200",
  };
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium",
        tones[tone] || tones.neutral,
      )}
    >
      {children}
    </span>
  );
}

function SkeletonLine({ className }) {
  return (
    <div
      className={cn("h-4 animate-pulse rounded bg-(--border)/70", className)}
    />
  );
}

export default function PermissionManagement() {
  const { t } = useLanguage();

  const [roles, setRoles] = useState([]);
  const [permissions, setPermissions] = useState([]);
  const [rolePermissions, setRolePermissions] = useState([]);

  const [loading, setLoading] = useState(true);
  const [savingKey, setSavingKey] = useState(null); // `${role}-${permissionId}`
  const [error, setError] = useState("");

  // UI state
  const [query, setQuery] = useState("");
  const [moduleFilter, setModuleFilter] = useState("all");

  const load = useCallback(async () => {
    setError("");
    setLoading(true);
    try {
      const [metaRes, rolePermissionRes] = await Promise.all([
        instance.get("auth/meta/"),
        instance.get("auth/role-permissions/"),
      ]);

      setRoles(metaRes.data.roles || []);
      setPermissions(metaRes.data.permissions || []);
      setRolePermissions(
        rolePermissionRes.data.results || rolePermissionRes.data || [],
      );
    } catch (e) {
      console.error(e);
      setError(
        t?.("common.errorLoading") ||
          "Unable to load permissions. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    load();
  }, [load]);

  // Map: role-permission => record
  const permissionMap = useMemo(() => {
    const map = new Map();
    for (const item of rolePermissions) {
      map.set(`${item.role}-${item.permission}`, item);
    }
    return map;
  }, [rolePermissions]);

  // Modules for filter dropdown
  const modules = useMemo(() => {
    const set = new Set();
    for (const p of permissions) set.add(p.module || "General");
    return ["all", ...Array.from(set).sort((a, b) => a.localeCompare(b))];
  }, [permissions]);

  // Filter
  const filteredPermissions = useMemo(() => {
    const q = query.trim().toLowerCase();

    return permissions.filter((p) => {
      const mod = p.module || "General";
      if (moduleFilter !== "all" && mod !== moduleFilter) return false;

      if (!q) return true;
      const haystack = `${p.name || ""} ${p.code || ""} ${mod}`.toLowerCase();
      return haystack.includes(q);
    });
  }, [permissions, query, moduleFilter]);

  // Group
  const groupedPermissions = useMemo(() => {
    const groups = {};
    for (const p of filteredPermissions) {
      const mod = p.module || "General";
      if (!groups[mod]) groups[mod] = [];
      groups[mod].push(p);
    }

    Object.keys(groups).forEach((mod) => {
      groups[mod].sort((a, b) => (a.name || "").localeCompare(b.name || ""));
    });

    return Object.entries(groups).sort(([a], [b]) => a.localeCompare(b));
  }, [filteredPermissions]);

  const togglePermission = useCallback(
    async (role, permissionId) => {
      const key = `${role}-${permissionId}`;
      const existing = permissionMap.get(key);

      setError("");
      setSavingKey(key);

      try {
        if (existing) {
          await instance.delete(`auth/role-permissions/${existing.id}/`);
        } else {
          await instance.post("auth/role-permissions/", {
            role,
            permission: permissionId,
          });
        }
        await load();
      } catch (e) {
        console.error(e);
        setError(
          t?.("common.errorSaving") ||
            "Unable to save changes. Please try again.",
        );
      } finally {
        setSavingKey(null);
      }
    },
    [permissionMap, load, t],
  );

  const clearFilters = () => {
    setQuery("");
    setModuleFilter("all");
  };

  const totalShown = filteredPermissions.length;

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="rounded-xl border border-(--border) bg-(--card) p-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="space-y-2">
              <SkeletonLine className="w-56" />
              <SkeletonLine className="w-80 h-3" />
            </div>
            <SkeletonLine className="h-9 w-28" />
          </div>
        </div>

        <div className="rounded-xl border border-(--border) bg-(--card) p-5">
          <div className="grid gap-3 sm:grid-cols-12">
            <SkeletonLine className="sm:col-span-7 h-10" />
            <SkeletonLine className="sm:col-span-3 h-10" />
            <SkeletonLine className="sm:col-span-2 h-10" />
          </div>
          <div className="mt-4 space-y-2">
            <SkeletonLine className="h-10" />
            <SkeletonLine className="h-10" />
            <SkeletonLine className="h-10" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold tracking-tight">
            {t("admin.permissions.title")}
          </h1>
          <p className="text-sm text-(--muted)">
            {t("admin.permissions.subtitle")}
          </p>
          <div className="flex flex-wrap items-center gap-2 pt-1">
            <Badge>
              {t("admin.permissions.rolesShown")} {roles.length}
            </Badge>
            <Badge>
              {t("admin.permissions.count")} {totalShown}{" "}
              {t("admin.permissions.permissions")}
            </Badge>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={load}
            className={cn(
              "inline-flex items-center justify-center rounded-lg border border-(--border) bg-(--card) px-3 py-2 text-sm",
              "hover:bg-black/5 active:bg-black/10",
              "focus:outline-none focus:ring-2 focus:ring-black/15",
            )}
          >
            {t("common.refresh")}
          </button>
        </div>
      </header>

      {/* Toolbar */}
      <section className="rounded-xl border border-(--border) bg-(--card) p-4 sm:p-5">
        <div className="grid gap-3 sm:grid-cols-12 sm:items-end">
          <div className="sm:col-span-7">
            <label className="mb-1 block text-xs font-medium text-(--muted)">
              {t("common.search")}
            </label>
            <div className="relative">
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={t("admin.permissions.searchPlaceholder")}
                className={cn(
                  "w-full rounded-lg border border-(--border) bg-transparent px-3 py-2 text-sm",
                  "outline-none focus:ring-2 focus:ring-black/15",
                )}
                aria-label={t("common.search")}
              />
              {query ? (
                <button
                  type="button"
                  onClick={() => setQuery("")}
                  className={cn(
                    "absolute right-2 top-1/2 -translate-y-1/2 rounded-md px-2 py-1 text-xs",
                    "text-(--muted) hover:bg-black/5",
                    "focus:outline-none focus:ring-2 focus:ring-black/15",
                  )}
                >
                  {t("common.clear")}
                </button>
              ) : null}
            </div>
          </div>

          <div className="sm:col-span-3">
            <label className="mb-1 block text-xs font-medium text-(--muted)">
              {t("common.module")}
            </label>
            <select
              value={moduleFilter}
              onChange={(e) => setModuleFilter(e.target.value)}
              className={cn(
                "w-full rounded-lg border border-(--border) bg-(--card) px-3 py-2 text-sm",
                "outline-none focus:ring-2 focus:ring-black/15",
              )}
              aria-label={t("common.module")}
            >
              {modules.map((m) => (
                <option key={m} value={m}>
                  {m === "all" ? t("common.all") : m}
                </option>
              ))}
            </select>
          </div>

          <div className="sm:col-span-2">
            <button
              type="button"
              onClick={clearFilters}
              className={cn(
                "w-full rounded-lg border border-(--border) px-3 py-2 text-sm",
                "hover:bg-black/5 active:bg-black/10",
                "focus:outline-none focus:ring-2 focus:ring-black/15",
              )}
            >
              {t("common.clearFilters")}
            </button>
          </div>
        </div>

        {error ? (
          <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="font-medium">{t("common.error")}</div>
                <div className="text-sm">{error}</div>
              </div>
              <button
                type="button"
                onClick={load}
                className="rounded-md border border-red-200 bg-white px-2 py-1 text-xs hover:bg-red-50"
              >
                {t("common.retry")}
              </button>
            </div>
          </div>
        ) : null}
      </section>

      {/* Empty */}
      {totalShown === 0 ? (
        <div className="rounded-xl border border-(--border) bg-(--card) p-8 text-center">
          <div className="text-sm font-semibold">{t("common.noResults")}</div>
          <div className="mt-1 text-sm text-(--muted)">
            {t("common.tryDifferentSearch")}
          </div>
          <div className="mt-4">
            <button
              type="button"
              onClick={clearFilters}
              className="rounded-lg border border-(--border) px-3 py-2 text-sm hover:bg-black/5"
            >
              {t("common.clearFilters")}
            </button>
          </div>
        </div>
      ) : null}

      {/* Tables by module */}
      {groupedPermissions.map(([module, modulePermissions]) => (
        <section
          key={module}
          className="overflow-hidden rounded-xl border border-(--border) bg-(--card)"
        >
          {/* Sticky module header */}
          <div className="sticky top-0 z-10 border-b border-(--border) bg-(--card)/95 px-4 py-3 backdrop-blur">
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <h2 className="truncate text-sm font-semibold">{module}</h2>
                <p className="text-xs text-(--muted)">
                  {modulePermissions.length}{" "}
                  {t("admin.permissions.permissions")}
                </p>
              </div>
              <Badge tone="info">{t("admin.permissions.tipClickBoxes")}</Badge>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-black/2">
                <tr className="border-b border-(--border)">
                  {/* Sticky first column header */}
                  <th
                    className={cn(
                      "sticky left-0 z-10 min-w-[280px] bg-black/2 px-4 py-3 text-left",
                      "shadow-[1px_0_0_0_var(--border)]",
                    )}
                  >
                    {t("admin.permissions.permission")}
                  </th>

                  {roles.map((role) => (
                    <th
                      key={role.value}
                      className="whitespace-nowrap px-4 py-3 text-center text-xs font-semibold text-(--muted)"
                      title={role.label}
                    >
                      {role.label}
                    </th>
                  ))}
                </tr>
              </thead>

              <tbody>
                {modulePermissions.map((permission, idx) => (
                  <tr
                    key={permission.id}
                    className={cn(
                      "border-b border-(--border) last:border-b-0",
                      idx % 2 === 0 ? "bg-transparent" : "bg-black/[0.015]",
                      "hover:bg-black/[0.03]",
                    )}
                  >
                    {/* Sticky first column */}
                    <td
                      className={cn(
                        "sticky left-0 z-0 bg-inherit px-4 py-3",
                        "shadow-[1px_0_0_0_var(--border)]",
                      )}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="truncate font-medium">
                            {permission.name}
                          </div>
                          <div className="truncate text-xs text-(--muted)">
                            {permission.code}
                          </div>
                        </div>
                        {permission.module ? (
                          <span className="hidden sm:inline">
                            <Badge>{permission.module}</Badge>
                          </span>
                        ) : null}
                      </div>
                    </td>

                    {roles.map((role) => {
                      const key = `${role.value}-${permission.id}`;
                      const assigned = permissionMap.get(key);
                      const isSaving = savingKey === key;

                      return (
                        <td key={role.value} className="px-4 py-3 text-center">
                          <button
                            type="button"
                            onClick={() =>
                              !isSaving &&
                              togglePermission(role.value, permission.id)
                            }
                            className={cn(
                              "inline-flex items-center justify-center rounded-lg border px-3 py-2",
                              "transition-colors",
                              assigned
                                ? "border-black/15 bg-black/5"
                                : "border-(--border) bg-transparent",
                              isSaving && "opacity-60",
                              "hover:bg-black/10",
                              "focus:outline-none focus:ring-2 focus:ring-black/15",
                            )}
                            aria-pressed={!!assigned}
                            aria-label={`${role.label} - ${permission.name}`}
                            disabled={isSaving}
                            title={
                              isSaving
                                ? t("common.saving")
                                : assigned
                                  ? t("admin.permissions.revoke")
                                  : t("admin.permissions.grant")
                            }
                          >
                            <input
                              type="checkbox"
                              checked={!!assigned}
                              readOnly
                              className={cn(
                                "h-4 w-4 accent-black",
                                isSaving && "cursor-not-allowed",
                              )}
                              tabIndex={-1}
                              aria-hidden="true"
                            />
                          </button>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      ))}
    </div>
  );
}

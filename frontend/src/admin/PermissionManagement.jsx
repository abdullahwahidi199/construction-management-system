import React, { useCallback, useEffect, useMemo, useState } from "react";
import { ChevronDown } from "lucide-react";
import toast from "react-hot-toast";
import instance from "../api/axiosInstance";
import { useAuth } from "../auth/AuthContext";
import { hasAnyPermission } from "../auth/roles";
import { useLanguage } from "../hooks/useLanguage";
import ConfirmDialog from "../components/common/ConfirmDialog";
import { getFriendlyErrorMessage } from "../utils/apiErrors";

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
  const { permissions: authPermissions = [] } = useAuth();

  const [roles, setRoles] = useState([]);
  const [permissions, setPermissions] = useState([]);
  const [rolePermissions, setRolePermissions] = useState([]);
  const [roleForm, setRoleForm] = useState({ label: "", value: "" });

  const [loading, setLoading] = useState(true);
  const [savingKey, setSavingKey] = useState(null); // `${role}-${permissionId}`
  const [savingRole, setSavingRole] = useState(false);
  const [deletingRoleId, setDeletingRoleId] = useState(null);
  const [roleDeleteTarget, setRoleDeleteTarget] = useState(null);
  const [error, setError] = useState("");

  // UI state
  const [query, setQuery] = useState("");
  const [moduleFilter, setModuleFilter] = useState("all");
  const [collapsedModules, setCollapsedModules] = useState({});

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
      setError(getFriendlyErrorMessage(e, "Unable to load permissions. Please try again."));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    load();
  }, [load]);

  const canManageRoles = hasAnyPermission(authPermissions, [
    "roles.create",
    "roles.update",
    "roles.delete",
  ]);
  const canDeleteRoles = hasAnyPermission(authPermissions, ["roles.delete"]);
  const canManagePermissions = hasAnyPermission(authPermissions, [
    "permissions.manage",
  ]);

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
      if (!canManagePermissions) return;
      const key = `${role}-${permissionId}`;
      const existing = permissionMap.get(key);

      setError("");
      setSavingKey(key);

      try {
        if (existing) {
          await instance.delete(`auth/role-permissions/${existing.id}/`);
          setRolePermissions((current) =>
            current.filter((item) => item.id !== existing.id),
          );
        } else {
          const res = await instance.post("auth/role-permissions/", {
            role,
            permission: permissionId,
          });
          setRolePermissions((current) => [
            ...current.filter(
              (item) => !(item.role === role && item.permission === permissionId),
            ),
            res.data,
          ]);
        }
      } catch (e) {
        setError(getFriendlyErrorMessage(e, "Unable to save changes. Please try again."));
      } finally {
        setSavingKey(null);
      }
    },
    [canManagePermissions, permissionMap, t],
  );

  const toggleModulePermissions = useCallback(
    async (role, module, modulePermissions) => {
      if (!canManagePermissions) return;

      const key = `module-${role}-${module}`;
      const assignedItems = modulePermissions
        .map((permission) => permissionMap.get(`${role}-${permission.id}`))
        .filter(Boolean);
      const allAssigned = assignedItems.length === modulePermissions.length;

      setError("");
      setSavingKey(key);

      try {
        if (allAssigned) {
          await Promise.all(
            assignedItems.map((item) =>
              instance.delete(`auth/role-permissions/${item.id}/`),
            ),
          );
          const deletedIds = new Set(assignedItems.map((item) => item.id));
          setRolePermissions((current) =>
            current.filter((item) => !deletedIds.has(item.id)),
          );
        } else {
          const missingPermissions = modulePermissions.filter(
            (permission) => !permissionMap.get(`${role}-${permission.id}`),
          );
          const responses = await Promise.all(
            missingPermissions.map((permission) =>
              instance.post("auth/role-permissions/", {
                role,
                permission: permission.id,
              }),
            ),
          );
          setRolePermissions((current) => [
            ...current,
            ...responses.map((res) => res.data),
          ]);
        }
      } catch (e) {
        const message = getFriendlyErrorMessage(
          e,
          "Unable to save changes. Please try again.",
        );
        await load();
        setError(message);
      } finally {
        setSavingKey(null);
      }
    },
    [canManagePermissions, load, permissionMap, t],
  );

  const toggleModule = (module) => {
    setCollapsedModules((current) => ({
      ...current,
      [module]: !current[module],
    }));
  };

  const setAllModulesCollapsed = (collapsed) => {
    setCollapsedModules(
      Object.fromEntries(groupedPermissions.map(([module]) => [module, collapsed])),
    );
  };

  const createRole = async (event) => {
    event.preventDefault();
    if (!canManageRoles || savingRole) return;

    setError("");
    setSavingRole(true);

    try {
      const payload = {
        label: roleForm.label.trim(),
      };
      if (roleForm.value.trim()) {
        payload.value = roleForm.value.trim();
      }
      await instance.post("auth/roles/", payload);
      setRoleForm({ label: "", value: "" });
      await load();
      toast.success("Role created.");
    } catch (e) {
      setError(getFriendlyErrorMessage(e, "Unable to create role. Please try again."));
    } finally {
      setSavingRole(false);
    }
  };

  const deleteRole = async (role) => {
    if (!canDeleteRoles || role.is_system || deletingRoleId) return;
    setRoleDeleteTarget(role);
  };

  const confirmDeleteRole = async () => {
    const role = roleDeleteTarget;
    if (!role) return;
    setError("");
    setDeletingRoleId(role.id);

    try {
      await instance.delete(`auth/roles/${role.id}/`);
      setRoleDeleteTarget(null);
      await load();
      toast.success("Role deleted.");
    } catch (e) {
      setError(
        getFriendlyErrorMessage(
          e,
          "Unable to delete this role. Make sure no users are assigned to it.",
        ),
      );
    } finally {
      setDeletingRoleId(null);
    }
  };

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
            onClick={() => setAllModulesCollapsed(true)}
            className={cn(
              "inline-flex items-center justify-center rounded-lg border border-(--border) bg-(--card) px-3 py-2 text-sm",
              "hover:bg-black/5 active:bg-black/10",
              "focus:outline-none focus:ring-2 focus:ring-black/15",
            )}
          >
            Collapse all
          </button>
          <button
            type="button"
            onClick={() => setAllModulesCollapsed(false)}
            className={cn(
              "inline-flex items-center justify-center rounded-lg border border-(--border) bg-(--card) px-3 py-2 text-sm",
              "hover:bg-black/5 active:bg-black/10",
              "focus:outline-none focus:ring-2 focus:ring-black/15",
            )}
          >
            Expand all
          </button>
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

      <section className="rounded-xl border border-(--border) bg-(--card) p-4 sm:p-5">
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(260px,420px)] lg:items-start">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              {roles.map((role) => (
                <span
                  key={role.value}
                  className="inline-flex items-center gap-2 rounded-lg border border-(--border) px-3 py-2 text-sm"
                >
                  <span className="min-w-0">
                    <span className="block max-w-48 truncate font-medium">
                      {role.label}
                    </span>
                    <span className="block max-w-48 truncate text-xs text-(--muted)">
                      {role.value}
                    </span>
                  </span>
                  {role.is_system ? <Badge>System</Badge> : <Badge tone="info">Custom</Badge>}
                  {!role.is_system && canDeleteRoles ? (
                    <button
                      type="button"
                      onClick={() => deleteRole(role)}
                      disabled={deletingRoleId === role.id}
                      className="rounded-md px-2 py-1 text-xs text-red-600 hover:bg-red-50 disabled:opacity-60"
                    >
                      {deletingRoleId === role.id ? t("common.saving") : t("common.remove")}
                    </button>
                  ) : null}
                </span>
              ))}
            </div>
          </div>

          {canManageRoles ? (
            <form className="grid gap-3 sm:grid-cols-2" onSubmit={createRole}>
              <label className="block">
                <span className="mb-1 block text-xs font-medium text-(--muted)">
                  Role name
                </span>
                <input
                  value={roleForm.label}
                  onChange={(e) =>
                    setRoleForm((prev) => ({ ...prev, label: e.target.value }))
                  }
                  className={cn(
                    "w-full rounded-lg border border-(--border) bg-transparent px-3 py-2 text-sm",
                    "outline-none focus:ring-2 focus:ring-black/15",
                  )}
                  placeholder="Site Supervisor"
                  required
                />
              </label>
              <label className="block">
                <span className="mb-1 block text-xs font-medium text-(--muted)">
                  Role key
                </span>
                <input
                  value={roleForm.value}
                  onChange={(e) =>
                    setRoleForm((prev) => ({ ...prev, value: e.target.value }))
                  }
                  className={cn(
                    "w-full rounded-lg border border-(--border) bg-transparent px-3 py-2 text-sm",
                    "outline-none focus:ring-2 focus:ring-black/15",
                  )}
                  placeholder="site_supervisor"
                />
              </label>
              <button
                type="submit"
                disabled={savingRole || !roleForm.label.trim()}
                className={cn(
                  "sm:col-span-2 rounded-lg bg-(--primary) px-3 py-2 text-sm font-semibold text-white",
                  "disabled:opacity-60",
                )}
              >
                {savingRole ? t("common.saving") : "Add role"}
              </button>
            </form>
          ) : null}
        </div>
      </section>

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
      {groupedPermissions.map(([module, modulePermissions]) => {
        const collapsed = Boolean(collapsedModules[module]);

        return (
          <section
            key={module}
            className="overflow-hidden rounded-xl border border-(--border) bg-(--card)"
          >
            <button
              type="button"
              onClick={() => toggleModule(module)}
              className="sticky top-0 z-10 flex w-full items-center justify-between gap-3 border-b border-(--border) bg-(--card)/95 px-4 py-3 text-left backdrop-blur hover:bg-black/[0.025] focus:outline-none focus:ring-2 focus:ring-black/15"
              aria-expanded={!collapsed}
            >
              <span className="flex min-w-0 items-center gap-3">
                <ChevronDown
                  className={cn(
                    "h-4 w-4 shrink-0 text-(--muted) transition-transform",
                    collapsed && "-rotate-90",
                  )}
                />
                <span className="min-w-0">
                  <span className="block truncate text-sm font-semibold">
                    {module}
                  </span>
                  <span className="block text-xs text-(--muted)">
                    {modulePermissions.length}{" "}
                    {t("admin.permissions.permissions")}
                  </span>
                </span>
              </span>
              <Badge tone={collapsed ? "neutral" : "info"}>
                {collapsed ? "Expand" : t("admin.permissions.tipClickBoxes")}
              </Badge>
            </button>

            <div className="overflow-x-auto border-b border-(--border) bg-black/[0.012]">
              <table className="w-full text-sm">
                <tbody>
                  <tr>
                    <td
                      className={cn(
                        "sticky left-0 z-0 min-w-[280px] bg-inherit px-4 py-3",
                        "shadow-[1px_0_0_0_var(--border)]",
                      )}
                    >
                      <div className="font-medium">All {module} permissions</div>
                      <div className="text-xs text-(--muted)">
                        Grant or revoke this whole module at once.
                      </div>
                    </td>

                    {roles.map((role) => {
                      const assignedCount = modulePermissions.filter((permission) =>
                        permissionMap.get(`${role.value}-${permission.id}`),
                      ).length;
                      const allAssigned =
                        assignedCount === modulePermissions.length &&
                        modulePermissions.length > 0;
                      const someAssigned = assignedCount > 0 && !allAssigned;
                      const key = `module-${role.value}-${module}`;
                      const isSaving = savingKey === key;

                      return (
                        <td key={role.value} className="px-4 py-3 text-center">
                          <button
                            type="button"
                            onClick={() =>
                              !isSaving &&
                              toggleModulePermissions(
                                role.value,
                                module,
                                modulePermissions,
                              )
                            }
                            className={cn(
                              "inline-flex min-w-20 items-center justify-center gap-2 rounded-lg border px-3 py-2",
                              "text-xs font-medium transition-colors",
                              allAssigned
                                ? "border-black/15 bg-black/5"
                                : someAssigned
                                  ? "border-blue-200 bg-blue-50 text-blue-700"
                                  : "border-(--border) bg-transparent",
                              isSaving && "opacity-60",
                              !canManagePermissions &&
                                "cursor-not-allowed opacity-70",
                              "hover:bg-black/10",
                              "focus:outline-none focus:ring-2 focus:ring-black/15",
                            )}
                            aria-pressed={allAssigned}
                            disabled={isSaving || !canManagePermissions}
                            title={`${role.label} - all ${module} permissions`}
                          >
                            <input
                              type="checkbox"
                              checked={allAssigned}
                              ref={(input) => {
                                if (input) input.indeterminate = someAssigned;
                              }}
                              readOnly
                              className="h-4 w-4 accent-black"
                              tabIndex={-1}
                              aria-hidden="true"
                            />
                            <span>
                              {isSaving
                                ? t("common.saving")
                                : `${assignedCount}/${modulePermissions.length}`}
                            </span>
                          </button>
                        </td>
                      );
                    })}
                  </tr>
                </tbody>
              </table>
            </div>

            {!collapsed ? (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-black/2">
                    <tr className="border-b border-(--border)">
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
                                  !canManagePermissions &&
                                    "cursor-not-allowed opacity-70",
                                  "hover:bg-black/10",
                                  "focus:outline-none focus:ring-2 focus:ring-black/15",
                                )}
                                aria-pressed={!!assigned}
                                aria-label={`${role.label} - ${permission.name}`}
                                disabled={isSaving || !canManagePermissions}
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
            ) : null}
          </section>
        );
      })}
      <ConfirmDialog
        isOpen={Boolean(roleDeleteTarget)}
        onClose={() => setRoleDeleteTarget(null)}
        onConfirm={confirmDeleteRole}
        title="Delete role"
        message={`Delete role "${roleDeleteTarget?.label || ""}"? This action cannot be undone.`}
        loading={Boolean(deletingRoleId)}
        confirmLabel="Delete"
      />
    </div>
  );
}

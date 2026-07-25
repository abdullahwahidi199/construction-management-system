import React, { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import instance from "../api/axiosInstance";
import { useLanguage } from "../hooks/useLanguage";
import usePost from "../hooks/usePost";
import { getFriendlyErrorMessage } from "../utils/apiErrors";

function cn(...classes) {
  return classes.filter(Boolean).join(" ");
}

// --- Icons ---
const EditIcon = () => (
  <svg
    className="h-4 w-4"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
    />
  </svg>
);
const LockIcon = () => (
  <svg
    className="h-4 w-4"
    style={{ color: "var(--muted)" }}
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
    />
  </svg>
);

export default function UserManagement() {
  const { t } = useLanguage();
  const [users, setUsers] = useState([]);
  const [meta, setMeta] = useState({ roles: [] });
  const [loading, setLoading] = useState(true);

  const [showCreate, setShowCreate] = useState(false);
  const [editingUser, setEditingUser] = useState(null);

  const { postData, loading: creating, error: createError } = usePost();
  const roles = useMemo(() => meta.roles || [], [meta]);

  const load = async () => {
    setLoading(true);
    try {
      const [usersRes, metaRes] = await Promise.all([
        instance.get("auth/users/"),
        instance.get("auth/meta/"),
      ]);
      setUsers(usersRes.data.results || usersRes.data);
      setMeta(metaRes.data);
    } catch (err) {
      toast.error(getFriendlyErrorMessage(err, "Unable to load users."));
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const updateRole = async (id, role) => {
    try {
      await instance.post(`auth/users/${id}/set_role/`, { role });
      toast.success("User role updated.");
      await load();
    } catch (err) {
      toast.error(getFriendlyErrorMessage(err, "Unable to save changes."));
    }
  };

  const toggleActive = async (user) => {
    try {
      await instance.patch(`auth/users/${user.id}/`, {
        is_active: !user.is_active,
      });
      toast.success(!user.is_active ? "User enabled." : "User disabled.");
      await load();
    } catch (err) {
      toast.error(getFriendlyErrorMessage(err, "Unable to save changes."));
    }
  };

  if (loading) {
    return (
      <div className="space-y-4 animate-pulse">
        <div
          className="h-8 w-48 rounded"
          style={{ backgroundColor: "var(--border)" }}
        />
        <div
          className="h-96 rounded-xl"
          style={{ backgroundColor: "var(--border)" }}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: "var(--text)" }}>
            {t("admin.users.title")}
          </h1>
          <p className="mt-1 text-sm" style={{ color: "var(--muted)" }}>
            {t("admin.users.subtitle")}
          </p>
        </div>
        <button
          className="inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold text-white shadow-sm transition focus:outline-none focus:ring-2 focus:ring-offset-2"
          style={{
            backgroundColor: "var(--primary)",
            "--tw-ring-color": "var(--primary)",
          }}
          onMouseEnter={(e) =>
            (e.currentTarget.style.filter = "brightness(1.1)")
          }
          onMouseLeave={(e) => (e.currentTarget.style.filter = "none")}
          onClick={() => setShowCreate(true)}
        >
          + {t("common.create")}
        </button>
      </header>

      <div
        className="overflow-hidden rounded-xl shadow-sm"
        style={{
          border: "1px solid var(--border)",
          backgroundColor: "var(--card)",
        }}
      >
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm rtl:text-right">
            <thead
              className="text-xs uppercase tracking-wider"
              style={{
                borderBottom: "1px solid var(--border)",
                backgroundColor: "var(--hover)",
                color: "var(--muted)",
              }}
            >
              <tr>
                <th className="px-6 py-3 font-semibold">
                  {t("admin.users.username")}
                </th>
                <th className="px-6 py-3 font-semibold">
                  {t("admin.users.email")}
                </th>
                <th className="px-6 py-3 font-semibold">
                  {t("admin.users.role")}
                </th>
                <th className="px-6 py-3 font-semibold">
                  {t("admin.users.status")}
                </th>
                <th className="px-6 py-3 text-right font-semibold rtl:text-left">
                  {t("admin.users.actions")}
                </th>
              </tr>
            </thead>
            <tbody
              style={{
                "--divide-color": "var(--border)",
              }}
            >
              {users.map((user) => (
                <tr
                  key={user.id}
                  className="transition"
                  style={{
                    borderBottom: "1px solid var(--border)",
                  }}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.backgroundColor = "var(--hover)")
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.backgroundColor = "transparent")
                  }
                >
                  <td
                    className="whitespace-nowrap px-6 py-4 font-medium"
                    style={{ color: "var(--text)" }}
                  >
                    {user.username}
                  </td>
                  <td
                    className="whitespace-nowrap px-6 py-4"
                    style={{ color: "var(--muted)" }}
                  >
                    {user.email || "-"}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4">
                    <select
                      className="rounded-md px-2 py-1 text-xs font-medium shadow-sm focus:outline-none focus:ring-1"
                      style={{
                        border: "1px solid var(--border)",
                        backgroundColor: "var(--card)",
                        color: "var(--text)",
                        "--tw-ring-color": "var(--primary)",
                      }}
                      value={user.role}
                      onChange={(e) => updateRole(user.id, e.target.value)}
                    >
                      {roles.map((role) => (
                        <option key={role.value} value={role.value}>
                          {role.label}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="whitespace-nowrap px-6 py-4">
                    <span
                      className="inline-flex rounded-full px-2 py-0.5 text-xs font-semibold"
                      style={{
                        backgroundColor: user.is_active
                          ? "color-mix(in srgb, var(--success) 15%, transparent)"
                          : "color-mix(in srgb, var(--danger) 15%, transparent)",
                        color: user.is_active
                          ? "var(--success)"
                          : "var(--danger)",
                      }}
                    >
                      {user.is_active
                        ? t("common.active")
                        : t("common.inactive")}
                    </span>
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-right rtl:text-left">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => setEditingUser(user)}
                        className="inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium shadow-sm transition"
                        style={{
                          border: "1px solid var(--border)",
                          backgroundColor: "var(--card)",
                          color: "var(--text)",
                        }}
                        onMouseEnter={(e) =>
                          (e.currentTarget.style.backgroundColor =
                            "var(--hover)")
                        }
                        onMouseLeave={(e) =>
                          (e.currentTarget.style.backgroundColor =
                            "var(--card)")
                        }
                      >
                        <EditIcon /> {t("admin.users.edit")}
                      </button>
                      <button
                        onClick={() => toggleActive(user)}
                        className="rounded-md px-3 py-1.5 text-xs font-medium transition"
                        style={{
                          backgroundColor: user.is_active
                            ? "color-mix(in srgb, var(--danger) 12%, transparent)"
                            : "color-mix(in srgb, var(--success) 12%, transparent)",
                          color: user.is_active
                            ? "var(--danger)"
                            : "var(--success)",
                        }}
                        onMouseEnter={(e) =>
                          (e.currentTarget.style.backgroundColor =
                            user.is_active
                              ? "color-mix(in srgb, var(--danger) 22%, transparent)"
                              : "color-mix(in srgb, var(--success) 22%, transparent)")
                        }
                        onMouseLeave={(e) =>
                          (e.currentTarget.style.backgroundColor =
                            user.is_active
                              ? "color-mix(in srgb, var(--danger) 12%, transparent)"
                              : "color-mix(in srgb, var(--success) 12%, transparent)")
                        }
                      >
                        {user.is_active
                          ? t("admin.users.disable")
                          : t("admin.users.enable")}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {users.length === 0 && (
                <tr>
                  <td
                    colSpan={5}
                    className="px-6 py-12 text-center"
                    style={{ color: "var(--muted)" }}
                  >
                    {t("admin.users.empty")}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modals */}
      {showCreate && (
        <CreateUserModal
          roles={roles}
          onClose={() => setShowCreate(false)}
          onCreated={() => {
            setShowCreate(false);
            load();
          }}
          postData={postData}
          creating={creating}
          createError={createError}
          t={t}
        />
      )}

      {editingUser && (
        <EditUserModal
          user={editingUser}
          roles={roles}
          onClose={() => setEditingUser(null)}
          onUpdated={() => {
            setEditingUser(null);
            load();
          }}
          t={t}
        />
      )}
    </div>
  );
}

/* =========================
   EDIT USER MODAL
========================= */
function EditUserModal({ user, roles, onClose, onUpdated, t }) {
  const [form, setForm] = useState({
    username: user.username || "",
    email: user.email || "",
    role: user.role || roles[0]?.value || "",
    newPassword: "",
    confirmPassword: "",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const handleChange = (field) => (e) =>
    setForm((prev) => ({ ...prev, [field]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (form.newPassword && form.newPassword.length < 6) {
      setError(t("admin.users.errors.passwordLength"));
      return;
    }
    if (form.newPassword && form.newPassword !== form.confirmPassword) {
      setError(t("admin.users.errors.passwordMatch"));
      return;
    }

    setSaving(true);

    try {
      await instance.patch(`auth/users/${user.id}/`, {
        username: form.username.trim(),
        email: form.email.trim(),
      });

      if (form.role !== user.role) {
        await instance.post(`auth/users/${user.id}/set_role/`, {
          role: form.role,
        });
      }

      if (form.newPassword) {
        await instance.post(`auth/users/${user.id}/set_password/`, {
          new_password: form.newPassword,
        });
      }

      toast.success("User updated.");
      onUpdated();
    } catch (err) {
      setError(getFriendlyErrorMessage(err, t("common.error")));
    } finally {
      setSaving(false);
    }
  };

  const inputStyle = {
    width: "100%",
    border: "1px solid var(--border)",
    backgroundColor: "var(--hover)",
    color: "var(--text)",
    borderRadius: "0.5rem",
    padding: "0.5rem 0.75rem",
    fontSize: "0.875rem",
    outline: "none",
    transition: "border-color 0.15s, box-shadow 0.15s",
  };

  const inputFocusHandlers = {
    onFocus: (e) => {
      e.currentTarget.style.borderColor = "var(--primary)";
      e.currentTarget.style.boxShadow =
        "0 0 0 2px color-mix(in srgb, var(--primary) 25%, transparent)";
    },
    onBlur: (e) => {
      e.currentTarget.style.borderColor = "var(--border)";
      e.currentTarget.style.boxShadow = "none";
    },
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{
        backgroundColor: "rgba(0,0,0,0.6)",
        backdropFilter: "blur(4px)",
      }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg rounded-xl p-6 shadow-2xl"
        style={{
          border: "1px solid var(--border)",
          backgroundColor: "var(--card)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="mb-6 text-xl font-bold" style={{ color: "var(--text)" }}>
          {t("admin.users.edit")}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label
                htmlFor="edit-user-username"
                className="mb-1.5 block text-xs font-semibold uppercase tracking-wider"
                style={{ color: "var(--muted)" }}
              >
                {t("admin.users.username")}
              </label>
              <input
                id="edit-user-username"
                type="text"
                style={inputStyle}
                {...inputFocusHandlers}
                value={form.username}
                onChange={handleChange("username")}
                required
              />
            </div>
            <div>
              <label
                htmlFor="edit-user-email"
                className="mb-1.5 block text-xs font-semibold uppercase tracking-wider"
                style={{ color: "var(--muted)" }}
              >
                {t("admin.users.email")}
              </label>
              <input
                id="edit-user-email"
                type="email"
                style={inputStyle}
                {...inputFocusHandlers}
                value={form.email}
                onChange={handleChange("email")}
              />
            </div>
          </div>

          <div>
            <label
              htmlFor="edit-user-role"
              className="mb-1.5 block text-xs font-semibold uppercase tracking-wider"
              style={{ color: "var(--muted)" }}
            >
              {t("admin.users.role")}
            </label>
            <select
              id="edit-user-role"
              style={inputStyle}
              {...inputFocusHandlers}
              value={form.role}
              onChange={handleChange("role")}
            >
              {roles.map((role) => (
                <option key={role.value} value={role.value}>
                  {role.label}
                </option>
              ))}
            </select>
          </div>

          {/* Password Section */}
          <div
            className="rounded-lg p-4"
            style={{
              border: "1px solid var(--border)",
              backgroundColor: "var(--hover)",
            }}
          >
            <div
              className="mb-3 flex items-center gap-2 text-sm font-semibold"
              style={{ color: "var(--text)" }}
            >
              <LockIcon /> {t("admin.users.changePassword")}
            </div>
            <p className="mb-4 text-xs" style={{ color: "var(--muted)" }}>
              {t("admin.users.leaveBlankPassword")}
            </p>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label
                  htmlFor="edit-user-new-password"
                  className="mb-1.5 block text-xs font-medium"
                  style={{ color: "var(--muted)" }}
                >
                  {t("admin.users.newPassword")}
                </label>
                <input
                  id="edit-user-new-password"
                  type="password"
                  style={{
                    ...inputStyle,
                    backgroundColor: "var(--card)",
                  }}
                  {...inputFocusHandlers}
                  value={form.newPassword}
                  onChange={handleChange("newPassword")}
                />
              </div>
              <div>
                <label
                  htmlFor="edit-user-confirm-password"
                  className="mb-1.5 block text-xs font-medium"
                  style={{ color: "var(--muted)" }}
                >
                  {t("admin.users.confirmNewPassword")}
                </label>
                <input
                  id="edit-user-confirm-password"
                  type="password"
                  style={{
                    ...inputStyle,
                    backgroundColor: "var(--card)",
                  }}
                  {...inputFocusHandlers}
                  value={form.confirmPassword}
                  onChange={handleChange("confirmPassword")}
                />
              </div>
            </div>
          </div>

          {error && (
            <div
              className="rounded-lg p-3 text-sm"
              style={{
                backgroundColor:
                  "color-mix(in srgb, var(--danger) 12%, transparent)",
                color: "var(--danger)",
              }}
            >
              {error}
            </div>
          )}

          <div
            className="flex justify-end gap-3 pt-5"
            style={{ borderTop: "1px solid var(--border)" }}
          >
            <button
              type="button"
              className="rounded-lg px-4 py-2 text-sm font-medium transition"
              style={{
                border: "1px solid var(--border)",
                backgroundColor: "var(--card)",
                color: "var(--text)",
              }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.backgroundColor = "var(--hover)")
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.backgroundColor = "var(--card)")
              }
              onClick={onClose}
              disabled={saving}
            >
              {t("common.cancel")}
            </button>
            <button
              type="submit"
              className="rounded-lg px-4 py-2 text-sm font-semibold text-white shadow-sm transition disabled:opacity-50"
              style={{ backgroundColor: "var(--primary)" }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.filter = "brightness(1.1)")
              }
              onMouseLeave={(e) => (e.currentTarget.style.filter = "none")}
              disabled={saving}
            >
              {saving ? t("common.saving") : t("admin.users.update")}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* =========================
   CREATE USER MODAL
========================= */
function CreateUserModal({
  roles,
  onClose,
  onCreated,
  postData,
  creating,
  createError,
  t,
}) {
  const [form, setForm] = useState({
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
    role: roles[0]?.value || "",
  });
  const [localError, setLocalError] = useState(null);

  const handleChange = (field) => (e) =>
    setForm((prev) => ({ ...prev, [field]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLocalError(null);
    if (!form.username.trim())
      return setLocalError(t("admin.users.errors.username"));
    if (form.password.length < 6)
      return setLocalError(t("admin.users.errors.passwordLength"));
    if (form.password !== form.confirmPassword)
      return setLocalError(t("admin.users.errors.passwordMatch"));

    try {
      await postData("auth/users/", {
        username: form.username.trim(),
        email: form.email.trim(),
        password: form.password,
        role: form.role,
      });
      toast.success("User created.");
      onCreated();
    } catch {}
  };

  const renderApiError = () => {
    if (!createError) return null;
    if (typeof createError === "string") return createError;
    return t("common.error");
  };

  const inputStyle = {
    width: "100%",
    border: "1px solid var(--border)",
    backgroundColor: "var(--hover)",
    color: "var(--text)",
    borderRadius: "0.5rem",
    padding: "0.5rem 0.75rem",
    fontSize: "0.875rem",
    outline: "none",
    transition: "border-color 0.15s, box-shadow 0.15s",
  };

  const inputFocusHandlers = {
    onFocus: (e) => {
      e.currentTarget.style.borderColor = "var(--primary)";
      e.currentTarget.style.boxShadow =
        "0 0 0 2px color-mix(in srgb, var(--primary) 25%, transparent)";
    },
    onBlur: (e) => {
      e.currentTarget.style.borderColor = "var(--border)";
      e.currentTarget.style.boxShadow = "none";
    },
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{
        backgroundColor: "rgba(0,0,0,0.6)",
        backdropFilter: "blur(4px)",
      }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-xl p-6 shadow-2xl"
        style={{
          border: "1px solid var(--border)",
          backgroundColor: "var(--card)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="mb-6 text-xl font-bold" style={{ color: "var(--text)" }}>
          {t("admin.users.create")}
        </h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="create-user-username"
              className="mb-1.5 block text-xs font-semibold uppercase tracking-wider"
              style={{ color: "var(--muted)" }}
            >
              {t("admin.users.username")}
            </label>
            <input
              id="create-user-username"
              type="text"
              style={inputStyle}
              {...inputFocusHandlers}
              value={form.username}
              onChange={handleChange("username")}
              autoFocus
              required
            />
          </div>
          <div>
            <label
              htmlFor="create-user-email"
              className="mb-1.5 block text-xs font-semibold uppercase tracking-wider"
              style={{ color: "var(--muted)" }}
            >
              {t("admin.users.email")}
            </label>
            <input
              id="create-user-email"
              type="email"
              style={inputStyle}
              {...inputFocusHandlers}
              value={form.email}
              onChange={handleChange("email")}
            />
          </div>
          <div>
            <label
              htmlFor="create-user-role"
              className="mb-1.5 block text-xs font-semibold uppercase tracking-wider"
              style={{ color: "var(--muted)" }}
            >
              {t("admin.users.role")}
            </label>
            <select
              id="create-user-role"
              style={inputStyle}
              {...inputFocusHandlers}
              value={form.role}
              onChange={handleChange("role")}
            >
              {roles.map((role) => (
                <option key={role.value} value={role.value}>
                  {role.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label
              htmlFor="create-user-password"
              className="mb-1.5 block text-xs font-semibold uppercase tracking-wider"
              style={{ color: "var(--muted)" }}
            >
              {t("admin.users.password")}
            </label>
            <input
              id="create-user-password"
              type="password"
              style={inputStyle}
              {...inputFocusHandlers}
              value={form.password}
              onChange={handleChange("password")}
              required
            />
          </div>
          <div>
            <label
              htmlFor="create-user-confirm-password"
              className="mb-1.5 block text-xs font-semibold uppercase tracking-wider"
              style={{ color: "var(--muted)" }}
            >
              {t("admin.users.confirmPassword")}
            </label>
            <input
              id="create-user-confirm-password"
              type="password"
              style={inputStyle}
              {...inputFocusHandlers}
              value={form.confirmPassword}
              onChange={handleChange("confirmPassword")}
              required
            />
          </div>

          {(localError || createError) && (
            <div
              className="rounded-lg p-3 text-sm"
              style={{
                backgroundColor:
                  "color-mix(in srgb, var(--danger) 12%, transparent)",
                color: "var(--danger)",
              }}
            >
              {localError || renderApiError()}
            </div>
          )}

          <div
            className="flex justify-end gap-3 pt-5"
            style={{ borderTop: "1px solid var(--border)" }}
          >
            <button
              type="button"
              className="rounded-lg px-4 py-2 text-sm font-medium transition"
              style={{
                border: "1px solid var(--border)",
                backgroundColor: "var(--card)",
                color: "var(--text)",
              }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.backgroundColor = "var(--hover)")
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.backgroundColor = "var(--card)")
              }
              onClick={onClose}
              disabled={creating}
            >
              {t("common.cancel")}
            </button>
            <button
              type="submit"
              className="rounded-lg px-4 py-2 text-sm font-semibold text-white shadow-sm transition disabled:opacity-50"
              style={{ backgroundColor: "var(--primary)" }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.filter = "brightness(1.1)")
              }
              onMouseLeave={(e) => (e.currentTarget.style.filter = "none")}
              disabled={creating}
            >
              {creating ? t("common.saving") : t("common.create")}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

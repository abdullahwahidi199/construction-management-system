import React, { useState } from "react";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import { Building2, LogIn } from "lucide-react";
import { useAuth } from "./AuthContext";
import { roleHome } from "./roles";
import { useLanguage } from "../hooks/useLanguage";
import LanguageSwitcher from "../components/LanguageSwitcher";

export default function LoginPage() {
  const { login, isAuthenticated, role } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const location = useLocation();
  const [form, setForm] = useState({ username: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  if (isAuthenticated) {
    return <Navigate to={roleHome[role] || "/"} replace />;
  }

  const submit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError("");
    try {
      const data = await login(form);
      navigate(location.state?.from?.pathname || roleHome[data.role] || "/", {
        replace: true,
      });
    } catch (err) {
      setError(
        err?.response?.data?.non_field_errors?.[0] ||
          err?.response?.data?.detail ||
          t("auth.login.error"),
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-(--bg) px-4 text-(--text)">
      <section className="w-full max-w-md rounded-lg border border-(--border) bg-(--card) p-6 shadow-sm">
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-(--primary) text-white">
              <Building2 className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-xl font-bold">{t("auth.login.title")}</h1>
              <p className="text-sm text-(--muted)">{t("auth.login.subtitle")}</p>
            </div>
          </div>
          <LanguageSwitcher />
        </div>

        <form className="space-y-4" onSubmit={submit}>
          <label className="block">
            <span className="mb-1 block text-sm font-medium">{t("auth.login.username")}</span>
            <input
              className="h-10 w-full rounded-lg border border-(--border) bg-(--bg) px-3 text-sm outline-none focus:border-(--primary)"
              value={form.username}
              onChange={(event) => setForm((prev) => ({ ...prev, username: event.target.value }))}
              autoComplete="username"
              required
            />
          </label>
          <label className="block">
            <span className="mb-1 block text-sm font-medium">{t("auth.login.password")}</span>
            <input
              className="h-10 w-full rounded-lg border border-(--border) bg-(--bg) px-3 text-sm outline-none focus:border-(--primary)"
              type="password"
              value={form.password}
              onChange={(event) => setForm((prev) => ({ ...prev, password: event.target.value }))}
              autoComplete="current-password"
              required
            />
          </label>
          {error && <p className="text-sm text-red-500">{error}</p>}
          <button
            className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-lg bg-(--primary) px-4 text-sm font-semibold text-white disabled:opacity-60"
            disabled={loading}
            type="submit"
          >
            <LogIn className="h-4 w-4" />
            {loading ? t("auth.login.signingIn") : t("auth.login.submit")}
          </button>
        </form>
      </section>
    </main>
  );
}

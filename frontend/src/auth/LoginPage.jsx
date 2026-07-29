import React, { useEffect, useState } from "react";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import { Building2, LogIn } from "lucide-react";
import { useAuth } from "./AuthContext";
import { homeForUser } from "./roles";
import { useLanguage } from "../hooks/useLanguage";
import LanguageSwitcher from "../components/LanguageSwitcher";
import { SESSION_NOTICE_KEY } from "../api/axiosInstance";
import { getFriendlyErrorMessage } from "../utils/apiErrors";

export default function LoginPage() {
  const { login, isAuthenticated, role, permissions = [] } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const location = useLocation();
  const [form, setForm] = useState({ username: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const notice = localStorage.getItem(SESSION_NOTICE_KEY);
    if (notice) {
      setError(notice);
      localStorage.removeItem(SESSION_NOTICE_KEY);
    }
  }, []);

  if (isAuthenticated) {
    return <Navigate to={homeForUser(role, permissions)} replace />;
  }

  const submit = async (event) => {
    event.preventDefault();
    if (loading) return;
    if (!form.username.trim() || !form.password) {
      setError("Please enter your username and password.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const data = await login(form);
      navigate(
        location.state?.from?.pathname ||
          homeForUser(data.role, data.permissions || data.user?.permissions || []),
        {
          replace: true,
        },
      );
    } catch (err) {
      setError(getFriendlyErrorMessage(err, t("auth.login.error")));
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="flex min-h-[100svh] items-center justify-center bg-(--bg) px-4 text-(--text)">
      <section className="w-full max-w-md rounded-lg border border-(--border) bg-(--card) p-6 shadow-sm">
        <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-(--primary) text-white">
              <Building2 className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <h1 className="break-words text-xl font-bold">{t("auth.login.title")}</h1>
              <p className="break-words text-sm text-(--muted)">{t("auth.login.subtitle")}</p>
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
              aria-invalid={Boolean(error && !form.username.trim())}
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
              aria-invalid={Boolean(error && !form.password)}
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

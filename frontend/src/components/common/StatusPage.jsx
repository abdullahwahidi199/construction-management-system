import { ArrowLeft, FileQuestion, LayoutDashboard, ShieldAlert } from "lucide-react";
import { useNavigate } from "react-router-dom";

export function NotFoundPage() {
  const navigate = useNavigate();

  return (
    <StatusPage
      code="404"
      icon={<FileQuestion className="h-20 w-20" />}
      title="Page not found"
      message="The page you are looking for does not exist or may have been moved."
      primaryLabel="Dashboard"
      onPrimary={() => navigate("/")}
      secondaryLabel="Go Back"
      onSecondary={() => navigate(-1)}
    />
  );
}

export function UnauthorizedPage() {
  const navigate = useNavigate();

  return (
    <StatusPage
      icon={<ShieldAlert className="h-20 w-20" />}
      title="Permission required"
      message="You don't have permission to view this page."
      primaryLabel="Dashboard"
      onPrimary={() => navigate("/")}
      secondaryLabel="Go Back"
      onSecondary={() => navigate(-1)}
    />
  );
}

function StatusPage({
  code,
  icon,
  title,
  message,
  primaryLabel,
  onPrimary,
  secondaryLabel,
  onSecondary,
}) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[var(--bg)] px-4 py-10 text-[var(--text)]">
      <section className="w-full max-w-2xl text-center">
        <div className="mx-auto flex h-32 w-32 items-center justify-center rounded-2xl border border-[var(--border)] bg-[var(--card)] text-[var(--primary)] shadow-sm">
          {icon}
        </div>
        {code && (
          <p className="mt-8 text-6xl font-black text-[var(--primary)]">{code}</p>
        )}
        <h1 className="mt-4 text-3xl font-bold">{title}</h1>
        <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-[var(--muted)]">
          {message}
        </p>
        <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
          <button
            type="button"
            onClick={onSecondary}
            className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-[var(--border)] px-4 text-sm font-semibold text-[var(--text)] hover:bg-[var(--hover)]"
          >
            <ArrowLeft className="h-4 w-4" />
            {secondaryLabel}
          </button>
          <button
            type="button"
            onClick={onPrimary}
            className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-[var(--primary)] px-4 text-sm font-semibold text-white"
          >
            <LayoutDashboard className="h-4 w-4" />
            {primaryLabel}
          </button>
        </div>
      </section>
    </main>
  );
}


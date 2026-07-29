import { useEffect, useMemo, useState } from "react";
import { NavLink, Outlet, useLocation } from "react-router-dom";
import { LogOut, Menu, MoreHorizontal, X } from "lucide-react";
import useBodyScrollLock from "../../hooks/useBodyScrollLock";

function cx(...classes) {
  return classes.filter(Boolean).join(" ");
}

function isActivePath(pathname, to) {
  return pathname === to || pathname.startsWith(`${to}/`);
}

export default function ResponsiveAppShell({
  title,
  brandIcon: BrandIcon,
  links = [],
  tools,
  user,
  logout,
  logoutLabel = "Logout",
  maxWidth = "max-w-9xl",
}) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const location = useLocation();
  const visibleLinks = useMemo(() => links.filter(Boolean), [links]);
  const drawerLinks = visibleLinks;
  const hasOverflow = visibleLinks.length > 5;
  const primaryLinks = visibleLinks.slice(0, hasOverflow ? 4 : 5);
  const bottomItemCount = hasOverflow ? 5 : Math.max(primaryLinks.length, 1);
  const bottomGridClass =
    {
      1: "grid-cols-1",
      2: "grid-cols-2",
      3: "grid-cols-3",
      4: "grid-cols-4",
      5: "grid-cols-5",
    }[Math.min(bottomItemCount, 5)] || "grid-cols-5";

  useBodyScrollLock(drawerOpen);

  useEffect(() => {
    setDrawerOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    const onKeyDown = (event) => {
      if (event.key === "Escape") setDrawerOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  return (
    <div className="min-h-[100svh] bg-(--bg) text-(--text)">
      <nav className="sticky top-0 z-50 border-b border-(--border) bg-(--bg)/92 pt-[var(--safe-top)] backdrop-blur-xl">
        <div className={cx("mx-auto flex h-16 items-center justify-between gap-3 px-4 sm:px-6 lg:px-8", maxWidth)}>
          <div className="flex min-w-0 items-center gap-2 font-bold">
            <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-(--primary)/10 text-(--primary)">
              {BrandIcon && <BrandIcon className="h-5 w-5" />}
            </span>
            <span className="truncate">{title}</span>
          </div>

          <div className="hidden min-w-0 items-center gap-1 md:flex">
            {visibleLinks.map(({ label, to, icon: Icon }) => (
              <NavLink
                key={to}
                to={to}
                className={({ isActive }) =>
                  cx(
                    "inline-flex h-10 items-center gap-2 rounded-lg px-3 text-sm transition-colors",
                    isActive
                      ? "bg-(--primary)/10 text-(--primary)"
                      : "text-(--muted) hover:bg-(--hover) hover:text-(--text)",
                  )
                }
              >
                {Icon && <Icon className="h-4 w-4 shrink-0" />}
                <span className="truncate">{label}</span>
              </NavLink>
            ))}
          </div>

          <div className="flex shrink-0 items-center gap-2">
            <span className="hidden max-w-32 truncate text-sm text-(--muted) sm:inline">
              {user?.username}
            </span>
            <div className="hidden items-center gap-2 sm:flex">{tools}</div>
            <button
              onClick={logout}
              className="hidden h-10 w-10 items-center justify-center rounded-lg text-(--muted) transition hover:bg-(--hover) hover:text-(--text) sm:inline-flex"
              title={logoutLabel}
              aria-label={logoutLabel}
              type="button"
            >
              <LogOut className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => setDrawerOpen(true)}
              className="inline-flex h-11 w-11 items-center justify-center rounded-xl text-(--muted) transition active:bg-(--hover) md:hidden"
              aria-label="Open navigation"
              aria-expanded={drawerOpen}
              aria-controls="mobile-app-drawer"
            >
              <Menu className="h-5 w-5" />
            </button>
          </div>
        </div>
      </nav>

      <main className={cx("mobile-page-shell mx-auto px-4 py-5 sm:px-6 sm:py-6 lg:px-8", maxWidth)}>
        <Outlet />
      </main>

      <div
        className={cx(
          "fixed inset-0 z-[100] bg-black/35 backdrop-blur-sm transition-opacity duration-200 md:hidden",
          drawerOpen ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0",
        )}
        onClick={() => setDrawerOpen(false)}
        aria-hidden="true"
      />
      <aside
        id="mobile-app-drawer"
        className={cx(
          "fixed inset-y-0 start-0 z-[110] w-[min(21rem,86vw)] flex-col overflow-x-hidden border-e border-(--border) bg-(--bg) pt-[var(--safe-top)] shadow-2xl transition-transform duration-[250ms] md:hidden",
          drawerOpen
            ? "flex translate-x-0"
            : "hidden -translate-x-full rtl:translate-x-full",
        )}
        aria-hidden={!drawerOpen}
      >
        <div className="flex items-center justify-between border-b border-(--border) px-4 py-3">
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold">{title}</p>
            {user?.username && (
              <p className="truncate text-xs text-(--muted)">{user.username}</p>
            )}
          </div>
          <button
            type="button"
            onClick={() => setDrawerOpen(false)}
            className="inline-flex h-11 w-11 items-center justify-center rounded-xl text-(--muted) active:bg-(--hover)"
            aria-label="Close navigation"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-3 py-4 mobile-scrollbar">
          <div className="grid gap-1">
            {drawerLinks.map(({ label, to, icon: Icon }) => (
              <NavLink
                key={to}
                to={to}
                className={({ isActive }) =>
                  cx(
                    "flex min-h-14 items-center gap-3 rounded-xl px-3 text-base font-medium transition",
                    isActive
                      ? "bg-(--primary)/10 text-(--primary)"
                      : "text-(--muted) active:bg-(--hover) active:text-(--text)",
                  )
                }
              >
                {Icon && <Icon className="h-5 w-5 shrink-0" />}
                <span className="truncate">{label}</span>
              </NavLink>
            ))}
          </div>
        </div>

        <div className="border-t border-(--border) p-4 safe-area-bottom">
          <div className="mb-3 grid gap-2 sm:hidden">{tools}</div>
          <button
            onClick={logout}
            className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-(--danger) px-4 text-sm font-semibold text-white"
            type="button"
          >
            <LogOut className="h-4 w-4" />
            {logoutLabel}
          </button>
        </div>
      </aside>

      <nav className="fixed inset-x-0 bottom-0 z-50 border-t border-(--border) bg-(--bg)/95 px-[max(0.5rem,var(--safe-left))] pb-[var(--safe-bottom)] shadow-[0_-12px_30px_var(--shadow)] backdrop-blur-xl md:hidden">
        <div className={cx("mx-auto grid h-16 max-w-md items-center gap-1", bottomGridClass)}>
          {primaryLinks.map(({ label, to, icon: Icon }) => {
            const active = isActivePath(location.pathname, to);
            return (
              <NavLink
                key={to}
                to={to}
                className={cx(
                  "flex min-w-0 flex-col items-center justify-center gap-1 rounded-xl px-1 py-1 text-[11px] font-medium transition",
                  active ? "text-(--primary)" : "text-(--muted) active:bg-(--hover)",
                )}
              >
                {Icon && <Icon className="h-5 w-5 shrink-0" />}
                <span className="max-w-full truncate">{label}</span>
              </NavLink>
            );
          })}
          <button
            type="button"
            onClick={() => setDrawerOpen(true)}
            className={cx(
              "flex min-w-0 flex-col items-center justify-center gap-1 rounded-xl px-1 py-1 text-[11px] font-medium transition",
              hasOverflow ? "text-(--muted) active:bg-(--hover)" : "hidden",
            )}
            aria-label="More navigation"
          >
            <MoreHorizontal className="h-5 w-5" />
            <span>More</span>
          </button>
        </div>
      </nav>
    </div>
  );
}

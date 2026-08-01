import { useEffect, useMemo, useState } from "react";
import { NavLink, Outlet, useLocation } from "react-router-dom";
import { LogOut, Menu, Settings, X } from "lucide-react";
import useBodyScrollLock from "../../hooks/useBodyScrollLock";

function cx(...classes) {
  return classes.filter(Boolean).join(" ");
}

export default function ResponsiveAppShell({
  title,
  brandIcon: BrandIcon,
  brandLogo,
  brandName,
  brandSubtitle,
  links = [],
  tools,
  settingsTo,
  settingsLabel = "Settings",
  user,
  logout,
  logoutLabel = "Logout",
  maxWidth = "max-w-9xl",
}) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const location = useLocation();
  const visibleLinks = useMemo(() => links.filter(Boolean), [links]);
  const displayTitle = brandName || title;
  const displaySubtitle = brandSubtitle || (brandName ? title : "");

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
            <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-(--primary)/10 text-(--primary)">
              {brandLogo ? (
                <img
                  src={brandLogo}
                  alt=""
                  className="h-full w-full object-contain p-1"
                />
              ) : (
                BrandIcon && <BrandIcon className="h-5 w-5" />
              )}
            </span>
            <span className="min-w-0">
              <span className="block truncate leading-5">{displayTitle}</span>
              {displaySubtitle && (
                <span className="block truncate text-xs font-medium text-(--muted)">
                  {displaySubtitle}
                </span>
              )}
            </span>
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
            {settingsTo && (
              <NavLink
                to={settingsTo}
                className={({ isActive }) =>
                  cx(
                    "inline-flex h-10 w-10 items-center justify-center rounded-lg transition hover:bg-(--hover) focus:outline-none focus-visible:ring-2 focus-visible:ring-(--primary)/35",
                    isActive ? "text-(--primary)" : "text-(--muted) hover:text-(--text)",
                  )
                }
                title={settingsLabel}
                aria-label={settingsLabel}
              >
                <Settings className="h-4 w-4" />
              </NavLink>
            )}
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
        role="dialog"
        aria-label={displayTitle}
        aria-modal="true"
        className={cx(
          "fixed inset-y-0 start-0 z-[110] w-[min(21rem,86vw)] flex-col overflow-hidden border-e border-(--border) bg-(--bg) pt-[var(--safe-top)] shadow-2xl transition-transform duration-[250ms] md:hidden",
          drawerOpen
            ? "flex translate-x-0"
            : "hidden -translate-x-full rtl:translate-x-full",
        )}
        aria-hidden={!drawerOpen}
      >
        <div className="flex items-center justify-between border-b border-(--border) px-4 py-3">
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold">{title}</p>
            {displaySubtitle && (
              <p className="truncate text-xs text-(--muted)">{displaySubtitle}</p>
            )}
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

        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-3 py-4 mobile-scrollbar">
          <div className="grid gap-1">
            {visibleLinks.map(({ label, to, icon: Icon }) => (
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
    </div>
  );
}

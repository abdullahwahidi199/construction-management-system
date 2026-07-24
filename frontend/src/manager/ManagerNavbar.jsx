import { useEffect, useRef, useState } from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import {
  BarChart3,
  BriefcaseBusiness,
  CalendarCheck,
  ClipboardCheck,
  ChevronDown,
  CircleDollarSign,
  Command,
  FileText,
  FolderKanban,
  Handshake,
  HardHat,
  LayoutDashboard,
  LogOut,
  Menu,
  MoreHorizontal,
  Receipt,
  Search,
  Settings,
  User,
  Users,
  X,
} from "lucide-react";
import ThemeToggle from "../components/ui/ToggleButton";
import { useLanguage } from "../hooks/useLanguage";
import LanguageSwitcher from "../components/LanguageSwitcher";
import NotificationBell from "../components/notifications/NotificationBell";
import { useRealtimeNotifications } from "../components/notifications/RealtimeNotificationCenter";
import { useAuth } from "../auth/AuthContext";
import { hasAnyPermission } from "../../utils/permissions";

const isRouteActive = (pathname, itemPath) =>
  pathname === itemPath || pathname.startsWith(`${itemPath}/`);

const initialsFor = (name = "Manager") =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("") || "M";

function IconButton({ children, label, className = "", ...props }) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      className={`inline-flex h-10 w-10 items-center justify-center rounded-lg text-(--muted) transition duration-200 hover:bg-(--hover) hover:text-(--text) focus:outline-none focus-visible:ring-2 focus-visible:ring-(--primary)/35 ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}

function PendingBadge({ value }) {
  if (!value || Number(value) <= 0) return null;
  const label = Number(value) > 99 ? "99+" : value;

  return (
    <span className="ml-auto inline-flex min-w-5 items-center justify-center rounded-full bg-amber-500 px-1.5 py-0.5 text-[10px] font-bold leading-none text-white shadow-sm">
      {label}
    </span>
  );
}

function DesktopNavItem({ item, active, onClick }) {
  const Icon = item.icon;

  return (
    <NavLink
      to={item.path}
      onClick={onClick}
      className={`group relative inline-flex h-10 shrink-0 items-center gap-2 rounded-lg px-3 text-sm font-medium transition duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-(--primary)/35 ${
        active
          ? "text-(--text)"
          : "text-(--muted) hover:bg-(--hover) hover:text-(--text)"
      }`}
    >
      <Icon
        className={`h-4 w-4 shrink-0 transition duration-200 ${
          active ? "text-(--primary)" : "text-(--muted) group-hover:text-(--text)"
        }`}
        strokeWidth={1.9}
      />
      <span className="truncate">{item.name}</span>
      <PendingBadge value={item.badge} />
      <span
        className={`absolute inset-x-3 -bottom-[13px] h-0.5 rounded-full bg-(--primary) transition duration-200 ${
          active ? "opacity-100" : "opacity-0"
        }`}
      />
    </NavLink>
  );
}

function MoreNavMenu({ groups, pathname, open, onToggle, onClose, t }) {
  const hasItems = groups.length > 0;
  const active = groups.some((group) =>
    group.type === "group"
      ? group.items.some((item) => isRouteActive(pathname, item.path))
      : isRouteActive(pathname, group.path),
  );

  if (!hasItems) return null;

  return (
    <div className="relative">
      <button
        type="button"
        onClick={onToggle}
        className={`group relative inline-flex h-10 shrink-0 items-center gap-2 rounded-lg px-3 text-sm font-medium transition duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-(--primary)/35 ${
          active || open
            ? "text-(--text)"
            : "text-(--muted) hover:bg-(--hover) hover:text-(--text)"
        }`}
        aria-haspopup="menu"
        aria-expanded={open}
      >
        <MoreHorizontal
          className={`h-4 w-4 shrink-0 transition duration-200 ${
            active || open
              ? "text-(--primary)"
              : "text-(--muted) group-hover:text-(--text)"
          }`}
          strokeWidth={2}
        />
        <span>{t("managerNavbar.more")}</span>
        <ChevronDown
          className={`h-3.5 w-3.5 transition duration-200 ${open ? "rotate-180" : ""}`}
          strokeWidth={2}
        />
        <span
          className={`absolute inset-x-3 -bottom-[11px] h-0.5 rounded-full bg-(--primary) transition duration-200 ${
            active ? "opacity-100" : "opacity-0"
          }`}
        />
      </button>

      {open && (
        <>
          <button
            type="button"
            aria-label="Close more menu"
            className="fixed inset-0 z-[80] cursor-default bg-black/5"
            onClick={onClose}
          />
          <div
            role="menu"
            className="fixed left-1/2 top-16 z-[90] max-h-[calc(100vh-5rem)] w-[calc(100vw-1.5rem)] max-w-2xl -translate-x-1/2 overflow-y-auto rounded-xl border border-(--border) bg-(--card) p-3 shadow-2xl shadow-black/15 ring-1 ring-black/5 transition duration-200 dark:shadow-black/35"
          >
            {groups.map((group) => {
              if (group.type !== "group") {
                const Icon = group.icon;
                const itemActive = isRouteActive(pathname, group.path);

                return (
                  <NavLink
                    key={group.path}
                    to={group.path}
                    role="menuitem"
                    onClick={onClose}
                    className={`flex min-h-12 items-center gap-3 rounded-lg px-3 py-3 text-sm font-medium transition duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-(--primary)/35 ${
                      itemActive
                        ? "bg-(--primary)/10 text-(--primary)"
                        : "text-(--muted) hover:bg-(--hover) hover:text-(--text)"
                    }`}
                  >
                    <Icon className="h-4 w-4 shrink-0" strokeWidth={1.9} />
                    <span className="truncate">{group.name}</span>
                    <PendingBadge value={group.badge} />
                  </NavLink>
                );
              }

              return (
                <section key={group.key} className="py-1">
                  <div className="px-3 pb-1 pt-2 text-xs font-semibold uppercase tracking-wider text-(--muted)">
                    {group.name}
                  </div>
                  {group.items.map((item) => {
                    const Icon = item.icon;
                    const itemActive = isRouteActive(pathname, item.path);

                    return (
                      <NavLink
                        key={item.path}
                        to={item.path}
                        role="menuitem"
                        onClick={onClose}
                        className={`flex min-h-12 items-center gap-3 rounded-lg px-3 py-3 text-sm font-medium transition duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-(--primary)/35 ${
                          itemActive
                            ? "bg-(--primary)/10 text-(--primary)"
                            : "text-(--muted) hover:bg-(--hover) hover:text-(--text)"
                        }`}
                      >
                        <Icon className="h-4 w-4 shrink-0" strokeWidth={1.9} />
                        <span className="truncate">{item.name}</span>
                        <PendingBadge value={item.badge} />
                      </NavLink>
                    );
                  })}
                </section>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}

function SearchPanel({
  query,
  setQuery,
  open,
  setOpen,
  results,
  recentPages,
  activeIndex,
  setActiveIndex,
  onSelect,
  t,
  inputRef,
}) {
  const visibleItems = query.trim() ? results : recentPages;

  return (
    <div className="relative hidden 2xl:block">
      <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-(--muted)" />
      <input
        ref={inputRef}
        type="search"
        value={query}
        onFocus={() => setOpen(true)}
        onChange={(event) => {
          setQuery(event.target.value);
          setOpen(true);
          setActiveIndex(0);
        }}
        onKeyDown={(event) => {
          if (event.key === "ArrowDown") {
            event.preventDefault();
            setActiveIndex((index) =>
              Math.min(index + 1, Math.max(visibleItems.length - 1, 0)),
            );
          }
          if (event.key === "ArrowUp") {
            event.preventDefault();
            setActiveIndex((index) => Math.max(index - 1, 0));
          }
          if (event.key === "Enter" && visibleItems[activeIndex]) {
            event.preventDefault();
            onSelect(visibleItems[activeIndex]);
          }
          if (event.key === "Escape") {
            setOpen(false);
          }
        }}
        placeholder={t("managerNavbar.searchPlaceholder")}
        className="h-10 w-56 rounded-xl border border-(--border) bg-(--card) pl-9 pr-16 text-sm text-(--text) outline-none transition duration-200 placeholder:text-(--muted) hover:border-(--muted) focus:border-(--primary) focus:ring-2 focus:ring-(--primary)/20"
        aria-label={t("managerNavbar.searchPlaceholder")}
        aria-expanded={open}
        aria-controls="manager-search-results"
        role="combobox"
      />
      <kbd className="pointer-events-none absolute right-2 top-1/2 hidden -translate-y-1/2 rounded-md border border-(--border) bg-(--bg) px-1.5 py-0.5 text-[11px] font-medium text-(--muted) 2xl:block">
        Ctrl K
      </kbd>

      {open && (
        <>
          <button
            type="button"
            aria-label="Close search"
            className="fixed inset-0 z-40 cursor-default"
            onClick={() => setOpen(false)}
          />
          <div
            id="manager-search-results"
            className="absolute right-0 z-50 mt-3 w-[28rem] origin-top-right overflow-hidden rounded-xl border border-(--border) bg-(--card) p-2 shadow-2xl shadow-black/10 ring-1 ring-black/5 transition duration-200 dark:shadow-black/30"
          >
            <div className="flex items-center gap-2 px-2 py-2 text-xs font-semibold uppercase tracking-wider text-(--muted)">
              <Command className="h-3.5 w-3.5" />
              <span>
                {query.trim()
                  ? t("managerNavbar.matchingPages")
                  : t("managerNavbar.recentPages")}
              </span>
            </div>

            {visibleItems.length > 0 ? (
              <div role="listbox" className="space-y-1">
                {visibleItems.map((item, index) => {
                  const Icon = item.icon;

                  return (
                    <button
                      key={item.path}
                      type="button"
                      role="option"
                      aria-selected={index === activeIndex}
                      onMouseEnter={() => setActiveIndex(index)}
                      onClick={() => onSelect(item)}
                      className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm transition duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-(--primary)/35 ${
                        index === activeIndex
                          ? "bg-(--primary)/10 text-(--primary)"
                          : "text-(--muted) hover:bg-(--hover) hover:text-(--text)"
                      }`}
                    >
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-(--border) bg-(--bg)">
                        <Icon className="h-4 w-4" strokeWidth={1.9} />
                      </span>
                      <span className="min-w-0">
                        <span className="block truncate font-medium">{item.name}</span>
                        <span className="block truncate text-xs text-(--muted)">
                          {item.path}
                        </span>
                      </span>
                      <PendingBadge value={item.badge} />
                    </button>
                  );
                })}
              </div>
            ) : (
              <div className="px-3 py-6 text-center text-sm text-(--muted)">
                {t("managerNavbar.noPagesFound")}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

function ProfileDropdown({ open, onToggle, onClose, user, logout, t }) {
  const username = user?.username || "Manager";
  const role = user?.role || "manager";

  return (
    <div className="relative hidden sm:block">
      <button
        type="button"
        onClick={onToggle}
        className="flex h-11 items-center gap-3 rounded-xl border border-transparent px-2 transition duration-200 hover:border-(--border) hover:bg-(--card) focus:outline-none focus-visible:ring-2 focus-visible:ring-(--primary)/35"
        aria-haspopup="menu"
        aria-expanded={open}
      >
        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-(--primary) text-sm font-semibold text-white shadow-sm">
          {initialsFor(username)}
        </span>
        <span className="hidden min-w-0 text-left 2xl:block">
          <span className="block max-w-32 truncate text-sm font-semibold text-(--text)">
            {username}
          </span>
          <span className="block max-w-32 truncate text-xs capitalize text-(--muted)">
            {role}
          </span>
        </span>
        <ChevronDown
          className={`hidden h-3.5 w-3.5 text-(--muted) transition duration-200 2xl:block ${
            open ? "rotate-180" : ""
          }`}
        />
      </button>

      {open && (
        <>
          <button
            type="button"
            aria-label="Close profile menu"
            className="fixed inset-0 z-40 cursor-default"
            onClick={onClose}
          />
          <div
            role="menu"
            className="absolute right-0 z-50 mt-3 w-64 overflow-hidden rounded-xl border border-(--border) bg-(--card) p-1.5 shadow-2xl shadow-black/10 ring-1 ring-black/5 transition duration-200 dark:shadow-black/30"
          >
            <div className="border-b border-(--border) px-3 py-3">
              <p className="truncate text-sm font-semibold text-(--text)">{username}</p>
              <p className="truncate text-xs capitalize text-(--muted)">{role}</p>
            </div>
            <NavLink
              to="/manager/settings"
              role="menuitem"
              onClick={onClose}
              className="mt-1 flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-(--muted) transition duration-200 hover:bg-(--hover) hover:text-(--text) focus:outline-none focus-visible:ring-2 focus-visible:ring-(--primary)/35"
            >
              <User className="h-4 w-4" />
              <span>{t("managerNavbar.profile")}</span>
            </NavLink>
            <NavLink
              to="/manager/settings"
              role="menuitem"
              onClick={onClose}
              className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-(--muted) transition duration-200 hover:bg-(--hover) hover:text-(--text) focus:outline-none focus-visible:ring-2 focus-visible:ring-(--primary)/35"
            >
              <Settings className="h-4 w-4" />
              <span>{t("managerNavbar.settings")}</span>
            </NavLink>
            <button
              type="button"
              role="menuitem"
              onClick={logout}
              className="mt-1 flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-(--danger) transition duration-200 hover:bg-(--danger)/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-(--danger)/35"
            >
              <LogOut className="h-4 w-4" />
              <span>{t("auth.logout")}</span>
            </button>
          </div>
        </>
      )}
    </div>
  );
}

export default function ManagerNavbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [openDropdown, setOpenDropdown] = useState(null);
  const [profileOpen, setProfileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeSearchIndex, setActiveSearchIndex] = useState(0);
  const searchButtonRef = useRef(null);
  const searchInputRef = useRef(null);
  const location = useLocation();
  const navigate = useNavigate();
  const { t } = useLanguage();
  const { logout, user } = useAuth();
  const { pendingExpenseApprovals } = useRealtimeNotifications();
  const permissions = user?.permissions || [];
  const username = user?.username || "Manager";
  const role = user?.role || "manager";

  const navGroups = (() => {
    const canView = (requiredPermissions) =>
      !requiredPermissions || hasAnyPermission(permissions, requiredPermissions);

    const pages = {
      dashboard: {
        name: t("managerNavbar.dashboard"),
        path: "/manager/dashboard",
        icon: LayoutDashboard,
      },
      projects: {
        name: t("managerNavbar.projects"),
        path: "/manager/projects",
        icon: FolderKanban,
        permissions: [
          "projects.view",
          "projects.create",
          "projects.update",
          "projects.delete",
        ],
      },
      contracts: {
        name: t("managerNavbar.contracts"),
        path: "/manager/contracts",
        icon: FileText,
        permissions: [
          "contracts.view",
          "contracts.create",
          "contracts.update",
          "contracts.delete",
        ],
      },
      employees: {
        name: t("managerNavbar.employees"),
        path: "/manager/employees",
        icon: Users,
        permissions: [
          "employees.view",
          "employees.create",
          "employees.update",
          "employees.delete",
        ],
      },
      dailyWorkers: {
        name: t("dailyWorkers.title"),
        path: "/manager/daily-workers",
        icon: HardHat,
        permissions: [
          "daily_workers.view",
          "daily_workers.create",
          "daily_workers.update",
          "daily_workers.delete",
          "daily_worker_attendance.view",
          "daily_worker_attendance.create",
          "daily_worker_attendance.update",
          "daily_worker_payroll.view",
          "daily_worker_payroll.create",
          "daily_worker_payroll.update",
          "worker_advances.view",
        ],
      },
      subcontractors: {
        name: t("managerNavbar.subContractors"),
        path: "/manager/subcontractors",
        icon: Handshake,
        permissions: [
          "subcontractors.view",
          "subcontractors.create",
          "subcontractors.update",
          "subcontractors.delete",
        ],
      },
      expenses: {
        name: t("managerNavbar.expenses"),
        path: "/manager/expenses",
        icon: Receipt,
        permissions: [
          "expenses.view",
          "expenses.create",
          "expenses.update",
          "expenses.delete",
        ],
      },
      expenseApprovals: {
        name: "Expense Approvals",
        path: "/manager/expense-approvals",
        icon: ClipboardCheck,
        permissions: ["expenses.approve"],
        badge: pendingExpenseApprovals,
      },
      payrolls: {
        name: t("managerNavbar.payrolls"),
        path: "/manager/payrolls",
        icon: CircleDollarSign,
        permissions: [
          "payrolls.view",
          "payrolls.create",
          "payrolls.update",
          "payrolls.delete",
        ],
      },
      attendance: {
        name: t("managerNavbar.attendance"),
        path: "/manager/attendance",
        icon: CalendarCheck,
        permissions: [
          "attendance.view",
          "attendance.create",
          "attendance.update",
          "attendance.delete",
        ],
      },
      reports: {
        name: t("managerNavbar.reports"),
        path: "/manager/reports",
        icon: BarChart3,
        permissions: ["reports.view", "reports.export"],
      },
      settings: {
        name: t("managerNavbar.settings"),
        path: "/manager/settings",
        icon: Settings,
        permissions: ["settings.view", "settings.manage"],
      },
    };

    const visible = (keys) =>
      keys.map((key) => pages[key]).filter((page) => canView(page.permissions));

    return [
      { type: "link", ...pages.dashboard },
      { type: "link", ...pages.projects, hidden: !canView(pages.projects.permissions) },
      { type: "link", ...pages.contracts, hidden: !canView(pages.contracts.permissions) },
      {
        type: "group",
        key: "people",
        name: t("managerNavbar.people"),
        icon: Users,
        items: visible(["employees", "dailyWorkers", "subcontractors"]),
      },
      {
        type: "group",
        key: "finance",
        name: t("managerNavbar.finance"),
        icon: CircleDollarSign,
        items: visible(["expenses", "expenseApprovals", "payrolls"]),
      },
      {
        type: "group",
        key: "operations",
        name: t("managerNavbar.operations"),
        icon: BriefcaseBusiness,
        items: visible(["attendance"]),
      },
      { type: "link", ...pages.reports, hidden: !canView(pages.reports.permissions) },
      { type: "link", ...pages.settings, hidden: !canView(pages.settings.permissions) },
    ].filter((group) => !group.hidden && (group.type !== "group" || group.items.length));
  })();

  const allPages = navGroups.flatMap((group) =>
    group.type === "group"
      ? group.items.map((item) => ({ ...item, groupName: group.name }))
      : [group],
  );
  const primaryDesktopPaths = new Set([
    "/manager/dashboard",
    "/manager/projects",
    "/manager/contracts",
    "/manager/reports",
  ]);
  const desktopPrimaryGroups = navGroups.filter(
    (group) => group.type !== "group" && primaryDesktopPaths.has(group.path),
  );
  const desktopMoreGroups = navGroups.filter(
    (group) => group.type === "group" || !primaryDesktopPaths.has(group.path),
  );
  const recentPages = allPages.slice(0, 5);
  const searchResults = allPages.filter((item) => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return true;
    return `${item.name} ${item.groupName || ""} ${item.path}`
      .toLowerCase()
      .includes(query);
  });

  useEffect(() => {
    const handleShortcut = (event) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setSearchOpen(true);
        window.requestAnimationFrame(() => searchInputRef.current?.focus());
        searchButtonRef.current?.focus();
      }
      if (event.key === "Escape") {
        setOpenDropdown(null);
        setProfileOpen(false);
        setMobileOpen(false);
      }
    };

    window.addEventListener("keydown", handleShortcut);
    return () => window.removeEventListener("keydown", handleShortcut);
  }, []);

  const selectSearchItem = (item) => {
    navigate(item.path);
    setSearchOpen(false);
    setSearchQuery("");
    setActiveSearchIndex(0);
  };

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-(--border) bg-(--bg)/90 backdrop-blur-xl">
      <div className="mx-auto flex h-14 max-w-none items-center gap-3 px-3 sm:px-4 xl:px-6">
        <NavLink
          to="/manager/dashboard"
          className="flex min-w-0 shrink-0 items-center gap-2 rounded-xl focus:outline-none focus-visible:ring-2 focus-visible:ring-(--primary)/35"
          aria-label={t("managerNavbar.brand")}
        >
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-(--primary) text-sm font-bold text-white shadow-sm">
            M
          </span>
          <span className="hidden min-w-0 sm:block">
            <span className="block max-w-[7.5rem] truncate text-sm font-bold leading-5 text-(--text) xl:max-w-none">
              {t("managerNavbar.brand")}
            </span>
          </span>
        </NavLink>

        <div className="hidden min-w-0 flex-1 items-center justify-start gap-1 px-1 lg:flex">
          {desktopPrimaryGroups.map((group) => (
            <DesktopNavItem
              key={group.path}
              item={group}
              active={isRouteActive(location.pathname, group.path)}
              onClick={() => setOpenDropdown(null)}
            />
          ))}
          <MoreNavMenu
            groups={desktopMoreGroups}
            pathname={location.pathname}
            open={openDropdown === "more"}
            onToggle={() =>
              setOpenDropdown((current) => (current === "more" ? null : "more"))
            }
            onClose={() => setOpenDropdown(null)}
            t={t}
          />
        </div>

        <div className="ml-auto flex shrink-0 items-center gap-1">
          <SearchPanel
            query={searchQuery}
            setQuery={setSearchQuery}
            open={searchOpen}
            setOpen={setSearchOpen}
            results={searchResults}
            recentPages={recentPages}
            activeIndex={activeSearchIndex}
            setActiveIndex={setActiveSearchIndex}
            onSelect={selectSearchItem}
            t={t}
            inputRef={searchInputRef}
          />

          <button
            ref={searchButtonRef}
            type="button"
            onClick={() => setSearchOpen(true)}
            className="hidden h-10 items-center gap-2 rounded-xl border border-(--border) bg-(--card) px-3 text-sm font-medium text-(--muted) transition duration-200 hover:border-(--muted) hover:text-(--text) focus:outline-none focus-visible:ring-2 focus-visible:ring-(--primary)/35 lg:flex 2xl:hidden"
            aria-label={t("managerNavbar.searchPlaceholder")}
          >
            <Search className="h-4 w-4" />
            <kbd className="rounded-md border border-(--border) bg-(--bg) px-1.5 py-0.5 text-[11px]">
              Ctrl K
            </kbd>
          </button>

          <div className="hidden xl:block">
            <LanguageSwitcher />
          </div>
          <div className="hidden xl:block">
            <ThemeToggle />
          </div>

          <NotificationBell />

          <ProfileDropdown
            open={profileOpen}
            onToggle={() => setProfileOpen((open) => !open)}
            onClose={() => setProfileOpen(false)}
            user={user}
            logout={logout}
            t={t}
          />

          <IconButton
            label={mobileOpen ? t("managerNavbar.closeMenu") : t("managerNavbar.openMenu")}
            onClick={() => setMobileOpen((open) => !open)}
            className="lg:hidden"
            aria-expanded={mobileOpen}
            aria-controls="manager-mobile-drawer"
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </IconButton>
        </div>
      </div>

      {searchOpen && (
        <div className="2xl:hidden">
          <button
            type="button"
            aria-label="Close search"
            className="fixed inset-0 z-[60] cursor-default bg-black/10 backdrop-blur-[1px]"
            onClick={() => setSearchOpen(false)}
          />
          <div className="fixed left-3 right-3 top-16 z-[70] rounded-xl border border-(--border) bg-(--card) p-2 shadow-2xl sm:left-auto sm:w-[28rem]">
            <div className="relative mb-2">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-(--muted)" />
              <input
                autoFocus
                type="search"
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder={t("managerNavbar.searchPlaceholder")}
                className="h-11 w-full rounded-lg border border-(--border) bg-(--bg) pl-9 pr-3 text-sm text-(--text) outline-none focus:border-(--primary) focus:ring-2 focus:ring-(--primary)/20"
              />
            </div>
            {(searchQuery.trim() ? searchResults : recentPages).map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.path}
                  type="button"
                  onClick={() => selectSearchItem(item)}
                  className="flex w-full items-center gap-3 rounded-lg px-3 py-3 text-left text-sm font-medium text-(--muted) transition duration-200 hover:bg-(--hover) hover:text-(--text)"
                >
                  <Icon className="h-4 w-4" />
                  <span>{item.name}</span>
                  <PendingBadge value={item.badge} />
                </button>
              );
            })}
          </div>
        </div>
      )}

      <aside
        id="manager-mobile-drawer"
        className={`fixed inset-0 z-[100] flex h-dvh flex-col bg-(--bg) transition duration-[250ms] lg:hidden ${
          mobileOpen
            ? "pointer-events-auto translate-x-0 opacity-100"
            : "pointer-events-none translate-x-full opacity-0 rtl:-translate-x-full"
        }`}
        style={{ backgroundColor: "var(--bg)" }}
        aria-hidden={!mobileOpen}
      >
        <div className="flex shrink-0 items-center justify-between border-b border-(--border) px-4 py-3">
          <div className="flex min-w-0 items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-full bg-(--primary) text-base font-semibold text-white">
              {initialsFor(username)}
            </span>
            <span className="min-w-0">
              <span className="block truncate text-sm font-semibold text-(--text)">
                {username}
              </span>
              <span className="block truncate text-xs capitalize text-(--muted)">
                {role}
              </span>
            </span>
          </div>
          <IconButton
            label={t("managerNavbar.closeMenu")}
            onClick={() => setMobileOpen(false)}
          >
            <X className="h-5 w-5" />
          </IconButton>
        </div>

        <div className="shrink-0 border-b border-(--border) px-4 py-3">
          <button
            type="button"
            onClick={() => setSearchOpen(true)}
            className="flex h-12 w-full items-center justify-between rounded-xl border border-(--border) bg-(--card) px-4 text-sm text-(--muted)"
          >
            <span className="flex items-center gap-3">
              <Search className="h-4 w-4" />
              <span>{t("managerNavbar.searchPlaceholder")}</span>
            </span>
            <kbd className="rounded-md border border-(--border) bg-(--bg) px-1.5 py-0.5 text-[11px]">
              Ctrl K
            </kbd>
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4">
          <div className="space-y-4">
            {navGroups.map((group) => {
              if (group.type !== "group") {
                const Icon = group.icon;
                const active = isRouteActive(location.pathname, group.path);
                return (
                  <NavLink
                    key={group.path}
                    to={group.path}
                    onClick={() => setMobileOpen(false)}
                    className={`flex min-h-14 items-center gap-3 rounded-xl px-4 text-base font-semibold transition duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-(--primary)/35 ${
                      active
                        ? "bg-(--primary)/10 text-(--primary)"
                        : "text-(--text) hover:bg-(--hover)"
                    }`}
                  >
                    <Icon className="h-5 w-5" />
                    <span>{group.name}</span>
                    <PendingBadge value={group.badge} />
                  </NavLink>
                );
              }

              return (
                <section key={group.key} aria-labelledby={`mobile-${group.key}`}>
                  <h2
                    id={`mobile-${group.key}`}
                    className="mb-2 px-1 text-xs font-semibold uppercase tracking-wider text-(--muted)"
                  >
                    {group.name}
                  </h2>
                  <div className="space-y-1">
                    {group.items.map((item) => {
                      const Icon = item.icon;
                      const active = isRouteActive(location.pathname, item.path);
                      return (
                        <NavLink
                          key={item.path}
                          to={item.path}
                          onClick={() => setMobileOpen(false)}
                          className={`flex min-h-14 items-center gap-3 rounded-xl px-4 text-base font-medium transition duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-(--primary)/35 ${
                            active
                              ? "bg-(--primary)/10 text-(--primary)"
                              : "text-(--muted) hover:bg-(--hover) hover:text-(--text)"
                          }`}
                        >
                          <Icon className="h-5 w-5" />
                          <span>{item.name}</span>
                          <PendingBadge value={item.badge} />
                        </NavLink>
                      );
                    })}
                  </div>
                </section>
              );
            })}
          </div>

          <div className="mt-5 grid gap-3 border-t border-(--border) pt-4">
            <LanguageSwitcher />
            <ThemeToggle />
          </div>
        </div>

        <div className="shrink-0 border-t border-(--border) bg-(--bg) p-4">
          <button
            type="button"
            onClick={logout}
            className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-(--danger) px-4 text-sm font-semibold text-white transition duration-200 hover:scale-[0.99] focus:outline-none focus-visible:ring-2 focus-visible:ring-(--danger)/35"
          >
            <LogOut className="h-4 w-4" />
            <span>{t("auth.logout")}</span>
          </button>
        </div>
      </aside>
    </nav>
  );
}

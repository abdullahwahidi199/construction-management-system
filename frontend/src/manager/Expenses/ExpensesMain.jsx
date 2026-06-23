// ExpensesMain.jsx
import { useState, useEffect } from "react";
import {
  Wallet,
  Plus,
  RefreshCw,
  Search,
  Filter,
  Download,
  Loader2,
  TrendingUp,
  TrendingDown,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  X,
  ArrowUpDown,
  Calendar,
  ListFilter,
  ChevronDown,
} from "lucide-react";
import useFetch from "../../hooks/useFetch";
import usePost from "../../hooks/usePost";
import useDelete from "../../hooks/useDelete";
import ExpenseList from "./ExpenseList";
import instance from "../../api/axiosInstance";
import { use } from "react";
import ExpenseCreateModal from "./ExpenseCreateModal";

export default function ExpensesMain({ dataEntryMode = false }) {
  const [page, setPage] = useState(1);

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [filterProject, setFilterProject] = useState("");
  const [filterType, setFilterType] = useState("");
  const [filterDateFrom, setFilterDateFrom] = useState("");
  const [filterDateTo, setFilterDateTo] = useState("");
  const [sortBy, setSortBy] = useState("-expense_date"); // Default: newest first
  const [showFilters, setShowFilters] = useState(false);

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
      setPage(1); // Reset to page 1 on new search
    }, 400);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Build query params
  const buildQueryParams = () => {
    const params = new URLSearchParams();
    params.append("page", page);

    if (debouncedSearch) {
      params.append("search", debouncedSearch);
    }
    if (filterProject) {
      params.append("project", filterProject);
    }
    if (filterType) {
      params.append("expense_type", filterType);
    }
    if (filterDateFrom) {
      params.append("expense_date__gte", filterDateFrom);
    }
    if (filterDateTo) {
      params.append("expense_date__lte", filterDateTo);
    }
    if (sortBy) {
      params.append("ordering", sortBy);
    }

    return params.toString();
  };

  const queryString = buildQueryParams();
  const endpoint = `expenses/?${queryString}`;

  const { data: expenses, loading: fetching, refetch } = useFetch(endpoint);
  const { postData, loading: posting, error } = usePost();
  const { deleteData } = useDelete();

  const [open, setOpen] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Fetch projects for filter dropdown
  // const { data: projectsData } = useFetch("projects/");
  const { data: projects } = useFetch("projects/");

  const createExpense = async (formData) => {
    try {
      await postData("expenses/", formData);
      setOpen(false);
      refetch();
    } catch (err) {
      console.log(err);
    }
  };

  const handleExpenseDelete = async (id) => {
    try {
      await deleteData(`expenses/${id}/`);
      refetch();
    } catch (err) {
      console.log(err);
    }
  };

  const handleExpenseUpdate = async (id, updatedData) => {
    try {
      await instance.put(`expenses/${id}/`, updatedData);
      refetch();
    } catch (err) {
      console.log(err);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setTimeout(() => setRefreshing(false), 600);
  };

  // Clear all filters
  const clearAllFilters = () => {
    setSearchQuery("");
    setDebouncedSearch("");
    setFilterProject("");
    setFilterType("");
    setFilterDateFrom("");
    setFilterDateTo("");
    setSortBy("-expense_date");
    setPage(1);
  };

  // Count active filters
  const activeFilterCount = [
    debouncedSearch,
    filterProject,
    filterType,
    filterDateFrom,
    filterDateTo,
    sortBy !== "-expense_date",
  ].filter(Boolean).length;

  /* ── Data Processing ──────────────────────────── */
  const expenseList = expenses?.results || [];
  const count = expenses?.count || 0;
  const nextUrl = expenses?.next;
  const previousUrl = expenses?.previous;

  const ITEMS_PER_PAGE = 25;
  const totalPages = Math.ceil(count / ITEMS_PER_PAGE) || 1;
  const startIndex = (page - 1) * ITEMS_PER_PAGE + 1;
  const endIndex = Math.min(page * ITEMS_PER_PAGE, count);

  const goToPage = (pageNum) => {
    if (pageNum >= 1 && pageNum <= totalPages) {
      setPage(pageNum);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const goToNextPage = () => {
    if (nextUrl) {
      setPage((p) => p + 1);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const goToPrevPage = () => {
    if (previousUrl) {
      setPage((p) => Math.max(1, p - 1));
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const totalExpenses = expenseList.reduce(
    (sum, exp) => sum + parseFloat(exp.total_usd || 0),
    0,
  );

  const thisMonthExpenses = expenseList
    .filter((exp) => {
      const expDate = new Date(exp.expense_date);
      const now = new Date();
      return (
        expDate.getMonth() === now.getMonth() &&
        expDate.getFullYear() === now.getFullYear()
      );
    })
    .reduce((sum, exp) => sum + parseFloat(exp.total_usd || 0), 0);

  const stats = [
    {
      label: "Total Spending",
      value: `$${totalExpenses.toFixed(2)}`,
      color: "bg-[var(--primary)]/10 text-[var(--primary)]",
      dotColor: "bg-[var(--primary)]",
      icon: Wallet,
    },
    {
      label: "This Month",
      value: `$${thisMonthExpenses.toFixed(2)}`,
      color: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
      dotColor: "bg-emerald-500",
      icon: TrendingDown,
    },
    {
      label: "Total Entries",
      value: count,
      color: "bg-violet-500/10 text-violet-600 dark:text-violet-400",
      dotColor: "bg-violet-500",
      icon: TrendingUp,
    },
    {
      label: "Average",
      value: `$${(totalExpenses / (expenseList.length || 1)).toFixed(2)}`,
      color: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
      dotColor: "bg-blue-500",
      icon: Wallet,
    },
  ];

  const getPageNumbers = () => {
    const pages = [];
    const maxVisible = 5;
    let start = Math.max(1, page - Math.floor(maxVisible / 2));
    let end = Math.min(totalPages, start + maxVisible - 1);

    if (end - start + 1 < maxVisible) {
      start = Math.max(1, end - maxVisible + 1);
    }

    for (let i = start; i <= end; i++) {
      pages.push(i);
    }
    return pages;
  };

  const sortOptions = [
    { value: "-expense_date", label: "Date (Newest)" },
    { value: "expense_date", label: "Date (Oldest)" },

    { value: "-serial_number", label: "Serial # (High to Low)" },
    { value: "serial_number", label: "Serial # (Low to High)" },

    { value: "-total_usd_calc", label: "Amount (High to Low)" },
    { value: "total_usd_calc", label: "Amount (Low to High)" },
  ];

  const expenseTypes = [
    { value: "general", label: "General Expense" },
    { value: "material", label: "Construction Material" },
    { value: "staff_salary", label: "Staff Salary" },
    { value: "daily_wage", label: "Daily Worker Wage" },
    {
      value: "contract_payment",
      label: "Contract/Subcontractor Payment",
    },
    {
      value: "equipment",
      label: "Equipment Rental/Purchase",
    },
    {
      value: "utility",
      label: "Utility Bill",
    },
    { value: "other", label: "Other" },
  ];

  return (
    <div className="space-y-6">
      {/* ── Page Header ──────────────────────────── */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[var(--primary)]/10 shadow-sm">
            <Wallet
              className="h-6 w-6 text-[var(--primary)]"
              strokeWidth={1.8}
            />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-[var(--text)]">
              Expenses
            </h1>
            <p className="text-sm text-[var(--muted)]">
              Track and manage your spending
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-[var(--border)] bg-[var(--card)] text-[var(--muted)] shadow-sm transition-all hover:bg-[var(--hover)] hover:text-[var(--text)] disabled:opacity-50"
            title="Refresh"
          >
            <RefreshCw
              className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`}
              strokeWidth={2}
            />
          </button>

          <button
            onClick={() => setOpen(true)}
            className="inline-flex items-center gap-2 rounded-xl bg-[var(--primary)] px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-[var(--primary)]/25 transition-all hover:opacity-90 active:scale-[0.98]"
          >
            <Plus className="h-4 w-4" strokeWidth={2.5} />
            New Expense
          </button>
        </div>
      </div>

      {/* ── Search & Filter Bar ──────────────────── */}
      <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-4 shadow-sm">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search
              className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--muted)]"
              strokeWidth={2}
            />
            <input
              type="text"
              placeholder="Search by Serial #, description, remarks, or paid to..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-10 w-full rounded-xl border border-[var(--border)] bg-[var(--bg)] pl-10 pr-4 text-sm text-[var(--text)] placeholder-[var(--muted)] transition-all focus:border-[var(--primary)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/20"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--muted)] hover:text-[var(--text)]"
              >
                <X className="h-4 w-4" strokeWidth={2} />
              </button>
            )}
          </div>

          {/* Filter Toggle Button */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`inline-flex h-10 items-center gap-2 rounded-xl px-4 text-sm font-medium transition-all ${
              showFilters || activeFilterCount > 0
                ? "bg-[var(--primary)] text-white"
                : "border border-[var(--border)] bg-[var(--bg)] text-[var(--muted)] hover:bg-[var(--hover)] hover:text-[var(--text)]"
            }`}
          >
            <ListFilter className="h-4 w-4" strokeWidth={2} />
            Filters
            {activeFilterCount > 0 && (
              <span className="flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-white/20 px-1.5 text-xs">
                {activeFilterCount}
              </span>
            )}
          </button>

          {/* Sort Dropdown */}
          <div className="relative">
            <ArrowUpDown
              className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--muted)]"
              strokeWidth={2}
            />
            <select
              value={sortBy}
              onChange={(e) => {
                setSortBy(e.target.value);
                setPage(1);
              }}
              className="h-10 appearance-none rounded-xl border border-[var(--border)] bg-[var(--bg)] pl-10 pr-10 text-sm text-[var(--text)] transition-all focus:border-[var(--primary)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/20 cursor-pointer"
            >
              {sortOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
            <ChevronDown
              className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--muted)] pointer-events-none"
              strokeWidth={2}
            />
          </div>
        </div>

        {/* Expanded Filters */}
        {showFilters && (
          <div className="mt-4 grid grid-cols-1 gap-3 border-t border-[var(--border)] pt-4 sm:grid-cols-2 lg:grid-cols-4">
            {/* Project Filter */}
            <div>
              <label className="mb-1.5 block text-xs font-medium text-[var(--muted)]">
                Project
              </label>
              <select
                value={filterProject}
                onChange={(e) => {
                  setFilterProject(e.target.value);
                  setPage(1);
                }}
                className="h-10 w-full appearance-none rounded-xl border border-[var(--border)] bg-[var(--bg)] px-3 text-sm text-[var(--text)] transition-all focus:border-[var(--primary)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/20 cursor-pointer"
              >
                <option value="">All Projects</option>
                {projects.map((project) => (
                  <option key={project.id} value={project.id}>
                    {project.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Expense Type Filter */}
            <div>
              <label className="mb-1.5 block text-xs font-medium text-[var(--muted)]">
                Expense Type
              </label>
              <select
                value={filterType}
                onChange={(e) => {
                  setFilterType(e.target.value);
                  setPage(1);
                }}
                className="h-10 w-full appearance-none rounded-xl border border-[var(--border)] bg-[var(--bg)] px-3 text-sm text-[var(--text)] transition-all focus:border-[var(--primary)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/20 cursor-pointer"
              >
                <option value="">All Types</option>
                {expenseTypes.map((type) => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Date From */}
            <div>
              <label className="mb-1.5 block text-xs font-medium text-[var(--muted)]">
                From Date
              </label>
              <div className="relative">
                <Calendar
                  className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--muted)]"
                  strokeWidth={2}
                />
                <input
                  type="date"
                  value={filterDateFrom}
                  onChange={(e) => {
                    setFilterDateFrom(e.target.value);
                    setPage(1);
                  }}
                  className="h-10 w-full rounded-xl border border-[var(--border)] bg-[var(--bg)] pl-10 pr-3 text-sm text-[var(--text)] transition-all focus:border-[var(--primary)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/20"
                />
              </div>
            </div>

            {/* Date To */}
            <div>
              <label className="mb-1.5 block text-xs font-medium text-[var(--muted)]">
                To Date
              </label>
              <div className="relative">
                <Calendar
                  className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--muted)]"
                  strokeWidth={2}
                />
                <input
                  type="date"
                  value={filterDateTo}
                  onChange={(e) => {
                    setFilterDateTo(e.target.value);
                    setPage(1);
                  }}
                  className="h-10 w-full rounded-xl border border-[var(--border)] bg-[var(--bg)] pl-10 pr-3 text-sm text-[var(--text)] transition-all focus:border-[var(--primary)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/20"
                />
              </div>
            </div>

            {/* Clear Filters Button */}
            {activeFilterCount > 0 && (
              <div className="flex items-end sm:col-span-2 lg:col-span-4">
                <button
                  onClick={clearAllFilters}
                  className="inline-flex h-10 items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 text-sm font-medium text-red-600 transition-all hover:bg-red-100 dark:border-red-800 dark:bg-red-900/20 dark:text-red-400 dark:hover:bg-red-900/30"
                >
                  <X className="h-4 w-4" strokeWidth={2} />
                  Clear All Filters
                </button>
              </div>
            )}
          </div>
        )}

        {/* Active Filters Summary */}
        {activeFilterCount > 0 && !showFilters && (
          <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-[var(--border)] pt-3">
            <span className="text-xs text-[var(--muted)]">Active filters:</span>
            {debouncedSearch && (
              <span className="inline-flex items-center gap-1 rounded-lg bg-[var(--primary)]/10 px-2.5 py-1 text-xs font-medium text-[var(--primary)]">
                Search: "{debouncedSearch}"
                <button
                  onClick={() => setSearchQuery("")}
                  className="ml-1 hover:text-[var(--primary)]/70"
                >
                  <X className="h-3 w-3" strokeWidth={2.5} />
                </button>
              </span>
            )}
            {filterProject && (
              <span className="inline-flex items-center gap-1 rounded-lg bg-[var(--primary)]/10 px-2.5 py-1 text-xs font-medium text-[var(--primary)]">
                Project:{" "}
                {projects.find((p) => p.id === parseInt(filterProject))?.name ||
                  filterProject}
                <button
                  onClick={() => setFilterProject("")}
                  className="ml-1 hover:text-[var(--primary)]/70"
                >
                  <X className="h-3 w-3" strokeWidth={2.5} />
                </button>
              </span>
            )}
            {filterType && (
              <span className="inline-flex items-center gap-1 rounded-lg bg-[var(--primary)]/10 px-2.5 py-1 text-xs font-medium text-[var(--primary)]">
                Type:{" "}
                {expenseTypes.find((t) => t.value === filterType)?.label ||
                  filterType}
                <button
                  onClick={() => setFilterType("")}
                  className="ml-1 hover:text-[var(--primary)]/70"
                >
                  <X className="h-3 w-3" strokeWidth={2.5} />
                </button>
              </span>
            )}
            {(filterDateFrom || filterDateTo) && (
              <span className="inline-flex items-center gap-1 rounded-lg bg-[var(--primary)]/10 px-2.5 py-1 text-xs font-medium text-[var(--primary)]">
                Date: {filterDateFrom || "..."} - {filterDateTo || "..."}
                <button
                  onClick={() => {
                    setFilterDateFrom("");
                    setFilterDateTo("");
                  }}
                  className="ml-1 hover:text-[var(--primary)]/70"
                >
                  <X className="h-3 w-3" strokeWidth={2.5} />
                </button>
              </span>
            )}
            {sortBy !== "-expense_date" && (
              <span className="inline-flex items-center gap-1 rounded-lg bg-[var(--primary)]/10 px-2.5 py-1 text-xs font-medium text-[var(--primary)]">
                Sort:{" "}
                {sortOptions.find((o) => o.value === sortBy)?.label || sortBy}
                <button
                  onClick={() => setSortBy("-expense_date")}
                  className="ml-1 hover:text-[var(--primary)]/70"
                >
                  <X className="h-3 w-3" strokeWidth={2.5} />
                </button>
              </span>
            )}
          </div>
        )}
      </div>

      {/* ── Pagination Info Bar ──────────────────── */}
      {count > 0 && (
        <div className="flex flex-col gap-3 rounded-xl border border-[var(--border)] bg-[var(--card)] px-4 py-3 shadow-sm sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-[var(--muted)]">
            {debouncedSearch ? (
              <>
                Found{" "}
                <span className="font-semibold text-[var(--text)]">
                  {count}
                </span>{" "}
                results for "{debouncedSearch}"
              </>
            ) : (
              <>
                Showing{" "}
                <span className="font-semibold text-[var(--text)]">
                  {startIndex}–{endIndex}
                </span>{" "}
                of{" "}
                <span className="font-semibold text-[var(--text)]">
                  {count}
                </span>{" "}
                expenses
              </>
            )}
          </p>

          {/* Pagination Controls */}
          <div className="flex items-center gap-1">
            <button
              onClick={() => goToPage(1)}
              disabled={page === 1 || fetching}
              className="flex h-8 w-8 items-center justify-center rounded-lg text-[var(--muted)] transition-colors hover:bg-[var(--hover)] hover:text-[var(--text)] disabled:opacity-40 disabled:cursor-not-allowed"
              title="First page"
            >
              <ChevronsLeft className="h-4 w-4" strokeWidth={2} />
            </button>

            <button
              onClick={goToPrevPage}
              disabled={!previousUrl || fetching}
              className="flex h-8 w-8 items-center justify-center rounded-lg text-[var(--muted)] transition-colors hover:bg-[var(--hover)] hover:text-[var(--text)] disabled:opacity-40 disabled:cursor-not-allowed"
              title="Previous page"
            >
              <ChevronLeft className="h-4 w-4" strokeWidth={2} />
            </button>

            <div className="flex items-center gap-1 px-1">
              {getPageNumbers().map((pageNum) => (
                <button
                  key={pageNum}
                  onClick={() => goToPage(pageNum)}
                  disabled={fetching}
                  className={`flex h-8 min-w-[2rem] items-center justify-center rounded-lg px-2 text-sm font-medium transition-all ${
                    pageNum === page
                      ? "bg-[var(--primary)] text-white shadow-sm"
                      : "text-[var(--muted)] hover:bg-[var(--hover)] hover:text-[var(--text)]"
                  } disabled:opacity-40`}
                >
                  {pageNum}
                </button>
              ))}
            </div>

            <button
              onClick={goToNextPage}
              disabled={!nextUrl || fetching}
              className="flex h-8 w-8 items-center justify-center rounded-lg text-[var(--muted)] transition-colors hover:bg-[var(--hover)] hover:text-[var(--text)] disabled:opacity-40 disabled:cursor-not-allowed"
              title="Next page"
            >
              <ChevronRight className="h-4 w-4" strokeWidth={2} />
            </button>

            <button
              onClick={() => goToPage(totalPages)}
              disabled={page === totalPages || fetching}
              className="flex h-8 w-8 items-center justify-center rounded-lg text-[var(--muted)] transition-colors hover:bg-[var(--hover)] hover:text-[var(--text)] disabled:opacity-40 disabled:cursor-not-allowed"
              title="Last page"
            >
              <ChevronsRight className="h-4 w-4" strokeWidth={2} />
            </button>
          </div>
        </div>
      )}

      {/* ── Loading State ────────────────────────── */}
      {fetching && !expenseList.length ? (
        <div className="flex items-center justify-center rounded-xl border border-[var(--border)] bg-[var(--card)] py-20 shadow-sm">
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="h-8 w-8 animate-spin text-[var(--primary)]" />
            <p className="text-sm text-[var(--muted)]">Loading expenses…</p>
          </div>
        </div>
      ) : (
        /* ── Expenses List ────────────────────────── */
        <ExpenseList
          expenses={expenseList}
          onDelete={dataEntryMode ? undefined : handleExpenseDelete}
          onUpdate={handleExpenseUpdate}
          onRefresh={handleRefresh}
          canDelete={!dataEntryMode}
        />
      )}

      {/* ── Empty State ──── */}
      {!fetching && expenseList.length === 0 && (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-[var(--border)] bg-[var(--card)] py-20 text-center">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-[var(--primary)]/10">
            <Wallet
              className="h-8 w-8 text-[var(--primary)]"
              strokeWidth={1.5}
            />
          </div>
          <h3 className="mb-1 text-lg font-semibold text-[var(--text)]">
            {activeFilterCount > 0 ? "No matching expenses" : "No expenses yet"}
          </h3>
          <p className="mb-5 max-w-sm text-sm text-[var(--muted)]">
            {activeFilterCount > 0
              ? "Try adjusting your search or filter criteria to find what you're looking for."
              : "Start tracking your expenses to see spending patterns, budgets, and financial insights all in one place."}
          </p>
          {activeFilterCount > 0 ? (
            <button
              onClick={clearAllFilters}
              className="inline-flex items-center gap-2 rounded-xl bg-[var(--primary)] px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-[var(--primary)]/25 transition-all hover:opacity-90"
            >
              <X className="h-4 w-4" strokeWidth={2.5} />
              Clear Filters
            </button>
          ) : (
            <button
              onClick={() => setOpen(true)}
              className="inline-flex items-center gap-2 rounded-xl bg-[var(--primary)] px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-[var(--primary)]/25 transition-all hover:opacity-90"
            >
              <Plus className="h-4 w-4" strokeWidth={2.5} />
              Add First Expense
            </button>
          )}
        </div>
      )}

      <ExpenseCreateModal
        isOpen={open}
        onClose={() => setOpen(false)}
        onCreate={createExpense}
        projects={projects || []}
      />
    </div>
  );
}

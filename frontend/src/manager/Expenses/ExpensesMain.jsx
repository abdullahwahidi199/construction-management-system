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
  DollarSign,
  Coins,
} from "lucide-react";
import useFetch from "../../hooks/useFetch";
import usePost from "../../hooks/usePost";
import useDelete from "../../hooks/useDelete";
import ExpenseList from "./ExpenseList";
import instance from "../../api/axiosInstance";
import ExpenseCreateModal from "./ExpenseCreateModal";
import { useLanguage } from "../../hooks/useLanguage";
import useRealtimeEvents from "../../hooks/useRealtimeEvents";
import Button from "../../components/ui/Button";
import toast from "react-hot-toast";
import CalendarDatePicker from "../../components/common/CalendarDatePicker";
import { useCalendar } from "../../hooks/useCalendar";

const RTL_LANGS = ["dr", "ps", "fa", "dar", "prs"];

export default function ExpensesMain({ dataEntryMode = false }) {
  const { t, lang } = useLanguage();
  const { formatDate } = useCalendar("expenses");
  const isRTL = RTL_LANGS.includes(lang);
  const [page, setPage] = useState(1);

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [filterProject, setFilterProject] = useState("");
  const [filterScope, setFilterScope] = useState("");
  const [filterType, setFilterType] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [filterDateFrom, setFilterDateFrom] = useState("");
  const [filterDateTo, setFilterDateTo] = useState("");
  const [sortBy, setSortBy] = useState("-expense_date");
  const [showFilters, setShowFilters] = useState(false);

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
      setPage(1);
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
    if (filterScope) {
      params.append("expense_scope", filterScope);
    }
    if (filterType) {
      params.append("expense_type", filterType);
    }
    if (filterStatus) {
      params.append("status", filterStatus);
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

  const { data: projects } = useFetch("projects/", {
    skipGlobalErrorToast: true,
  });

  const createExpense = async (formData) => {
    try {
      await postData("expenses/", formData);
      setOpen(false);
      refetch();
      toast.success("Expense submitted successfully.");
    } catch (err) {
      // Central axios handling shows the user-facing error.
    }
  };

  const handleExpenseDelete = async (id) => {
    try {
      await deleteData(`expenses/${id}/`);
      refetch();
      toast.success("Expense deleted.");
    } catch (err) {
      // Central axios handling shows the user-facing error.
    }
  };

  const handleExpenseUpdate = async (id, updatedData) => {
    try {
      await instance.put(`expenses/${id}/`, updatedData);
      refetch();
      toast.success("Expense updated.");
    } catch (err) {
      // Central axios handling shows the user-facing error.
    }
  };

  const handleExportPdf = async () => {
    if (filterStatus && filterStatus !== "approved") {
      toast.error("Only approved expenses can be exported.");
      return;
    }

    try {
      const response = await instance.get(
        `/expenses/export-pdf/?${queryString}`,
        {
          responseType: "blob",
        },
      );

      const url = window.URL.createObjectURL(
        new Blob([response.data], { type: "application/pdf" }),
      );

      const link = document.createElement("a");
      link.href = url;
      link.download = `expenses-${new Date().toISOString().slice(0, 10)}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      toast.success("Expense report exported.");
    } catch (error) {
      // Central axios handling shows the user-facing error.
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setTimeout(() => setRefreshing(false), 600);
  };

  const clearAllFilters = () => {
    setSearchQuery("");
    setDebouncedSearch("");
    setFilterProject("");
    setFilterScope("");
    setFilterType("");
    setFilterStatus("");
    setFilterDateFrom("");
    setFilterDateTo("");
    setSortBy("-expense_date");
    setPage(1);
  };

  const activeFilterCount = [
    debouncedSearch,
    filterProject,
    filterScope,
    filterType,
    filterStatus,
    filterDateFrom,
    filterDateTo,
    sortBy !== "-expense_date",
  ].filter(Boolean).length;

  const expenseList = expenses?.results?.results || [];
  const count = expenses?.count || 0;
  const nextUrl = expenses?.next;
  const previousUrl = expenses?.previous;

  const backendTotals = expenses?.results?.totals || { usd: 0, afn: 0 };
  const totals = {
    usd: Number(backendTotals.usd) || 0,
    afn: Number(backendTotals.afn) || 0,
  };

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

  const formatCurrency = (amount, currency = "USD") => {
    const formatted = new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
    return formatted;
  };

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
    { value: "-expense_date", label: t("ExpensesMain.sortOptions.dateNewest") },
    { value: "expense_date", label: t("ExpensesMain.sortOptions.dateOldest") },
    {
      value: "-serial_number",
      label: t("ExpensesMain.sortOptions.serialHighLow"),
    },
    {
      value: "serial_number",
      label: t("ExpensesMain.sortOptions.serialLowHigh"),
    },
    {
      value: "-total_usd_calc",
      label: t("ExpensesMain.sortOptions.amountHighLow"),
    },
    {
      value: "total_usd_calc",
      label: t("ExpensesMain.sortOptions.amountLowHigh"),
    },
  ];

  const expenseTypes = [
    { value: "general", label: t("ExpensesMain.types.general") },
    { value: "construction", label: t("ExpensesMain.types.construction") },
    { value: "material", label: t("ExpensesMain.types.material") },
    { value: "staff_salary", label: t("ExpensesMain.types.staffSalary") },
    { value: "daily_wage", label: t("ExpensesMain.types.dailyWage") },
    {
      value: "contract_payment",
      label: t("ExpensesMain.types.contractPayment"),
    },
    { value: "equipment", label: t("ExpensesMain.types.equipment") },
    { value: "utility", label: t("ExpensesMain.types.utility") },
    { value: "other", label: t("ExpensesMain.types.other") },
  ];

  const officeExpenseTypes = [
    { value: "office_rent", label: t("ExpensesMain.types.officeRent") },
    { value: "utilities", label: t("ExpensesMain.types.utilities") },
    { value: "internet", label: t("ExpensesMain.types.internet") },
    { value: "office_supplies", label: t("ExpensesMain.types.officeSupplies") },
    { value: "staff_meals", label: t("ExpensesMain.types.staffMeals") },
    { value: "transportation", label: t("ExpensesMain.types.transportation") },
    { value: "fuel", label: t("ExpensesMain.types.fuel") },
    { value: "cleaning", label: t("ExpensesMain.types.cleaning") },
    { value: "maintenance", label: t("ExpensesMain.types.maintenance") },
    { value: "equipment", label: t("ExpensesMain.types.equipment") },
    {
      value: "software_subscriptions",
      label: t("ExpensesMain.types.softwareSubscriptions"),
    },
    { value: "salaries", label: t("ExpensesMain.types.salaries") },
    { value: "miscellaneous", label: t("ExpensesMain.types.miscellaneous") },
  ];

  const visibleExpenseTypes =
    filterScope === "office" ? officeExpenseTypes : expenseTypes;

  const averageUSD = count > 0 ? totals.usd / count : 0;
  const exportBlocked = filterStatus && filterStatus !== "approved";

  useRealtimeEvents((message) => {
    if (message.event?.startsWith("expense.")) {
      refetch();
    }
  });

  // RTL-aware pagination icons
  const FirstPageIcon = isRTL ? ChevronsRight : ChevronsLeft;
  const PrevPageIcon = isRTL ? ChevronRight : ChevronLeft;
  const NextPageIcon = isRTL ? ChevronLeft : ChevronRight;
  const LastPageIcon = isRTL ? ChevronsLeft : ChevronsRight;

  return (
    <div dir={isRTL ? "rtl" : "ltr"} className="space-y-6">
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
              {t("ExpensesMain.title")}
            </h1>
            <p className="text-sm text-[var(--muted)]">
              {t("ExpensesMain.subtitle")}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-[var(--border)] bg-[var(--card)] text-[var(--muted)] shadow-sm transition-all hover:bg-[var(--hover)] hover:text-[var(--text)] disabled:opacity-50"
            title={t("ExpensesMain.refresh")}
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
            {t("ExpensesMain.newExpense")}
          </button>
          <Button
            variant="secondary"
            onClick={handleExportPdf}
            disabled={exportBlocked}
            title={exportBlocked ? "Only approved expenses can be exported." : ""}
            leftIcon={<Download className="h-4 w-4" />}
          >
            {t("ProjectDetails.downloadPdf")}
          </Button>
        </div>
      </div>

      {/* ── Financial Summary Cards ────────────────────────────── */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Total Spending (USD) */}
        <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[var(--primary)]/10">
              <DollarSign
                className="h-6 w-6 text-[var(--primary)]"
                strokeWidth={2}
              />
            </div>
            <div className="flex items-center gap-1">
              <span className="text-xs font-medium text-[var(--muted)]">
                {t("ExpensesMain.currencies.usd")}
              </span>
              <ChevronDown
                className="h-4 w-4 text-[var(--muted)]"
                strokeWidth={2}
              />
            </div>
          </div>
          <div className="mt-4">
            <p className="text-sm font-medium text-[var(--muted)]">
              {t("ExpensesMain.cards.totalSpendingUsd")}
            </p>
            <p className="text-2xl font-bold text-[var(--text)]">
              {formatCurrency(totals.usd, "USD")}
            </p>
          </div>
          <div className="mt-3 flex items-center gap-2">
            <div className="h-1.5 w-full rounded-full bg-[var(--primary)]/10">
              <div
                className="h-full rounded-full bg-[var(--primary)]"
                style={{ width: "100%" }}
              ></div>
            </div>
          </div>
        </div>

        {/* Total Spending (AFN) */}
        <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-500/10">
              <Coins className="h-6 w-6 text-emerald-500" strokeWidth={2} />
            </div>
            <div className="flex items-center gap-1">
              <span className="text-xs font-medium text-[var(--muted)]">
                {t("ExpensesMain.currencies.afn")}
              </span>
              <ChevronDown
                className="h-4 w-4 text-[var(--muted)]"
                strokeWidth={2}
              />
            </div>
          </div>
          <div className="mt-4">
            <p className="text-sm font-medium text-[var(--muted)]">
              {t("ExpensesMain.cards.totalSpendingAfn")}
            </p>
            <p className="text-2xl font-bold text-[var(--text)]">
              {formatCurrency(totals.afn, "AFN").replace("$", "")}{" "}
              {t("ExpensesMain.currencies.afn")}
            </p>
          </div>
          <div className="mt-3 flex items-center gap-2">
            <div className="h-1.5 w-full rounded-full bg-emerald-500/10">
              <div
                className="h-full rounded-full bg-emerald-500"
                style={{ width: "100%" }}
              ></div>
            </div>
          </div>
        </div>

        {/* Total Entries */}
        <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-violet-500/10">
              <TrendingUp className="h-6 w-6 text-violet-500" strokeWidth={2} />
            </div>
            <div className="flex items-center gap-1">
              <span className="text-xs font-medium text-[var(--muted)]">
                {t("ExpensesMain.cards.count")}
              </span>
              <ChevronDown
                className="h-4 w-4 text-[var(--muted)]"
                strokeWidth={2}
              />
            </div>
          </div>
          <div className="mt-4">
            <p className="text-sm font-medium text-[var(--muted)]">
              {t("ExpensesMain.cards.totalEntries")}
            </p>
            <p className="text-2xl font-bold text-[var(--text)]">{count}</p>
          </div>
          <div className="mt-3 flex items-center gap-2">
            <div className="h-1.5 w-full rounded-full bg-violet-500/10">
              <div
                className="h-full rounded-full bg-violet-500"
                style={{ width: "100%" }}
              ></div>
            </div>
          </div>
        </div>

        {/* Average per Entry */}
        <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-500/10">
              <TrendingDown className="h-6 w-6 text-blue-500" strokeWidth={2} />
            </div>
            <div className="flex items-center gap-1">
              <span className="text-xs font-medium text-[var(--muted)]">
                {t("ExpensesMain.cards.avg")}
              </span>
              <ChevronDown
                className="h-4 w-4 text-[var(--muted)]"
                strokeWidth={2}
              />
            </div>
          </div>
          <div className="mt-4">
            <p className="text-sm font-medium text-[var(--muted)]">
              {t("ExpensesMain.cards.avgPerEntry")}
            </p>
            <p className="text-2xl font-bold text-[var(--text)]">
              {formatCurrency(averageUSD, "USD")}
            </p>
          </div>
          <div className="mt-3 flex items-center gap-2">
            <div className="h-1.5 w-full rounded-full bg-blue-500/10">
              <div
                className="h-full rounded-full bg-blue-500"
                style={{
                  width: `${Math.min(100, (averageUSD / (totals.usd / 10 || 1)) * 100)}%`,
                }}
              ></div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Search & Filter Bar ──────────────────── */}
      <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-4 shadow-sm">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search
              className="absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--muted)]"
              strokeWidth={2}
            />
            <input
              type="text"
              placeholder={t("ExpensesMain.search.placeholder")}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-10 w-full rounded-xl border border-[var(--border)] bg-[var(--bg)] ps-10 pe-4 text-sm text-[var(--text)] placeholder-[var(--muted)] transition-all focus:border-[var(--primary)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/20"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute end-3 top-1/2 -translate-y-1/2 text-[var(--muted)] hover:text-[var(--text)]"
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
            {t("ExpensesMain.filters.button")}
            {activeFilterCount > 0 && (
              <span className="flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-white/20 px-1.5 text-xs">
                {activeFilterCount}
              </span>
            )}
          </button>

          {/* Sort Dropdown */}
          <div className="relative">
            <ArrowUpDown
              className="absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--muted)]"
              strokeWidth={2}
            />
            <select
              value={sortBy}
              onChange={(e) => {
                setSortBy(e.target.value);
                setPage(1);
              }}
              className="h-10 appearance-none rounded-xl border border-[var(--border)] bg-[var(--bg)] ps-10 pe-10 text-sm text-[var(--text)] transition-all focus:border-[var(--primary)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/20 cursor-pointer"
            >
              {sortOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
            <ChevronDown
              className="absolute end-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--muted)] pointer-events-none"
              strokeWidth={2}
            />
          </div>
        </div>

        {/* Expanded Filters */}
        {showFilters && (
          <div className="mt-4 grid grid-cols-1 gap-3 border-t border-[var(--border)] pt-4 sm:grid-cols-2 lg:grid-cols-6">
            {/* Project Filter */}
            <div>
              <label className="mb-1.5 block text-xs font-medium text-[var(--muted)]">
                {t("ExpensesMain.filters.project.label")}
              </label>
              <select
                value={filterProject}
                onChange={(e) => {
                  setFilterProject(e.target.value);
                  setPage(1);
                }}
                className="h-10 w-full appearance-none rounded-xl border border-[var(--border)] bg-[var(--bg)] px-3 text-sm text-[var(--text)] transition-all focus:border-[var(--primary)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/20 cursor-pointer"
              >
                <option value="">
                  {t("ExpensesMain.filters.project.all")}
                </option>
                {projects.map((project) => (
                  <option key={project.id} value={project.id}>
                    {project.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Expense Scope Filter */}
            <div>
              <label className="mb-1.5 block text-xs font-medium text-[var(--muted)]">
                {t("ExpensesMain.filters.scope.label")}
              </label>
              <select
                value={filterScope}
                onChange={(e) => {
                  setFilterScope(e.target.value);
                  setFilterType("");
                  setPage(1);
                }}
                className="h-10 w-full appearance-none rounded-xl border border-[var(--border)] bg-[var(--bg)] px-3 text-sm text-[var(--text)] transition-all focus:border-[var(--primary)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/20 cursor-pointer"
              >
                <option value="">{t("ExpensesMain.filters.scope.all")}</option>
                <option value="project">
                  {t("ExpensesMain.filters.scope.project")}
                </option>
                <option value="office">
                  {t("ExpensesMain.filters.scope.office")}
                </option>
              </select>
            </div>

            {/* Expense Type Filter */}
            <div>
              <label className="mb-1.5 block text-xs font-medium text-[var(--muted)]">
                {t("ExpensesMain.filters.type.label")}
              </label>
              <select
                value={filterType}
                onChange={(e) => {
                  setFilterType(e.target.value);
                  setPage(1);
                }}
                className="h-10 w-full appearance-none rounded-xl border border-[var(--border)] bg-[var(--bg)] px-3 text-sm text-[var(--text)] transition-all focus:border-[var(--primary)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/20 cursor-pointer"
              >
                <option value="">{t("ExpensesMain.filters.type.all")}</option>
                {visibleExpenseTypes.map((type) => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Approval Status Filter */}
            <div>
              <label className="mb-1.5 block text-xs font-medium text-[var(--muted)]">
                Approval Status
              </label>
              <select
                value={filterStatus}
                onChange={(e) => {
                  setFilterStatus(e.target.value);
                  setPage(1);
                }}
                className="h-10 w-full appearance-none rounded-xl border border-[var(--border)] bg-[var(--bg)] px-3 text-sm text-[var(--text)] transition-all focus:border-[var(--primary)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/20 cursor-pointer"
              >
                <option value="">All statuses</option>
                <option value="approved">Approved</option>
                <option value="pending">Pending</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>

            {/* Date From */}
            <div>
              <label className="mb-1.5 block text-xs font-medium text-[var(--muted)]">
                {t("ExpensesMain.filters.date.from")}
              </label>
              <div className="relative">
                <Calendar
                  className="absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--muted)]"
                  strokeWidth={2}
                />
                <CalendarDatePicker
                  value={filterDateFrom}
                  onChange={(value) => {
                    setFilterDateFrom(value);
                    setPage(1);
                  }}
                  module="expenses"
                  className="ps-10"
                />
              </div>
            </div>

            {/* Date To */}
            <div>
              <label className="mb-1.5 block text-xs font-medium text-[var(--muted)]">
                {t("ExpensesMain.filters.date.to")}
              </label>
              <div className="relative">
                <Calendar
                  className="absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--muted)]"
                  strokeWidth={2}
                />
                <CalendarDatePicker
                  value={filterDateTo}
                  onChange={(value) => {
                    setFilterDateTo(value);
                    setPage(1);
                  }}
                  module="expenses"
                  className="ps-10"
                />
              </div>
            </div>

            {/* Clear Filters Button */}
            {activeFilterCount > 0 && (
              <div className="flex items-end sm:col-span-2 lg:col-span-6">
                <button
                  onClick={clearAllFilters}
                  className="inline-flex h-10 items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 text-sm font-medium text-red-600 transition-all hover:bg-red-100 dark:border-red-800 dark:bg-red-900/20 dark:text-red-400 dark:hover:bg-red-900/30"
                >
                  <X className="h-4 w-4" strokeWidth={2} />
                  {t("ExpensesMain.filters.clearAll")}
                </button>
              </div>
            )}
          </div>
        )}

        {/* Active Filters Summary */}
        {activeFilterCount > 0 && !showFilters && (
          <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-[var(--border)] pt-3">
            <span className="text-xs text-[var(--muted)]">
              {t("ExpensesMain.activeFilters.label")}
            </span>
            {debouncedSearch && (
              <span className="inline-flex items-center gap-1 rounded-lg bg-[var(--primary)]/10 px-2.5 py-1 text-xs font-medium text-[var(--primary)]">
                {t("ExpensesMain.activeFilters.search")} "{debouncedSearch}"
                <button
                  onClick={() => setSearchQuery("")}
                  className="ms-1 hover:text-[var(--primary)]/70"
                >
                  <X className="h-3 w-3" strokeWidth={2.5} />
                </button>
              </span>
            )}
            {filterProject && (
              <span className="inline-flex items-center gap-1 rounded-lg bg-[var(--primary)]/10 px-2.5 py-1 text-xs font-medium text-[var(--primary)]">
                {t("ExpensesMain.activeFilters.project")}{" "}
                {projects.find((p) => p.id === parseInt(filterProject))?.name ||
                  filterProject}
                <button
                  onClick={() => setFilterProject("")}
                  className="ms-1 hover:text-[var(--primary)]/70"
                >
                  <X className="h-3 w-3" strokeWidth={2.5} />
                </button>
              </span>
            )}
            {filterScope && (
              <span className="inline-flex items-center gap-1 rounded-lg bg-[var(--primary)]/10 px-2.5 py-1 text-xs font-medium text-[var(--primary)]">
                {t("ExpensesMain.activeFilters.scope")}{" "}
                {filterScope === "office" ? "Office" : "Project"}
                <button
                  onClick={() => {
                    setFilterScope("");
                    setFilterType("");
                  }}
                  className="ms-1 hover:text-[var(--primary)]/70"
                >
                  <X className="h-3 w-3" strokeWidth={2.5} />
                </button>
              </span>
            )}
            {filterType && (
              <span className="inline-flex items-center gap-1 rounded-lg bg-[var(--primary)]/10 px-2.5 py-1 text-xs font-medium text-[var(--primary)]">
                {t("ExpensesMain.activeFilters.type")}{" "}
                {visibleExpenseTypes.find((t) => t.value === filterType)?.label ||
                  filterType}
                <button
                  onClick={() => setFilterType("")}
                  className="ms-1 hover:text-[var(--primary)]/70"
                >
                  <X className="h-3 w-3" strokeWidth={2.5} />
                </button>
              </span>
            )}
            {filterStatus && (
              <span className="inline-flex items-center gap-1 rounded-lg bg-[var(--primary)]/10 px-2.5 py-1 text-xs font-medium text-[var(--primary)]">
                Status {filterStatus}
                <button
                  onClick={() => setFilterStatus("")}
                  className="ms-1 hover:text-[var(--primary)]/70"
                >
                  <X className="h-3 w-3" strokeWidth={2.5} />
                </button>
              </span>
            )}
            {(filterDateFrom || filterDateTo) && (
              <span className="inline-flex items-center gap-1 rounded-lg bg-[var(--primary)]/10 px-2.5 py-1 text-xs font-medium text-[var(--primary)]">
                {t("ExpensesMain.activeFilters.date")}{" "}
                {formatDate(filterDateFrom) || "..."} -{" "}
                {formatDate(filterDateTo) || "..."}
                <button
                  onClick={() => {
                    setFilterDateFrom("");
                    setFilterDateTo("");
                  }}
                  className="ms-1 hover:text-[var(--primary)]/70"
                >
                  <X className="h-3 w-3" strokeWidth={2.5} />
                </button>
              </span>
            )}
            {sortBy !== "-expense_date" && (
              <span className="inline-flex items-center gap-1 rounded-lg bg-[var(--primary)]/10 px-2.5 py-1 text-xs font-medium text-[var(--primary)]">
                {t("ExpensesMain.activeFilters.sort")}{" "}
                {sortOptions.find((o) => o.value === sortBy)?.label || sortBy}
                <button
                  onClick={() => setSortBy("-expense_date")}
                  className="ms-1 hover:text-[var(--primary)]/70"
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
                {t("ExpensesMain.pagination.found")}{" "}
                <span className="font-semibold text-[var(--text)]">
                  {count}
                </span>{" "}
                {t("ExpensesMain.pagination.resultsFor")} "{debouncedSearch}"
              </>
            ) : (
              <>
                {t("ExpensesMain.pagination.showing")}{" "}
                <span className="font-semibold text-[var(--text)]">
                  {startIndex}–{endIndex}
                </span>{" "}
                {t("ExpensesMain.pagination.of")}{" "}
                <span className="font-semibold text-[var(--text)]">
                  {count}
                </span>{" "}
                {t("ExpensesMain.pagination.expenses")}
              </>
            )}
          </p>

          {/* Pagination Controls — RTL-aware icons */}
          <div className="flex items-center gap-1">
            <button
              onClick={() => goToPage(1)}
              disabled={page === 1 || fetching}
              className="flex h-8 w-8 items-center justify-center rounded-lg text-[var(--muted)] transition-colors hover:bg-[var(--hover)] hover:text-[var(--text)] disabled:opacity-40 disabled:cursor-not-allowed"
              title={t("ExpensesMain.pagination.firstPage")}
            >
              <FirstPageIcon className="h-4 w-4" strokeWidth={2} />
            </button>

            <button
              onClick={goToPrevPage}
              disabled={!previousUrl || fetching}
              className="flex h-8 w-8 items-center justify-center rounded-lg text-[var(--muted)] transition-colors hover:bg-[var(--hover)] hover:text-[var(--text)] disabled:opacity-40 disabled:cursor-not-allowed"
              title={t("ExpensesMain.pagination.prevPage")}
            >
              <PrevPageIcon className="h-4 w-4" strokeWidth={2} />
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
              title={t("ExpensesMain.pagination.nextPage")}
            >
              <NextPageIcon className="h-4 w-4" strokeWidth={2} />
            </button>

            <button
              onClick={() => goToPage(totalPages)}
              disabled={page === totalPages || fetching}
              className="flex h-8 w-8 items-center justify-center rounded-lg text-[var(--muted)] transition-colors hover:bg-[var(--hover)] hover:text-[var(--text)] disabled:opacity-40 disabled:cursor-not-allowed"
              title={t("ExpensesMain.pagination.lastPage")}
            >
              <LastPageIcon className="h-4 w-4" strokeWidth={2} />
            </button>
          </div>
        </div>
      )}

      {/* ── Loading State ────────────────────────── */}
      {fetching && !expenseList.length ? (
        <div className="flex items-center justify-center rounded-xl border border-[var(--border)] bg-[var(--card)] py-20 shadow-sm">
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="h-8 w-8 animate-spin text-[var(--primary)]" />
            <p className="text-sm text-[var(--muted)]">
              {t("ExpensesMain.loading")}
            </p>
          </div>
        </div>
      ) : (
        <ExpenseList
          expenses={expenseList}
          onDelete={dataEntryMode ? undefined : handleExpenseDelete}
          onUpdate={handleExpenseUpdate}
          onRefresh={handleRefresh}
          canDelete={!dataEntryMode}
          projects={projects || []}
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
            {activeFilterCount > 0
              ? t("ExpensesMain.empty.noMatch")
              : t("ExpensesMain.empty.noExpenses")}
          </h3>
          <p className="mb-5 max-w-sm text-sm text-[var(--muted)]">
            {activeFilterCount > 0
              ? t("ExpensesMain.empty.messageMatch")
              : t("ExpensesMain.empty.messageDefault")}
          </p>
          {activeFilterCount > 0 ? (
            <button
              onClick={clearAllFilters}
              className="inline-flex items-center gap-2 rounded-xl bg-[var(--primary)] px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-[var(--primary)]/25 transition-all hover:opacity-90"
            >
              <X className="h-4 w-4" strokeWidth={2.5} />
              {t("ExpensesMain.empty.clearFilters")}
            </button>
          ) : (
            <button
              onClick={() => setOpen(true)}
              className="inline-flex items-center gap-2 rounded-xl bg-[var(--primary)] px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-[var(--primary)]/25 transition-all hover:opacity-90"
            >
              <Plus className="h-4 w-4" strokeWidth={2.5} />
              {t("ExpensesMain.empty.addFirst")}
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

import { useState, useMemo } from "react";
import {
  MoreHorizontal,
  Edit2,
  Trash2,
  Eye,
  ArrowUpDown,
  RefreshCw,
  Calendar,
  FileQuestion,
  Printer,
} from "lucide-react";
import ExpenseDetail from "./ExpenseDetail";
import ExpenseEdit from "./ExpenseEdit";
import ExpenseReceiptPrintModal from "./ExpenseReceiptPrintModal";
import PermissionWrapper from "../../auth/PermissionWrapper";
import { useLanguage } from "../../hooks/useLanguage";
import DeleteConfirmModal from "../../components/ui/DeleteConfirmModal";

const categoryConfig = {
  food: {
    label: "foodDining",
    color: "bg-orange-500/10 text-orange-600 dark:text-orange-400",
    icon: "🍔",
  },
  transport: {
    label: "transportation",
    color: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
    icon: "🚗",
  },
  utilities: {
    label: "utilities",
    color: "bg-purple-500/10 text-purple-600 dark:text-purple-400",
    icon: "💡",
  },
  entertainment: {
    label: "entertainment",
    color: "bg-pink-500/10 text-pink-600 dark:text-pink-400",
    icon: "🎬",
  },
  shopping: {
    label: "shopping",
    color: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
    icon: "🛒",
  },
  other: {
    label: "other",
    color: "bg-gray-500/10 text-gray-600 dark:text-gray-400",
    icon: "📦",
  },
};

const RTL_LANGS = ["dr", "ps", "fa", "dar", "prs"];

export default function ExpenseList({
  expenses = [],
  onDelete,
  onUpdate,
  searchTerm = "",
  selectedCategory = "all",
  onRefresh,
  canDelete = true,
}) {
  const [sortField, setSortField] = useState("expense_date");
  const [sortDirection, setSortDirection] = useState("desc");
  const [selectedExpenses, setSelectedExpenses] = useState([]);
  const [openDropdownId, setOpenDropdownId] = useState(null);
  const [selectedExpense, setSelectedExpense] = useState(null);
  const [showDetail, setShowDetail] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [printExpense, setPrintExpense] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const { t, lang } = useLanguage();

  const isRTL = RTL_LANGS.includes(lang);

  const getDisplayAmount = (expense) => {
    const usdAmount = parseFloat(expense.amount_usd) || 0;
    const afnAmount = parseFloat(expense.amount_afn) || 0;
    if (usdAmount > 0) return { value: usdAmount, currency: "USD" };
    if (afnAmount > 0) return { value: afnAmount, currency: "AFN" };
    return { value: 0, currency: "USD" };
  };

  const getTotalAmount = (expense) => {
    return parseFloat(expense.total_usd) || parseFloat(expense.total_afn) || 0;
  };

  const filteredExpenses = useMemo(() => {
    let result = [...expenses];

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(
        (exp) =>
          exp.description?.toLowerCase().includes(term) ||
          exp.expense_type?.toLowerCase().includes(term) ||
          exp.paid_to?.toLowerCase().includes(term),
      );
    }

    if (selectedCategory !== "all") {
      result = result.filter((exp) => exp.category === selectedCategory);
    }

    result.sort((a, b) => {
      let aValue = a[sortField];
      let bValue = b[sortField];

      if (sortField === "expense_date") {
        aValue = new Date(aValue).getTime();
        bValue = new Date(bValue).getTime();
      } else if (sortField === "amount") {
        aValue = getTotalAmount(a);
        bValue = getTotalAmount(b);
      }

      return sortDirection === "asc"
        ? aValue > bValue
          ? 1
          : -1
        : aValue < bValue
          ? 1
          : -1;
    });

    return result;
  }, [expenses, searchTerm, selectedCategory, sortField, sortDirection]);

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("desc");
    }
  };

  const toggleSelectExpense = (id) => {
    setSelectedExpenses((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id],
    );
  };

  const toggleSelectAll = () => {
    if (selectedExpenses.length === filteredExpenses.length) {
      setSelectedExpenses([]);
    } else {
      setSelectedExpenses(filteredExpenses.map((exp) => exp.id));
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const handleViewDetails = (expense) => {
    setSelectedExpense(expense);
    setShowDetail(true);
  };

  const handleEdit = (expense) => {
    setSelectedExpense(expense);
    setShowDetail(false);
    setShowEdit(true);
  };

  const handleSaveEdit = async (updatedExpense) => {
    try {
      await onUpdate?.(selectedExpense.id, updatedExpense);
      setShowEdit(false);
      setSelectedExpense(null);
    } catch (error) {
      console.error("Failed to update expense:", error);
      throw error;
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;

    try {
      setDeleteLoading(true);
      await onDelete?.(deleteTarget.id);
      setDeleteTarget(null);
    } catch (err) {
      console.error("Delete failed:", err);
    } finally {
      setDeleteLoading(false);
    }
  };
  if (filteredExpenses.length === 0 && expenses.length > 0) {
    return (
      <div
        dir={isRTL ? "rtl" : "ltr"}
        className="flex flex-col items-center justify-center rounded-xl border border-dashed border-[var(--border)] bg-[var(--card)] py-16 text-center"
      >
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--muted)]/10 mb-3">
          <FileQuestion
            className="h-7 w-7 text-[var(--muted)]"
            strokeWidth={1.5}
          />
        </div>
        <h3 className="text-base font-semibold text-[var(--text)] mb-1">
          {t("ExpenseList.noMatchingExpenses")}
        </h3>
        <p className="text-sm text-[var(--muted)] mb-4">
          {t("ExpenseList.adjustSearch")}
        </p>
        <button
          onClick={onRefresh}
          className="inline-flex items-center gap-2 rounded-lg bg-[var(--hover)] px-4 py-2 text-sm font-medium text-[var(--text)] transition-colors hover:bg-[var(--border)]"
        >
          <RefreshCw className="h-4 w-4" />
          {t("ExpenseList.refresh")}
        </button>
      </div>
    );
  }

  return (
    <>
      <div
        dir={isRTL ? "rtl" : "ltr"}
        className="rounded-xl border border-[var(--border)] bg-[var(--card)] shadow-sm overflow-hidden"
      >
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[var(--border)] bg-[var(--bg)]/50">
                <th className="px-3 py-0 text-start text-xs font-semibold text-[var(--muted)] uppercase tracking-wider">
                  {t("ExpenseList.serialNumber")}
                </th>
                <th className="px-4 py-3 text-start text-xs font-semibold text-[var(--muted)] uppercase tracking-wider">
                  {t("ExpenseList.description")}
                </th>
                <th className="px-4 py-3 text-start text-xs font-semibold text-[var(--muted)] uppercase tracking-wider">
                  {t("ExpenseList.type")}
                </th>
                <th
                  className="px-4 py-3 text-start text-xs font-semibold text-[var(--muted)] uppercase tracking-wider cursor-pointer hover:text-[var(--text)]"
                  onClick={() => handleSort("expense_date")}
                >
                  <div className="flex items-center gap-1.5">
                    {t("ExpenseList.date")}{" "}
                    <ArrowUpDown className="h-3.5 w-3.5" />
                  </div>
                </th>
                <th
                  className="px-4 py-3 text-end text-xs font-semibold text-[var(--muted)] uppercase tracking-wider cursor-pointer hover:text-[var(--text)]"
                  onClick={() => handleSort("amount")}
                >
                  <div className="flex items-center justify-end gap-1.5">
                    {t("ExpenseList.amount")}{" "}
                    <ArrowUpDown className="h-3.5 w-3.5" />
                  </div>
                </th>
                <th className="px-4 py-3 pe-5 text-end text-xs font-semibold text-[var(--muted)] uppercase tracking-wider">
                  {t("ExpenseList.actions")}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)]">
              {filteredExpenses.map((expense) => {
                const displayAmount = getDisplayAmount(expense);
                const isOpen = openDropdownId === expense.id;

                return (
                  <tr
                    key={expense.id}
                    className={`group transition-colors hover:bg-[var(--hover)] ${
                      selectedExpenses.includes(expense.id)
                        ? "bg-[var(--primary)]/5"
                        : ""
                    }`}
                  >
                    <td className="px-4 py-3.5 ps-5">
                      <div className="flex h-10 min-w-[40px] px-2 shrink-0 items-center justify-center rounded-xl bg-[var(--bg)] text-sm font-semibold border border-[var(--border)]">
                        {expense.serial_number}
                      </div>
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-3">
                        <div>
                          <p className="font-medium text-[var(--text)] line-clamp-1">
                            {expense.description ||
                              t("ExpenseList.unnamedExpense")}
                          </p>
                          <p className="text-xs text-[var(--muted)] mt-0.5">
                            {expense.paid_to ||
                              expense.project_name ||
                              t("ExpenseList.noVendor")}{" "}
                            • {expense.expense_type || t("ExpenseList.general")}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3.5">
                      <span className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-medium bg-gray-500/10 text-gray-600 dark:text-gray-400">
                        <span>
                          {expense.expense_type || t("ExpenseList.general")}
                        </span>
                      </span>
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-2 text-[var(--muted)]">
                        <Calendar className="h-3.5 w-3.5" />
                        <span className="text-sm">
                          {formatDate(expense.expense_date)}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3.5 text-end">
                      <p className="font-semibold text-[var(--text)] tabular-nums">
                        {displayAmount.currency === "USD" ? "$" : "؋"}
                        {displayAmount.value.toLocaleString()}
                      </p>
                      <p className="text-xs text-[var(--muted)] mt-0.5">
                        {t("ExpenseList.total")}: $
                        {parseFloat(expense.total_usd || 0).toLocaleString()} /
                        ؋{parseFloat(expense.total_afn || 0).toLocaleString()}
                      </p>
                    </td>
                    <td className="px-4 py-3.5 pe-5">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => handleViewDetails(expense)}
                          className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-[var(--muted)] hover:bg-[var(--hover)] hover:text-[var(--text)]"
                          title={t("ExpenseList.viewDetails")}
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleEdit(expense)}
                          className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-[var(--muted)] hover:bg-[var(--hover)] hover:text-[var(--text)]"
                          title={t("ExpenseList.editExpense")}
                        >
                          <Edit2 className="h-4 w-4" />
                        </button>

                        {/* Custom Dropdown */}
                        <div className="relative">
                          <button
                            onClick={() =>
                              setOpenDropdownId(isOpen ? null : expense.id)
                            }
                            className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-[var(--muted)] hover:bg-[var(--hover)] hover:text-[var(--text)]"
                            title={t("ExpenseList.moreOptions")}
                          >
                            <MoreHorizontal className="h-4 w-4" />
                          </button>

                          {isOpen && (
                            <>
                              <div
                                className="fixed inset-0 z-40"
                                onClick={() => setOpenDropdownId(null)}
                              />
                              <div className="absolute end-0 mt-2 w-48 rounded-lg border border-[var(--border)] bg-[var(--card)] shadow-lg z-50 py-1">
                                <button
                                  onClick={() => {
                                    handleViewDetails(expense);
                                    setOpenDropdownId(null);
                                  }}
                                  className="flex w-full items-center gap-2 px-3 py-2 text-sm text-start hover:bg-[var(--hover)]"
                                >
                                  <Eye className="h-4 w-4 shrink-0" />{" "}
                                  {t("ExpenseList.viewDetails")}
                                </button>
                                <button
                                  onClick={() => {
                                    handleEdit(expense);
                                    setOpenDropdownId(null);
                                  }}
                                  className="flex w-full items-center gap-2 px-3 py-2 text-sm text-start hover:bg-[var(--hover)]"
                                >
                                  <Edit2 className="h-4 w-4 shrink-0" />{" "}
                                  {t("ExpenseList.edit")}
                                </button>
                                <button
                                  onClick={() => {
                                    setPrintExpense(expense);
                                    setOpenDropdownId(null);
                                  }}
                                  className="flex w-full items-center gap-2 px-3 py-2 text-sm text-start hover:bg-[var(--hover)]"
                                >
                                  <Printer className="h-4 w-4 shrink-0" />{" "}
                                  {t("ExpenseList.printReceipt")}
                                </button>
                                {canDelete && (
                                  <>
                                    <div className="my-1 border-t border-[var(--border)]" />
                                    <PermissionWrapper
                                      permissions={["expenses.delete"]}
                                    >
                                      <button
                                        onClick={() => {
                                          setDeleteTarget(expense);
                                          setOpenDropdownId(null);
                                        }}
                                        className="flex w-full items-center gap-2 px-3 py-2 text-sm text-start text-red-600 hover:bg-red-500/10"
                                      >
                                        <Trash2 className="h-4 w-4 shrink-0" />{" "}
                                        {t("ExpenseList.delete")}
                                      </button>
                                    </PermissionWrapper>
                                  </>
                                )}
                              </div>
                            </>
                          )}
                        </div>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Detail Modal */}
      <ExpenseDetail
        expense={selectedExpense}
        isOpen={showDetail}
        onClose={() => {
          setShowDetail(false);
          setSelectedExpense(null);
        }}
        onEdit={(expense) => {
          setShowDetail(false);
          handleEdit(expense);
        }}
      />

      {/* Edit Modal */}
      <ExpenseEdit
        expense={selectedExpense}
        isOpen={showEdit}
        onClose={() => {
          setShowEdit(false);
          setSelectedExpense(null);
        }}
        onSave={handleSaveEdit}
      />

      {/* Print Receipt Modal */}
      <ExpenseReceiptPrintModal
        isOpen={!!printExpense}
        expense={printExpense}
        onClose={() => setPrintExpense(null)}
      />
      <DeleteConfirmModal
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleConfirmDelete}
        itemName={deleteTarget?.description || t("ExpenseList.unnamedExpense")}
        loading={deleteLoading}
      />
    </>
  );
}

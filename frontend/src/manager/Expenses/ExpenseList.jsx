import { useState, useMemo, useRef } from "react";
import {
  MoreHorizontal,
  Edit2,
  Trash2,
  Eye,
  ArrowUpDown,
  RefreshCw,
  Calendar,
  Receipt,
  FileQuestion,
  Printer,
} from "lucide-react";
import ExpenseDetail from "./ExpenseDetail";
import ExpenseEdit from "./ExpenseEdit";
import ExpenseReceiptPrintModal from "./ExpenseReceiptPrintModal";
// import PrintRecieptComponent from "./ExpenseReceiptPrintModal";
// import { useReactToPrint } from "react-to-print";

// Category configurations
const categoryConfig = {
  food: {
    label: "Food & Dining",
    color: "bg-orange-500/10 text-orange-600 dark:text-orange-400",
    icon: "🍔",
  },
  transport: {
    label: "Transportation",
    color: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
    icon: "🚗",
  },
  utilities: {
    label: "Utilities",
    color: "bg-purple-500/10 text-purple-600 dark:text-purple-400",
    icon: "💡",
  },
  entertainment: {
    label: "Entertainment",
    color: "bg-pink-500/10 text-pink-600 dark:text-pink-400",
    icon: "🎬",
  },
  shopping: {
    label: "Shopping",
    color: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
    icon: "🛒",
  },
  other: {
    label: "Other",
    color: "bg-gray-500/10 text-gray-600 dark:text-gray-400",
    icon: "📦",
  },
};

export default function ExpenseList({
  expenses = [],
  onDelete,
  onUpdate,
  searchTerm = "",
  selectedCategory = "all",
  onRefresh,
}) {
  const [sortField, setSortField] = useState("date");
  const [sortDirection, setSortDirection] = useState("desc");
  const [selectedExpenses, setSelectedExpenses] = useState([]);
  const [openDropdownId, setOpenDropdownId] = useState(null);
  const [selectedExpense, setSelectedExpense] = useState(null);
  const [showDetail, setShowDetail] = useState(false);
  const [showEdit, setShowEdit] = useState(false);

  const [printExpense, setPrintExpense] = useState(null);
  // Helper function to get the display amount
  const getDisplayAmount = (expense) => {
    const usdAmount = parseFloat(expense.amount_usd) || 0;
    const afnAmount = parseFloat(expense.amount_afn) || 0;

    // Return the larger amount for display
    if (usdAmount > 0) return { value: usdAmount, currency: "USD" };
    if (afnAmount > 0) return { value: afnAmount, currency: "AFN" };
    return { value: 0, currency: "USD" };
  };

  // Helper function to get total for sorting
  const getTotalAmount = (expense) => {
    return parseFloat(expense.total_usd) || parseFloat(expense.total_afn) || 0;
  };

  // Filter and sort expenses
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

      if (sortField === "date") {
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

  // No results state
  if (filteredExpenses.length === 0 && expenses.length > 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-[var(--border)] bg-[var(--card)] py-16 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--muted)]/10 mb-3">
          <FileQuestion
            className="h-7 w-7 text-[var(--muted)]"
            strokeWidth={1.5}
          />
        </div>
        <h3 className="text-base font-semibold text-[var(--text)] mb-1">
          No matching expenses
        </h3>
        <p className="text-sm text-[var(--muted)] mb-4">
          Try adjusting your search or filter criteria
        </p>
        <button
          onClick={onRefresh}
          className="inline-flex items-center gap-2 rounded-lg bg-[var(--hover)] px-4 py-2 text-sm font-medium text-[var(--text)] transition-colors hover:bg-[var(--border)]"
        >
          <RefreshCw className="h-4 w-4" />
          Refresh
        </button>
      </div>
    );
  }

  return (
    <>
      <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[var(--border)] bg-[var(--bg)]/50">
                <th className="px-3 py-0 text-left text-xs font-semibold text-[var(--muted)] uppercase tracking-wider">
                  Serial #
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-[var(--muted)] uppercase tracking-wider">
                  Description
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-[var(--muted)] uppercase tracking-wider">
                  Type
                </th>
                <th
                  className="px-4 py-3 text-left text-xs font-semibold text-[var(--muted)] uppercase tracking-wider cursor-pointer hover:text-[var(--text)]"
                  onClick={() => handleSort("date")}
                >
                  <div className="flex items-center gap-1.5">
                    Date <ArrowUpDown className="h-3.5 w-3.5" />
                  </div>
                </th>
                <th
                  className="px-4 py-3 text-right text-xs font-semibold text-[var(--muted)] uppercase tracking-wider cursor-pointer hover:text-[var(--text)]"
                  onClick={() => handleSort("amount")}
                >
                  <div className="flex items-center justify-end gap-1.5">
                    Amount <ArrowUpDown className="h-3.5 w-3.5" />
                  </div>
                </th>
                <th className="px-4 py-3 pr-5 text-right text-xs font-semibold text-[var(--muted)] uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)]">
              {filteredExpenses.map((expense) => {
                const displayAmount = getDisplayAmount(expense);
                const totalAmount = getTotalAmount(expense);
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
                    <td className="px-4 py-3.5 pl-5">
                      <div className="flex h-10 min-w-[40px] px-2 shrink-0 items-center justify-center rounded-xl bg-[var(--bg)] text-sm font-semibold border border-[var(--border)]">
                        {expense.serial_number}
                      </div>
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-3">
                        <div>
                          <p className="font-medium text-[var(--text)] line-clamp-1">
                            {expense.description || "Unnamed Expense"}
                          </p>
                          <p className="text-xs text-[var(--muted)] mt-0.5">
                            {expense.paid_to ||
                              expense.project_name ||
                              "No vendor"}{" "}
                            •{expense.expense_type || "General"}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3.5">
                      <span className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-medium bg-gray-500/10 text-gray-600 dark:text-gray-400">
                        <span>{expense.expense_type || "general"}</span>
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
                    <td className="px-4 py-3.5 text-right">
                      <p className="font-semibold text-[var(--text)] tabular-nums">
                        {displayAmount.currency === "USD" ? "$" : "؋"}
                        {displayAmount.value.toLocaleString()}
                      </p>
                      <p className="text-xs text-[var(--muted)] mt-0.5">
                        Total: $
                        {parseFloat(expense.total_usd || 0).toLocaleString()} /
                        ؋{parseFloat(expense.total_afn || 0).toLocaleString()}
                      </p>
                    </td>
                    <td className="px-4 py-3.5 pr-5">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => handleViewDetails(expense)}
                          className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-[var(--muted)] hover:bg-[var(--hover)] hover:text-[var(--text)]"
                          title="View details"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleEdit(expense)}
                          className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-[var(--muted)] hover:bg-[var(--hover)] hover:text-[var(--text)]"
                          title="Edit expense"
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
                            title="More options"
                          >
                            <MoreHorizontal className="h-4 w-4" />
                          </button>

                          {isOpen && (
                            <>
                              <div
                                className="fixed inset-0 z-40"
                                onClick={() => setOpenDropdownId(null)}
                              />
                              <div className="absolute right-0 mt-2 w-48 rounded-lg border border-[var(--border)] bg-[var(--card)] shadow-lg z-50 py-1">
                                <button
                                  onClick={() => {
                                    handleViewDetails(expense);
                                    setOpenDropdownId(null);
                                  }}
                                  className="flex w-full items-center gap-2 px-3 py-2 text-sm hover:bg-[var(--hover)]"
                                >
                                  <Eye className="h-4 w-4" /> View Details
                                </button>
                                <button
                                  onClick={() => {
                                    handleEdit(expense);
                                    setOpenDropdownId(null);
                                  }}
                                  className="flex w-full items-center gap-2 px-3 py-2 text-sm hover:bg-[var(--hover)]"
                                >
                                  <Edit2 className="h-4 w-4" /> Edit
                                </button>
                                <button
                                  onClick={() => {
                                    setPrintExpense(expense);
                                    setOpenDropdownId(null);
                                  }}
                                  className="flex w-full items-center gap-2 px-3 py-2 text-sm hover:bg-[var(--hover)]"
                                >
                                  <Printer className="h-4 w-4" /> Print Receipt
                                </button>
                                <div className="my-1 border-t border-[var(--border)]" />
                                <button
                                  onClick={() => {
                                    onDelete?.(expense.id);
                                    setOpenDropdownId(null);
                                  }}
                                  className="flex w-full items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-500/10"
                                >
                                  <Trash2 className="h-4 w-4" /> Delete
                                </button>
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

      <div style={{ position: "absolute", left: "-10000px", top: 0 }}>
        <ExpenseReceiptPrintModal
          isOpen={!!printExpense}
          expense={printExpense}
          onClose={() => setPrintExpense(null)}
        />
      </div>
    </>
  );
}

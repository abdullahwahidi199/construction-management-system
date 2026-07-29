// src/pages/contracts/ContractInvoicesPage.jsx
import React, { useState, useMemo } from "react";
import useFetch from "../../../hooks/useFetch";
import InvoiceFormModal from "./InvoiceFormModal";
import ContractInvoiceDetails from "../../contracts/ContractInvoiceDetails";
import { useLanguage } from "../../../hooks/useLanguage";
import CalendarDatePicker from "../../common/CalendarDatePicker";
import { useCalendar } from "../../../hooks/useCalendar";

const STATUS_COLORS = {
  pending: "var(--warning)",
  approved: "var(--primary)",
  partially_paid: "var(--warning)",
  paid: "var(--success)",
  cancelled: "var(--danger)",
};

// Shared input style for consistency
const inputStyle = {
  boxSizing: "border-box",
  maxWidth: "100%",
  padding: "0.5rem 0.75rem",
  border: "1px solid var(--border)",
  borderRadius: "6px",
  background: "var(--card)",
  color: "var(--text)",
  fontSize: "0.9rem",
  outline: "none",
};

const dateKey = (value) => String(value || "").slice(0, 10);

export default function ContractInvoicesPage({ contractID, contractCurrency }) {
  const { t } = useLanguage();
  const { formatDate } = useCalendar("invoices");

  const STATUS_FILTERS = [
    { value: "", label: t("ContractInvoicesPage.allStatuses") },
    { value: "pending", label: t("ContractInvoicesPage.pending") },
    { value: "approved", label: t("ContractInvoicesPage.approved") },
    { value: "partially_paid", label: t("ContractInvoicesPage.partiallyPaid") },
    { value: "paid", label: t("ContractInvoicesPage.paid") },
    { value: "cancelled", label: t("ContractInvoicesPage.cancelled") },
  ];

  const {
    data: invoices,
    loading,
    error,
    refetch,
  } = useFetch(`invoices/?contract=${contractID}`);
  const invoiceList = Array.isArray(invoices)
    ? invoices
    : Array.isArray(invoices?.results)
      ? invoices.results
      : [];

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [viewInvoiceId, setViewInvoiceId] = useState(null);
  const [isViewOpen, setIsViewOpen] = useState(false);

  // --- Filter State ---
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [dateRange, setDateRange] = useState({ start: "", end: "" });

  // --- Handlers ---
  const handleOpenCreate = () => {
    setSelectedInvoice(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (invoice) => {
    setSelectedInvoice(invoice);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedInvoice(null);
  };

  const handleSuccess = () => {
    refetch();
    handleCloseModal();
  };

  const handleClearFilters = () => {
    setSearchQuery("");
    setStatusFilter("");
    setDateRange({ start: "", end: "" });
  };

  // --- Advanced Filtering Logic ---
  const filteredInvoices = useMemo(() => {
    if (!invoiceList.length) return [];

    const start = dateKey(dateRange.start);
    const end = dateKey(dateRange.end);

    return invoiceList.filter((inv) => {
      // 1. Status Filter
      const matchesStatus = !statusFilter || inv.status === statusFilter;

      // 2. Text Search
      const q = searchQuery.toLowerCase().trim();
      if (!q) {
        // If no text query, check status + date
        const invDate = dateKey(inv.invoice_date);
        let matchesDate = true;
        if (start && invDate < start) matchesDate = false;
        if (end && invDate > end) matchesDate = false;
        return matchesStatus && matchesDate;
      }

      // 3. Combined Text + Status + Date
      const matchesSearch =
        inv.invoice_number?.toLowerCase().includes(q) ||
        inv.project_name?.toLowerCase().includes(q) ||
        inv.subcontractor_name?.toLowerCase().includes(q);

      const invDate = dateKey(inv.invoice_date);
      let matchesDate = true;
      if (start && invDate < start) matchesDate = false;
      if (end && invDate > end) matchesDate = false;

      return matchesStatus && matchesSearch && matchesDate;
    });
  }, [invoiceList, searchQuery, statusFilter, dateRange]);

  const hasActiveFilters =
    searchQuery || statusFilter || dateRange.start || dateRange.end;
  const emptyMessage = hasActiveFilters
    ? t("ContractInvoicesPage.noMatchingInvoices")
    : t("ContractInvoicesPage.noInvoicesForContract");

  if (loading)
    return (
      <div
        style={{ padding: "2rem", textAlign: "center", color: "var(--muted)" }}
      >
        {t("ContractInvoicesPage.loadingInvoices")}
      </div>
    );
  if (error)
    return (
      <div
        style={{ padding: "2rem", textAlign: "center", color: "var(--danger)" }}
      >
        {t("ContractInvoicesPage.error")}: {error}
      </div>
    );

  return (
    <div
      style={{
        padding: "2rem",
        background: "var(--bg)",
        color: "var(--text)",
        minHeight: 0,
      }}
    >
      {/* Header */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "1.5rem",
          flexWrap: "wrap",
          gap: "1rem",
        }}
      >
        <h1 style={{ fontSize: "1.5rem", fontWeight: "bold", margin: 0 }}>
          {t("ContractInvoicesPage.contractInvoices")}
        </h1>
        <button
          onClick={handleOpenCreate}
          style={{
            background: "var(--primary)",
            color: "#fff",
            border: "none",
            padding: "0.6rem 1.2rem",
            borderRadius: "6px",
            cursor: "pointer",
            fontWeight: "500",
            fontSize: "0.9rem",
          }}
        >
          + {t("ContractInvoicesPage.newInvoice")}
        </button>
      </div>

      {/* Filter Bar */}
      <div
        style={{
          display: "flex",
          gap: "0.8rem",
          marginBottom: "1rem",
          flexWrap: "wrap",
          alignItems: "center",
        }}
      >
        {/* Search Input */}
        <div style={{ flex: "1 1 200px" }}>
          <input
            type="text"
            placeholder={t("ContractInvoicesPage.searchPlaceholder")}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ ...inputStyle, width: "100%" }}
          />
        </div>

        {/* Status Select */}
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          style={{
            ...inputStyle,
            flex: "1 1 130px",
            minWidth: "min(100%, 130px)",
            cursor: "pointer",
          }}
        >
          {STATUS_FILTERS.map((s) => (
            <option key={s.value} value={s.value}>
              {s.label}
            </option>
          ))}
        </select>

        {/* Start Date */}
        <div style={{ flex: "1 1 150px", minWidth: 0 }}>
          <CalendarDatePicker
            value={dateRange.start}
            onChange={(value) =>
              setDateRange((prev) => ({ ...prev, start: value }))
            }
            placeholder={t("ContractInvoicesPage.startDate")}
            module="invoices"
          />
        </div>

        {/* End Date */}
        <div style={{ flex: "1 1 150px", minWidth: 0 }}>
          <CalendarDatePicker
            value={dateRange.end}
            onChange={(value) =>
              setDateRange((prev) => ({ ...prev, end: value }))
            }
            placeholder={t("ContractInvoicesPage.endDate")}
            module="invoices"
          />
        </div>

        {/* Clear Button */}
        {hasActiveFilters && (
          <button
            onClick={handleClearFilters}
            style={{
              background: "transparent",
              border: "1px solid var(--danger)",
              color: "var(--danger)",
              padding: "0.5rem 0.8rem",
              borderRadius: "6px",
              cursor: "pointer",
              fontSize: "0.85rem",
              fontWeight: "500",
              display: "flex",
              alignItems: "center",
              gap: "4px",
            }}
          >
            ✕ {t("ContractInvoicesPage.clearFilters")}
          </button>
        )}
      </div>

      {/* Results Count */}
      <div
        style={{
          marginBottom: "0.5rem",
          fontSize: "0.85rem",
          color: "var(--muted)",
        }}
      >
        {t("ContractInvoicesPage.showing")}{" "}
        <span style={{ color: "var(--text)", fontWeight: "bold" }}>
          {filteredInvoices.length}
        </span>{" "}
        {t("ContractInvoicesPage.of")} {invoiceList.length}{" "}
        {t("ContractInvoicesPage.invoices")}
      </div>

      {/* Table */}
      <div
        className="hidden md:block"
        style={{
          overflowX: "auto",
          background: "var(--card)",
          borderRadius: "8px",
          border: "1px solid var(--border)",
          boxShadow: "0 2px 8px var(--shadow, rgba(0,0,0,0.05))",
        }}
      >
        <table
          style={{
            width: "100%",
            borderCollapse: "collapse",
            minWidth: "900px",
          }}
        >
          <thead>
            <tr style={{ borderBottom: "1px solid var(--border)" }}>
              {[
                t("ContractInvoicesPage.invoiceNumber"),
                t("ContractInvoicesPage.project"),
                t("ContractInvoicesPage.subcontractor"),
                t("ContractInvoicesPage.date"),
                t("ContractInvoicesPage.dueDate"),
                t("ContractInvoicesPage.amount"),
                t("ContractInvoicesPage.status"),
                t("ContractInvoicesPage.actions"),
              ].map((h) => (
                <th
                  key={h}
                  style={{
                    padding: "1rem",
                    textAlign: "left",
                    fontSize: "0.8rem",
                    color: "var(--muted)",
                    fontWeight: "600",
                    textTransform: "uppercase",
                    letterSpacing: "0.05em",
                  }}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filteredInvoices?.length === 0 ? (
              <tr>
                <td
                  colSpan="8"
                  style={{
                    padding: "3rem",
                    textAlign: "center",
                    color: "var(--muted)",
                    fontStyle: "italic",
                  }}
                >
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              filteredInvoices.map((inv) => (
                <tr
                  key={inv.id}
                  style={{
                    borderBottom: "1px solid var(--border)",
                    transition: "background 0.2s",
                  }}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.background = "var(--hover)")
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.background = "transparent")
                  }
                >
                  <td style={{ padding: "1rem", fontWeight: "500" }}>
                    {inv.invoice_number}
                  </td>
                  <td style={{ padding: "1rem" }}>{inv.project_name || "-"}</td>
                  <td style={{ padding: "1rem" }}>
                    {inv.subcontractor_name || "-"}
                  </td>
                  <td style={{ padding: "1rem" }}>
                    {formatDate(inv.invoice_date) ||
                      inv.formatted_invoice_date ||
                      inv.invoice_date ||
                      "-"}
                  </td>
                  <td style={{ padding: "1rem" }}>
                    {formatDate(inv.due_date) ||
                      inv.formatted_due_date ||
                      inv.due_date ||
                      "-"}
                  </td>
                  <td
                    style={{
                      padding: "1rem",
                      fontWeight: "600",
                      fontFamily: "monospace",
                    }}
                  >
                    {contractCurrency || ""}
                    {Number(inv.amount).toFixed(2)}
                  </td>
                  <td style={{ padding: "1rem" }}>
                    <span
                      style={{
                        background: STATUS_COLORS[inv.status] || "var(--muted)",
                        color: "#fff",
                        padding: "0.25rem 0.6rem",
                        borderRadius: "9999px",
                        fontSize: "0.75rem",
                        fontWeight: "600",
                        textTransform: "capitalize",
                        display: "inline-block",
                      }}
                    >
                      {inv.status.replace("_", " ")}
                    </span>
                  </td>
                  <td style={{ padding: "1rem" }}>
                    <button
                      onClick={() => {
                        setViewInvoiceId(inv.id);
                        setIsViewOpen(true);
                      }}
                      style={{
                        background: "transparent",
                        border: "1px solid var(--border)",
                        padding: "0.3rem 0.6rem",
                        borderRadius: "4px",
                        cursor: "pointer",
                        color: "var(--text)",
                        fontSize: "0.8rem",
                        marginRight: "0.5rem",
                      }}
                    >
                      {t("ContractInvoicesPage.view")}
                    </button>
                    <button
                      onClick={() => handleOpenEdit(inv)}
                      style={{
                        background: "transparent",
                        border: "1px solid var(--border)",
                        padding: "0.3rem 0.6rem",
                        borderRadius: "4px",
                        cursor: "pointer",
                        color: "var(--text)",
                        fontSize: "0.8rem",
                      }}
                    >
                      {t("ContractInvoicesPage.edit")}
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--card)] md:hidden">
        {filteredInvoices?.length === 0 ? (
          <div className="px-4 py-12 text-center text-sm text-[var(--muted)]">
            {emptyMessage}
          </div>
        ) : (
          <div className="divide-y divide-[var(--border)]">
            {filteredInvoices.map((inv) => (
              <article key={inv.id} className="grid gap-4 p-4">
                <div className="flex min-w-0 items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h3 className="break-words text-base font-semibold text-[var(--text)]">
                      {inv.invoice_number}
                    </h3>
                    <p className="mt-1 break-words text-sm text-[var(--muted)]">
                      {inv.project_name || "-"}
                    </p>
                  </div>
                  <span
                    className="inline-flex shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold capitalize text-white"
                    style={{
                      background: STATUS_COLORS[inv.status] || "var(--muted)",
                    }}
                  >
                    {inv.status.replace("_", " ")}
                  </span>
                </div>

                <dl className="grid grid-cols-1 gap-3 min-[380px]:grid-cols-2">
                  <div>
                    <dt className="text-[11px] font-semibold uppercase tracking-wide text-[var(--muted)]">
                      {t("ContractInvoicesPage.subcontractor")}
                    </dt>
                    <dd className="mt-1 break-words text-sm font-medium text-[var(--text)]">
                      {inv.subcontractor_name || "-"}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-[11px] font-semibold uppercase tracking-wide text-[var(--muted)]">
                      {t("ContractInvoicesPage.date")}
                    </dt>
                    <dd className="mt-1 text-sm font-medium text-[var(--text)]">
                      {formatDate(inv.invoice_date) ||
                        inv.formatted_invoice_date ||
                        inv.invoice_date ||
                        "-"}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-[11px] font-semibold uppercase tracking-wide text-[var(--muted)]">
                      {t("ContractInvoicesPage.dueDate")}
                    </dt>
                    <dd className="mt-1 text-sm font-medium text-[var(--text)]">
                      {formatDate(inv.due_date) ||
                        inv.formatted_due_date ||
                        inv.due_date ||
                        "-"}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-[11px] font-semibold uppercase tracking-wide text-[var(--muted)]">
                      {t("ContractInvoicesPage.amount")}
                    </dt>
                    <dd className="mt-1 text-sm font-bold text-[var(--text)]">
                      {contractCurrency || ""}
                      {Number(inv.amount).toFixed(2)}
                    </dd>
                  </div>
                </dl>

                <div className="flex flex-wrap items-center justify-end gap-2 border-t border-[var(--border)] pt-3">
                  <button
                    type="button"
                    onClick={() => {
                      setViewInvoiceId(inv.id);
                      setIsViewOpen(true);
                    }}
                    className="h-12 rounded-xl border border-[var(--border)] px-4 text-sm font-medium text-[var(--text)]"
                  >
                    {t("ContractInvoicesPage.view")}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleOpenEdit(inv)}
                    className="h-12 rounded-xl border border-[var(--border)] px-4 text-sm font-medium text-[var(--text)]"
                  >
                    {t("ContractInvoicesPage.edit")}
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>

      {isModalOpen && (
        <InvoiceFormModal
          invoice={selectedInvoice}
          contractID={contractID}
          onClose={handleCloseModal}
          onSuccess={handleSuccess}
        />
      )}

      {isViewOpen && (
        <ContractInvoiceDetails
          id={viewInvoiceId}
          currency={contractCurrency}
          onClose={() => {
            setIsViewOpen(false);
            setViewInvoiceId(null);
          }}
        />
      )}
    </div>
  );
}

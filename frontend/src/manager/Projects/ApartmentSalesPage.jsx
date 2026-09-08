import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { AlertCircle, Building2, CreditCard, Eye, FilterX, Loader2, Plus, ReceiptText, WalletCards, X } from "lucide-react";

import instance from "../../api/axiosInstance";
import { useAuth } from "../../auth/AuthContext";
import PermissionWrapper from "../../auth/PermissionWrapper";
import { APARTMENT_MANAGEMENT_PERMISSIONS, hasAnyPermission } from "../../auth/roles";
import CalendarDatePicker from "../../components/common/CalendarDatePicker";
import Button from "../../components/ui/Button";
import { useLanguage } from "../../hooks/useLanguage";
import ApartmentSalesPanel from "./ApartmentSalesPanel";

const listData = (response) => response?.data?.results || response?.data || [];
const fieldClass =
  "min-h-11 w-full rounded-lg border border-[var(--border)] bg-[var(--bg)] px-3 py-2 text-sm text-[var(--text)] outline-none focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary)]/20";
const emptyFilters = {
  project: "",
  building: "",
  paymentStatus: "",
  customer: "",
  apartment: "",
  date: "",
};

function amount(value) {
  return Number(value || 0).toLocaleString(undefined, { maximumFractionDigits: 2 });
}

function uniqueOptions(items, idKey, labelKey) {
  const options = new Map();
  items.forEach((item) => {
    if (item[idKey] !== null && item[idKey] !== undefined) {
      options.set(String(item[idKey]), item[labelKey] || String(item[idKey]));
    }
  });
  return [...options.entries()].map(([value, label]) => ({ value, label }));
}

function StatusBadge({ status, text }) {
  const colors = status === "PAID"
    ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
    : status === "PARTIALLY_PAID"
      ? "bg-amber-500/10 text-amber-700 dark:text-amber-400"
      : "bg-red-500/10 text-red-700 dark:text-red-400";
  return (
    <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${colors}`}>
      {text(status, status?.replaceAll("_", " ") || "—")}
    </span>
  );
}

function CurrencySummary({ currency, values, text }) {
  return (
    <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-4 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[var(--primary)]/10 text-[var(--primary)]">
            <WalletCards className="h-4 w-4" />
          </span>
          <div>
            <p className="text-xs text-[var(--muted)]">{text("currency", "Currency")}</p>
            <p className="font-bold text-[var(--text)]">{currency}</p>
          </div>
        </div>
        <span className="rounded-full bg-[var(--hover)] px-2.5 py-1 text-xs font-semibold text-[var(--muted)]">{values.count}</span>
      </div>
      <div className="mt-4 grid grid-cols-3 gap-2 border-t border-[var(--border)] pt-3 text-xs">
        <div><p className="text-[var(--muted)]">{text("soldAmount", "Sold")}</p><p className="mt-1 font-bold tabular-nums text-[var(--text)]">{amount(values.sold)}</p></div>
        <div><p className="text-[var(--muted)]">{text("received", "Received")}</p><p className="mt-1 font-bold tabular-nums text-emerald-600">{amount(values.paid)}</p></div>
        <div><p className="text-[var(--muted)]">{text("remaining", "Remaining")}</p><p className="mt-1 font-bold tabular-nums text-[var(--danger)]">{amount(values.remaining)}</p></div>
      </div>
      <div className="mt-3 flex items-center justify-between gap-3 border-t border-[var(--border)] pt-3 text-xs">
        <span className="text-[var(--muted)]">{text("cancelledSales", "Cancelled sales")} ({values.cancelledCount})</span>
        <span className="font-bold tabular-nums text-[var(--danger)]">{amount(values.cancelled)}</span>
      </div>
    </div>
  );
}

export default function ApartmentSalesPage({ outstandingOnly = false }) {
  const location = useLocation();
  const { permissions = [] } = useAuth();
  const { t, lang } = useLanguage();
  const text = (key, fallback) => {
    const translated = t(`ApartmentSalesReport.${key}`);
    return translated === `ApartmentSalesReport.${key}` ? fallback : translated;
  };
  const saleText = (key, fallback) => {
    const translated = t(`ApartmentSales.${key}`);
    return translated === `ApartmentSales.${key}` ? fallback : translated;
  };
  const loadErrorText = text("loadError", "Unable to load apartment sales.");
  const isRTL = lang === "dr" || lang === "ps";
  const [sales, setSales] = useState([]);
  const [filters, setFilters] = useState(emptyFilters);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedSaleId, setSelectedSaleId] = useState("");
  const canViewSales = hasAnyPermission(permissions, ["apartment_sales.view"]);

  const loadSales = useCallback(async () => {
    if (!canViewSales) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError("");
    try {
      const response = await instance.get("/projects/apartment-sales/", {
        params: outstandingOnly ? { outstanding: true } : undefined,
      });
      setSales(listData(response));
    } catch (requestError) {
      setError(requestError.userMessage || loadErrorText);
    } finally {
      setLoading(false);
    }
  }, [canViewSales, loadErrorText, outstandingOnly]);

  useEffect(() => {
    // Initial data loading is the external synchronization performed by this effect.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadSales();
  }, [loadSales]);

  const options = useMemo(() => ({
    projects: uniqueOptions(sales, "project", "project_name"),
    buildings: uniqueOptions(sales, "building", "building_name"),
    customers: uniqueOptions(sales, "customer", "customer_name"),
    apartments: uniqueOptions(sales, "apartment", "apartment_number"),
  }), [sales]);

  const filteredSales = useMemo(() => sales.filter((sale) => (
    (!filters.project || String(sale.project) === filters.project)
    && (!filters.building || String(sale.building) === filters.building)
    && (!filters.paymentStatus || sale.payment_status === filters.paymentStatus)
    && (!filters.customer || String(sale.customer) === filters.customer)
    && (!filters.apartment || String(sale.apartment) === filters.apartment)
    && (!filters.date || sale.sale_date === filters.date)
  )), [filters, sales]);
  const summary = useMemo(() => {
    const values = {
      statuses: { UNPAID: 0, PARTIALLY_PAID: 0, PAID: 0, CANCELLED: 0 },
      currencies: {
        AFN: { count: 0, sold: 0, paid: 0, remaining: 0, cancelledCount: 0, cancelled: 0 },
        USD: { count: 0, sold: 0, paid: 0, remaining: 0, cancelledCount: 0, cancelled: 0 },
      },
    };
    filteredSales.forEach((sale) => {
      if (!values.currencies[sale.currency]) return;
      const currency = values.currencies[sale.currency];
      if (sale.status === "CANCELLED") {
        values.statuses.CANCELLED += 1;
        currency.cancelledCount += 1;
        currency.cancelled += Number(sale.sale_price || 0);
        return;
      }
      if (values.statuses[sale.payment_status] !== undefined) values.statuses[sale.payment_status] += 1;
      currency.count += 1;
      currency.sold += Number(sale.sale_price || 0);
      currency.paid += Number(sale.total_paid || 0);
      currency.remaining += Number(sale.remaining_balance || 0);
    });
    return values;
  }, [filteredSales]);

  const updateFilter = (field, value) => {
    setFilters((current) => ({ ...current, [field]: value }));
  };
  const hasFilters = Object.values(filters).some(Boolean);
  const selectedSale = sales.find((sale) => String(sale.id) === String(selectedSaleId));
  const title = outstandingOnly
    ? text("outstandingTitle", "Outstanding Payments")
    : text("salesTitle", "Apartment Sales");
  const subtitle = outstandingOnly
    ? text("outstandingSubtitle", "Customers with a remaining apartment balance")
    : text("salesSubtitle", "Apartment sales and payment progress");
  const managementPath = location.pathname.startsWith("/data-entry/")
    ? "/data-entry/apartment-management"
    : "/manager/apartment-management";

  if (!canViewSales) {
    return (
      <section dir={isRTL ? "rtl" : "ltr"} className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-6 text-sm text-[var(--muted)]">
        {text("noPermission", "You do not have permission to view apartment sales.")}
      </section>
    );
  }

  return (
    <section dir={isRTL ? "rtl" : "ltr"} className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[var(--primary)]/10 text-[var(--primary)]">
            {outstandingOnly ? <CreditCard className="h-5 w-5" /> : <Building2 className="h-5 w-5" />}
          </div>
          <div>
            <h1 className="text-2xl font-bold text-[var(--text)]">{title}</h1>
            <p className="mt-1 text-sm text-[var(--muted)]">{subtitle}</p>
          </div>
        </div>
        <PermissionWrapper permissions={APARTMENT_MANAGEMENT_PERMISSIONS}>
          <Link
            to={managementPath}
            className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg bg-[var(--primary)] px-4 py-2 text-sm font-semibold text-white transition hover:opacity-90 focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)]/35"
          >
            <Plus className="h-4 w-4" />
            {text("manageApartments", "Manage Apartments / Sell Apartment")}
          </Link>
        </PermissionWrapper>
      </div>

      <div className="grid gap-3 lg:grid-cols-3">
        <div className="rounded-2xl border border-[var(--border)] bg-gradient-to-br from-[var(--primary)]/10 via-[var(--card)] to-[var(--card)] p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--primary)] text-white shadow-md shadow-[var(--primary)]/20">
              <ReceiptText className="h-5 w-5" />
            </span>
            <div>
              <p className="text-2xl font-bold tabular-nums text-[var(--text)]">{summary.currencies.AFN.count + summary.currencies.USD.count}</p>
              <p className="text-xs text-[var(--muted)]">{text("records", "Active sales records")}</p>
            </div>
          </div>
          <div className="mt-4 grid grid-cols-4 gap-2 border-t border-[var(--border)] pt-3 text-center text-xs">
            <div><p className="font-bold text-red-600">{summary.statuses.UNPAID}</p><p className="mt-0.5 text-[var(--muted)]">{saleText("UNPAID", "Unpaid")}</p></div>
            <div><p className="font-bold text-amber-600">{summary.statuses.PARTIALLY_PAID}</p><p className="mt-0.5 text-[var(--muted)]">{saleText("PARTIALLY_PAID", "Partially Paid")}</p></div>
            <div><p className="font-bold text-emerald-600">{summary.statuses.PAID}</p><p className="mt-0.5 text-[var(--muted)]">{saleText("PAID", "Paid")}</p></div>
            <div><p className="font-bold text-[var(--danger)]">{summary.statuses.CANCELLED}</p><p className="mt-0.5 text-[var(--muted)]">{saleText("CANCELLED", "Cancelled")}</p></div>
          </div>
        </div>
        <CurrencySummary currency="AFN" values={summary.currencies.AFN} text={text} />
        <CurrencySummary currency="USD" values={summary.currencies.USD} text={text} />
      </div>

      <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-4 shadow-sm">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
          {[
            ["project", text("project", "Project"), options.projects],
            ["building", text("building", "Building"), options.buildings],
            ["customer", text("customer", "Customer"), options.customers],
            ["apartment", text("apartment", "Apartment"), options.apartments],
          ].map(([field, label, values]) => (
            <label key={field} className="text-sm text-[var(--text)]">
              {label}
              <select
                aria-label={label}
                className={`${fieldClass} mt-1`}
                value={filters[field]}
                onChange={(event) => updateFilter(field, event.target.value)}
              >
                <option value="">{text("all", "All")}</option>
                {values.map((option) => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
            </label>
          ))}
          <label className="text-sm text-[var(--text)]">
            {text("paymentStatus", "Payment Status")}
            <select
              aria-label={text("paymentStatus", "Payment Status")}
              className={`${fieldClass} mt-1`}
              value={filters.paymentStatus}
              onChange={(event) => updateFilter("paymentStatus", event.target.value)}
            >
              <option value="">{text("all", "All")}</option>
              <option value="UNPAID">{saleText("UNPAID", "Unpaid")}</option>
              <option value="PARTIALLY_PAID">{saleText("PARTIALLY_PAID", "Partially Paid")}</option>
              {!outstandingOnly && <option value="PAID">{saleText("PAID", "Paid")}</option>}
              {!outstandingOnly && <option value="CANCELLED">{saleText("CANCELLED", "Cancelled")}</option>}
            </select>
          </label>
          <CalendarDatePicker
            label={text("date", "Date")}
            name="sale_date_filter"
            module="projects"
            value={filters.date}
            onChange={(value) => updateFilter("date", value || "")}
          />
        </div>
        {hasFilters && (
          <div className="mt-3 flex justify-end">
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setFilters(emptyFilters)}
              leftIcon={<FilterX className="h-4 w-4" />}
            >
              {text("clearFilters", "Clear filters")}
            </Button>
          </div>
        )}
      </div>

      <div className="overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--card)] shadow-sm">
        {loading ? (
          <div className="flex min-h-56 items-center justify-center gap-2 text-sm text-[var(--muted)]">
            <Loader2 className="h-5 w-5 animate-spin" /> {text("loading", "Loading sales…")}
          </div>
        ) : error ? (
          <div className="flex min-h-56 flex-col items-center justify-center gap-3 p-6 text-center">
            <AlertCircle className="h-8 w-8 text-[var(--danger)]" />
            <p className="text-sm text-[var(--text)]">{error}</p>
            <Button size="sm" variant="secondary" onClick={loadSales}>{text("retry", "Retry")}</Button>
          </div>
        ) : !filteredSales.length ? (
          <div className="flex min-h-56 flex-col items-center justify-center p-6 text-center">
            <Building2 className="h-9 w-9 text-[var(--muted)]" />
            <p className="mt-3 font-medium text-[var(--text)]">
              {outstandingOnly
                ? text("noOutstanding", "No outstanding apartment payments.")
                : text("noSales", "No apartment sales found.")}
            </p>
            <p className="mt-1 text-sm text-[var(--muted)]">
              {hasFilters ? text("adjustFilters", "Try clearing or changing the filters.") : text("recordsAppear", "Recorded sales will appear here.")}
            </p>
          </div>
        ) : (
          <>
            <div className="divide-y divide-[var(--border)] md:hidden">
              {filteredSales.map((sale) => (
                <article key={sale.id} className="space-y-3 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold text-[var(--text)]">{sale.apartment_number}</p>
                      <p className="text-xs text-[var(--muted)]">{sale.building_name} · {text("floor", "Floor")} {sale.floor_number}</p>
                    </div>
                    {!outstandingOnly && <StatusBadge status={sale.status === "CANCELLED" ? "CANCELLED" : sale.payment_status} text={saleText} />}
                  </div>
                  <p className="text-sm text-[var(--text)]">{sale.customer_name}</p>
                  <div className="grid grid-cols-3 gap-2 text-xs">
                    <div><p className="text-[var(--muted)]">{text("salePrice", "Sale Price")}</p><p className="font-medium text-[var(--text)]">{sale.currency} {amount(sale.sale_price)}</p></div>
                    <div><p className="text-[var(--muted)]">{text("paid", "Paid")}</p><p className="font-medium text-emerald-600">{sale.currency} {amount(sale.total_paid)}</p></div>
                    <div><p className="text-[var(--muted)]">{text("remaining", "Remaining")}</p><p className="font-medium text-[var(--danger)]">{sale.currency} {amount(sale.remaining_balance)}</p></div>
                  </div>
                  <p className="text-xs text-[var(--muted)]">{sale.sale_date}</p>
                  <Button size="sm" variant="secondary" onClick={() => setSelectedSaleId(String(sale.id))} leftIcon={<Eye className="h-4 w-4" />}>
                    {text("viewDetails", "View Details")}
                  </Button>
                </article>
              ))}
            </div>

            <div className="hidden overflow-x-auto md:block">
              <table className={`w-full text-sm ${outstandingOnly ? "min-w-[850px]" : "min-w-[1120px]"}`}>
                <thead>
                  <tr className="border-b border-[var(--border)] bg-[var(--hover)] text-xs text-[var(--muted)]">
                    <th className="p-3 text-start">{text("apartment", "Apartment")}</th>
                    {!outstandingOnly && <th className="p-3 text-start">{text("building", "Building")}</th>}
                    {!outstandingOnly && <th className="p-3 text-start">{text("floor", "Floor")}</th>}
                    <th className="p-3 text-start">{text("customer", "Customer")}</th>
                    <th className="p-3 text-end">{text("salePrice", "Sale Price")}</th>
                    {!outstandingOnly && <th className="p-3 text-start">{text("currency", "Currency")}</th>}
                    <th className="p-3 text-end">{text("paid", outstandingOnly ? "Paid" : "Total Paid")}</th>
                    <th className="p-3 text-end">{text("remaining", "Remaining")}</th>
                    {outstandingOnly && <th className="p-3 text-start">{text("currency", "Currency")}</th>}
                    {!outstandingOnly && <th className="p-3 text-start">{text("paymentStatus", "Payment Status")}</th>}
                    <th className="p-3 text-start">{text("saleDate", "Sale Date")}</th>
                    <th className="p-3 text-end">{text("actions", "Actions")}</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredSales.map((sale) => (
                    <tr key={sale.id} className="border-b border-[var(--border)] last:border-0 hover:bg-[var(--hover)]/60">
                      <td className="p-3 font-medium text-[var(--text)]">{sale.apartment_number}</td>
                      {!outstandingOnly && <td className="p-3 text-[var(--text)]">{sale.building_name}</td>}
                      {!outstandingOnly && <td className="p-3 text-[var(--muted)]">{sale.floor_number}</td>}
                      <td className="p-3 text-[var(--text)]"><span className="font-medium">{sale.customer_name}</span>{sale.customer_phone && <span className="block text-xs text-[var(--muted)]">{sale.customer_phone}</span>}</td>
                      <td className="p-3 text-end tabular-nums text-[var(--text)]">{amount(sale.sale_price)}</td>
                      {!outstandingOnly && <td className="p-3 text-[var(--muted)]">{sale.currency}</td>}
                      <td className="p-3 text-end tabular-nums text-emerald-600">{amount(sale.total_paid)}</td>
                      <td className="p-3 text-end tabular-nums font-semibold text-[var(--danger)]">{amount(sale.remaining_balance)}</td>
                      {outstandingOnly && <td className="p-3 text-[var(--muted)]">{sale.currency}</td>}
                      {!outstandingOnly && <td className="p-3"><StatusBadge status={sale.status === "CANCELLED" ? "CANCELLED" : sale.payment_status} text={saleText} /></td>}
                      <td className="p-3 text-[var(--muted)]">{sale.sale_date}</td>
                      <td className="p-3 text-end">
                        <Button size="sm" variant="ghost" onClick={() => setSelectedSaleId(String(sale.id))} leftIcon={<Eye className="h-4 w-4" />}>
                          {text("viewDetails", "View Details")}
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>

      {selectedSale && (
        <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-4 shadow-sm sm:p-5">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="font-semibold text-[var(--text)]">{text("saleDetails", "Sale Details")}</h2>
              <p className="text-sm text-[var(--muted)]">{selectedSale.project_name} · {selectedSale.apartment_number}</p>
            </div>
            <button type="button" aria-label={text("closeDetails", "Close sale details")} onClick={() => setSelectedSaleId("")} className="rounded-lg p-2 text-[var(--muted)] hover:bg-[var(--hover)]">
              <X className="h-4 w-4" />
            </button>
          </div>
          <ApartmentSalesPanel
            key={selectedSale.id}
            apartment={{
              id: selectedSale.apartment,
              apartment_number: selectedSale.apartment_number,
              status: selectedSale.status === "CANCELLED" ? "AVAILABLE" : "SOLD",
            }}
            customers={[]}
            sale={selectedSale}
            project={{ id: selectedSale.project, budget_currency: selectedSale.currency }}
            onRefresh={loadSales}
          />
        </div>
      )}
    </section>
  );
}

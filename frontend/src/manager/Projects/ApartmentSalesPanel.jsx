import { useEffect, useState } from "react";
import { Ban, CreditCard, Loader2, Pencil, Plus, Printer, ShoppingCart, Trash2, X } from "lucide-react";
import toast from "react-hot-toast";

import instance from "../../api/axiosInstance";
import PermissionWrapper from "../../auth/PermissionWrapper";
import CalendarDatePicker from "../../components/common/CalendarDatePicker";
import Modal from "../../components/common/Modal";
import PrintableReceiptModal from "../../components/common/PrintableReceiptModal";
import Button from "../../components/ui/Button";
import { useLanguage } from "../../hooks/useLanguage";

const fieldClass =
  "min-h-11 w-full rounded-lg border border-[var(--border)] bg-[var(--bg)] px-3 py-2 text-sm text-[var(--text)] outline-none focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary)]/20";

const blankSale = (currency) => ({
  customer: "",
  sale_date: "",
  sale_price: "",
  currency: currency || "AFN",
  notes: "",
});
const blankPayment = (currency) => ({
  amount: "",
  currency: currency || "AFN",
  payment_date: "",
  payment_method: "CASH",
  reference: "",
  notes: "",
});
const blankCustomer = () => ({ name: "", phone: "", email: "", address: "", notes: "" });

function useFormDraft(storageKey, initialFactory, isEmpty) {
  const [draft, setDraft] = useState(() => {
    try {
      const saved = sessionStorage.getItem(storageKey);
      return saved ? JSON.parse(saved) : initialFactory();
    } catch {
      return initialFactory();
    }
  });

  useEffect(() => {
    try {
      if (isEmpty(draft)) sessionStorage.removeItem(storageKey);
      else sessionStorage.setItem(storageKey, JSON.stringify(draft));
    } catch {
      // In-memory state still preserves the open workflow.
    }
  }, [draft, isEmpty, storageKey]);

  const clear = () => {
    try {
      sessionStorage.removeItem(storageKey);
    } catch {
      // Ignore unavailable browser storage.
    }
    setDraft(initialFactory());
  };
  return [draft, setDraft, clear];
}

const saleIsEmpty = (draft) =>
  !draft.customer &&
  !draft.sale_date &&
  !draft.sale_price &&
  !draft.notes;
const paymentIsEmpty = (draft) =>
  !draft.amount &&
  !draft.payment_date &&
  !draft.reference &&
  !draft.notes;

const firstError = (value) => {
  if (Array.isArray(value)) return firstError(value[0]);
  if (value && typeof value === "object") return firstError(Object.values(value)[0]);
  return value ? String(value) : "";
};

function ErrorText({ value }) {
  const message = firstError(value);
  return message ? <p className="mt-1 text-xs text-[var(--danger)]">{message}</p> : null;
}

function formatMoney(amount, currency) {
  const value = Number(amount || 0).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return `${currency || ""} ${value}`.trim();
}

function Money({ amount, currency }) {
  return <>{formatMoney(amount, currency)}</>;
}

export default function ApartmentSalesPanel({ apartment, customers, sale, project, onRefresh }) {
  const { t } = useLanguage();
  const text = (key, fallback) => {
    const translated = t(`ApartmentSales.${key}`);
    return translated === `ApartmentSales.${key}` ? fallback : translated;
  };
  const [saleOpen, setSaleOpen] = useState(false);
  const [paymentOpen, setPaymentOpen] = useState(false);
  const [customerOpen, setCustomerOpen] = useState(false);
  const [customerForm, setCustomerForm] = useState(blankCustomer);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});
  const [invoiceOpen, setInvoiceOpen] = useState(false);
  const [receiptPayment, setReceiptPayment] = useState(null);
  const [cancelOpen, setCancelOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState("");

  const [saleDraft, setSaleDraft, clearSaleDraft] = useFormDraft(
    `cms.apartment-sale.${apartment.id}`,
    () => blankSale(project.budget_currency),
    saleIsEmpty,
  );
  const [paymentDraft, setPaymentDraft, clearPaymentDraft] = useFormDraft(
    `cms.apartment-payment.${sale?.id || `apartment-${apartment.id}`}`,
    () => blankPayment(sale?.currency || project.budget_currency),
    paymentIsEmpty,
  );

  const updateSale = (field, value) => setSaleDraft((current) => ({ ...current, [field]: value }));
  const updatePayment = (field, value) => setPaymentDraft((current) => ({ ...current, [field]: value }));

  const beginEdit = () => {
    setSaleDraft({
      customer: String(sale.customer),
      sale_date: sale.sale_date,
      sale_price: sale.sale_price,
      currency: sale.currency,
      notes: sale.notes || "",
    });
    setErrors({});
    setSaleOpen(true);
  };

  const saveCustomer = async (event) => {
    event.preventDefault();
    if (!customerForm.name.trim()) return;
    setSaving(true);
    setErrors({});
    try {
      const response = await instance.post("/projects/apartment-customers/", {
        project: project.id,
        ...customerForm,
      });
      updateSale("customer", String(response.data.id));
      setCustomerForm(blankCustomer());
      setCustomerOpen(false);
      await onRefresh();
      toast.success(text("customerSaved", "Customer saved."));
    } catch (error) {
      setErrors(error?.response?.data?.errors || {});
    } finally {
      setSaving(false);
    }
  };

  const submitSale = async (event) => {
    event.preventDefault();
    setSaving(true);
    setErrors({});
    try {
      const payload = {
        customer: Number(saleDraft.customer),
        sale_date: saleDraft.sale_date,
        sale_price: saleDraft.sale_price,
        currency: saleDraft.currency,
        notes: saleDraft.notes,
      };
      if (sale) {
        await instance.patch(`/projects/apartment-sales/${sale.id}/`, payload);
      } else {
        await instance.post("/projects/apartment-sales/", {
          apartment: apartment.id,
          ...payload,
        });
      }
      clearSaleDraft();
      setSaleOpen(false);
      await onRefresh();
      toast.success(sale
        ? text("saleUpdated", "Apartment sale updated.")
        : text("saleRecorded", "Apartment sale recorded."));
    } catch (error) {
      setErrors(error?.response?.data?.errors || {});
    } finally {
      setSaving(false);
    }
  };

  const submitPayment = async (event) => {
    event.preventDefault();
    setSaving(true);
    setErrors({});
    try {
      await instance.post("/projects/apartment-payments/", {
        sale: sale.id,
        customer: sale.customer,
        amount: paymentDraft.amount,
        currency: sale.currency,
        payment_date: paymentDraft.payment_date,
        payment_method: paymentDraft.payment_method,
        reference: paymentDraft.reference,
        notes: paymentDraft.notes,
      });
      clearPaymentDraft();
      setPaymentOpen(false);
      await onRefresh();
      toast.success(text("paymentRecorded", "Payment recorded."));
    } catch (error) {
      setErrors(error?.response?.data?.errors || {});
    } finally {
      setSaving(false);
    }
  };

  const cancelSale = async (event) => {
    event?.preventDefault();
    if (!cancelReason.trim()) {
      setErrors({ cancellation_reason: [text("cancellationReasonRequired", "Cancellation reason is required.")] });
      return;
    }
    setSaving(true);
    setErrors({});
    try {
      await instance.post(`/projects/apartment-sales/${sale.id}/cancel/`, {
        reason: cancelReason.trim(),
      });
      setCancelOpen(false);
      setCancelReason("");
      setPaymentOpen(false);
      setSaleOpen(false);
      await onRefresh();
      toast.success(text("saleCancelled", "Apartment sale cancelled."));
    } catch (error) {
      setErrors(error?.response?.data?.errors || {});
    } finally {
      setSaving(false);
    }
  };

  if (!sale && apartment.status !== "AVAILABLE") return null;

  if (!sale) {
    return (
      <div className="mt-4 border-t border-[var(--border)] pt-4">
        {!saleOpen ? (
          <PermissionWrapper permissions={["apartment_sales.create"]}>
            <Button onClick={() => setSaleOpen(true)} leftIcon={<ShoppingCart className="h-4 w-4" />}>
              {text("sellApartment", "Sell Apartment")}
            </Button>
          </PermissionWrapper>
        ) : (
          <form onSubmit={submitSale} aria-label={text("sellApartment", "Sell Apartment")} className="space-y-4 rounded-xl border border-[var(--primary)]/30 bg-[var(--card)] p-4">
            <div className="flex items-center justify-between gap-3">
              <h5 className="font-semibold text-[var(--text)]">{text("sellApartment", "Sell Apartment")}</h5>
              <button type="button" aria-label={text("closeSale", "Close sale form")} onClick={() => setSaleOpen(false)} className="rounded-lg p-2 text-[var(--muted)]"><X className="h-4 w-4" /></button>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="text-sm text-[var(--text)]">
                {text("customer", "Customer")}
                <select required className={`${fieldClass} mt-1`} value={saleDraft.customer} onChange={(event) => updateSale("customer", event.target.value)}>
                  <option value="">{text("selectCustomer", "Select a customer")}</option>
                  {customers.map((customer) => <option key={customer.id} value={customer.id}>{customer.name}{customer.phone ? ` — ${customer.phone}` : ""}</option>)}
                </select>
                <ErrorText value={errors.customer} />
              </label>
              <CalendarDatePicker label={text("saleDate", "Sale date")} name="sale_date" module="projects" required value={saleDraft.sale_date} onChange={(value) => updateSale("sale_date", value)} error={firstError(errors.sale_date)} />
              <label className="text-sm text-[var(--text)]">{text("salePrice", "Sale price")}<input required min="0.01" step="0.01" type="number" className={`${fieldClass} mt-1`} value={saleDraft.sale_price} onChange={(event) => updateSale("sale_price", event.target.value)} /><ErrorText value={errors.sale_price} /></label>
              <label className="text-sm text-[var(--text)]">{text("currency", "Currency")}<select required className={`${fieldClass} mt-1`} value={saleDraft.currency} onChange={(event) => updateSale("currency", event.target.value)}><option value="AFN">AFN</option><option value="USD">USD</option></select><ErrorText value={errors.currency} /></label>
              <label className="text-sm text-[var(--text)] sm:col-span-2">{text("notes", "Notes")}<textarea rows="2" className={`${fieldClass} mt-1`} value={saleDraft.notes} onChange={(event) => updateSale("notes", event.target.value)} /></label>
            </div>
            <ErrorText value={errors.apartment || errors.non_field_errors} />
            <div className="flex flex-wrap items-center justify-between gap-2">
              <Button variant="secondary" onClick={() => setCustomerOpen((value) => !value)} leftIcon={<Plus className="h-4 w-4" />}>{text("newCustomer", "New Customer")}</Button>
              <div className="flex flex-wrap gap-2"><Button variant="ghost" onClick={() => { clearSaleDraft(); setErrors({}); }}>{text("discardDraft", "Discard Draft")}</Button><Button type="submit" disabled={saving} leftIcon={saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}>{text("confirmSale", "Confirm Sale")}</Button></div>
            </div>
          </form>
        )}

        {customerOpen && saleOpen && (
          <form onSubmit={saveCustomer} aria-label={text("newCustomer", "New Customer")} className="mt-3 grid gap-3 rounded-xl border border-[var(--border)] bg-[var(--bg)] p-4 sm:grid-cols-2">
            <label className="text-sm text-[var(--text)]">{text("customerName", "Customer name")}<input required autoFocus className={`${fieldClass} mt-1`} value={customerForm.name} onChange={(event) => setCustomerForm((current) => ({ ...current, name: event.target.value }))} /></label>
            <label className="text-sm text-[var(--text)]">{text("phone", "Phone")}<input className={`${fieldClass} mt-1`} value={customerForm.phone} onChange={(event) => setCustomerForm((current) => ({ ...current, phone: event.target.value }))} /></label>
            <label className="text-sm text-[var(--text)]">{text("email", "Email")}<input type="email" className={`${fieldClass} mt-1`} value={customerForm.email} onChange={(event) => setCustomerForm((current) => ({ ...current, email: event.target.value }))} /></label>
            <label className="text-sm text-[var(--text)]">{text("address", "Address")}<input className={`${fieldClass} mt-1`} value={customerForm.address} onChange={(event) => setCustomerForm((current) => ({ ...current, address: event.target.value }))} /></label>
            <label className="text-sm text-[var(--text)] sm:col-span-2">{text("notes", "Notes")}<textarea rows="2" className={`${fieldClass} mt-1`} value={customerForm.notes} onChange={(event) => setCustomerForm((current) => ({ ...current, notes: event.target.value }))} /></label>
            <div className="flex gap-2 sm:col-span-2 sm:justify-end"><Button variant="ghost" onClick={() => setCustomerOpen(false)}>{text("close", "Close")}</Button><Button type="submit" disabled={saving}>{text("saveCustomer", "Save Customer")}</Button></div>
          </form>
        )}
      </div>
    );
  }

  const isCancelled = sale.status === "CANCELLED";
  const displayStatus = isCancelled ? "CANCELLED" : sale.payment_status;
  const statusColors = isCancelled
    ? "bg-slate-500/10 text-slate-600 dark:text-slate-300"
    : sale.payment_status === "PAID"
    ? "bg-emerald-500/10 text-emerald-600"
    : sale.payment_status === "PARTIALLY_PAID"
      ? "bg-amber-500/10 text-amber-600"
      : "bg-red-500/10 text-red-600";

  return (
    <>
      <div className="mt-4 space-y-4 border-t border-[var(--border)] pt-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h5 className="font-semibold text-[var(--text)]">{text("saleInformation", "Sale Information")}</h5>
          <p className="text-xs text-[var(--muted)]">{sale.reference_number} · {sale.sale_date}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {!isCancelled && (
            <>
              <PermissionWrapper permissions={["apartment_sales.update"]}>
                <Button size="sm" variant="secondary" onClick={beginEdit} leftIcon={<Pencil className="h-4 w-4" />}>
                  {text("editSale", "Edit Sale")}
                </Button>
              </PermissionWrapper>
              <PermissionWrapper permissions={["apartment_sales.cancel"]}>
                <Button size="sm" variant="danger" onClick={() => setCancelOpen(true)} leftIcon={<Ban className="h-4 w-4" />}>
                  {text("cancelSale", "Cancel Sale")}
                </Button>
              </PermissionWrapper>
            </>
          )}
          <PermissionWrapper permissions={["apartment_sales.view"]}>
            <Button
              size="sm"
              variant="secondary"
              onClick={() => setInvoiceOpen(true)}
              leftIcon={<Printer className="h-4 w-4" />}
            >
              {text("printInvoice", "Print Invoice")}
            </Button>
          </PermissionWrapper>
          <span className={`rounded-full px-3 py-1 text-xs font-semibold ${statusColors}`}>{text(displayStatus, displayStatus.replaceAll("_", " "))}</span>
        </div>
      </div>
      {isCancelled && (
        <div className="rounded-lg border border-[var(--danger)]/30 bg-[var(--danger)]/10 p-3 text-sm text-[var(--danger)]">
          <p>{text("cancelledNotice", "This sale is cancelled. It is excluded from all active sales and payment reports.")}</p>
          <p className="mt-2"><span className="font-semibold">{text("cancellationReason", "Cancellation reason")}:</span> {sale.cancellation_reason || "—"}</p>
          {(sale.cancelled_by_name || sale.cancelled_at) && (
            <p className="mt-1 text-xs opacity-80">
              {[sale.cancelled_by_name, sale.cancelled_at].filter(Boolean).join(" · ")}
            </p>
          )}
        </div>
      )}
      {saleOpen && !isCancelled && (
        <form onSubmit={submitSale} aria-label={text("editSale", "Edit Sale")} className="space-y-4 rounded-xl border border-[var(--primary)]/30 bg-[var(--card)] p-4">
          <div className="flex items-center justify-between gap-3">
            <h5 className="font-semibold text-[var(--text)]">{text("editSale", "Edit Sale")}</h5>
            <button type="button" aria-label={text("closeEditSale", "Close edit sale form")} onClick={() => setSaleOpen(false)} className="rounded-lg p-2 text-[var(--muted)]"><X className="h-4 w-4" /></button>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="text-sm text-[var(--text)]">
              {text("customer", "Customer")}
              <select required className={`${fieldClass} mt-1`} value={saleDraft.customer} onChange={(event) => updateSale("customer", event.target.value)}>
                {[...(customers || []), ...(!(customers || []).some((customer) => String(customer.id) === String(sale.customer)) ? [{ id: sale.customer, name: sale.customer_name }] : [])]
                  .map((customer) => <option key={customer.id} value={customer.id}>{customer.name}{customer.phone ? ` — ${customer.phone}` : ""}</option>)}
              </select>
              <ErrorText value={errors.customer} />
            </label>
            <CalendarDatePicker label={text("saleDate", "Sale date")} name="sale_date" module="projects" required value={saleDraft.sale_date} onChange={(value) => updateSale("sale_date", value)} error={firstError(errors.sale_date)} />
            <label className="text-sm text-[var(--text)]">{text("salePrice", "Sale price")}<input required min={sale.total_paid || "0.01"} step="0.01" type="number" className={`${fieldClass} mt-1`} value={saleDraft.sale_price} onChange={(event) => updateSale("sale_price", event.target.value)} /><ErrorText value={errors.sale_price} /></label>
            <label className="text-sm text-[var(--text)]">{text("currency", "Currency")}<select required className={`${fieldClass} mt-1`} value={saleDraft.currency} onChange={(event) => updateSale("currency", event.target.value)}><option value="AFN">AFN</option><option value="USD">USD</option></select><ErrorText value={errors.currency} /></label>
            <label className="text-sm text-[var(--text)] sm:col-span-2">{text("notes", "Notes")}<textarea rows="2" className={`${fieldClass} mt-1`} value={saleDraft.notes} onChange={(event) => updateSale("notes", event.target.value)} /></label>
          </div>
          <ErrorText value={errors.status || errors.apartment || errors.non_field_errors} />
          <div className="flex justify-end gap-2"><Button variant="ghost" onClick={() => setSaleOpen(false)}>{text("close", "Close")}</Button><Button type="submit" disabled={saving} leftIcon={saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}>{text("saveChanges", "Save Changes")}</Button></div>
        </form>
      )}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <div className="rounded-lg bg-[var(--card)] p-3"><p className="text-xs text-[var(--muted)]">{text("salePrice", "Sale Price")}</p><p className="font-semibold text-[var(--text)]"><Money amount={sale.sale_price} currency={sale.currency} /></p></div>
        <div className="rounded-lg bg-[var(--card)] p-3"><p className="text-xs text-[var(--muted)]">{text("totalPaid", "Total Paid")}</p><p className="font-semibold text-emerald-600"><Money amount={sale.total_paid} currency={sale.currency} /></p></div>
        <div className="rounded-lg bg-[var(--card)] p-3"><p className="text-xs text-[var(--muted)]">{text("remaining", "Remaining")}</p><p className="font-semibold text-[var(--text)]"><Money amount={sale.remaining_balance} currency={sale.currency} /></p></div>
        <div className="rounded-lg bg-[var(--card)] p-3"><p className="text-xs text-[var(--muted)]">{text("customer", "Customer")}</p><p className="font-semibold text-[var(--text)]">{sale.customer_name}</p><p className="text-xs text-[var(--muted)]">{sale.customer_phone || sale.customer_email || "—"}</p></div>
        <div className="rounded-lg bg-[var(--card)] p-3"><p className="text-xs text-[var(--muted)]">{text("saleDate", "Sale date")}</p><p className="font-semibold text-[var(--text)]">{sale.sale_date}</p></div>
        <div className="rounded-lg bg-[var(--card)] p-3"><p className="text-xs text-[var(--muted)]">{text("currency", "Currency")}</p><p className="font-semibold text-[var(--text)]">{sale.currency}</p></div>
      </div>
      {sale.notes && <p className="rounded-lg bg-[var(--card)] p-3 text-sm text-[var(--text)]">{sale.notes}</p>}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <h5 className="font-semibold text-[var(--text)]">{text("paymentHistory", "Payment History")}</h5>
        {!isCancelled && Number(sale.remaining_balance) > 0 && (
          <PermissionWrapper permissions={["apartment_payments.create"]}>
            <Button size="sm" onClick={() => setPaymentOpen(true)} leftIcon={<CreditCard className="h-4 w-4" />}>{text("recordPayment", "Record Payment")}</Button>
          </PermissionWrapper>
        )}
      </div>

      {paymentOpen && (
        <form onSubmit={submitPayment} aria-label={text("recordPayment", "Record Payment")} className="space-y-3 rounded-xl border border-[var(--primary)]/30 bg-[var(--card)] p-4">
          <div className="flex items-center justify-between"><h6 className="font-medium text-[var(--text)]">{text("recordPayment", "Record Payment")}</h6><button type="button" aria-label={text("closePayment", "Close payment form")} onClick={() => setPaymentOpen(false)} className="rounded-lg p-2 text-[var(--muted)]"><X className="h-4 w-4" /></button></div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <label className="text-sm text-[var(--text)]">{text("amount", "Amount")}<input required min="0.01" max={sale.remaining_balance} step="0.01" type="number" className={`${fieldClass} mt-1`} value={paymentDraft.amount} onChange={(event) => updatePayment("amount", event.target.value)} /><ErrorText value={errors.amount} /></label>
            <label className="text-sm text-[var(--text)]">{text("currency", "Currency")}<input readOnly className={`${fieldClass} mt-1 opacity-70`} value={sale.currency} /></label>
            <CalendarDatePicker label={text("paymentDate", "Payment date")} name="payment_date" module="projects" required value={paymentDraft.payment_date} onChange={(value) => updatePayment("payment_date", value)} error={firstError(errors.payment_date)} />
            <label className="text-sm text-[var(--text)]">{text("method", "Payment method")}<select required className={`${fieldClass} mt-1`} value={paymentDraft.payment_method} onChange={(event) => updatePayment("payment_method", event.target.value)}><option value="CASH">{text("cash", "Cash")}</option><option value="BANK_TRANSFER">{text("bankTransfer", "Bank Transfer")}</option><option value="CHEQUE">{text("cheque", "Cheque")}</option><option value="OTHER">{text("other", "Other")}</option></select></label>
            <label className="text-sm text-[var(--text)]">{text("reference", "Reference") }<input className={`${fieldClass} mt-1`} value={paymentDraft.reference} onChange={(event) => updatePayment("reference", event.target.value)} /></label>
            <label className="text-sm text-[var(--text)] sm:col-span-2 lg:col-span-3">{text("notes", "Notes")}<textarea rows="2" className={`${fieldClass} mt-1`} value={paymentDraft.notes} onChange={(event) => updatePayment("notes", event.target.value)} /></label>
          </div>
          <ErrorText value={errors.customer || errors.currency || errors.sale || errors.non_field_errors} />
          <div className="flex flex-wrap justify-end gap-2"><Button variant="ghost" onClick={() => { clearPaymentDraft(); setErrors({}); }} leftIcon={<Trash2 className="h-4 w-4" />}>{text("discardDraft", "Discard Draft")}</Button><Button type="submit" disabled={saving} leftIcon={saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}>{text("recordPayment", "Record Payment")}</Button></div>
        </form>
      )}

      <PermissionWrapper permissions={["apartment_payments.view"]}>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[780px] text-start text-sm">
            <thead><tr className="border-b border-[var(--border)] text-xs text-[var(--muted)]"><th className="p-2">{text("receiptNumber", "Receipt")}</th><th className="p-2">{text("paymentDate", "Date")}</th><th className="p-2">{text("amount", "Amount")}</th><th className="p-2">{text("method", "Method")}</th><th className="p-2">{text("reference", "Reference")}</th><th className="p-2 text-end">{text("actions", "Actions")}</th></tr></thead>
            <tbody>{(sale.payments || []).map((payment) => <tr key={payment.id} className="border-b border-[var(--border)]"><td className="p-2 font-medium text-[var(--text)]">{payment.receipt_number}</td><td className="p-2 text-[var(--muted)]">{payment.payment_date}</td><td className="p-2 text-[var(--text)]"><Money amount={payment.amount} currency={payment.currency} /></td><td className="p-2 text-[var(--muted)]">{payment.payment_method_display || payment.payment_method.replaceAll("_", " ")}</td><td className="p-2 text-[var(--muted)]">{payment.reference || "—"}</td><td className="p-2 text-end"><button type="button" onClick={() => setReceiptPayment(payment)} className="inline-flex h-8 items-center gap-1.5 rounded-md border border-[var(--border)] bg-[var(--card)] px-2.5 text-xs font-semibold text-[var(--text)] transition hover:border-[var(--primary)]/30 hover:bg-[var(--hover)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)]/30"><Printer className="h-3.5 w-3.5" />{text("printReceipt", "Print Receipt")}</button></td></tr>)}</tbody>
          </table>
          {!sale.payments?.length && <p className="py-5 text-center text-sm text-[var(--muted)]">{text("noPayments", "No payments recorded.")}</p>}
        </div>
      </PermissionWrapper>
      </div>

      {invoiceOpen && (
        <PrintableReceiptModal
          isOpen
          onClose={() => setInvoiceOpen(false)}
          title={text("saleInvoice", "Sale Invoice")}
          subtitle={text("invoiceSubtitle", "Apartment sale invoice")}
          numberLabel={text("invoiceNumber", "Invoice No.")}
          receiptNumber={sale.reference_number}
          receiptDate={sale.sale_date}
          status={text(
            sale.payment_status,
            sale.payment_status.replaceAll("_", " "),
          )}
          amountLabel={text("salePrice", "Sale Price")}
          amount={sale.sale_price}
          currency={sale.currency}
          details={[
            {
              label: text("project", "Project"),
              value: sale.project_name || project.name || "—",
            },
            {
              label: text("customer", "Customer"),
              value: sale.customer_name || "—",
            },
            {
              label: text("phone", "Phone"),
              value: sale.customer_phone || "—",
            },
            {
              label: text("email", "Email"),
              value: sale.customer_email || "—",
            },
            {
              label: text("address", "Address"),
              value: sale.customer_address || "—",
            },
            {
              label: text("saleDate", "Sale Date"),
              value: sale.sale_date,
            },
          ]}
          sections={[
            {
              title: text("propertyDetails", "Property Details"),
              rows: [
                {
                  label: text("building", "Building"),
                  value: sale.building_name || apartment.building_name || "—",
                },
                {
                  label: text("floor", "Floor"),
                  value: sale.floor_number ?? apartment.floor_number ?? "—",
                },
                {
                  label: text("apartment", "Apartment"),
                  value: sale.apartment_number || apartment.apartment_number || "—",
                },
                {
                  label: text("apartmentType", "Apartment Type"),
                  value: sale.apartment_type || apartment.apartment_type || "—",
                },
                {
                  label: text("area", "Area"),
                  value:
                    sale.apartment_area || apartment.area
                      ? `${sale.apartment_area || apartment.area} m²`
                      : "—",
                },
                {
                  label: text("bedrooms", "Bedrooms"),
                  value:
                    sale.apartment_bedrooms ?? apartment.bedrooms ?? "—",
                },
                {
                  label: text("description", "Description"),
                  value:
                    sale.apartment_description ||
                    apartment.description ||
                    "—",
                },
              ],
            },
            {
              title: text("financialSummary", "Financial Summary"),
              rows: [
                {
                  label: text("salePrice", "Sale Price"),
                  value: formatMoney(sale.sale_price, sale.currency),
                },
                {
                  label: text("totalPaid", "Total Paid"),
                  value: formatMoney(sale.total_paid, sale.currency),
                },
                {
                  label: text("remaining", "Remaining"),
                  value: formatMoney(sale.remaining_balance, sale.currency),
                },
                {
                  label: text("paymentStatus", "Payment Status"),
                  value: text(
                    sale.payment_status,
                    sale.payment_status.replaceAll("_", " "),
                  ),
                },
              ],
            },
          ]}
          tables={[
            {
              title: text("paymentHistory", "Payment History"),
              columns: [
                { key: "receipt", label: text("receiptNumber", "Receipt") },
                { key: "date", label: text("paymentDate", "Date") },
                { key: "method", label: text("method", "Method") },
                { key: "reference", label: text("reference", "Reference") },
                {
                  key: "amount",
                  label: text("amount", "Amount"),
                  align: "right",
                },
              ],
              rows: (sale.payments || []).map((payment) => ({
                receipt: payment.receipt_number,
                date: payment.payment_date,
                method:
                  payment.payment_method_display ||
                  payment.payment_method?.replaceAll("_", " "),
                reference: payment.reference || "—",
                amount: formatMoney(payment.amount, payment.currency),
              })),
            },
          ]}
          notes={sale.notes}
          signatures={[
            text("customerSignature", "Customer Signature"),
            text("authorizedSignature", "Authorized Signature"),
          ]}
          footer={text(
            "invoiceFooter",
            "This is a system-generated apartment sale invoice. Keep it with the official sale records.",
          )}
        />
      )}

      {receiptPayment && (
        <PrintableReceiptModal
          isOpen
          onClose={() => setReceiptPayment(null)}
          title={text("paymentReceipt", "Payment Receipt")}
          subtitle={text("receiptSubtitle", "Apartment sale payment receipt")}
          numberLabel={text("receiptNo", "Receipt No.")}
          receiptNumber={receiptPayment.receipt_number}
          receiptDate={receiptPayment.payment_date}
          status={text("paymentReceived", "Payment Received")}
          amountLabel={text("amountReceived", "Amount Received")}
          amount={receiptPayment.amount}
          currency={receiptPayment.currency || sale.currency}
          details={[
            {
              label: text("project", "Project"),
              value: sale.project_name || project.name || "—",
            },
            {
              label: text("saleReference", "Sale/reference number"),
              value: sale.reference_number || "—",
            },
            {
              label: text("customer", "Customer"),
              value: sale.customer_name || "—",
            },
            {
              label: text("phone", "Phone"),
              value: sale.customer_phone || "—",
            },
            {
              label: text("email", "Email"),
              value: sale.customer_email || "—",
            },
            {
              label: text("address", "Address"),
              value: sale.customer_address || "—",
            },
          ]}
          sections={[
            {
              title: text("propertyDetails", "Property Details"),
              rows: [
                {
                  label: text("building", "Building"),
                  value: sale.building_name || apartment.building_name || "—",
                },
                {
                  label: text("floor", "Floor"),
                  value: sale.floor_number ?? apartment.floor_number ?? "—",
                },
                {
                  label: text("apartment", "Apartment"),
                  value: sale.apartment_number || apartment.apartment_number || "—",
                },
              ],
            },
            {
              title: text("paymentDetails", "Payment Details"),
              rows: [
                {
                  label: text("method", "Payment Method"),
                  value:
                    receiptPayment.payment_method_display ||
                    receiptPayment.payment_method?.replaceAll("_", " ") ||
                    "—",
                },
                {
                  label: text("reference", "Reference"),
                  value: receiptPayment.reference || "—",
                },
                {
                  label: text("recordedBy", "Recorded By"),
                  value: receiptPayment.recorded_by_name || "—",
                },
              ],
            },
            {
              title: text("currentAccountSummary", "Current Account Summary"),
              rows: [
                {
                  label: text("salePrice", "Sale Price"),
                  value: formatMoney(sale.sale_price, sale.currency),
                },
                {
                  label: text("totalPaid", "Total Paid"),
                  value: formatMoney(sale.total_paid, sale.currency),
                },
                {
                  label: text("remaining", "Remaining"),
                  value: formatMoney(sale.remaining_balance, sale.currency),
                },
                {
                  label: text("paymentStatus", "Payment Status"),
                  value: text(
                    sale.payment_status,
                    sale.payment_status.replaceAll("_", " "),
                  ),
                },
              ],
            },
          ]}
          notes={receiptPayment.notes}
          signatures={[
            text("customerSignature", "Customer Signature"),
            text("authorizedSignature", "Authorized Signature"),
          ]}
          footer={text(
            "receiptFooter",
            "This receipt confirms the payment shown above. Keep it with the apartment sale records.",
          )}
        />
      )}
      <Modal isOpen={cancelOpen} onClose={() => { setCancelOpen(false); setErrors({}); }} title={text("cancelSale", "Cancel Sale")} size="sm">
        <form onSubmit={cancelSale} aria-label={text("cancelSale", "Cancel Sale")}>
          <p className="mb-4 text-sm leading-6 text-[var(--muted)]">
            {text("cancelSaleMessage", "Cancel this sale? The apartment will become available again, and this sale and its payments will be excluded from active reports.")}
          </p>
          <label className="text-sm text-[var(--text)]">
            {text("cancellationReason", "Cancellation reason")}
            <textarea autoFocus required rows="3" className={`${fieldClass} mt-1`} value={cancelReason} onChange={(event) => setCancelReason(event.target.value)} />
            <ErrorText value={errors.cancellation_reason} />
          </label>
          <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-end">
            <Button variant="ghost" onClick={() => { setCancelOpen(false); setErrors({}); }}>{text("keepSale", "Keep Sale")}</Button>
            <Button type="submit" variant="danger" disabled={saving} leftIcon={saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}>{text("confirmCancellation", "Cancel Sale")}</Button>
          </div>
        </form>
      </Modal>
    </>
  );
}

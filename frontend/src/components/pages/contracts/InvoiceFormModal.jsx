// src/pages/contracts/InvoiceFormModal.jsx
import React, { useState, useEffect } from "react";
import usePost from "../../../hooks/usePost";
import instance from "../../../api/axiosInstance";
import PermissionWrapper from "../../../auth/PermissionWrapper";
import Button from "../../ui/Button";
import { useLanguage } from "../../../hooks/useLanguage";
import CalendarDatePicker from "../../common/CalendarDatePicker";
import useBodyScrollLock from "../../../hooks/useBodyScrollLock";

const INITIAL_STATE = {
  invoice_date: "",
  due_date: "",
  description: "",
  amount: "",
  status: "pending",
  notes: "",
};

export default function InvoiceFormModal({
  invoice,
  onClose,
  onSuccess,
  contractID,
}) {
  const { t } = useLanguage();
  useBodyScrollLock(true);
  const [formData, setFormData] = useState(INITIAL_STATE);
  const [formError, setFormError] = useState("");
  const { postData, loading: submitting, error: postError } = usePost();

  useEffect(() => {
    if (invoice) {
      setFormData({
        invoice_date: invoice.invoice_date || "",
        due_date: invoice.due_date || "",
        description: invoice.description || "",
        amount: invoice.amount || "",
        status: invoice.status || "pending",
        notes: invoice.notes || "",
      });
    } else {
      setFormData(INITIAL_STATE);
    }
  }, [invoice]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleDateChange = (name, value) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError("");

    if (!formData.invoice_date || !formData.amount) {
      setFormError(t("InvoiceFormModal.dateAndAmountRequired"));
      return;
    }

    const payload = {
      ...formData,
      due_date: formData.due_date || null,
    };

    try {
      if (invoice) {
        await instance.patch(`invoices/${invoice.id}/`, payload);
      } else {
        await postData("invoices/", {
          ...payload,
          contract: contractID,
        });
      }

      onSuccess?.();
      onClose();
    } catch (err) {}
  };

  const inputStyle = {
    width: "100%",
    padding: "0.6rem",
    border: "1px solid var(--border)",
    borderRadius: "6px",
    background: "var(--bg)",
    color: "var(--text)",
    fontSize: "1rem",
    minHeight: "44px",
    outline: "none",
    transition: "border-color 0.2s",
  };

  const labelStyle = {
    display: "block",
    marginBottom: "0.3rem",
    fontSize: "0.8rem",
    color: "var(--muted)",
    fontWeight: "500",
  };

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: "rgba(0,0,0,0.5)",
        display: "flex",
        alignItems: "flex-start",
        justifyContent: "center",
        zIndex: 1000,
        padding: "1rem",
        overflow: "hidden",
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: "var(--card)",
          border: "1px solid var(--border)",
          borderRadius: "10px",
          width: "100%",
          maxWidth: "650px",
          maxHeight: "calc(100dvh - 2rem)",
          overflowY: "auto",
          WebkitOverflowScrolling: "touch",
          padding: "1.5rem",
          boxShadow: "0 8px 24px var(--shadow, rgba(0,0,0,0.15))",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            gap: "1rem",
            marginBottom: "1.2rem",
          }}
        >
          <h2
            style={{
              margin: 0,
              fontSize: "1.25rem",
              fontWeight: "600",
              color: "var(--text)",
            }}
          >
            {invoice
              ? t("InvoiceFormModal.editInvoice")
              : t("InvoiceFormModal.newInvoice")}
          </h2>
          <button
            onClick={onClose}
            style={{
              background: "none",
              border: "none",
              fontSize: "1.5rem",
              cursor: "pointer",
              color: "var(--muted)",
              lineHeight: 1,
            }}
          >
            &times;
          </button>
        </div>

        {(formError || postError) && (
          <div
            style={{
              background: "var(--danger)",
              color: "#fff",
              padding: "0.6rem",
              borderRadius: "6px",
              marginBottom: "1rem",
              fontSize: "0.85rem",
            }}
          >
            {formError ||
              (typeof postError === "string"
                ? postError
                : t("InvoiceFormModal.submissionFailed"))}
          </div>
        )}

        <form
          onSubmit={handleSubmit}
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 200px), 1fr))",
            gap: "1rem",
          }}
        >
          <div>
            <label style={labelStyle}>
              {t("InvoiceFormModal.invoiceDate")} *
            </label>
            <CalendarDatePicker
              name="invoice_date"
              value={formData.invoice_date}
              onChange={(value) => handleDateChange("invoice_date", value)}
              module="invoices"
              required
              style={inputStyle}
            />
          </div>
          <div>
            <label style={labelStyle}>{t("InvoiceFormModal.dueDate")}</label>
            <CalendarDatePicker
              name="due_date"
              value={formData.due_date}
              onChange={(value) => handleDateChange("due_date", value)}
              module="invoices"
              style={inputStyle}
            />
          </div>
          <div>
            <label style={labelStyle}>{t("InvoiceFormModal.amount")} *</label>
            <input
              name="amount"
              type="number"
              step="0.01"
              min="0.01"
              value={formData.amount}
              onChange={handleChange}
              required
              style={inputStyle}
            />
          </div>
          <div>
            <label style={labelStyle}>{t("InvoiceFormModal.status")}</label>
            <select
              name="status"
              value={formData.status}
              onChange={handleChange}
              style={inputStyle}
            >
              <option value="pending">{t("InvoiceFormModal.pending")}</option>
              <option value="approved">{t("InvoiceFormModal.approved")}</option>
              <option value="partially_paid">
                {t("InvoiceFormModal.partiallyPaid")}
              </option>
              <option value="paid">{t("InvoiceFormModal.paid")}</option>
              <option value="cancelled">
                {t("InvoiceFormModal.cancelled")}
              </option>
            </select>
          </div>
          <div style={{ gridColumn: "1 / -1" }}>
            <label style={labelStyle}>
              {t("InvoiceFormModal.description")}
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows="2"
              style={{ ...inputStyle, resize: "vertical" }}
            />
          </div>
          <div style={{ gridColumn: "1 / -1" }}>
            <label style={labelStyle}>{t("InvoiceFormModal.notes")}</label>
            <textarea
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              rows="2"
              style={{ ...inputStyle, resize: "vertical" }}
            />
          </div>

          <div
            style={{
              gridColumn: "1 / -1",
              display: "flex",
              justifyContent: "flex-end",
              flexWrap: "wrap",
              gap: "0.75rem",
              marginTop: "0.5rem",
            }}
          >
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: "0.6rem 1.2rem",
                border: "1px solid var(--border)",
                borderRadius: "6px",
                background: "var(--card)",
                color: "var(--text)",
                cursor: "pointer",
                fontSize: "0.9rem",
                minHeight: "44px",
                flex: "0 1 10rem",
              }}
            >
              {t("InvoiceFormModal.cancel")}
            </button>
            <PermissionWrapper
              permissions={[
                invoice
                  ? "contract_invoices.update"
                  : "contract_invoices.create",
              ]}
              fallback={
                <Button
                  type="submit"
                  variant="primary"
                  disabled
                  title={t("InvoiceFormModal.noPermission")}
                >
                  {invoice
                    ? t("InvoiceFormModal.updateInvoice")
                    : t("InvoiceFormModal.createInvoice")}
                </Button>
              }
            >
              <button
                type="submit"
                disabled={submitting}
                style={{
                  padding: "0.6rem 1.2rem",
                  border: "none",
                  borderRadius: "6px",
                  background: "var(--primary)",
                  color: "#fff",
                  cursor: submitting ? "not-allowed" : "pointer",
                  opacity: submitting ? 0.7 : 1,
                  fontSize: "0.9rem",
                  fontWeight: "500",
                  minHeight: "44px",
                  flex: "0 1 10rem",
                }}
              >
                {submitting
                  ? t("InvoiceFormModal.saving")
                  : invoice
                    ? t("InvoiceFormModal.updateInvoice")
                    : t("InvoiceFormModal.createInvoice")}
              </button>
            </PermissionWrapper>
          </div>
        </form>
      </div>
    </div>
  );
}

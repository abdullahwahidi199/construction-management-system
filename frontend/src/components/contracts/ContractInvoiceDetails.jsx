// src/components/contracts/ContractInvoiceDetails.jsx
import React, { useState, useCallback, useRef, useEffect } from "react";
import useFetch from "../../hooks/useFetch";
import instance from "../../api/axiosInstance";
import { useLanguage } from "../../hooks/useLanguage";

export default function ContractInvoiceDetails({ id, onClose }) {
  const { t } = useLanguage();
  // Force refetch after successful upload
  const [refreshKey, setRefreshKey] = useState(0);
  const {
    data: invoiceDetails,
    loading,
    error,
  } = useFetch(`/invoices/${id}/?_t=${refreshKey}`);

  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadMessage, setUploadMessage] = useState({ type: "", text: "" });
  const fileInputRef = useRef(null);

  // Clear messages after 3 seconds
  useEffect(() => {
    if (uploadMessage.text) {
      const timer = setTimeout(
        () => setUploadMessage({ type: "", text: "" }),
        3000,
      );
      return () => clearTimeout(timer);
    }
  }, [uploadMessage]);

  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setIsDragging(false);
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) handleUpload(files[0]);
  }, []);

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) handleUpload(file);
  };

  const handleUpload = async (file) => {
    setUploading(true);
    setUploadMessage({ type: "", text: "" });

    const formData = new FormData();
    formData.append("invoice", id);
    formData.append("file", file);

    try {
      await instance.post("/invoice-documents/", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setUploadMessage({
        type: "success",
        text: t("ContractInvoiceDetails.documentUploaded"),
      });
      setRefreshKey((prev) => prev + 1); // Triggers useFetch refetch
    } catch (err) {
      const msg =
        err?.response?.data?.file?.[0] ||
        err?.response?.data?.detail ||
        t("ContractInvoiceDetails.uploadFailed");
      setUploadMessage({ type: "error", text: msg });
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  if (loading)
    return (
      <p
        style={{ padding: "2rem", color: "var(--muted)", textAlign: "center" }}
      >
        {t("ContractInvoiceDetails.loadingInvoiceDetails")}
      </p>
    );
  if (error)
    return (
      <p
        style={{ padding: "2rem", color: "var(--danger)", textAlign: "center" }}
      >
        {t("ContractInvoiceDetails.error")}: {error}
      </p>
    );
  if (!invoiceDetails) return null;

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
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1000,
        padding: "1rem",
        backdropFilter: "blur(2px)",
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: "var(--card)",
          border: "1px solid var(--border)",
          borderRadius: "12px",
          width: "100%",
          maxWidth: "720px",
          maxHeight: "90vh",
          overflowY: "auto",
          padding: "1.5rem",
          boxShadow: "0 8px 24px var(--shadow, rgba(0,0,0,0.15))",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
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
            {t("ContractInvoiceDetails.invoice")}{" "}
            {invoiceDetails.invoice_number}
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
              padding: "0.25rem",
            }}
          >
            &times;
          </button>
        </div>

        {/* Details Grid */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
            gap: "1rem",
            marginBottom: "1.5rem",
          }}
        >
          <DetailItem
            label={t("ContractInvoiceDetails.contract")}
            value={invoiceDetails.contract_number}
          />
          <DetailItem
            label={t("ContractInvoiceDetails.project")}
            value={invoiceDetails.project_name}
          />
          <DetailItem
            label={t("ContractInvoiceDetails.subcontractor")}
            value={invoiceDetails.subcontractor_name}
          />
          <DetailItem
            label={t("ContractInvoiceDetails.amount")}
            value={`$${Number(invoiceDetails.amount).toFixed(2)}`}
          />
          <DetailItem
            label={t("ContractInvoiceDetails.status")}
            value={invoiceDetails.status?.replace("_", " ")}
          />
          <DetailItem
            label={t("ContractInvoiceDetails.invoiceDate")}
            value={invoiceDetails.invoice_date}
          />
          <DetailItem
            label={t("ContractInvoiceDetails.dueDate")}
            value={invoiceDetails.due_date || "-"}
          />
        </div>
        <div style={{ marginBottom: "1.5rem" }}>
          <DetailItem
            label={t("ContractInvoiceDetails.description")}
            value={invoiceDetails.description || "-"}
          />
        </div>
        <div style={{ marginBottom: "1.5rem" }}>
          <DetailItem
            label={t("ContractInvoiceDetails.notes")}
            value={invoiceDetails.notes || "-"}
          />
        </div>

        {/* Upload Section */}
        <h3
          style={{
            fontSize: "1rem",
            fontWeight: "600",
            color: "var(--text)",
            marginBottom: "0.75rem",
          }}
        >
          {t("ContractInvoiceDetails.documents")}
        </h3>

        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => !uploading && fileInputRef.current?.click()}
          style={{
            border: `2px dashed ${isDragging ? "var(--primary)" : "var(--border)"}`,
            borderRadius: "8px",
            padding: "1.5rem",
            textAlign: "center",
            cursor: uploading ? "not-allowed" : "pointer",
            background: isDragging ? "var(--hover)" : "transparent",
            transition: "all 0.2s ease",
            marginBottom: "1rem",
            opacity: uploading ? 0.6 : 1,
          }}
        >
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileSelect}
            style={{ display: "none" }}
            disabled={uploading}
            accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png"
          />
          {uploading ? (
            <p
              style={{ margin: 0, color: "var(--primary)", fontWeight: "500" }}
            >
              {t("ContractInvoiceDetails.uploading")}
            </p>
          ) : (
            <>
              <p
                style={{
                  margin: "0 0 0.5rem",
                  color: "var(--muted)",
                  fontSize: "0.9rem",
                }}
              >
                {t("ContractInvoiceDetails.dragDrop")}{" "}
                <span
                  style={{
                    color: "var(--primary)",
                    textDecoration: "underline",
                  }}
                >
                  {t("ContractInvoiceDetails.browse")}
                </span>
              </p>
              <p
                style={{
                  margin: 0,
                  fontSize: "0.75rem",
                  color: "var(--muted)",
                }}
              >
                {t("ContractInvoiceDetails.supportedFiles")}
              </p>
            </>
          )}
        </div>

        {/* Feedback Messages */}
        {uploadMessage.text && (
          <p
            style={{
              margin: "0 0 0.75rem",
              padding: "0.5rem 0.75rem",
              borderRadius: "6px",
              fontSize: "0.85rem",
              fontWeight: "500",
              background:
                uploadMessage.type === "success"
                  ? "var(--success)"
                  : "var(--danger)",
              color: "#fff",
            }}
          >
            {uploadMessage.text}
          </p>
        )}

        {/* Document List */}
        <div
          style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}
        >
          {invoiceDetails.documents?.length > 0 ? (
            invoiceDetails.documents.map((doc) => (
              <div
                key={doc.id}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "0.6rem 0.8rem",
                  background: "var(--bg)",
                  border: "1px solid var(--border)",
                  borderRadius: "6px",
                  fontSize: "0.85rem",
                  transition: "background 0.2s",
                }}
              >
                <span
                  style={{
                    color: "var(--text)",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                    flex: 1,
                  }}
                >
                  📄{" "}
                  {doc.file?.split("/").pop() ||
                    `${t("ContractInvoiceDetails.document")} ${doc.id}`}
                </span>
                <a
                  href={doc.file}
                  target="_blank"
                  rel="noreferrer"
                  style={{
                    color: "var(--primary)",
                    textDecoration: "none",
                    fontWeight: "500",
                    fontSize: "0.8rem",
                    marginLeft: "0.5rem",
                    padding: "0.2rem 0.5rem",
                    borderRadius: "4px",
                    border: "1px solid var(--border)",
                  }}
                >
                  {t("ContractInvoiceDetails.viewDownload")}
                </a>
              </div>
            ))
          ) : (
            <p
              style={{
                color: "var(--muted)",
                fontSize: "0.85rem",
                textAlign: "center",
                padding: "1rem",
                margin: 0,
              }}
            >
              {t("ContractInvoiceDetails.noDocuments")}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

// Reusable detail row component
function DetailItem({ label, value }) {
  return (
    <div>
      <span
        style={{
          display: "block",
          fontSize: "0.75rem",
          color: "var(--muted)",
          fontWeight: "500",
          marginBottom: "0.2rem",
          textTransform: "uppercase",
          letterSpacing: "0.03em",
        }}
      >
        {label}
      </span>
      <span
        style={{
          color: "var(--text)",
          fontSize: "0.9rem",
          wordBreak: "break-word",
        }}
      >
        {value}
      </span>
    </div>
  );
}

// src/components/contracts/DocumentUploadModal.jsx
import { useState } from "react";
import { X, Upload, FileText, AlertCircle, CheckCircle2 } from "lucide-react";
import Card from "../ui/Card";
import Button from "../ui/Button";
import Input from "../ui/Input";
import Select from "../ui/Select";
import { useLanguage } from "../../hooks/useLanguage";

const ACCEPTED_EXTENSIONS = ".pdf,.jpg,.jpeg,.png,.tiff,.doc,.docx,.xls,.xlsx";
const MAX_FILE_SIZE = 50 * 1024 * 1024;

function formatFileSize(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
}

export default function DocumentUploadModal({
  isOpen,
  onClose,
  onSubmit,
  loading: submitLoading,
}) {
  const { t } = useLanguage();
  const [title, setTitle] = useState("");
  const [documentType, setDocumentType] = useState("supporting");
  const [file, setFile] = useState(null);
  const [dragActive, setDragActive] = useState(false);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  const DOCUMENT_TYPE_OPTIONS = [
    {
      value: "signed_contract",
      label: t("DocumentUploadModal.signedContract"),
    },
    { value: "boq", label: t("DocumentUploadModal.billOfQuantities") },
    { value: "drawings", label: t("DocumentUploadModal.drawings") },
    { value: "invoice", label: t("DocumentUploadModal.invoice") },
    { value: "quotation", label: t("DocumentUploadModal.quotation") },
    { value: "supporting", label: t("DocumentUploadModal.supportingDocument") },
    { value: "other", label: t("DocumentUploadModal.other") },
  ];

  const reset = () => {
    setTitle("");
    setDocumentType("supporting");
    setFile(null);
    setErrors({});
    setSubmitting(false);
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      // Only deactivate if leaving the drop zone itself
      if (e.currentTarget === e.target) {
        setDragActive(false);
      }
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setFile(e.dataTransfer.files[0]);
      if (errors.file) setErrors((prev) => ({ ...prev, file: undefined }));
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      if (errors.file) setErrors((prev) => ({ ...prev, file: undefined }));
    }
  };

  const removeFile = (e) => {
    e.stopPropagation();
    setFile(null);
  };

  const validate = () => {
    const e = {};
    if (!title.trim()) e.title = t("DocumentUploadModal.titleRequired");
    if (!file) e.file = t("DocumentUploadModal.fileRequired");
    if (file && file.size > MAX_FILE_SIZE)
      e.file = t("DocumentUploadModal.fileTooLarge");
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setSubmitting(true);

    const formData = new FormData();
    formData.append("title", title);
    formData.append("document_type", documentType);
    formData.append("file", file);

    try {
      await onSubmit(formData);
      reset();
    } catch {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  const dropZoneState = file
    ? "has-file"
    : dragActive
      ? "active"
      : errors.file
        ? "error"
        : "idle";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="upload-modal-title"
    >
      <div
        className="absolute inset-0 bg-black/20 backdrop-blur-sm transition-opacity"
        onClick={handleClose}
        aria-hidden="true"
      />

      <div className="relative w-full max-w-md animate-in fade-in zoom-in-95">
        <Card className="p-0 shadow-2xl border-[var(--border)]">
          <form onSubmit={handleSubmit} noValidate>
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border)] bg-[var(--card)]">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-[var(--primary)]/10 text-[var(--primary)]">
                  <Upload size={18} />
                </div>
                <h2
                  id="upload-modal-title"
                  className="text-lg font-semibold text-[var(--text)]"
                >
                  {t("DocumentUploadModal.uploadDocument")}
                </h2>
              </div>
              <button
                type="button"
                onClick={handleClose}
                disabled={submitting}
                className="p-1.5 rounded-lg hover:bg-[var(--hover)] text-[var(--muted)] hover:text-[var(--text)] transition-colors disabled:opacity-50"
                aria-label={t("DocumentUploadModal.close")}
              >
                <X size={18} />
              </button>
            </div>

            {/* Body */}
            <div className="px-6 py-5 space-y-5">
              <Input
                label={t("DocumentUploadModal.documentTitle")}
                value={title}
                onChange={(v) => {
                  setTitle(v);
                  if (errors.title)
                    setErrors((prev) => ({ ...prev, title: undefined }));
                }}
                placeholder={t("DocumentUploadModal.titlePlaceholder")}
                error={errors.title}
                required
              />

              <Select
                label={t("DocumentUploadModal.documentType")}
                value={documentType}
                onChange={setDocumentType}
                options={DOCUMENT_TYPE_OPTIONS}
              />

              {/* Drop Zone */}
              <div>
                <label className="block text-sm font-medium text-[var(--text)] mb-1.5">
                  {t("DocumentUploadModal.file")}{" "}
                  <span className="text-[var(--danger)]">*</span>
                </label>
                <div
                  className={`
                    relative border-2 border-dashed rounded-xl p-6 text-center transition-all cursor-pointer
                    ${
                      dropZoneState === "active"
                        ? "border-[var(--primary)] bg-[var(--primary)]/10 scale-[1.02]"
                        : dropZoneState === "error"
                          ? "border-[var(--danger)] bg-[var(--danger)]/5"
                          : dropZoneState === "has-file"
                            ? "border-[var(--success)] bg-[var(--success)]/5"
                            : "border-[var(--border)] hover:border-[var(--primary)] hover:bg-[var(--hover)]"
                    }
                  `}
                  onDragEnter={handleDrag}
                  onDragLeave={handleDrag}
                  onDragOver={handleDrag}
                  onDrop={handleDrop}
                  onClick={() =>
                    !file &&
                    document.getElementById("file-input-contract")?.click()
                  }
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      document.getElementById("file-input-contract")?.click();
                    }
                  }}
                >
                  <input
                    id="file-input-contract"
                    type="file"
                    className="hidden"
                    onChange={handleFileChange}
                    accept={ACCEPTED_EXTENSIONS}
                  />

                  {file ? (
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-[var(--success)]/15 text-[var(--success)] shrink-0">
                        <CheckCircle2 size={20} />
                      </div>
                      <div className="flex-1 text-left min-w-0">
                        <p className="text-sm font-medium text-[var(--text)] truncate">
                          {file.name}
                        </p>
                        <p className="text-xs text-[var(--muted)]">
                          {formatFileSize(file.size)}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={removeFile}
                        className="p-1.5 rounded-lg hover:bg-[var(--hover)] text-[var(--muted)] hover:text-[var(--danger)] transition-colors shrink-0"
                        aria-label={t("DocumentUploadModal.removeFile")}
                      >
                        <X size={16} />
                      </button>
                    </div>
                  ) : (
                    <>
                      <div className="mx-auto w-12 h-12 rounded-full bg-[var(--hover)] flex items-center justify-center mb-3">
                        <Upload size={22} className="text-[var(--primary)]" />
                      </div>
                      <p className="text-sm text-[var(--text)]">
                        {t("DocumentUploadModal.dragAndDrop")}{" "}
                        <span className="text-[var(--primary)] font-semibold hover:underline">
                          {t("DocumentUploadModal.browse")}
                        </span>
                      </p>
                      <p className="text-xs text-[var(--muted)] mt-1.5">
                        {t("DocumentUploadModal.supportedFiles")}
                      </p>
                    </>
                  )}
                </div>
                {errors.file && (
                  <p className="mt-1.5 text-xs text-[var(--danger)] flex items-center gap-1">
                    <AlertCircle size={12} />
                    {errors.file}
                  </p>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end gap-2 px-6 py-4 border-t border-[var(--border)] bg-[var(--card)]">
              <Button
                type="button"
                variant="secondary"
                onClick={handleClose}
                disabled={submitting}
              >
                {t("DocumentUploadModal.cancel")}
              </Button>
              <Button
                type="submit"
                variant="primary"
                disabled={submitting}
                leftIcon={!submitting && <Upload size={16} />}
              >
                {submitting
                  ? t("DocumentUploadModal.uploading")
                  : t("DocumentUploadModal.uploadDocument")}
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </div>
  );
}

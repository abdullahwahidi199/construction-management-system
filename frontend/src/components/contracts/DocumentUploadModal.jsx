// src/components/contracts/DocumentUploadModal.jsx
import { useState } from "react";
import { X, Upload, FileText } from "lucide-react";
import Card from "../ui/Card";
import Button from "../ui/Button";
import Input from "../ui/Input";
import Select from "../ui/Select";

const DOCUMENT_TYPE_OPTIONS = [
  { value: "signed_contract", label: "Signed Contract" },
  { value: "boq", label: "Bill of Quantities (BOQ)" },
  { value: "drawings", label: "Drawings" },
  { value: "invoice", label: "Invoice" },
  { value: "quotation", label: "Quotation" },
  { value: "supporting", label: "Supporting Document" },
  { value: "other", label: "Other" },
];

export default function DocumentUploadModal({
  isOpen,
  onClose,
  onSubmit,
  loading: submitLoading,
}) {
  const [title, setTitle] = useState("");
  const [documentType, setDocumentType] = useState("supporting");
  const [file, setFile] = useState(null);
  const [dragActive, setDragActive] = useState(false);
  const [errors, setErrors] = useState({});

  const reset = () => {
    setTitle("");
    setDocumentType("supporting");
    setFile(null);
    setErrors({});
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
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const validate = () => {
    const e = {};
    if (!title.trim()) e.title = "Title is required";
    if (!file) e.file = "File is required";
    if (file && file.size > 50 * 1024 * 1024)
      e.file = "File size must be under 50 MB";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    const formData = new FormData();
    formData.append("title", title);
    formData.append("document_type", documentType);
    formData.append("file", file);

    await onSubmit(formData);
    reset();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={handleClose}
      />
      <div className="relative w-full max-w-md">
        <Card className="p-0">
          <form onSubmit={handleSubmit}>
            <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border)]">
              <h2 className="text-lg font-semibold text-[var(--text)]">
                Upload Document
              </h2>
              <button
                type="button"
                onClick={handleClose}
                className="p-1 rounded-lg hover:bg-[var(--hover)] text-[var(--muted)]"
              >
                <X size={20} />
              </button>
            </div>

            <div className="px-6 py-4 space-y-4">
              <Input
                label="Document Title"
                value={title}
                onChange={setTitle}
                placeholder="e.g. Signed Contract V1"
                error={errors.title}
              />

              <Select
                label="Document Type"
                value={documentType}
                onChange={setDocumentType}
                options={DOCUMENT_TYPE_OPTIONS}
              />

              {/* Drop Zone */}
              <div
                className={`relative border-2 border-dashed rounded-xl p-6 text-center transition-colors cursor-pointer ${
                  dragActive
                    ? "border-[var(--primary)] bg-[var(--primary)]/5"
                    : errors.file
                      ? "border-[var(--danger)]"
                      : "border-[var(--border)] hover:border-[var(--primary)]"
                }`}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
                onClick={() =>
                  document.getElementById("file-input-contract").click()
                }
              >
                <input
                  id="file-input-contract"
                  type="file"
                  className="hidden"
                  onChange={handleFileChange}
                  accept=".pdf,.jpg,.jpeg,.png,.tiff,.doc,.docx,.xls,.xlsx"
                />

                {file ? (
                  <div className="flex items-center justify-center gap-3">
                    <FileText size={24} className="text-[var(--primary)]" />
                    <div className="text-left">
                      <p className="text-sm font-medium text-[var(--text)]">
                        {file.name}
                      </p>
                      <p className="text-xs text-[var(--muted)]">
                        {(file.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </div>
                  </div>
                ) : (
                  <>
                    <Upload
                      size={24}
                      className="mx-auto text-[var(--muted)] mb-2"
                    />
                    <p className="text-sm text-[var(--muted)]">
                      Drag and drop or{" "}
                      <span className="text-[var(--primary)] font-medium">
                        browse
                      </span>
                    </p>
                    <p className="text-xs text-[var(--muted)] mt-1">
                      PDF, Images, Word, Excel — Max 50MB
                    </p>
                  </>
                )}
              </div>
              {errors.file && (
                <p className="text-xs text-[var(--danger)]">{errors.file}</p>
              )}
            </div>

            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-[var(--border)]">
              <Button
                type="button"
                variant="secondary"
                onClick={handleClose}
                disabled={submitLoading}
              >
                Cancel
              </Button>
              <Button type="submit" variant="primary" disabled={submitLoading}>
                {submitLoading ? "Uploading..." : "Upload Document"}
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </div>
  );
}

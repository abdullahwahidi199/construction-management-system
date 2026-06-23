// src/components/contracts/DocumentTable.jsx"
import { FileText, Download, Trash2, Eye } from "lucide-react";

const TYPE_LABELS = {
  signed_contract: "Signed Contract",
  boq: "Bill of Quantities",
  drawings: "Drawings",
  invoice: "Invoice",
  quotation: "Quotation",
  supporting: "Supporting Document",
  other: "Other",
};

const TYPE_COLORS = {
  signed_contract: "bg-[var(--success)]/15 text-[var(--success)]",
  boq: "bg-blue-500/15 text-blue-500",
  drawings: "bg-purple-500/15 text-purple-500",
  invoice: "bg-amber-500/15 text-amber-500",
  quotation: "bg-[var(--primary)]/15 text-[var(--primary)]",
  supporting: "bg-[var(--muted)]/20 text-[var(--muted)]",
  other: "bg-[var(--muted)]/20 text-[var(--muted)]",
};

function getFileExtension(filename) {
  return filename?.split(".").pop()?.toUpperCase() || "FILE";
}

const BASE_URL = "http://127.0.0.1:8000";

const getFileUrl = (file) => {
  if (!file) return "";
  if (file.startsWith("http")) return file;
  return `${BASE_URL}${file}`;
};
export default function DocumentTable({ documents = [], onDelete, loading }) {
  if (loading) {
    return (
      <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl p-12 text-center">
        <div className="animate-spin w-8 h-8 border-2 border-[var(--border)] border-t-[var(--primary)] rounded-full mx-auto" />
        <p className="text-[var(--muted)] mt-4">Loading documents...</p>
      </div>
    );
  }

  if (!documents.length) {
    return (
      <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl p-12 text-center">
        <FileText size={40} className="mx-auto text-[var(--muted)] mb-3" />
        <p className="text-[var(--muted)]">No documents uploaded yet.</p>
      </div>
    );
  }

  return (
    <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl overflow-hidden">
      {/* Desktop */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[var(--border)]">
              <th className="text-left px-4 py-3 font-semibold text-[var(--muted)]">
                Title
              </th>
              <th className="text-left px-4 py-3 font-semibold text-[var(--muted)]">
                Type
              </th>
              <th className="text-left px-4 py-3 font-semibold text-[var(--muted)]">
                File
              </th>
              <th className="text-left px-4 py-3 font-semibold text-[var(--muted)]">
                Uploaded
              </th>
              <th className="text-right px-4 py-3 font-semibold text-[var(--muted)]">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {documents.map((doc) => (
              <tr
                key={doc.id}
                className="border-b border-[var(--border)] last:border-0 hover:bg-[var(--hover)] transition-colors"
              >
                <td className="px-4 py-3 text-[var(--text)] font-medium">
                  {doc.title}
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium ${
                      TYPE_COLORS[doc.document_type] || TYPE_COLORS.other
                    }`}
                  >
                    {TYPE_LABELS[doc.document_type] || doc.document_type}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <span className="text-[var(--muted)] text-xs font-mono">
                      {getFileExtension(doc.file_url || doc.file)}
                    </span>
                  </div>
                </td>
                <td className="px-4 py-3 text-[var(--muted)] text-sm">
                  {doc.uploaded_at
                    ? new Date(doc.uploaded_at).toLocaleDateString()
                    : "—"}
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-end gap-1">
                    {doc.file && (
                      <a
                        href={getFileUrl(doc.file)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-1.5 rounded-lg hover:bg-[var(--hover)] text-[var(--muted)] hover:text-[var(--primary)] transition-colors"
                        title="Download / Preview"
                      >
                        <Download size={16} />
                      </a>
                    )}
                    <button
                      onClick={() => onDelete(doc)}
                      className="p-1.5 rounded-lg hover:bg-[var(--hover)] text-[var(--muted)] hover:text-[var(--danger)] transition-colors"
                      title="Delete"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile */}
      <div className="md:hidden divide-y divide-[var(--border)]">
        {documents.map((doc) => (
          <div key={doc.id} className="p-4 space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-[var(--text)] font-medium">{doc.title}</p>
              <span
                className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium ${
                  TYPE_COLORS[doc.document_type] || TYPE_COLORS.other
                }`}
              >
                {TYPE_LABELS[doc.document_type] || doc.document_type}
              </span>
            </div>
            <p className="text-xs text-[var(--muted)]">
              {getFileExtension(doc.file_url || doc.file)} &middot;{" "}
              {doc.uploaded_at
                ? new Date(doc.uploaded_at).toLocaleDateString()
                : ""}
            </p>
            <div className="flex items-center justify-end gap-2">
              {doc.file && (
                <a
                  href={getFileUrl(doc.file)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 rounded-lg hover:bg-[var(--hover)] text-[var(--muted)] hover:text-[var(--primary)]"
                >
                  <Download size={16} />
                </a>
              )}
              <button
                onClick={() => onDelete(doc)}
                className="p-2 rounded-lg hover:bg-[var(--hover)] text-[var(--muted)] hover:text-[var(--danger)]"
              >
                <Trash2 size={16} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

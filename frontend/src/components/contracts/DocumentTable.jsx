import { FileText, Download, Trash2 } from "lucide-react";
import { useLanguage } from "../../hooks/useLanguage";

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
  const { t } = useLanguage();

  const TYPE_LABELS = {
    signed_contract: t("DocumentTable.signedContract"),
    boq: t("DocumentTable.billOfQuantities"),
    drawings: t("DocumentTable.drawings"),
    invoice: t("DocumentTable.invoice"),
    quotation: t("DocumentTable.quotation"),
    supporting: t("DocumentTable.supportingDocument"),
    other: t("DocumentTable.other"),
  };

  if (loading) {
    return (
      <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl p-12 text-center">
        <div className="animate-spin w-8 h-8 border-2 border-[var(--border)] border-t-[var(--primary)] rounded-full mx-auto" />
        <p className="text-[var(--muted)] mt-4">
          {t("DocumentTable.loadingDocuments")}
        </p>
      </div>
    );
  }

  if (!documents.length) {
    return (
      <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl p-12 text-center">
        <FileText size={40} className="mx-auto text-[var(--muted)] mb-3" />
        <p className="text-[var(--muted)]">{t("DocumentTable.noDocuments")}</p>
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
              <th className="text-start px-4 py-3 font-semibold text-[var(--muted)]">
                {t("DocumentTable.title")}
              </th>
              <th className="text-start px-4 py-3 font-semibold text-[var(--muted)]">
                {t("DocumentTable.type")}
              </th>
              <th className="text-start px-4 py-3 font-semibold text-[var(--muted)]">
                {t("DocumentTable.file")}
              </th>
              <th className="text-start px-4 py-3 font-semibold text-[var(--muted)]">
                {t("DocumentTable.uploaded")}
              </th>
              <th className="text-end px-4 py-3 font-semibold text-[var(--muted)]">
                {t("DocumentTable.actions")}
              </th>
            </tr>
          </thead>
          <tbody>
            {documents.map((doc) => (
              <tr
                key={doc.id}
                className="border-b border-[var(--border)] last:border-0 hover:bg-[var(--hover)] transition-colors"
              >
                <td className="px-4 py-3 text-[var(--text)] font-medium text-start">
                  {doc.title}
                </td>
                <td className="px-4 py-3 text-start">
                  <span
                    className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium ${
                      TYPE_COLORS[doc.document_type] || TYPE_COLORS.other
                    }`}
                  >
                    {TYPE_LABELS[doc.document_type] || doc.document_type}
                  </span>
                </td>
                <td className="px-4 py-3 text-start">
                  <div className="flex items-center gap-2">
                    <span className="text-[var(--muted)] text-xs font-mono">
                      {getFileExtension(doc.file_url || doc.file)}
                    </span>
                  </div>
                </td>
                <td className="px-4 py-3 text-[var(--muted)] text-sm text-start">
                  {doc.formatted_uploaded_at || doc.uploaded_at || "-"}
                </td>
                <td className="px-4 py-3 text-end">
                  <div className="flex items-center justify-end gap-1">
                    {doc.file && (
                      <a
                        href={getFileUrl(doc.file)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-1.5 rounded-lg hover:bg-[var(--hover)] text-[var(--muted)] hover:text-[var(--primary)] transition-colors"
                        title={t("DocumentTable.downloadPreview")}
                      >
                        <Download size={16} />
                      </a>
                    )}
                    <button
                      onClick={() => onDelete(doc)}
                      className="p-1.5 rounded-lg hover:bg-[var(--hover)] text-[var(--muted)] hover:text-[var(--danger)] transition-colors"
                      title={t("DocumentTable.delete")}
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
              {doc.formatted_uploaded_at || doc.uploaded_at || ""}
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

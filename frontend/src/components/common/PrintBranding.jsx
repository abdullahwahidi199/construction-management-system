import { useCompany } from "../../context/CompanyContext";

const DEFAULT_FOOTER =
  "This is a system-generated document. Keep it with the official records.";

export function printText(value, fallback = "-") {
  if (value === null || value === undefined || value === "") return fallback;
  return String(value);
}

export function escapePrintHtml(value) {
  return printText(value, "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

export function companyAddressLine(company = {}) {
  return [
    company.address,
    company.city,
    company.province_state,
    company.country,
    company.postal_code,
  ]
    .filter(Boolean)
    .join(", ");
}

export function companyContactLine(company = {}) {
  return [company.phone_number, company.email, company.website]
    .filter(Boolean)
    .join(" | ");
}

export function renderPrintBrandingStyles() {
  return `
    .company-brand-header {
      display: grid;
      grid-template-columns: auto 1fr auto;
      gap: 16px;
      align-items: start;
      border-bottom: 2px solid #111827;
      padding-bottom: 14px;
      margin-bottom: 20px;
    }
    .company-brand-logo {
      width: 58px;
      height: 58px;
      border: 1px solid #d1d5db;
      border-radius: 8px;
      display: flex;
      align-items: center;
      justify-content: center;
      overflow: hidden;
      color: #111827;
      font-size: 18px;
      font-weight: 800;
      background: #ffffff;
    }
    .company-brand-logo img {
      max-width: 100%;
      max-height: 100%;
      object-fit: contain;
      padding: 4px;
    }
    .company-brand-name {
      font-size: 18px;
      line-height: 1.15;
      font-weight: 900;
      color: #111827;
    }
    .company-brand-detail {
      margin-top: 3px;
      font-size: 10px;
      line-height: 1.35;
      color: #4b5563;
    }
    .company-document-meta {
      min-width: 180px;
      text-align: right;
    }
    .company-document-title {
      font-size: 16px;
      line-height: 1.15;
      font-weight: 900;
      color: #111827;
    }
    .company-document-subtitle {
      margin-top: 3px;
      font-size: 10px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.7px;
      color: #6b7280;
    }
    .company-brand-footer {
      margin-top: 30px;
      padding-top: 10px;
      border-top: 1px solid #e5e7eb;
      text-align: center;
      font-size: 10px;
      color: #6b7280;
      line-height: 1.45;
    }
  `;
}

export function renderPrintBrandHeader(company, { title, subtitle, metaHtml = "" } = {}) {
  const address = companyAddressLine(company);
  const contact = companyContactLine(company);
  const logo = company?.company_logo_url
    ? `<img src="${escapePrintHtml(company.company_logo_url)}" alt="" />`
    : escapePrintHtml((company?.company_name || "CMS").slice(0, 2).toUpperCase());

  return `
    <header class="company-brand-header">
      <div class="company-brand-logo">${logo}</div>
      <div>
        <div class="company-brand-name">${escapePrintHtml(company?.company_name || "Construction Management System")}</div>
        ${company?.legal_company_name ? `<div class="company-brand-detail">${escapePrintHtml(company.legal_company_name)}</div>` : ""}
        ${address ? `<div class="company-brand-detail">${escapePrintHtml(address)}</div>` : ""}
        ${contact ? `<div class="company-brand-detail">${escapePrintHtml(contact)}</div>` : ""}
      </div>
      <div class="company-document-meta">
        <div class="company-document-title">${escapePrintHtml(title)}</div>
        ${subtitle ? `<div class="company-document-subtitle">${escapePrintHtml(subtitle)}</div>` : ""}
        ${metaHtml}
      </div>
    </header>
  `;
}

export function renderPrintBrandFooter(company, fallback = DEFAULT_FOOTER) {
  const footer = company?.print_footer_text || fallback || DEFAULT_FOOTER;
  return `
    <footer class="company-brand-footer">
      <div>${escapePrintHtml(footer)}</div>
      ${companyContactLine(company) ? `<div>${escapePrintHtml(companyContactLine(company))}</div>` : ""}
    </footer>
  `;
}

export function PrintBrandHeader({ title, subtitle, meta }) {
  const { company } = useCompany();
  const address = companyAddressLine(company);
  const contact = companyContactLine(company);

  return (
    <div className="mb-5 grid grid-cols-[auto_1fr] gap-3 border-b-[2px] border-slate-900 pb-4 sm:grid-cols-[auto_1fr_auto] sm:gap-4">
      <div className="flex h-14 w-14 items-center justify-center overflow-hidden rounded-lg border border-slate-300 bg-white text-sm font-extrabold text-slate-900">
        {company.company_logo_url ? (
          <img
            src={company.company_logo_url}
            alt=""
            className="h-full w-full object-contain p-1"
          />
        ) : (
          printText(company.company_name, "CMS").slice(0, 2).toUpperCase()
        )}
      </div>
      <div className="min-w-0">
        <p className="truncate text-lg font-black leading-5 text-slate-900">
          {company.company_name}
        </p>
        {company.legal_company_name && (
          <p className="mt-1 text-xs text-slate-600">{company.legal_company_name}</p>
        )}
        {address && <p className="mt-1 text-xs text-slate-600">{address}</p>}
        {contact && <p className="mt-1 text-xs text-slate-600">{contact}</p>}
      </div>
      <div className="col-span-2 text-left sm:col-span-1 sm:text-right">
        <p className="text-base font-black text-slate-900">{title}</p>
        {subtitle && (
          <p className="mt-1 text-[10px] font-bold uppercase tracking-wide text-slate-500">
            {subtitle}
          </p>
        )}
        {meta}
      </div>
    </div>
  );
}

export function PrintBrandFooter({ fallback = DEFAULT_FOOTER }) {
  const { company } = useCompany();
  const footer = company.print_footer_text || fallback || DEFAULT_FOOTER;
  const contact = companyContactLine(company);

  return (
    <div className="mt-8 border-t border-slate-200 pt-3 text-center text-[10px] leading-5 text-slate-500">
      <p>{footer}</p>
      {contact && <p>{contact}</p>}
    </div>
  );
}

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import instance from "../api/axiosInstance";
import { useAuth } from "../auth/AuthContext";

export const COMPANY_INFO_UPDATED_EVENT = "cms:company-info-updated";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000/api/";

const DEFAULT_COMPANY = {
  id: null,
  company_name: "Construction Management System",
  legal_company_name: "",
  company_logo: "",
  company_logo_url: "",
  favicon: "",
  favicon_url: "",
  address: "",
  city: "",
  province_state: "",
  country: "",
  postal_code: "",
  phone_number: "",
  alternative_phone: "",
  email: "",
  website: "",
  tax_number: "",
  registration_number: "",
  company_description: "",
  print_footer_text: "",
};

function absoluteAssetUrl(value) {
  if (!value) return "";
  const url = String(value);
  if (/^(https?:|data:|blob:)/i.test(url)) return url;

  try {
    const base = new URL(API_BASE_URL, window.location.origin);
    return new URL(url, base.origin).toString();
  } catch {
    return url;
  }
}

export function normalizeCompanyInfo(value = {}) {
  const company = { ...DEFAULT_COMPANY, ...(value || {}) };
  company.company_logo_url = absoluteAssetUrl(
    company.company_logo_url || company.company_logo,
  );
  company.favicon_url = absoluteAssetUrl(company.favicon_url || company.favicon);
  return company;
}

const CompanyContext = createContext(null);

export function CompanyProvider({ children }) {
  const { isAuthenticated } = useAuth();
  const [company, setCompany] = useState(DEFAULT_COMPANY);
  const [loading, setLoading] = useState(false);

  const applyCompany = useCallback((value) => {
    const normalized = normalizeCompanyInfo(value);
    setCompany(normalized);
    return normalized;
  }, []);

  const refreshCompany = useCallback(async () => {
    if (!isAuthenticated) {
      applyCompany(DEFAULT_COMPANY);
      return DEFAULT_COMPANY;
    }

    setLoading(true);
    try {
      const response = await instance.get("auth/settings/company/", {
        skipGlobalErrorToast: true,
      });
      return applyCompany(response.data);
    } finally {
      setLoading(false);
    }
  }, [applyCompany, isAuthenticated]);

  useEffect(() => {
    refreshCompany().catch(() => applyCompany(DEFAULT_COMPANY));
  }, [applyCompany, refreshCompany]);

  useEffect(() => {
    const handleUpdate = (event) => {
      if (event.detail) {
        applyCompany(event.detail);
      } else {
        refreshCompany().catch(() => {});
      }
    };

    window.addEventListener(COMPANY_INFO_UPDATED_EVENT, handleUpdate);
    return () => {
      window.removeEventListener(COMPANY_INFO_UPDATED_EVENT, handleUpdate);
    };
  }, [applyCompany, refreshCompany]);

  useEffect(() => {
    document.title = company.company_name || DEFAULT_COMPANY.company_name;

    if (!company.favicon_url) return;
    let favicon = document.querySelector("link[rel='icon']");
    if (!favicon) {
      favicon = document.createElement("link");
      favicon.rel = "icon";
      document.head.appendChild(favicon);
    }
    favicon.href = company.favicon_url;
  }, [company.company_name, company.favicon_url]);

  const value = useMemo(
    () => ({
      company,
      loading,
      refreshCompany,
      setCompany: applyCompany,
    }),
    [applyCompany, company, loading, refreshCompany],
  );

  return (
    <CompanyContext.Provider value={value}>{children}</CompanyContext.Provider>
  );
}

export function useCompany() {
  const context = useContext(CompanyContext);
  if (!context) {
    throw new Error("useCompany must be used inside CompanyProvider");
  }
  return context;
}

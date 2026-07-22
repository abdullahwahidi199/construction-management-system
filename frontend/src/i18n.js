import en from "./locales/en.json";
import dr from "./locales/dr.json";
import ps from "./locales/ps.json";
import reportTranslations from "./locales/reports";

const resources = {
  en: { ...en, reports: reportTranslations.en },
  dr: { ...dr, reports: reportTranslations.dr },
  ps: { ...ps, reports: reportTranslations.ps },
};

const LANGUAGE_KEY = "cms.language";
let currentLang = localStorage.getItem(LANGUAGE_KEY) || "en";

const applyDocumentDirection = (lang) => {
  document.documentElement.lang = lang;
  const isRTL = lang === "dr" || lang === "ps";
  document.documentElement.dir = isRTL ? "rtl" : "ltr";
};

export const setLanguage = (lang) => {
  currentLang = lang;
  localStorage.setItem(LANGUAGE_KEY, lang);
  applyDocumentDirection(lang);

  window.dispatchEvent(new Event("languageChange"));
};

export const t = (key, params = {}) => {
  const keys = key.split(".");
  let value = resources[currentLang];

  for (const k of keys) {
    value = value?.[k];
  }

  if (typeof value !== "string") return key;

  return Object.entries(params).reduce(
    (text, [param, replacement]) =>
      text.replaceAll(`{{${param}}}`, String(replacement)),
    value,
  );
};

export const getLanguage = () => currentLang;

applyDocumentDirection(currentLang);

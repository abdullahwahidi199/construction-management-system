import en from "./locales/en.json";
import dr from "./locales/dr.json";
import ps from "./locales/ps.json";

const resources = {
  en,
  dr,
  ps,
};

let currentLang = "en";

export const setLanguage = (lang) => {
  currentLang = lang;
  document.documentElement.lang = lang;

  // RTL support (Dari + Pashto)
  const isRTL = lang === "dr" || lang === "ps";
  document.documentElement.dir = isRTL ? "rtl" : "ltr";

  // force re-render trigger (simple event system)
  window.dispatchEvent(new Event("languageChange"));
};

export const t = (key) => {
  const keys = key.split(".");
  let value = resources[currentLang];

  for (const k of keys) {
    value = value?.[k];
  }

  return value || key;
};

export const getLanguage = () => currentLang;

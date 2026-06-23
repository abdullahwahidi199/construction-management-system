import { useEffect, useState } from "react";
import { t, getLanguage } from "../i18n";

export const useLanguage = () => {
  const [, forceRender] = useState(0);

  useEffect(() => {
    const handler = () => forceRender((x) => x + 1);
    window.addEventListener("languageChange", handler);
    return () => window.removeEventListener("languageChange", handler);
  }, []);

  return {
    t,
    lang: getLanguage(),
  };
};

import React, { useState } from "react";
import { setLanguage, getLanguage } from "../i18n";
import { useLanguage } from "../hooks/useLanguage";

export default function LanguageSwitcher() {
  const [lang, setLang] = useState(getLanguage());
  const { t } = useLanguage();

  const changeLang = (value) => {
    setLanguage(value);
    setLang(value);
  };

  return (
    <div className="flex items-center gap-2 rounded-lg border border-(--border) bg-(--card) px-2 py-1">
      <button
        onClick={() => changeLang("en")}
        className={`px-2 py-1 text-sm rounded-md transition ${
          lang === "en"
            ? "bg-(--primary) text-white"
            : "text-(--text) hover:bg-(--hover)"
        }`}
      >
        {t("language.en")}
      </button>

      <button
        onClick={() => changeLang("dr")}
        className={`px-2 py-1 text-sm rounded-md transition ${
          lang === "dr"
            ? "bg-(--primary) text-white"
            : "text-(--text) hover:bg-(--hover)"
        }`}
      >
        {t("language.dr")}
      </button>

      <button
        onClick={() => changeLang("ps")}
        className={`px-2 py-1 text-sm rounded-md transition ${
          lang === "ps"
            ? "bg-(--primary) text-white"
            : "text-(--text) hover:bg-(--hover)"
        }`}
      >
        {t("language.ps")}
      </button>
    </div>
  );
}

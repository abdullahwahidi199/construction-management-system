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
    <div className="flex max-w-full flex-wrap items-center gap-1 rounded-lg border border-(--border) bg-(--card) px-1.5 py-1 sm:gap-2 sm:px-2">
      <button
        onClick={() => changeLang("en")}
        className={`rounded-md px-2 py-1 text-sm transition ${
          lang === "en"
            ? "bg-(--primary) text-white"
            : "text-(--text) hover:bg-(--hover)"
        }`}
      >
        {t("language.en")}
      </button>

      <button
        onClick={() => changeLang("dr")}
        className={`rounded-md px-2 py-1 text-sm transition ${
          lang === "dr"
            ? "bg-(--primary) text-white"
            : "text-(--text) hover:bg-(--hover)"
        }`}
      >
        {t("language.dr")}
      </button>

      <button
        onClick={() => changeLang("ps")}
        className={`rounded-md px-2 py-1 text-sm transition ${
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

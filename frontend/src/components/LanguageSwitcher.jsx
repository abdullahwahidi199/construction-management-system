import React, { useState } from "react";
import { setLanguage, getLanguage } from "../i18n";

export default function LanguageSwitcher() {
  const [lang, setLang] = useState(getLanguage());

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
        EN
      </button>

      <button
        onClick={() => changeLang("dr")}
        className={`px-2 py-1 text-sm rounded-md transition ${
          lang === "dr"
            ? "bg-(--primary) text-white"
            : "text-(--text) hover:bg-(--hover)"
        }`}
      >
        DR
      </button>

      <button
        onClick={() => changeLang("ps")}
        className={`px-2 py-1 text-sm rounded-md transition ${
          lang === "ps"
            ? "bg-(--primary) text-white"
            : "text-(--text) hover:bg-(--hover)"
        }`}
      >
        PS
      </button>
    </div>
  );
}

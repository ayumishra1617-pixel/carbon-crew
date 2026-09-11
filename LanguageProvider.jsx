import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import { LANGUAGES, uiStrings } from "@/lib/i18n";

const LanguageContext = createContext(null);
export const useLanguage = () => useContext(LanguageContext);

export default function LanguageProvider({ children }) {
  const [language, setLanguageState] = useState(() => localStorage.getItem("nupurr_lang") || "en");
  const [translations, setTranslations] = useState(() => {
    try {
      const cached = localStorage.getItem("nupurr_translations_v2");
      return cached ? JSON.parse(cached) : {};
    } catch {
      return {};
    }
  });
  const [translating, setTranslating] = useState(false);

  const setLanguage = useCallback(async (lang) => {
    setLanguageState(lang);
    localStorage.setItem("nupurr_lang", lang);
    if (lang !== "en" && !translations[lang]) {
      setTranslating(true);
      try {
        const res = await base44.functions.invoke("TranslateUI", {
          language_name: LANGUAGES[lang].name,
          strings: uiStrings,
        });
        const tr = res.data.translations || {};
        const next = { ...translations, [lang]: tr };
        setTranslations(next);
        localStorage.setItem("nupurr_translations_v2", JSON.stringify(next));
      } catch (e) {
        console.error("Translation failed", e);
      } finally {
        setTranslating(false);
      }
    }
  }, [translations]);

  const t = useCallback(
    (key) => {
      if (language === "en") return uiStrings[key] || key;
      const langMap = translations[language];
      return (langMap && langMap[key]) || uiStrings[key] || key;
    },
    [language, translations]
  );

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t, translating, languages: LANGUAGES }}>
      {children}
    </LanguageContext.Provider>
  );
}
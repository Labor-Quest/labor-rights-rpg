import { createContext, useContext, useState, useEffect } from "react";
import translations from "../i18n/ui.json";

const LanguageContext = createContext();

const STORAGE_KEY = "lrrpg-locale";

export function LanguageProvider({ children }) {
  const [locale, setLocale] = useState(() => {
    try {
      return localStorage.getItem(STORAGE_KEY) || "tl";
    } catch {
      return "tl";
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, locale);
    } catch {
      // localStorage unavailable
    }
  }, [locale]);

  function t(key) {
    return translations[locale]?.[key] || translations["en"]?.[key] || key;
  }

  return (
    <LanguageContext.Provider value={{ locale, setLocale, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  return useContext(LanguageContext);
}

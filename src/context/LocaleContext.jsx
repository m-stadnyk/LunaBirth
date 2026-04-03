import { createContext, useContext, useMemo } from "react";
import { useLocale } from "../hooks/useLocale.js";
import { createTranslator } from "../utils/i18n.js";
import en from "../i18n/en.json";
import uk from "../i18n/uk.json";

const TRANSLATIONS = { en, uk };

const LocaleContext = createContext(null);

export function LocaleProvider({ children }) {
  const { locale, setLocale, supportedLocales } = useLocale();

  const t = useMemo(
    () => createTranslator(TRANSLATIONS[locale] ?? en),
    [locale]
  );

  return (
    <LocaleContext.Provider value={{ locale, setLocale, t, supportedLocales }}>
      {children}
    </LocaleContext.Provider>
  );
}

/**
 * Returns { locale, setLocale, t, supportedLocales }.
 * Falls back to English t() when used outside a LocaleProvider (keeps tests simple).
 */
export function useLocaleContext() {
  const ctx = useContext(LocaleContext);
  if (ctx) return ctx;
  // Fallback: English translator, no-op setLocale
  return {
    locale: "en",
    setLocale: () => {},
    t: createTranslator(en),
    supportedLocales: ["en", "uk"],
  };
}

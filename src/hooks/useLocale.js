import { useState, useEffect } from "react";
import { useDatabaseContext } from "../context/DatabaseContext.jsx";

export const SUPPORTED_LOCALES = ["en", "uk"];

export function useLocale() {
  const { adapter, resetKey } = useDatabaseContext();
  const [locale, setLocaleState] = useState("en");

  useEffect(() => {
    adapter.getSettings().then((settings) => {
      if (SUPPORTED_LOCALES.includes(settings?.locale)) {
        setLocaleState(settings.locale);
      } else {
        setLocaleState("en");
      }
    });
  }, [adapter, resetKey]);

  const setLocale = (next) => {
    setLocaleState(next);
    adapter.saveSettings({ locale: next }).catch(() => {});
  };

  return { locale, setLocale, supportedLocales: SUPPORTED_LOCALES };
}

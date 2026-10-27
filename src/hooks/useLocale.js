import { useState, useEffect } from "react";
import { useDatabaseContext } from "../context/DatabaseContext.jsx";
import { useReportError } from "../context/DebugContext.jsx";

export const SUPPORTED_LOCALES = ["en", "uk"];

export function useLocale() {
  const { adapter, resetKey } = useDatabaseContext();
  const report = useReportError();
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
    adapter.saveSettings({ locale: next }).catch(report("language"));
  };

  return { locale, setLocale, supportedLocales: SUPPORTED_LOCALES };
}

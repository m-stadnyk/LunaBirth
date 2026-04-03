import { useState, useEffect } from "react";
import { storage } from "../utils/storage.js";

const KEY = "luna_locale";
export const SUPPORTED_LOCALES = ["en", "uk"];

export function useLocale() {
  const [locale, setLocaleState] = useState("en");

  useEffect(() => {
    storage.get(KEY).then((stored) => {
      if (SUPPORTED_LOCALES.includes(stored?.value)) {
        setLocaleState(stored.value);
      }
    });
  }, []);

  const setLocale = (next) => {
    setLocaleState(next);
    storage.set(KEY, next);
  };

  return { locale, setLocale, supportedLocales: SUPPORTED_LOCALES };
}

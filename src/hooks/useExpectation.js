import { useState, useEffect } from "react";
import { storage } from "../utils/storage.js";

const KEYS = { dueDate: "lc_dd", format: "lc_cdf" };

export function useExpectation() {
  const [dueDate, setDueDateState] = useState(null);
  const [countdownFormat, setCountdownFormatState] = useState("weeks");

  useEffect(() => {
    (async () => {
      try {
        const dd = await storage.get(KEYS.dueDate);
        if (dd) setDueDateState(+dd.value);
        const fmt = await storage.get(KEYS.format);
        if (fmt) setCountdownFormatState(fmt.value);
      } catch {
        // ignore
      }
    })();
  }, []);

  const setDueDate = async (ts) => {
    setDueDateState(ts);
    try { await storage.set(KEYS.dueDate, String(ts)); } catch { /* ignore */ }
  };

  const setCountdownFormat = async (fmt) => {
    setCountdownFormatState(fmt);
    try { await storage.set(KEYS.format, fmt); } catch { /* ignore */ }
  };

  return { dueDate, setDueDate, countdownFormat, setCountdownFormat };
}

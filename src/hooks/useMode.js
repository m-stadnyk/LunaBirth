import { useState, useEffect } from "react";
import { storage } from "../utils/storage.js";

const KEY = "lc_mode";

export function useMode() {
  const [mode, setModeState] = useState("labour");

  useEffect(() => {
    (async () => {
      try {
        const stored = await storage.get(KEY);
        if (stored) setModeState(stored.value);
      } catch {
        // ignore
      }
    })();
  }, []);

  const setMode = async (newMode) => {
    setModeState(newMode);
    try {
      await storage.set(KEY, newMode);
    } catch {
      // ignore
    }
  };

  return { mode, setMode };
}

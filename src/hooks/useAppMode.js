import { useState, useEffect } from "react";
import { storage } from "../utils/storage.js";

const KEY = "luna_mode";

export function useAppMode() {
  const [mode, setModeState] = useState("expectation");

  useEffect(() => {
    storage.get(KEY).then((stored) => {
      if (stored?.value === "expectation" || stored?.value === "labour") {
        setModeState(stored.value);
      }
    });
  }, []);

  const setMode = (next) => {
    setModeState(next);
    storage.set(KEY, next);
  };

  const toggleMode = () =>
    setMode(mode === "labour" ? "expectation" : "labour");

  return { mode, setMode, toggleMode };
}

import { useState, useEffect } from "react";
import { useDatabaseContext } from "../context/DatabaseContext.jsx";

export function useAppMode() {
  const { adapter, resetKey } = useDatabaseContext();
  const [mode, setModeState] = useState("expectation");

  useEffect(() => {
    adapter.getSettings().then((settings) => {
      if (settings?.mode === "labour" || settings?.mode === "expectation") {
        setModeState(settings.mode);
      } else {
        setModeState("expectation");
      }
    });
  }, [adapter, resetKey]);

  const setMode = (next) => {
    setModeState(next);
    adapter.saveSettings({ mode: next }).catch(() => {});
  };

  const toggleMode = () => setMode(mode === "labour" ? "expectation" : "labour");

  return { mode, setMode, toggleMode };
}

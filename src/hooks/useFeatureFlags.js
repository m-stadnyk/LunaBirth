import { useState, useEffect } from "react";
import { useDatabaseContext } from "../context/DatabaseContext.jsx";
import { FEATURE_FLAGS } from "../constants/featureFlags.js";

export function buildDefaults() {
  return Object.fromEntries(FEATURE_FLAGS.map((f) => [f.id, f.defaultValue]));
}

export function useFeatureFlagsState() {
  const { adapter, resetKey } = useDatabaseContext();
  const [flags, setFlags] = useState(buildDefaults);

  useEffect(() => {
    adapter.getSettings().then((settings) => {
      if (settings?.flags) {
        setFlags({ ...buildDefaults(), ...settings.flags });
      } else {
        setFlags(buildDefaults());
      }
    });
  }, [adapter, resetKey]);

  const setFlag = (id, value) => {
    setFlags((prev) => {
      const next = { ...prev, [id]: value };
      adapter.saveSettings({ flags: next }).catch(() => {});
      return next;
    });
  };

  return { flags, setFlag };
}

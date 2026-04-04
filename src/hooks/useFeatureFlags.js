import { useState, useEffect } from "react";
import { storage } from "../utils/storage.js";
import { FEATURE_FLAGS } from "../constants/featureFlags.js";

const KEY = "luna_flags";

function buildDefaults() {
  return Object.fromEntries(FEATURE_FLAGS.map((f) => [f.id, f.defaultValue]));
}

export function useFeatureFlagsState() {
  const [flags, setFlags] = useState(buildDefaults);

  useEffect(() => {
    storage.get(KEY).then((stored) => {
      if (!stored?.value) return;
      try {
        const overrides = JSON.parse(stored.value);
        // Merge so new flags added to constants default to true
        // even when stored JSON predates them
        setFlags((prev) => ({ ...prev, ...overrides }));
      } catch {
        // Malformed JSON — keep defaults
      }
    });
  }, []);

  const setFlag = (id, value) => {
    setFlags((prev) => {
      const next = { ...prev, [id]: value };
      storage.set(KEY, JSON.stringify(next));
      return next;
    });
  };

  return { flags, setFlag };
}

export { buildDefaults };

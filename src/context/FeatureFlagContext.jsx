import { createContext, useContext } from "react";
import { useFeatureFlagsState, buildDefaults } from "../hooks/useFeatureFlags.js";
import { FEATURE_FLAGS } from "../constants/featureFlags.js";

const FeatureFlagContext = createContext(null);

export function FeatureFlagProvider({ children }) {
  const { flags, setFlag } = useFeatureFlagsState();

  return (
    <FeatureFlagContext.Provider value={{ flags, setFlag, flagDefs: FEATURE_FLAGS }}>
      {children}
    </FeatureFlagContext.Provider>
  );
}

export function useFeatureFlags() {
  const ctx = useContext(FeatureFlagContext);
  if (ctx) return ctx;
  // Fallback for components rendered outside the provider (e.g. isolated tests)
  return { flags: buildDefaults(), setFlag: () => {}, flagDefs: FEATURE_FLAGS };
}

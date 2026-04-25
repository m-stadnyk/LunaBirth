import { createContext, useContext, useState, useCallback } from "react";

const DebugContext = createContext({
  errors: [],
  pushError: () => {},
  clearError: () => {},
});

/**
 * Provides a global error queue for the debug popup feature.
 * Errors are pushed by hooks/adapters and cleared by the user.
 * The DebugPopup component renders them when the debugPopup feature flag is on.
 */
export function DebugProvider({ children }) {
  const [errors, setErrors] = useState([]);

  const pushError = useCallback((message) => {
    setErrors((prev) => [...prev, { id: Date.now() + Math.random(), message: String(message) }]);
  }, []);

  const clearError = useCallback((id) => {
    setErrors((prev) => prev.filter((e) => e.id !== id));
  }, []);

  return (
    <DebugContext.Provider value={{ errors, pushError, clearError }}>
      {children}
    </DebugContext.Provider>
  );
}

export function useDebug() {
  return useContext(DebugContext);
}

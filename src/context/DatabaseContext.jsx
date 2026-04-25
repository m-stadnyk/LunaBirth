import { createContext, useContext, useState, useCallback } from "react";
import { LocalAdapter } from "../adapters/LocalAdapter.js";

const localAdapter = new LocalAdapter();

/**
 * Context shape: { adapter, setAdapter, resetKey, clearData }
 * - adapter:   the active DatabaseAdapter instance
 * - setAdapter: swap the active adapter (called by useCloudSync on sign-in/sign-out)
 * - resetKey:  increments each time clearData() runs — hooks add it to their
 *              useEffect deps so they automatically reload after a data clear
 * - clearData: clear specific categories of data via the active adapter
 */
export const DatabaseContext = createContext({
  adapter: localAdapter,
  setAdapter: () => {},
  resetKey: 0,
  clearData: async () => {},
});

/**
 * Return the active DatabaseAdapter instance.
 * Use this in hooks that need storage access.
 */
export function useDatabase() {
  return useContext(DatabaseContext).adapter;
}

/**
 * Return the full database context: { adapter, setAdapter, resetKey, clearData }.
 * Use this in hooks that also need to react to data resets (resetKey).
 */
export function useDatabaseContext() {
  return useContext(DatabaseContext);
}

/**
 * Provides the active database adapter to the component tree.
 * Starts with LocalAdapter (offline-first, zero setup required).
 * useCloudSync calls setAdapter to upgrade to SupabaseAdapter after sign-in.
 */
export function DatabaseProvider({ children }) {
  const [adapter, setAdapter] = useState(localAdapter);
  const [resetKey, setResetKey] = useState(0);

  const clearData = useCallback(async (categories) => {
    await adapter.clearData(categories);
    setResetKey((k) => k + 1);
  }, [adapter]);

  return (
    <DatabaseContext.Provider value={{ adapter, setAdapter, resetKey, clearData }}>
      {children}
    </DatabaseContext.Provider>
  );
}

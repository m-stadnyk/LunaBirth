import { createContext, useContext, useState } from "react";
import { LocalAdapter } from "../adapters/LocalAdapter.js";

const localAdapter = new LocalAdapter();

/**
 * Context shape: { adapter, setAdapter }
 * - adapter: the active DatabaseAdapter instance
 * - setAdapter: swap the active adapter (called by useCloudSync on sign-in/sign-out)
 */
export const DatabaseContext = createContext({
  adapter: localAdapter,
  setAdapter: () => {},
});

/**
 * Return the active DatabaseAdapter instance.
 * Use this in any hook that needs storage access.
 *
 * @returns {import("../adapters/DatabaseAdapter.js").DatabaseAdapter}
 */
export function useDatabase() {
  return useContext(DatabaseContext).adapter;
}

/**
 * Provides the active database adapter to the component tree.
 * Starts with LocalAdapter (offline-first, zero setup required).
 * useCloudSync calls setAdapter to upgrade to SupabaseAdapter after sign-in.
 */
export function DatabaseProvider({ children }) {
  const [adapter, setAdapter] = useState(localAdapter);

  return (
    <DatabaseContext.Provider value={{ adapter, setAdapter }}>
      {children}
    </DatabaseContext.Provider>
  );
}

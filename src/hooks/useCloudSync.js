import { useState, useEffect, useContext, useCallback } from "react";
import { storage } from "../utils/storage.js";
import { DatabaseContext } from "../context/DatabaseContext.jsx";
import { LocalAdapter } from "../adapters/LocalAdapter.js";

const KEYS = {
  uid: "luna_cloud_uid",
  sessionId: "luna_session_id",
  role: "luna_user_role",
  lastSync: "luna_cloud_last_sync",
  inviteCode: "luna_invite_code",
};

/**
 * Manages cloud authentication, session sharing, and manual sync.
 *
 * Flow for primary user:
 *   1. signIn() → anonymous auth + createSession() → returns inviteCode
 *   2. Share inviteCode with partner (show in settings)
 *   3. sync() → pushes all local data to Supabase
 *
 * Flow for partner:
 *   1. joinAsPartner(code) → anonymous auth + joinSession(code)
 *   2. Data from primary becomes visible via Realtime subscriptions
 *
 * Sign-out reverts the context adapter back to LocalAdapter.
 */
export function useCloudSync() {
  const { setAdapter } = useContext(DatabaseContext);

  const [isSignedIn, setIsSignedIn] = useState(false);
  const [sessionId, setSessionId] = useState(null);
  const [inviteCode, setInviteCode] = useState(null);
  const [role, setRole] = useState(null); // "primary" | "partner"
  const [syncing, setSyncing] = useState(false);
  const [lastSynced, setLastSynced] = useState(null);
  const [error, setError] = useState(null);

  // Restore persisted session on mount
  useEffect(() => {
    (async () => {
      const [uid, sid, r, ls, ic] = await Promise.all([
        storage.get(KEYS.uid),
        storage.get(KEYS.sessionId),
        storage.get(KEYS.role),
        storage.get(KEYS.lastSync),
        storage.get(KEYS.inviteCode),
      ]);

      if (uid?.value && sid?.value) {
        // Re-hydrate the SupabaseAdapter with the persisted session
        try {
          const { SupabaseAdapter } = await import("../adapters/SupabaseAdapter.js");
          const adapter = new SupabaseAdapter();
          await adapter.signInAnonymously();
          // Restore internal session state via joinSession/createSession is not ideal;
          // instead we set a flag and let the adapter reconstruct lazily.
          // For now, mark as signed in and let the user re-sync if needed.
          setAdapter(adapter);
          setIsSignedIn(true);
          setSessionId(sid.value);
          setRole(r?.value ?? "primary");
          setLastSynced(ls?.value ? +ls.value : null);
          setInviteCode(ic?.value ?? null);
        } catch {
          // Credentials expired or network error — stay in local mode
        }
      }
    })();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  /**
   * Sign in as the primary user: anonymous auth + create a new birth session.
   */
  const signIn = useCallback(async () => {
    setError(null);
    setSyncing(true);
    try {
      const { SupabaseAdapter } = await import("../adapters/SupabaseAdapter.js");
      const adapter = new SupabaseAdapter();
      const { userId } = await adapter.signInAnonymously();
      const { sessionId: sid, inviteCode: code } = await adapter.createSession();

      // Push existing local data to cloud immediately after creating session
      const local = new LocalAdapter();
      const [contractions, hydration, todos, settings] = await Promise.all([
        local.getContractions(),
        local.getHydration(),
        local.getTodos(),
        local.getSettings(),
      ]);

      // Set the session on the new adapter before saving
      // (SupabaseAdapter tracks sessionId internally after createSession)
      await Promise.all([
        adapter.saveContractions(contractions),
        adapter.saveHydration(hydration ?? {}),
        adapter.saveTodos(todos),
        adapter.saveSettings(settings ?? {}),
      ]);

      const now = Date.now();
      await Promise.all([
        storage.set(KEYS.uid, userId),
        storage.set(KEYS.sessionId, sid),
        storage.set(KEYS.role, "primary"),
        storage.set(KEYS.lastSync, String(now)),
        storage.set(KEYS.inviteCode, code),
      ]);

      setAdapter(adapter);
      setIsSignedIn(true);
      setSessionId(sid);
      setInviteCode(code);
      setRole("primary");
      setLastSynced(now);
    } catch (err) {
      setError(err.message ?? "Sign-in failed");
    } finally {
      setSyncing(false);
    }
  }, [setAdapter]);

  /**
   * Join an existing session as a partner using the 6-character invite code.
   * @param {string} code
   */
  const joinAsPartner = useCallback(async (code) => {
    setError(null);
    setSyncing(true);
    try {
      const { SupabaseAdapter } = await import("../adapters/SupabaseAdapter.js");
      const adapter = new SupabaseAdapter();
      const { userId } = await adapter.signInAnonymously();
      const { sessionId: sid } = await adapter.joinSession(code);

      const now = Date.now();
      await Promise.all([
        storage.set(KEYS.uid, userId),
        storage.set(KEYS.sessionId, sid),
        storage.set(KEYS.role, "partner"),
        storage.set(KEYS.lastSync, String(now)),
        storage.set(KEYS.inviteCode, code),
      ]);

      setAdapter(adapter);
      setIsSignedIn(true);
      setSessionId(sid);
      setInviteCode(code);
      setRole("partner");
      setLastSynced(now);
    } catch (err) {
      setError(err.message ?? "Failed to join session");
    } finally {
      setSyncing(false);
    }
  }, [setAdapter]);

  /**
   * Push all current local data to the cloud (primary only).
   */
  const sync = useCallback(async () => {
    if (!isSignedIn || role === "partner") return;
    setError(null);
    setSyncing(true);
    try {
      const { SupabaseAdapter } = await import("../adapters/SupabaseAdapter.js");
      const adapter = new SupabaseAdapter();
      const local = new LocalAdapter();
      const [contractions, hydration, todos, settings] = await Promise.all([
        local.getContractions(),
        local.getHydration(),
        local.getTodos(),
        local.getSettings(),
      ]);
      await Promise.all([
        adapter.saveContractions(contractions),
        adapter.saveHydration(hydration ?? {}),
        adapter.saveTodos(todos),
        adapter.saveSettings(settings ?? {}),
      ]);
      const now = Date.now();
      await storage.set(KEYS.lastSync, String(now));
      setLastSynced(now);
    } catch (err) {
      setError(err.message ?? "Sync failed");
    } finally {
      setSyncing(false);
    }
  }, [isSignedIn, role]);

  /**
   * Sign out and revert to local-only storage.
   */
  const signOut = useCallback(async () => {
    setError(null);
    try {
      const { SupabaseAdapter } = await import("../adapters/SupabaseAdapter.js");
      const adapter = new SupabaseAdapter();
      await adapter.signOut();
    } catch {
      // Best-effort sign-out — proceed regardless
    }

    // Clear persisted cloud credentials
    await Promise.all([
      storage.set(KEYS.uid, ""),
      storage.set(KEYS.sessionId, ""),
      storage.set(KEYS.role, ""),
      storage.set(KEYS.lastSync, ""),
      storage.set(KEYS.inviteCode, ""),
    ]);

    setAdapter(new LocalAdapter());
    setIsSignedIn(false);
    setSessionId(null);
    setInviteCode(null);
    setRole(null);
    setLastSynced(null);
  }, [setAdapter]);

  return {
    isSignedIn,
    sessionId,
    inviteCode,
    role,
    syncing,
    lastSynced,
    error,
    signIn,
    joinAsPartner,
    sync,
    signOut,
  };
}

import { useState, useEffect, useContext, useCallback, useRef } from "react";
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
 * @param {object} [options]
 * @param {string} [options.mode]               Current app mode ("labour"|"expectation").
 *   When the primary user is signed in, any change to this value is immediately
 *   persisted to Supabase so the partner receives it via Realtime.
 * @param {function} [options.onRemoteModeChange]  Called with the new mode string
 *   when the partner detects that the primary has switched modes.
 *
 * Flow for primary user:
 *   1. signIn() → anonymous auth + createSession() → returns inviteCode
 *   2. Share inviteCode with partner (show in settings)
 *   3. sync() → pushes all local data to Supabase
 *
 * Flow for partner:
 *   1. joinAsPartner(code) → anonymous auth + joinSession(code)
 *   2. Data from primary becomes visible via Realtime subscriptions
 *   3. Mode changes from primary arrive via subscribeSettings → onRemoteModeChange
 *
 * Sign-out reverts the context adapter back to LocalAdapter.
 */
export function useCloudSync({ mode, onRemoteModeChange } = {}) {
  const { setAdapter } = useContext(DatabaseContext);

  const [isSignedIn, setIsSignedIn] = useState(false);
  const [sessionId, setSessionId] = useState(null);
  const [inviteCode, setInviteCode] = useState(null);
  const [role, setRole] = useState(null); // "primary" | "partner"
  const [syncing, setSyncing] = useState(false);
  const [lastSynced, setLastSynced] = useState(null);
  const [error, setError] = useState(null);

  // Holds the active SupabaseAdapter instance so we can call saveSettings / subscribeSettings
  // without needing to instantiate a new adapter (which wouldn't have #sessionId set).
  const adapterRef = useRef(null);

  // Holds the unsubscribe function for the settings Realtime channel.
  const settingsUnsubRef = useRef(null);

  // ── Settings subscription (partner) ─────────────────────────────────────────

  const setupSettingsSubscription = useCallback((adapter) => {
    if (settingsUnsubRef.current) {
      settingsUnsubRef.current();
      settingsUnsubRef.current = null;
    }
    settingsUnsubRef.current = adapter.subscribeSettings((settings) => {
      if (settings.mode && onRemoteModeChange) {
        onRemoteModeChange(settings.mode);
      }
    });
  }, [onRemoteModeChange]);

  // ── Restore persisted session on mount ────────────────────────────────────────

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
        try {
          const { SupabaseAdapter } = await import("../adapters/SupabaseAdapter.js");
          const adapter = new SupabaseAdapter();
          // The Supabase SDK auto-restores the auth session from its own localStorage
          // key on client creation. Verify it's still valid before proceeding.
          const user = await adapter.getCurrentUser();
          if (!user) throw new Error("Session expired");

          const restoredRole = r?.value ?? "primary";
          adapter.restoreSession(sid.value, restoredRole);
          adapterRef.current = adapter;
          setAdapter(adapter);
          setIsSignedIn(true);
          setSessionId(sid.value);
          setRole(restoredRole);
          setLastSynced(ls?.value ? +ls.value : null);
          setInviteCode(ic?.value ?? null);

          if (restoredRole === "partner") {
            setupSettingsSubscription(adapter);
          }
        } catch {
          // Credentials expired or network error — stay in local mode
        }
      }
    })();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Auto-sync mode for primary ────────────────────────────────────────────────
  // Whenever the primary user changes mode, push it to Supabase immediately so
  // the partner receives the update via Realtime.

  useEffect(() => {
    if (!isSignedIn || role !== "primary" || !mode || !adapterRef.current) return;
    adapterRef.current.saveSettings({ mode }).catch(() => {});
  }, [mode, isSignedIn, role]);

  // ── Cleanup on unmount ────────────────────────────────────────────────────────

  useEffect(() => {
    return () => {
      if (settingsUnsubRef.current) {
        settingsUnsubRef.current();
        settingsUnsubRef.current = null;
      }
    };
  }, []);

  // ── signIn (primary) ─────────────────────────────────────────────────────────

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
        adapter.saveSettings({ ...(settings ?? {}), mode }),
      ]);

      const now = Date.now();
      await Promise.all([
        storage.set(KEYS.uid, userId),
        storage.set(KEYS.sessionId, sid),
        storage.set(KEYS.role, "primary"),
        storage.set(KEYS.lastSync, String(now)),
        storage.set(KEYS.inviteCode, code),
      ]);

      adapterRef.current = adapter;
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
  }, [setAdapter, mode]);

  // ── joinAsPartner ─────────────────────────────────────────────────────────────

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

      adapterRef.current = adapter;
      setAdapter(adapter);
      setIsSignedIn(true);
      setSessionId(sid);
      setInviteCode(code);
      setRole("partner");
      setLastSynced(now);

      setupSettingsSubscription(adapter);
    } catch (err) {
      setError(err.message ?? "Failed to join session");
    } finally {
      setSyncing(false);
    }
  }, [setAdapter, setupSettingsSubscription]);

  // ── sync (primary manual push) ────────────────────────────────────────────────

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

  // ── signOut ───────────────────────────────────────────────────────────────────

  const signOut = useCallback(async () => {
    setError(null);

    // Tear down settings subscription before clearing state
    if (settingsUnsubRef.current) {
      settingsUnsubRef.current();
      settingsUnsubRef.current = null;
    }

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

    adapterRef.current = null;
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

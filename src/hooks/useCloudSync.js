import { useState, useEffect, useContext, useCallback, useRef } from "react";
import { storage } from "../utils/storage.js";
import { DatabaseContext } from "../context/DatabaseContext.jsx";
import { LocalAdapter } from "../adapters/LocalAdapter.js";
import { useDebug } from "../context/DebugContext.jsx";

// Auth-metadata keys — stored directly in localStorage, not through the adapter.
// These survive clearData() so the session can be restored on reload.
const AUTH_KEYS = {
  uid: "luna_cloud_uid",
  sessionId: "luna_session_id",
  role: "luna_user_role",
  lastSync: "luna_cloud_last_sync",
  inviteCode: "luna_invite_code",
};

const HYDRATION_DEFAULTS = {
  drinkCount: 0,
  lastDrank: Date.now(),
  drinkInterval: 15,
  intervals: [5, 15, 30],
};

async function writeAuthKeys({ uid, sessionId, role, inviteCode }) {
  await Promise.all([
    storage.set(AUTH_KEYS.uid, uid),
    storage.set(AUTH_KEYS.sessionId, sessionId),
    storage.set(AUTH_KEYS.role, role),
    storage.set(AUTH_KEYS.inviteCode, inviteCode),
    storage.set(AUTH_KEYS.lastSync, String(Date.now())),
  ]);
}

async function clearAuthKeys() {
  await Promise.all(Object.values(AUTH_KEYS).map((k) => storage.remove(k)));
}

/**
 * Manages cloud authentication, session creation, partner join, and unsync.
 *
 * Architecture:
 * - All app data flows through the active adapter (LocalAdapter or SupabaseAdapter).
 * - On signIn: local data is pushed to Supabase, local data is cleared, adapter swaps.
 * - On unsync: Supabase data is pulled to local, cloud session is destroyed, adapter swaps.
 * - Auth metadata (uid, sessionId, role, inviteCode) lives in localStorage separately
 *   from app data so sessions survive page reloads.
 *
 * @param {object} [options]
 * @param {function} [options.onRemoteModeChange] Called when partner detects primary switched modes.
 */
export function useCloudSync({ onRemoteModeChange } = {}) {
  const { setAdapter } = useContext(DatabaseContext);
  const { pushError } = useDebug();

  const [isSignedIn, setIsSignedIn] = useState(false);
  const [sessionId, setSessionId] = useState(null);
  const [inviteCode, setInviteCode] = useState(null);
  const [role, setRole] = useState(null);
  const [syncing, setSyncing] = useState(false);
  const [lastSynced, setLastSynced] = useState(null);
  const [error, setError] = useState(null);

  const adapterRef = useRef(null);
  const settingsUnsubRef = useRef(null);

  // ── Settings subscription for partner mode ────────────────────────────────

  const setupSettingsSubscription = useCallback((adapter) => {
    settingsUnsubRef.current?.();
    settingsUnsubRef.current = adapter.subscribeSettings((settings) => {
      if (settings.mode && onRemoteModeChange) {
        onRemoteModeChange(settings.mode);
      }
    });
  }, [onRemoteModeChange]);

  // ── Restore persisted session on mount ────────────────────────────────────

  useEffect(() => {
    (async () => {
      const [uid, sid, r, ls, ic] = await Promise.all([
        storage.get(AUTH_KEYS.uid),
        storage.get(AUTH_KEYS.sessionId),
        storage.get(AUTH_KEYS.role),
        storage.get(AUTH_KEYS.lastSync),
        storage.get(AUTH_KEYS.inviteCode),
      ]);

      if (!uid?.value || !sid?.value) return;

      try {
        const { SupabaseAdapter } = await import("../adapters/SupabaseAdapter.js");
        const adapter = new SupabaseAdapter();

        // Supabase persists auth state in its own localStorage; getCurrentUser()
        // works without a fresh sign-in on page reload.
        const user = await adapter.getCurrentUser();
        if (!user) throw new Error("Session expired");

        const restoredRole = r?.value || "primary";
        adapter.restoreSession(sid.value, restoredRole);
        adapterRef.current = adapter;
        setAdapter(adapter);
        setIsSignedIn(true);
        setSessionId(sid.value);
        setRole(restoredRole);
        setLastSynced(ls?.value ? +ls.value : null);
        setInviteCode(ic?.value || null);

        if (restoredRole === "partner") {
          setupSettingsSubscription(adapter);
        }
      } catch {
        // Credentials expired or network error — silently remain in local mode
      }
    })();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Cleanup on unmount ────────────────────────────────────────────────────

  useEffect(() => () => { settingsUnsubRef.current?.(); }, []);

  // ── signIn — upload local data to Supabase, create shared session ─────────

  const signIn = useCallback(async () => {
    setError(null);
    setSyncing(true);
    try {
      const { SupabaseAdapter } = await import("../adapters/SupabaseAdapter.js");
      const cloudAdapter = new SupabaseAdapter();
      const { userId } = await cloudAdapter.signInAnonymously();
      const { sessionId: sid, inviteCode: code } = await cloudAdapter.createSession();

      // Read everything from local before swapping adapter
      const local = new LocalAdapter();
      const [contractions, hydration, todos, settings, contacts] = await Promise.all([
        local.getContractions(),
        local.getHydration(),
        local.getTodos(),
        local.getSettings(),
        local.getContacts(),
      ]);

      // Push all data (including all settings fields) to the cloud session
      await Promise.all([
        cloudAdapter.saveContractions(contractions),
        cloudAdapter.saveHydration(hydration ?? HYDRATION_DEFAULTS),
        cloudAdapter.saveTodos(todos),
        cloudAdapter.saveSettings(settings ?? {}),
        cloudAdapter.saveContacts(contacts),
      ]);

      // Clear local data — it now lives exclusively in Supabase
      await local.clearData(["contractions", "hydration", "todos", "contacts", "relief", "appSettings"]);

      await writeAuthKeys({ uid: userId, sessionId: sid, role: "primary", inviteCode: code });

      adapterRef.current = cloudAdapter;
      setAdapter(cloudAdapter);
      setIsSignedIn(true);
      setSessionId(sid);
      setInviteCode(code);
      setRole("primary");
      setLastSynced(Date.now());
    } catch (err) {
      const msg = err.message ?? "Sign-in failed";
      setError(msg);
      pushError(`Cloud sync: ${msg}`);
    } finally {
      setSyncing(false);
    }
  }, [setAdapter, pushError]);

  // ── joinAsPartner — connect to an existing primary session ────────────────

  const joinAsPartner = useCallback(async (code) => {
    setError(null);
    setSyncing(true);
    try {
      const { SupabaseAdapter } = await import("../adapters/SupabaseAdapter.js");
      const cloudAdapter = new SupabaseAdapter();
      const { userId } = await cloudAdapter.signInAnonymously();
      const { sessionId: sid } = await cloudAdapter.joinSession(code);

      await writeAuthKeys({ uid: userId, sessionId: sid, role: "partner", inviteCode: code });

      adapterRef.current = cloudAdapter;
      setAdapter(cloudAdapter);
      setIsSignedIn(true);
      setSessionId(sid);
      setInviteCode(code);
      setRole("partner");
      setLastSynced(Date.now());

      setupSettingsSubscription(cloudAdapter);
    } catch (err) {
      const msg = err.message ?? "Failed to join session";
      setError(msg);
      pushError(`Partner join: ${msg}`);
    } finally {
      setSyncing(false);
    }
  }, [setAdapter, setupSettingsSubscription, pushError]);

  // ── unsync — download cloud data to local, destroy session, go offline ────

  const unsync = useCallback(async () => {
    setError(null);
    setSyncing(true);

    settingsUnsubRef.current?.();
    settingsUnsubRef.current = null;

    const localAdapter = new LocalAdapter();

    if (adapterRef.current) {
      try {
        const [contractions, hydration, todos, contacts, settings] = await Promise.all([
          adapterRef.current.getContractions(),
          adapterRef.current.getHydration(),
          adapterRef.current.getTodos(),
          adapterRef.current.getContacts(),
          adapterRef.current.getSettings(),
        ]);

        await Promise.all([
          localAdapter.saveContractions(contractions ?? []),
          localAdapter.saveHydration(hydration ?? { ...HYDRATION_DEFAULTS, lastDrank: Date.now() }),
          localAdapter.saveTodos(todos ?? []),
          localAdapter.saveContacts(contacts ?? []),
          localAdapter.saveSettings(settings ?? {}),
        ]);

        // Destroy the cloud session (disables partner access and clears cloud data)
        await adapterRef.current.destroySession();
        await adapterRef.current.signOut();
      } catch (err) {
        const msg = err.message ?? "Failed to unsync cleanly";
        pushError(`Unsync: ${msg}`);
        // Continue with unsync regardless — we still switch to local mode
      }
    }

    await clearAuthKeys();

    adapterRef.current = null;
    setAdapter(localAdapter);
    setIsSignedIn(false);
    setSessionId(null);
    setInviteCode(null);
    setRole(null);
    setLastSynced(null);
    setSyncing(false);
  }, [setAdapter, pushError]);

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
    unsync,
    // Keep signOut as an alias so existing callsites don't break
    signOut: unsync,
  };
}

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

const HYDRATION_DEFAULTS = { drinkCount: 0, lastDrank: Date.now(), drinkInterval: 15, intervals: [5, 15, 30] };

/**
 * Manages cloud authentication, session sharing, and manual sync.
 *
 * @param {object} [options]
 * @param {string} [options.mode]               Current app mode ("labour"|"expectation").
 * @param {string} [options.dueDate]            Current due date ISO string.
 * @param {string} [options.countdownUnit]      Current countdown unit preference.
 * @param {function} [options.onRemoteModeChange]  Called when partner detects primary switched modes.
 */
export function useCloudSync({ mode, dueDate, countdownUnit, onRemoteModeChange } = {}) {
  const { setAdapter } = useContext(DatabaseContext);

  const [isSignedIn, setIsSignedIn] = useState(false);
  const [sessionId, setSessionId] = useState(null);
  const [inviteCode, setInviteCode] = useState(null);
  const [role, setRole] = useState(null); // "primary" | "partner"
  const [syncing, setSyncing] = useState(false);
  const [lastSynced, setLastSynced] = useState(null);
  const [error, setError] = useState(null);

  const adapterRef = useRef(null);
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

  useEffect(() => {
    if (!isSignedIn || role !== "primary" || !mode || !adapterRef.current) return;
    adapterRef.current.saveSettings({ mode }).catch(() => {});
  }, [mode, isSignedIn, role]);

  // ── Auto-sync dueDate + countdownUnit for primary ─────────────────────────────
  // useDueDate writes directly to localStorage (bypasses the adapter), so we
  // mirror changes to Supabase here whenever the primary is signed in.

  useEffect(() => {
    if (!isSignedIn || role !== "primary" || !adapterRef.current) return;
    if (dueDate === undefined && countdownUnit === undefined) return;
    adapterRef.current.saveSettings({ dueDate, countdownUnit }).catch(() => {});
  }, [dueDate, countdownUnit, isSignedIn, role]);

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

      // Push all local data to cloud immediately after creating session
      const local = new LocalAdapter();
      const [contractions, hydration, todos, settings, contacts] = await Promise.all([
        local.getContractions(),
        local.getHydration(),
        local.getTodos(),
        local.getSettings(),
        local.getContacts(),
      ]);

      await Promise.all([
        adapter.saveContractions(contractions),
        adapter.saveHydration(hydration ?? {}),
        adapter.saveTodos(todos),
        adapter.saveSettings({ ...(settings ?? {}), mode }),
        adapter.saveContacts(contacts),
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

      // Best-effort: clear local copies now that data lives in the cloud.
      // Settings keys are intentionally excluded — useAppMode/useDueDate read them directly.
      try {
        await Promise.all([
          local.saveTodos([]),
          local.saveContractions([]),
          local.saveContacts([]),
          local.saveHydration({ drinkCount: 0, lastDrank: Date.now(), drinkInterval: 15, intervals: [5, 15, 30] }),
        ]);
      } catch {
        // Cleanup is best-effort; ignore any errors
      }

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

    // ── Cloud → Local migration ────────────────────────────────────────────────
    // Fetch all cloud data before disconnecting so the user retains their data
    // in local mode. Uses adapterRef.current (has #sessionId); skip if null.
    // One LocalAdapter instance is created here and reused for setAdapter below.
    const localAdapter = new LocalAdapter();
    if (adapterRef.current) {
      try {
        const [contractions, hydration, todos, contacts, cloudSettings, localSettings] =
          await Promise.all([
            adapterRef.current.getContractions(),
            adapterRef.current.getHydration(),
            adapterRef.current.getTodos(),
            adapterRef.current.getContacts(),
            adapterRef.current.getSettings(),
            localAdapter.getSettings(),
          ]);
        await Promise.all([
          localAdapter.saveContractions(contractions ?? []),
          localAdapter.saveHydration(hydration ?? { ...HYDRATION_DEFAULTS, lastDrank: Date.now() }),
          localAdapter.saveTodos(todos ?? []),
          localAdapter.saveContacts(contacts ?? []),
          // Merge: prefer local values for adapter-bypassing fields (dueDate, mode, locale,
          // countdownUnit, flags); take reliefMethods from cloud since useRelief is adapter-managed.
          localAdapter.saveSettings({
            ...(localSettings ?? {}),
            reliefMethods: cloudSettings?.reliefMethods,
          }),
        ]);
      } catch {
        // Migration is best-effort — proceed with sign-out regardless
      }
    }

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
    setAdapter(localAdapter); // reuse the instance that received migrated data
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

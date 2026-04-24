import { DatabaseAdapter } from "./DatabaseAdapter.js";
import { storage } from "../utils/storage.js";

const LS_KEYS = {
  contractions: "lc_c4",
  reliefMethods: "lc_m4",
  drinkCount: "lc_dc",
  lastDrank: "lc_ld",
  drinkInterval: "lc_di",
  intervals: "lc_iv",
  mode: "luna_mode",
  locale: "luna_locale",
  dueDate: "luna_due_date",
  countdownUnit: "luna_countdown_unit",
  todos: "luna_todos",
  flags: "luna_flags",
  labourContacts: "luna_contacts",
};

/**
 * LocalAdapter — implements DatabaseAdapter using browser localStorage.
 *
 * This is the default adapter. It preserves existing behavior exactly.
 * No auth, no sessions, no real-time subscriptions (subscribe* return no-ops).
 */
export class LocalAdapter extends DatabaseAdapter {
  // ─── Auth (no-op — local storage has no concept of users) ─────────────────

  async signInAnonymously() {
    return { userId: "local" };
  }

  async signOut() {
    // Nothing to do for local storage
  }

  async getCurrentUser() {
    return { userId: "local", role: "primary" };
  }

  // ─── Session (no-op) ───────────────────────────────────────────────────────

  async createSession() {
    return { sessionId: "local", inviteCode: null };
  }

  async joinSession() {
    // Not supported in local mode — silently ignored
  }

  async getSessionId() {
    return "local";
  }

  // ─── Contractions ──────────────────────────────────────────────────────────

  async saveContractions(contractions) {
    await storage.set(LS_KEYS.contractions, JSON.stringify(contractions));
  }

  async getContractions() {
    const stored = await storage.get(LS_KEYS.contractions);
    if (!stored?.value) return [];
    try { return JSON.parse(stored.value); } catch { return []; }
  }

  subscribeContractions() {
    return () => {}; // No real-time in local mode
  }

  // ─── Hydration ─────────────────────────────────────────────────────────────

  async saveHydration({ drinkCount, lastDrank, drinkInterval, intervals }) {
    await Promise.all([
      storage.set(LS_KEYS.drinkCount, String(drinkCount)),
      storage.set(LS_KEYS.lastDrank, String(lastDrank)),
      storage.set(LS_KEYS.drinkInterval, String(drinkInterval)),
      storage.set(LS_KEYS.intervals, JSON.stringify(intervals)),
    ]);
  }

  async getHydration() {
    const [dc, ld, di, iv] = await Promise.all([
      storage.get(LS_KEYS.drinkCount),
      storage.get(LS_KEYS.lastDrank),
      storage.get(LS_KEYS.drinkInterval),
      storage.get(LS_KEYS.intervals),
    ]);
    return {
      drinkCount: dc ? +dc.value || 0 : 0,
      lastDrank: ld ? +ld.value || Date.now() : Date.now(),
      drinkInterval: di ? +di.value || 15 : 15,
      intervals: iv ? (() => { try { return JSON.parse(iv.value); } catch { return [5, 15, 30]; } })() : [5, 15, 30],
    };
  }

  // ─── Todos ─────────────────────────────────────────────────────────────────

  async saveTodos(todos) {
    await storage.set(LS_KEYS.todos, JSON.stringify(todos));
  }

  async getTodos() {
    const stored = await storage.get(LS_KEYS.todos);
    if (!stored?.value) return [];
    try { return JSON.parse(stored.value); } catch { return []; }
  }

  subscribeTodos() {
    return () => {}; // No real-time in local mode
  }

  // ─── Settings ──────────────────────────────────────────────────────────────

  async saveSettings({ mode, locale, dueDate, countdownUnit, reliefMethods, flags } = {}) {
    const ops = [];
    if (mode !== undefined) ops.push(storage.set(LS_KEYS.mode, mode));
    if (locale !== undefined) ops.push(storage.set(LS_KEYS.locale, locale));
    if (dueDate !== undefined) ops.push(storage.set(LS_KEYS.dueDate, dueDate));
    if (countdownUnit !== undefined) ops.push(storage.set(LS_KEYS.countdownUnit, countdownUnit));
    if (reliefMethods !== undefined) ops.push(storage.set(LS_KEYS.reliefMethods, JSON.stringify(reliefMethods)));
    if (flags !== undefined) ops.push(storage.set(LS_KEYS.flags, JSON.stringify(flags)));
    await Promise.all(ops);
  }

  // ─── Labour Contacts ───────────────────────────────────────────────────────

  async saveContacts(contacts) {
    await storage.set(LS_KEYS.labourContacts, JSON.stringify(contacts));
  }

  async getContacts() {
    const stored = await storage.get(LS_KEYS.labourContacts);
    if (!stored?.value) return [];
    try { return JSON.parse(stored.value); } catch { return []; }
  }

  async getSettings() {
    const [mode, locale, dueDate, countdownUnit, reliefMethods, flags] = await Promise.all([
      storage.get(LS_KEYS.mode),
      storage.get(LS_KEYS.locale),
      storage.get(LS_KEYS.dueDate),
      storage.get(LS_KEYS.countdownUnit),
      storage.get(LS_KEYS.reliefMethods),
      storage.get(LS_KEYS.flags),
    ]);
    return {
      mode: mode?.value ?? null,
      locale: locale?.value ?? null,
      dueDate: dueDate?.value ?? null,
      countdownUnit: countdownUnit?.value ?? null,
      reliefMethods: reliefMethods?.value ? (() => { try { return JSON.parse(reliefMethods.value); } catch { return null; } })() : null,
      flags: flags?.value ? (() => { try { return JSON.parse(flags.value); } catch { return null; } })() : null,
    };
  }
}

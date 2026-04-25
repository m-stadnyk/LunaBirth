import { DatabaseAdapter } from "./DatabaseAdapter.js";
import { storage } from "../utils/storage.js";

const LS = {
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
  contacts: "luna_contacts",
};

function parseJSON(raw, fallback) {
  if (!raw?.value) return fallback;
  try { return JSON.parse(raw.value); } catch { return fallback; }
}

/**
 * LocalAdapter — implements DatabaseAdapter using browser localStorage.
 *
 * Default adapter (offline-first, zero setup). No auth, sessions, or real-time.
 * Settings are stored individually under their respective localStorage keys so
 * each field can be updated without touching the others (merge semantic).
 */
export class LocalAdapter extends DatabaseAdapter {
  // ─── Auth (no-op) ─────────────────────────────────────────────────────────

  async signInAnonymously() { return { userId: "local" }; }
  async signOut() {}
  async getCurrentUser() { return { userId: "local", role: "primary" }; }

  // ─── Session (no-op) ──────────────────────────────────────────────────────

  async createSession() { return { sessionId: "local", inviteCode: null }; }
  async joinSession() {}
  async getSessionId() { return "local"; }
  async destroySession() { await this.clearData(["all"]); }

  // ─── Contractions ─────────────────────────────────────────────────────────

  async saveContractions(contractions) {
    await storage.set(LS.contractions, JSON.stringify(contractions));
  }

  async getContractions() {
    return parseJSON(await storage.get(LS.contractions), []);
  }

  subscribeContractions() { return () => {}; }

  // ─── Hydration ────────────────────────────────────────────────────────────

  async saveHydration({ drinkCount, lastDrank, drinkInterval, intervals }) {
    await Promise.all([
      storage.set(LS.drinkCount, String(drinkCount)),
      storage.set(LS.lastDrank, String(lastDrank)),
      storage.set(LS.drinkInterval, String(drinkInterval)),
      storage.set(LS.intervals, JSON.stringify(intervals)),
    ]);
  }

  async getHydration() {
    const [dc, ld, di, iv] = await Promise.all([
      storage.get(LS.drinkCount),
      storage.get(LS.lastDrank),
      storage.get(LS.drinkInterval),
      storage.get(LS.intervals),
    ]);
    return {
      drinkCount: dc ? +dc.value || 0 : 0,
      lastDrank: ld ? +ld.value || Date.now() : Date.now(),
      drinkInterval: di ? +di.value || 15 : 15,
      intervals: parseJSON(iv, [5, 15, 30]),
    };
  }

  // ─── Todos ────────────────────────────────────────────────────────────────

  async saveTodos(todos) {
    await storage.set(LS.todos, JSON.stringify(todos));
  }

  async getTodos() {
    return parseJSON(await storage.get(LS.todos), []);
  }

  subscribeTodos() { return () => {}; }

  // ─── Settings ─────────────────────────────────────────────────────────────

  /**
   * Partial-write: only the keys present in partialSettings are updated.
   * Existing keys not mentioned are untouched (each has its own localStorage entry).
   */
  async saveSettings({ mode, locale, dueDate, countdownUnit, reliefMethods, flags } = {}) {
    const ops = [];
    if (mode !== undefined) ops.push(storage.set(LS.mode, mode));
    if (locale !== undefined) ops.push(storage.set(LS.locale, locale));
    if (dueDate !== undefined) {
      ops.push(dueDate ? storage.set(LS.dueDate, dueDate) : storage.remove(LS.dueDate));
    }
    if (countdownUnit !== undefined) ops.push(storage.set(LS.countdownUnit, countdownUnit));
    if (reliefMethods !== undefined) ops.push(storage.set(LS.reliefMethods, JSON.stringify(reliefMethods)));
    if (flags !== undefined) ops.push(storage.set(LS.flags, JSON.stringify(flags)));
    await Promise.all(ops);
  }

  async getSettings() {
    const [mode, locale, dueDate, countdownUnit, reliefMethods, flags] = await Promise.all([
      storage.get(LS.mode),
      storage.get(LS.locale),
      storage.get(LS.dueDate),
      storage.get(LS.countdownUnit),
      storage.get(LS.reliefMethods),
      storage.get(LS.flags),
    ]);
    return {
      mode: mode?.value || null,
      locale: locale?.value || null,
      dueDate: dueDate?.value || null,
      countdownUnit: countdownUnit?.value || null,
      reliefMethods: parseJSON(reliefMethods, null),
      flags: parseJSON(flags, null),
    };
  }

  // ─── Clear Data ───────────────────────────────────────────────────────────

  async clearData(categories) {
    const has = (cat) => categories.includes("all") || categories.includes(cat);
    const ops = [];

    if (has("contractions")) ops.push(storage.remove(LS.contractions));

    if (has("hydration")) {
      ops.push(
        storage.remove(LS.drinkCount),
        storage.remove(LS.lastDrank),
        storage.remove(LS.drinkInterval),
        storage.remove(LS.intervals),
      );
    }

    if (has("todos")) ops.push(storage.remove(LS.todos));
    if (has("contacts")) ops.push(storage.remove(LS.contacts));
    if (has("relief")) ops.push(storage.remove(LS.reliefMethods));

    if (has("appSettings")) {
      ops.push(
        storage.remove(LS.mode),
        storage.remove(LS.dueDate),
        storage.remove(LS.countdownUnit),
      );
    }

    await Promise.all(ops);
  }

  // ─── Labour Contacts ──────────────────────────────────────────────────────

  async saveContacts(contacts) {
    await storage.set(LS.contacts, JSON.stringify(contacts));
  }

  async getContacts() {
    return parseJSON(await storage.get(LS.contacts), []);
  }
}

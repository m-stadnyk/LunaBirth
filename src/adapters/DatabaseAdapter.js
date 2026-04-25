/**
 * DatabaseAdapter — interface contract for all storage providers.
 *
 * Implement this interface to add a new provider (Supabase, Firebase, etc.).
 * Hooks interact exclusively with this interface via DatabaseContext — they
 * never import a concrete adapter directly, so providers are swappable without
 * touching any hook code.
 *
 * All methods return Promises. Throw on unrecoverable errors; callers handle UI state.
 *
 * @interface
 */
export class DatabaseAdapter {
  // ─── Auth ──────────────────────────────────────────────────────────────────

  /**
   * Sign in anonymously (no email/password required).
   * @returns {Promise<{ userId: string }>}
   */
  async signInAnonymously() { throw new Error("Not implemented"); }

  /**
   * Sign out and clear credentials.
   * @returns {Promise<void>}
   */
  async signOut() { throw new Error("Not implemented"); }

  /**
   * Return the current authenticated user, or null if not signed in.
   * @returns {Promise<{ userId: string, role: "primary"|"partner" }|null>}
   */
  async getCurrentUser() { throw new Error("Not implemented"); }

  // ─── Session ───────────────────────────────────────────────────────────────

  /**
   * Create a new birth session owned by the current user.
   * Generates a random 6-character invite code.
   * @returns {Promise<{ sessionId: string, inviteCode: string }>}
   */
  async createSession() { throw new Error("Not implemented"); }

  /**
   * Join an existing session as a partner using its invite code.
   * @param {string} inviteCode - 6-character invite code shared by the primary user.
   * @returns {Promise<{ sessionId: string }>}
   */
  async joinSession(inviteCode) { throw new Error("Not implemented"); } // eslint-disable-line no-unused-vars

  /**
   * Return the active session ID, or null if not connected.
   * @returns {Promise<string|null>}
   */
  async getSessionId() { throw new Error("Not implemented"); }

  /**
   * Permanently delete all session data from the provider and invalidate the session.
   * Used when the primary user unsyncs — clears cloud data so orphaned sessions don't persist.
   * @returns {Promise<void>}
   */
  async destroySession() { throw new Error("Not implemented"); }

  // ─── Contractions ──────────────────────────────────────────────────────────

  /**
   * Persist the full contractions array (replaces existing).
   * @param {Array<{ start: number, duration: number, time: string }>} contractions
   * @returns {Promise<void>}
   */
  async saveContractions(contractions) { throw new Error("Not implemented"); } // eslint-disable-line no-unused-vars

  /**
   * Load the stored contractions array.
   * @returns {Promise<Array<{ start: number, duration: number, time: string }>>}
   */
  async getContractions() { throw new Error("Not implemented"); }

  /**
   * Subscribe to real-time contraction updates.
   * @param {function(Array): void} callback
   * @returns {function} Unsubscribe function — call to stop listening.
   */
  subscribeContractions(callback) { void callback; return () => {}; } // eslint-disable-line no-unused-vars

  // ─── Hydration ─────────────────────────────────────────────────────────────

  /**
   * Persist hydration state.
   * @param {{ drinkCount: number, lastDrank: number, drinkInterval: number, intervals: number[] }} state
   * @returns {Promise<void>}
   */
  async saveHydration(state) { throw new Error("Not implemented"); } // eslint-disable-line no-unused-vars

  /**
   * Load stored hydration state.
   * @returns {Promise<{ drinkCount: number, lastDrank: number, drinkInterval: number, intervals: number[] }|null>}
   */
  async getHydration() { throw new Error("Not implemented"); }

  // ─── Todos ─────────────────────────────────────────────────────────────────

  /**
   * Persist the full todos array (replaces existing).
   * @param {Array} todos
   * @returns {Promise<void>}
   */
  async saveTodos(todos) { throw new Error("Not implemented"); } // eslint-disable-line no-unused-vars

  /**
   * Load the stored todos array.
   * @returns {Promise<Array>}
   */
  async getTodos() { throw new Error("Not implemented"); }

  /**
   * Subscribe to real-time todo updates.
   * @param {function(Array): void} callback
   * @returns {function} Unsubscribe function.
   */
  subscribeTodos(callback) { void callback; return () => {}; } // eslint-disable-line no-unused-vars

  // ─── Settings ──────────────────────────────────────────────────────────────

  /**
   * Partially persist app settings. Only the provided keys are written;
   * existing keys not present in the argument are preserved (merge semantic).
   *
   * Supported keys: mode, locale, dueDate, countdownUnit, reliefMethods, flags.
   *
   * @param {object} partialSettings
   * @returns {Promise<void>}
   */
  async saveSettings(partialSettings) { throw new Error("Not implemented"); } // eslint-disable-line no-unused-vars

  /**
   * Load all stored settings.
   * @returns {Promise<{ mode, locale, dueDate, countdownUnit, reliefMethods, flags }|null>}
   */
  async getSettings() { throw new Error("Not implemented"); }

  /**
   * Clear specific categories of data.
   * @param {Array<"contractions"|"hydration"|"todos"|"contacts"|"relief"|"appSettings"|"all">} categories
   * @returns {Promise<void>}
   */
  async clearData(categories) { throw new Error("Not implemented"); } // eslint-disable-line no-unused-vars

  // ─── Labour Contacts ───────────────────────────────────────────────────────

  /**
   * Persist the full contacts array (replaces existing).
   * @param {Array<{ id: string, nickname: string, phone: string }>} contacts
   * @returns {Promise<void>}
   */
  async saveContacts(contacts) { throw new Error("Not implemented"); } // eslint-disable-line no-unused-vars

  /**
   * Load the stored contacts array.
   * @returns {Promise<Array<{ id: string, nickname: string, phone: string }>>}
   */
  async getContacts() { throw new Error("Not implemented"); }
}

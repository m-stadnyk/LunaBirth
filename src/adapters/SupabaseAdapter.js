import { DatabaseAdapter } from "./DatabaseAdapter.js";

/**
 * SupabaseAdapter — implements DatabaseAdapter using Supabase (PostgreSQL + Auth + Realtime).
 *
 * Setup:
 * 1. Create a Supabase project at https://supabase.com (free tier is sufficient).
 * 2. Copy your Project URL and anon key to .env:
 *      VITE_SUPABASE_URL=https://xxxx.supabase.co
 *      VITE_SUPABASE_ANON_KEY=eyJ...
 * 3. Run the schema SQL from supabase/schema.sql in the Supabase SQL editor.
 *
 * The Supabase SDK is loaded lazily so users who never sign in pay no bundle cost.
 *
 * RLS policies (enforced server-side, not in this file):
 *   - Primary (owner): full SELECT/INSERT/UPDATE/DELETE on their session's rows.
 *   - Partner: SELECT on everything in the session, INSERT-only on contractions + todos.
 *   - Settings: UPDATE restricted to owner only.
 */
export class SupabaseAdapter extends DatabaseAdapter {
  /** @type {import("@supabase/supabase-js").SupabaseClient|null} */
  #client = null;

  /** @type {string|null} */
  #sessionId = null;

  /** @type {"primary"|"partner"|null} */
  #role = null;

  /**
   * Lazily initialise the Supabase client (avoids loading the SDK until needed).
   * @returns {Promise<import("@supabase/supabase-js").SupabaseClient>}
   */
  async #getClient() {
    if (this.#client) return this.#client;
    const { createClient } = await import("@supabase/supabase-js");
    this.#client = createClient(
      import.meta.env.VITE_SUPABASE_URL,
      import.meta.env.VITE_SUPABASE_ANON_KEY,
    );
    return this.#client;
  }

  // ─── Auth ──────────────────────────────────────────────────────────────────

  async signInAnonymously() {
    const sb = await this.#getClient();
    const { data, error } = await sb.auth.signInAnonymously();
    if (error) throw error;
    return { userId: data.user.id };
  }

  async signOut() {
    const sb = await this.#getClient();
    this.#sessionId = null;
    this.#role = null;
    await sb.auth.signOut();
  }

  async getCurrentUser() {
    const sb = await this.#getClient();
    const { data: { user } } = await sb.auth.getUser();
    if (!user) return null;
    return { userId: user.id, role: this.#role ?? "primary" };
  }

  // ─── Session ───────────────────────────────────────────────────────────────

  async createSession() {
    const sb = await this.#getClient();
    const { data: { user } } = await sb.auth.getUser();
    if (!user) throw new Error("Must be signed in to create a session");

    // Generate a 6-character alphanumeric invite code
    const inviteCode = Math.random().toString(36).slice(2, 8).toUpperCase();

    const { data, error } = await sb
      .from("sessions")
      .insert({ owner_id: user.id, invite_code: inviteCode })
      .select("id")
      .single();

    if (error) throw error;

    this.#sessionId = data.id;
    this.#role = "primary";
    return { sessionId: data.id, inviteCode };
  }

  async joinSession(inviteCode) {
    const sb = await this.#getClient();
    const { data: { user } } = await sb.auth.getUser();
    if (!user) throw new Error("Must be signed in to join a session");

    // Look up the session by invite code
    const { data: session, error: fetchErr } = await sb
      .from("sessions")
      .select("id, partner_ids")
      .eq("invite_code", inviteCode.toUpperCase())
      .single();

    if (fetchErr || !session) throw new Error("Invalid invite code");

    // Add this user to partner_ids if not already present
    const partnerIds = session.partner_ids ?? [];
    if (!partnerIds.includes(user.id)) {
      const { error: updateErr } = await sb
        .from("sessions")
        .update({ partner_ids: [...partnerIds, user.id] })
        .eq("id", session.id);
      if (updateErr) throw updateErr;
    }

    this.#sessionId = session.id;
    this.#role = "partner";
    return { sessionId: session.id };
  }

  async getSessionId() {
    return this.#sessionId;
  }

  // ─── Contractions ──────────────────────────────────────────────────────────

  async saveContractions(contractions) {
    const sb = await this.#getClient();
    if (!this.#sessionId) throw new Error("No active session");

    // Upsert a single snapshot row for simplicity (full array replace)
    const { error } = await sb
      .from("contraction_snapshots")
      .upsert({ session_id: this.#sessionId, data: contractions }, { onConflict: "session_id" });
    if (error) throw error;
  }

  async getContractions() {
    const sb = await this.#getClient();
    if (!this.#sessionId) return [];

    const { data, error } = await sb
      .from("contraction_snapshots")
      .select("data")
      .eq("session_id", this.#sessionId)
      .maybeSingle();

    if (error) throw error;
    return data?.data ?? [];
  }

  subscribeContractions(callback) {
    let channel;
    this.#getClient().then((sb) => {
      if (!this.#sessionId) return;
      channel = sb
        .channel(`contractions:${this.#sessionId}`)
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "contraction_snapshots",
            filter: `session_id=eq.${this.#sessionId}`,
          },
          (payload) => {
            callback(payload.new?.data ?? []);
          }
        )
        .subscribe();
    });

    return () => { channel?.unsubscribe(); };
  }

  // ─── Hydration ─────────────────────────────────────────────────────────────

  async saveHydration(state) {
    const sb = await this.#getClient();
    if (!this.#sessionId) throw new Error("No active session");

    const { error } = await sb
      .from("hydration_snapshots")
      .upsert({ session_id: this.#sessionId, data: state }, { onConflict: "session_id" });
    if (error) throw error;
  }

  async getHydration() {
    const sb = await this.#getClient();
    if (!this.#sessionId) return null;

    const { data, error } = await sb
      .from("hydration_snapshots")
      .select("data")
      .eq("session_id", this.#sessionId)
      .maybeSingle();

    if (error) throw error;
    return data?.data ?? null;
  }

  // ─── Todos ─────────────────────────────────────────────────────────────────

  async saveTodos(todos) {
    const sb = await this.#getClient();
    if (!this.#sessionId) throw new Error("No active session");

    const { error } = await sb
      .from("todo_snapshots")
      .upsert({ session_id: this.#sessionId, data: todos }, { onConflict: "session_id" });
    if (error) throw error;
  }

  async getTodos() {
    const sb = await this.#getClient();
    if (!this.#sessionId) return [];

    const { data, error } = await sb
      .from("todo_snapshots")
      .select("data")
      .eq("session_id", this.#sessionId)
      .maybeSingle();

    if (error) throw error;
    return data?.data ?? [];
  }

  subscribeTodos(callback) {
    let channel;
    this.#getClient().then((sb) => {
      if (!this.#sessionId) return;
      channel = sb
        .channel(`todos:${this.#sessionId}`)
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "todo_snapshots",
            filter: `session_id=eq.${this.#sessionId}`,
          },
          (payload) => {
            callback(payload.new?.data ?? []);
          }
        )
        .subscribe();
    });

    return () => { channel?.unsubscribe(); };
  }

  // ─── Labour Contacts ───────────────────────────────────────────────────────

  async saveContacts(contacts) {
    const sb = await this.#getClient();
    if (!this.#sessionId) throw new Error("No active session");

    const { error } = await sb
      .from("contact_snapshots")
      .upsert({ session_id: this.#sessionId, data: contacts }, { onConflict: "session_id" });
    if (error) throw error;
  }

  async getContacts() {
    const sb = await this.#getClient();
    if (!this.#sessionId) return [];

    const { data, error } = await sb
      .from("contact_snapshots")
      .select("data")
      .eq("session_id", this.#sessionId)
      .maybeSingle();

    if (error) throw error;
    return data?.data ?? [];
  }

  // ─── Settings ──────────────────────────────────────────────────────────────

  async saveSettings(settings) {
    const sb = await this.#getClient();
    if (!this.#sessionId) throw new Error("No active session");

    const { error } = await sb
      .from("sessions")
      .update({ settings })
      .eq("id", this.#sessionId);
    if (error) throw error;
  }

  async getSettings() {
    const sb = await this.#getClient();
    if (!this.#sessionId) return null;

    const { data, error } = await sb
      .from("sessions")
      .select("settings")
      .eq("id", this.#sessionId)
      .maybeSingle();

    if (error) throw error;
    return data?.settings ?? null;
  }

  subscribeSettings(callback) {
    let channel;
    this.#getClient().then((sb) => {
      if (!this.#sessionId) return;
      channel = sb
        .channel(`settings:${this.#sessionId}`)
        .on(
          "postgres_changes",
          {
            event: "UPDATE",
            schema: "public",
            table: "sessions",
            filter: `id=eq.${this.#sessionId}`,
          },
          (payload) => {
            callback(payload.new?.settings ?? {});
          }
        )
        .subscribe();
    });

    return () => { channel?.unsubscribe(); };
  }
}

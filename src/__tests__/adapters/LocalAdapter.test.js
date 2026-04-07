import { describe, it, expect, vi, beforeEach } from "vitest";
import { LocalAdapter } from "../../adapters/LocalAdapter.js";

vi.mock("../../utils/storage.js", () => {
  const store = {};
  return {
    storage: {
      get: vi.fn(async (key) => store[key] != null ? { value: store[key] } : null),
      set: vi.fn(async (key, value) => { store[key] = String(value); }),
      _store: store, // expose for test inspection
    },
  };
});

describe("LocalAdapter", () => {
  let adapter;

  beforeEach(async () => {
    adapter = new LocalAdapter();
    // Reset storage mock store
    const { storage } = await import("../../utils/storage.js");
    Object.keys(storage._store).forEach((k) => delete storage._store[k]);
    vi.clearAllMocks();
  });

  // ── Auth (no-op) ────────────────────────────────────────────────────────────
  it("signInAnonymously returns userId: local", async () => {
    const result = await adapter.signInAnonymously();
    expect(result).toEqual({ userId: "local" });
  });

  it("getCurrentUser returns primary role", async () => {
    const user = await adapter.getCurrentUser();
    expect(user).toEqual({ userId: "local", role: "primary" });
  });

  it("signOut resolves without error", async () => {
    await expect(adapter.signOut()).resolves.toBeUndefined();
  });

  // ── Session (no-op) ─────────────────────────────────────────────────────────
  it("createSession returns sessionId: local with null inviteCode", async () => {
    const result = await adapter.createSession();
    expect(result).toEqual({ sessionId: "local", inviteCode: null });
  });

  it("getSessionId returns local", async () => {
    expect(await adapter.getSessionId()).toBe("local");
  });

  it("subscribeContractions returns a no-op unsubscribe function", () => {
    const unsub = adapter.subscribeContractions(() => {});
    expect(typeof unsub).toBe("function");
    expect(() => unsub()).not.toThrow();
  });

  // ── Contractions ────────────────────────────────────────────────────────────
  it("getContractions returns empty array when nothing stored", async () => {
    expect(await adapter.getContractions()).toEqual([]);
  });

  it("saveContractions then getContractions round-trips the array", async () => {
    const data = [{ start: 1000, duration: 45, time: "10:00 AM" }];
    await adapter.saveContractions(data);
    expect(await adapter.getContractions()).toEqual(data);
  });

  it("getContractions returns empty array on corrupted storage", async () => {
    const { storage } = await import("../../utils/storage.js");
    storage.get.mockResolvedValueOnce({ value: "NOT JSON" });
    expect(await adapter.getContractions()).toEqual([]);
  });

  // ── Hydration ────────────────────────────────────────────────────────────────
  it("getHydration returns defaults when nothing stored", async () => {
    const h = await adapter.getHydration();
    expect(h.drinkCount).toBe(0);
    expect(h.drinkInterval).toBe(15);
    expect(h.intervals).toEqual([5, 15, 30]);
  });

  it("saveHydration then getHydration round-trips state", async () => {
    const state = { drinkCount: 5, lastDrank: 9999, drinkInterval: 20, intervals: [10, 20, 30] };
    await adapter.saveHydration(state);
    const loaded = await adapter.getHydration();
    expect(loaded.drinkCount).toBe(5);
    expect(loaded.drinkInterval).toBe(20);
    expect(loaded.intervals).toEqual([10, 20, 30]);
  });

  // ── Todos ────────────────────────────────────────────────────────────────────
  it("getTodos returns empty array when nothing stored", async () => {
    expect(await adapter.getTodos()).toEqual([]);
  });

  it("saveTodos then getTodos round-trips the array", async () => {
    const todos = [{ id: "1", text: "Pack bag", priority: "high", done: false }];
    await adapter.saveTodos(todos);
    expect(await adapter.getTodos()).toEqual(todos);
  });

  it("subscribeTodos returns a no-op unsubscribe function", () => {
    const unsub = adapter.subscribeTodos(() => {});
    expect(typeof unsub).toBe("function");
    expect(() => unsub()).not.toThrow();
  });

  // ── Settings ─────────────────────────────────────────────────────────────────
  it("getSettings returns nulls when nothing stored", async () => {
    const s = await adapter.getSettings();
    expect(s.mode).toBeNull();
    expect(s.locale).toBeNull();
  });

  it("saveSettings then getSettings round-trips fields", async () => {
    await adapter.saveSettings({ mode: "labour", locale: "uk", dueDate: "2026-06-01" });
    const s = await adapter.getSettings();
    expect(s.mode).toBe("labour");
    expect(s.locale).toBe("uk");
    expect(s.dueDate).toBe("2026-06-01");
  });

  it("saveSettings is partial — only updates provided fields", async () => {
    await adapter.saveSettings({ mode: "labour" });
    // locale was not set, should remain null
    const s = await adapter.getSettings();
    expect(s.mode).toBe("labour");
    expect(s.locale).toBeNull();
  });
});

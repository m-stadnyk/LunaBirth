import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useCloudSync } from "../../hooks/useCloudSync.js";
import { DatabaseProvider } from "../../context/DatabaseContext.jsx";
import { DebugProvider } from "../../context/DebugContext.jsx";
import { storage } from "../../utils/storage.js";

// ── Hoisted shared mock object ────────────────────────────────────────────────
const mockSupabaseAdapter = vi.hoisted(() => {
  let _settingsCallback = null;
  return {
    signInAnonymously: vi.fn(async () => ({ userId: "user-abc" })),
    signOut: vi.fn(async () => {}),
    getCurrentUser: vi.fn(async () => ({ userId: "user-abc", role: "primary" })),
    restoreSession: vi.fn(),
    createSession: vi.fn(async () => ({ sessionId: "sess-123", inviteCode: "ABC123" })),
    joinSession: vi.fn(async () => ({ sessionId: "sess-456" })),
    destroySession: vi.fn(async () => {}),
    saveContractions: vi.fn(async () => {}),
    saveHydration: vi.fn(async () => {}),
    saveTodos: vi.fn(async () => {}),
    saveSettings: vi.fn(async () => {}),
    saveContacts: vi.fn(async () => {}),
    getContractions: vi.fn(async () => []),
    getHydration: vi.fn(async () => null),
    getTodos: vi.fn(async () => []),
    getSettings: vi.fn(async () => null),
    getContacts: vi.fn(async () => []),
    subscribeSettings: vi.fn((cb) => {
      _settingsCallback = cb;
      return vi.fn();
    }),
    _triggerSettings: (settings) => { if (_settingsCallback) _settingsCallback(settings); },
    _resetSettingsCallback: () => { _settingsCallback = null; },
  };
});

// ── Mock storage ─────────────────────────────────────────────────────────────
vi.mock("../../utils/storage.js", () => ({
  storage: {
    get: vi.fn(async () => null),
    set: vi.fn(async () => {}),
    remove: vi.fn(async () => {}),
  },
}));

// ── Mock LocalAdapter ─────────────────────────────────────────────────────────
const localRef = vi.hoisted(() => ({ current: null }));

vi.mock("../../adapters/LocalAdapter.js", () => ({
  LocalAdapter: function MockLocalAdapter() {
    this.getContractions = async () => [];
    this.getHydration = async () => null;
    this.getTodos = async () => [];
    this.getSettings = async () => null;
    this.getContacts = async () => [];
    this.saveContractions = vi.fn(async () => {});
    this.saveHydration = vi.fn(async () => {});
    this.saveTodos = vi.fn(async () => {});
    this.saveSettings = vi.fn(async () => {});
    this.saveContacts = vi.fn(async () => {});
    this.clearData = vi.fn(async () => {});
    localRef.current = this;
  },
}));

// ── Mock SupabaseAdapter (lazy import) ────────────────────────────────────────
vi.mock("../../adapters/SupabaseAdapter.js", () => ({
  SupabaseAdapter: function MockSupabaseAdapter() {
    return mockSupabaseAdapter;
  },
}));

// ── Helpers ───────────────────────────────────────────────────────────────────
function wrapper({ children }) {
  return (
    <DatabaseProvider>
      <DebugProvider>{children}</DebugProvider>
    </DatabaseProvider>
  );
}

describe("useCloudSync", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset storage.get to null so session restore tests don't leak into others
    storage.get.mockResolvedValue(null);
    localRef.current = null;
    mockSupabaseAdapter._resetSettingsCallback();
    // Restore defaults after clearAllMocks
    mockSupabaseAdapter.signInAnonymously.mockResolvedValue({ userId: "user-abc" });
    mockSupabaseAdapter.getCurrentUser.mockResolvedValue({ userId: "user-abc", role: "primary" });
    mockSupabaseAdapter.restoreSession.mockImplementation(() => {});
    mockSupabaseAdapter.createSession.mockResolvedValue({ sessionId: "sess-123", inviteCode: "ABC123" });
    mockSupabaseAdapter.joinSession.mockResolvedValue({ sessionId: "sess-456" });
    mockSupabaseAdapter.destroySession.mockResolvedValue();
    mockSupabaseAdapter.signOut.mockResolvedValue();
    mockSupabaseAdapter.saveContractions.mockResolvedValue();
    mockSupabaseAdapter.saveHydration.mockResolvedValue();
    mockSupabaseAdapter.saveTodos.mockResolvedValue();
    mockSupabaseAdapter.saveSettings.mockResolvedValue();
    mockSupabaseAdapter.saveContacts.mockResolvedValue();
    mockSupabaseAdapter.getContractions.mockResolvedValue([]);
    mockSupabaseAdapter.getHydration.mockResolvedValue(null);
    mockSupabaseAdapter.getTodos.mockResolvedValue([]);
    mockSupabaseAdapter.getSettings.mockResolvedValue(null);
    mockSupabaseAdapter.getContacts.mockResolvedValue([]);
    mockSupabaseAdapter.subscribeSettings.mockImplementation((cb) => {
      mockSupabaseAdapter._resetSettingsCallback();
      mockSupabaseAdapter._triggerSettings = (s) => cb(s);
      return vi.fn();
    });
  });

  it("starts signed out", () => {
    const { result } = renderHook(() => useCloudSync(), { wrapper });
    expect(result.current.isSignedIn).toBe(false);
    expect(result.current.role).toBeNull();
    expect(result.current.inviteCode).toBeNull();
  });

  describe("session restore on mount", () => {
    async function mockStoredSession(overrides = {}) {
      const { storage } = await import("../../utils/storage.js");
      const defaults = {
        luna_cloud_uid: { value: "user-abc" },
        luna_session_id: { value: "sess-123" },
        luna_user_role: { value: "primary" },
        luna_cloud_last_sync: { value: "1712262400000" },
        luna_invite_code: { value: "ABC123" },
        ...overrides,
      };
      storage.get.mockImplementation(async (key) => defaults[key] ?? null);
    }

    it("restores session from storage on mount without calling signInAnonymously", async () => {
      await mockStoredSession();
      const { result } = renderHook(() => useCloudSync(), { wrapper });
      await act(async () => { await new Promise(resolve => setTimeout(resolve, 0)); });

      expect(mockSupabaseAdapter.signInAnonymously).not.toHaveBeenCalled();
      expect(result.current.isSignedIn).toBe(true);
      expect(result.current.sessionId).toBe("sess-123");
      expect(result.current.role).toBe("primary");
      expect(result.current.inviteCode).toBe("ABC123");
    });

    it("calls restoreSession with the persisted sessionId and role so getTodos works", async () => {
      await mockStoredSession();
      renderHook(() => useCloudSync(), { wrapper });
      await act(async () => { await new Promise(resolve => setTimeout(resolve, 0)); });

      expect(mockSupabaseAdapter.restoreSession).toHaveBeenCalledWith("sess-123", "primary");
    });

    it("stays in local mode when storage has no uid/sessionId", async () => {
      const { storage } = await import("../../utils/storage.js");
      storage.get.mockResolvedValue(null);

      const { result } = renderHook(() => useCloudSync(), { wrapper });
      await act(async () => { await new Promise(resolve => setTimeout(resolve, 0)); });

      expect(result.current.isSignedIn).toBe(false);
      expect(mockSupabaseAdapter.restoreSession).not.toHaveBeenCalled();
    });

    it("stays in local mode when getCurrentUser returns null (expired session)", async () => {
      await mockStoredSession();
      mockSupabaseAdapter.getCurrentUser.mockResolvedValueOnce(null);

      const { result } = renderHook(() => useCloudSync(), { wrapper });
      await act(async () => { await new Promise(resolve => setTimeout(resolve, 0)); });

      expect(result.current.isSignedIn).toBe(false);
      expect(mockSupabaseAdapter.restoreSession).not.toHaveBeenCalled();
    });

    it("restores partner role and sets up settings subscription", async () => {
      await mockStoredSession({ luna_user_role: { value: "partner" } });

      const onRemoteModeChange = vi.fn();
      const { result } = renderHook(() => useCloudSync({ onRemoteModeChange }), { wrapper });
      await act(async () => { await new Promise(resolve => setTimeout(resolve, 0)); });

      expect(result.current.role).toBe("partner");
      expect(mockSupabaseAdapter.subscribeSettings).toHaveBeenCalled();
    });
  });

  it("signIn: authenticates, creates session, sets isSignedIn and inviteCode", async () => {
    const { result } = renderHook(() => useCloudSync(), { wrapper });

    await act(async () => { await result.current.signIn(); });

    expect(result.current.isSignedIn).toBe(true);
    expect(result.current.role).toBe("primary");
    expect(result.current.inviteCode).toBe("ABC123");
    expect(result.current.sessionId).toBe("sess-123");
    expect(result.current.error).toBeNull();
  });

  it("signIn: persists uid, sessionId, role to storage", async () => {
    const { storage } = await import("../../utils/storage.js");
    const { result } = renderHook(() => useCloudSync(), { wrapper });

    await act(async () => { await result.current.signIn(); });

    expect(storage.set).toHaveBeenCalledWith("luna_cloud_uid", "user-abc");
    expect(storage.set).toHaveBeenCalledWith("luna_session_id", "sess-123");
    expect(storage.set).toHaveBeenCalledWith("luna_user_role", "primary");
  });

  it("signIn: uploads existing local data to cloud", async () => {
    const { result } = renderHook(() => useCloudSync(), { wrapper });

    await act(async () => { await result.current.signIn(); });

    expect(mockSupabaseAdapter.saveContractions).toHaveBeenCalled();
    expect(mockSupabaseAdapter.saveTodos).toHaveBeenCalled();
  });

  it("signIn: includes contacts in cloud upload", async () => {
    const { result } = renderHook(() => useCloudSync(), { wrapper });

    await act(async () => { await result.current.signIn(); });

    expect(mockSupabaseAdapter.saveContacts).toHaveBeenCalled();
  });

  it("signIn: sets error state on failure", async () => {
    mockSupabaseAdapter.createSession.mockRejectedValueOnce(new Error("Network error"));
    const { result } = renderHook(() => useCloudSync(), { wrapper });

    await act(async () => { await result.current.signIn(); });

    expect(result.current.isSignedIn).toBe(false);
    expect(result.current.error).toBe("Network error");
  });

  describe("signIn: local data cleared after upload", () => {
    it("calls clearData on local adapter after uploading to cloud", async () => {
      const { result } = renderHook(() => useCloudSync(), { wrapper });
      await act(async () => { await result.current.signIn(); });

      expect(localRef.current.clearData).toHaveBeenCalled();
    });

    it("clearData failure does not prevent sign-in from succeeding", async () => {
      const { result } = renderHook(() => useCloudSync(), { wrapper });
      await act(async () => { await result.current.signIn(); });

      expect(result.current.isSignedIn).toBe(true);
      expect(result.current.error).toBeNull();
    });
  });

  it("joinAsPartner: signs in and joins session with invite code", async () => {
    const { result } = renderHook(() => useCloudSync(), { wrapper });

    await act(async () => { await result.current.joinAsPartner("XYZ999"); });

    expect(mockSupabaseAdapter.joinSession).toHaveBeenCalledWith("XYZ999");
    expect(result.current.isSignedIn).toBe(true);
    expect(result.current.role).toBe("partner");
    expect(result.current.sessionId).toBe("sess-456");
  });

  it("joinAsPartner: sets error on invalid code", async () => {
    mockSupabaseAdapter.joinSession.mockRejectedValueOnce(new Error("Invalid invite code"));
    const { result } = renderHook(() => useCloudSync(), { wrapper });

    await act(async () => { await result.current.joinAsPartner("BAD000"); });

    expect(result.current.isSignedIn).toBe(false);
    expect(result.current.error).toBe("Invalid invite code");
  });

  describe("unsync / signOut", () => {
    it("reverts to local mode and clears state", async () => {
      const { result } = renderHook(() => useCloudSync(), { wrapper });

      await act(async () => { await result.current.signIn(); });
      expect(result.current.isSignedIn).toBe(true);

      await act(async () => { await result.current.unsync(); });

      expect(result.current.isSignedIn).toBe(false);
      expect(result.current.sessionId).toBeNull();
      expect(result.current.role).toBeNull();
      expect(result.current.inviteCode).toBeNull();
    });

    it("signOut is an alias for unsync", async () => {
      const { result } = renderHook(() => useCloudSync(), { wrapper });
      await act(async () => { await result.current.signIn(); });
      await act(async () => { await result.current.signOut(); });
      expect(result.current.isSignedIn).toBe(false);
    });

    it("reads all cloud data before disconnecting", async () => {
      const { result } = renderHook(() => useCloudSync(), { wrapper });
      await act(async () => { await result.current.signIn(); });

      mockSupabaseAdapter.getTodos.mockClear();
      mockSupabaseAdapter.getContractions.mockClear();
      mockSupabaseAdapter.getHydration.mockClear();
      mockSupabaseAdapter.getContacts.mockClear();
      mockSupabaseAdapter.getSettings.mockClear();

      await act(async () => { await result.current.unsync(); });

      expect(mockSupabaseAdapter.getTodos).toHaveBeenCalled();
      expect(mockSupabaseAdapter.getContractions).toHaveBeenCalled();
      expect(mockSupabaseAdapter.getHydration).toHaveBeenCalled();
      expect(mockSupabaseAdapter.getContacts).toHaveBeenCalled();
      expect(mockSupabaseAdapter.getSettings).toHaveBeenCalled();
    });

    it("writes fetched cloud data to LocalAdapter", async () => {
      mockSupabaseAdapter.getTodos.mockResolvedValue([{ id: "t1", text: "pack bag" }]);
      mockSupabaseAdapter.getContractions.mockResolvedValue([{ start: 99, duration: 45 }]);
      mockSupabaseAdapter.getContacts.mockResolvedValue([{ id: "c1", nickname: "Midwife" }]);

      const { result } = renderHook(() => useCloudSync(), { wrapper });
      await act(async () => { await result.current.signIn(); });
      await act(async () => { await result.current.unsync(); });

      expect(localRef.current.saveTodos).toHaveBeenCalledWith([{ id: "t1", text: "pack bag" }]);
      expect(localRef.current.saveContractions).toHaveBeenCalledWith([{ start: 99, duration: 45 }]);
      expect(localRef.current.saveContacts).toHaveBeenCalledWith([{ id: "c1", nickname: "Midwife" }]);
    });

    it("saves cloud settings to local on unsync", async () => {
      mockSupabaseAdapter.getSettings.mockResolvedValue({ reliefMethods: [{ id: "m1", name: "Sway" }] });

      const { result } = renderHook(() => useCloudSync(), { wrapper });
      await act(async () => { await result.current.signIn(); });
      await act(async () => { await result.current.unsync(); });

      expect(localRef.current.saveSettings).toHaveBeenCalledWith(
        expect.objectContaining({ reliefMethods: [{ id: "m1", name: "Sway" }] })
      );
    });

    it("destroys the cloud session on unsync", async () => {
      const { result } = renderHook(() => useCloudSync(), { wrapper });
      await act(async () => { await result.current.signIn(); });
      await act(async () => { await result.current.unsync(); });

      expect(mockSupabaseAdapter.destroySession).toHaveBeenCalled();
    });

    it("skips migration silently when not signed in", async () => {
      const { result } = renderHook(() => useCloudSync(), { wrapper });

      await act(async () => { await result.current.unsync(); });

      expect(mockSupabaseAdapter.getTodos).not.toHaveBeenCalled();
      expect(result.current.isSignedIn).toBe(false);
    });

    it("still completes and clears state if cloud fetch fails", async () => {
      mockSupabaseAdapter.getTodos.mockRejectedValue(new Error("network error"));

      const { result } = renderHook(() => useCloudSync(), { wrapper });
      await act(async () => { await result.current.signIn(); });
      await act(async () => { await result.current.unsync(); });

      expect(result.current.isSignedIn).toBe(false);
      expect(result.current.error).toBeNull();
    });
  });

  describe("mode sync (partner)", () => {
    it("calls subscribeSettings after joining as partner", async () => {
      const { result } = renderHook(() => useCloudSync({ onRemoteModeChange: vi.fn() }), { wrapper });

      await act(async () => { await result.current.joinAsPartner("ABC123"); });

      expect(mockSupabaseAdapter.subscribeSettings).toHaveBeenCalled();
    });

    it("does not call subscribeSettings after signing in as primary", async () => {
      const { result } = renderHook(() => useCloudSync({ onRemoteModeChange: vi.fn() }), { wrapper });

      await act(async () => { await result.current.signIn(); });

      expect(mockSupabaseAdapter.subscribeSettings).not.toHaveBeenCalled();
    });

    it("calls onRemoteModeChange when settings subscription fires with a new mode", async () => {
      const onRemoteModeChange = vi.fn();
      const { result } = renderHook(() => useCloudSync({ onRemoteModeChange }), { wrapper });

      await act(async () => { await result.current.joinAsPartner("ABC123"); });

      act(() => { mockSupabaseAdapter._triggerSettings({ mode: "labour" }); });

      expect(onRemoteModeChange).toHaveBeenCalledWith("labour");
    });

    it("does not call onRemoteModeChange when settings fire without a mode key", async () => {
      const onRemoteModeChange = vi.fn();
      const { result } = renderHook(() => useCloudSync({ onRemoteModeChange }), { wrapper });

      await act(async () => { await result.current.joinAsPartner("ABC123"); });

      act(() => { mockSupabaseAdapter._triggerSettings({ someOtherKey: "value" }); });

      expect(onRemoteModeChange).not.toHaveBeenCalled();
    });
  });
});

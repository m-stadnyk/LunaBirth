import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useCloudSync } from "../../hooks/useCloudSync.js";
import { DatabaseProvider } from "../../context/DatabaseContext.jsx";

// ── Hoisted shared mock object ────────────────────────────────────────────────
// vi.hoisted runs before vi.mock factories and imports, so we can safely
// reference mockSupabaseAdapter both inside mocks and in test assertions.
const mockSupabaseAdapter = vi.hoisted(() => {
  let _settingsCallback = null;
  return {
    signInAnonymously: vi.fn(async () => ({ userId: "user-abc" })),
    signOut: vi.fn(async () => {}),
    createSession: vi.fn(async () => ({ sessionId: "sess-123", inviteCode: "ABC123" })),
    joinSession: vi.fn(async () => ({ sessionId: "sess-456" })),
    saveContractions: vi.fn(async () => {}),
    saveHydration: vi.fn(async () => {}),
    saveTodos: vi.fn(async () => {}),
    saveSettings: vi.fn(async () => {}),
    subscribeSettings: vi.fn((cb) => {
      _settingsCallback = cb;
      return vi.fn(); // unsubscribe fn
    }),
    // Test helper — trigger the settings Realtime callback
    _triggerSettings: (settings) => { if (_settingsCallback) _settingsCallback(settings); },
    _resetSettingsCallback: () => { _settingsCallback = null; },
  };
});

// ── Mock storage ─────────────────────────────────────────────────────────────
vi.mock("../../utils/storage.js", () => ({
  storage: {
    get: vi.fn(async () => null),
    set: vi.fn(async () => {}),
  },
}));

// ── Mock LocalAdapter ─────────────────────────────────────────────────────────
// Plain constructor function so `new LocalAdapter()` works at module init time.
vi.mock("../../adapters/LocalAdapter.js", () => ({
  LocalAdapter: function MockLocalAdapter() {
    this.getContractions = async () => [];
    this.getHydration = async () => null;
    this.getTodos = async () => [];
    this.getSettings = async () => null;
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
  return <DatabaseProvider>{children}</DatabaseProvider>;
}

describe("useCloudSync", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSupabaseAdapter._resetSettingsCallback();
    // Restore defaults after clearAllMocks
    mockSupabaseAdapter.signInAnonymously.mockResolvedValue({ userId: "user-abc" });
    mockSupabaseAdapter.createSession.mockResolvedValue({ sessionId: "sess-123", inviteCode: "ABC123" });
    mockSupabaseAdapter.joinSession.mockResolvedValue({ sessionId: "sess-456" });
    mockSupabaseAdapter.signOut.mockResolvedValue();
    mockSupabaseAdapter.saveContractions.mockResolvedValue();
    mockSupabaseAdapter.saveHydration.mockResolvedValue();
    mockSupabaseAdapter.saveTodos.mockResolvedValue();
    mockSupabaseAdapter.saveSettings.mockResolvedValue();
    mockSupabaseAdapter.subscribeSettings.mockImplementation((cb) => {
      mockSupabaseAdapter._resetSettingsCallback();
      // re-capture
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

  it("signIn: sets error state on failure", async () => {
    mockSupabaseAdapter.createSession.mockRejectedValueOnce(new Error("Network error"));
    const { result } = renderHook(() => useCloudSync(), { wrapper });

    await act(async () => { await result.current.signIn(); });

    expect(result.current.isSignedIn).toBe(false);
    expect(result.current.error).toBe("Network error");
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

  it("signOut: reverts to local mode and clears state", async () => {
    const { result } = renderHook(() => useCloudSync(), { wrapper });

    await act(async () => { await result.current.signIn(); });
    expect(result.current.isSignedIn).toBe(true);

    await act(async () => { await result.current.signOut(); });

    expect(result.current.isSignedIn).toBe(false);
    expect(result.current.sessionId).toBeNull();
    expect(result.current.role).toBeNull();
    expect(result.current.inviteCode).toBeNull();
  });

  it("sync: calls save methods with local data", async () => {
    const { result } = renderHook(() => useCloudSync(), { wrapper });
    await act(async () => { await result.current.signIn(); });

    vi.clearAllMocks();
    mockSupabaseAdapter.saveContractions.mockResolvedValue();
    mockSupabaseAdapter.saveHydration.mockResolvedValue();
    mockSupabaseAdapter.saveTodos.mockResolvedValue();
    mockSupabaseAdapter.saveSettings.mockResolvedValue();

    await act(async () => { await result.current.sync(); });

    expect(mockSupabaseAdapter.saveContractions).toHaveBeenCalled();
    expect(mockSupabaseAdapter.saveTodos).toHaveBeenCalled();
  });

  it("sync: is a no-op when not signed in", async () => {
    const { result } = renderHook(() => useCloudSync(), { wrapper });

    await act(async () => { await result.current.sync(); });

    expect(mockSupabaseAdapter.saveContractions).not.toHaveBeenCalled();
  });

  it("sync: is a no-op when role is partner", async () => {
    const { result } = renderHook(() => useCloudSync(), { wrapper });
    await act(async () => { await result.current.joinAsPartner("ABC123"); });

    vi.clearAllMocks();
    await act(async () => { await result.current.sync(); });

    expect(mockSupabaseAdapter.saveContractions).not.toHaveBeenCalled();
  });

  describe("mode auto-sync (primary)", () => {
    it("saves mode immediately when mode prop changes while signed in as primary", async () => {
      const { result, rerender } = renderHook(
        ({ mode }) => useCloudSync({ mode }),
        { wrapper, initialProps: { mode: "expectation" } }
      );
      await act(async () => { await result.current.signIn(); });

      mockSupabaseAdapter.saveSettings.mockClear();

      await act(async () => { rerender({ mode: "labour" }); });

      expect(mockSupabaseAdapter.saveSettings).toHaveBeenCalledWith({ mode: "labour" });
    });

    it("does not auto-sync mode when not signed in", async () => {
      const { rerender } = renderHook(
        ({ mode }) => useCloudSync({ mode }),
        { wrapper, initialProps: { mode: "expectation" } }
      );

      await act(async () => { rerender({ mode: "labour" }); });

      expect(mockSupabaseAdapter.saveSettings).not.toHaveBeenCalled();
    });

    it("does not auto-sync mode when role is partner", async () => {
      const { result, rerender } = renderHook(
        ({ mode }) => useCloudSync({ mode }),
        { wrapper, initialProps: { mode: "expectation" } }
      );
      await act(async () => { await result.current.joinAsPartner("ABC123"); });

      mockSupabaseAdapter.saveSettings.mockClear();
      await act(async () => { rerender({ mode: "labour" }); });

      expect(mockSupabaseAdapter.saveSettings).not.toHaveBeenCalled();
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

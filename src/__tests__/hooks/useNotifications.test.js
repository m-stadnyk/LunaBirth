import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useNotifications } from "../../hooks/useNotifications.js";
import { storage } from "../../utils/storage.js";

vi.mock("../../utils/storage.js", () => ({
  storage: {
    get: vi.fn(async () => null),
    set: vi.fn(async () => {}),
  },
}));

// Reset storage mock before each test so implementations don't leak between tests
beforeEach(() => {
  storage.get.mockResolvedValue(null);
  storage.set.mockReset();
});

// Helper: set up a global Notification mock
function mockNotification({ permission = "default", requestResult = "granted" } = {}) {
  const NotifMock = vi.fn();
  NotifMock.permission = permission;
  NotifMock.requestPermission = vi.fn(async () => {
    NotifMock.permission = requestResult;
    return requestResult;
  });
  globalThis.Notification = NotifMock;
  return NotifMock;
}

// Helper: set up a minimal AudioContext mock and return captured oscillator/ctx
function mockAudioContext() {
  const oscillator = {
    connect: vi.fn(),
    start: vi.fn(),
    stop: vi.fn(),
    type: "",
    frequency: { setValueAtTime: vi.fn() },
    onended: null,
  };
  const gainNode = {
    connect: vi.fn(),
    gain: {
      setValueAtTime: vi.fn(),
      exponentialRampToValueAtTime: vi.fn(),
    },
  };
  const ctx = {
    createOscillator: vi.fn(() => oscillator),
    createGain: vi.fn(() => gainNode),
    destination: {},
    currentTime: 0,
    close: vi.fn(() => Promise.resolve()),
  };
  // Must use a regular function (not arrow) so `new AudioContext()` returns `ctx`
  globalThis.AudioContext = vi.fn(function () { return ctx; });
  return { ctx, oscillator, gainNode };
}

describe("useNotifications", () => {
  afterEach(() => {
    delete globalThis.Notification;
    delete globalThis.AudioContext;
    vi.restoreAllMocks();
  });

  // ── Push notifications ──────────────────────────────────────────────────

  it("starts disabled with default permission", () => {
    mockNotification({ permission: "default" });
    const { result } = renderHook(() => useNotifications());
    expect(result.current.enabled).toBe(false);
    expect(result.current.permission).toBe("default");
  });

  it("loads persisted push enabled=true from storage on mount", async () => {
    storage.get.mockImplementation(async (key) =>
      key === "luna_notif_water" ? { value: "1" } : null
    );
    mockNotification({ permission: "granted" });

    const { result } = renderHook(() => useNotifications());
    await act(async () => {});
    expect(result.current.enabled).toBe(true);
  });

  it("toggle: requests permission when default, enables when granted", async () => {
    mockNotification({ permission: "default", requestResult: "granted" });
    const { result } = renderHook(() => useNotifications());

    await act(async () => { await result.current.toggle(); });

    expect(result.current.enabled).toBe(true);
    expect(result.current.permission).toBe("granted");
  });

  it("toggle: does not enable when permission request is denied", async () => {
    mockNotification({ permission: "default", requestResult: "denied" });
    const { result } = renderHook(() => useNotifications());

    await act(async () => { await result.current.toggle(); });

    expect(result.current.enabled).toBe(false);
  });

  it("toggle: enables immediately when permission already granted", async () => {
    mockNotification({ permission: "granted" });
    const { result } = renderHook(() => useNotifications());

    await act(async () => { await result.current.toggle(); });

    expect(result.current.enabled).toBe(true);
  });

  it("toggle: disables when already enabled", async () => {
    mockNotification({ permission: "granted" });
    const { result } = renderHook(() => useNotifications());

    await act(async () => { await result.current.toggle(); });
    expect(result.current.enabled).toBe(true);

    await act(async () => { await result.current.toggle(); });
    expect(result.current.enabled).toBe(false);
  });

  it("notifyWater: fires push Notification when enabled and granted", async () => {
    const NotifMock = mockNotification({ permission: "granted" });
    const { result } = renderHook(() => useNotifications());

    await act(async () => { await result.current.toggle(); });
    act(() => { result.current.notifyWater("Title", "Body"); });

    expect(NotifMock).toHaveBeenCalledWith("Title", expect.objectContaining({ body: "Body" }));
  });

  it("notifyWater: push is no-op when push disabled", () => {
    const NotifMock = mockNotification({ permission: "granted" });
    const { result } = renderHook(() => useNotifications());

    act(() => { result.current.notifyWater("Title", "Body"); });

    expect(NotifMock).not.toHaveBeenCalled();
  });

  it("notifyWater: push is no-op when permission denied", () => {
    const NotifMock = mockNotification({ permission: "denied" });
    const { result } = renderHook(() => useNotifications());

    act(() => { result.current.notifyWater("Title", "Body"); });

    expect(NotifMock).not.toHaveBeenCalled();
  });

  it("notifyWater: push is no-op when Notification API unavailable", () => {
    delete globalThis.Notification;
    const { result } = renderHook(() => useNotifications());

    expect(() => { result.current.notifyWater("Title", "Body"); }).not.toThrow();
  });

  it("notifyWater: uses default title/body when not provided", async () => {
    const NotifMock = mockNotification({ permission: "granted" });
    const { result } = renderHook(() => useNotifications());

    await act(async () => { await result.current.toggle(); });
    act(() => { result.current.notifyWater(); });

    expect(NotifMock).toHaveBeenCalledWith(
      "Time to drink! 💧",
      expect.objectContaining({ body: "Your water reminder interval has ended." })
    );
  });

  it("notifyWater: push notification uses tag=luna-water to prevent stacking", async () => {
    const NotifMock = mockNotification({ permission: "granted" });
    const { result } = renderHook(() => useNotifications());

    await act(async () => { await result.current.toggle(); });
    act(() => { result.current.notifyWater(); });

    expect(NotifMock).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({ tag: "luna-water", renotify: true })
    );
  });

  // ── Audio notifications ─────────────────────────────────────────────────

  it("starts with audioEnabled=false", () => {
    const { result } = renderHook(() => useNotifications());
    expect(result.current.audioEnabled).toBe(false);
  });

  it("loads persisted audioEnabled=true from storage on mount", async () => {
    storage.get.mockImplementation(async (key) =>
      key === "luna_notif_water_audio" ? { value: "1" } : null
    );
    const { result } = renderHook(() => useNotifications());
    await act(async () => {});
    expect(result.current.audioEnabled).toBe(true);
  });

  it("toggleAudio: enables audio", () => {
    const { result } = renderHook(() => useNotifications());

    act(() => { result.current.toggleAudio(); });

    expect(result.current.audioEnabled).toBe(true);
  });

  it("toggleAudio: disables audio when already enabled", () => {
    const { result } = renderHook(() => useNotifications());

    act(() => { result.current.toggleAudio(); });
    act(() => { result.current.toggleAudio(); });

    expect(result.current.audioEnabled).toBe(false);
  });

  it("toggleAudio: persists preference via storage", () => {
    const { result } = renderHook(() => useNotifications());

    act(() => { result.current.toggleAudio(); });

    expect(storage.set).toHaveBeenCalledWith("luna_notif_water_audio", "1");
  });

  it("notifyWater: plays audio tone when audioEnabled is true", () => {
    const { ctx } = mockAudioContext();
    const { result } = renderHook(() => useNotifications());

    act(() => { result.current.toggleAudio(); });
    act(() => { result.current.notifyWater(); });

    expect(globalThis.AudioContext).toHaveBeenCalled();
    expect(ctx.createOscillator).toHaveBeenCalled();
  });

  it("notifyWater: audio is no-op when audioEnabled is false", () => {
    mockAudioContext();
    const { result } = renderHook(() => useNotifications());

    act(() => { result.current.notifyWater(); });

    expect(globalThis.AudioContext).not.toHaveBeenCalled();
  });

  it("notifyWater: audio is no-op when AudioContext API unavailable", () => {
    delete globalThis.AudioContext;
    const { result } = renderHook(() => useNotifications());

    act(() => { result.current.toggleAudio(); });
    expect(() => { result.current.notifyWater(); }).not.toThrow();
  });

  it("notifyWater: stops previous tone before playing new one (no stacking)", () => {
    const { ctx } = mockAudioContext();
    const { result } = renderHook(() => useNotifications());

    act(() => { result.current.toggleAudio(); });
    act(() => { result.current.notifyWater(); }); // first alert — sets audioCtxRef.current
    act(() => { result.current.notifyWater(); }); // second alert — must close first ctx

    expect(ctx.close).toHaveBeenCalled();
  });

  it("notifyWater: fires both push and audio when both are enabled", async () => {
    const NotifMock = mockNotification({ permission: "granted" });
    const { ctx } = mockAudioContext();
    const { result } = renderHook(() => useNotifications());

    await act(async () => { await result.current.toggle(); });
    act(() => { result.current.toggleAudio(); });
    act(() => { result.current.notifyWater(); });

    expect(NotifMock).toHaveBeenCalled();
    expect(ctx.createOscillator).toHaveBeenCalled();
  });
});

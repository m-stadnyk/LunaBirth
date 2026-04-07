import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useNotifications } from "../../hooks/useNotifications.js";

vi.mock("../../utils/storage.js", () => ({
  storage: {
    get: vi.fn(async () => null),
    set: vi.fn(async () => {}),
  },
}));

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

describe("useNotifications", () => {
  afterEach(() => {
    delete globalThis.Notification;
    vi.restoreAllMocks();
  });

  it("starts disabled with default permission", () => {
    mockNotification({ permission: "default" });
    const { result } = renderHook(() => useNotifications());
    expect(result.current.enabled).toBe(false);
    expect(result.current.permission).toBe("default");
  });

  it("loads persisted enabled=true from storage on mount", async () => {
    const { storage } = await import("../../utils/storage.js");
    storage.get.mockResolvedValueOnce({ value: "1" });
    mockNotification({ permission: "granted" });

    const { result } = renderHook(() => useNotifications());
    // Wait for async storage load
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

    // Enable first
    await act(async () => { await result.current.toggle(); });
    expect(result.current.enabled).toBe(true);

    // Then disable
    await act(async () => { await result.current.toggle(); });
    expect(result.current.enabled).toBe(false);
  });

  it("notifyWater: fires Notification when enabled and granted", async () => {
    const NotifMock = mockNotification({ permission: "granted" });
    const { result } = renderHook(() => useNotifications());

    await act(async () => { await result.current.toggle(); });
    act(() => { result.current.notifyWater("Title", "Body"); });

    expect(NotifMock).toHaveBeenCalledWith("Title", expect.objectContaining({ body: "Body" }));
  });

  it("notifyWater: is a no-op when disabled", async () => {
    const NotifMock = mockNotification({ permission: "granted" });
    const { result } = renderHook(() => useNotifications());
    // Do not toggle — remains disabled

    act(() => { result.current.notifyWater("Title", "Body"); });

    expect(NotifMock).not.toHaveBeenCalled();
  });

  it("notifyWater: is a no-op when permission denied", async () => {
    const NotifMock = mockNotification({ permission: "denied" });
    const { result } = renderHook(() => useNotifications());

    act(() => { result.current.notifyWater("Title", "Body"); });

    expect(NotifMock).not.toHaveBeenCalled();
  });

  it("notifyWater: is a no-op when Notification API unavailable", () => {
    delete globalThis.Notification; // simulate unsupported browser
    const { result } = renderHook(() => useNotifications());

    // Should not throw
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
});

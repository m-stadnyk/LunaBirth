import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useMode } from "../../hooks/useMode.js";

const { storageMock } = vi.hoisted(() => ({
  storageMock: { get: vi.fn(async () => null), set: vi.fn(async () => {}) },
}));
vi.mock("../../utils/storage.js", () => ({ storage: storageMock }));

describe("useMode", () => {
  beforeEach(() => {
    storageMock.get.mockReset();
    storageMock.set.mockReset();
    storageMock.get.mockResolvedValue(null);
    storageMock.set.mockResolvedValue(undefined);
    vi.useFakeTimers();
  });

  it("defaults to 'labour' when nothing is stored", () => {
    const { result } = renderHook(() => useMode());
    expect(result.current.mode).toBe("labour");
  });

  it("loads persisted mode from storage on mount", async () => {
    storageMock.get.mockResolvedValue({ value: "expectation" });
    const { result } = renderHook(() => useMode());
    await act(async () => {});
    expect(result.current.mode).toBe("expectation");
  });

  it("setMode updates the current mode state", async () => {
    const { result } = renderHook(() => useMode());
    await act(async () => { await result.current.setMode("expectation"); });
    expect(result.current.mode).toBe("expectation");
  });

  it("setMode persists the new value to storage", async () => {
    const { result } = renderHook(() => useMode());
    await act(async () => { await result.current.setMode("expectation"); });
    expect(storageMock.set).toHaveBeenCalledWith("lc_mode", "expectation");
  });

  it("setMode('expectation') switches to expectation", async () => {
    const { result } = renderHook(() => useMode());
    await act(async () => { await result.current.setMode("expectation"); });
    expect(result.current.mode).toBe("expectation");
  });

  it("setMode back to 'labour' works after switching", async () => {
    const { result } = renderHook(() => useMode());
    await act(async () => { await result.current.setMode("expectation"); });
    await act(async () => { await result.current.setMode("labour"); });
    expect(result.current.mode).toBe("labour");
  });
});

import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useAppMode } from "../../hooks/useAppMode.js";

vi.mock("../../utils/storage.js", () => ({
  storage: {
    get: vi.fn(async () => null),
    set: vi.fn(async () => {}),
  },
}));

import { storage } from "../../utils/storage.js";

describe("useAppMode", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    storage.get.mockResolvedValue(null);
  });

  it("defaults to 'expectation' when nothing is stored", async () => {
    const { result } = renderHook(() => useAppMode());
    await act(async () => {});
    expect(result.current.mode).toBe("expectation");
  });

  it("restores persisted mode from storage on mount", async () => {
    storage.get.mockResolvedValue({ value: "expectation" });
    const { result } = renderHook(() => useAppMode());
    await act(async () => {});
    expect(result.current.mode).toBe("expectation");
  });

  it("setMode updates mode state", async () => {
    const { result } = renderHook(() => useAppMode());
    await act(async () => {});

    await act(async () => {
      result.current.setMode("expectation");
    });

    expect(result.current.mode).toBe("expectation");
  });

  it("setMode persists to storage", async () => {
    const { result } = renderHook(() => useAppMode());
    await act(async () => {});

    await act(async () => {
      result.current.setMode("expectation");
    });

    expect(storage.set).toHaveBeenCalledWith("luna_mode", "expectation");
  });

  it("switching back to 'labour' persists correctly", async () => {
    storage.get.mockResolvedValue({ value: "expectation" });
    const { result } = renderHook(() => useAppMode());
    await act(async () => {});

    await act(async () => {
      result.current.setMode("labour");
    });

    expect(result.current.mode).toBe("labour");
    expect(storage.set).toHaveBeenCalledWith("luna_mode", "labour");
  });

  it("exposes a toggleMode convenience function", async () => {
    const { result } = renderHook(() => useAppMode());
    await act(async () => {});
    expect(result.current.mode).toBe("expectation");

    await act(async () => {
      result.current.toggleMode();
    });
    expect(result.current.mode).toBe("labour");

    await act(async () => {
      result.current.toggleMode();
    });
    expect(result.current.mode).toBe("expectation");
  });
});

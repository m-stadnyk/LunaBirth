import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useFeatureFlagsState } from "../../hooks/useFeatureFlags.js";

vi.mock("../../utils/storage.js", () => ({
  storage: {
    get: vi.fn(async () => null),
    set: vi.fn(async () => {}),
  },
}));

// Provide two test flags via the constants mock
vi.mock("../../constants/featureFlags.js", () => ({
  FEATURE_FLAGS: [
    { id: "alpha", labelKey: "flags.alpha", defaultValue: true },
    { id: "beta",  labelKey: "flags.beta",  defaultValue: true },
  ],
}));

import { storage } from "../../utils/storage.js";

describe("useFeatureFlagsState", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    storage.get.mockResolvedValue(null);
  });

  it("defaults all flags to true when nothing is stored", async () => {
    const { result } = renderHook(() => useFeatureFlagsState());
    await act(async () => {});
    expect(result.current.flags.alpha).toBe(true);
    expect(result.current.flags.beta).toBe(true);
  });

  it("restores overrides from storage on mount", async () => {
    storage.get.mockResolvedValue({ value: JSON.stringify({ alpha: false }) });
    const { result } = renderHook(() => useFeatureFlagsState());
    await act(async () => {});
    expect(result.current.flags.alpha).toBe(false);
    // beta was not in stored overrides — still defaults to true
    expect(result.current.flags.beta).toBe(true);
  });

  it("setFlag updates state", async () => {
    const { result } = renderHook(() => useFeatureFlagsState());
    await act(async () => {});
    await act(async () => { result.current.setFlag("beta", false); });
    expect(result.current.flags.beta).toBe(false);
  });

  it("setFlag persists to storage", async () => {
    const { result } = renderHook(() => useFeatureFlagsState());
    await act(async () => {});
    await act(async () => { result.current.setFlag("alpha", false); });
    expect(storage.set).toHaveBeenCalledWith(
      "luna_flags",
      expect.stringContaining('"alpha":false')
    );
  });

  it("handles malformed JSON in storage gracefully", async () => {
    storage.get.mockResolvedValue({ value: "not{{json" });
    const { result } = renderHook(() => useFeatureFlagsState());
    await act(async () => {});
    expect(result.current.flags.alpha).toBe(true);
    expect(result.current.flags.beta).toBe(true);
  });

  it("new flags not present in stored JSON default to true", async () => {
    // Stored JSON only mentions alpha — beta is a 'new' flag
    storage.get.mockResolvedValue({ value: JSON.stringify({ alpha: false }) });
    const { result } = renderHook(() => useFeatureFlagsState());
    await act(async () => {});
    expect(result.current.flags.beta).toBe(true);
  });
});

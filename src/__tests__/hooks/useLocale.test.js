import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useLocale } from "../../hooks/useLocale.js";

vi.mock("../../utils/storage.js", () => ({
  storage: {
    get: vi.fn(async () => null),
    set: vi.fn(async () => {}),
  },
}));

import { storage } from "../../utils/storage.js";

describe("useLocale", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    storage.get.mockResolvedValue(null);
  });

  it("defaults to 'en' when nothing is stored", async () => {
    const { result } = renderHook(() => useLocale());
    await act(async () => {});
    expect(result.current.locale).toBe("en");
  });

  it("restores persisted locale from storage", async () => {
    storage.get.mockResolvedValue({ value: "uk" });
    const { result } = renderHook(() => useLocale());
    await act(async () => {});
    expect(result.current.locale).toBe("uk");
  });

  it("ignores unknown locale values in storage", async () => {
    storage.get.mockResolvedValue({ value: "fr" });
    const { result } = renderHook(() => useLocale());
    await act(async () => {});
    expect(result.current.locale).toBe("en");
  });

  it("setLocale updates state and persists", async () => {
    const { result } = renderHook(() => useLocale());
    await act(async () => {});

    await act(async () => { result.current.setLocale("uk"); });

    expect(result.current.locale).toBe("uk");
    expect(storage.set).toHaveBeenCalledWith("luna_locale", "uk");
  });

  it("setLocale back to en works", async () => {
    storage.get.mockResolvedValue({ value: "uk" });
    const { result } = renderHook(() => useLocale());
    await act(async () => {});

    await act(async () => { result.current.setLocale("en"); });

    expect(result.current.locale).toBe("en");
    expect(storage.set).toHaveBeenCalledWith("luna_locale", "en");
  });

  it("exposes SUPPORTED_LOCALES list", async () => {
    const { result } = renderHook(() => useLocale());
    await act(async () => {});
    expect(result.current.supportedLocales).toContain("en");
    expect(result.current.supportedLocales).toContain("uk");
  });
});

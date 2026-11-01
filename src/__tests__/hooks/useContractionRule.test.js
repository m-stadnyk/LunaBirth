import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useContractionRule } from "../../hooks/useContractionRule.js";

vi.mock("../../utils/storage.js", () => ({
  storage: {
    get: vi.fn(async () => null),
    set: vi.fn(async () => {}),
    remove: vi.fn(async () => {}),
  },
}));

import { storage } from "../../utils/storage.js";

describe("useContractionRule", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    storage.get.mockResolvedValue(null);
  });

  it("defaults to 5-1-1", async () => {
    const { result } = renderHook(() => useContractionRule());
    await act(async () => {});
    expect(result.current.rule).toBe("5-1-1");
  });

  it("restores a persisted rule", async () => {
    storage.get.mockImplementation(async (key) =>
      key === "luna_contraction_rule" ? { value: "3-1-1" } : null
    );
    const { result } = renderHook(() => useContractionRule());
    await act(async () => {});
    expect(result.current.rule).toBe("3-1-1");
  });

  it("ignores an unknown persisted rule", async () => {
    storage.get.mockImplementation(async (key) =>
      key === "luna_contraction_rule" ? { value: "9-9-9" } : null
    );
    const { result } = renderHook(() => useContractionRule());
    await act(async () => {});
    expect(result.current.rule).toBe("5-1-1");
  });

  it("persists a newly chosen rule", async () => {
    const { result } = renderHook(() => useContractionRule());
    await act(async () => {});
    act(() => result.current.setRule("4-1-1"));
    expect(result.current.rule).toBe("4-1-1");
    await act(async () => {});
    expect(storage.set).toHaveBeenCalledWith("luna_contraction_rule", "4-1-1");
  });
});

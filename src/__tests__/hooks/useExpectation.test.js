import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useExpectation } from "../../hooks/useExpectation.js";

const { storageMock } = vi.hoisted(() => ({
  storageMock: { get: vi.fn(async () => null), set: vi.fn(async () => {}) },
}));
vi.mock("../../utils/storage.js", () => ({ storage: storageMock }));

describe("useExpectation", () => {
  beforeEach(() => {
    storageMock.get.mockReset();
    storageMock.set.mockReset();
    storageMock.get.mockResolvedValue(null);
    storageMock.set.mockResolvedValue(undefined);
    vi.useFakeTimers();
  });

  it("defaults to dueDate=null and countdownFormat='weeks'", () => {
    const { result } = renderHook(() => useExpectation());
    expect(result.current.dueDate).toBeNull();
    expect(result.current.countdownFormat).toBe("weeks");
  });

  it("setDueDate updates the dueDate state", async () => {
    const { result } = renderHook(() => useExpectation());
    const ts = new Date("2026-09-01").getTime();
    await act(async () => { await result.current.setDueDate(ts); });
    expect(result.current.dueDate).toBe(ts);
  });

  it("setDueDate persists the timestamp to storage", async () => {
    const { result } = renderHook(() => useExpectation());
    const ts = new Date("2026-09-01").getTime();
    await act(async () => { await result.current.setDueDate(ts); });
    expect(storageMock.set).toHaveBeenCalledWith("lc_dd", String(ts));
  });

  it("setCountdownFormat updates the format state", async () => {
    const { result } = renderHook(() => useExpectation());
    await act(async () => { await result.current.setCountdownFormat("days"); });
    expect(result.current.countdownFormat).toBe("days");
  });

  it("setCountdownFormat persists to storage", async () => {
    const { result } = renderHook(() => useExpectation());
    await act(async () => { await result.current.setCountdownFormat("hours"); });
    expect(storageMock.set).toHaveBeenCalledWith("lc_cdf", "hours");
  });

  it("loads dueDate and countdownFormat from storage on mount", async () => {
    const ts = new Date("2026-09-01").getTime();
    storageMock.get.mockImplementation(async (key) => {
      if (key === "lc_dd") return { value: String(ts) };
      if (key === "lc_cdf") return { value: "days" };
      return null;
    });
    const { result } = renderHook(() => useExpectation());
    await act(async () => {});
    expect(result.current.dueDate).toBe(ts);
    expect(result.current.countdownFormat).toBe("days");
  });
});

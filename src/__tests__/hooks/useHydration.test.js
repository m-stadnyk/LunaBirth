import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useHydration } from "../../hooks/useHydration.js";

vi.mock("../../utils/storage.js", () => ({
  storage: {
    get: vi.fn(async () => null),
    set: vi.fn(async () => {}),
  },
}));

describe("useHydration", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  it("starts with default interval of 15 min", () => {
    const { result } = renderHook(() => useHydration());
    expect(result.current.drinkInterval).toBe(15);
  });

  it("starts with default intervals [5, 15, 30]", () => {
    const { result } = renderHook(() => useHydration());
    expect(result.current.intervals).toEqual([5, 15, 30]);
  });

  it("logging a drink increments drinkCount", async () => {
    const { result } = renderHook(() => useHydration());
    expect(result.current.drinkCount).toBe(0);

    await act(async () => { await result.current.drank(); });

    expect(result.current.drinkCount).toBe(1);
    expect(result.current.drinkAlert).toBe(false);
  });

  it("applyInterval changes the drinkInterval", async () => {
    const { result } = renderHook(() => useHydration());

    await act(async () => { await result.current.applyInterval(10); });

    expect(result.current.drinkInterval).toBe(10);
    expect(result.current.drinkSuggestion).toBeNull();
  });

  it("addInterval adds and sorts intervals", async () => {
    const { result } = renderHook(() => useHydration());

    await act(async () => { await result.current.addInterval(10); });

    expect(result.current.intervals).toContain(10);
    expect(result.current.intervals).toEqual([...result.current.intervals].sort((a, b) => a - b));
  });

  it("addInterval ignores duplicates", async () => {
    const { result } = renderHook(() => useHydration());
    const initialLength = result.current.intervals.length;

    await act(async () => { await result.current.addInterval(15); }); // already exists

    expect(result.current.intervals).toHaveLength(initialLength);
  });

  it("removeInterval removes an interval", async () => {
    const { result } = renderHook(() => useHydration());

    await act(async () => { await result.current.removeInterval(30); });

    expect(result.current.intervals).not.toContain(30);
  });

  it("removeInterval prevents removing the last interval", async () => {
    const { result } = renderHook(() => useHydration());

    // Remove until one left
    await act(async () => { await result.current.removeInterval(5); });
    await act(async () => { await result.current.removeInterval(15); });

    const remaining = result.current.intervals;
    expect(remaining).toHaveLength(1);

    // Try to remove the last one
    await act(async () => { await result.current.removeInterval(remaining[0]); });
    expect(result.current.intervals).toHaveLength(1);
  });

  it("handlePhaseChange sets drinkSuggestion when interval differs", () => {
    const { result } = renderHook(() => useHydration());
    // Default interval is 15, active phase recommends 15 too — no suggestion
    // Transition phase recommends 8 — should trigger suggestion
    act(() => {
      result.current.handlePhaseChange("transition", 8);
    });

    expect(result.current.drinkSuggestion).not.toBeNull();
    expect(result.current.drinkSuggestion.minutes).toBe(8);
  });

  it("countdown sets drinkAlert when time runs out", async () => {
    const { result } = renderHook(() => useHydration());

    // Advance timer past the full 15-minute interval
    act(() => { vi.advanceTimersByTime(16 * 60 * 1000); });

    expect(result.current.drinkAlert).toBe(true);
    expect(result.current.secsLeft).toBe(0);
  });
});

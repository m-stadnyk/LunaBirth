import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import React from "react";
import { useHydration } from "../../hooks/useHydration.js";
import { DatabaseContext } from "../../context/DatabaseContext.jsx";

function createMockAdapter(overrides = {}) {
  return {
    getContractions: vi.fn(async () => []),
    saveContractions: vi.fn(async () => {}),
    subscribeContractions: vi.fn(() => () => {}),
    getTodos: vi.fn(async () => []),
    saveTodos: vi.fn(async () => {}),
    subscribeTodos: vi.fn(() => () => {}),
    getHydration: vi.fn(async () => ({
      drinkCount: 0,
      lastDrank: Date.now(),
      drinkInterval: 15,
      intervals: [5, 15, 30],
    })),
    saveHydration: vi.fn(async () => {}),
    getSettings: vi.fn(async () => ({ reliefMethods: null })),
    saveSettings: vi.fn(async () => {}),
    ...overrides,
  };
}

function makeWrapper(adapter) {
  return ({ children }) =>
    React.createElement(
      DatabaseContext.Provider,
      { value: { adapter, setAdapter: vi.fn() } },
      children
    );
}

describe("useHydration", () => {
  let adapter;

  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    adapter = createMockAdapter();
  });

  it("starts with default interval of 15 min", () => {
    const { result } = renderHook(() => useHydration(), { wrapper: makeWrapper(adapter) });
    expect(result.current.drinkInterval).toBe(15);
  });

  it("starts with default intervals [5, 15, 30]", () => {
    const { result } = renderHook(() => useHydration(), { wrapper: makeWrapper(adapter) });
    expect(result.current.intervals).toEqual([5, 15, 30]);
  });

  it("loads hydration state from adapter on mount", async () => {
    adapter.getHydration.mockResolvedValue({
      drinkCount: 3,
      lastDrank: Date.now(),
      drinkInterval: 10,
      intervals: [5, 10, 20],
    });

    const { result } = renderHook(() => useHydration(), { wrapper: makeWrapper(adapter) });
    await act(async () => {});

    expect(adapter.getHydration).toHaveBeenCalled();
    expect(result.current.drinkCount).toBe(3);
    expect(result.current.drinkInterval).toBe(10);
    expect(result.current.intervals).toEqual([5, 10, 20]);
  });

  it("re-hydrates when adapter changes", async () => {
    const adapterRef = { current: createMockAdapter() };
    const wrapper = ({ children }) =>
      React.createElement(
        DatabaseContext.Provider,
        { value: { adapter: adapterRef.current, setAdapter: vi.fn() } },
        children
      );

    const { result, rerender } = renderHook(() => useHydration(), { wrapper });
    await act(async () => {});
    expect(result.current.drinkCount).toBe(0);

    adapterRef.current = createMockAdapter({
      getHydration: vi.fn(async () => ({
        drinkCount: 5,
        lastDrank: Date.now(),
        drinkInterval: 8,
        intervals: [5, 8, 15],
      })),
    });
    rerender();
    await act(async () => {});

    expect(result.current.drinkCount).toBe(5);
    expect(result.current.drinkInterval).toBe(8);
  });

  it("logging a drink increments drinkCount", async () => {
    const { result } = renderHook(() => useHydration(), { wrapper: makeWrapper(adapter) });
    await act(async () => {});
    expect(result.current.drinkCount).toBe(0);

    await act(async () => {
      await result.current.drank();
    });

    expect(result.current.drinkCount).toBe(1);
    expect(result.current.drinkAlert).toBe(false);
  });

  it("saves hydration via adapter when drink logged", async () => {
    const { result } = renderHook(() => useHydration(), { wrapper: makeWrapper(adapter) });
    await act(async () => {});

    await act(async () => {
      await result.current.drank();
    });

    expect(adapter.saveHydration).toHaveBeenCalledWith(
      expect.objectContaining({ drinkCount: 1 })
    );
  });

  it("applyInterval changes the drinkInterval", async () => {
    const { result } = renderHook(() => useHydration(), { wrapper: makeWrapper(adapter) });
    await act(async () => {});

    await act(async () => {
      await result.current.applyInterval(10);
    });

    expect(result.current.drinkInterval).toBe(10);
    expect(result.current.drinkSuggestion).toBeNull();
  });

  it("saves hydration via adapter when interval applied", async () => {
    const { result } = renderHook(() => useHydration(), { wrapper: makeWrapper(adapter) });
    await act(async () => {});

    await act(async () => {
      await result.current.applyInterval(10);
    });

    expect(adapter.saveHydration).toHaveBeenCalledWith(
      expect.objectContaining({ drinkInterval: 10 })
    );
  });

  it("addInterval adds and sorts intervals", async () => {
    const { result } = renderHook(() => useHydration(), { wrapper: makeWrapper(adapter) });
    await act(async () => {});

    await act(async () => {
      await result.current.addInterval(10);
    });

    expect(result.current.intervals).toContain(10);
    expect(result.current.intervals).toEqual(
      [...result.current.intervals].sort((a, b) => a - b)
    );
  });

  it("addInterval ignores duplicates", async () => {
    const { result } = renderHook(() => useHydration(), { wrapper: makeWrapper(adapter) });
    await act(async () => {});
    const initialLength = result.current.intervals.length;

    await act(async () => {
      await result.current.addInterval(15); // already exists
    });

    expect(result.current.intervals).toHaveLength(initialLength);
  });

  it("removeInterval removes an interval", async () => {
    const { result } = renderHook(() => useHydration(), { wrapper: makeWrapper(adapter) });
    await act(async () => {});

    await act(async () => {
      await result.current.removeInterval(30);
    });

    expect(result.current.intervals).not.toContain(30);
  });

  it("removeInterval prevents removing the last interval", async () => {
    const { result } = renderHook(() => useHydration(), { wrapper: makeWrapper(adapter) });
    await act(async () => {});

    // Remove until one left
    await act(async () => {
      await result.current.removeInterval(5);
    });
    await act(async () => {
      await result.current.removeInterval(15);
    });

    const remaining = result.current.intervals;
    expect(remaining).toHaveLength(1);

    // Try to remove the last one
    await act(async () => {
      await result.current.removeInterval(remaining[0]);
    });
    expect(result.current.intervals).toHaveLength(1);
  });

  it("handlePhaseChange sets drinkSuggestion when interval differs", () => {
    const { result } = renderHook(() => useHydration(), { wrapper: makeWrapper(adapter) });
    // Default interval is 15, transition phase recommends 8 — should trigger suggestion
    act(() => {
      result.current.handlePhaseChange("transition", 8);
    });

    expect(result.current.drinkSuggestion).not.toBeNull();
    expect(result.current.drinkSuggestion.minutes).toBe(8);
  });

  it("countdown sets drinkAlert when time runs out", async () => {
    const { result } = renderHook(() => useHydration(), { wrapper: makeWrapper(adapter) });

    vi.setSystemTime(new Date(Date.now() + 16 * 60 * 1000));
    act(() => {
      vi.advanceTimersByTime(1000);
    }); // fire one tick

    expect(result.current.drinkAlert).toBe(true);
    expect(result.current.secsLeft).toBe(0);
  });
});

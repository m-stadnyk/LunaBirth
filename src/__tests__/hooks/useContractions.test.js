import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import React from "react";
import { useContractions } from "../../hooks/useContractions.js";
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

describe("useContractions", () => {
  let adapter;

  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    adapter = createMockAdapter();
  });

  it("starts with empty contractions and tracking phase", async () => {
    const { result } = renderHook(() => useContractions(), {
      wrapper: makeWrapper(adapter),
    });
    await act(async () => {});
    expect(result.current.contractions).toHaveLength(0);
    expect(result.current.phase).toBe("tracking");
    expect(result.current.stats).toBeNull();
  });

  it("loads contractions from adapter on mount", async () => {
    const stored = [{ start: 1000, duration: 30, time: "10:00 AM" }];
    adapter.getContractions.mockResolvedValue(stored);

    const { result } = renderHook(() => useContractions(), {
      wrapper: makeWrapper(adapter),
    });
    await act(async () => {});

    expect(adapter.getContractions).toHaveBeenCalled();
    expect(result.current.contractions).toHaveLength(1);
    expect(result.current.contractions[0].start).toBe(1000);
  });

  it("starts subscription on mount", async () => {
    renderHook(() => useContractions(), { wrapper: makeWrapper(adapter) });
    await act(async () => {});
    expect(adapter.subscribeContractions).toHaveBeenCalled();
  });

  it("updates contractions when subscription fires", async () => {
    let subscriptionCallback = null;
    adapter.subscribeContractions.mockImplementation((cb) => {
      subscriptionCallback = cb;
      return () => {};
    });

    const { result } = renderHook(() => useContractions(), {
      wrapper: makeWrapper(adapter),
    });
    await act(async () => {});

    const newContractions = [{ start: 2000, duration: 45, time: "11:00 AM" }];
    await act(async () => {
      subscriptionCallback(newContractions);
    });

    expect(result.current.contractions).toHaveLength(1);
    expect(result.current.contractions[0].start).toBe(2000);
  });

  it("re-hydrates when adapter changes", async () => {
    const adapterRef = { current: createMockAdapter() };
    const wrapper = ({ children }) =>
      React.createElement(
        DatabaseContext.Provider,
        { value: { adapter: adapterRef.current, setAdapter: vi.fn() } },
        children
      );

    const { result, rerender } = renderHook(() => useContractions(), { wrapper });
    await act(async () => {});
    expect(result.current.contractions).toHaveLength(0);

    const remoteContractions = [{ start: 3000, duration: 60, time: "12:00 PM" }];
    adapterRef.current = createMockAdapter({
      getContractions: vi.fn(async () => remoteContractions),
    });
    rerender();
    await act(async () => {});

    expect(result.current.contractions).toHaveLength(1);
    expect(result.current.contractions[0].start).toBe(3000);
  });

  it("sets activeStart when contraction begins", async () => {
    const { result } = renderHook(() => useContractions(), {
      wrapper: makeWrapper(adapter),
    });
    await act(async () => {});
    expect(result.current.activeStart).toBeNull();

    await act(async () => {
      await result.current.handleContraction();
    });

    expect(result.current.activeStart).not.toBeNull();
    expect(result.current.elapsed).toBe(0);
  });

  it("records a contraction entry when stopped", async () => {
    const { result } = renderHook(() => useContractions(), {
      wrapper: makeWrapper(adapter),
    });
    await act(async () => {});

    await act(async () => {
      await result.current.handleContraction(); // start
    });

    vi.setSystemTime(new Date(Date.now() + 30000));

    await act(async () => {
      await result.current.handleContraction(); // stop
    });

    expect(result.current.contractions).toHaveLength(1);
    expect(result.current.contractions[0].duration).toBeGreaterThanOrEqual(30);
    expect(result.current.activeStart).toBeNull();
  });

  it("saves contractions via adapter when stopping", async () => {
    const { result } = renderHook(() => useContractions(), {
      wrapper: makeWrapper(adapter),
    });
    await act(async () => {});

    await act(async () => {
      await result.current.handleContraction(); // start
    });
    vi.setSystemTime(new Date(Date.now() + 30000));
    await act(async () => {
      await result.current.handleContraction(); // stop
    });

    expect(adapter.saveContractions).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({ duration: expect.any(Number) }),
      ])
    );
  });

  it("clears all contractions when clearAll is called", async () => {
    const { result } = renderHook(() => useContractions(), {
      wrapper: makeWrapper(adapter),
    });
    await act(async () => {});

    await act(async () => {
      await result.current.handleContraction();
    });
    vi.setSystemTime(new Date(Date.now() + 30000));
    await act(async () => {
      await result.current.handleContraction();
    });
    expect(result.current.contractions).toHaveLength(1);

    await act(async () => {
      await result.current.clearAll();
    });

    expect(result.current.contractions).toHaveLength(0);
    expect(result.current.phase).toBe("tracking");
    expect(result.current.stats).toBeNull();
    expect(adapter.saveContractions).toHaveBeenLastCalledWith([]);
  });

  it("calls onPhaseChange callback when phase transitions", async () => {
    const onPhaseChange = vi.fn();
    const { result } = renderHook(() => useContractions({ onPhaseChange }), {
      wrapper: makeWrapper(adapter),
    });
    expect(onPhaseChange).not.toThrow;
  });

  it("caps contraction history at 30 entries", async () => {
    const { result } = renderHook(() => useContractions(), {
      wrapper: makeWrapper(adapter),
    });
    await act(async () => {});

    for (let i = 0; i < 31; i++) {
      await act(async () => {
        await result.current.handleContraction();
      });
      vi.setSystemTime(new Date(Date.now() + 30000));
      await act(async () => {
        await result.current.handleContraction();
      });
      vi.setSystemTime(new Date(Date.now() + 300000));
    }

    expect(result.current.contractions.length).toBeLessThanOrEqual(30);
  });
});

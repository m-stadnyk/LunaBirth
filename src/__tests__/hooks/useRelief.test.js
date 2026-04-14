import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import React from "react";
import { useRelief } from "../../hooks/useRelief.js";
import { DatabaseContext } from "../../context/DatabaseContext.jsx";
import { DEFAULT_METHODS } from "../../constants/index.js";

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

describe("useRelief", () => {
  let adapter;

  beforeEach(() => {
    vi.clearAllMocks();
    adapter = createMockAdapter();
  });

  it("starts with default methods when adapter returns null", async () => {
    const { result } = renderHook(() => useRelief(), { wrapper: makeWrapper(adapter) });
    await act(async () => {});
    expect(result.current.methods).toEqual(DEFAULT_METHODS);
  });

  it("loads relief methods from adapter on mount", async () => {
    const customMethods = [
      { id: "u1", name: "Custom method", mediaUrl: "", phases: ["early"] },
    ];
    adapter.getSettings.mockResolvedValue({ reliefMethods: customMethods });

    const { result } = renderHook(() => useRelief(), { wrapper: makeWrapper(adapter) });
    await act(async () => {});

    expect(adapter.getSettings).toHaveBeenCalled();
    expect(result.current.methods).toHaveLength(1);
    expect(result.current.methods[0].name).toBe("Custom method");
  });

  it("re-hydrates when adapter changes", async () => {
    const adapterRef = { current: createMockAdapter() };
    const wrapper = ({ children }) =>
      React.createElement(
        DatabaseContext.Provider,
        { value: { adapter: adapterRef.current, setAdapter: vi.fn() } },
        children
      );

    const { result, rerender } = renderHook(() => useRelief(), { wrapper });
    await act(async () => {});
    expect(result.current.methods).toEqual(DEFAULT_METHODS);

    const remoteMethods = [
      { id: "m1", name: "Remote method", mediaUrl: "", phases: ["active"] },
    ];
    adapterRef.current = createMockAdapter({
      getSettings: vi.fn(async () => ({ reliefMethods: remoteMethods })),
    });
    rerender();
    await act(async () => {});

    expect(result.current.methods).toHaveLength(1);
    expect(result.current.methods[0].name).toBe("Remote method");
  });

  describe("addMethod", () => {
    it("does not add a method with empty name", async () => {
      const { result } = renderHook(() => useRelief(), { wrapper: makeWrapper(adapter) });
      await act(async () => {});
      const initialCount = result.current.methods.length;

      await act(async () => { result.current.setNewName("   "); });
      await act(async () => { await result.current.addMethod(); });

      expect(result.current.methods).toHaveLength(initialCount);
    });

    it("adds a new method with correct shape", async () => {
      const { result } = renderHook(() => useRelief(), { wrapper: makeWrapper(adapter) });
      await act(async () => {});
      const initialCount = result.current.methods.length;

      await act(async () => { result.current.setNewName("Massage therapy"); });
      await act(async () => { result.current.setNewMedia("https://example.com/video"); });
      await act(async () => { await result.current.addMethod(); });

      expect(result.current.methods).toHaveLength(initialCount + 1);
      const added = result.current.methods.find((m) => m.name === "Massage therapy");
      expect(added).toBeDefined();
      expect(added.mediaUrl).toBe("https://example.com/video");
      expect(added.id).toMatch(/^u\d+$/);
    });

    it("saves methods via adapter after adding", async () => {
      const { result } = renderHook(() => useRelief(), { wrapper: makeWrapper(adapter) });
      await act(async () => {});

      await act(async () => { result.current.setNewName("New method"); });
      await act(async () => { await result.current.addMethod(); });

      expect(adapter.saveSettings).toHaveBeenCalledWith(
        expect.objectContaining({
          reliefMethods: expect.arrayContaining([
            expect.objectContaining({ name: "New method" }),
          ]),
        })
      );
    });
  });

  describe("removeMethod", () => {
    it("removes a method by id", async () => {
      const customMethods = [
        { id: "u1", name: "Method A", mediaUrl: "", phases: ["early"] },
        { id: "u2", name: "Method B", mediaUrl: "", phases: ["active"] },
      ];
      adapter.getSettings.mockResolvedValue({ reliefMethods: customMethods });

      const { result } = renderHook(() => useRelief(), { wrapper: makeWrapper(adapter) });
      await act(async () => {});

      await act(async () => {
        await result.current.removeMethod("u1");
      });

      expect(result.current.methods).toHaveLength(1);
      expect(result.current.methods[0].id).toBe("u2");
    });

    it("saves methods via adapter after removing", async () => {
      const customMethods = [
        { id: "u1", name: "Method A", mediaUrl: "", phases: ["early"] },
      ];
      adapter.getSettings.mockResolvedValue({ reliefMethods: customMethods });

      const { result } = renderHook(() => useRelief(), { wrapper: makeWrapper(adapter) });
      await act(async () => {});

      await act(async () => {
        await result.current.removeMethod("u1");
      });

      expect(adapter.saveSettings).toHaveBeenCalledWith(
        expect.objectContaining({ reliefMethods: [] })
      );
    });
  });

  describe("saveMethodMedia", () => {
    it("updates the mediaUrl of a method", async () => {
      const customMethods = [
        { id: "u1", name: "Method A", mediaUrl: "", phases: ["early"] },
      ];
      adapter.getSettings.mockResolvedValue({ reliefMethods: customMethods });

      const { result } = renderHook(() => useRelief(), { wrapper: makeWrapper(adapter) });
      await act(async () => {});

      await act(async () => {
        await result.current.saveMethodMedia("u1", "https://youtu.be/abc");
      });

      const updated = result.current.methods.find((m) => m.id === "u1");
      expect(updated.mediaUrl).toBe("https://youtu.be/abc");
    });

    it("saves methods via adapter after updating media", async () => {
      const customMethods = [
        { id: "u1", name: "Method A", mediaUrl: "", phases: ["early"] },
      ];
      adapter.getSettings.mockResolvedValue({ reliefMethods: customMethods });

      const { result } = renderHook(() => useRelief(), { wrapper: makeWrapper(adapter) });
      await act(async () => {});

      await act(async () => {
        await result.current.saveMethodMedia("u1", "https://youtu.be/abc");
      });

      expect(adapter.saveSettings).toHaveBeenCalledWith(
        expect.objectContaining({
          reliefMethods: expect.arrayContaining([
            expect.objectContaining({ id: "u1", mediaUrl: "https://youtu.be/abc" }),
          ]),
        })
      );
    });
  });
});

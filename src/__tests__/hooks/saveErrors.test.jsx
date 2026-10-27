import { describe, it, expect, vi } from "vitest";
import { renderHook, act } from "@testing-library/react";
import React from "react";
import { DatabaseContext } from "../../context/DatabaseContext.jsx";
import { DebugProvider, useDebug } from "../../context/DebugContext.jsx";
import { useContractions } from "../../hooks/useContractions.js";
import { useTodos } from "../../hooks/useTodos.js";
import { useHydration } from "../../hooks/useHydration.js";
import { useAppMode } from "../../hooks/useAppMode.js";
import { useLabourContacts } from "../../hooks/useLabourContacts.js";

const fail = () => vi.fn(async () => { throw new Error("quota exceeded"); });

function failingAdapter() {
  return {
    getContractions: vi.fn(async () => []),
    saveContractions: fail(),
    getActiveContraction: vi.fn(async () => null),
    saveActiveContraction: fail(),
    subscribeContractions: () => () => {},
    getTodos: vi.fn(async () => []),
    saveTodos: fail(),
    subscribeTodos: () => () => {},
    getHydration: vi.fn(async () => null),
    saveHydration: fail(),
    getContacts: vi.fn(async () => []),
    saveContacts: fail(),
    getSettings: vi.fn(async () => ({})),
    saveSettings: fail(),
  };
}

function setup(useHook) {
  const adapter = failingAdapter();
  const wrapper = ({ children }) =>
    React.createElement(
      DatabaseContext.Provider,
      { value: { adapter, setAdapter: vi.fn(), resetKey: 0 } },
      React.createElement(DebugProvider, null, children)
    );
  return renderHook(() => ({ hook: useHook(), debug: useDebug() }), { wrapper });
}

describe("save failures are surfaced to the debug popup", () => {
  it("useContractions", async () => {
    const { result } = setup(() => useContractions());
    await act(async () => {});
    await act(async () => { await result.current.hook.handleContraction(); });
    await act(async () => { await result.current.hook.handleContraction(); });
    expect(result.current.debug.errors.some((e) => /quota exceeded/.test(e.message))).toBe(true);
  });

  it("useTodos", async () => {
    const { result } = setup(() => useTodos());
    await act(async () => {});
    await act(async () => { result.current.hook.addTodo("x"); });
    expect(result.current.debug.errors.some((e) => /quota exceeded/.test(e.message))).toBe(true);
  });

  it("useHydration", async () => {
    const { result } = setup(() => useHydration());
    await act(async () => {});
    await act(async () => { await result.current.hook.drank(); });
    expect(result.current.debug.errors.some((e) => /quota exceeded/.test(e.message))).toBe(true);
  });

  it("useAppMode", async () => {
    const { result } = setup(() => useAppMode());
    await act(async () => {});
    await act(async () => { result.current.hook.toggleMode(); });
    expect(result.current.debug.errors.some((e) => /quota exceeded/.test(e.message))).toBe(true);
  });

  it("useLabourContacts", async () => {
    const { result } = setup(() => useLabourContacts());
    await act(async () => {});
    act(() => { result.current.hook.setNewNickname("Mum"); result.current.hook.setNewPhone("123"); });
    await act(async () => { await result.current.hook.addContact(); });
    expect(result.current.debug.errors.some((e) => /quota exceeded/.test(e.message))).toBe(true);
  });
});

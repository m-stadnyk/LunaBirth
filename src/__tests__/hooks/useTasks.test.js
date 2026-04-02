import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useTasks } from "../../hooks/useTasks.js";

const { storageMock } = vi.hoisted(() => ({
  storageMock: { get: vi.fn(async () => null), set: vi.fn(async () => {}) },
}));
vi.mock("../../utils/storage.js", () => ({ storage: storageMock }));

describe("useTasks", () => {
  beforeEach(() => {
    storageMock.get.mockReset();
    storageMock.set.mockReset();
    storageMock.get.mockResolvedValue(null);
    storageMock.set.mockResolvedValue(undefined);
    vi.useFakeTimers();
  });

  it("starts with an empty tasks list", () => {
    const { result } = renderHook(() => useTasks());
    expect(result.current.tasks).toEqual([]);
  });

  it("addTask adds a task with done=false and auto-generated id", async () => {
    const { result } = renderHook(() => useTasks());
    await act(async () => { await result.current.addTask({ text: "Buy crib" }); });
    expect(result.current.tasks).toHaveLength(1);
    expect(result.current.tasks[0].done).toBe(false);
    expect(result.current.tasks[0].id).toBeTruthy();
  });

  it("addTask uses 'medium' priority by default", async () => {
    const { result } = renderHook(() => useTasks());
    await act(async () => { await result.current.addTask({ text: "Buy crib" }); });
    expect(result.current.tasks[0].priority).toBe("medium");
  });

  it("addTask accepts explicit priority", async () => {
    const { result } = renderHook(() => useTasks());
    await act(async () => { await result.current.addTask({ text: "Pack bag", priority: "high" }); });
    expect(result.current.tasks[0].priority).toBe("high");
  });

  it("addTask trims whitespace from text", async () => {
    const { result } = renderHook(() => useTasks());
    await act(async () => { await result.current.addTask({ text: "  Buy crib  " }); });
    expect(result.current.tasks[0].text).toBe("Buy crib");
  });

  it("addTask does nothing when text is empty or only whitespace", async () => {
    const { result } = renderHook(() => useTasks());
    await act(async () => { await result.current.addTask({ text: "   " }); });
    expect(result.current.tasks).toHaveLength(0);
  });

  it("toggleDone marks an undone task as done and sets doneAt", async () => {
    const { result } = renderHook(() => useTasks());
    await act(async () => { await result.current.addTask({ text: "Buy crib" }); });
    const id = result.current.tasks[0].id;
    await act(async () => { await result.current.toggleDone(id); });
    expect(result.current.tasks[0].done).toBe(true);
    expect(result.current.tasks[0].doneAt).toBeGreaterThan(0);
  });

  it("toggleDone marks a done task back to undone and clears doneAt", async () => {
    const { result } = renderHook(() => useTasks());
    await act(async () => { await result.current.addTask({ text: "Buy crib" }); });
    const id = result.current.tasks[0].id;
    await act(async () => { await result.current.toggleDone(id); });
    await act(async () => { await result.current.toggleDone(id); });
    expect(result.current.tasks[0].done).toBe(false);
    expect(result.current.tasks[0].doneAt).toBeNull();
  });

  it("done tasks appear after undone tasks in the list", async () => {
    const { result } = renderHook(() => useTasks());
    await act(async () => {
      await result.current.addTask({ text: "A", priority: "medium" });
      await result.current.addTask({ text: "B", priority: "medium" });
    });
    const idA = result.current.tasks.find((t) => t.text === "A").id;
    await act(async () => { await result.current.toggleDone(idA); });
    const sorted = result.current.tasks;
    expect(sorted[0].text).toBe("B");
    expect(sorted[1].text).toBe("A");
  });

  it("undone tasks sorted: high before medium before low priority", async () => {
    const { result } = renderHook(() => useTasks());
    await act(async () => {
      await result.current.addTask({ text: "Low", priority: "low" });
      await result.current.addTask({ text: "High", priority: "high" });
      await result.current.addTask({ text: "Med", priority: "medium" });
    });
    const [first, second, third] = result.current.tasks;
    expect(first.priority).toBe("high");
    expect(second.priority).toBe("medium");
    expect(third.priority).toBe("low");
  });

  it("removeTask removes the task with the given id", async () => {
    const { result } = renderHook(() => useTasks());
    await act(async () => { await result.current.addTask({ text: "Buy crib" }); });
    const id = result.current.tasks[0].id;
    await act(async () => { await result.current.removeTask(id); });
    expect(result.current.tasks).toHaveLength(0);
  });

  it("updateTask merges a patch into the existing task", async () => {
    const { result } = renderHook(() => useTasks());
    await act(async () => { await result.current.addTask({ text: "Buy crib" }); });
    const id = result.current.tasks[0].id;
    await act(async () => {
      await result.current.updateTask(id, { text: "Buy crib and mattress", priority: "high" });
    });
    expect(result.current.tasks[0].text).toBe("Buy crib and mattress");
    expect(result.current.tasks[0].priority).toBe("high");
  });

  it("all mutations persist to storage", async () => {
    const { result } = renderHook(() => useTasks());
    await act(async () => { await result.current.addTask({ text: "Test" }); });
    expect(storageMock.set).toHaveBeenCalledWith("lc_tasks", expect.any(String));
  });

  it("loads persisted tasks from storage on mount", async () => {
    const saved = [
      { id: "t1", text: "Buy crib", done: false, priority: "high", calendarLink: null, createdAt: 1000, doneAt: null },
    ];
    storageMock.get.mockResolvedValue({ value: JSON.stringify(saved) });
    const { result } = renderHook(() => useTasks());
    await act(async () => {});
    expect(result.current.tasks).toHaveLength(1);
    expect(result.current.tasks[0].text).toBe("Buy crib");
  });
});

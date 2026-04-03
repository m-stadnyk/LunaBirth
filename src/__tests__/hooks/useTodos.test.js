import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useTodos } from "../../hooks/useTodos.js";

vi.mock("../../utils/storage.js", () => ({
  storage: {
    get: vi.fn(async () => null),
    set: vi.fn(async () => {}),
  },
}));

import { storage } from "../../utils/storage.js";

describe("useTodos", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    storage.get.mockResolvedValue(null);
  });

  it("starts with empty todos list", async () => {
    const { result } = renderHook(() => useTodos());
    await act(async () => {});
    expect(result.current.todos).toEqual([]);
  });

  it("restores persisted todos from storage on mount", async () => {
    const saved = [
      { id: "1", text: "buy diapers", priority: "medium", done: false,
        calendarDate: null, calendarUrl: null, createdAt: 1000 },
    ];
    storage.get.mockResolvedValue({ value: JSON.stringify(saved) });

    const { result } = renderHook(() => useTodos());
    await act(async () => {});
    expect(result.current.todos).toHaveLength(1);
    expect(result.current.todos[0].text).toBe("buy diapers");
  });

  describe("addTodo", () => {
    it("adds a todo with correct defaults", async () => {
      const { result } = renderHook(() => useTodos());
      await act(async () => {});

      await act(async () => { result.current.addTodo("buy diapers"); });

      const [todo] = result.current.todos;
      expect(todo.text).toBe("buy diapers");
      expect(todo.priority).toBe("medium");
      expect(todo.done).toBe(false);
      expect(todo.calendarDate).toBeNull();
      expect(todo.calendarUrl).toBeNull();
      expect(typeof todo.id).toBe("string");
      expect(typeof todo.createdAt).toBe("number");
    });

    it("does not add a todo for empty or whitespace-only text", async () => {
      const { result } = renderHook(() => useTodos());
      await act(async () => {});

      await act(async () => { result.current.addTodo("   "); });
      expect(result.current.todos).toHaveLength(0);

      await act(async () => { result.current.addTodo(""); });
      expect(result.current.todos).toHaveLength(0);
    });

    it("persists todos to storage after adding", async () => {
      const { result } = renderHook(() => useTodos());
      await act(async () => {});

      await act(async () => { result.current.addTodo("pack hospital bag"); });

      expect(storage.set).toHaveBeenCalledWith(
        "luna_todos",
        expect.stringContaining("pack hospital bag")
      );
    });
  });

  describe("toggleDone", () => {
    it("marks an active todo as done", async () => {
      const { result } = renderHook(() => useTodos());
      await act(async () => {});
      await act(async () => { result.current.addTodo("task"); });

      const { id } = result.current.todos[0];
      await act(async () => { result.current.toggleDone(id); });

      expect(result.current.todos.find((t) => t.id === id).done).toBe(true);
    });

    it("marks a done todo back as active", async () => {
      const { result } = renderHook(() => useTodos());
      await act(async () => {});
      await act(async () => { result.current.addTodo("task"); });

      const { id } = result.current.todos[0];
      await act(async () => { result.current.toggleDone(id); });
      await act(async () => { result.current.toggleDone(id); });

      expect(result.current.todos.find((t) => t.id === id).done).toBe(false);
    });

    it("done todos appear after active todos in the list", async () => {
      const { result } = renderHook(() => useTodos());
      await act(async () => {});
      await act(async () => { result.current.addTodo("first"); });
      await act(async () => { result.current.addTodo("second"); });

      const firstId = result.current.todos.find((t) => t.text === "first").id;
      await act(async () => { result.current.toggleDone(firstId); });

      expect(result.current.todos[result.current.todos.length - 1].text).toBe("first");
    });
  });

  describe("setPriority", () => {
    it("updates the priority of a todo", async () => {
      const { result } = renderHook(() => useTodos());
      await act(async () => {});
      await act(async () => { result.current.addTodo("task"); });

      const { id } = result.current.todos[0];
      await act(async () => { result.current.setPriority(id, "high"); });

      expect(result.current.todos.find((t) => t.id === id).priority).toBe("high");
    });

    it("high priority todo sorts before medium in active group", async () => {
      const { result } = renderHook(() => useTodos());
      await act(async () => {});
      await act(async () => { result.current.addTodo("task-medium"); });
      await act(async () => { result.current.addTodo("task-high"); });

      const highId = result.current.todos.find((t) => t.text === "task-high").id;
      await act(async () => { result.current.setPriority(highId, "high"); });

      expect(result.current.todos[0].text).toBe("task-high");
    });
  });

  describe("setCalendar", () => {
    it("stores calendarDate and calendarUrl on a todo", async () => {
      const { result } = renderHook(() => useTodos());
      await act(async () => {});
      await act(async () => { result.current.addTodo("book tour"); });

      const { id } = result.current.todos[0];
      await act(async () => {
        result.current.setCalendar(id, "2026-05-10", "https://calendar.google.com/render?text=book+tour");
      });

      const updated = result.current.todos.find((t) => t.id === id);
      expect(updated.calendarDate).toBe("2026-05-10");
      expect(updated.calendarUrl).toContain("calendar.google.com");
    });

    it("clearCalendar resets calendarDate and calendarUrl to null", async () => {
      const { result } = renderHook(() => useTodos());
      await act(async () => {});
      await act(async () => { result.current.addTodo("book tour"); });

      const { id } = result.current.todos[0];
      await act(async () => {
        result.current.setCalendar(id, "2026-05-10", "https://calendar.google.com/render");
      });
      await act(async () => { result.current.clearCalendar(id); });

      const updated = result.current.todos.find((t) => t.id === id);
      expect(updated.calendarDate).toBeNull();
      expect(updated.calendarUrl).toBeNull();
    });
  });

  describe("removeTodo", () => {
    it("removes the todo with the given id", async () => {
      const { result } = renderHook(() => useTodos());
      await act(async () => {});
      await act(async () => { result.current.addTodo("task"); });

      const { id } = result.current.todos[0];
      await act(async () => { result.current.removeTodo(id); });

      expect(result.current.todos).toHaveLength(0);
    });
  });
});

import { describe, it, expect } from "vitest";
import { sortTodos, groupByArea } from "../../utils/todoSorter.js";

const todo = (overrides) => ({
  id: Math.random().toString(),
  text: "task",
  priority: "medium",
  done: false,
  calendarDate: null,
  calendarUrl: null,
  createdAt: Date.now(),
  ...overrides,
});

describe("sortTodos", () => {
  it("returns empty array for empty input", () => {
    expect(sortTodos([])).toEqual([]);
  });

  it("done items sink below active items", () => {
    const list = [todo({ done: true, text: "done" }), todo({ done: false, text: "active" })];
    const sorted = sortTodos(list);
    expect(sorted[0].text).toBe("active");
    expect(sorted[1].text).toBe("done");
  });

  it("among active items: high > medium > low priority", () => {
    const list = [
      todo({ priority: "low", text: "low" }),
      todo({ priority: "high", text: "high" }),
      todo({ priority: "medium", text: "medium" }),
    ];
    const sorted = sortTodos(list);
    expect(sorted[0].text).toBe("high");
    expect(sorted[1].text).toBe("medium");
    expect(sorted[2].text).toBe("low");
  });

  it("done items also sorted by priority within done group", () => {
    const list = [
      todo({ done: true, priority: "low", text: "done-low" }),
      todo({ done: true, priority: "high", text: "done-high" }),
    ];
    const sorted = sortTodos(list);
    expect(sorted[0].text).toBe("done-high");
    expect(sorted[1].text).toBe("done-low");
  });

  it("active items all appear before any done item", () => {
    const list = [
      todo({ done: true, priority: "high", text: "done-high" }),
      todo({ done: false, priority: "low", text: "active-low" }),
    ];
    const sorted = sortTodos(list);
    expect(sorted[0].done).toBe(false);
    expect(sorted[1].done).toBe(true);
  });

  it("preserves all items (no items dropped)", () => {
    const list = [
      todo({ priority: "high" }),
      todo({ priority: "medium", done: true }),
      todo({ priority: "low" }),
    ];
    expect(sortTodos(list)).toHaveLength(3);
  });

  it("does not mutate the original array", () => {
    const list = [todo({ done: true }), todo({ done: false })];
    const original = [...list];
    sortTodos(list);
    expect(list[0]).toBe(original[0]);
    expect(list[1]).toBe(original[1]);
  });
});

describe("groupByArea", () => {
  it("returns same todos when no AI is available (passthrough stub)", () => {
    const list = [todo({ text: "buy diapers" }), todo({ text: "book midwife" })];
    const result = groupByArea(list);
    expect(result).toHaveLength(2);
  });

  it("returns an array (never null/undefined)", () => {
    expect(Array.isArray(groupByArea([]))).toBe(true);
    expect(Array.isArray(groupByArea([todo()]))).toBe(true);
  });

  it("assigns a group label to each todo", () => {
    const list = [
      todo({ text: "buy diapers" }),
      todo({ text: "book appointment with doctor" }),
      todo({ text: "pack hospital bag" }),
    ];
    const result = groupByArea(list);
    result.forEach((t) => {
      expect(t).toHaveProperty("group");
      expect(typeof t.group).toBe("string");
    });
  });

  it("groups shopping-related tasks under 'shopping'", () => {
    const list = [todo({ text: "buy diapers" }), todo({ text: "order pram" })];
    const result = groupByArea(list);
    result.forEach((t) => expect(t.group).toBe("shopping"));
  });

  it("groups medical tasks under 'medical'", () => {
    const list = [
      todo({ text: "book midwife appointment" }),
      todo({ text: "schedule hospital tour" }),
    ];
    const result = groupByArea(list);
    result.forEach((t) => expect(t.group).toBe("medical"));
  });

  it("falls back to 'other' for unrecognized tasks", () => {
    const t = todo({ text: "xyzzy unrecognisable task" });
    const [result] = groupByArea([t]);
    expect(result.group).toBe("other");
  });
});

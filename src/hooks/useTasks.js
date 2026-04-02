import { useState, useEffect } from "react";
import { storage } from "../utils/storage.js";

const KEY = "lc_tasks";
const PRIORITY_ORDER = { high: 0, medium: 1, low: 2 };
let _idCounter = 0;
const genId = () => `t${Date.now()}_${++_idCounter}`;

/** Sort: undone tasks (high→med→low) then done tasks */
function sortTasks(list) {
  const undone = list
    .filter((t) => !t.done)
    .sort((a, b) => PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority]);
  const done = list
    .filter((t) => t.done)
    .sort((a, b) => (b.doneAt ?? 0) - (a.doneAt ?? 0));
  return [...undone, ...done];
}

async function persist(list) {
  try { await storage.set(KEY, JSON.stringify(list)); } catch { /* ignore */ }
}

export function useTasks() {
  const [tasks, setTasks] = useState([]);

  useEffect(() => {
    (async () => {
      try {
        const stored = await storage.get(KEY);
        if (stored) setTasks(sortTasks(JSON.parse(stored.value)));
      } catch {
        // ignore
      }
    })();
  }, []);

  const addTask = async ({ text, priority = "medium" }) => {
    const trimmed = text?.trim();
    if (!trimmed) return;
    const task = {
      id: genId(),
      text: trimmed,
      done: false,
      priority,
      calendarLink: null,
      createdAt: Date.now(),
      doneAt: null,
    };
    setTasks((prev) => {
      const updated = sortTasks([...prev, task]);
      persist(updated);
      return updated;
    });
  };

  const toggleDone = async (id) => {
    setTasks((prev) => {
      const updated = sortTasks(
        prev.map((t) =>
          t.id === id
            ? { ...t, done: !t.done, doneAt: t.done ? null : Date.now() }
            : t
        )
      );
      persist(updated);
      return updated;
    });
  };

  const removeTask = async (id) => {
    setTasks((prev) => {
      const updated = prev.filter((t) => t.id !== id);
      persist(updated);
      return updated;
    });
  };

  const updateTask = async (id, patch) => {
    setTasks((prev) => {
      const updated = sortTasks(
        prev.map((t) => (t.id === id ? { ...t, ...patch } : t))
      );
      persist(updated);
      return updated;
    });
  };

  return { tasks, addTask, toggleDone, removeTask, updateTask };
}

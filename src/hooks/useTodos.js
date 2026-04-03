import { useState, useEffect } from "react";
import { storage } from "../utils/storage.js";
import { sortTodos } from "../utils/todoSorter.js";

const KEY = "luna_todos";

function persist(todos) {
  storage.set(KEY, JSON.stringify(todos));
}

export function useTodos() {
  const [todos, setTodosRaw] = useState([]);

  useEffect(() => {
    storage.get(KEY).then((stored) => {
      if (stored?.value) {
        try {
          setTodosRaw(sortTodos(JSON.parse(stored.value)));
        } catch {
          // corrupted data — start fresh
        }
      }
    });
  }, []);

  const setTodos = (next) => {
    const sorted = sortTodos(next);
    setTodosRaw(sorted);
    persist(sorted);
  };

  const addTodo = (text) => {
    if (!text?.trim()) return;
    const todo = {
      id: crypto.randomUUID(),
      text: text.trim(),
      priority: "medium",
      done: false,
      calendarDate: null,
      calendarUrl: null,
      createdAt: Date.now(),
    };
    setTodos([...todos, todo]);
  };

  const toggleDone = (id) =>
    setTodos(todos.map((t) => (t.id === id ? { ...t, done: !t.done } : t)));

  const setPriority = (id, priority) =>
    setTodos(todos.map((t) => (t.id === id ? { ...t, priority } : t)));

  const setCalendar = (id, calendarDate, calendarUrl) =>
    setTodos(todos.map((t) => (t.id === id ? { ...t, calendarDate, calendarUrl } : t)));

  const clearCalendar = (id) =>
    setTodos(todos.map((t) => (t.id === id ? { ...t, calendarDate: null, calendarUrl: null } : t)));

  const removeTodo = (id) =>
    setTodos(todos.filter((t) => t.id !== id));

  return { todos, addTodo, toggleDone, setPriority, setCalendar, clearCalendar, removeTodo };
}

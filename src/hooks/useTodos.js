import { useState, useEffect } from "react";
import { useDatabase } from "../context/DatabaseContext.jsx";
import { sortTodos } from "../utils/todoSorter.js";

/**
 * Manages the todo list: CRUD operations, sorting, and persistence.
 * Uses the active DatabaseAdapter from context so data syncs to cloud
 * when the adapter is swapped to SupabaseAdapter.
 */
export function useTodos() {
  const adapter = useDatabase();
  const [todos, setTodosRaw] = useState([]);

  // Load todos and subscribe to real-time updates.
  // Re-runs when adapter changes (e.g. partner joins and adapter swaps to Supabase).
  useEffect(() => {
    let cancelled = false;
    adapter.getTodos().then((data) => {
      if (!cancelled && data?.length) setTodosRaw(sortTodos(data));
    });
    const unsub = adapter.subscribeTodos((data) => {
      setTodosRaw(sortTodos(data));
    });
    return () => {
      cancelled = true;
      unsub();
    };
  }, [adapter]);

  const setTodos = (next) => {
    const sorted = sortTodos(next);
    const previous = todos;
    setTodosRaw(sorted);
    adapter.saveTodos(sorted).catch(() => {
      setTodosRaw(previous);
    });
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
    setTodos(
      todos.map((t) => (t.id === id ? { ...t, calendarDate: null, calendarUrl: null } : t))
    );

  const removeTodo = (id) => setTodos(todos.filter((t) => t.id !== id));

  return { todos, addTodo, toggleDone, setPriority, setCalendar, clearCalendar, removeTodo };
}

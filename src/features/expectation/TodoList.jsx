import { useState } from "react";
import { N } from "../../theme/index.js";
import { useLocaleContext } from "../../context/LocaleContext.jsx";
import { TodoCard } from "./TodoCard.jsx";
import { TaskModal } from "./TaskModal.jsx";
import { AddTaskForm } from "./AddTaskForm.jsx";
import { groupByArea } from "../../utils/todoSorter.js";

export function TodoList({ todos, onAdd, onToggleDone, onSetPriority, onSetCalendar, onClearCalendar, onRemove }) {
  const [activeTodo, setActiveTodo] = useState(null);
  const [focusMode, setFocusMode] = useState(false);
  const { t } = useLocaleContext();

  const displayed = focusMode ? getFocused(todos) : todos;

  return (
    <>
      {/* Header row */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
        <span
          style={{
            fontFamily: "'Cormorant Garamond',serif",
            fontSize: 18, color: N.muted,
          }}
        >
          {t("expecting.todoTitle")}
        </span>
        <button
          onClick={() => setFocusMode((f) => !f)}
          style={{
            padding: "4px 12px", borderRadius: 20, fontSize: 11,
            border: `1px solid ${focusMode ? N.gold : N.border}`,
            background: focusMode ? N.goldLight : "transparent",
            color: focusMode ? N.gold : N.muted,
            cursor: "pointer", fontWeight: focusMode ? 600 : 400,
          }}
        >
          {focusMode ? `✦ ${t("expecting.focusModeActive")}` : t("expecting.focusMode")}
        </button>
      </div>

      <AddTaskForm onAdd={onAdd} />

      {displayed.length === 0 && (
        <p style={{ textAlign: "center", color: N.muted, fontSize: 13, marginTop: 20 }}>
          {t("expecting.noTasks")}
        </p>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {displayed.map((todo) => (
          <TodoCard
            key={todo.id}
            todo={todo}
            onTap={setActiveTodo}
            onToggleDone={onToggleDone}
          />
        ))}
      </div>

      <TaskModal
        todo={activeTodo}
        onClose={() => setActiveTodo(null)}
        onSetPriority={(id, p) => { onSetPriority(id, p); setActiveTodo((t) => t ? { ...t, priority: p } : null); }}
        onSetCalendar={(id, date, url) => { onSetCalendar(id, date, url); setActiveTodo((t) => t ? { ...t, calendarDate: date, calendarUrl: url } : null); }}
        onClearCalendar={(id) => { onClearCalendar(id); setActiveTodo((t) => t ? { ...t, calendarDate: null, calendarUrl: null } : null); }}
        onToggleDone={(id) => { onToggleDone(id); setActiveTodo(null); }}
        onRemove={onRemove}
      />
    </>
  );
}

/** Pick up to 3 tasks for focus mode: prefer 1 per priority from active tasks. */
function getFocused(todos) {
  const grouped = groupByArea(todos.filter((t) => !t.done));
  const high   = grouped.filter((t) => t.priority === "high").slice(0, 1);
  const medium = grouped.filter((t) => t.priority === "medium").slice(0, 1);
  const low    = grouped.filter((t) => t.priority === "low").slice(0, 1);
  const picks  = [...high, ...medium, ...low].slice(0, 3);
  // Pad to 3 from remaining if any priority bucket was empty
  if (picks.length < 3) {
    const usedIds = new Set(picks.map((t) => t.id));
    const rest = grouped.filter((t) => !usedIds.has(t.id));
    picks.push(...rest.slice(0, 3 - picks.length));
  }
  return picks;
}

import { DueDateCountdown } from "./DueDateCountdown.jsx";
import { TodoList } from "./TodoList.jsx";
import { N } from "../../theme/index.js";

export function ExpectationTab({ dueDate, setDueDate, countdown, countdownUnit, setCountdownUnit, todos, onAddTodo, onToggleDone, onSetPriority, onSetCalendar, onClearCalendar, onRemoveTodo }) {
  return (
    <>
      {/* Countdown card */}
      <div
        style={{
          background: N.card,
          border: `1px solid ${N.border}`,
          borderRadius: 16,
          padding: "8px 16px 16px",
          marginBottom: 16,
          backdropFilter: "blur(12px)",
        }}
      >
        <DueDateCountdown
          dueDate={dueDate}
          countdown={countdown}
          unit={countdownUnit}
          onUnitChange={setCountdownUnit}
          onSetDueDate={setDueDate}
        />
      </div>

      {/* Divider */}
      <div style={{ borderTop: `1px solid ${N.border}`, marginBottom: 16 }} />

      {/* Task list */}
      <TodoList
        todos={todos}
        onAdd={onAddTodo}
        onToggleDone={onToggleDone}
        onSetPriority={onSetPriority}
        onSetCalendar={onSetCalendar}
        onClearCalendar={onClearCalendar}
        onRemove={onRemoveTodo}
      />
    </>
  );
}

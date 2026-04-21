import { N, PRIORITY_COLORS, FONTS } from "../../theme/index.js";
import { Icon } from "../../components/Icon.jsx";

function formatBadgeDate(iso) {
  const d = new Date(iso + "T00:00:00");
  return d.toLocaleDateString("en-GB", { month: "short", day: "numeric" });
}

export function TodoCard({ todo, onTap, onToggleDone }) {
  const handleCheckbox = (e) => {
    e.stopPropagation();
    onToggleDone(todo.id);
  };

  return (
    <div
      data-testid="todo-card"
      data-done={String(todo.done)}
      onClick={() => onTap(todo)}
      style={{
        display: "flex",
        alignItems: "flex-start",
        gap: 10,
        background: N.card,
        border: `1.5px solid ${PRIORITY_COLORS[todo.priority]}`,
        borderRadius: 12,
        padding: "10px 12px",
        cursor: "pointer",
        opacity: todo.done ? 0.55 : 1,
        transition: "opacity 0.2s",
      }}
    >
      {/* Checkbox */}
      <div
        data-testid="todo-checkbox"
        onClick={handleCheckbox}
        style={{
          flexShrink: 0,
          width: 20,
          height: 20,
          borderRadius: 6,
          border: `2px solid ${PRIORITY_COLORS[todo.priority]}`,
          background: todo.done ? PRIORITY_COLORS[todo.priority] : "transparent",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          marginTop: 1,
        }}
      >
        {todo.done && <span style={{ color: "#fff", fontSize: 11 }}>✓</span>}
      </div>

      {/* Text (2-line clamp) */}
      <div
        data-testid="todo-text"
        data-clamp="2"
        style={{
          flex: 1,
          fontFamily: FONTS.script,
          fontSize: 15,
          color: todo.done ? N.muted : N.text,
          lineHeight: 1.45,
          overflow: "hidden",
          display: "-webkit-box",
          WebkitLineClamp: "2",
          WebkitBoxOrient: "vertical",
          textDecoration: todo.done ? "line-through" : "none",
        }}
      >
        {todo.text}
      </div>

      {/* Calendar date badge */}
      {todo.calendarDate && (
        <a
          href={todo.calendarUrl}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => e.stopPropagation()}
          style={{ flexShrink: 0, textDecoration: "none" }}
        >
          <span
            data-testid="calendar-badge"
            style={{
              fontSize: 10,
              background: `rgba(212,168,67,0.18)`,
              color: N.gold,
              border: `1px solid ${N.gold}`,
              borderRadius: 8,
              padding: "2px 6px",
              whiteSpace: "nowrap",
              display: "inline-flex",
              alignItems: "center",
              gap: 3,
            }}
          >
            <Icon name="calendar" size={10} color={N.gold} strokeWidth={2} />
            {formatBadgeDate(todo.calendarDate)}
          </span>
        </a>
      )}
    </div>
  );
}

import { P } from "../theme/index.js";

const PRIORITY_STYLES = {
  high:   { border: P.roseDark, bg: P.roseLight },
  medium: { border: P.amber,    bg: P.amberLight },
  low:    { border: P.muted,    bg: P.cream },
};

export function TaskCard({ task, onTap, onToggleDone }) {
  const { border, bg } = PRIORITY_STYLES[task.priority] ?? PRIORITY_STYLES.medium;

  return (
    <div
      onClick={onTap}
      style={{
        display: "flex",
        alignItems: "flex-start",
        gap: 10,
        background: bg,
        borderRadius: 12,
        padding: "11px 12px",
        borderTop: `1px solid ${border}30`,
        borderRight: `1px solid ${border}30`,
        borderBottom: `1px solid ${border}30`,
        borderLeft: `4px solid ${border}`,
        marginBottom: 8,
        cursor: "pointer",
        opacity: task.done ? 0.55 : 1,
        transition: "opacity 0.2s",
      }}
    >
      {/* Checkbox */}
      <input
        type="checkbox"
        checked={task.done}
        onChange={(e) => { e.stopPropagation(); onToggleDone(task.id); }}
        onClick={(e) => e.stopPropagation()}
        style={{ marginTop: 3, cursor: "pointer", flexShrink: 0, accentColor: border }}
      />

      {/* Text (2-line clamp) */}
      <span
        style={{
          flex: 1,
          fontFamily: "'DM Sans',sans-serif",
          fontSize: 14,
          color: P.text,
          lineHeight: 1.45,
          overflow: "hidden",
          display: "-webkit-box",
          WebkitBoxOrient: "vertical",
          WebkitLineClamp: "2",
          textDecoration: task.done ? "line-through" : "none",
        }}
      >
        {task.text}
      </span>

      {/* Calendar icon link */}
      {task.calendarLink && (
        <a
          href={task.calendarLink}
          target="_blank"
          rel="noreferrer"
          aria-label="calendar"
          onClick={(e) => e.stopPropagation()}
          style={{
            flexShrink: 0,
            fontSize: 14,
            textDecoration: "none",
            lineHeight: 1,
            marginTop: 2,
          }}
        >
          📅
        </a>
      )}
    </div>
  );
}

import { useState } from "react";
import { N, PRIORITY_COLORS } from "../../theme/index.js";
import { Icon } from "../../components/Icon.jsx";
import { useLocaleContext } from "../../context/LocaleContext.jsx";

function buildCalendarUrl(text, date) {
  const day = date.replace(/-/g, "");
  const encoded = encodeURIComponent(text);
  return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encoded}&dates=${day}/${day}`;
}

const PRIORITIES = ["high", "medium", "low"];

export function TaskModal({ todo, onClose, onSetPriority, onSetCalendar, onClearCalendar, onToggleDone, onRemove }) {
  const [pickingDate, setPickingDate] = useState(false);
  const [dateInput, setDateInput] = useState("");
  const { t } = useLocaleContext();

  if (!todo) return null;

  const handleConfirmDate = () => {
    if (!dateInput) return;
    onSetCalendar(todo.id, dateInput, buildCalendarUrl(todo.text, dateInput));
    setPickingDate(false);
    setDateInput("");
  };

  return (
    <div
      style={{
        position: "fixed", inset: 0,
        background: "rgba(5,10,30,0.80)",
        display: "flex", alignItems: "flex-end", justifyContent: "center",
        zIndex: 100,
      }}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: N.cardSolid,
          border: `1px solid ${N.border}`,
          borderRadius: "20px 20px 0 0",
          padding: "20px 20px 32px",
          width: "100%",
          maxWidth: 420,
        }}
      >
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
          <p style={{ margin: 0, fontSize: 16, color: N.text, lineHeight: 1.5, flex: 1, paddingRight: 12 }}>
            {todo.text}
          </p>
          <button
            data-testid="modal-close"
            onClick={onClose}
            style={{ background: "none", border: "none", color: N.muted, fontSize: 20, cursor: "pointer", padding: 0 }}
          >
            ✕
          </button>
        </div>

        {/* Priority picker */}
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 11, color: N.muted, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 8 }}>
            {t("expecting.priorityLabel")}
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            {PRIORITIES.map((p) => (
              <button
                key={p}
                data-testid={`priority-${p}`}
                onClick={() => onSetPriority(todo.id, p)}
                style={{
                  flex: 1,
                  padding: "7px 0",
                  borderRadius: 10,
                  border: `1.5px solid ${PRIORITY_COLORS[p]}`,
                  background: todo.priority === p ? PRIORITY_COLORS[p] : "transparent",
                  color: todo.priority === p ? (p === "high" ? "#1a1a1a" : N.text) : N.muted,
                  fontSize: 12,
                  fontWeight: 500,
                  cursor: "pointer",
                  textTransform: "capitalize",
                }}
              >
                {t(`expecting.${p}`)}
              </button>
            ))}
          </div>
        </div>

        {/* Calendar section */}
        <div style={{ marginBottom: 16 }}>
          {todo.calendarDate ? (
            <div style={{ display: "flex", gap: 8 }}>
              <button
                data-testid="calendar-change-btn"
                onClick={() => { setPickingDate(true); setDateInput(todo.calendarDate); }}
                style={{ ...outlineBtn(N), display: "inline-flex", alignItems: "center", gap: 6 }}
              >
                <Icon name="calendar" size={14} color={N.muted} /> {t("expecting.calendarChange")}
              </button>
              <button
                data-testid="calendar-remove-btn"
                onClick={() => onClearCalendar(todo.id)}
                style={outlineBtn(N, N.alert)}
              >
                {t("expecting.calendarRemove")}
              </button>
            </div>
          ) : pickingDate ? (
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <input
                data-testid="calendar-date-input"
                type="date"
                value={dateInput}
                onChange={(e) => setDateInput(e.target.value)}
                style={{
                  flex: 1, padding: "7px 10px", borderRadius: 10,
                  border: `1px solid ${N.border}`, background: N.cream,
                  color: N.text, fontSize: 13,
                }}
              />
              <button data-testid="calendar-confirm-btn" onClick={handleConfirmDate} style={solidBtn(N)}>
                {t("expecting.calendarConfirm")}
              </button>
              <button onClick={() => setPickingDate(false)} style={outlineBtn(N)}>
                {t("relief.cancel")}
              </button>
            </div>
          ) : (
            <button
              data-testid="calendar-add-btn"
              onClick={() => setPickingDate(true)}
              style={{ ...outlineBtn(N), display: "inline-flex", alignItems: "center", gap: 6 }}
            >
              <Icon name="calendar" size={14} color={N.muted} /> {t("expecting.calendarAdd")}
            </button>
          )}
        </div>

        {/* Done toggle + delete */}
        <div style={{ display: "flex", gap: 8 }}>
          <button
            data-testid="modal-toggle-done"
            onClick={() => onToggleDone(todo.id)}
            style={{
              flex: 1, padding: "11px", borderRadius: 12,
              border: `1px solid ${N.border}`,
              background: todo.done ? N.goldLight : "transparent",
              color: todo.done ? N.gold : N.muted,
              fontSize: 13, cursor: "pointer",
            }}
          >
            {todo.done ? `↩ ${t("expecting.markActive")}` : `✓ ${t("expecting.markDone")}`}
          </button>
          {onRemove && (
            <button
              data-testid="modal-delete"
              onClick={() => { onRemove(todo.id); onClose(); }}
              style={{
                padding: "11px 14px", borderRadius: 12,
                border: `1px solid ${N.alert}40`,
                background: "transparent",
                color: N.alert,
                fontSize: 13, cursor: "pointer",
              }}
            >
              {t("expecting.deleteTask")}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

const outlineBtn = (N, color) => ({
  padding: "7px 14px", borderRadius: 10,
  border: `1px solid ${color ?? N.border}`,
  background: "transparent",
  color: color ?? N.muted,
  fontSize: 12, cursor: "pointer",
});

const solidBtn = (N) => ({
  padding: "7px 14px", borderRadius: 10,
  border: "none",
  background: N.gold,
  color: "#1a1a1a",
  fontSize: 12, fontWeight: 600, cursor: "pointer",
});

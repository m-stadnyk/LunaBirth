import { useState } from "react";
import { P } from "../theme/index.js";
import { PHASES } from "../constants/index.js";
import { generateCalendarUrl } from "../utils/calendarUrl.js";

const PRIORITIES = [
  { id: "high",   label: "High",   color: P.roseDark,  bg: P.roseLight },
  { id: "medium", label: "Medium", color: P.amber,     bg: P.amberLight },
  { id: "low",    label: "Low",    color: P.muted,     bg: P.cream },
];

export function TaskModal({ task, onClose, onUpdate, onDelete }) {
  if (!task) return null;

  const [calendarDate, setCalendarDate] = useState("");
  const [showCalendarPicker, setShowCalendarPicker] = useState(false);

  const setPriority = (priority) => onUpdate(task.id, { priority });

  const handleAddToCalendar = () => {
    if (!calendarDate) return;
    const link = generateCalendarUrl({ title: task.text, date: new Date(calendarDate) });
    onUpdate(task.id, { calendarLink: link });
    setShowCalendarPicker(false);
  };

  const handleRemoveCalendar = () => onUpdate(task.id, { calendarLink: null });

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed", inset: 0, background: "rgba(61,44,44,0.6)",
        display: "flex", alignItems: "center", justifyContent: "center",
        zIndex: 100, padding: 20,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: `linear-gradient(160deg,${P.cream},${P.roseLight})`,
          borderRadius: 24, padding: "24px 20px", maxWidth: 360, width: "100%",
          boxShadow: "0 20px 60px rgba(61,44,44,0.3)", maxHeight: "88vh", overflowY: "auto",
        }}
      >
        {/* Title */}
        <h2 style={{
          fontFamily: "'Cormorant Garamond',serif", fontSize: 22, fontWeight: 400,
          color: P.text, margin: "0 0 18px", lineHeight: 1.4,
        }}>
          {task.text}
        </h2>

        {/* Priority selector */}
        <p style={{ margin: "0 0 8px", fontSize: 11, color: P.muted, textTransform: "uppercase", letterSpacing: "0.07em" }}>
          Priority
        </p>
        <div style={{ display: "flex", gap: 8, marginBottom: 18 }}>
          {PRIORITIES.map(({ id, label, color, bg }) => {
            const active = task.priority === id;
            return (
              <button
                key={id}
                onClick={() => setPriority(id)}
                style={{
                  flex: 1, padding: "7px 4px", borderRadius: 8,
                  border: `1.5px solid ${active ? color : P.border}`,
                  background: active ? bg : P.card,
                  color: active ? color : P.muted,
                  fontFamily: "'DM Sans',sans-serif", fontSize: 12,
                  fontWeight: active ? 600 : 400, cursor: "pointer",
                }}
              >
                {label}
              </button>
            );
          })}
        </div>

        {/* Calendar link */}
        <p style={{ margin: "0 0 8px", fontSize: 11, color: P.muted, textTransform: "uppercase", letterSpacing: "0.07em" }}>
          Calendar
        </p>
        {task.calendarLink ? (
          <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 18 }}>
            <a
              href={task.calendarLink}
              target="_blank"
              rel="noreferrer"
              style={{
                flex: 1, display: "flex", alignItems: "center", gap: 8,
                background: P.sageLight, borderRadius: 10, padding: "9px 12px",
                textDecoration: "none", color: P.sageDark,
                fontFamily: "'DM Sans',sans-serif", fontSize: 13,
                border: `1px solid ${P.sage}40`,
              }}
            >
              📅 <span>View in Google Calendar</span>
            </a>
            <button
              onClick={handleRemoveCalendar}
              style={{
                background: "none", border: `1px solid ${P.border}`,
                borderRadius: 8, padding: "8px 10px", color: P.muted,
                fontSize: 12, cursor: "pointer",
              }}
            >
              Remove
            </button>
          </div>
        ) : showCalendarPicker ? (
          <div style={{ marginBottom: 18 }}>
            <input
              type="date"
              value={calendarDate}
              onChange={(e) => setCalendarDate(e.target.value)}
              style={{
                width: "100%", padding: "9px 12px", borderRadius: 10,
                border: `1.5px solid ${P.sage}`, background: P.cream,
                fontFamily: "'DM Sans',sans-serif", fontSize: 13, color: P.text,
                marginBottom: 8, display: "block",
              }}
            />
            <div style={{ display: "flex", gap: 8 }}>
              <button
                onClick={handleAddToCalendar}
                disabled={!calendarDate}
                style={{
                  flex: 1, padding: "9px", borderRadius: 10, border: "none",
                  background: calendarDate ? P.sage : P.border,
                  color: "#fff", fontFamily: "'DM Sans',sans-serif", fontSize: 13,
                  fontWeight: 500, cursor: calendarDate ? "pointer" : "default",
                }}
              >
                Add to Google Calendar
              </button>
              <button
                onClick={() => setShowCalendarPicker(false)}
                style={{
                  padding: "9px 12px", borderRadius: 10, border: `1px solid ${P.border}`,
                  background: "none", color: P.muted, fontSize: 13, cursor: "pointer",
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setShowCalendarPicker(true)}
            style={{
              width: "100%", padding: "9px", borderRadius: 10, marginBottom: 18,
              border: `1.5px dashed ${P.border}`, background: "none",
              color: P.muted, fontFamily: "'DM Sans',sans-serif", fontSize: 13, cursor: "pointer",
            }}
          >
            📅 Add to Google Calendar
          </button>
        )}

        {/* Delete + Close */}
        <div style={{ display: "flex", gap: 8 }}>
          <button
            onClick={() => { onDelete(task.id); onClose(); }}
            style={{
              flex: 1, padding: 10, borderRadius: 10, border: `1px solid ${P.alert}40`,
              background: "none", color: P.alert, fontFamily: "'DM Sans',sans-serif",
              fontSize: 13, cursor: "pointer",
            }}
          >
            Delete task
          </button>
          <button
            onClick={onClose}
            style={{
              flex: 1, padding: 10, borderRadius: 10, border: `1.5px solid ${P.border}`,
              background: "none", color: P.muted, fontFamily: "'DM Sans',sans-serif",
              fontSize: 13, cursor: "pointer",
            }}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

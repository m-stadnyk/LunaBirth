import { P } from "../../theme/index.js";
import { formatCountdown } from "../../utils/countdownFormat.js";

const FORMAT_OPTIONS = [
  { id: "weeks", label: "Weeks" },
  { id: "days",  label: "Days"  },
  { id: "hours", label: "Hours" },
];

export function CountdownDisplay({ dueDate, countdownFormat, setCountdownFormat, setDueDate }) {
  const formatted = dueDate ? formatCountdown(dueDate, countdownFormat) : null;

  return (
    <div style={{
      background: `linear-gradient(145deg,${P.roseLight},${P.cream})`,
      borderRadius: 20, padding: "20px 18px", marginBottom: 14,
      boxShadow: "0 4px 20px rgba(180,100,100,0.1)",
    }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
        <span style={{
          fontFamily: "'Cormorant Garamond',serif", fontSize: 18, color: P.roseDark, fontWeight: 400,
        }}>
          🌙 Due Date Countdown
        </span>
        {/* Format chips */}
        <div style={{ display: "flex", gap: 4 }}>
          {FORMAT_OPTIONS.map(({ id, label }) => {
            const active = countdownFormat === id;
            return (
              <button
                key={id}
                onClick={() => setCountdownFormat(id)}
                style={{
                  padding: "4px 9px", borderRadius: 14, border: "none",
                  background: active ? P.rose : P.cream,
                  color: active ? "#fff" : P.muted,
                  fontFamily: "'DM Sans',sans-serif", fontSize: 10,
                  fontWeight: active ? 500 : 400, cursor: "pointer",
                }}
              >
                {label}
              </button>
            );
          })}
        </div>
      </div>

      {formatted ? (
        <div style={{ textAlign: "center", padding: "6px 0 14px" }}>
          {formatted.overdue ? (
            <div style={{
              fontFamily: "'Cormorant Garamond',serif", fontSize: 24,
              color: P.sage, fontWeight: 400,
            }}>
              {formatted.label}
            </div>
          ) : (
            <>
              <div style={{
                fontFamily: "'Cormorant Garamond',serif",
                fontSize: 64, fontWeight: 300, color: P.roseDark, lineHeight: 1,
              }}>
                {formatted.primary}
              </div>
              <div style={{ fontSize: 14, color: P.muted, marginTop: 4 }}>
                {formatted.secondary} to go
              </div>
            </>
          )}
        </div>
      ) : (
        <div style={{ textAlign: "center", padding: "10px 0 16px" }}>
          <p style={{
            fontFamily: "'Cormorant Garamond',serif", fontStyle: "italic",
            fontSize: 16, color: P.muted, margin: 0,
          }}>
            Set your due date to start the countdown
          </p>
        </div>
      )}

      {/* Due date input */}
      <input
        type="date"
        value={dueDate ? new Date(dueDate).toISOString().slice(0, 10) : ""}
        onChange={(e) => {
          const v = e.target.value;
          setDueDate(v ? new Date(v).getTime() : null);
        }}
        style={{
          width: "100%", padding: "9px 12px", borderRadius: 12,
          border: `1.5px solid ${P.border}`, background: "rgba(255,255,255,0.7)",
          fontFamily: "'DM Sans',sans-serif", fontSize: 13, color: P.text, display: "block",
        }}
      />
    </div>
  );
}

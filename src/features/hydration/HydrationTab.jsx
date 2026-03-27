import { P } from "../../theme/index.js";
import { PHASES } from "../../constants/index.js";
import { fmtMMSS } from "../../utils/formatters.js";

const RING_R = 42;
const RING_C = 2 * Math.PI * RING_R;

export function HydrationTab({
  drinkInterval,
  intervals,
  customVal,
  setCustomVal,
  showCustomInput,
  setShowCustomInput,
  drinkCount,
  secsLeft,
  drinkAlert,
  drinkSuggestion,
  setDrinkSuggestion,
  applyInterval,
  addInterval,
  removeInterval,
  drank,
}) {
  const ringDash = RING_C * (1 - Math.max(0, Math.min(1, secsLeft / (drinkInterval * 60))));

  return (
    <>
      {/* Smart drink suggestion banner */}
      {drinkSuggestion && (
        <div
          style={{
            background: P.sageLight,
            border: `1.5px solid ${P.sage}60`,
            borderRadius: 14,
            padding: "12px 14px",
            marginBottom: 14,
            display: "flex",
            alignItems: "center",
            gap: 10,
          }}
        >
          <span style={{ fontSize: 20 }}>💧</span>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 13, color: P.sageDark, fontWeight: 500 }}>
              {drinkSuggestion.label} detected
            </div>
            <div style={{ fontSize: 12, color: P.muted }}>
              Doulas recommend sipping every {drinkSuggestion.minutes} min at this stage
            </div>
          </div>
          <button
            onClick={() => applyInterval(drinkSuggestion.minutes)}
            style={{
              background: P.sage,
              color: "#fff",
              border: "none",
              borderRadius: 10,
              padding: "6px 12px",
              fontSize: 12,
              cursor: "pointer",
              fontWeight: 500,
              whiteSpace: "nowrap",
            }}
          >
            Apply
          </button>
          <button
            onClick={() => setDrinkSuggestion(null)}
            style={{
              background: "none",
              border: "none",
              color: P.muted,
              cursor: "pointer",
              fontSize: 18,
              padding: 0,
              lineHeight: 1,
            }}
          >
            ×
          </button>
        </div>
      )}

      {/* Ring timer + drink button */}
      <div
        style={{
          background: P.card,
          borderRadius: 16,
          padding: 16,
          boxShadow: "0 2px 12px rgba(180,100,100,0.08)",
          border: `1px solid ${P.border}`,
          marginBottom: 12,
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            padding: "6px 0 14px",
          }}
        >
          <svg width={110} height={110} viewBox="0 0 110 110">
            <circle
              cx={55}
              cy={55}
              r={RING_R}
              fill="none"
              stroke={P.border}
              strokeWidth={8}
            />
            <circle
              cx={55}
              cy={55}
              r={RING_R}
              fill="none"
              stroke={drinkAlert ? P.alert : P.sage}
              strokeWidth={8}
              strokeDasharray={RING_C}
              strokeDashoffset={ringDash}
              strokeLinecap="round"
              transform="rotate(-90 55 55)"
              style={{ transition: "stroke-dashoffset 1s linear,stroke 0.3s" }}
            />
            <text
              x={55}
              y={50}
              textAnchor="middle"
              fill={drinkAlert ? P.alert : P.sageDark}
              style={{
                fontFamily: "'Cormorant Garamond',serif",
                fontSize: 20,
                fontWeight: 400,
              }}
            >
              {drinkAlert ? "💧" : fmtMMSS(secsLeft)}
            </text>
            <text
              x={55}
              y={67}
              textAnchor="middle"
              fill={P.muted}
              style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 10 }}
            >
              {drinkAlert ? "Drink now!" : "until next sip"}
            </text>
          </svg>
          <div style={{ textAlign: "center", marginTop: 2 }}>
            <span
              style={{
                fontFamily: "'Cormorant Garamond',serif",
                fontSize: 32,
                color: P.sageDark,
              }}
            >
              {drinkCount}
            </span>
            <span style={{ color: P.muted, fontSize: 13, marginLeft: 6 }}>
              glasses today
            </span>
          </div>
        </div>
        <button
          className={drinkAlert ? "alertPulse" : ""}
          onClick={drank}
          style={{
            width: "100%",
            padding: 16,
            borderRadius: 14,
            border: "none",
            background: drinkAlert
              ? `linear-gradient(135deg,${P.alert},#c05555)`
              : `linear-gradient(135deg,${P.sage},${P.sageDark})`,
            color: "#fff",
            fontFamily: "'DM Sans',sans-serif",
            fontSize: 15,
            fontWeight: 500,
            cursor: "pointer",
            boxShadow: drinkAlert
              ? "0 4px 18px rgba(224,117,117,0.4)"
              : "0 4px 18px rgba(100,160,110,0.3)",
            transition: "all 0.3s",
          }}
        >
          {drinkAlert ? "🚰 Drink water now!" : "✓ I just had a sip"}
        </button>
      </div>

      {/* Interval selector chips */}
      <div
        style={{
          background: P.card,
          borderRadius: 16,
          padding: 14,
          border: `1px solid ${P.border}`,
          marginBottom: 12,
        }}
      >
        <p
          style={{
            margin: "0 0 10px",
            fontSize: 12,
            color: P.muted,
            letterSpacing: "0.07em",
            textTransform: "uppercase",
          }}
        >
          Remind me every
        </p>

        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 10 }}>
          {intervals.map((v) => {
            const active = drinkInterval === v;
            return (
              <div
                key={v}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 0,
                  borderRadius: 20,
                  overflow: "hidden",
                  border: `1.5px solid ${active ? P.sage : P.border}`,
                  background: active ? P.sageLight : P.card,
                }}
              >
                <button
                  onClick={() => applyInterval(v)}
                  style={{
                    padding: "7px 12px",
                    border: "none",
                    background: "none",
                    color: active ? P.sageDark : P.muted,
                    fontFamily: "'DM Sans',sans-serif",
                    fontSize: 13,
                    fontWeight: active ? 600 : 400,
                    cursor: "pointer",
                  }}
                >
                  {v} min
                </button>
                <button
                  onClick={() => removeInterval(v)}
                  style={{
                    padding: "7px 8px 7px 0",
                    border: "none",
                    background: "none",
                    color: active ? P.sageDark : P.muted,
                    fontSize: 14,
                    cursor: intervals.length > 1 ? "pointer" : "default",
                    opacity: intervals.length > 1 ? 1 : 0.3,
                    lineHeight: 1,
                  }}
                >
                  x
                </button>
              </div>
            );
          })}

          {/* Add custom interval */}
          {!showCustomInput ? (
            <button
              onClick={() => setShowCustomInput(true)}
              style={{
                padding: "7px 12px",
                borderRadius: 20,
                border: `1.5px dashed ${P.border}`,
                background: "none",
                color: P.muted,
                fontFamily: "'DM Sans',sans-serif",
                fontSize: 13,
                cursor: "pointer",
              }}
            >
              + Add
            </button>
          ) : (
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <input
                autoFocus
                type="number"
                min={1}
                max={120}
                value={customVal}
                onChange={(e) => setCustomVal(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    const v = parseInt(customVal);
                    if (v >= 1 && v <= 120) addInterval(v);
                  }
                  if (e.key === "Escape") {
                    setShowCustomInput(false);
                    setCustomVal("");
                  }
                }}
                placeholder="min"
                style={{
                  width: 64,
                  padding: "7px 10px",
                  borderRadius: 10,
                  border: `1.5px solid ${P.sage}`,
                  background: P.cream,
                  fontFamily: "'DM Sans',sans-serif",
                  fontSize: 13,
                  color: P.text,
                }}
              />
              <button
                onClick={() => {
                  const v = parseInt(customVal);
                  if (v >= 1 && v <= 120) addInterval(v);
                }}
                style={{
                  padding: "7px 12px",
                  borderRadius: 10,
                  border: "none",
                  background: P.sage,
                  color: "#fff",
                  fontFamily: "'DM Sans',sans-serif",
                  fontSize: 12,
                  fontWeight: 500,
                  cursor: "pointer",
                }}
              >
                Add
              </button>
              <button
                onClick={() => {
                  setShowCustomInput(false);
                  setCustomVal("");
                }}
                style={{
                  padding: "7px 8px",
                  borderRadius: 10,
                  border: `1px solid ${P.border}`,
                  background: "none",
                  color: P.muted,
                  fontSize: 12,
                  cursor: "pointer",
                }}
              >
                x
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Educational tip */}
      <div
        style={{
          background: P.sageLight,
          border: `1px solid ${P.sage}30`,
          borderRadius: 14,
          padding: "12px 14px",
        }}
      >
        <p
          style={{
            margin: 0,
            fontFamily: "'Cormorant Garamond',serif",
            fontStyle: "italic",
            fontSize: 15,
            color: P.sageDark,
            lineHeight: 1.5,
          }}
        >
          Small, frequent sips are better than large amounts. Ice chips and popsicles
          count too! 💧
        </p>
      </div>
    </>
  );
}

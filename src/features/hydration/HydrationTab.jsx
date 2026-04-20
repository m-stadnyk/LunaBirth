import { N } from "../../theme/index.js";
import { fmtMMSS } from "../../utils/formatters.js";
import { Icon } from "../../components/Icon.jsx";
import { useLocaleContext } from "../../context/LocaleContext.jsx";

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
  const ringColor = drinkAlert ? N.alert : N.silver;
  const { t } = useLocaleContext();

  return (
    <>
      {/* Smart drink suggestion banner */}
      {drinkSuggestion && (
        <div
          style={{
            background: N.card,
            backdropFilter: "blur(12px)",
            border: `1.5px solid ${N.silver}40`,
            borderLeft: `4px solid ${N.silver}`,
            borderRadius: 14,
            padding: "12px 14px",
            marginBottom: 14,
            display: "flex",
            alignItems: "center",
            gap: 10,
          }}
        >
          <Icon name="drop" size={20} color={N.silver} />
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 13, color: N.silver, fontWeight: 500 }}>
              {drinkSuggestion.label} {t("hydration.suggestionDetected")}
            </div>
            <div style={{ fontSize: 12, color: N.muted }}>
              {t("hydration.suggestionRecommend", { minutes: drinkSuggestion.minutes })}
            </div>
          </div>
          <button
            onClick={() => applyInterval(drinkSuggestion.minutes)}
            style={{
              background: N.silver, color: "#1a1a1a", border: "none",
              borderRadius: 10, padding: "6px 12px", fontSize: 12,
              cursor: "pointer", fontWeight: 500, whiteSpace: "nowrap",
            }}
          >
            {t("hydration.apply")}
          </button>
          <button
            onClick={() => setDrinkSuggestion(null)}
            style={{
              background: "none", border: "none", color: N.muted,
              cursor: "pointer", padding: 0, lineHeight: 1,
            }}
          >
            <Icon name="close" size={16} color={N.muted} />
          </button>
        </div>
      )}

      {/* Ring timer + drink button */}
      <div
        style={{
          background: N.card,
          backdropFilter: "blur(12px)",
          borderRadius: 16,
          padding: 16,
          border: `1px solid ${N.border}`,
          marginBottom: 12,
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "6px 0 14px" }}>
          <svg width={110} height={110} viewBox="0 0 110 110">
            <circle cx={55} cy={55} r={RING_R} fill="none" stroke={N.border} strokeWidth={8} />
            <circle
              cx={55} cy={55} r={RING_R} fill="none"
              stroke={ringColor} strokeWidth={8}
              strokeDasharray={RING_C} strokeDashoffset={ringDash}
              strokeLinecap="round" transform="rotate(-90 55 55)"
              style={{ transition: "stroke-dashoffset 1s linear, stroke 0.3s" }}
            />
            <text
              x={55} y={60} textAnchor="middle"
              fill={ringColor}
              style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 20, fontWeight: 400 }}
            >
              {drinkAlert ? "sip!" : fmtMMSS(secsLeft)}
            </text>
          </svg>
          <p style={{
            margin: "4px 0 0",
            textAlign: "center",
            fontSize: 11,
            color: N.muted,
            fontFamily: "'DM Sans',sans-serif",
            lineHeight: 1.3,
            maxWidth: 130,
          }}>
            {drinkAlert ? t("hydration.drinkNow") : t("hydration.untilNextSip")}
          </p>
          <div style={{ display: "flex", alignItems: "baseline", justifyContent: "center", flexWrap: "wrap", gap: "0 6px", marginTop: 6 }}>
            <span style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 32, color: N.gold }}>
              {drinkCount}
            </span>
            <span style={{ color: N.muted, fontSize: 13 }}>{t("hydration.glassesToday")}</span>
          </div>
        </div>
        <button
          className={drinkAlert ? "alertPulse" : ""}
          onClick={drank}
          style={{
            width: "100%", padding: 16, borderRadius: 14, border: "none",
            background: drinkAlert
              ? `linear-gradient(135deg,${N.alert},#c05555)`
              : `linear-gradient(135deg,${N.silver},${N.silverDark})`,
            color: drinkAlert ? "#fff" : "#1a1a1a",
            fontFamily: "'DM Sans',sans-serif", fontSize: 15, fontWeight: 500,
            cursor: "pointer",
            boxShadow: drinkAlert
              ? "0 4px 18px rgba(224,117,117,0.4)"
              : "0 4px 18px rgba(138,168,196,0.25)",
            transition: "all 0.3s",
            display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
          }}
        >
          <Icon name={drinkAlert ? "drop" : "check"} size={18} color={drinkAlert ? "#fff" : "#1a1a1a"} />
          {drinkAlert ? t("hydration.drinkNowBtn") : t("hydration.drankBtn")}
        </button>
      </div>

      {/* Interval selector chips */}
      <div
        style={{
          background: N.card,
          backdropFilter: "blur(12px)",
          borderRadius: 16,
          padding: 14,
          border: `1px solid ${N.border}`,
          marginBottom: 12,
        }}
      >
        <p style={{ margin: "0 0 10px", fontSize: 12, color: N.muted, letterSpacing: "0.07em", textTransform: "uppercase" }}>
          {t("hydration.remindEvery")}
        </p>

        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 10 }}>
          {intervals.map((v) => {
            const active = drinkInterval === v;
            return (
              <div
                key={v}
                style={{
                  display: "flex", alignItems: "center", gap: 0,
                  borderRadius: 20, overflow: "hidden",
                  border: `1.5px solid ${active ? N.silver : N.border}`,
                  background: active ? N.silverLight : "transparent",
                }}
              >
                <button
                  onClick={() => applyInterval(v)}
                  style={{
                    padding: "7px 12px", border: "none", background: "none",
                    color: active ? N.silver : N.muted,
                    fontFamily: "'DM Sans',sans-serif", fontSize: 13,
                    fontWeight: active ? 600 : 400, cursor: "pointer",
                  }}
                >
                  {v} min
                </button>
                <button
                  onClick={() => removeInterval(v)}
                  style={{
                    padding: "7px 8px 7px 0", border: "none", background: "none",
                    color: active ? N.silver : N.muted, fontSize: 14,
                    cursor: intervals.length > 1 ? "pointer" : "default",
                    opacity: intervals.length > 1 ? 1 : 0.3, lineHeight: 1,
                  }}
                >
                  ×
                </button>
              </div>
            );
          })}

          {!showCustomInput ? (
            <button
              onClick={() => setShowCustomInput(true)}
              style={{
                padding: "7px 12px", borderRadius: 20,
                border: `1.5px dashed ${N.border}`, background: "none",
                color: N.muted, fontFamily: "'DM Sans',sans-serif",
                fontSize: 13, cursor: "pointer",
              }}
            >
              + {t("hydration.add")}
            </button>
          ) : (
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <input
                autoFocus type="number" min={1} max={120}
                value={customVal} onChange={(e) => setCustomVal(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") { const v = parseInt(customVal); if (v >= 1 && v <= 120) addInterval(v); }
                  if (e.key === "Escape") { setShowCustomInput(false); setCustomVal(""); }
                }}
                placeholder={t("hydration.minPlaceholder")}
                style={{
                  width: 64, padding: "7px 10px", borderRadius: 10,
                  border: `1.5px solid ${N.silver}`, background: N.card,
                  fontFamily: "'DM Sans',sans-serif", fontSize: 13, color: N.text,
                }}
              />
              <button
                onClick={() => { const v = parseInt(customVal); if (v >= 1 && v <= 120) addInterval(v); }}
                style={{
                  padding: "7px 12px", borderRadius: 10, border: "none",
                  background: N.silver, color: "#1a1a1a",
                  fontFamily: "'DM Sans',sans-serif", fontSize: 12, fontWeight: 500, cursor: "pointer",
                }}
              >
                {t("hydration.add")}
              </button>
              <button
                onClick={() => { setShowCustomInput(false); setCustomVal(""); }}
                style={{
                  padding: "7px 8px", borderRadius: 10, border: `1px solid ${N.border}`,
                  background: "none", color: N.muted, fontSize: 12, cursor: "pointer",
                }}
              >
                ×
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Educational tip */}
      <div
        style={{
          background: N.card,
          backdropFilter: "blur(12px)",
          border: `1px solid ${N.silver}20`,
          borderLeft: `3px solid ${N.silver}`,
          borderRadius: 14,
          padding: "12px 14px",
        }}
      >
        <p style={{
          margin: 0,
          fontFamily: "'Cormorant Garamond',serif",
          fontStyle: "italic",
          fontSize: 15,
          color: N.muted,
          lineHeight: 1.5,
        }}>
          {t("hydration.tip")}
        </p>
      </div>
    </>
  );
}

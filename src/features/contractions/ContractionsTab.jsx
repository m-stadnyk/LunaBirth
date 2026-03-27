import { P } from "../../theme/index.js";
import { PHASES } from "../../constants/index.js";
import { fmtSec, fmtMMSS } from "../../utils/formatters.js";

export function ContractionsTab({
  contractions,
  activeStart,
  elapsed,
  clearConfirm,
  setClearConfirm,
  phase,
  stats,
  handleContraction,
  clearAll,
}) {
  const cfg = PHASES[phase];

  return (
    <>
      {/* Phase progression banner */}
      {(phase !== "tracking" || contractions.length >= 3) && (
        <div
          style={{
            background: `linear-gradient(135deg,${cfg.bg},${P.cream})`,
            border: `1.5px solid ${cfg.accent}50`,
            borderLeft: `4px solid ${cfg.accent}`,
            borderRadius: 14,
            padding: "14px",
            marginBottom: 14,
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              marginBottom: 6,
            }}
          >
            <span style={{ fontSize: 22 }}>{cfg.icon}</span>
            <span
              style={{
                fontFamily: "'Cormorant Garamond',serif",
                fontSize: 20,
                fontWeight: 500,
                color: cfg.dark,
              }}
            >
              {cfg.title}
            </span>
            {stats?.trend === "intensifying" && (
              <span
                style={{
                  marginLeft: "auto",
                  fontSize: 10,
                  background: P.rose,
                  color: "#fff",
                  borderRadius: 20,
                  padding: "2px 8px",
                  whiteSpace: "nowrap",
                }}
              >
                ^ intensifying
              </span>
            )}
            {stats?.trend === "spacing out" && (
              <span
                style={{
                  marginLeft: "auto",
                  fontSize: 10,
                  background: P.sage,
                  color: "#fff",
                  borderRadius: 20,
                  padding: "2px 8px",
                  whiteSpace: "nowrap",
                }}
              >
                v spacing out
              </span>
            )}
          </div>
          {stats && (
            <div
              style={{
                fontSize: 13,
                color: cfg.dark,
                fontWeight: 500,
                marginBottom: 6,
              }}
            >
              Every {stats.avgGap} min . {fmtSec(stats.avgDur)} long
            </div>
          )}
          <p
            style={{
              margin: "0 0 6px",
              fontSize: 13,
              color: P.muted,
              lineHeight: 1.5,
            }}
          >
            {cfg.meaning}
          </p>
          <p
            style={{
              margin: 0,
              fontFamily: "'Cormorant Garamond',serif",
              fontStyle: "italic",
              fontSize: 14,
              color: cfg.dark,
              lineHeight: 1.5,
            }}
          >
            💡 {cfg.tip}
          </p>
        </div>
      )}

      {/* 5-1-1 alert */}
      {stats?.rule511 && (
        <div
          style={{
            background: `linear-gradient(135deg,${P.roseLight},#fce8e8)`,
            border: `2px solid ${P.rose}`,
            borderRadius: 14,
            padding: 14,
            marginBottom: 14,
            display: "flex",
            gap: 10,
          }}
        >
          <span style={{ fontSize: 26 }}>📞</span>
          <div>
            <div
              style={{
                fontFamily: "'Cormorant Garamond',serif",
                fontSize: 18,
                fontWeight: 500,
                color: P.roseDark,
                marginBottom: 4,
              }}
            >
              5-1-1 Rule Reached
            </div>
            <p style={{ margin: 0, fontSize: 13, color: P.muted, lineHeight: 1.5 }}>
              Contractions ~5 min apart, ~1 min long, sustained. Most providers recommend
              heading to your birth location now. Call your midwife or OB.
            </p>
          </div>
        </div>
      )}

      {/* Quick stats */}
      {contractions.length > 0 && (
        <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
          {[
            { n: contractions.length, l: "Total" },
            { n: fmtSec(contractions[0]?.duration), l: "Last" },
            contractions.length >= 2 && {
              n: `${((contractions[0].start - contractions[1].start) / 60000).toFixed(1)}m`,
              l: "Gap",
            },
          ]
            .filter(Boolean)
            .map(({ n, l }) => (
              <div
                key={l}
                style={{
                  flex: 1,
                  background: P.roseLight,
                  borderRadius: 12,
                  padding: "10px 8px",
                  textAlign: "center",
                }}
              >
                <div
                  style={{
                    fontFamily: "'Cormorant Garamond',serif",
                    fontSize: 24,
                    color: P.roseDark,
                    lineHeight: 1,
                  }}
                >
                  {n}
                </div>
                <div
                  style={{
                    fontSize: 10,
                    color: P.muted,
                    textTransform: "uppercase",
                    letterSpacing: "0.08em",
                    marginTop: 3,
                  }}
                >
                  {l}
                </div>
              </div>
            ))}
        </div>
      )}

      {/* Main tap button */}
      <button
        className={activeStart ? "pulsing" : ""}
        onClick={handleContraction}
        style={{
          width: "100%",
          padding: "22px 16px",
          borderRadius: 20,
          border: "none",
          background: activeStart
            ? `linear-gradient(135deg,${P.rose},${P.roseDark})`
            : `linear-gradient(135deg,${P.sage},${P.sageDark})`,
          color: "#fff",
          fontFamily: "'Cormorant Garamond',serif",
          fontSize: 22,
          fontWeight: 500,
          cursor: "pointer",
          boxShadow: activeStart
            ? "0 6px 24px rgba(180,100,100,0.35)"
            : "0 6px 24px rgba(80,140,90,0.25)",
          transition: "all 0.3s",
        }}
      >
        {activeStart ? "Tap to end contraction" : "Tap when contraction starts"}
      </button>

      {/* Elapsed timer */}
      {activeStart && (
        <div style={{ textAlign: "center", padding: "10px 0" }}>
          <div
            style={{
              fontFamily: "'Cormorant Garamond',serif",
              fontSize: 52,
              fontWeight: 300,
              color: P.rose,
              lineHeight: 1,
            }}
          >
            {fmtMMSS(elapsed)}
          </div>
          <div
            style={{
              fontSize: 11,
              color: P.muted,
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              marginTop: 4,
            }}
          >
            contraction in progress
          </div>
        </div>
      )}

      {/* Contraction history */}
      {contractions.length > 0 && (
        <div
          style={{
            background: P.card,
            borderRadius: 16,
            padding: 14,
            boxShadow: "0 2px 12px rgba(180,100,100,0.08)",
            border: `1px solid ${P.border}`,
            marginTop: 14,
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 8,
            }}
          >
            <span
              style={{
                fontFamily: "'Cormorant Garamond',serif",
                fontSize: 16,
                color: P.muted,
              }}
            >
              Recent contractions
            </span>
            {clearConfirm ? (
              <div style={{ display: "flex", gap: 6 }}>
                <button
                  onClick={clearAll}
                  style={{
                    background: P.alert,
                    color: "#fff",
                    border: "none",
                    borderRadius: 8,
                    padding: "4px 10px",
                    fontSize: 11,
                    cursor: "pointer",
                  }}
                >
                  Yes, clear
                </button>
                <button
                  onClick={() => setClearConfirm(false)}
                  style={{
                    background: "none",
                    border: `1px solid ${P.border}`,
                    color: P.muted,
                    borderRadius: 8,
                    padding: "4px 10px",
                    fontSize: 11,
                    cursor: "pointer",
                  }}
                >
                  Cancel
                </button>
              </div>
            ) : (
              <button
                onClick={() => setClearConfirm(true)}
                style={{
                  background: "none",
                  border: `1px solid ${P.border}`,
                  color: P.muted,
                  fontSize: 11,
                  padding: "3px 9px",
                  borderRadius: 8,
                  cursor: "pointer",
                }}
              >
                Clear
              </button>
            )}
          </div>
          {contractions.slice(0, 8).map((c, i) => (
            <div
              key={c.start}
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: "9px 0",
                borderBottom: i < 7 ? `1px solid ${P.border}` : "none",
              }}
            >
              <span style={{ fontSize: 13, color: P.muted }}>{c.time}</span>
              <span
                style={{
                  background: P.rose,
                  borderRadius: 20,
                  padding: "3px 10px",
                  fontSize: 12,
                  color: "#fff",
                }}
              >
                {fmtSec(c.duration)}
              </span>
              {i < contractions.length - 1 && (
                <span style={{ fontSize: 12, color: P.muted }}>
                  {((c.start - contractions[i + 1]?.start) / 60000).toFixed(1)}m apart
                </span>
              )}
            </div>
          ))}
        </div>
      )}
    </>
  );
}

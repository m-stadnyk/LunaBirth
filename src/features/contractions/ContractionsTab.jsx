import { N } from "../../theme/index.js";
import { PHASES } from "../../constants/index.js";
import { fmtSec, fmtMMSS } from "../../utils/formatters.js";
import { Icon } from "../../components/Icon.jsx";
import { useLocaleContext } from "../../context/LocaleContext.jsx";

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
  const { t } = useLocaleContext();

  return (
    <>
      {/* Phase progression banner */}
      {(phase !== "tracking" || contractions.length >= 3) && (
        <div
          style={{
            background: N.card,
            backdropFilter: "blur(12px)",
            border: `1px solid ${cfg.accent}40`,
            borderLeft: `4px solid ${cfg.accent}`,
            borderRadius: 14,
            padding: "14px",
            marginBottom: 14,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
            <Icon name={cfg.icon} size={20} color={cfg.accent} />
            <span
              style={{
                fontFamily: "'Cormorant Garamond',serif",
                fontSize: 20,
                fontWeight: 500,
                color: cfg.dark,
              }}
            >
              {t(`phases.${phase}.title`)}
            </span>
            {stats?.trend === "intensifying" && (
              <span
                style={{
                  marginLeft: "auto",
                  fontSize: 10,
                  background: N.gold,
                  color: "#1a1a1a",
                  borderRadius: 20,
                  padding: "2px 8px",
                  whiteSpace: "nowrap",
                }}
              >
                {t("contractions.intensifying")}
              </span>
            )}
            {stats?.trend === "spacing out" && (
              <span
                style={{
                  marginLeft: "auto",
                  fontSize: 10,
                  background: N.silver,
                  color: "#1a1a1a",
                  borderRadius: 20,
                  padding: "2px 8px",
                  whiteSpace: "nowrap",
                }}
              >
                {t("contractions.spacingOut")}
              </span>
            )}
          </div>
          {stats && (
            <div style={{ fontSize: 13, color: cfg.dark, fontWeight: 500, marginBottom: 6 }}>
              {t("contractions.every")} {stats.avgGap} min · {fmtSec(stats.avgDur)} {t("contractions.long")}
            </div>
          )}
          <p style={{ margin: "0 0 6px", fontSize: 13, color: N.muted, lineHeight: 1.5 }}>
            {t(`phases.${phase}.meaning`)}
          </p>
          <p
            style={{
              margin: 0,
              fontFamily: "'Cormorant Garamond',serif",
              fontStyle: "italic",
              fontSize: 14,
              color: cfg.dark,
              lineHeight: 1.5,
              display: "flex",
              alignItems: "center",
              gap: 6,
            }}
          >
            <Icon name="bulb" size={14} color={cfg.accent} />
            {t(`phases.${phase}.tip`)}
          </p>
        </div>
      )}

      {/* 5-1-1 alert */}
      {stats?.rule511 && (
        <div
          style={{
            background: "rgba(224,117,117,0.12)",
            border: `2px solid ${N.alert}`,
            borderRadius: 14,
            padding: 14,
            marginBottom: 14,
            display: "flex",
            gap: 10,
          }}
        >
          <Icon name="phone" size={26} color={N.alert} style={{ marginTop: 2 }} />
          <div>
            <div
              style={{
                fontFamily: "'Cormorant Garamond',serif",
                fontSize: 18,
                fontWeight: 500,
                color: N.alert,
                marginBottom: 4,
              }}
            >
              {t("contractions.rule511Title")}
            </div>
            <p style={{ margin: 0, fontSize: 13, color: N.muted, lineHeight: 1.5 }}>
              {t("contractions.rule511Body")}
            </p>
          </div>
        </div>
      )}

      {/* Quick stats */}
      {contractions.length > 0 && (
        <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
          {[
            { n: contractions.length, l: t("contractions.total") },
            { n: fmtSec(contractions[0]?.duration), l: t("contractions.last") },
            contractions.length >= 2 && {
              n: `${((contractions[0].start - contractions[1].start) / 60000).toFixed(1)}m`,
              l: t("contractions.gap"),
            },
          ]
            .filter(Boolean)
            .map(({ n, l }) => (
              <div
                key={l}
                style={{
                  flex: 1,
                  background: N.card,
                  backdropFilter: "blur(8px)",
                  borderRadius: 12,
                  padding: "10px 8px",
                  textAlign: "center",
                  border: `1px solid ${N.border}`,
                }}
              >
                <div
                  style={{
                    fontFamily: "'Cormorant Garamond',serif",
                    fontSize: 24,
                    color: N.gold,
                    lineHeight: 1,
                  }}
                >
                  {n}
                </div>
                <div
                  style={{
                    fontSize: 10,
                    color: N.muted,
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
            ? `linear-gradient(135deg,${N.alert},#c05555)`
            : `linear-gradient(135deg,${N.gold},${N.goldDark})`,
          color: "#1a1a1a",
          fontFamily: "'Cormorant Garamond',serif",
          fontSize: 22,
          fontWeight: 500,
          cursor: "pointer",
          boxShadow: activeStart
            ? "0 6px 24px rgba(224,117,117,0.35)"
            : "0 6px 24px rgba(212,168,67,0.30)",
          transition: "all 0.3s",
        }}
      >
        {activeStart ? t("contractions.tapEnd") : t("contractions.tapStart")}
      </button>

      {/* Elapsed timer */}
      {activeStart && (
        <div style={{ textAlign: "center", padding: "10px 0" }}>
          <div
            style={{
              fontFamily: "'Cormorant Garamond',serif",
              fontSize: 52,
              fontWeight: 300,
              color: N.gold,
              lineHeight: 1,
            }}
          >
            {fmtMMSS(elapsed)}
          </div>
          <div
            style={{
              fontSize: 11,
              color: N.muted,
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              marginTop: 4,
            }}
          >
            {t("contractions.inProgress")}
          </div>
        </div>
      )}

      {/* Contraction history */}
      {contractions.length > 0 && (
        <div
          style={{
            background: N.card,
            backdropFilter: "blur(12px)",
            borderRadius: 16,
            padding: 14,
            border: `1px solid ${N.border}`,
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
            <span style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 16, color: N.muted }}>
              {t("contractions.recentTitle")}
            </span>
            {clearConfirm ? (
              <div style={{ display: "flex", gap: 6 }}>
                <button
                  onClick={clearAll}
                  style={{
                    background: N.alert, color: "#fff", border: "none",
                    borderRadius: 8, padding: "4px 10px", fontSize: 11, cursor: "pointer",
                  }}
                >
                  {t("contractions.clearConfirm")}
                </button>
                <button
                  onClick={() => setClearConfirm(false)}
                  style={{
                    background: "none", border: `1px solid ${N.border}`,
                    color: N.muted, borderRadius: 8, padding: "4px 10px",
                    fontSize: 11, cursor: "pointer",
                  }}
                >
                  {t("contractions.cancel")}
                </button>
              </div>
            ) : (
              <button
                onClick={() => setClearConfirm(true)}
                style={{
                  background: "none", border: `1px solid ${N.border}`,
                  color: N.muted, fontSize: 11, padding: "3px 9px",
                  borderRadius: 8, cursor: "pointer",
                }}
              >
                {t("contractions.clear")}
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
                borderBottom: i < 7 ? `1px solid ${N.border}` : "none",
              }}
            >
              <span style={{ fontSize: 13, color: N.muted }}>{c.time}</span>
              <span
                style={{
                  background: N.goldLight,
                  border: `1px solid ${N.gold}`,
                  borderRadius: 20,
                  padding: "3px 10px",
                  fontSize: 12,
                  color: N.gold,
                }}
              >
                {fmtSec(c.duration)}
              </span>
              {i < contractions.length - 1 && (
                <span style={{ fontSize: 12, color: N.muted }}>
                  {((c.start - contractions[i + 1]?.start) / 60000).toFixed(1)}{t("contractions.mApart")}
                </span>
              )}
            </div>
          ))}
        </div>
      )}
    </>
  );
}

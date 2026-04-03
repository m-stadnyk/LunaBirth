import { N } from "../../theme/index.js";
import { PHASES } from "../../constants/index.js";
import { sortByPhase } from "../../utils/phaseAnalysis.js";
import { Icon } from "../../components/Icon.jsx";
import { useLocaleContext } from "../../context/LocaleContext.jsx";

export function ReliefTab({
  methods,
  phase,
  showAddForm,
  setShowAddForm,
  newName,
  setNewName,
  newMedia,
  setNewMedia,
  newPhases,
  setNewPhases,
  addMethod,
  removeMethod,
  setActiveMethod,
}) {
  const cfg = PHASES[phase];
  const sorted = sortByPhase(methods, phase);
  const { t } = useLocaleContext();

  return (
    <>
      {/* Phase sort indicator */}
      {phase !== "tracking" && (
        <div
          style={{
            background: N.card,
            backdropFilter: "blur(12px)",
            borderRadius: 12,
            padding: "10px 14px",
            marginBottom: 14,
            display: "flex",
            alignItems: "center",
            gap: 8,
            border: `1px solid ${cfg.accent}30`,
            borderLeft: `4px solid ${cfg.accent}`,
          }}
        >
          <Icon name={cfg.icon} size={18} color={cfg.accent} />
          <span style={{ fontFamily: "'Cormorant Garamond',serif", fontStyle: "italic", fontSize: 14, color: cfg.dark }}>
            {t("relief.sortedFor", { phase: t(`phases.${phase}.title`).toLowerCase() })}
          </span>
        </div>
      )}

      {/* Methods list */}
      {sorted.map((m) => {
        const relevant = m.phases.some((p) => (cfg.priority || []).includes(p));
        return (
          <div
            key={m.id}
            onClick={() => setActiveMethod(m)}
            style={{
              background: N.card,
              backdropFilter: "blur(12px)",
              borderRadius: 14,
              padding: "13px 14px",
              border: `1px solid ${relevant && phase !== "tracking" ? cfg.accent + "50" : N.border}`,
              borderLeft: relevant && phase !== "tracking" ? `4px solid ${cfg.accent}` : `4px solid transparent`,
              marginBottom: 8,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: 10,
              transition: "all 0.2s",
            }}
          >
            {relevant && phase !== "tracking" && (
              <span
                style={{
                  fontSize: 10,
                  background: cfg.accent,
                  color: "#1a1a1a",
                  borderRadius: 20,
                  padding: "2px 7px",
                  whiteSpace: "nowrap",
                  flexShrink: 0,
                }}
              >
                {t("relief.now")}
              </span>
            )}
            <span style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 18, color: N.text, flex: 1 }}>
              {m.name}
            </span>
            <div style={{ display: "flex", alignItems: "center", gap: 6, flexShrink: 0 }}>
              {m.mediaUrl && <Icon name="image" size={14} color={N.muted} />}
              <button
                onClick={(e) => { e.stopPropagation(); removeMethod(m.id); }}
                style={{
                  background: "none", border: "none", cursor: "pointer",
                  color: N.muted, padding: 0, lineHeight: 1,
                }}
              >
                <Icon name="close" size={18} color={N.muted} />
              </button>
            </div>
          </div>
        );
      })}

      {/* Add method form */}
      <div style={{ marginTop: 8 }}>
        {!showAddForm ? (
          <button
            onClick={() => setShowAddForm(true)}
            style={{
              width: "100%", padding: 12, borderRadius: 14,
              border: `1.5px dashed ${N.border}`, background: "none",
              color: N.muted, fontFamily: "'DM Sans',sans-serif",
              fontSize: 14, cursor: "pointer",
            }}
          >
            {t("relief.addMethodBtn")}
          </button>
        ) : (
          <div
            style={{
              background: N.card,
              backdropFilter: "blur(12px)",
              borderRadius: 14,
              padding: 14,
              border: `1px solid ${N.border}`,
            }}
          >
            <p style={{ margin: "0 0 10px", fontSize: 12, color: N.muted, textTransform: "uppercase", letterSpacing: "0.07em" }}>
              {t("relief.newMethod")}
            </p>
            <input
              placeholder={t("relief.namePlaceholder")}
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              style={{
                width: "100%", padding: "10px 12px", borderRadius: 10,
                border: `1px solid ${N.border}`, background: N.cream,
                fontFamily: "'DM Sans',sans-serif", fontSize: 14, color: N.text,
                marginBottom: 8, display: "block", boxSizing: "border-box",
              }}
            />
            <input
              placeholder={t("relief.mediaPlaceholder")}
              value={newMedia}
              onChange={(e) => setNewMedia(e.target.value)}
              style={{
                width: "100%", padding: "10px 12px", borderRadius: 10,
                border: `1px solid ${N.border}`, background: N.cream,
                fontFamily: "'DM Sans',sans-serif", fontSize: 13, color: N.text,
                marginBottom: 10, display: "block", boxSizing: "border-box",
              }}
            />
            <p style={{ margin: "0 0 8px", fontSize: 12, color: N.muted }}>{t("relief.relevantIn")}</p>
            <div style={{ display: "flex", gap: 6, marginBottom: 12 }}>
              {["early", "active", "transition"].map((ph) => {
                const on = newPhases.includes(ph);
                const phCfg = PHASES[ph];
                return (
                  <button
                    key={ph}
                    onClick={() => setNewPhases(on ? newPhases.filter((p) => p !== ph) : [...newPhases, ph])}
                    style={{
                      flex: 1, padding: "7px 4px", borderRadius: 8,
                      border: `1.5px solid ${on ? phCfg.accent : N.border}`,
                      background: on ? phCfg.bg : "transparent",
                      color: on ? phCfg.dark : N.muted,
                      fontFamily: "'DM Sans',sans-serif", fontSize: 12,
                      fontWeight: on ? 500 : 400, cursor: "pointer",
                    }}
                  >
                    {t(`phases.${ph}.badge`)}
                  </button>
                );
              })}
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <button
                onClick={addMethod}
                style={{
                  flex: 1, padding: 10, borderRadius: 10, border: "none",
                  background: N.gold, color: "#1a1a1a",
                  fontFamily: "'DM Sans',sans-serif", fontSize: 14, fontWeight: 500, cursor: "pointer",
                }}
              >
                {t("relief.addMethod")}
              </button>
              <button
                onClick={() => { setShowAddForm(false); setNewName(""); setNewMedia(""); }}
                style={{
                  padding: "10px 14px", borderRadius: 10, border: `1px solid ${N.border}`,
                  background: "none", color: N.muted,
                  fontFamily: "'DM Sans',sans-serif", fontSize: 14, cursor: "pointer",
                }}
              >
                {t("relief.cancel")}
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}

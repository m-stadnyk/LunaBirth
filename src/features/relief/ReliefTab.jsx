import { P } from "../../theme/index.js";
import { PHASES } from "../../constants/index.js";
import { sortByPhase } from "../../utils/phaseAnalysis.js";

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

  return (
    <>
      {/* Phase sort indicator */}
      {phase !== "tracking" && (
        <div
          style={{
            background: `linear-gradient(135deg,${cfg.bg},${P.cream})`,
            borderRadius: 12,
            padding: "10px 14px",
            marginBottom: 14,
            display: "flex",
            alignItems: "center",
            gap: 8,
            border: `1.5px solid ${cfg.accent}30`,
          }}
        >
          <span style={{ fontSize: 18 }}>{cfg.icon}</span>
          <span
            style={{
              fontFamily: "'Cormorant Garamond',serif",
              fontStyle: "italic",
              fontSize: 14,
              color: cfg.dark,
            }}
          >
            Sorted for {cfg.title.toLowerCase()} — most relevant methods first
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
              background:
                relevant && phase !== "tracking"
                  ? `linear-gradient(135deg,${cfg.bg},${P.cream})`
                  : P.card,
              borderRadius: 14,
              padding: "13px 14px",
              border: `1.5px solid ${
                relevant && phase !== "tracking" ? cfg.accent + "50" : P.border
              }`,
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
                  color: "#fff",
                  borderRadius: 20,
                  padding: "2px 7px",
                  whiteSpace: "nowrap",
                  flexShrink: 0,
                }}
              >
                now
              </span>
            )}
            <span
              style={{
                fontFamily: "'Cormorant Garamond',serif",
                fontSize: 18,
                color:
                  relevant && phase !== "tracking" ? cfg.dark : P.text,
                flex: 1,
              }}
            >
              {m.name}
            </span>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                flexShrink: 0,
              }}
            >
              {m.mediaUrl && <span style={{ fontSize: 13 }}>🖼</span>}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  removeMethod(m.id);
                }}
                style={{
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  color: P.muted,
                  fontSize: 20,
                  padding: 0,
                  lineHeight: 1,
                }}
              >
                ×
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
              width: "100%",
              padding: 12,
              borderRadius: 14,
              border: `1.5px dashed ${P.border}`,
              background: "none",
              color: P.muted,
              fontFamily: "'DM Sans',sans-serif",
              fontSize: 14,
              cursor: "pointer",
            }}
          >
            + Add pain relief method
          </button>
        ) : (
          <div
            style={{
              background: P.card,
              borderRadius: 14,
              padding: 14,
              border: `1.5px solid ${P.border}`,
            }}
          >
            <p
              style={{
                margin: "0 0 10px",
                fontSize: 12,
                color: P.muted,
                textTransform: "uppercase",
                letterSpacing: "0.07em",
              }}
            >
              New method
            </p>
            <input
              placeholder="Method name..."
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              style={{
                width: "100%",
                padding: "10px 12px",
                borderRadius: 10,
                border: `1.5px solid ${P.border}`,
                background: P.cream,
                fontFamily: "'DM Sans',sans-serif",
                fontSize: 14,
                color: P.text,
                marginBottom: 8,
                display: "block",
              }}
            />
            <input
              placeholder="Media URL: image, YouTube, Spotify, or any link (optional)"
              value={newMedia}
              onChange={(e) => setNewMedia(e.target.value)}
              style={{
                width: "100%",
                padding: "10px 12px",
                borderRadius: 10,
                border: `1.5px solid ${P.border}`,
                background: P.cream,
                fontFamily: "'DM Sans',sans-serif",
                fontSize: 13,
                color: P.text,
                marginBottom: 10,
                display: "block",
              }}
            />
            <p style={{ margin: "0 0 8px", fontSize: 12, color: P.muted }}>
              Relevant in:
            </p>
            <div style={{ display: "flex", gap: 6, marginBottom: 12 }}>
              {["early", "active", "transition"].map((ph) => {
                const on = newPhases.includes(ph);
                const phCfg = PHASES[ph];
                return (
                  <button
                    key={ph}
                    onClick={() =>
                      setNewPhases(
                        on ? newPhases.filter((p) => p !== ph) : [...newPhases, ph]
                      )
                    }
                    style={{
                      flex: 1,
                      padding: "7px 4px",
                      borderRadius: 8,
                      border: `1.5px solid ${on ? phCfg.accent : P.border}`,
                      background: on ? phCfg.bg : P.card,
                      color: on ? phCfg.dark : P.muted,
                      fontFamily: "'DM Sans',sans-serif",
                      fontSize: 12,
                      fontWeight: on ? 500 : 400,
                      cursor: "pointer",
                    }}
                  >
                    {phCfg.badge}
                  </button>
                );
              })}
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <button
                onClick={addMethod}
                style={{
                  flex: 1,
                  padding: 10,
                  borderRadius: 10,
                  border: "none",
                  background: P.rose,
                  color: "#fff",
                  fontFamily: "'DM Sans',sans-serif",
                  fontSize: 14,
                  fontWeight: 500,
                  cursor: "pointer",
                }}
              >
                Add Method
              </button>
              <button
                onClick={() => {
                  setShowAddForm(false);
                  setNewName("");
                  setNewMedia("");
                }}
                style={{
                  padding: "10px 14px",
                  borderRadius: 10,
                  border: `1.5px solid ${P.border}`,
                  background: "none",
                  color: P.muted,
                  fontFamily: "'DM Sans',sans-serif",
                  fontSize: 14,
                  cursor: "pointer",
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}

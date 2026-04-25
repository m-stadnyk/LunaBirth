import { useDebug } from "../context/DebugContext.jsx";
import { useFeatureFlags } from "../context/FeatureFlagContext.jsx";
import { N } from "../theme/index.js";

/**
 * Floating error popup shown when the debugPopup feature flag is enabled.
 * Errors are pushed by hooks and adapters via useDebug().pushError().
 * Each error can be dismissed individually.
 */
export function DebugPopup() {
  const { flags } = useFeatureFlags();
  const { errors, clearError } = useDebug();

  if (!flags.debugPopup || errors.length === 0) return null;

  return (
    <div
      style={{
        position: "fixed",
        bottom: 60,
        left: 16,
        right: 16,
        zIndex: 500,
        display: "flex",
        flexDirection: "column",
        gap: 8,
        pointerEvents: "auto",
      }}
    >
      {errors.map((err) => (
        <div
          key={err.id}
          style={{
            background: "#1a0808",
            border: `1px solid ${N.alert}`,
            borderRadius: 10,
            padding: "12px 14px",
            display: "flex",
            gap: 10,
            alignItems: "flex-start",
          }}
        >
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ color: N.alert, fontSize: 11, fontWeight: 700, marginBottom: 4, letterSpacing: "0.04em" }}>
              DEBUG
            </div>
            <div
              style={{
                color: "#f0c0c0",
                fontSize: 12,
                fontFamily: "monospace",
                wordBreak: "break-all",
                lineHeight: 1.5,
              }}
            >
              {err.message}
            </div>
          </div>
          <button
            onClick={() => clearError(err.id)}
            aria-label="Dismiss"
            style={{
              background: "none",
              border: "none",
              color: N.muted,
              cursor: "pointer",
              fontSize: 16,
              padding: "0 2px",
              flexShrink: 0,
              lineHeight: 1,
            }}
          >
            ✕
          </button>
        </div>
      ))}
    </div>
  );
}

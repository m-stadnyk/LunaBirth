import { N } from "../theme/index.js";
import { PHASES } from "../constants/index.js";
import { MediaDisplay } from "./MediaDisplay.jsx";
import { MediaInlineEditor } from "./MediaInlineEditor.jsx";
import { Icon } from "./Icon.jsx";
import { useLocaleContext } from "../context/LocaleContext.jsx";

export function MethodModal({ method, phase, affirmation, onClose, onSaveMedia }) {
  if (!method) return null;
  const cfg = PHASES[phase];
  const { t } = useLocaleContext();

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed", inset: 0,
        background: "rgba(5,10,30,0.80)",
        display: "flex", alignItems: "center", justifyContent: "center",
        zIndex: 100, padding: 20,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: N.cardSolid,
          borderRadius: 24,
          padding: "26px 22px",
          maxWidth: 360, width: "100%",
          boxShadow: "0 20px 60px rgba(5,10,30,0.6)",
          maxHeight: "88vh", overflowY: "auto",
          border: `1px solid ${N.border}`,
        }}
      >
        <h2
          style={{
            fontFamily: "'Cormorant Garamond',serif",
            fontSize: 26, fontWeight: 400,
            color: N.gold, margin: "0 0 16px", lineHeight: 1.3,
          }}
        >
          {method.name}
        </h2>

        <MediaDisplay url={method.mediaUrl} />
        {!method.mediaUrl && (
          <MediaInlineEditor onSave={(url) => onSaveMedia(method.id, url)} />
        )}

        <div style={{ background: N.cream, borderRadius: 12, padding: "12px 14px", marginBottom: 14 }}>
          <p
            style={{
              fontFamily: "'Cormorant Garamond',serif",
              fontStyle: "italic", fontSize: 16,
              color: N.muted, margin: 0, lineHeight: 1.6,
            }}
          >
            {affirmation}
          </p>
        </div>

        {phase !== "tracking" && (
          <div
            style={{
              background: cfg.bg, borderRadius: 12, padding: "10px 12px",
              marginBottom: 14, border: `1px solid ${cfg.accent}30`,
              display: "flex", alignItems: "flex-start", gap: 8,
            }}
          >
            <Icon name={cfg.icon} size={14} color={cfg.accent} style={{ marginTop: 2 }} />
            <p style={{
              margin: 0, fontSize: 13, color: cfg.dark,
              fontFamily: "'Cormorant Garamond',serif",
              fontStyle: "italic", lineHeight: 1.4,
            }}>
              {t(`phases.${phase}.tip`)}
            </p>
          </div>
        )}

        <button
          onClick={onClose}
          style={{
            width: "100%", background: "none",
            border: `1px solid ${N.border}`, borderRadius: 12,
            padding: 10, fontFamily: "'DM Sans',sans-serif",
            fontSize: 14, color: N.muted, cursor: "pointer",
          }}
        >
          {t("settings.close")}
        </button>
      </div>
    </div>
  );
}

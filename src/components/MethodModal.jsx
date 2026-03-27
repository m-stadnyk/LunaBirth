import { P } from "../theme/index.js";
import { PHASES } from "../constants/index.js";
import { MediaDisplay } from "./MediaDisplay.jsx";
import { MediaInlineEditor } from "./MediaInlineEditor.jsx";

export function MethodModal({ method, phase, affirmation, onClose, onSaveMedia }) {
  if (!method) return null;
  const cfg = PHASES[phase];

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(61,44,44,0.6)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 100,
        padding: 20,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: `linear-gradient(160deg,${P.cream},${P.roseLight})`,
          borderRadius: 24,
          padding: "26px 22px",
          maxWidth: 360,
          width: "100%",
          boxShadow: "0 20px 60px rgba(61,44,44,0.3)",
          maxHeight: "88vh",
          overflowY: "auto",
        }}
      >
        <h2
          style={{
            fontFamily: "'Cormorant Garamond',serif",
            fontSize: 26,
            fontWeight: 400,
            color: P.roseDark,
            margin: "0 0 16px",
            lineHeight: 1.3,
          }}
        >
          {method.name}
        </h2>

        <MediaDisplay url={method.mediaUrl} />
        {!method.mediaUrl && (
          <MediaInlineEditor onSave={(url) => onSaveMedia(method.id, url)} />
        )}

        <div
          style={{
            background: P.card,
            borderRadius: 12,
            padding: "12px 14px",
            marginBottom: 14,
          }}
        >
          <p
            style={{
              fontFamily: "'Cormorant Garamond',serif",
              fontStyle: "italic",
              fontSize: 16,
              color: P.muted,
              margin: 0,
              lineHeight: 1.6,
            }}
          >
            {affirmation}
          </p>
        </div>

        {phase !== "tracking" && (
          <div
            style={{
              background: cfg.bg,
              borderRadius: 12,
              padding: "10px 12px",
              marginBottom: 14,
              border: `1px solid ${cfg.accent}30`,
            }}
          >
            <p
              style={{
                margin: 0,
                fontSize: 13,
                color: cfg.dark,
                fontFamily: "'Cormorant Garamond',serif",
                fontStyle: "italic",
                lineHeight: 1.4,
              }}
            >
              {cfg.icon} {cfg.tip}
            </p>
          </div>
        )}

        <button
          onClick={onClose}
          style={{
            width: "100%",
            background: "none",
            border: `1.5px solid ${P.border}`,
            borderRadius: 12,
            padding: 10,
            fontFamily: "'DM Sans',sans-serif",
            fontSize: 14,
            color: P.muted,
            cursor: "pointer",
          }}
        >
          Close
        </button>
      </div>
    </div>
  );
}

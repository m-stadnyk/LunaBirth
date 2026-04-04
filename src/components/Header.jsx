import { N } from "../theme/index.js";
import { ModeToggle } from "./ModeToggle.jsx";

export function Header({ affirmation, fade, mode, onToggleMode, onOpenSettings }) {
  return (
    <div
      style={{
        background: "rgba(8,15,40,0.65)",
        backdropFilter: "blur(16px)",
        borderBottom: `1px solid ${N.border}`,
        padding: "16px 20px 12px",
        display: "flex",
        alignItems: "flex-start",
        justifyContent: "space-between",
        gap: 12,
      }}
    >
      <div style={{ flex: 1, minWidth: 0 }}>
        <h1
          style={{
            fontFamily: "'Cormorant Garamond',serif",
            fontSize: 30,
            fontWeight: 400,
            margin: 0,
            color: N.gold,
            letterSpacing: "0.01em",
          }}
        >
          ☽ LunaBirth
        </h1>
        <p
          style={{
            fontFamily: "'Cormorant Garamond',serif",
            fontStyle: "italic",
            fontSize: 16,
            color: N.muted,
            marginTop: 4,
            marginBottom: 0,
            opacity: fade ? 1 : 0,
            transition: "opacity 0.5s",
            lineHeight: 1.4,
            minHeight: "2.8em",
            overflowWrap: "break-word",
            wordBreak: "break-word",
          }}
        >
          {affirmation}
        </p>
      </div>

      <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 6 }}>
        <ModeToggle mode={mode} onToggle={onToggleMode} />
        <button
          aria-label="Settings"
          onClick={onOpenSettings}
          style={{
            background: "none",
            border: "none",
            color: N.muted,
            fontSize: 18,
            cursor: "pointer",
            padding: "2px 4px",
            lineHeight: 1,
          }}
        >
          ⚙
        </button>
      </div>
    </div>
  );
}

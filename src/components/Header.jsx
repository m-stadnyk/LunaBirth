import { P } from "../theme/index.js";
import { ModeToggle } from "./ModeToggle.jsx";

export function Header({ affirmation, fade, mode, onModeToggle, onSettingsOpen }) {
  return (
    <div
      style={{
        background: `linear-gradient(145deg,${P.roseLight},${P.cream})`,
        padding: "14px 16px 10px",
        borderBottom: `1px solid ${P.border}`,
      }}
    >
      {/* Title row + mode toggle + settings */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
        <h1
          style={{
            fontFamily: "'Cormorant Garamond',serif",
            fontSize: 22,
            fontWeight: 400,
            margin: 0,
            color: P.roseDark,
            flex: 1,
          }}
        >
          💗 LunaBirth
        </h1>
        <ModeToggle mode={mode} onToggle={onModeToggle} />
        <button
          onClick={onSettingsOpen}
          aria-label="Settings"
          style={{
            background: "none",
            border: "none",
            cursor: "pointer",
            fontSize: 16,
            color: P.muted,
            padding: "4px 6px",
            lineHeight: 1,
          }}
        >
          ⚙
        </button>
      </div>

      {/* Affirmation */}
      <p
        style={{
          fontFamily: "'Cormorant Garamond',serif",
          fontStyle: "italic",
          fontSize: 13,
          color: P.muted,
          margin: 0,
          opacity: fade ? 1 : 0,
          transition: "opacity 0.5s",
        }}
      >
        {affirmation}
      </p>
    </div>
  );
}

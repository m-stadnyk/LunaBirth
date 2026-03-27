import { P } from "../theme/index.js";

export function Header({ affirmation, fade }) {
  return (
    <div
      style={{
        background: `linear-gradient(145deg,${P.roseLight},${P.cream})`,
        padding: "18px 20px 12px",
        borderBottom: `1px solid ${P.border}`,
      }}
    >
      <h1
        style={{
          fontFamily: "'Cormorant Garamond',serif",
          fontSize: 26,
          fontWeight: 400,
          margin: 0,
          color: P.roseDark,
        }}
      >
        💗 Labor Companion
      </h1>
      <p
        style={{
          fontFamily: "'Cormorant Garamond',serif",
          fontStyle: "italic",
          fontSize: 14,
          color: P.muted,
          marginTop: 3,
          marginBottom: 0,
          opacity: fade ? 1 : 0,
          transition: "opacity 0.5s",
        }}
      >
        {affirmation}
      </p>
    </div>
  );
}

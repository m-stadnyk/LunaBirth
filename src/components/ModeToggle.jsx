import { P } from "../theme/index.js";

const SEGMENTS = [
  { id: "labour", label: "Labour" },
  { id: "expectation", label: "Expectation" },
];

export function ModeToggle({ mode, onToggle }) {
  return (
    <div
      style={{
        display: "flex",
        background: P.cream,
        borderRadius: 20,
        border: `1.5px solid ${P.border}`,
        overflow: "hidden",
        gap: 0,
      }}
    >
      {SEGMENTS.map(({ id, label }) => {
        const active = mode === id;
        return (
          <button
            key={id}
            data-active={active ? "true" : "false"}
            onClick={() => { if (!active) onToggle(id); }}
            style={{
              padding: "5px 11px",
              border: "none",
              borderRadius: 20,
              background: active
                ? `linear-gradient(135deg,${P.rose},${P.roseDark})`
                : "transparent",
              color: active ? "#fff" : P.muted,
              fontFamily: "'DM Sans',sans-serif",
              fontSize: 11,
              fontWeight: active ? 500 : 400,
              cursor: active ? "default" : "pointer",
              transition: "all 0.2s",
              whiteSpace: "nowrap",
            }}
          >
            {label}
          </button>
        );
      })}
    </div>
  );
}

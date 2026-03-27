import { P } from "../theme/index.js";

const TABS = [
  ["contractions", "🌊", "Contractions"],
  ["hydration", "💧", "Hydration"],
  ["relief", "🌿", "Pain Relief"],
];

export function TabBar({ activeTab, onTabChange }) {
  return (
    <div
      style={{
        display: "flex",
        background: P.cream,
        borderBottom: `1px solid ${P.border}`,
        padding: "0 4px",
      }}
    >
      {TABS.map(([id, icon, label]) => (
        <button
          key={id}
          onClick={() => onTabChange(id)}
          style={{
            flex: 1,
            padding: "9px 4px",
            border: "none",
            background: "none",
            fontFamily: "'DM Sans',sans-serif",
            fontSize: 11,
            fontWeight: activeTab === id ? 500 : 400,
            color: activeTab === id ? P.roseDark : P.muted,
            borderBottom:
              activeTab === id ? `2px solid ${P.rose}` : "2px solid transparent",
            cursor: "pointer",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 2,
          }}
        >
          <span style={{ fontSize: 17 }}>{icon}</span>
          <span>{label}</span>
        </button>
      ))}
    </div>
  );
}

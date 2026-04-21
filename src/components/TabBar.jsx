import { N } from "../theme/index.js";
import { Icon } from "./Icon.jsx";
import { useLocaleContext } from "../context/LocaleContext.jsx";

const LABOUR_TAB_IDS = [
  ["contractions", "wave",    "tabs.contractions"],
  ["hydration",    "drop",    "tabs.hydration"],
  ["relief",       "leaf",    "tabs.relief"],
];

const EXPECTATION_TAB_IDS = [
  ["expecting",  "sparkle", "tabs.expecting"],
  ["hydration",  "drop",    "tabs.hydration"],
  ["relief",     "leaf",    "tabs.relief"],
];

export function TabBar({ activeTab, onTabChange, mode }) {
  const { t } = useLocaleContext();
  const tabDefs = mode === "expectation" ? EXPECTATION_TAB_IDS : LABOUR_TAB_IDS;
  const tabs = tabDefs.map(([id, icon, key]) => [id, icon, t(key)]);

  return (
    <div
      style={{
        display: "flex",
        background: "rgba(8,15,40,0.65)",
        backdropFilter: "blur(16px)",
        borderBottom: `1px solid ${N.border}`,
        padding: "0 4px",
      }}
    >
      {tabs.map(([id, icon, label]) => {
        const active = activeTab === id;
        return (
          <button
            key={id}
            data-testid={`tab-${id}`}
            onClick={() => onTabChange(id)}
            style={{
              flex: 1,
              padding: "9px 4px",
              border: "none",
              background: "none",
              fontFamily: "'DM Sans',sans-serif",
              fontSize: 11,
              fontWeight: active ? 600 : 400,
              color: active ? N.gold : N.muted,
              borderBottom: active ? `2px solid ${N.gold}` : "2px solid transparent",
              cursor: "pointer",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 3,
            }}
          >
            <Icon name={icon} size={18} color={active ? N.gold : N.muted} strokeWidth={active ? 2 : 1.5} />
            <span style={{ overflowWrap: "break-word", wordBreak: "break-word", textAlign: "center" }}>{label}</span>
          </button>
        );
      })}
    </div>
  );
}

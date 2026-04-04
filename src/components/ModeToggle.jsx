import { N } from "../theme/index.js";
import { useLocaleContext } from "../context/LocaleContext.jsx";

export function ModeToggle({ mode, onToggle }) {
  const { t } = useLocaleContext();
  const isLabour = mode === "labour";
  return (
    <button
      onClick={onToggle}
      style={{
        background: isLabour
          ? `rgba(212,168,67,0.18)`
          : `rgba(138,168,196,0.18)`,
        border: `1px solid ${isLabour ? N.gold : N.silver}`,
        borderRadius: 20,
        padding: "4px 12px",
        fontSize: 11,
        fontFamily: "'DM Sans',sans-serif",
        fontWeight: 500,
        color: isLabour ? N.gold : N.silver,
        cursor: "pointer",
        letterSpacing: "0.04em",
        maxWidth: 120,
        wordBreak: "break-word",
        textAlign: "center",
      }}
    >
      {isLabour ? `✦ ${t("mode.labour")}` : `☽ ${t("mode.expecting")}`}
    </button>
  );
}

import { N } from "../theme/index.js";
import { useLocaleContext } from "../context/LocaleContext.jsx";

/**
 * Non-blocking "new version ready" banner. The app never reloads by itself;
 * the user decides when (see docs/adr/0001-prompt-based-pwa-updates.md).
 */
export function UpdateBanner({ appUpdate }) {
  const { t } = useLocaleContext();
  if (!appUpdate?.updateAvailable) return null;
  const updating = appUpdate.status === "updating";

  return (
    <div
      role="status"
      style={{
        margin: "8px 16px 0",
        background: N.card,
        border: `1px solid ${N.gold}`,
        borderRadius: 12,
        padding: "10px 12px",
        display: "flex",
        alignItems: "center",
        gap: 10,
      }}
    >
      <div style={{ flex: 1, fontSize: 12, lineHeight: 1.4 }}>
        <div style={{ color: N.text }}>{t("update.bannerText")}</div>
        <div style={{ color: N.muted }}>{t("update.bannerHint")}</div>
      </div>
      <button
        onClick={appUpdate.applyUpdate}
        disabled={updating}
        style={{
          background: N.gold, color: "#1a1a1a", border: "none",
          borderRadius: 8, padding: "6px 12px", fontSize: 12, fontWeight: 600,
          cursor: updating ? "not-allowed" : "pointer", whiteSpace: "nowrap",
        }}
      >
        {updating ? t("update.updating") : t("update.updateNow")}
      </button>
    </div>
  );
}

import { N } from "../theme/index.js";
import { useLocaleContext } from "../context/LocaleContext.jsx";

export function SettingsModal({ open, onClose }) {
  const { locale, setLocale, t, supportedLocales } = useLocaleContext();

  if (!open) return null;

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed", inset: 0,
        background: "rgba(0,0,0,0.55)",
        zIndex: 200,
        display: "flex",
        alignItems: "flex-end",
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "100%",
          background: N.cardSolid,
          borderTop: `1px solid ${N.border}`,
          borderRadius: "16px 16px 0 0",
          padding: "24px 20px 40px",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <h2 style={{ margin: 0, color: N.text, fontSize: 18, fontWeight: 500 }}>
            {t("settings.title")}
          </h2>
          <button
            onClick={onClose}
            style={{
              background: "none", border: "none",
              color: N.muted, fontSize: 16, cursor: "pointer", padding: "4px 8px",
            }}
          >
            {t("settings.close")}
          </button>
        </div>

        <p style={{ margin: "0 0 12px", color: N.muted, fontSize: 13 }}>
          {t("settings.languageLabel")}
        </p>

        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {supportedLocales.map((code) => (
            <button
              key={code}
              data-active={String(code === locale)}
              onClick={() => setLocale(code)}
              style={{
                textAlign: "left",
                background: code === locale ? N.goldLight : N.cream,
                border: `1px solid ${code === locale ? N.gold : N.border}`,
                borderRadius: 10,
                padding: "12px 16px",
                color: code === locale ? N.gold : N.text,
                fontSize: 15,
                cursor: "pointer",
                fontWeight: code === locale ? 600 : 400,
              }}
            >
              {t(`settings.${code}`)}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

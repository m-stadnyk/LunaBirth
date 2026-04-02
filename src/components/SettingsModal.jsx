import { useState, useEffect } from "react";
import { P } from "../theme/index.js";
import { storage } from "../utils/storage.js";

const KEY_API = "lc_ak";

export function SettingsModal({ open, onClose }) {
  const [apiKey, setApiKeyState] = useState("");
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!open) return;
    (async () => {
      const stored = await storage.get(KEY_API);
      if (stored) setApiKeyState(stored.value);
    })();
  }, [open]);

  const handleSave = async () => {
    await storage.set(KEY_API, apiKey.trim());
    setSaved(true);
    setTimeout(() => setSaved(false), 1500);
  };

  if (!open) return null;

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed", inset: 0, background: "rgba(61,44,44,0.6)",
        display: "flex", alignItems: "center", justifyContent: "center",
        zIndex: 110, padding: 20,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: P.card, borderRadius: 20, padding: "24px 20px",
          maxWidth: 360, width: "100%",
          boxShadow: "0 20px 60px rgba(61,44,44,0.25)",
        }}
      >
        <h2 style={{
          fontFamily: "'Cormorant Garamond',serif", fontSize: 22, fontWeight: 400,
          color: P.text, margin: "0 0 18px",
        }}>
          ⚙ Settings
        </h2>

        {/* Anthropic API key */}
        <label style={{ display: "block", fontSize: 12, color: P.muted, marginBottom: 6, fontFamily: "'DM Sans',sans-serif" }}>
          Anthropic API Key
          <span style={{ fontSize: 11, marginLeft: 6, color: P.sage }}>
            (for AI task focus)
          </span>
        </label>
        <input
          type="password"
          value={apiKey}
          onChange={(e) => setApiKeyState(e.target.value)}
          placeholder="sk-ant-..."
          style={{
            width: "100%", padding: "10px 12px", borderRadius: 10,
            border: `1.5px solid ${P.border}`, background: P.cream,
            fontFamily: "'DM Sans',sans-serif", fontSize: 13, color: P.text,
            marginBottom: 6, display: "block",
          }}
        />
        <p style={{ margin: "0 0 16px", fontSize: 11, color: P.muted, lineHeight: 1.5 }}>
          Your key is stored only on this device and never sent anywhere except the Anthropic API.
          Get one at <a href="https://console.anthropic.com" target="_blank" rel="noreferrer" style={{ color: P.sage }}>console.anthropic.com</a>.
        </p>

        <div style={{ display: "flex", gap: 8 }}>
          <button
            onClick={handleSave}
            style={{
              flex: 1, padding: 10, borderRadius: 10, border: "none",
              background: saved ? P.sage : `linear-gradient(135deg,${P.rose},${P.roseDark})`,
              color: "#fff", fontFamily: "'DM Sans',sans-serif", fontSize: 13,
              fontWeight: 500, cursor: "pointer", transition: "background 0.3s",
            }}
          >
            {saved ? "Saved ✓" : "Save"}
          </button>
          <button
            onClick={onClose}
            style={{
              flex: 1, padding: 10, borderRadius: 10, border: `1px solid ${P.border}`,
              background: "none", color: P.muted, fontFamily: "'DM Sans',sans-serif",
              fontSize: 13, cursor: "pointer",
            }}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

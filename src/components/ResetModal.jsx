import { useState } from "react";
import { N } from "../theme/index.js";
import { useLocaleContext } from "../context/LocaleContext.jsx";
import { useDatabaseContext } from "../context/DatabaseContext.jsx";

const CATEGORIES = [
  { id: "contractions", labelKey: "reset.contractions" },
  { id: "hydration",    labelKey: "reset.hydration" },
  { id: "todos",        labelKey: "reset.todos" },
  { id: "contacts",     labelKey: "reset.contacts" },
  { id: "relief",       labelKey: "reset.relief" },
  { id: "appSettings",  labelKey: "reset.appSettings" },
];

function CheckRow({ label, checked, onChange }) {
  return (
    <label
      style={{
        display: "flex",
        alignItems: "center",
        gap: 12,
        background: checked ? "rgba(224,117,117,0.08)" : N.cream,
        border: `1px solid ${checked ? N.alert : N.border}`,
        borderRadius: 10,
        padding: "12px 16px",
        cursor: "pointer",
        userSelect: "none",
      }}
    >
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        style={{ width: 18, height: 18, accentColor: N.alert, cursor: "pointer", flexShrink: 0 }}
      />
      <span style={{ color: N.text, fontSize: 15 }}>{label}</span>
    </label>
  );
}

/**
 * Modal for selectively clearing app data from the active adapter.
 * Replaces the old "Clear all tasks" button in Settings.
 */
export function ResetModal({ open, onClose }) {
  const { t } = useLocaleContext();
  const { clearData } = useDatabaseContext();

  const [selected, setSelected] = useState(new Set());
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);

  if (!open) return null;

  const toggle = (id) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const toggleAll = () => {
    if (selected.size === CATEGORIES.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(CATEGORIES.map((c) => c.id)));
    }
  };

  const handleConfirm = async () => {
    if (selected.size === 0) return;
    setBusy(true);
    try {
      await clearData(Array.from(selected));
    } finally {
      setBusy(false);
      setConfirming(false);
      setSelected(new Set());
      onClose();
    }
  };

  const allSelected = selected.size === CATEGORIES.length;

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed", inset: 0,
        background: "rgba(0,0,0,0.65)",
        zIndex: 300,
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
          maxHeight: "85vh",
          overflowY: "auto",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
          <h2 style={{ margin: 0, color: N.text, fontSize: 18, fontWeight: 500 }}>
            {t("reset.title")}
          </h2>
          <button
            onClick={onClose}
            style={{ background: "none", border: "none", color: N.muted, fontSize: 16, cursor: "pointer", padding: "4px 8px" }}
          >
            {t("settings.close")}
          </button>
        </div>

        <p style={{ margin: "0 0 16px", color: N.muted, fontSize: 13 }}>
          {t("reset.subtitle")}
        </p>

        <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 16 }}>
          {/* Select all row */}
          <label
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              padding: "10px 16px",
              cursor: "pointer",
              userSelect: "none",
            }}
          >
            <input
              type="checkbox"
              checked={allSelected}
              onChange={toggleAll}
              style={{ width: 18, height: 18, accentColor: N.muted, cursor: "pointer", flexShrink: 0 }}
            />
            <span style={{ color: N.muted, fontSize: 13, fontWeight: 500 }}>{t("reset.selectAll")}</span>
          </label>

          {CATEGORIES.map(({ id, labelKey }) => (
            <CheckRow
              key={id}
              label={t(labelKey)}
              checked={selected.has(id)}
              onChange={() => toggle(id)}
            />
          ))}
        </div>

        {!confirming ? (
          <button
            onClick={() => selected.size > 0 && setConfirming(true)}
            disabled={selected.size === 0}
            style={{
              width: "100%",
              background: selected.size > 0 ? N.alert : "none",
              border: `1px solid ${selected.size > 0 ? N.alert : N.border}`,
              borderRadius: 10,
              padding: "13px 16px",
              fontSize: 15,
              fontWeight: 600,
              color: selected.size > 0 ? "#fff" : N.muted,
              cursor: selected.size > 0 ? "pointer" : "not-allowed",
              fontFamily: "'DM Sans',sans-serif",
            }}
          >
            {t("reset.clearBtn", { n: selected.size })}
          </button>
        ) : (
          <div
            style={{
              background: "rgba(224,117,117,0.08)",
              border: `1px solid ${N.alert}`,
              borderRadius: 10,
              padding: "16px",
              display: "flex",
              flexDirection: "column",
              gap: 12,
            }}
          >
            <p style={{ margin: 0, color: N.text, fontSize: 14 }}>
              {t("reset.confirmText")}
            </p>
            <div style={{ display: "flex", gap: 8 }}>
              <button
                onClick={handleConfirm}
                disabled={busy}
                style={{
                  flex: 1,
                  background: N.alert,
                  color: "#fff",
                  border: "none",
                  borderRadius: 8,
                  padding: "10px 12px",
                  fontSize: 14,
                  fontWeight: 600,
                  cursor: busy ? "not-allowed" : "pointer",
                  opacity: busy ? 0.7 : 1,
                  fontFamily: "'DM Sans',sans-serif",
                }}
              >
                {busy ? t("reset.clearing") : t("reset.confirmYes")}
              </button>
              <button
                onClick={() => setConfirming(false)}
                disabled={busy}
                style={{
                  flex: 1,
                  background: "none",
                  color: N.muted,
                  border: `1px solid ${N.border}`,
                  borderRadius: 8,
                  padding: "10px 12px",
                  fontSize: 14,
                  cursor: "pointer",
                  fontFamily: "'DM Sans',sans-serif",
                }}
              >
                {t("reset.cancel")}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

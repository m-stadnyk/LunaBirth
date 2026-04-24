import { N, FONTS } from "../theme/index.js";
import { Icon } from "./Icon.jsx";
import { useLocaleContext } from "../context/LocaleContext.jsx";

export function LabourContactsModal({
  open,
  onClose,
  contacts,
  showAddForm,
  setShowAddForm,
  newNickname,
  setNewNickname,
  newPhone,
  setNewPhone,
  addContact,
  removeContact,
}) {
  const { t } = useLocaleContext();

  if (!open) return null;

  const canImport = "contacts" in navigator;

  const handleImport = async () => {
    try {
      const results = await navigator.contacts.select(["name", "tel"], { multiple: false });
      if (results.length) {
        setNewNickname(results[0].name?.[0] ?? "");
        setNewPhone(results[0].tel?.[0] ?? "");
        setShowAddForm(true);
      }
    } catch {
      // User cancelled or API error — silently ignore
    }
  };

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
          maxHeight: "85vh",
          overflowY: "auto",
        }}
      >
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <h2 style={{ margin: 0, color: N.text, fontSize: 18, fontWeight: 500, fontFamily: "'Cormorant Garamond',serif" }}>
            {t("contacts.title")}
          </h2>
          <button
            onClick={onClose}
            style={{ background: "none", border: "none", color: N.muted, fontSize: 16, cursor: "pointer", padding: "4px 8px" }}
          >
            {t("contacts.cancel")}
          </button>
        </div>

        {/* Contact list */}
        {contacts.length === 0 && !showAddForm && (
          <p style={{ fontFamily: FONTS.script, fontSize: 15, color: N.muted, fontStyle: "italic", textAlign: "center", margin: "24px 0" }}>
            {t("contacts.noContacts")}
          </p>
        )}

        {contacts.map((c) => (
          <a
            key={c.id}
            href={`tel:${c.phone}`}
            style={{ textDecoration: "none", display: "block", marginBottom: 8 }}
          >
            <div
              style={{
                background: N.card,
                backdropFilter: "blur(12px)",
                borderRadius: 14,
                padding: "12px 14px",
                border: `1px solid ${N.border}`,
                display: "flex",
                alignItems: "center",
                gap: 12,
              }}
            >
              <div
                style={{
                  width: 36, height: 36, borderRadius: "50%",
                  background: N.goldLight,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                <Icon name="phone" size={18} color={N.gold} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontFamily: FONTS.script, fontSize: 17, color: N.text, lineHeight: 1.3 }}>
                  {c.nickname}
                </div>
                <div style={{ fontSize: 13, color: N.muted, marginTop: 2 }}>
                  {c.phone}
                </div>
              </div>
              <button
                onClick={(e) => { e.preventDefault(); e.stopPropagation(); removeContact(c.id); }}
                style={{ background: "none", border: "none", cursor: "pointer", color: N.muted, padding: 4, lineHeight: 1, flexShrink: 0 }}
              >
                <Icon name="close" size={18} color={N.muted} />
              </button>
            </div>
          </a>
        ))}

        {/* Add form */}
        {showAddForm && (
          <div
            style={{
              background: N.card,
              backdropFilter: "blur(12px)",
              borderRadius: 14,
              padding: 14,
              border: `1px solid ${N.border}`,
              marginBottom: 10,
            }}
          >
            <input
              placeholder={t("contacts.nicknamePlaceholder")}
              value={newNickname}
              onChange={(e) => setNewNickname(e.target.value)}
              style={{
                width: "100%", padding: "10px 12px", borderRadius: 10,
                border: `1px solid ${N.border}`, background: N.cream,
                fontFamily: FONTS.script, fontSize: 15, color: N.text,
                marginBottom: 8, display: "block", boxSizing: "border-box",
              }}
            />
            <input
              placeholder={t("contacts.phonePlaceholder")}
              value={newPhone}
              onChange={(e) => setNewPhone(e.target.value)}
              type="tel"
              style={{
                width: "100%", padding: "10px 12px", borderRadius: 10,
                border: `1px solid ${N.border}`, background: N.cream,
                fontFamily: "'DM Sans',sans-serif", fontSize: 14, color: N.text,
                marginBottom: 10, display: "block", boxSizing: "border-box",
              }}
            />
            <div style={{ display: "flex", gap: 8 }}>
              <button
                onClick={addContact}
                style={{
                  flex: 1, padding: 10, borderRadius: 10, border: "none",
                  background: N.gold, color: "#1a1a1a",
                  fontFamily: "'DM Sans',sans-serif", fontSize: 14, fontWeight: 500, cursor: "pointer",
                }}
              >
                {t("contacts.save")}
              </button>
              <button
                onClick={() => { setShowAddForm(false); setNewNickname(""); setNewPhone(""); }}
                style={{
                  padding: "10px 14px", borderRadius: 10, border: `1px solid ${N.border}`,
                  background: "none", color: N.muted,
                  fontFamily: "'DM Sans',sans-serif", fontSize: 14, cursor: "pointer",
                }}
              >
                {t("contacts.cancel")}
              </button>
            </div>
          </div>
        )}

        {/* Add + Import buttons */}
        {!showAddForm && (
          <div style={{ display: "flex", gap: 8, marginTop: contacts.length > 0 ? 8 : 0 }}>
            <button
              onClick={() => setShowAddForm(true)}
              style={{
                flex: 1, padding: 12, borderRadius: 14,
                border: `1.5px dashed ${N.border}`, background: "none",
                color: N.muted, fontFamily: "'DM Sans',sans-serif",
                fontSize: 14, cursor: "pointer",
              }}
            >
              {t("contacts.addBtn")}
            </button>
            {canImport && (
              <button
                onClick={handleImport}
                style={{
                  padding: "12px 14px", borderRadius: 14,
                  border: `1px solid ${N.border}`, background: "none",
                  color: N.silver, fontFamily: "'DM Sans',sans-serif",
                  fontSize: 13, cursor: "pointer", display: "flex", alignItems: "center", gap: 6,
                }}
              >
                <Icon name="phone" size={14} color={N.silver} />
                {t("contacts.importBtn")}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

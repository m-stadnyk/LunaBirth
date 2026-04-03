import { useState } from "react";
import { N } from "../../theme/index.js";
import { useLocaleContext } from "../../context/LocaleContext.jsx";

export function AddTaskForm({ onAdd }) {
  const [text, setText] = useState("");
  const { t } = useLocaleContext();

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!text.trim()) return;
    onAdd(text.trim());
    setText("");
  };

  return (
    <form onSubmit={handleSubmit} style={{ display: "flex", gap: 8, marginBottom: 14 }}>
      <input
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder={t("expecting.addTaskPlaceholder")}
        style={{
          flex: 1,
          padding: "10px 14px",
          borderRadius: 12,
          border: `1px solid ${N.border}`,
          background: N.card,
          color: N.text,
          fontSize: 14,
          fontFamily: "'DM Sans',sans-serif",
        }}
      />
      <button
        type="submit"
        style={{
          padding: "10px 18px",
          borderRadius: 12,
          border: "none",
          background: N.gold,
          color: "#1a1a1a",
          fontSize: 18,
          fontWeight: 600,
          cursor: "pointer",
          flexShrink: 0,
          minWidth: 48,
        }}
      >
        +
      </button>
    </form>
  );
}

import { useState } from "react";
import { P } from "../theme/index.js";

export function MediaInlineEditor({ onSave }) {
  const [open, setOpen] = useState(false);
  const [url, setUrl] = useState("");

  if (!open)
    return (
      <button
        onClick={() => setOpen(true)}
        style={{
          background: "none",
          border: `1.5px dashed ${P.border}`,
          borderRadius: 10,
          padding: "8px 14px",
          color: P.muted,
          fontFamily: "'DM Sans',sans-serif",
          fontSize: 12,
          cursor: "pointer",
          width: "100%",
          marginBottom: 14,
        }}
      >
        + Add image, YouTube or music link
      </button>
    );

  return (
    <div style={{ display: "flex", gap: 6, marginBottom: 14 }}>
      <input
        value={url}
        onChange={(e) => setUrl(e.target.value)}
        placeholder="Paste URL..."
        style={{
          flex: 1,
          padding: "8px 10px",
          borderRadius: 8,
          border: `1.5px solid ${P.border}`,
          background: P.cream,
          fontFamily: "'DM Sans',sans-serif",
          fontSize: 13,
          color: P.text,
        }}
      />
      <button
        onClick={() => {
          if (url.trim()) {
            onSave(url.trim());
            setOpen(false);
          }
        }}
        style={{
          background: P.rose,
          color: "#fff",
          border: "none",
          borderRadius: 8,
          padding: "8px 12px",
          fontFamily: "'DM Sans',sans-serif",
          fontSize: 12,
          cursor: "pointer",
        }}
      >
        Save
      </button>
      <button
        onClick={() => setOpen(false)}
        style={{
          background: "none",
          border: `1px solid ${P.border}`,
          color: P.muted,
          borderRadius: 8,
          padding: "8px 10px",
          fontSize: 12,
          cursor: "pointer",
        }}
      >
        ✕
      </button>
    </div>
  );
}

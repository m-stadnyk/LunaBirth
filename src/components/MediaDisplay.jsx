import { getMediaType, getYtId } from "../utils/media.js";
import { P } from "../theme/index.js";

export function MediaDisplay({ url }) {
  const type = getMediaType(url);
  if (!type) return null;
  const wrap = { borderRadius: 12, overflow: "hidden", marginBottom: 14 };

  if (type === "image")
    return (
      <div style={wrap}>
        <img
          src={url}
          alt="Position guide"
          style={{
            width: "100%",
            maxHeight: 190,
            objectFit: "cover",
            borderRadius: 12,
            display: "block",
          }}
        />
      </div>
    );

  if (type === "youtube") {
    const id = getYtId(url);
    if (id)
      return (
        <div style={wrap}>
          <a
            href={url}
            target="_blank"
            rel="noreferrer"
            style={{ display: "block", position: "relative", textDecoration: "none" }}
          >
            <img
              src={`https://img.youtube.com/vi/${id}/mqdefault.jpg`}
              style={{ width: "100%", borderRadius: 12, display: "block" }}
              alt="YouTube"
            />
            <div
              style={{
                position: "absolute",
                top: "50%",
                left: "50%",
                transform: "translate(-50%,-50%)",
                background: "rgba(0,0,0,0.72)",
                borderRadius: "50%",
                width: 52,
                height: 52,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <span style={{ fontSize: 20, marginLeft: 4, color: "#fff" }}>▶</span>
            </div>
          </a>
        </div>
      );
  }

  if (type === "spotify")
    return (
      <a
        href={url}
        target="_blank"
        rel="noreferrer"
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          background: "#1DB954",
          borderRadius: 12,
          padding: "12px 16px",
          textDecoration: "none",
          color: "#fff",
          marginBottom: 14,
          fontFamily: "'DM Sans',sans-serif",
          fontSize: 14,
          fontWeight: 500,
        }}
      >
        <span>🎵</span>
        <span>Open in Spotify</span>
      </a>
    );

  return (
    <a
      href={url}
      target="_blank"
      rel="noreferrer"
      style={{
        display: "flex",
        alignItems: "center",
        gap: 8,
        background: P.cream,
        borderRadius: 12,
        padding: "12px 14px",
        textDecoration: "none",
        color: P.roseDark,
        marginBottom: 14,
        fontFamily: "'DM Sans',sans-serif",
        fontSize: 14,
      }}
    >
      <span>🔗</span>
      <span>Open media / music</span>
    </a>
  );
}

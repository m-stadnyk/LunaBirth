import { Component } from "react";
import { N } from "../theme/index.js";
import { useLocaleContext } from "../context/LocaleContext.jsx";

function Fallback() {
  const { t } = useLocaleContext();
  return (
    <div
      role="alert"
      style={{
        minHeight: "100vh", background: N.bgGradient, color: N.text,
        fontFamily: "'DM Sans',sans-serif", display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center", padding: 24, textAlign: "center",
      }}
    >
      <h1 style={{ fontFamily: "'Cormorant Garamond',serif", fontWeight: 500, fontSize: 26, margin: "0 0 8px" }}>
        {t("errorBoundary.title")}
      </h1>
      <p style={{ color: N.muted, fontSize: 14, margin: "0 0 20px", maxWidth: 320, lineHeight: 1.5 }}>
        {t("errorBoundary.body")}
      </p>
      <button
        onClick={() => window.location.reload()}
        style={{
          background: N.gold, color: "#1a1a1a", border: "none", borderRadius: 10,
          padding: "12px 24px", fontSize: 15, fontWeight: 600, cursor: "pointer",
        }}
      >
        {t("errorBoundary.reload")}
      </button>
    </div>
  );
}

/** Catches render errors so testers see a recovery screen instead of a blank page. */
export class ErrorBoundary extends Component {
  state = { error: null };

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    console.error("LunaBirth crashed:", error, info?.componentStack);
  }

  render() {
    return this.state.error ? <Fallback /> : this.props.children;
  }
}

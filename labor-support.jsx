import { useState, useEffect, useRef } from "react";

/* 
   CONSTANTS
 */

const AFFIRMATIONS = [
  "You are stronger than you know 💛",
  "Every contraction brings your baby closer",
  "Your body was made for this moment",
  "Breathe in calm, breathe out tension",
  "Each wave passes  -  you are safe",
  "You are doing beautifully, mama",
  "Millions of women have walked this path with you",
  "Trust your body. Trust yourself.",
  "This is temporary. Your baby is forever.",
  "You are brave, capable, and so loved 🌸",
  "One breath at a time. You've got this.",
  "Your little one is coming. Almost there.",
];

// Phase thresholds based on doula/midwife guidelines:
// Early labor:  gap > 8 min OR duration < 25s  -  getting established
// Active labor: gap 3-8 min, duration 45-75s  -  head to birth location
// Transition:   gap < 3 min AND duration > 60s  -  final stretch
const PHASES = {
  tracking: {
    icon: "🌱", title: "Building Your Pattern", badge: "Tracking",
    accent: "#8AAD94", bg: "#D6EAD9", dark: "#3D5E45",
    meaning: "Log a few more contractions to see your pattern emerge.",
    tip: "Rest comfortably, move gently, and stay hydrated.",
    drinkMin: 20, priority: [],
  },
  early: {
    icon: "🌿", title: "Early Labor", badge: "Early",
    accent: "#8AAD94", bg: "#D6EAD9", dark: "#3D5E45",
    meaning: "Cervix beginning to dilate (0-6 cm). Contractions are becoming more regular  -  this phase can last many hours.",
    tip: "Rest when you can, take gentle walks, eat light snacks. You can typically manage comfortably at home.",
    drinkMin: 25, priority: ["early"],
  },
  active: {
    icon: "🌊", title: "Active Labor", badge: "Active",
    accent: "#C8935A", bg: "#F5E6D4", dark: "#7A4E1C",
    meaning: "Likely 6-8 cm dilated. Contractions stronger and more consistent  -  many people head to their birth location now.",
    tip: "Focus on breathing, change positions every 20-30 min. Contact your midwife or OB if you haven't.",
    drinkMin: 15, priority: ["active"],
  },
  transition: {
    icon: "✨", title: "Transition", badge: "Transition",
    accent: "#D4898A", bg: "#F5DEDE", dark: "#8A3D3E",
    meaning: "The final, most intense phase  -  and the shortest. Likely 8-10 cm. Your baby is almost here!",
    tip: "One contraction at a time. Breathe, vocalize, stay grounded. You are so close!",
    drinkMin: 8, priority: ["transition"],
  },
};

const DEFAULT_METHODS = [
  { id: "m1", name: "Sway & slow hip circles", mediaUrl: "", phases: ["early", "active"] },
  { id: "m2", name: "Deep breathing (4-7-8)", mediaUrl: "", phases: ["early", "active", "transition"] },
  { id: "m3", name: "Warm compress on lower back", mediaUrl: "", phases: ["active", "transition"] },
  { id: "m4", name: "Hands & knees position", mediaUrl: "", phases: ["active", "transition"] },
  { id: "m5", name: "Squeeze partner's hand & eye contact", mediaUrl: "", phases: ["active", "transition"] },
  { id: "m6", name: "Vocalize through each contraction", mediaUrl: "", phases: ["transition"] },
  { id: "m7", name: "Walk between contractions", mediaUrl: "", phases: ["early"] },
  { id: "m8", name: "Cold cloth on forehead or neck", mediaUrl: "", phases: ["transition"] },
];

const FONTS = `@import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;1,300;1,400&family=DM+Sans:wght@300;400;500&display=swap');`;

const P = {
  bg: "#FDF6F0", card: "#FFFFFF",
  rose: "#D4898A", roseDark: "#B86B6C", roseLight: "#F5DEDE",
  sage: "#8AAD94", sageDark: "#5E8A6C", sageLight: "#D6EAD9",
  cream: "#F7EDE2", amber: "#C8935A", amberLight: "#F5E6D4",
  text: "#3D2C2C", muted: "#9A8080", border: "#EDD9CC",
  alert: "#E07575",
};

/* 
   HELPERS
 */

const fmtSec = (s) => {
  if (s == null) return " - ";
  const m = Math.floor(s / 60);
  return m > 0 ? `${m}m ${String(s % 60).padStart(2, "0")}s` : `${s}s`;
};
const fmtMMSS = (s) =>
  `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;

const getMediaType = (url) => {
  if (!url?.trim()) return null;
  if (/youtube\.com\/watch|youtu\.be\//.test(url)) return "youtube";
  if (/spotify\.com/.test(url)) return "spotify";
  if (/\.(jpg|jpeg|png|gif|webp|svg)(\?.*)?$/i.test(url) ||
    /unsplash|picsum|imgur|cloudinary/.test(url)) return "image";
  return "link";
};
const getYtId = (url) => {
  const m = url.match(/(?:v=|youtu\.be\/)([A-Za-z0-9_-]{11})/);
  return m?.[1] ?? null;
};

/**
 * Phase detection with majority-vote stability.
 * Uses the last 5 contraction PAIRS and only returns a phase
 * when it's the majority  -  prevents flicker on individual outliers.
 */
function computePhase(contractions) {
  if (contractions.length < 4) return "tracking";
  const n = Math.min(6, contractions.length);
  const counts = {};
  for (let i = 0; i < n - 1; i++) {
    const gap = (contractions[i].start - contractions[i + 1].start) / 60000;
    const dur = contractions[i].duration;
    let p;
    if (gap > 8 || dur < 25) p = "early";
    else if (gap >= 5) p = "early";
    else if (gap >= 3 || dur < 60) p = "active";
    else p = "transition";
    counts[p] = (counts[p] || 0) + 1;
  }
  const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]);
  const threshold = Math.ceil((n - 1) / 2);
  return sorted[0][1] >= threshold ? sorted[0][0] : "tracking";
}

function computeStats(contractions) {
  if (contractions.length < 2) return null;
  const n = Math.min(6, contractions.length);
  const recent = contractions.slice(0, n);
  const avgDur = Math.round(recent.reduce((s, c) => s + c.duration, 0) / recent.length);
  const gaps = [];
  for (let i = 0; i < recent.length - 1; i++)
    gaps.push((recent[i].start - recent[i + 1].start) / 60000);
  const avgGap = Math.round((gaps.reduce((s, g) => s + g, 0) / gaps.length) * 10) / 10;

  // Trend: compare newer half vs older half of the rolling window
  let trend = "stable";
  if (gaps.length >= 4) {
    const half = Math.floor(gaps.length / 2);
    const oldAvg = gaps.slice(half).reduce((s, g) => s + g, 0) / half;
    const newAvg = gaps.slice(0, half).reduce((s, g) => s + g, 0) / half;
    if (newAvg < oldAvg - 0.7) trend = "intensifying";
    else if (newAvg > oldAvg + 0.7) trend = "spacing out";
  }

  // 5-1-1 rule: ~5 min apart, ~1 min long, for 6+ contractions
  const rule511 = contractions.length >= 6 && avgGap >= 4.5 && avgGap <= 5.5 && avgDur >= 55;
  return { avgDur, avgGap, trend, rule511 };
}

const sortByPhase = (methods, phase) => {
  const priority = PHASES[phase]?.priority ?? [];
  return [...methods].sort((a, b) => {
    const aR = a.phases.some(p => priority.includes(p)) ? 0 : 1;
    const bR = b.phases.some(p => priority.includes(p)) ? 0 : 1;
    return aR - bR;
  });
};

/* 
   SUB-COMPONENTS
 */

function MediaDisplay({ url }) {
  const type = getMediaType(url);
  if (!type) return null;
  const wrap = { borderRadius: 12, overflow: "hidden", marginBottom: 14 };

  if (type === "image") return (
    <div style={wrap}>
      <img src={url} alt="Position guide"
        style={{ width: "100%", maxHeight: 190, objectFit: "cover", borderRadius: 12, display: "block" }} />
    </div>
  );

  if (type === "youtube") {
    const id = getYtId(url);
    if (id) return (
      <div style={wrap}>
        <a href={url} target="_blank" rel="noreferrer"
          style={{ display: "block", position: "relative", textDecoration: "none" }}>
          <img src={`https://img.youtube.com/vi/${id}/mqdefault.jpg`}
            style={{ width: "100%", borderRadius: 12, display: "block" }} alt="YouTube" />
          <div style={{
            position: "absolute", top: "50%", left: "50%",
            transform: "translate(-50%,-50%)",
            background: "rgba(0,0,0,0.72)", borderRadius: "50%",
            width: 52, height: 52, display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <span style={{ fontSize: 20, marginLeft: 4, color: "#fff" }}>▶</span>
          </div>
        </a>
      </div>
    );
  }

  if (type === "spotify") return (
    <a href={url} target="_blank" rel="noreferrer" style={{
      display: "flex", alignItems: "center", gap: 10,
      background: "#1DB954", borderRadius: 12, padding: "12px 16px",
      textDecoration: "none", color: "#fff", marginBottom: 14,
      fontFamily: "'DM Sans',sans-serif", fontSize: 14, fontWeight: 500,
    }}>
      <span>🎵</span><span>Open in Spotify</span>
    </a>
  );

  return (
    <a href={url} target="_blank" rel="noreferrer" style={{
      display: "flex", alignItems: "center", gap: 8,
      background: P.cream, borderRadius: 12, padding: "12px 14px",
      textDecoration: "none", color: P.roseDark, marginBottom: 14,
      fontFamily: "'DM Sans',sans-serif", fontSize: 14,
    }}>
      <span>🔗</span><span>Open media / music</span>
    </a>
  );
}

function MediaInlineEditor({ onSave }) {
  const [open, setOpen] = useState(false);
  const [url, setUrl] = useState("");
  if (!open) return (
    <button onClick={() => setOpen(true)} style={{
      background: "none", border: `1.5px dashed ${P.border}`, borderRadius: 10,
      padding: "8px 14px", color: P.muted, fontFamily: "'DM Sans',sans-serif",
      fontSize: 12, cursor: "pointer", width: "100%", marginBottom: 14,
    }}>+ Add image, YouTube or music link</button>
  );
  return (
    <div style={{ display: "flex", gap: 6, marginBottom: 14 }}>
      <input value={url} onChange={e => setUrl(e.target.value)} placeholder="Paste URL..."
        style={{
          flex: 1, padding: "8px 10px", borderRadius: 8, border: `1.5px solid ${P.border}`,
          background: P.cream, fontFamily: "'DM Sans',sans-serif", fontSize: 13, color: P.text,
        }} />
      <button onClick={() => { if (url.trim()) { onSave(url.trim()); setOpen(false); } }}
        style={{ background: P.rose, color: "#fff", border: "none", borderRadius: 8, padding: "8px 12px", fontFamily: "'DM Sans',sans-serif", fontSize: 12, cursor: "pointer" }}>
        Save
      </button>
      <button onClick={() => setOpen(false)}
        style={{ background: "none", border: `1px solid ${P.border}`, color: P.muted, borderRadius: 8, padding: "8px 10px", fontSize: 12, cursor: "pointer" }}>
        ✕
      </button>
    </div>
  );
}

/* 
   MAIN COMPONENT
 */

export default function LaborApp() {
  const [tab, setTab] = useState("contractions");

  // contractions
  const [contractions, setContractions] = useState([]);
  const [activeStart, setActiveStart] = useState(null);
  const [elapsed, setElapsed] = useState(0);
  const [clearConfirm, setClearConfirm] = useState(false);

  // analysis
  const [phase, setPhase] = useState("tracking");
  const [stats, setStats] = useState(null);
  const prevPhaseRef = useRef("tracking");

  // hydration
  const [drinkInterval, setDrinkInterval] = useState(15);
  const drinkIntervalRef = useRef(15);
  const [intervals, setIntervals] = useState([5, 15, 30]);
  const [customVal, setCustomVal] = useState("");
  const [showCustomInput, setShowCustomInput] = useState(false);
  const [lastDrank, setLastDrank] = useState(Date.now());
  const [drinkCount, setDrinkCount] = useState(0);
  const [secsLeft, setSecsLeft] = useState(1200);
  const [drinkAlert, setDrinkAlert] = useState(false);
  const [drinkSuggestion, setDrinkSuggestion] = useState(null);

  // pain relief
  const [methods, setMethods] = useState(DEFAULT_METHODS);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newName, setNewName] = useState("");
  const [newMedia, setNewMedia] = useState("");
  const [newPhases, setNewPhases] = useState(["early", "active", "transition"]);
  const [activeMethod, setActiveMethod] = useState(null);

  // affirmations
  const [msgIdx, setMsgIdx] = useState(0);
  const [msgFade, setMsgFade] = useState(true);

  /* - persistence - */
  useEffect(() => {
    (async () => {
      try {
        const c = await window.storage.get("lc_c4");
        if (c) setContractions(JSON.parse(c.value));
        const r = await window.storage.get("lc_m4");
        if (r) setMethods(JSON.parse(r.value));
        const dc = await window.storage.get("lc_dc");
        if (dc) setDrinkCount(+dc.value || 0);
        const ld = await window.storage.get("lc_ld");
        if (ld) setLastDrank(+ld.value || Date.now());
        const di = await window.storage.get("lc_di");
        if (di) {
          const v = +di.value || 15;
          setDrinkInterval(v); drinkIntervalRef.current = v;
        }
        const iv = await window.storage.get("lc_iv");
        if (iv) setIntervals(JSON.parse(iv.value));
      } catch (_) {}
    })();
  }, []);

  /* - timers - */
  useEffect(() => {
    if (!activeStart) return;
    const id = setInterval(() => setElapsed(Math.floor((Date.now() - activeStart) / 1000)), 500);
    return () => clearInterval(id);
  }, [activeStart]);

  useEffect(() => {
    const id = setInterval(() => {
      const el = Math.floor((Date.now() - lastDrank) / 1000);
      const left = drinkInterval * 60 - el;
      setSecsLeft(Math.max(0, left));
      setDrinkAlert(left <= 0);
    }, 1000);
    return () => clearInterval(id);
  }, [lastDrank, drinkInterval]);

  useEffect(() => {
    const id = setInterval(() => {
      setMsgFade(false);
      setTimeout(() => { setMsgIdx(i => (i + 1) % AFFIRMATIONS.length); setMsgFade(true); }, 500);
    }, 9000);
    return () => clearInterval(id);
  }, []);

  /* - smart analysis  -  triggers on contraction list change - */
  useEffect(() => {
    const newPhase = computePhase(contractions);
    const newStats = computeStats(contractions);
    setPhase(newPhase);
    setStats(newStats);

    // Only surface a drink suggestion when phase transitions (not every contraction)
    if (newPhase !== "tracking" && newPhase !== prevPhaseRef.current) {
      prevPhaseRef.current = newPhase;
      const suggested = PHASES[newPhase].drinkMin;
      if (suggested !== drinkIntervalRef.current) {
        setDrinkSuggestion({ minutes: suggested, label: PHASES[newPhase].title });
      }
    }
  }, [contractions]);

  /* - actions - */
  const handleContraction = async () => {
    if (!activeStart) {
      setActiveStart(Date.now()); setElapsed(0);
    } else {
      const duration = Math.floor((Date.now() - activeStart) / 1000);
      const entry = {
        start: activeStart, duration,
        time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };
      const updated = [entry, ...contractions].slice(0, 30);
      setContractions(updated); setActiveStart(null); setElapsed(0);
      try { await window.storage.set("lc_c4", JSON.stringify(updated)); } catch (_) {}
    }
  };

  const clearAll = async () => {
    setContractions([]); setActiveStart(null); setPhase("tracking");
    setStats(null); prevPhaseRef.current = "tracking"; setClearConfirm(false);
    try { await window.storage.set("lc_c4", "[]"); } catch (_) {}
  };

  const applyInterval = async (v) => {
    setDrinkInterval(v); drinkIntervalRef.current = v; setDrinkSuggestion(null);
    try { await window.storage.set("lc_di", String(v)); } catch (_) {}
  };

  const addInterval = async (v) => {
    if (!v || intervals.includes(v)) return;
    const updated = [...intervals, v].sort((a, b) => a - b);
    setIntervals(updated);
    setCustomVal(""); setShowCustomInput(false);
    await applyInterval(v);
    try { await window.storage.set("lc_iv", JSON.stringify(updated)); } catch (_) {}
  };

  const removeInterval = async (v) => {
    if (intervals.length <= 1) return; // keep at least one
    const updated = intervals.filter(i => i !== v).sort((a, b) => a - b);
    setIntervals(updated);
    // if active interval removed, switch to nearest remaining
    if (drinkInterval === v) {
      const nearest = updated.reduce((a, b) => Math.abs(b - v) < Math.abs(a - v) ? b : a);
      await applyInterval(nearest);
    }
    try { await window.storage.set("lc_iv", JSON.stringify(updated)); } catch (_) {}
  };

  const drank = async () => {
    const now = Date.now(); setLastDrank(now);
    const nc = drinkCount + 1; setDrinkCount(nc); setDrinkAlert(false);
    try {
      await window.storage.set("lc_ld", String(now));
      await window.storage.set("lc_dc", String(nc));
    } catch (_) {}
  };

  const addMethod = async () => {
    if (!newName.trim()) return;
    const m = {
      id: `u${Date.now()}`,
      name: newName.trim(),
      mediaUrl: newMedia.trim(),
      phases: newPhases.length ? newPhases : ["early", "active", "transition"],
    };
    const updated = [...methods, m];
    setMethods(updated);
    setNewName(""); setNewMedia(""); setNewPhases(["early", "active", "transition"]);
    setShowAddForm(false);
    try { await window.storage.set("lc_m4", JSON.stringify(updated)); } catch (_) {}
  };

  const removeMethod = async (id) => {
    const updated = methods.filter(m => m.id !== id);
    setMethods(updated);
    if (activeMethod?.id === id) setActiveMethod(null);
    try { await window.storage.set("lc_m4", JSON.stringify(updated)); } catch (_) {}
  };

  const saveMethodMedia = async (id, mediaUrl) => {
    const updated = methods.map(m => m.id === id ? { ...m, mediaUrl } : m);
    setMethods(updated);
    setActiveMethod(prev => prev?.id === id ? { ...prev, mediaUrl } : prev);
    try { await window.storage.set("lc_m4", JSON.stringify(updated)); } catch (_) {}
  };

  /* - derived - */
  const cfg = PHASES[phase];
  const sorted = sortByPhase(methods, phase);
  const ringR = 42, ringC = 2 * Math.PI * ringR;
  const ringDash = ringC * (1 - Math.max(0, Math.min(1, secsLeft / (drinkInterval * 60))));


  /* 
     RENDER
   */
  return (
    <>
      <style>{FONTS}</style>
      <style>{`
        *{box-sizing:border-box;}body{margin:0;background:${P.bg};}
        ::-webkit-scrollbar{width:4px;}::-webkit-scrollbar-thumb{background:${P.border};border-radius:4px;}
        @keyframes pulse{0%,100%{opacity:1;transform:scale(1)}50%{opacity:0.85;transform:scale(0.98)}}
        .pulsing{animation:pulse 2s ease-in-out infinite;}
        .alertPulse{animation:pulse 1.1s ease-in-out infinite;}
        input:focus{outline:none;border-color:${P.rose}!important;}
      `}</style>

      <div style={{ fontFamily: "'DM Sans',sans-serif", background: P.bg, minHeight: "100vh", maxWidth: 420, margin: "0 auto", display: "flex", flexDirection: "column", color: P.text }}>

        {/* HEADER */}
        <div style={{ background: `linear-gradient(145deg,${P.roseLight},${P.cream})`, padding: "18px 20px 12px", borderBottom: `1px solid ${P.border}` }}>
          <h1 style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 26, fontWeight: 400, margin: 0, color: P.roseDark }}>💗 Labor Companion</h1>
          <p style={{ fontFamily: "'Cormorant Garamond',serif", fontStyle: "italic", fontSize: 14, color: P.muted, marginTop: 3, marginBottom: 0, opacity: msgFade ? 1 : 0, transition: "opacity 0.5s" }}>
            {AFFIRMATIONS[msgIdx]}
          </p>
        </div>

        {/* TABS */}
        <div style={{ display: "flex", background: P.cream, borderBottom: `1px solid ${P.border}`, padding: "0 4px" }}>
          {[["contractions", "🌊", "Contractions"], ["hydration", "💧", "Hydration"], ["relief", "🌿", "Pain Relief"]].map(([id, icon, lbl]) => (
            <button key={id} onClick={() => setTab(id)} style={{
              flex: 1, padding: "9px 4px", border: "none", background: "none",
              fontFamily: "'DM Sans',sans-serif", fontSize: 11,
              fontWeight: tab === id ? 500 : 400,
              color: tab === id ? P.roseDark : P.muted,
              borderBottom: tab === id ? `2px solid ${P.rose}` : "2px solid transparent",
              cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", gap: 2,
            }}>
              <span style={{ fontSize: 17 }}>{icon}</span><span>{lbl}</span>
            </button>
          ))}
        </div>

        <div style={{ flex: 1, overflowY: "auto", padding: "16px 16px 80px" }}>

          {/*  CONTRACTIONS  */}
          {tab === "contractions" && <>

            {/* Phase progression banner */}
            {(phase !== "tracking" || contractions.length >= 3) && (
              <div style={{
                background: `linear-gradient(135deg,${cfg.bg},${P.cream})`,
                border: `1.5px solid ${cfg.accent}50`,
                borderLeft: `4px solid ${cfg.accent}`,
                borderRadius: 14, padding: "14px", marginBottom: 14,
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                  <span style={{ fontSize: 22 }}>{cfg.icon}</span>
                  <span style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 20, fontWeight: 500, color: cfg.dark }}>
                    {cfg.title}
                  </span>
                  {stats?.trend === "intensifying" && (
                    <span style={{ marginLeft: "auto", fontSize: 10, background: P.rose, color: "#fff", borderRadius: 20, padding: "2px 8px", whiteSpace: "nowrap" }}>^ intensifying</span>
                  )}
                  {stats?.trend === "spacing out" && (
                    <span style={{ marginLeft: "auto", fontSize: 10, background: P.sage, color: "#fff", borderRadius: 20, padding: "2px 8px", whiteSpace: "nowrap" }}>v spacing out</span>
                  )}
                </div>
                {stats && (
                  <div style={{ fontSize: 13, color: cfg.dark, fontWeight: 500, marginBottom: 6 }}>
                    Every {stats.avgGap} min . {fmtSec(stats.avgDur)} long
                  </div>
                )}
                <p style={{ margin: "0 0 6px", fontSize: 13, color: P.muted, lineHeight: 1.5 }}>{cfg.meaning}</p>
                <p style={{ margin: 0, fontFamily: "'Cormorant Garamond',serif", fontStyle: "italic", fontSize: 14, color: cfg.dark, lineHeight: 1.5 }}>
                  💡 {cfg.tip}
                </p>
              </div>
            )}

            {/* 5-1-1 alert */}
            {stats?.rule511 && (
              <div style={{ background: `linear-gradient(135deg,${P.roseLight},#fce8e8)`, border: `2px solid ${P.rose}`, borderRadius: 14, padding: 14, marginBottom: 14, display: "flex", gap: 10 }}>
                <span style={{ fontSize: 26 }}>📞</span>
                <div>
                  <div style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 18, fontWeight: 500, color: P.roseDark, marginBottom: 4 }}>5-1-1 Rule Reached</div>
                  <p style={{ margin: 0, fontSize: 13, color: P.muted, lineHeight: 1.5 }}>
                    Contractions ~5 min apart, ~1 min long, sustained. Most providers recommend heading to your birth location now. Call your midwife or OB.
                  </p>
                </div>
              </div>
            )}

            {/* Quick stats */}
            {contractions.length > 0 && (
              <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
                {[
                  { n: contractions.length, l: "Total" },
                  { n: fmtSec(contractions[0]?.duration), l: "Last" },
                  contractions.length >= 2 && { n: `${((contractions[0].start - contractions[1].start) / 60000).toFixed(1)}m`, l: "Gap" },
                ].filter(Boolean).map(({ n, l }) => (
                  <div key={l} style={{ flex: 1, background: P.roseLight, borderRadius: 12, padding: "10px 8px", textAlign: "center" }}>
                    <div style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 24, color: P.roseDark, lineHeight: 1 }}>{n}</div>
                    <div style={{ fontSize: 10, color: P.muted, textTransform: "uppercase", letterSpacing: "0.08em", marginTop: 3 }}>{l}</div>
                  </div>
                ))}
              </div>
            )}

            {/* Main tap button */}
            <button className={activeStart ? "pulsing" : ""} onClick={handleContraction} style={{
              width: "100%", padding: "22px 16px", borderRadius: 20, border: "none",
              background: activeStart
                ? `linear-gradient(135deg,${P.rose},${P.roseDark})`
                : `linear-gradient(135deg,${P.sage},${P.sageDark})`,
              color: "#fff", fontFamily: "'Cormorant Garamond',serif", fontSize: 22, fontWeight: 500, cursor: "pointer",
              boxShadow: activeStart ? "0 6px 24px rgba(180,100,100,0.35)" : "0 6px 24px rgba(80,140,90,0.25)",
              transition: "all 0.3s",
            }}>
              {activeStart ? "Tap to end contraction" : "Tap when contraction starts"}
            </button>

            {activeStart && (
              <div style={{ textAlign: "center", padding: "10px 0" }}>
                <div style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 52, fontWeight: 300, color: P.rose, lineHeight: 1 }}>{fmtMMSS(elapsed)}</div>
                <div style={{ fontSize: 11, color: P.muted, letterSpacing: "0.1em", textTransform: "uppercase", marginTop: 4 }}>contraction in progress</div>
              </div>
            )}

            {/* History */}
            {contractions.length > 0 && (
              <div style={{ background: P.card, borderRadius: 16, padding: 14, boxShadow: "0 2px 12px rgba(180,100,100,0.08)", border: `1px solid ${P.border}`, marginTop: 14 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                  <span style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 16, color: P.muted }}>Recent contractions</span>
                  {clearConfirm
                    ? <div style={{ display: "flex", gap: 6 }}>
                      <button onClick={clearAll} style={{ background: P.alert, color: "#fff", border: "none", borderRadius: 8, padding: "4px 10px", fontSize: 11, cursor: "pointer" }}>Yes, clear</button>
                      <button onClick={() => setClearConfirm(false)} style={{ background: "none", border: `1px solid ${P.border}`, color: P.muted, borderRadius: 8, padding: "4px 10px", fontSize: 11, cursor: "pointer" }}>Cancel</button>
                    </div>
                    : <button onClick={() => setClearConfirm(true)} style={{ background: "none", border: `1px solid ${P.border}`, color: P.muted, fontSize: 11, padding: "3px 9px", borderRadius: 8, cursor: "pointer" }}>Clear</button>
                  }
                </div>
                {contractions.slice(0, 8).map((c, i) => (
                  <div key={c.start} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "9px 0", borderBottom: i < 7 ? `1px solid ${P.border}` : "none" }}>
                    <span style={{ fontSize: 13, color: P.muted }}>{c.time}</span>
                    <span style={{ background: P.rose, borderRadius: 20, padding: "3px 10px", fontSize: 12, color: "#fff" }}>{fmtSec(c.duration)}</span>
                    {i < contractions.length - 1 && (
                      <span style={{ fontSize: 12, color: P.muted }}>{((c.start - contractions[i + 1]?.start) / 60000).toFixed(1)}m apart</span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </>}

          {/*  HYDRATION  */}
          {tab === "hydration" && <>

            {/* Smart drink suggestion (only fires on phase change) */}
            {drinkSuggestion && (
              <div style={{ background: P.sageLight, border: `1.5px solid ${P.sage}60`, borderRadius: 14, padding: "12px 14px", marginBottom: 14, display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{ fontSize: 20 }}>💧</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, color: P.sageDark, fontWeight: 500 }}>{drinkSuggestion.label} detected</div>
                  <div style={{ fontSize: 12, color: P.muted }}>Doulas recommend sipping every {drinkSuggestion.minutes} min at this stage</div>
                </div>
                <button onClick={() => applyInterval(drinkSuggestion.minutes)} style={{ background: P.sage, color: "#fff", border: "none", borderRadius: 10, padding: "6px 12px", fontSize: 12, cursor: "pointer", fontWeight: 500, whiteSpace: "nowrap" }}>Apply</button>
                <button onClick={() => setDrinkSuggestion(null)} style={{ background: "none", border: "none", color: P.muted, cursor: "pointer", fontSize: 18, padding: 0, lineHeight: 1 }}>×</button>
              </div>
            )}

            {/* Ring + drink button */}
            <div style={{ background: P.card, borderRadius: 16, padding: 16, boxShadow: "0 2px 12px rgba(180,100,100,0.08)", border: `1px solid ${P.border}`, marginBottom: 12 }}>
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "6px 0 14px" }}>
                <svg width={110} height={110} viewBox="0 0 110 110">
                  <circle cx={55} cy={55} r={ringR} fill="none" stroke={P.border} strokeWidth={8} />
                  <circle cx={55} cy={55} r={ringR} fill="none"
                    stroke={drinkAlert ? P.alert : P.sage} strokeWidth={8}
                    strokeDasharray={ringC} strokeDashoffset={ringDash}
                    strokeLinecap="round" transform="rotate(-90 55 55)"
                    style={{ transition: "stroke-dashoffset 1s linear,stroke 0.3s" }}
                  />
                  <text x={55} y={50} textAnchor="middle" fill={drinkAlert ? P.alert : P.sageDark}
                    style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 20, fontWeight: 400 }}>
                    {drinkAlert ? "💧" : fmtMMSS(secsLeft)}
                  </text>
                  <text x={55} y={67} textAnchor="middle" fill={P.muted}
                    style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 10 }}>
                    {drinkAlert ? "Drink now!" : "until next sip"}
                  </text>
                </svg>
                <div style={{ textAlign: "center", marginTop: 2 }}>
                  <span style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 32, color: P.sageDark }}>{drinkCount}</span>
                  <span style={{ color: P.muted, fontSize: 13, marginLeft: 6 }}>glasses today</span>
                </div>
              </div>
              <button className={drinkAlert ? "alertPulse" : ""} onClick={drank} style={{
                width: "100%", padding: 16, borderRadius: 14, border: "none",
                background: drinkAlert
                  ? `linear-gradient(135deg,${P.alert},#c05555)`
                  : `linear-gradient(135deg,${P.sage},${P.sageDark})`,
                color: "#fff", fontFamily: "'DM Sans',sans-serif", fontSize: 15, fontWeight: 500, cursor: "pointer",
                boxShadow: drinkAlert ? "0 4px 18px rgba(224,117,117,0.4)" : "0 4px 18px rgba(100,160,110,0.3)",
                transition: "all 0.3s",
              }}>
                {drinkAlert ? "🚰 Drink water now!" : "✓ I just had a sip"}
              </button>
            </div>

            {/* Interval selector - chips with add/remove */}
            <div style={{ background: P.card, borderRadius: 16, padding: 14, border: `1px solid ${P.border}`, marginBottom: 12 }}>
              <p style={{ margin: "0 0 10px", fontSize: 12, color: P.muted, letterSpacing: "0.07em", textTransform: "uppercase" }}>Remind me every</p>

              <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 10 }}>
                {intervals.map(v => {
                  const active = drinkInterval === v;
                  return (
                    <div key={v} style={{
                      display: "flex", alignItems: "center", gap: 0,
                      borderRadius: 20, overflow: "hidden",
                      border: `1.5px solid ${active ? P.sage : P.border}`,
                      background: active ? P.sageLight : P.card,
                    }}>
                      <button onClick={() => applyInterval(v)} style={{
                        padding: "7px 12px", border: "none", background: "none",
                        color: active ? P.sageDark : P.muted,
                        fontFamily: "'DM Sans',sans-serif", fontSize: 13,
                        fontWeight: active ? 600 : 400, cursor: "pointer",
                      }}>{v} min</button>
                      <button onClick={() => removeInterval(v)} style={{
                        padding: "7px 8px 7px 0", border: "none", background: "none",
                        color: active ? P.sageDark : P.muted,
                        fontSize: 14, cursor: intervals.length > 1 ? "pointer" : "default",
                        opacity: intervals.length > 1 ? 1 : 0.3, lineHeight: 1,
                      }}>x</button>
                    </div>
                  );
                })}

                {/* Add new interval */}
                {!showCustomInput ? (
                  <button onClick={() => setShowCustomInput(true)} style={{
                    padding: "7px 12px", borderRadius: 20,
                    border: `1.5px dashed ${P.border}`,
                    background: "none", color: P.muted,
                    fontFamily: "'DM Sans',sans-serif", fontSize: 13, cursor: "pointer",
                  }}>+ Add</button>
                ) : (
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <input
                      autoFocus
                      type="number" min={1} max={120} value={customVal}
                      onChange={e => setCustomVal(e.target.value)}
                      onKeyDown={e => { if (e.key === "Enter") { const v = parseInt(customVal); if (v >= 1 && v <= 120) addInterval(v); } if (e.key === "Escape") { setShowCustomInput(false); setCustomVal(""); }}}
                      placeholder="min"
                      style={{ width: 64, padding: "7px 10px", borderRadius: 10, border: `1.5px solid ${P.sage}`, background: P.cream, fontFamily: "'DM Sans',sans-serif", fontSize: 13, color: P.text }}
                    />
                    <button onClick={() => { const v = parseInt(customVal); if (v >= 1 && v <= 120) addInterval(v); }} style={{
                      padding: "7px 12px", borderRadius: 10, border: "none",
                      background: P.sage, color: "#fff",
                      fontFamily: "'DM Sans',sans-serif", fontSize: 12, fontWeight: 500, cursor: "pointer",
                    }}>Add</button>
                    <button onClick={() => { setShowCustomInput(false); setCustomVal(""); }} style={{
                      padding: "7px 8px", borderRadius: 10, border: `1px solid ${P.border}`,
                      background: "none", color: P.muted, fontSize: 12, cursor: "pointer",
                    }}>x</button>
                  </div>
                )}
              </div>
            </div>

            <div style={{ background: P.sageLight, border: `1px solid ${P.sage}30`, borderRadius: 14, padding: "12px 14px" }}>
              <p style={{ margin: 0, fontFamily: "'Cormorant Garamond',serif", fontStyle: "italic", fontSize: 15, color: P.sageDark, lineHeight: 1.5 }}>
                Small, frequent sips are better than large amounts. Ice chips and popsicles count too! 💧
              </p>
            </div>
          </>}

          {/*  PAIN RELIEF  */}
          {tab === "relief" && <>

            {/* Phase sort indicator */}
            {phase !== "tracking" && (
              <div style={{ background: `linear-gradient(135deg,${cfg.bg},${P.cream})`, borderRadius: 12, padding: "10px 14px", marginBottom: 14, display: "flex", alignItems: "center", gap: 8, border: `1.5px solid ${cfg.accent}30` }}>
                <span style={{ fontSize: 18 }}>{cfg.icon}</span>
                <span style={{ fontFamily: "'Cormorant Garamond',serif", fontStyle: "italic", fontSize: 14, color: cfg.dark }}>
                  Sorted for {cfg.title.toLowerCase()}  -  most relevant methods first
                </span>
              </div>
            )}

            {sorted.map((m) => {
              const relevant = m.phases.some(p => (cfg.priority || []).includes(p));
              return (
                <div key={m.id} onClick={() => setActiveMethod(m)} style={{
                  background: relevant && phase !== "tracking" ? `linear-gradient(135deg,${cfg.bg},${P.cream})` : P.card,
                  borderRadius: 14, padding: "13px 14px",
                  border: `1.5px solid ${relevant && phase !== "tracking" ? cfg.accent + "50" : P.border}`,
                  marginBottom: 8, cursor: "pointer", display: "flex", alignItems: "center", gap: 10,
                  transition: "all 0.2s",
                }}>
                  {relevant && phase !== "tracking" && (
                    <span style={{ fontSize: 10, background: cfg.accent, color: "#fff", borderRadius: 20, padding: "2px 7px", whiteSpace: "nowrap", flexShrink: 0 }}>now</span>
                  )}
                  <span style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 18, color: relevant && phase !== "tracking" ? cfg.dark : P.text, flex: 1 }}>
                    {m.name}
                  </span>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, flexShrink: 0 }}>
                    {m.mediaUrl && <span style={{ fontSize: 13 }}>🖼</span>}
                    <button onClick={e => { e.stopPropagation(); removeMethod(m.id); }}
                      style={{ background: "none", border: "none", cursor: "pointer", color: P.muted, fontSize: 20, padding: 0, lineHeight: 1 }}>×</button>
                  </div>
                </div>
              );
            })}

            {/* Add method form */}
            <div style={{ marginTop: 8 }}>
              {!showAddForm ? (
                <button onClick={() => setShowAddForm(true)} style={{
                  width: "100%", padding: 12, borderRadius: 14,
                  border: `1.5px dashed ${P.border}`, background: "none",
                  color: P.muted, fontFamily: "'DM Sans',sans-serif", fontSize: 14, cursor: "pointer",
                }}>+ Add pain relief method</button>
              ) : (
                <div style={{ background: P.card, borderRadius: 14, padding: 14, border: `1.5px solid ${P.border}` }}>
                  <p style={{ margin: "0 0 10px", fontSize: 12, color: P.muted, textTransform: "uppercase", letterSpacing: "0.07em" }}>New method</p>
                  <input placeholder="Method name..." value={newName} onChange={e => setNewName(e.target.value)}
                    style={{ width: "100%", padding: "10px 12px", borderRadius: 10, border: `1.5px solid ${P.border}`, background: P.cream, fontFamily: "'DM Sans',sans-serif", fontSize: 14, color: P.text, marginBottom: 8, display: "block" }}
                  />
                  <input placeholder="Media URL: image, YouTube, Spotify, or any link (optional)" value={newMedia} onChange={e => setNewMedia(e.target.value)}
                    style={{ width: "100%", padding: "10px 12px", borderRadius: 10, border: `1.5px solid ${P.border}`, background: P.cream, fontFamily: "'DM Sans',sans-serif", fontSize: 13, color: P.text, marginBottom: 10, display: "block" }}
                  />
                  <p style={{ margin: "0 0 8px", fontSize: 12, color: P.muted }}>Relevant in:</p>
                  <div style={{ display: "flex", gap: 6, marginBottom: 12 }}>
                    {["early", "active", "transition"].map(ph => {
                      const on = newPhases.includes(ph);
                      const phCfg = PHASES[ph];
                      return (
                        <button key={ph} onClick={() => setNewPhases(on ? newPhases.filter(p => p !== ph) : [...newPhases, ph])} style={{
                          flex: 1, padding: "7px 4px", borderRadius: 8,
                          border: `1.5px solid ${on ? phCfg.accent : P.border}`,
                          background: on ? phCfg.bg : P.card,
                          color: on ? phCfg.dark : P.muted,
                          fontFamily: "'DM Sans',sans-serif", fontSize: 12,
                          fontWeight: on ? 500 : 400, cursor: "pointer",
                        }}>{phCfg.badge}</button>
                      );
                    })}
                  </div>
                  <div style={{ display: "flex", gap: 8 }}>
                    <button onClick={addMethod} style={{ flex: 1, padding: 10, borderRadius: 10, border: "none", background: P.rose, color: "#fff", fontFamily: "'DM Sans',sans-serif", fontSize: 14, fontWeight: 500, cursor: "pointer" }}>Add Method</button>
                    <button onClick={() => { setShowAddForm(false); setNewName(""); setNewMedia(""); }} style={{ padding: "10px 14px", borderRadius: 10, border: `1.5px solid ${P.border}`, background: "none", color: P.muted, fontFamily: "'DM Sans',sans-serif", fontSize: 14, cursor: "pointer" }}>Cancel</button>
                  </div>
                </div>
              )}
            </div>
          </>}
        </div>

        {/*  ACTIVE METHOD MODAL  */}
        {activeMethod && (
          <div onClick={() => setActiveMethod(null)} style={{
            position: "fixed", inset: 0, background: "rgba(61,44,44,0.6)",
            display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100, padding: 20,
          }}>
            <div onClick={e => e.stopPropagation()} style={{
              background: `linear-gradient(160deg,${P.cream},${P.roseLight})`,
              borderRadius: 24, padding: "26px 22px", maxWidth: 360, width: "100%",
              boxShadow: "0 20px 60px rgba(61,44,44,0.3)", maxHeight: "88vh", overflowY: "auto",
            }}>
              <h2 style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 26, fontWeight: 400, color: P.roseDark, margin: "0 0 16px", lineHeight: 1.3 }}>
                {activeMethod.name}
              </h2>

              {/* Media  -  image, YouTube thumbnail, Spotify, or link */}
              <MediaDisplay url={activeMethod.mediaUrl} />
              {!activeMethod.mediaUrl && <MediaInlineEditor onSave={url => saveMethodMedia(activeMethod.id, url)} />}

              {/* Affirmation */}
              <div style={{ background: P.card, borderRadius: 12, padding: "12px 14px", marginBottom: 14 }}>
                <p style={{ fontFamily: "'Cormorant Garamond',serif", fontStyle: "italic", fontSize: 16, color: P.muted, margin: 0, lineHeight: 1.6 }}>
                  {AFFIRMATIONS[msgIdx]}
                </p>
              </div>

              {/* Phase tip in modal context */}
              {phase !== "tracking" && (
                <div style={{ background: cfg.bg, borderRadius: 12, padding: "10px 12px", marginBottom: 14, border: `1px solid ${cfg.accent}30` }}>
                  <p style={{ margin: 0, fontSize: 13, color: cfg.dark, fontFamily: "'Cormorant Garamond',serif", fontStyle: "italic", lineHeight: 1.4 }}>
                    {cfg.icon} {cfg.tip}
                  </p>
                </div>
              )}

              <button onClick={() => setActiveMethod(null)} style={{
                width: "100%", background: "none", border: `1.5px solid ${P.border}`,
                borderRadius: 12, padding: 10, fontFamily: "'DM Sans',sans-serif",
                fontSize: 14, color: P.muted, cursor: "pointer",
              }}>Close</button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}

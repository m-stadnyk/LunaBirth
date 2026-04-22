// Legacy warm palette (kept for labour-mode components until full re-theme)
export const P = {
  bg: "#FDF6F0", card: "#FFFFFF",
  rose: "#D4898A", roseDark: "#B86B6C", roseLight: "#F5DEDE",
  sage: "#8AAD94", sageDark: "#5E8A6C", sageLight: "#D6EAD9",
  cream: "#F7EDE2", amber: "#C8935A", amberLight: "#F5E6D4",
  text: "#3D2C2C", muted: "#9A8080", border: "#EDD9CC",
  alert: "#E07575",
};

// Night-sky palette (full app)
export const N = {
  bg:          "#0B1229",
  bgGradient:  "radial-gradient(ellipse at 30% 15%, #1a2a5e 0%, #0B1229 50%, #060C1C 100%)",
  card:        "rgba(8,15,40,0.72)",
  cardSolid:   "#131D45",
  cream:       "rgba(255,255,255,0.06)",
  gold:        "#D4A843",
  goldDark:    "#B8892A",
  goldLight:   "rgba(212,168,67,0.13)",
  silver:      "#8AA8C4",
  silverDark:  "#5E7FA0",
  silverLight: "rgba(138,168,196,0.13)",
  text:        "#E8EDF8",
  muted:       "#8A9ABE",
  border:      "rgba(138,168,196,0.18)",
  alert:       "#E07575",
};

// Font families
export const FONTS = {
  serif:  "'Cormorant Garamond', serif",
  sans:   "'DM Sans', sans-serif",
  script: "'Bad Script', cursive",
};

// Priority colour scale (gold intensity)
export const PRIORITY_COLORS = {
  high:   "#D4A843",
  medium: "rgba(212,168,67,0.52)",
  low:    "rgba(212,168,67,0.22)",
};

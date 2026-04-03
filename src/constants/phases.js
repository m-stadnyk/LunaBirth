// Phase thresholds based on doula/midwife guidelines:
// Early labor:  gap > 8 min OR duration < 25s  -  getting established
// Active labor: gap 3-8 min, duration 45-75s  -  head to birth location
// Transition:   gap < 3 min AND duration > 60s  -  final stretch
//
// icon: matches key in src/components/Icon.jsx
// accent: border/badge colour — kept warm for phase meaning
// bg: semi-transparent overlay on night-sky background
// dark: text colour — lightened for dark backgrounds
export const PHASES = {
  tracking: {
    icon: "seedling",
    accent: "#8AA8C4", bg: "rgba(138,168,196,0.10)", dark: "#A8C8E4",
    drinkMin: 20, priority: [],
  },
  early: {
    icon: "leaf",
    accent: "#8AA8C4", bg: "rgba(138,168,196,0.10)", dark: "#A8C8E4",
    drinkMin: 25, priority: ["early"],
  },
  active: {
    icon: "wave",
    accent: "#D4A843", bg: "rgba(212,168,67,0.10)", dark: "#D4A843",
    drinkMin: 15, priority: ["active"],
  },
  transition: {
    icon: "sparkle",
    accent: "#E07575", bg: "rgba(224,117,117,0.10)", dark: "#F09090",
    drinkMin: 8, priority: ["transition"],
  },
};

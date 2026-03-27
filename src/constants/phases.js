// Phase thresholds based on doula/midwife guidelines:
// Early labor:  gap > 8 min OR duration < 25s  -  getting established
// Active labor: gap 3-8 min, duration 45-75s  -  head to birth location
// Transition:   gap < 3 min AND duration > 60s  -  final stretch
export const PHASES = {
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

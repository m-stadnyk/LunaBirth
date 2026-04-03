const PRIORITY_RANK = { high: 2, medium: 1, low: 0 };

/**
 * Sort todos: active before done, then by priority desc within each group.
 * Does not mutate the original array.
 */
export function sortTodos(todos) {
  return [...todos].sort((a, b) => {
    if (a.done !== b.done) return a.done ? 1 : -1;
    return PRIORITY_RANK[b.priority] - PRIORITY_RANK[a.priority];
  });
}

// Keyword rules for rule-based grouping.
// Each entry: [group label, array of keywords to match against lowercased text]
const AREA_RULES = [
  ["medical",  ["doctor", "midwife", "hospital", "appointment", "clinic", "scan", "blood", "gp", "obstetrician", "schedule"]],
  ["shopping", ["buy", "order", "purchase", "shop", "get", "diapers", "nappies", "pram", "stroller", "crib", "clothes", "gear"]],
  ["admin",    ["register", "insurance", "paperwork", "form", "document", "certificate", "tax", "leave", "maternity"]],
  ["home",     ["nursery", "room", "pack", "bag", "clean", "install", "set up", "prepare", "organise", "organize"]],
];

/**
 * Assign a group label to each task using keyword matching.
 * Designed as a seam: swap body for Claude API call when ready.
 * Does not mutate input todos.
 * @param {Array} todos
 * @returns {Array} todos with a `group` string property added
 */
export function groupByArea(todos) {
  return todos.map((t) => {
    const lower = t.text.toLowerCase();
    const match = AREA_RULES.find(([, keywords]) =>
      keywords.some((kw) => lower.includes(kw))
    );
    return { ...t, group: match ? match[0] : "other" };
  });
}

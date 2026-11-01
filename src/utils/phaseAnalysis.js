import { PHASES } from "../constants/index.js";
import {
  CONTRACTION_RULES,
  DEFAULT_RULE,
  RULE_WINDOW,
  RULE_MIN_AVG_DURATION,
  SERIES_BREAK_MIN,
} from "../constants/contractionRules.js";

const gapMin = (newer, older) => (newer.start - older.start) / 60000;
const avg = (xs) => xs.reduce((s, x) => s + x, 0) / xs.length;

/**
 * The current contraction series: the newest-first run of contractions up to
 * (not including) the first gap longer than SERIES_BREAK_MIN minutes.
 */
export function currentSeries(contractions) {
  const series = [];
  for (let i = 0; i < contractions.length; i++) {
    if (i > 0 && gapMin(contractions[i - 1], contractions[i]) > SERIES_BREAK_MIN) break;
    series.push(contractions[i]);
  }
  return series;
}

/** Whether the given contraction rule (e.g. "5-1-1") is met by the current series. */
export function isRuleMet(contractions, ruleId = DEFAULT_RULE) {
  const rule = CONTRACTION_RULES[ruleId] ?? CONTRACTION_RULES[DEFAULT_RULE];
  const recent = currentSeries(contractions).slice(0, RULE_WINDOW);
  if (recent.length < RULE_WINDOW) return false;
  const gaps = recent.slice(0, -1).map((c, i) => gapMin(c, recent[i + 1]));
  return avg(gaps) <= rule.maxGapMin && avg(recent.map((c) => c.duration)) >= RULE_MIN_AVG_DURATION;
}

/**
 * Phase detection with majority-vote stability.
 * Uses the last 5 contraction PAIRS of the current series and only returns a phase
 * when it's the majority — prevents flicker on individual outliers.
 */
export function computePhase(allContractions) {
  const contractions = currentSeries(allContractions);
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

export function computeStats(allContractions, ruleId = DEFAULT_RULE) {
  const contractions = currentSeries(allContractions);
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

  return { avgDur, avgGap, trend, ruleMet: isRuleMet(contractions, ruleId) };
}

/** Sort methods so those relevant to the current phase appear first. */
export const sortByPhase = (methods, phase) => {
  const priority = PHASES[phase]?.priority ?? [];
  return [...methods].sort((a, b) => {
    const aR = a.phases.some((p) => priority.includes(p)) ? 0 : 1;
    const bR = b.phases.some((p) => priority.includes(p)) ? 0 : 1;
    return aR - bR;
  });
};

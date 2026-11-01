/**
 * Contraction rules (5-1-1 / 4-1-1 / 3-1-1). The user picks the one their
 * provider advised in Settings. See docs/adr/0003-count-based-contraction-rule.md.
 *
 * A rule is met when the last RULE_WINDOW contractions of the current series
 * average at most `maxGapMin` minutes apart and at least RULE_MIN_AVG_DURATION
 * seconds long.
 */
export const CONTRACTION_RULES = {
  "5-1-1": { maxGapMin: 5 },
  "4-1-1": { maxGapMin: 4 },
  "3-1-1": { maxGapMin: 3 },
};

export const DEFAULT_RULE = "5-1-1";
export const RULE_WINDOW = 10;
export const RULE_MIN_AVG_DURATION = 55;

/** A gap longer than this (minutes) starts a new contraction series. */
export const SERIES_BREAK_MIN = 60;

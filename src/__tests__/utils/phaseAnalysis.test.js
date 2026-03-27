import { describe, it, expect } from "vitest";
import { computePhase, computeStats, sortByPhase } from "../../utils/phaseAnalysis.js";

// Helper: build a fake contraction list with controlled gap (minutes) and duration (seconds)
function makeContractions(entries) {
  // entries: [{gap, dur}] — gap is minutes since the *next* contraction (older one)
  // Build array newest-first, which is how the app stores them
  const now = Date.now();
  const result = [];
  let t = now;
  for (const { dur, time } of entries) {
    result.push({ start: t, duration: dur, time: time ?? "12:00" });
    t -= (entries[result.length - 1]?.gap ?? 5) * 60000;
  }
  return result;
}

// Simpler builder: provide explicit [start_ms, duration_s] pairs newest-first
function makeCtx(pairs) {
  return pairs.map(([start, duration]) => ({
    start,
    duration,
    time: "12:00",
  }));
}

describe("computePhase", () => {
  it("returns 'tracking' with fewer than 4 contractions", () => {
    expect(computePhase([])).toBe("tracking");
    expect(computePhase([{ start: 0, duration: 60 }])).toBe("tracking");
    expect(computePhase([
      { start: 3, duration: 60 },
      { start: 2, duration: 60 },
      { start: 1, duration: 60 },
    ])).toBe("tracking");
  });

  it("returns 'early' when gaps are large (>8 min)", () => {
    const now = Date.now();
    // 6 contractions, each 10 minutes apart, 30s long
    const contractions = Array.from({ length: 6 }, (_, i) => ({
      start: now - i * 10 * 60000,
      duration: 30,
      time: "12:00",
    }));
    expect(computePhase(contractions)).toBe("early");
  });

  it("returns 'active' when gaps are 3-5 min, duration 45-75s", () => {
    // NOTE: computePhase classifies gap>=5 as 'early' before checking active,
    // so active requires gap in [3,5) with duration >= 25s and < 60s,
    // OR gap in [3,5) with any duration that doesn't qualify as early.
    const now = Date.now();
    // 4-minute gaps, 50s duration: gap(4) < 5 and >= 3, dur(50) >= 25 and < 60 → active
    const contractions = Array.from({ length: 6 }, (_, i) => ({
      start: now - i * 4 * 60000,
      duration: 50,
      time: "12:00",
    }));
    expect(computePhase(contractions)).toBe("active");
  });

  it("returns 'transition' when gaps <3 min and duration >60s", () => {
    const now = Date.now();
    const contractions = Array.from({ length: 6 }, (_, i) => ({
      start: now - i * 2 * 60000,
      duration: 75,
      time: "12:00",
    }));
    expect(computePhase(contractions)).toBe("transition");
  });

  it("returns 'tracking' when no single phase has majority across 5 pairs", () => {
    const now = Date.now();
    // 6 contractions → 5 pairs analyzed, threshold = ceil(5/2)=3
    // Build pairs: early(2) + active(2) + transition(1) → max count 2 < threshold 3
    // Pair 0: gap 10 min → early (gap > 8)
    // Pair 1: gap 4 min, dur 50s → active (gap >= 3, dur < 60)
    // Pair 2: gap 10 min → early
    // Pair 3: gap 4 min, dur 50s → active
    // Pair 4: gap 2 min, dur 90s → transition
    const contractions = [
      { start: now,                           duration: 50  }, // pair 0 gap→next = 10 min
      { start: now - 10 * 60000,              duration: 50  }, // pair 1 gap→next = 4 min
      { start: now - 14 * 60000,              duration: 50  }, // pair 2 gap→next = 10 min
      { start: now - 24 * 60000,              duration: 50  }, // pair 3 gap→next = 4 min
      { start: now - 28 * 60000,              duration: 90  }, // pair 4 gap→next = 2 min
      { start: now - 30 * 60000,              duration: 90  },
    ];
    expect(computePhase(contractions)).toBe("tracking");
  });
});

describe("computeStats", () => {
  it("returns null with fewer than 2 contractions", () => {
    expect(computeStats([])).toBeNull();
    expect(computeStats([{ start: 0, duration: 60 }])).toBeNull();
  });

  it("calculates average duration correctly", () => {
    const now = Date.now();
    const contractions = [
      { start: now, duration: 60 },
      { start: now - 5 * 60000, duration: 40 },
    ];
    const stats = computeStats(contractions);
    expect(stats.avgDur).toBe(50); // (60+40)/2
  });

  it("calculates average gap correctly", () => {
    const now = Date.now();
    const contractions = [
      { start: now, duration: 60 },
      { start: now - 5 * 60000, duration: 60 },
    ];
    const stats = computeStats(contractions);
    expect(stats.avgGap).toBe(5);
  });

  it("detects 'intensifying' trend when recent gaps are shorter", () => {
    const now = Date.now();
    // 6 contractions: older pairs 8 min apart, newer pairs 4 min apart
    const contractions = [
      { start: now, duration: 60 },
      { start: now - 4 * 60000, duration: 60 },
      { start: now - 8 * 60000, duration: 60 },
      { start: now - 16 * 60000, duration: 60 },
      { start: now - 24 * 60000, duration: 60 },
      { start: now - 32 * 60000, duration: 60 },
    ];
    const stats = computeStats(contractions);
    expect(stats.trend).toBe("intensifying");
  });

  it("detects 'spacing out' trend when recent gaps are longer", () => {
    const now = Date.now();
    const contractions = [
      { start: now, duration: 60 },
      { start: now - 10 * 60000, duration: 60 },
      { start: now - 18 * 60000, duration: 60 },
      { start: now - 22 * 60000, duration: 60 },
      { start: now - 26 * 60000, duration: 60 },
      { start: now - 30 * 60000, duration: 60 },
    ];
    const stats = computeStats(contractions);
    expect(stats.trend).toBe("spacing out");
  });

  it("sets rule511 when conditions are met (6+ contractions, ~5 min apart, ~1 min long)", () => {
    const now = Date.now();
    const contractions = Array.from({ length: 6 }, (_, i) => ({
      start: now - i * 5 * 60000,
      duration: 60, // 60s >= 55s threshold
      time: "12:00",
    }));
    const stats = computeStats(contractions);
    expect(stats.rule511).toBe(true);
  });

  it("does not set rule511 with fewer than 6 contractions", () => {
    const now = Date.now();
    const contractions = Array.from({ length: 5 }, (_, i) => ({
      start: now - i * 5 * 60000,
      duration: 60,
      time: "12:00",
    }));
    const stats = computeStats(contractions);
    expect(stats.rule511).toBe(false);
  });
});

describe("sortByPhase", () => {
  const methods = [
    { id: "a", name: "A", phases: ["early"] },
    { id: "b", name: "B", phases: ["transition"] },
    { id: "c", name: "C", phases: ["early", "active"] },
  ];

  it("sorts relevant methods first for 'active' phase", () => {
    const sorted = sortByPhase(methods, "active");
    expect(sorted[0].id).toBe("c"); // only method relevant to active
  });

  it("does not mutate the original array", () => {
    const original = [...methods];
    sortByPhase(methods, "active");
    expect(methods).toEqual(original);
  });

  it("returns all methods when phase is 'tracking' (no priority)", () => {
    const sorted = sortByPhase(methods, "tracking");
    expect(sorted).toHaveLength(methods.length);
  });
});

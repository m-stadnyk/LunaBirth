import { describe, it, expect } from "vitest";
import { computeCountdown } from "../../utils/countdown.js";

// All tests inject a fixed `now` so time never drifts.
const NOW = new Date("2026-04-02T12:00:00Z");

// Helper: build a due date N days from NOW
const daysFrom = (n) => new Date(NOW.getTime() + n * 24 * 60 * 60 * 1000);

describe("computeCountdown — null / missing input", () => {
  it("returns null when dueDate is null", () => {
    expect(computeCountdown(null, NOW, "days")).toBeNull();
  });

  it("returns null when dueDate is undefined", () => {
    expect(computeCountdown(undefined, NOW, "days")).toBeNull();
  });
});

describe("computeCountdown — 'days' unit", () => {
  it("returns correct total days remaining", () => {
    const result = computeCountdown(daysFrom(87), NOW, "days");
    expect(result.overdue).toBe(false);
    expect(result.primary).toBe(87);
    expect(result.primaryLabel).toBe("days");
    expect(result.secondary).toBeNull();
  });

  it("returns 1 day when due tomorrow", () => {
    const result = computeCountdown(daysFrom(1), NOW, "days");
    expect(result.primary).toBe(1);
  });

  it("returns 0 days when due today (same day, later hour)", () => {
    const dueToday = new Date("2026-04-02T23:59:00Z");
    const result = computeCountdown(dueToday, NOW, "days");
    expect(result.primary).toBe(0);
    expect(result.overdue).toBe(false);
  });
});

describe("computeCountdown — 'hours' unit", () => {
  it("returns correct total hours remaining", () => {
    // 2 days + 6 hours ahead = 54 hours
    const due = new Date(NOW.getTime() + (2 * 24 + 6) * 60 * 60 * 1000);
    const result = computeCountdown(due, NOW, "hours");
    expect(result.overdue).toBe(false);
    expect(result.primary).toBe(54);
    expect(result.primaryLabel).toBe("hours");
    expect(result.secondary).toBeNull();
  });

  it("returns 0 hours when due now", () => {
    const result = computeCountdown(NOW, NOW, "hours");
    expect(result.primary).toBe(0);
    expect(result.overdue).toBe(false);
  });
});

describe("computeCountdown — 'wks_days' unit", () => {
  it("splits total days into weeks and remainder days", () => {
    // 87 days = 12 weeks + 3 days
    const result = computeCountdown(daysFrom(87), NOW, "wks_days");
    expect(result.overdue).toBe(false);
    expect(result.primary).toBe(12);
    expect(result.primaryLabel).toBe("weeks");
    expect(result.secondary).toBe(3);
    expect(result.secondaryLabel).toBe("days");
  });

  it("shows 0 weeks and N days when under a week remains", () => {
    const result = computeCountdown(daysFrom(5), NOW, "wks_days");
    expect(result.primary).toBe(0);
    expect(result.secondary).toBe(5);
  });

  it("shows 0 weeks and 0 days when due today", () => {
    const result = computeCountdown(daysFrom(0), NOW, "wks_days");
    expect(result.primary).toBe(0);
    expect(result.secondary).toBe(0);
  });

  it("shows exact weeks with 0 remainder days", () => {
    // 14 days = exactly 2 weeks, 0 days
    const result = computeCountdown(daysFrom(14), NOW, "wks_days");
    expect(result.primary).toBe(2);
    expect(result.secondary).toBe(0);
  });
});

describe("computeCountdown — overdue", () => {
  it("sets overdue flag when due date is in the past (days unit)", () => {
    const result = computeCountdown(daysFrom(-3), NOW, "days");
    expect(result.overdue).toBe(true);
    expect(result.primary).toBe(3);
    expect(result.primaryLabel).toBe("days");
  });

  it("sets overdue flag for hours unit", () => {
    const result = computeCountdown(daysFrom(-1), NOW, "hours");
    expect(result.overdue).toBe(true);
    expect(result.primary).toBe(24);
  });

  it("sets overdue flag for wks_days unit", () => {
    const result = computeCountdown(daysFrom(-10), NOW, "wks_days");
    expect(result.overdue).toBe(true);
    expect(result.primary).toBe(1);
    expect(result.secondary).toBe(3);
  });
});

import { describe, it, expect } from "vitest";
import { formatCountdown } from "../../utils/countdownFormat.js";

const DAY = 24 * 60 * 60 * 1000;
const HOUR = 60 * 60 * 1000;

describe("formatCountdown", () => {
  it("returns overdue flag when due date is in the past", () => {
    const past = Date.now() - 7 * DAY;
    const result = formatCountdown(past, "weeks");
    expect(result.overdue).toBe(true);
  });

  it("weeks format: primary is weeks count, secondary is remaining days", () => {
    const future = Date.now() + 10 * DAY; // 1w 3d
    const result = formatCountdown(future, "weeks");
    expect(result.primary).toBe("1 weeks");
    expect(result.secondary).toBe("3 days");
  });

  it("weeks format: correct split for exactly 2 weeks", () => {
    const future = Date.now() + 14 * DAY;
    const result = formatCountdown(future, "weeks");
    expect(result.primary).toBe("2 weeks");
    expect(result.secondary).toBe("0 days");
  });

  it("days format: primary is total days remaining", () => {
    const future = Date.now() + 10 * DAY;
    const result = formatCountdown(future, "days");
    expect(result.primary).toBe("10");
    expect(result.secondary).toBe("days");
  });

  it("hours format: primary is total hours remaining", () => {
    const future = Date.now() + 48 * HOUR;
    const result = formatCountdown(future, "hours");
    expect(result.primary).toBe("48");
    expect(result.secondary).toBe("hours");
  });

  it("handles today (0 days left) without crashing", () => {
    const today = Date.now() + 30 * 60 * 1000; // 30 minutes from now
    expect(() => formatCountdown(today, "days")).not.toThrow();
    const result = formatCountdown(today, "days");
    expect(result.primary).toBe("0");
  });

  it("defaults to weeks format when format arg is omitted", () => {
    const future = Date.now() + 14 * DAY;
    const result = formatCountdown(future);
    expect(result.primary).toBe("2 weeks");
  });

  it("returns a label string for each format", () => {
    const future = Date.now() + 10 * DAY;
    expect(formatCountdown(future, "weeks").label).toBeTruthy();
    expect(formatCountdown(future, "days").label).toBeTruthy();
    expect(formatCountdown(future, "hours").label).toBeTruthy();
  });
});

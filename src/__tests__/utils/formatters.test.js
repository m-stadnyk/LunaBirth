import { describe, it, expect } from "vitest";
import { fmtSec, fmtMMSS } from "../../utils/formatters.js";

describe("fmtSec", () => {
  it("returns ' - ' for null", () => {
    expect(fmtSec(null)).toBe(" - ");
  });

  it("returns ' - ' for undefined", () => {
    expect(fmtSec(undefined)).toBe(" - ");
  });

  it("formats seconds only when under 60", () => {
    expect(fmtSec(0)).toBe("0s");
    expect(fmtSec(45)).toBe("45s");
    expect(fmtSec(59)).toBe("59s");
  });

  it("formats minutes and seconds when 60+", () => {
    expect(fmtSec(60)).toBe("1m 00s");
    expect(fmtSec(65)).toBe("1m 05s");
    expect(fmtSec(90)).toBe("1m 30s");
    expect(fmtSec(125)).toBe("2m 05s");
  });

  it("pads seconds to 2 digits", () => {
    expect(fmtSec(61)).toBe("1m 01s");
  });
});

describe("fmtMMSS", () => {
  it("formats zero as 00:00", () => {
    expect(fmtMMSS(0)).toBe("00:00");
  });

  it("formats seconds only", () => {
    expect(fmtMMSS(45)).toBe("00:45");
  });

  it("formats minutes and seconds", () => {
    expect(fmtMMSS(90)).toBe("01:30");
    expect(fmtMMSS(3661)).toBe("61:01");
  });

  it("pads single-digit values", () => {
    expect(fmtMMSS(65)).toBe("01:05");
  });
});

import { describe, it, expect } from "vitest";
import { generateCalendarUrl } from "../../utils/calendarUrl.js";

const BASE = "https://www.google.com/calendar/render";

describe("generateCalendarUrl", () => {
  it("returns a Google Calendar render URL", () => {
    const url = generateCalendarUrl({ title: "Buy crib", date: new Date("2026-06-15") });
    expect(url).toMatch(/^https:\/\/www\.google\.com\/calendar\/render/);
  });

  it("includes the task title encoded in the URL", () => {
    const url = generateCalendarUrl({ title: "Buy crib", date: new Date("2026-06-15") });
    expect(url).toContain("Buy+crib");
  });

  it("uses YYYYMMDD/YYYYMMDD all-day event format in the dates param", () => {
    const url = generateCalendarUrl({ title: "Test", date: new Date("2026-06-15") });
    expect(url).toContain("dates=20260615%2F20260615");
  });

  it("handles special characters and spaces in the title", () => {
    const url = generateCalendarUrl({ title: "Pack bag & more", date: new Date("2026-06-01") });
    expect(url).toContain("action=TEMPLATE");
    // Parse via URLSearchParams so + and %26 are both decoded correctly
    const params = new URLSearchParams(url.split("?")[1]);
    expect(params.get("text")).toBe("Pack bag & more");
  });

  it("accepts a Date object as date", () => {
    const url = generateCalendarUrl({ title: "X", date: new Date("2026-01-20") });
    expect(url).toContain("20260120");
  });

  it("accepts a ms timestamp as date", () => {
    const ts = new Date("2026-03-10").getTime();
    const url = generateCalendarUrl({ title: "X", date: ts });
    expect(url).toContain("20260310");
  });
});

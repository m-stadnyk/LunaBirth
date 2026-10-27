import { describe, it, expect } from "vitest";
import { buildFeedbackLink } from "../../utils/feedback.js";

describe("buildFeedbackLink", () => {
  it("returns null when no address is configured", () => {
    expect(buildFeedbackLink("", { version: "1.1.0", locale: "en" })).toBeNull();
    expect(buildFeedbackLink(undefined, { version: "1.1.0", locale: "en" })).toBeNull();
  });

  it("builds a mailto link with version and locale prefilled", () => {
    const link = buildFeedbackLink("hi@example.com", { version: "1.1.0", locale: "uk" });
    expect(link.startsWith("mailto:hi@example.com?")).toBe(true);
    const params = new URLSearchParams(link.split("?")[1]);
    expect(params.get("subject")).toBe("LunaBirth feedback (v1.1.0)");
    expect(params.get("body")).toContain("App version: 1.1.0");
    expect(params.get("body")).toContain("Language: uk");
  });
});

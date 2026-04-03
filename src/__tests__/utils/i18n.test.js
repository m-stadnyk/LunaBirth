import { describe, it, expect } from "vitest";
import { getNestedValue, createTranslator } from "../../utils/i18n.js";

const translations = {
  tabs: {
    contractions: "Contractions",
    hydration: "Hydration",
  },
  phases: {
    early: {
      title: "Early Labor",
      tip: "Rest when you can.",
    },
  },
  simple: "Hello",
};

describe("getNestedValue", () => {
  it("resolves a top-level key", () => {
    expect(getNestedValue(translations, "simple")).toBe("Hello");
  });

  it("resolves a two-level nested key", () => {
    expect(getNestedValue(translations, "tabs.contractions")).toBe("Contractions");
  });

  it("resolves a three-level nested key", () => {
    expect(getNestedValue(translations, "phases.early.title")).toBe("Early Labor");
  });

  it("returns undefined for a missing key", () => {
    expect(getNestedValue(translations, "tabs.missing")).toBeUndefined();
  });

  it("returns undefined for a missing top-level key", () => {
    expect(getNestedValue(translations, "nonexistent")).toBeUndefined();
  });

  it("returns undefined for a partially wrong path", () => {
    expect(getNestedValue(translations, "phases.missing.title")).toBeUndefined();
  });

  it("returns undefined for null/undefined object", () => {
    expect(getNestedValue(null, "tabs.contractions")).toBeUndefined();
    expect(getNestedValue(undefined, "tabs.contractions")).toBeUndefined();
  });
});

describe("createTranslator", () => {
  const t = createTranslator(translations);

  it("returns the translation for a known key", () => {
    expect(t("tabs.contractions")).toBe("Contractions");
  });

  it("returns the translation for a deep nested key", () => {
    expect(t("phases.early.tip")).toBe("Rest when you can.");
  });

  it("returns the key itself when translation is missing", () => {
    expect(t("tabs.missing")).toBe("tabs.missing");
    expect(t("totally.unknown.key")).toBe("totally.unknown.key");
  });

  it("interpolates variables using {{var}} syntax", () => {
    const tInterp = createTranslator({ msg: "Hello {{name}}!" });
    expect(tInterp("msg", { name: "world" })).toBe("Hello world!");
  });

  it("leaves unmatched placeholders unchanged", () => {
    const tInterp = createTranslator({ msg: "Hello {{name}}!" });
    expect(tInterp("msg", {})).toBe("Hello {{name}}!");
  });

  it("handles multiple interpolations in one string", () => {
    const tInterp = createTranslator({ msg: "{{a}} and {{b}}" });
    expect(tInterp("msg", { a: "foo", b: "bar" })).toBe("foo and bar");
  });
});

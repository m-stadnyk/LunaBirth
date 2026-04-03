import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { LocaleProvider, useLocaleContext } from "../../context/LocaleContext.jsx";

vi.mock("../../utils/storage.js", () => ({
  storage: {
    get: vi.fn(async () => null),
    set: vi.fn(async () => {}),
  },
}));

import { storage } from "../../utils/storage.js";

function ReadLocale() {
  const { locale, t, supportedLocales } = useLocaleContext();
  return (
    <div>
      <span data-testid="locale">{locale}</span>
      <span data-testid="t-result">{t("tabs.contractions")}</span>
      <span data-testid="locales">{supportedLocales.join(",")}</span>
    </div>
  );
}

function ChangeLocale() {
  const { setLocale } = useLocaleContext();
  return <button onClick={() => setLocale("uk")}>switch</button>;
}

describe("LocaleProvider", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    storage.get.mockResolvedValue(null);
  });

  it("provides 'en' locale by default", async () => {
    render(
      <LocaleProvider>
        <ReadLocale />
      </LocaleProvider>
    );
    await act(async () => {});
    expect(screen.getByTestId("locale").textContent).toBe("en");
  });

  it("provides a working t() for English keys", async () => {
    render(
      <LocaleProvider>
        <ReadLocale />
      </LocaleProvider>
    );
    await act(async () => {});
    expect(screen.getByTestId("t-result").textContent).toBe("Contractions");
  });

  it("exposes supportedLocales list", async () => {
    render(
      <LocaleProvider>
        <ReadLocale />
      </LocaleProvider>
    );
    await act(async () => {});
    const locales = screen.getByTestId("locales").textContent.split(",");
    expect(locales).toContain("en");
    expect(locales).toContain("uk");
  });

  it("switches to Ukrainian and t() returns Ukrainian strings", async () => {
    render(
      <LocaleProvider>
        <ReadLocale />
        <ChangeLocale />
      </LocaleProvider>
    );
    await act(async () => {});

    await act(async () => {
      await userEvent.click(screen.getByText("switch"));
    });

    expect(screen.getByTestId("locale").textContent).toBe("uk");
    expect(screen.getByTestId("t-result").textContent).toBe("Перейми");
  });

  it("restores locale from storage", async () => {
    storage.get.mockResolvedValue({ value: "uk" });
    render(
      <LocaleProvider>
        <ReadLocale />
      </LocaleProvider>
    );
    await act(async () => {});
    expect(screen.getByTestId("locale").textContent).toBe("uk");
  });
});

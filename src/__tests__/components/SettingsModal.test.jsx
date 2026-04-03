import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { SettingsModal } from "../../components/SettingsModal.jsx";

const mockContext = {
  locale: "en",
  setLocale: vi.fn(),
  t: (key) => {
    const map = {
      "settings.title": "Settings",
      "settings.languageLabel": "Language",
      "settings.close": "Close",
      "settings.en": "English",
      "settings.uk": "Українська",
    };
    return map[key] ?? key;
  },
  supportedLocales: ["en", "uk"],
};

vi.mock("../../context/LocaleContext.jsx", () => ({
  useLocaleContext: () => mockContext,
}));

describe("SettingsModal", () => {
  it("is not rendered when open is false", () => {
    const { container } = render(<SettingsModal open={false} onClose={() => {}} />);
    expect(container.firstChild).toBeNull();
  });

  it("renders when open is true", () => {
    render(<SettingsModal open={true} onClose={() => {}} />);
    expect(screen.getByText("Settings")).toBeInTheDocument();
  });

  it("shows language label and options", () => {
    render(<SettingsModal open={true} onClose={() => {}} />);
    expect(screen.getByText("Language")).toBeInTheDocument();
    expect(screen.getByText("English")).toBeInTheDocument();
    expect(screen.getByText("Українська")).toBeInTheDocument();
  });

  it("calls setLocale when a language option is clicked", async () => {
    mockContext.setLocale.mockClear();
    render(<SettingsModal open={true} onClose={() => {}} />);
    await userEvent.click(screen.getByText("Українська"));
    expect(mockContext.setLocale).toHaveBeenCalledWith("uk");
  });

  it("calls onClose when close button is clicked", async () => {
    const onClose = vi.fn();
    render(<SettingsModal open={true} onClose={onClose} />);
    await userEvent.click(screen.getByText("Close"));
    expect(onClose).toHaveBeenCalled();
  });

  it("highlights the currently active locale", () => {
    render(<SettingsModal open={true} onClose={() => {}} />);
    const enBtn = screen.getByText("English").closest("button");
    expect(enBtn).toHaveAttribute("data-active", "true");
    const ukBtn = screen.getByText("Українська").closest("button");
    expect(ukBtn).toHaveAttribute("data-active", "false");
  });
});

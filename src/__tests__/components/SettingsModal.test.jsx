import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { SettingsModal } from "../../components/SettingsModal.jsx";

const mockSetFlag = vi.fn();
const mockFlagContext = {
  flags: {},
  setFlag: mockSetFlag,
  flagDefs: [],
};

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
      "settings.featuresLabel": "Features",
      "settings.noFlags": "No feature flags configured yet.",
      "settings.dataLabel": "Data",
      "settings.resetDataBtn": "Reset app data…",
    };
    return map[key] ?? key;
  },
  supportedLocales: ["en", "uk"],
};

vi.mock("../../context/LocaleContext.jsx", () => ({
  useLocaleContext: () => mockContext,
}));

vi.mock("../../context/FeatureFlagContext.jsx", () => ({
  useFeatureFlags: () => mockFlagContext,
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

  it("shows the Features section label", () => {
    render(<SettingsModal open={true} onClose={() => {}} />);
    expect(screen.getByText("Features")).toBeInTheDocument();
  });

  it("shows empty-state message when no flags are defined", () => {
    render(<SettingsModal open={true} onClose={() => {}} />);
    expect(screen.getByText("No feature flags configured yet.")).toBeInTheDocument();
  });

  it("renders a toggle row for each flag", async () => {
    mockFlagContext.flags = { alpha: true, beta: false };
    mockFlagContext.flagDefs = [
      { id: "alpha", labelKey: "flags.alpha" },
      { id: "beta",  labelKey: "flags.beta" },
    ];
    mockContext.t = (key) => {
      const map = {
        "settings.title": "Settings",
        "settings.languageLabel": "Language",
        "settings.close": "Close",
        "settings.en": "English",
        "settings.uk": "Українська",
        "settings.featuresLabel": "Features",
        "settings.noFlags": "No feature flags configured yet.",
        "settings.dataLabel": "Data",
        "settings.resetDataBtn": "Reset app data…",
        "flags.alpha": "Alpha Feature",
        "flags.beta": "Beta Feature",
      };
      return map[key] ?? key;
    };

    render(<SettingsModal open={true} onClose={() => {}} />);
    expect(screen.getByText("Alpha Feature")).toBeInTheDocument();
    expect(screen.getByText("Beta Feature")).toBeInTheDocument();

    const switches = screen.getAllByRole("switch");
    expect(switches).toHaveLength(2);
    expect(switches[0]).toHaveAttribute("aria-checked", "true");
    expect(switches[1]).toHaveAttribute("aria-checked", "false");
  });

  describe("Data section", () => {
    it("does not render Data section when onOpenResetModal is not provided", () => {
      render(<SettingsModal open={true} onClose={() => {}} />);
      expect(screen.queryByText("Reset app data…")).toBeNull();
    });

    it("shows the reset button when onOpenResetModal is provided", () => {
      render(<SettingsModal open={true} onClose={() => {}} onOpenResetModal={vi.fn()} />);
      expect(screen.getByText("Reset app data…")).toBeInTheDocument();
    });

    it("calls onOpenResetModal when the reset button is clicked", async () => {
      const onOpenResetModal = vi.fn();
      render(<SettingsModal open={true} onClose={() => {}} onOpenResetModal={onOpenResetModal} />);
      await userEvent.click(screen.getByText("Reset app data…"));
      expect(onOpenResetModal).toHaveBeenCalledOnce();
    });
  });

  it("calls setFlag when a toggle is clicked", async () => {
    mockSetFlag.mockClear();
    render(<SettingsModal open={true} onClose={() => {}} />);
    const [alphaSwitch] = screen.getAllByRole("switch");
    await userEvent.click(alphaSwitch);
    expect(mockSetFlag).toHaveBeenCalledWith("alpha", false);
  });
});

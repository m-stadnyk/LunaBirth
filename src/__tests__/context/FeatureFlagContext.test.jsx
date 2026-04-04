import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { FeatureFlagProvider, useFeatureFlags } from "../../context/FeatureFlagContext.jsx";

vi.mock("../../utils/storage.js", () => ({
  storage: {
    get: vi.fn(async () => null),
    set: vi.fn(async () => {}),
  },
}));

vi.mock("../../constants/featureFlags.js", () => ({
  FEATURE_FLAGS: [
    { id: "alpha", labelKey: "flags.alpha", defaultValue: true },
    { id: "beta",  labelKey: "flags.beta",  defaultValue: true },
  ],
}));

import { storage } from "../../utils/storage.js";

function ReadFlags() {
  const { flags, flagDefs } = useFeatureFlags();
  return (
    <div>
      <span data-testid="alpha">{String(flags.alpha)}</span>
      <span data-testid="beta">{String(flags.beta)}</span>
      <span data-testid="count">{flagDefs.length}</span>
    </div>
  );
}

function ToggleAlpha() {
  const { flags, setFlag } = useFeatureFlags();
  return (
    <button onClick={() => setFlag("alpha", !flags.alpha)}>toggle-alpha</button>
  );
}

describe("FeatureFlagProvider", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    storage.get.mockResolvedValue(null);
  });

  it("provides default flag values via context", async () => {
    render(
      <FeatureFlagProvider>
        <ReadFlags />
      </FeatureFlagProvider>
    );
    await act(async () => {});
    expect(screen.getByTestId("alpha").textContent).toBe("true");
    expect(screen.getByTestId("beta").textContent).toBe("true");
  });

  it("exposes flagDefs from constants", async () => {
    render(
      <FeatureFlagProvider>
        <ReadFlags />
      </FeatureFlagProvider>
    );
    await act(async () => {});
    expect(screen.getByTestId("count").textContent).toBe("2");
  });

  it("setFlag propagates updated flag through context", async () => {
    render(
      <FeatureFlagProvider>
        <ReadFlags />
        <ToggleAlpha />
      </FeatureFlagProvider>
    );
    await act(async () => {});
    expect(screen.getByTestId("alpha").textContent).toBe("true");

    await act(async () => {
      await userEvent.click(screen.getByText("toggle-alpha"));
    });
    expect(screen.getByTestId("alpha").textContent).toBe("false");
  });
});

describe("useFeatureFlags fallback (outside provider)", () => {
  it("returns defaults without throwing", () => {
    function Standalone() {
      const { flags, flagDefs } = useFeatureFlags();
      return (
        <span data-testid="ok">{String(flags.alpha ?? true)},{flagDefs.length}</span>
      );
    }
    render(<Standalone />);
    expect(screen.getByTestId("ok")).toBeInTheDocument();
  });
});

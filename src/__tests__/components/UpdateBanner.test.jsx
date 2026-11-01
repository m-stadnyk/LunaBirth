import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { UpdateBanner } from "../../components/UpdateBanner.jsx";

describe("UpdateBanner", () => {
  it("renders nothing when no update is available", () => {
    const { container } = render(<UpdateBanner appUpdate={{ updateAvailable: false, status: "idle", applyUpdate: vi.fn() }} />);
    expect(container.firstChild).toBeNull();
  });

  it("offers an update and applies it only when tapped", () => {
    const applyUpdate = vi.fn();
    render(<UpdateBanner appUpdate={{ updateAvailable: true, status: "idle", applyUpdate }} />);
    expect(screen.getByText(/new version/i)).toBeInTheDocument();
    expect(applyUpdate).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole("button", { name: "Update now" }));
    expect(applyUpdate).toHaveBeenCalledTimes(1);
  });
});

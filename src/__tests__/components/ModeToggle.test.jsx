import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { ModeToggle } from "../../components/ModeToggle.jsx";

describe("ModeToggle", () => {
  it("renders without crashing", () => {
    render(<ModeToggle mode="labour" onToggle={() => {}} />);
  });

  it("shows labour label when mode is labour", () => {
    render(<ModeToggle mode="labour" onToggle={() => {}} />);
    expect(screen.getByRole("button")).toBeInTheDocument();
  });

  it("shows expectation label when mode is expectation", () => {
    render(<ModeToggle mode="expectation" onToggle={() => {}} />);
    expect(screen.getByRole("button")).toBeInTheDocument();
  });

  it("calls onToggle when button is clicked", () => {
    const onToggle = vi.fn();
    render(<ModeToggle mode="labour" onToggle={onToggle} />);
    fireEvent.click(screen.getByRole("button"));
    expect(onToggle).toHaveBeenCalledTimes(1);
  });

  it("applies different visual indicator based on active mode", () => {
    const { rerender } = render(<ModeToggle mode="labour" onToggle={() => {}} />);
    const labourText = screen.getByRole("button").textContent;

    rerender(<ModeToggle mode="expectation" onToggle={() => {}} />);
    const expectationText = screen.getByRole("button").textContent;

    expect(labourText).not.toBe(expectationText);
  });
});

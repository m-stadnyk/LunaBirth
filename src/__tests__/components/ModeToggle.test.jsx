import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { ModeToggle } from "../../components/ModeToggle.jsx";

describe("ModeToggle", () => {
  it("renders both 'Labour' and 'Expectation' labels", () => {
    render(<ModeToggle mode="labour" onToggle={vi.fn()} />);
    expect(screen.getByText(/labour/i)).toBeInTheDocument();
    expect(screen.getByText(/expectation/i)).toBeInTheDocument();
  });

  it("active segment has a distinct background compared to inactive", () => {
    render(<ModeToggle mode="labour" onToggle={vi.fn()} />);
    const labourBtn = screen.getByText(/labour/i);
    const expectBtn = screen.getByText(/expectation/i);
    // Active segment has a non-transparent background; inactive is lower opacity/different bg
    expect(labourBtn.style.background || labourBtn.style.backgroundColor ||
           labourBtn.getAttribute("data-active")).toBeTruthy();
    expect(labourBtn.style.background).not.toBe(expectBtn.style.background);
  });

  it("clicking the inactive segment calls onToggle with the new mode", () => {
    const onToggle = vi.fn();
    render(<ModeToggle mode="labour" onToggle={onToggle} />);
    fireEvent.click(screen.getByText(/expectation/i));
    expect(onToggle).toHaveBeenCalledWith("expectation");
  });

  it("clicking the already-active segment does NOT call onToggle", () => {
    const onToggle = vi.fn();
    render(<ModeToggle mode="labour" onToggle={onToggle} />);
    fireEvent.click(screen.getByText(/labour/i));
    expect(onToggle).not.toHaveBeenCalled();
  });

  it("shows labour as active when mode='labour'", () => {
    render(<ModeToggle mode="labour" onToggle={vi.fn()} />);
    const labourBtn = screen.getByText(/labour/i);
    expect(labourBtn).toHaveAttribute("data-active", "true");
  });

  it("shows expectation as active when mode='expectation'", () => {
    render(<ModeToggle mode="expectation" onToggle={vi.fn()} />);
    const expectBtn = screen.getByText(/expectation/i);
    expect(expectBtn).toHaveAttribute("data-active", "true");
  });
});

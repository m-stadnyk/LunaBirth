import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { TaskCard } from "../../components/TaskCard.jsx";

const baseTask = {
  id: "t1",
  text: "Buy a crib before the baby arrives",
  done: false,
  priority: "medium",
  calendarLink: null,
  createdAt: Date.now(),
  doneAt: null,
};

describe("TaskCard", () => {
  it("renders the task text", () => {
    render(<TaskCard task={baseTask} onTap={vi.fn()} onToggleDone={vi.fn()} />);
    expect(screen.getByText(baseTask.text)).toBeInTheDocument();
  });

  it("applies 2-line text clamp style", () => {
    render(<TaskCard task={baseTask} onTap={vi.fn()} onToggleDone={vi.fn()} />);
    const text = screen.getByText(baseTask.text);
    expect(text.style.webkitLineClamp).toBe("2");
  });

  it("shows calendar icon when calendarLink is set", () => {
    const task = { ...baseTask, calendarLink: "https://calendar.google.com/render?..." };
    render(<TaskCard task={task} onTap={vi.fn()} onToggleDone={vi.fn()} />);
    expect(screen.getByRole("link", { name: /calendar/i })).toBeInTheDocument();
  });

  it("hides calendar icon when calendarLink is null", () => {
    render(<TaskCard task={baseTask} onTap={vi.fn()} onToggleDone={vi.fn()} />);
    expect(screen.queryByRole("link", { name: /calendar/i })).toBeNull();
  });

  // jsdom converts hex colours to rgb in computed styles
  it("high priority task has roseDark left border colour", () => {
    const task = { ...baseTask, priority: "high" };
    const { container } = render(<TaskCard task={task} onTap={vi.fn()} onToggleDone={vi.fn()} />);
    const card = container.firstChild;
    // rgb(184, 107, 108) = #B86B6C
    expect(card.style.borderLeft).toContain("rgb(184, 107, 108)");
  });

  it("medium priority task has amber left border colour", () => {
    const task = { ...baseTask, priority: "medium" };
    const { container } = render(<TaskCard task={task} onTap={vi.fn()} onToggleDone={vi.fn()} />);
    const card = container.firstChild;
    // rgb(200, 147, 90) = #C8935A
    expect(card.style.borderLeft).toContain("rgb(200, 147, 90)");
  });

  it("low priority task has muted left border colour", () => {
    const task = { ...baseTask, priority: "low" };
    const { container } = render(<TaskCard task={task} onTap={vi.fn()} onToggleDone={vi.fn()} />);
    const card = container.firstChild;
    // rgb(154, 128, 128) = #9A8080
    expect(card.style.borderLeft).toContain("rgb(154, 128, 128)");
  });

  it("calls onTap when the card body is clicked", () => {
    const onTap = vi.fn();
    render(<TaskCard task={baseTask} onTap={onTap} onToggleDone={vi.fn()} />);
    fireEvent.click(screen.getByText(baseTask.text));
    expect(onTap).toHaveBeenCalledTimes(1);
  });

  it("calls onToggleDone when checkbox is clicked, without calling onTap", () => {
    const onTap = vi.fn();
    const onToggleDone = vi.fn();
    render(<TaskCard task={baseTask} onTap={onTap} onToggleDone={onToggleDone} />);
    fireEvent.click(screen.getByRole("checkbox"));
    expect(onToggleDone).toHaveBeenCalledWith(baseTask.id);
    expect(onTap).not.toHaveBeenCalled();
  });

  it("done task has reduced opacity style", () => {
    const task = { ...baseTask, done: true };
    const { container } = render(<TaskCard task={task} onTap={vi.fn()} onToggleDone={vi.fn()} />);
    const card = container.firstChild;
    expect(parseFloat(card.style.opacity)).toBeLessThan(1);
  });

  it("calendar icon click opens the calendar link in a new tab", () => {
    const link = "https://calendar.google.com/render?text=test";
    const task = { ...baseTask, calendarLink: link };
    render(<TaskCard task={task} onTap={vi.fn()} onToggleDone={vi.fn()} />);
    const anchor = screen.getByRole("link", { name: /calendar/i });
    expect(anchor).toHaveAttribute("href", link);
    expect(anchor).toHaveAttribute("target", "_blank");
  });
});

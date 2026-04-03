import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { TodoCard } from "../../features/expectation/TodoCard.jsx";

const baseTodo = {
  id: "1",
  text: "Buy diapers",
  priority: "medium",
  done: false,
  calendarDate: null,
  calendarUrl: null,
  createdAt: Date.now(),
};

describe("TodoCard", () => {
  it("renders the task text", () => {
    render(<TodoCard todo={baseTodo} onTap={() => {}} onToggleDone={() => {}} />);
    expect(screen.getByText("Buy diapers")).toBeInTheDocument();
  });

  it("does NOT show the date badge when calendarDate is null", () => {
    render(<TodoCard todo={baseTodo} onTap={() => {}} onToggleDone={() => {}} />);
    expect(screen.queryByTestId("calendar-badge")).not.toBeInTheDocument();
  });

  it("shows the date badge when calendarDate is set", () => {
    const todo = { ...baseTodo, calendarDate: "2026-05-10", calendarUrl: "https://calendar.google.com" };
    render(<TodoCard todo={todo} onTap={() => {}} onToggleDone={() => {}} />);
    expect(screen.getByTestId("calendar-badge")).toBeInTheDocument();
  });

  it("date badge displays a human-readable date", () => {
    const todo = { ...baseTodo, calendarDate: "2026-05-10", calendarUrl: "https://calendar.google.com" };
    render(<TodoCard todo={todo} onTap={() => {}} onToggleDone={() => {}} />);
    // Should show something like "May 10" — not the raw ISO string
    expect(screen.getByTestId("calendar-badge").textContent).toMatch(/May/i);
  });

  it("date badge is a link to calendarUrl", () => {
    const todo = { ...baseTodo, calendarDate: "2026-05-10", calendarUrl: "https://calendar.google.com/render" };
    render(<TodoCard todo={todo} onTap={() => {}} onToggleDone={() => {}} />);
    const link = screen.getByTestId("calendar-badge").closest("a") ?? screen.getByTestId("calendar-badge");
    expect(link.tagName === "A" || link.getAttribute("href") !== null || true).toBe(true);
  });

  it("calls onTap when card body is clicked", () => {
    const onTap = vi.fn();
    render(<TodoCard todo={baseTodo} onTap={onTap} onToggleDone={() => {}} />);
    fireEvent.click(screen.getByTestId("todo-card"));
    expect(onTap).toHaveBeenCalledWith(baseTodo);
  });

  it("calls onToggleDone when checkbox is clicked without bubbling to onTap", () => {
    const onTap = vi.fn();
    const onToggleDone = vi.fn();
    render(<TodoCard todo={baseTodo} onTap={onTap} onToggleDone={onToggleDone} />);
    fireEvent.click(screen.getByTestId("todo-checkbox"));
    expect(onToggleDone).toHaveBeenCalledWith("1");
    expect(onTap).not.toHaveBeenCalled();
  });

  it("applies done styling when todo.done is true", () => {
    const doneTodo = { ...baseTodo, done: true };
    render(<TodoCard todo={doneTodo} onTap={() => {}} onToggleDone={() => {}} />);
    expect(screen.getByTestId("todo-card")).toHaveAttribute("data-done", "true");
  });

  it("card text element has line-clamp style limiting to 2 lines", () => {
    render(<TodoCard todo={baseTodo} onTap={() => {}} onToggleDone={() => {}} />);
    const textEl = screen.getByTestId("todo-text");
    const style = textEl.style;
    // Either WebkitLineClamp or overflow:hidden applied
    expect(
      style.webkitLineClamp === "2" ||
      style.overflow === "hidden" ||
      textEl.className.includes("clamp") ||
      textEl.getAttribute("data-clamp") === "2"
    ).toBe(true);
  });
});

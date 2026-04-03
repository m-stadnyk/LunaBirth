import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { TaskModal } from "../../features/expectation/TaskModal.jsx";

const baseTodo = {
  id: "1",
  text: "Book midwife appointment",
  priority: "medium",
  done: false,
  calendarDate: null,
  calendarUrl: null,
  createdAt: Date.now(),
};

describe("TaskModal", () => {
  it("renders nothing when todo is null", () => {
    const { container } = render(
      <TaskModal todo={null} onClose={() => {}} onSetPriority={() => {}} onSetCalendar={() => {}} onClearCalendar={() => {}} onToggleDone={() => {}} />
    );
    expect(container.firstChild).toBeNull();
  });

  it("renders the full task text when todo is provided", () => {
    render(
      <TaskModal todo={baseTodo} onClose={() => {}} onSetPriority={() => {}} onSetCalendar={() => {}} onClearCalendar={() => {}} onToggleDone={() => {}} />
    );
    expect(screen.getByText("Book midwife appointment")).toBeInTheDocument();
  });

  it("calls onClose when close button is clicked", () => {
    const onClose = vi.fn();
    render(
      <TaskModal todo={baseTodo} onClose={onClose} onSetPriority={() => {}} onSetCalendar={() => {}} onClearCalendar={() => {}} onToggleDone={() => {}} />
    );
    fireEvent.click(screen.getByTestId("modal-close"));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("shows three priority buttons: high, medium, low", () => {
    render(
      <TaskModal todo={baseTodo} onClose={() => {}} onSetPriority={() => {}} onSetCalendar={() => {}} onClearCalendar={() => {}} onToggleDone={() => {}} />
    );
    expect(screen.getByTestId("priority-high")).toBeInTheDocument();
    expect(screen.getByTestId("priority-medium")).toBeInTheDocument();
    expect(screen.getByTestId("priority-low")).toBeInTheDocument();
  });

  it("calls onSetPriority with todo id and new priority", () => {
    const onSetPriority = vi.fn();
    render(
      <TaskModal todo={baseTodo} onClose={() => {}} onSetPriority={onSetPriority} onSetCalendar={() => {}} onClearCalendar={() => {}} onToggleDone={() => {}} />
    );
    fireEvent.click(screen.getByTestId("priority-high"));
    expect(onSetPriority).toHaveBeenCalledWith("1", "high");
  });

  it("shows 'Add to Calendar' button when no calendar date is set", () => {
    render(
      <TaskModal todo={baseTodo} onClose={() => {}} onSetPriority={() => {}} onSetCalendar={() => {}} onClearCalendar={() => {}} onToggleDone={() => {}} />
    );
    expect(screen.getByTestId("calendar-add-btn")).toBeInTheDocument();
  });

  it("shows date picker after clicking 'Add to Calendar'", () => {
    render(
      <TaskModal todo={baseTodo} onClose={() => {}} onSetPriority={() => {}} onSetCalendar={() => {}} onClearCalendar={() => {}} onToggleDone={() => {}} />
    );
    fireEvent.click(screen.getByTestId("calendar-add-btn"));
    expect(screen.getByTestId("calendar-date-input")).toBeInTheDocument();
  });

  it("calls onSetCalendar with id, date, and url when date is confirmed", () => {
    const onSetCalendar = vi.fn();
    render(
      <TaskModal todo={baseTodo} onClose={() => {}} onSetPriority={() => {}} onSetCalendar={onSetCalendar} onClearCalendar={() => {}} onToggleDone={() => {}} />
    );
    fireEvent.click(screen.getByTestId("calendar-add-btn"));
    fireEvent.change(screen.getByTestId("calendar-date-input"), {
      target: { value: "2026-05-10" },
    });
    fireEvent.click(screen.getByTestId("calendar-confirm-btn"));
    expect(onSetCalendar).toHaveBeenCalledWith(
      "1",
      "2026-05-10",
      expect.stringContaining("calendar.google.com")
    );
  });

  it("shows 'Change date' and 'Remove' when calendar date is already set", () => {
    const todo = { ...baseTodo, calendarDate: "2026-05-10", calendarUrl: "https://calendar.google.com" };
    render(
      <TaskModal todo={todo} onClose={() => {}} onSetPriority={() => {}} onSetCalendar={() => {}} onClearCalendar={() => {}} onToggleDone={() => {}} />
    );
    expect(screen.getByTestId("calendar-change-btn")).toBeInTheDocument();
    expect(screen.getByTestId("calendar-remove-btn")).toBeInTheDocument();
  });

  it("calls onClearCalendar when Remove is clicked", () => {
    const onClearCalendar = vi.fn();
    const todo = { ...baseTodo, calendarDate: "2026-05-10", calendarUrl: "https://calendar.google.com" };
    render(
      <TaskModal todo={todo} onClose={() => {}} onSetPriority={() => {}} onSetCalendar={() => {}} onClearCalendar={onClearCalendar} onToggleDone={() => {}} />
    );
    fireEvent.click(screen.getByTestId("calendar-remove-btn"));
    expect(onClearCalendar).toHaveBeenCalledWith("1");
  });

  it("calls onToggleDone when done button is clicked", () => {
    const onToggleDone = vi.fn();
    render(
      <TaskModal todo={baseTodo} onClose={() => {}} onSetPriority={() => {}} onSetCalendar={() => {}} onClearCalendar={() => {}} onToggleDone={onToggleDone} />
    );
    fireEvent.click(screen.getByTestId("modal-toggle-done"));
    expect(onToggleDone).toHaveBeenCalledWith("1");
  });

  it("shows delete button when onRemove is provided", () => {
    render(
      <TaskModal todo={baseTodo} onClose={() => {}} onSetPriority={() => {}} onSetCalendar={() => {}} onClearCalendar={() => {}} onToggleDone={() => {}} onRemove={() => {}} />
    );
    expect(screen.getByTestId("modal-delete")).toBeInTheDocument();
  });

  it("does not show delete button when onRemove is not provided", () => {
    render(
      <TaskModal todo={baseTodo} onClose={() => {}} onSetPriority={() => {}} onSetCalendar={() => {}} onClearCalendar={() => {}} onToggleDone={() => {}} />
    );
    expect(screen.queryByTestId("modal-delete")).not.toBeInTheDocument();
  });

  it("calls onRemove and onClose when delete is clicked", () => {
    const onRemove = vi.fn();
    const onClose = vi.fn();
    render(
      <TaskModal todo={baseTodo} onClose={onClose} onSetPriority={() => {}} onSetCalendar={() => {}} onClearCalendar={() => {}} onToggleDone={() => {}} onRemove={onRemove} />
    );
    fireEvent.click(screen.getByTestId("modal-delete"));
    expect(onRemove).toHaveBeenCalledWith("1");
    expect(onClose).toHaveBeenCalled();
  });
});

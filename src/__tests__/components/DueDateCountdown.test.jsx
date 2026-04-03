import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { DueDateCountdown } from "../../features/expectation/DueDateCountdown.jsx";

const baseCountdown = { overdue: false, primary: 12, primaryLabel: "weeks", secondary: 3, secondaryLabel: "days" };

describe("DueDateCountdown", () => {
  it("renders nothing when countdown is null", () => {
    const { container } = render(
      <DueDateCountdown countdown={null} unit="wks_days" onUnitChange={() => {}} onSetDueDate={() => {}} dueDate={null} />
    );
    // Should show a date picker prompt, not crash
    expect(container.firstChild).not.toBeNull();
  });

  it("shows the primary number prominently when countdown is set", () => {
    render(
      <DueDateCountdown countdown={baseCountdown} unit="wks_days" onUnitChange={() => {}} onSetDueDate={() => {}} dueDate="2026-09-15" />
    );
    expect(screen.getByTestId("countdown-primary")).toHaveTextContent("12");
  });

  it("shows the primary label", () => {
    render(
      <DueDateCountdown countdown={baseCountdown} unit="wks_days" onUnitChange={() => {}} onSetDueDate={() => {}} dueDate="2026-09-15" />
    );
    expect(screen.getByTestId("countdown-primary-label")).toHaveTextContent("weeks");
  });

  it("shows secondary value and label for wks_days unit", () => {
    render(
      <DueDateCountdown countdown={baseCountdown} unit="wks_days" onUnitChange={() => {}} onSetDueDate={() => {}} dueDate="2026-09-15" />
    );
    expect(screen.getByTestId("countdown-secondary")).toBeInTheDocument();
    expect(screen.getByTestId("countdown-secondary")).toHaveTextContent("3");
  });

  it("does not show secondary for 'days' unit", () => {
    const countdown = { overdue: false, primary: 166, primaryLabel: "days", secondary: null, secondaryLabel: null };
    render(
      <DueDateCountdown countdown={countdown} unit="days" onUnitChange={() => {}} onSetDueDate={() => {}} dueDate="2026-09-15" />
    );
    expect(screen.queryByTestId("countdown-secondary")).not.toBeInTheDocument();
  });

  it("shows all three unit toggle buttons", () => {
    render(
      <DueDateCountdown countdown={baseCountdown} unit="wks_days" onUnitChange={() => {}} onSetDueDate={() => {}} dueDate="2026-09-15" />
    );
    expect(screen.getByTestId("unit-wks_days")).toBeInTheDocument();
    expect(screen.getByTestId("unit-days")).toBeInTheDocument();
    expect(screen.getByTestId("unit-hours")).toBeInTheDocument();
  });

  it("calls onUnitChange when a unit button is clicked", () => {
    const onUnitChange = vi.fn();
    render(
      <DueDateCountdown countdown={baseCountdown} unit="wks_days" onUnitChange={onUnitChange} onSetDueDate={() => {}} dueDate="2026-09-15" />
    );
    fireEvent.click(screen.getByTestId("unit-days"));
    expect(onUnitChange).toHaveBeenCalledWith("days");
  });

  it("marks the active unit button differently", () => {
    render(
      <DueDateCountdown countdown={baseCountdown} unit="days" onUnitChange={() => {}} onSetDueDate={() => {}} dueDate="2026-09-15" />
    );
    expect(screen.getByTestId("unit-days")).toHaveAttribute("data-active", "true");
    expect(screen.getByTestId("unit-hours")).toHaveAttribute("data-active", "false");
  });

  it("shows overdue message when countdown.overdue is true", () => {
    const overdue = { overdue: true, primary: 3, primaryLabel: "days", secondary: null, secondaryLabel: null };
    render(
      <DueDateCountdown countdown={overdue} unit="days" onUnitChange={() => {}} onSetDueDate={() => {}} dueDate="2026-03-30" />
    );
    expect(screen.getByTestId("overdue-badge")).toBeInTheDocument();
  });

  it("shows a date input to set due date when dueDate is null", () => {
    render(
      <DueDateCountdown countdown={null} unit="wks_days" onUnitChange={() => {}} onSetDueDate={() => {}} dueDate={null} />
    );
    expect(screen.getByTestId("due-date-input")).toBeInTheDocument();
  });

  it("calls onSetDueDate when date input changes", () => {
    const onSetDueDate = vi.fn();
    render(
      <DueDateCountdown countdown={null} unit="wks_days" onUnitChange={() => {}} onSetDueDate={onSetDueDate} dueDate={null} />
    );
    fireEvent.change(screen.getByTestId("due-date-input"), { target: { value: "2026-09-15" } });
    expect(onSetDueDate).toHaveBeenCalledWith("2026-09-15");
  });
});

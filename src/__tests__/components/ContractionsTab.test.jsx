import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { ContractionsTab } from "../../features/contractions/ContractionsTab.jsx";

const make = (n) => {
  const now = Date.now();
  return Array.from({ length: n }, (_, i) => ({ start: now - i * 5 * 60000, duration: 60, time: `t${i}` }));
};

const baseProps = {
  contractions: [],
  activeStart: null,
  elapsed: 0,
  clearConfirm: false,
  setClearConfirm: vi.fn(),
  phase: "tracking",
  stats: null,
  rule: "5-1-1",
  handleContraction: vi.fn(),
  clearAll: vi.fn(),
};

describe("ContractionsTab", () => {
  it("always shows the medical disclaimer", () => {
    render(<ContractionsTab {...baseProps} />);
    expect(screen.getByText(/not medical advice/i)).toBeInTheDocument();
  });

  it("shows the selected rule in the footer", () => {
    render(<ContractionsTab {...baseProps} rule="4-1-1" />);
    expect(screen.getByText(/Rule: 4-1-1/)).toBeInTheDocument();
  });

  it("shows the rule alert named after the selected rule when met", () => {
    const stats = { avgDur: 60, avgGap: 3, trend: "stable", ruleMet: true };
    render(<ContractionsTab {...baseProps} contractions={make(10)} phase="active" stats={stats} rule="3-1-1" />);
    expect(screen.getByText("3-1-1 rule reached")).toBeInTheDocument();
  });

  it("does not show the rule alert when not met", () => {
    const stats = { avgDur: 60, avgGap: 8, trend: "stable", ruleMet: false };
    render(<ContractionsTab {...baseProps} contractions={make(3)} stats={stats} />);
    expect(screen.queryByText(/rule reached/)).not.toBeInTheDocument();
  });

  it("lists 8 recent contractions and reveals the rest on 'Show more'", () => {
    render(<ContractionsTab {...baseProps} contractions={make(40)} />);
    expect(screen.getByText("t7")).toBeInTheDocument();
    expect(screen.queryByText("t8")).not.toBeInTheDocument();
    fireEvent.click(screen.getByText("Show more"));
    expect(screen.getByText("t39")).toBeInTheDocument();
    fireEvent.click(screen.getByText("Show less"));
    expect(screen.queryByText("t8")).not.toBeInTheDocument();
  });
});

import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { Header } from "../../components/Header.jsx";

const defaultProps = { affirmation: "You are doing great!", fade: true, mode: "labour", onToggleMode: () => {} };

describe("Header", () => {
  it("renders the app title", () => {
    render(<Header {...defaultProps} />);
    expect(screen.getByRole("heading", { level: 1 })).toBeInTheDocument();
    expect(screen.getByText(/LunaBirth/i)).toBeInTheDocument();
  });

  it("renders the affirmation text", () => {
    render(<Header {...defaultProps} affirmation="Trust your body." />);
    expect(screen.getByText("Trust your body.")).toBeInTheDocument();
  });

  it("applies full opacity when fade is true", () => {
    render(<Header {...defaultProps} affirmation="Test" fade={true} />);
    const affirmationEl = screen.getByText("Test");
    expect(affirmationEl).toHaveStyle({ opacity: 1 });
  });

  it("applies zero opacity when fade is false", () => {
    render(<Header {...defaultProps} affirmation="Test" fade={false} />);
    const affirmationEl = screen.getByText("Test");
    expect(affirmationEl).toHaveStyle({ opacity: 0 });
  });
});

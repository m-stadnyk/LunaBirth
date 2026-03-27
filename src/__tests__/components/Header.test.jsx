import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { Header } from "../../components/Header.jsx";

describe("Header", () => {
  it("renders the app title", () => {
    render(<Header affirmation="You are doing great!" fade={true} />);
    expect(screen.getByRole("heading", { level: 1 })).toBeInTheDocument();
    expect(screen.getByText(/Labor Companion/i)).toBeInTheDocument();
  });

  it("renders the affirmation text", () => {
    render(<Header affirmation="Trust your body." fade={true} />);
    expect(screen.getByText("Trust your body.")).toBeInTheDocument();
  });

  it("applies full opacity when fade is true", () => {
    render(<Header affirmation="Test" fade={true} />);
    const affirmationEl = screen.getByText("Test");
    expect(affirmationEl).toHaveStyle({ opacity: 1 });
  });

  it("applies zero opacity when fade is false", () => {
    render(<Header affirmation="Test" fade={false} />);
    const affirmationEl = screen.getByText("Test");
    expect(affirmationEl).toHaveStyle({ opacity: 0 });
  });
});

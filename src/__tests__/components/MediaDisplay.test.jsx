import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { MediaDisplay } from "../../components/MediaDisplay.jsx";

describe("MediaDisplay", () => {
  it("renders nothing when url is empty", () => {
    const { container } = render(<MediaDisplay url="" />);
    expect(container.firstChild).toBeNull();
  });

  it("renders nothing when url is null", () => {
    const { container } = render(<MediaDisplay url={null} />);
    expect(container.firstChild).toBeNull();
  });

  it("renders an img for image URLs", () => {
    render(<MediaDisplay url="https://example.com/photo.jpg" />);
    const img = screen.getByRole("img");
    expect(img).toBeInTheDocument();
    expect(img).toHaveAttribute("src", "https://example.com/photo.jpg");
  });

  it("renders a YouTube thumbnail for youtu.be URLs", () => {
    render(<MediaDisplay url="https://youtu.be/dQw4w9WgXcQ" />);
    const imgs = screen.getAllByRole("img");
    const thumb = imgs.find((img) =>
      img.getAttribute("src")?.includes("img.youtube.com")
    );
    expect(thumb).toBeInTheDocument();
    expect(thumb.getAttribute("src")).toContain("dQw4w9WgXcQ");
  });

  it("renders a Spotify link for spotify URLs", () => {
    render(<MediaDisplay url="https://open.spotify.com/playlist/abc" />);
    const link = screen.getByText("Open in Spotify");
    expect(link).toBeInTheDocument();
  });

  it("renders a generic link for other URLs", () => {
    render(<MediaDisplay url="https://example.com/some-page" />);
    const link = screen.getByText("Open media / music");
    expect(link).toBeInTheDocument();
  });
});

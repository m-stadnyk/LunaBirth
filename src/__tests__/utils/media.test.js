import { describe, it, expect } from "vitest";
import { getMediaType, getYtId } from "../../utils/media.js";

describe("getMediaType", () => {
  it("returns null for empty/missing url", () => {
    expect(getMediaType(null)).toBeNull();
    expect(getMediaType(undefined)).toBeNull();
    expect(getMediaType("")).toBeNull();
    expect(getMediaType("   ")).toBeNull();
  });

  it("detects youtube.com/watch URLs", () => {
    expect(getMediaType("https://www.youtube.com/watch?v=abc123")).toBe("youtube");
  });

  it("detects youtu.be short URLs", () => {
    expect(getMediaType("https://youtu.be/dQw4w9WgXcQ")).toBe("youtube");
  });

  it("detects spotify URLs", () => {
    expect(getMediaType("https://open.spotify.com/playlist/abc")).toBe("spotify");
    expect(getMediaType("https://spotify.com/track/xyz")).toBe("spotify");
  });

  it("detects image URLs by extension", () => {
    expect(getMediaType("https://example.com/photo.jpg")).toBe("image");
    expect(getMediaType("https://example.com/photo.png")).toBe("image");
    expect(getMediaType("https://example.com/photo.webp")).toBe("image");
    expect(getMediaType("https://example.com/photo.gif")).toBe("image");
    expect(getMediaType("https://example.com/photo.svg")).toBe("image");
  });

  it("detects known image CDN domains", () => {
    expect(getMediaType("https://images.unsplash.com/photo-123")).toBe("image");
    expect(getMediaType("https://picsum.photos/200")).toBe("image");
    expect(getMediaType("https://i.imgur.com/abc.jpg")).toBe("image");
    expect(getMediaType("https://res.cloudinary.com/demo/image/upload/sample.jpg")).toBe("image");
  });

  it("falls back to 'link' for other URLs", () => {
    expect(getMediaType("https://example.com/some-page")).toBe("link");
    expect(getMediaType("https://soundcloud.com/track/xyz")).toBe("link");
  });
});

describe("getYtId", () => {
  it("extracts ID from youtube.com/watch URL", () => {
    expect(getYtId("https://www.youtube.com/watch?v=dQw4w9WgXcQ")).toBe("dQw4w9WgXcQ");
  });

  it("extracts ID from youtu.be short URL", () => {
    expect(getYtId("https://youtu.be/dQw4w9WgXcQ")).toBe("dQw4w9WgXcQ");
  });

  it("returns null for non-YouTube URL", () => {
    expect(getYtId("https://example.com")).toBeNull();
  });

  it("handles URLs with extra query params", () => {
    expect(getYtId("https://www.youtube.com/watch?v=dQw4w9WgXcQ&t=42")).toBe("dQw4w9WgXcQ");
  });
});

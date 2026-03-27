/**
 * Detect media type from a URL.
 * @returns {"youtube"|"spotify"|"image"|"link"|null}
 */
export const getMediaType = (url) => {
  if (!url?.trim()) return null;
  if (/youtube\.com\/watch|youtu\.be\//.test(url)) return "youtube";
  if (/spotify\.com/.test(url)) return "spotify";
  if (
    /\.(jpg|jpeg|png|gif|webp|svg)(\?.*)?$/i.test(url) ||
    /unsplash|picsum|imgur|cloudinary/.test(url)
  )
    return "image";
  return "link";
};

/** Extract the 11-character YouTube video ID from a URL. Returns null if not found. */
export const getYtId = (url) => {
  const m = url.match(/(?:v=|youtu\.be\/)([A-Za-z0-9_-]{11})/);
  return m?.[1] ?? null;
};

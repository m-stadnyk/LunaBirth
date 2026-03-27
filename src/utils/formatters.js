/** Format seconds to "Xm XXs" or "Xs". Returns " - " for null/undefined. */
export const fmtSec = (s) => {
  if (s == null) return " - ";
  const m = Math.floor(s / 60);
  return m > 0 ? `${m}m ${String(s % 60).padStart(2, "0")}s` : `${s}s`;
};

/** Format seconds to "MM:SS". */
export const fmtMMSS = (s) =>
  `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;

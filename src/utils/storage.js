/**
 * Async localStorage adapter.
 * Replaces the window.storage API used in the original Claude-chat environment,
 * keeping the same call signature so all hook code remains unchanged.
 */
export const storage = {
  get: async (key) => {
    try {
      const value = localStorage.getItem(key);
      return value != null ? { value } : null;
    } catch {
      return null;
    }
  },
  set: async (key, value) => {
    try {
      localStorage.setItem(key, String(value));
    } catch {
      // Storage quota exceeded or private browsing — silently ignore
    }
  },
  remove: async (key) => {
    try {
      localStorage.removeItem(key);
    } catch {
      // Silently ignore
    }
  },
};

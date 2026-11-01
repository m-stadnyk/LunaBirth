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
  // Throws on quota exceeded / storage blocked so callers can surface the failure
  set: async (key, value) => {
    localStorage.setItem(key, String(value));
  },
  remove: async (key) => {
    try {
      localStorage.removeItem(key);
    } catch {
      // Silently ignore
    }
  },
};

import "@testing-library/jest-dom";

// Minimal localStorage mock for test environment
const store = {};
const localStorageMock = {
  getItem: (key) => store[key] ?? null,
  setItem: (key, value) => { store[key] = String(value); },
  removeItem: (key) => { delete store[key]; },
  clear: () => { Object.keys(store).forEach((k) => delete store[k]); },
};
Object.defineProperty(globalThis, "localStorage", {
  value: localStorageMock,
  writable: true,
});

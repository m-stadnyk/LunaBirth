import { renderHook, act } from "@testing-library/react";
import { useAppUpdate } from "../../hooks/useAppUpdate.js";

// jsdom does not implement navigator.serviceWorker, so SW-absent tests use the
// default jsdom environment. SW-present tests mock it explicitly.

describe("useAppUpdate", () => {
  describe("without service worker (jsdom default)", () => {
    it("starts with idle status", () => {
      const { result } = renderHook(() => useAppUpdate());
      expect(result.current.status).toBe("idle");
    });

    it("exposes checkForUpdates function", () => {
      const { result } = renderHook(() => useAppUpdate());
      expect(typeof result.current.checkForUpdates).toBe("function");
    });

    it("transitions to upToDate when no SW is available", async () => {
      const { result } = renderHook(() => useAppUpdate());
      await act(async () => {
        result.current.checkForUpdates();
      });
      expect(result.current.status).toBe("upToDate");
    });

    it("resets to idle after 3s when upToDate", async () => {
      vi.useFakeTimers();
      const { result } = renderHook(() => useAppUpdate());

      await act(async () => {
        result.current.checkForUpdates();
      });

      expect(result.current.status).toBe("upToDate");

      await act(async () => {
        vi.advanceTimersByTime(3000);
      });

      expect(result.current.status).toBe("idle");
      vi.useRealTimers();
    });
  });

  describe("with mocked service worker", () => {
    let mockReg;
    let mockUpdate;

    beforeEach(() => {
      vi.useFakeTimers();
      mockUpdate = vi.fn().mockResolvedValue(undefined);
      mockReg = { update: mockUpdate, waiting: null, installing: null };

      Object.defineProperty(navigator, "serviceWorker", {
        value: {
          ready: Promise.resolve(mockReg),
          addEventListener: vi.fn(),
          removeEventListener: vi.fn(),
        },
        writable: true,
        configurable: true,
      });
    });

    afterEach(() => {
      // Restore to undefined so other tests see no SW
      Object.defineProperty(navigator, "serviceWorker", {
        value: undefined,
        writable: true,
        configurable: true,
      });
      vi.useRealTimers();
    });

    it("calls registration.update() when checkForUpdates is invoked", async () => {
      const { result } = renderHook(() => useAppUpdate());

      // Let the ready promise resolve and set swReg
      await act(async () => {
        await Promise.resolve();
      });

      await act(async () => {
        result.current.checkForUpdates();
        await Promise.resolve();
      });

      expect(mockUpdate).toHaveBeenCalledTimes(1);
    });

    it("shows checking status while update is running", async () => {
      const { result } = renderHook(() => useAppUpdate());

      await act(async () => {
        await Promise.resolve();
      });

      act(() => {
        result.current.checkForUpdates();
      });

      expect(result.current.status).toBe("checking");
    });

    it("shows upToDate after check with no waiting SW", async () => {
      const { result } = renderHook(() => useAppUpdate());

      await act(async () => {
        await Promise.resolve();
      });

      await act(async () => {
        result.current.checkForUpdates();
        await Promise.resolve();
      });

      await act(async () => {
        vi.advanceTimersByTime(1500);
      });

      expect(result.current.status).toBe("upToDate");
    });

    it("transitions to updating when a waiting SW is found", async () => {
      mockReg.waiting = { postMessage: vi.fn() };

      const { result } = renderHook(() => useAppUpdate());

      await act(async () => {
        await Promise.resolve();
      });

      await act(async () => {
        result.current.checkForUpdates();
        await Promise.resolve();
      });

      await act(async () => {
        vi.advanceTimersByTime(1500);
      });

      expect(result.current.status).toBe("updating");
      expect(mockReg.waiting.postMessage).toHaveBeenCalledWith({ type: "SKIP_WAITING" });
    });
  });
});

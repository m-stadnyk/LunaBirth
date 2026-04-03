import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useDueDate } from "../../hooks/useDueDate.js";

vi.mock("../../utils/storage.js", () => ({
  storage: {
    get: vi.fn(async () => null),
    set: vi.fn(async () => {}),
  },
}));

import { storage } from "../../utils/storage.js";

describe("useDueDate", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    storage.get.mockResolvedValue(null);
  });

  it("starts with null dueDate and null countdown", async () => {
    const { result } = renderHook(() => useDueDate());
    await act(async () => {});
    expect(result.current.dueDate).toBeNull();
    expect(result.current.countdown).toBeNull();
  });

  it("defaults to 'wks_days' countdown unit", async () => {
    const { result } = renderHook(() => useDueDate());
    await act(async () => {});
    expect(result.current.countdownUnit).toBe("wks_days");
  });

  it("restores persisted dueDate from storage on mount", async () => {
    storage.get.mockImplementation(async (key) => {
      if (key === "luna_due_date") return { value: "2026-09-15" };
      return null;
    });

    const { result } = renderHook(() => useDueDate());
    await act(async () => {});
    expect(result.current.dueDate).toBe("2026-09-15");
  });

  it("restores persisted countdownUnit from storage on mount", async () => {
    storage.get.mockImplementation(async (key) => {
      if (key === "luna_countdown_unit") return { value: "hours" };
      return null;
    });

    const { result } = renderHook(() => useDueDate());
    await act(async () => {});
    expect(result.current.countdownUnit).toBe("hours");
  });

  it("setDueDate updates state and persists to storage", async () => {
    const { result } = renderHook(() => useDueDate());
    await act(async () => {});

    await act(async () => {
      result.current.setDueDate("2026-09-15");
    });

    expect(result.current.dueDate).toBe("2026-09-15");
    expect(storage.set).toHaveBeenCalledWith("luna_due_date", "2026-09-15");
  });

  it("setCountdownUnit updates state and persists to storage", async () => {
    const { result } = renderHook(() => useDueDate());
    await act(async () => {});

    await act(async () => {
      result.current.setCountdownUnit("days");
    });

    expect(result.current.countdownUnit).toBe("days");
    expect(storage.set).toHaveBeenCalledWith("luna_countdown_unit", "days");
  });

  it("clearDueDate resets dueDate and countdown to null", async () => {
    const { result } = renderHook(() => useDueDate());
    await act(async () => {});

    await act(async () => { result.current.setDueDate("2026-09-15"); });
    await act(async () => { result.current.clearDueDate(); });

    expect(result.current.dueDate).toBeNull();
    expect(result.current.countdown).toBeNull();
  });

  it("countdown is non-null once a dueDate is set", async () => {
    const { result } = renderHook(() => useDueDate());
    await act(async () => {});

    await act(async () => {
      result.current.setDueDate("2026-09-15");
    });

    expect(result.current.countdown).not.toBeNull();
    expect(typeof result.current.countdown.primary).toBe("number");
  });

  it("countdown reflects unit change", async () => {
    const { result } = renderHook(() => useDueDate());
    await act(async () => {});

    await act(async () => { result.current.setDueDate("2026-09-15"); });

    await act(async () => { result.current.setCountdownUnit("days"); });
    const dayResult = result.current.countdown;

    await act(async () => { result.current.setCountdownUnit("hours"); });
    const hourResult = result.current.countdown;

    expect(dayResult.primaryLabel).toBe("days");
    expect(hourResult.primaryLabel).toBe("hours");
    expect(hourResult.primary).toBeGreaterThan(dayResult.primary);
  });
});

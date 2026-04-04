import { useState, useEffect, useRef } from "react";
import { storage } from "../utils/storage.js";
import { PHASES } from "../constants/index.js";

const KEYS = {
  drinkCount: "lc_dc",
  lastDrank: "lc_ld",
  drinkInterval: "lc_di",
  intervals: "lc_iv",
};

/**
 * Manages hydration reminders: countdown timer, drink logging, interval management,
 * and phase-based drink suggestions. Persists all state to localStorage.
 *
 * @param {object} [opts]
 * @param {function} [opts.onDrinkAlert] - Called once when the countdown transitions to 0 (false→true).
 */
export function useHydration({ onDrinkAlert } = {}) {
  const [drinkInterval, setDrinkInterval] = useState(15);
  const drinkIntervalRef = useRef(15);
  const [intervals, setIntervals] = useState([5, 15, 30]);
  const [customVal, setCustomVal] = useState("");
  const [showCustomInput, setShowCustomInput] = useState(false);
  const [lastDrank, setLastDrank] = useState(Date.now());
  const [drinkCount, setDrinkCount] = useState(0);
  const [secsLeft, setSecsLeft] = useState(1200);
  const [drinkAlert, setDrinkAlert] = useState(false);
  const prevAlertRef = useRef(false);
  const onDrinkAlertRef = useRef(onDrinkAlert);
  const [drinkSuggestion, setDrinkSuggestion] = useState(null);

  // Load persisted hydration state on mount
  useEffect(() => {
    (async () => {
      try {
        const dc = await storage.get(KEYS.drinkCount);
        if (dc) setDrinkCount(+dc.value || 0);

        const ld = await storage.get(KEYS.lastDrank);
        if (ld) setLastDrank(+ld.value || Date.now());

        const di = await storage.get(KEYS.drinkInterval);
        if (di) {
          const v = +di.value || 15;
          setDrinkInterval(v);
          drinkIntervalRef.current = v;
        }

        const iv = await storage.get(KEYS.intervals);
        if (iv) setIntervals(JSON.parse(iv.value));
      } catch {
        // Storage unavailable — use defaults
      }
    })();
  }, []);

  // Keep callback ref current so the interval closure always calls the latest version
  useEffect(() => { onDrinkAlertRef.current = onDrinkAlert; }, [onDrinkAlert]);

  // Countdown timer: ticks every second
  useEffect(() => {
    const id = setInterval(() => {
      const el = Math.floor((Date.now() - lastDrank) / 1000);
      const left = drinkInterval * 60 - el;
      const firing = left <= 0;
      setSecsLeft(Math.max(0, left));
      setDrinkAlert(firing);
      // Fire notification only on the false→true transition (once per alert, not every tick)
      if (firing && !prevAlertRef.current) {
        onDrinkAlertRef.current?.();
      }
      prevAlertRef.current = firing;
    }, 1000);
    return () => clearInterval(id);
  }, [lastDrank, drinkInterval]);

  /**
   * Called by the contractions hook when the labor phase changes.
   * Surfaces a contextual drink suggestion if the recommended interval differs from current.
   */
  const handlePhaseChange = (newPhase, suggestedMin) => {
    if (suggestedMin !== drinkIntervalRef.current) {
      setDrinkSuggestion({ minutes: suggestedMin, label: PHASES[newPhase].title });
    }
  };

  const applyInterval = async (v) => {
    setDrinkInterval(v);
    drinkIntervalRef.current = v;
    setDrinkSuggestion(null);
    try {
      await storage.set(KEYS.drinkInterval, String(v));
    } catch {
      // ignore
    }
  };

  const addInterval = async (v) => {
    if (!v || intervals.includes(v)) return;
    const updated = [...intervals, v].sort((a, b) => a - b);
    setIntervals(updated);
    setCustomVal("");
    setShowCustomInput(false);
    await applyInterval(v);
    try {
      await storage.set(KEYS.intervals, JSON.stringify(updated));
    } catch {
      // ignore
    }
  };

  const removeInterval = async (v) => {
    if (intervals.length <= 1) return; // keep at least one
    const updated = intervals.filter((i) => i !== v).sort((a, b) => a - b);
    setIntervals(updated);
    if (drinkInterval === v) {
      const nearest = updated.reduce((a, b) =>
        Math.abs(b - v) < Math.abs(a - v) ? b : a
      );
      await applyInterval(nearest);
    }
    try {
      await storage.set(KEYS.intervals, JSON.stringify(updated));
    } catch {
      // ignore
    }
  };

  const drank = async () => {
    const now = Date.now();
    setLastDrank(now);
    const nc = drinkCount + 1;
    setDrinkCount(nc);
    setDrinkAlert(false);
    prevAlertRef.current = false;
    try {
      await storage.set(KEYS.lastDrank, String(now));
      await storage.set(KEYS.drinkCount, String(nc));
    } catch {
      // ignore
    }
  };

  return {
    drinkInterval,
    intervals,
    customVal,
    setCustomVal,
    showCustomInput,
    setShowCustomInput,
    lastDrank,
    drinkCount,
    secsLeft,
    drinkAlert,
    drinkSuggestion,
    setDrinkSuggestion,
    handlePhaseChange,
    applyInterval,
    addInterval,
    removeInterval,
    drank,
  };
}

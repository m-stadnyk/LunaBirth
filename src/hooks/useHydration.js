import { useState, useEffect, useRef } from "react";
import { useDatabaseContext } from "../context/DatabaseContext.jsx";
import { PHASES } from "../constants/index.js";

/**
 * Manages hydration reminders: countdown timer, drink logging, interval management,
 * and phase-based drink suggestions. Persists all state via the active DatabaseAdapter.
 *
 * @param {object} [opts]
 * @param {function} [opts.onDrinkAlert] - Called once when the countdown transitions to 0 (false→true).
 */
export function useHydration({ onDrinkAlert } = {}) {
  const { adapter, resetKey } = useDatabaseContext();
  const [drinkInterval, setDrinkInterval] = useState(15);
  const drinkIntervalRef = useRef(15);
  const [intervals, setIntervals] = useState([5, 15, 30]);
  const intervalsRef = useRef([5, 15, 30]);
  const [customVal, setCustomVal] = useState("");
  const [showCustomInput, setShowCustomInput] = useState(false);
  const [lastDrank, setLastDrank] = useState(Date.now());
  const lastDrankRef = useRef(Date.now());
  const [drinkCount, setDrinkCount] = useState(0);
  const drinkCountRef = useRef(0);
  const [secsLeft, setSecsLeft] = useState(1200);
  const [drinkAlert, setDrinkAlert] = useState(false);
  const prevAlertRef = useRef(false);
  const onDrinkAlertRef = useRef(onDrinkAlert);
  const [drinkSuggestion, setDrinkSuggestion] = useState(null);

  // Load persisted hydration state on mount.
  // Re-runs when adapter changes (e.g. partner joins and adapter swaps to Supabase).
  useEffect(() => {
    let cancelled = false;
    adapter.getHydration().then((data) => {
      if (cancelled) return;
      if (data.drinkCount !== undefined) {
        setDrinkCount(data.drinkCount);
        drinkCountRef.current = data.drinkCount;
      }
      if (data.lastDrank !== undefined) {
        setLastDrank(data.lastDrank);
        lastDrankRef.current = data.lastDrank;
      }
      if (data.drinkInterval !== undefined) {
        setDrinkInterval(data.drinkInterval);
        drinkIntervalRef.current = data.drinkInterval;
      }
      if (data.intervals !== undefined) {
        setIntervals(data.intervals);
        intervalsRef.current = data.intervals;
      }
    });
    return () => { cancelled = true; };
  }, [adapter, resetKey]);

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
      await adapter.saveHydration({
        drinkCount: drinkCountRef.current,
        lastDrank: lastDrankRef.current,
        drinkInterval: v,
        intervals: intervalsRef.current,
      });
    } catch {
      // ignore
    }
  };

  const addInterval = async (v) => {
    if (!v || intervals.includes(v)) return;
    const updated = [...intervals, v].sort((a, b) => a - b);
    setIntervals(updated);
    intervalsRef.current = updated;
    setCustomVal("");
    setShowCustomInput(false);
    setDrinkInterval(v);
    drinkIntervalRef.current = v;
    setDrinkSuggestion(null);
    try {
      await adapter.saveHydration({
        drinkCount: drinkCountRef.current,
        lastDrank: lastDrankRef.current,
        drinkInterval: v,
        intervals: updated,
      });
    } catch {
      // ignore
    }
  };

  const removeInterval = async (v) => {
    if (intervals.length <= 1) return; // keep at least one
    const updated = intervals.filter((i) => i !== v).sort((a, b) => a - b);
    setIntervals(updated);
    intervalsRef.current = updated;
    let newInterval = drinkIntervalRef.current;
    if (drinkInterval === v) {
      newInterval = updated.reduce((a, b) =>
        Math.abs(b - v) < Math.abs(a - v) ? b : a
      );
      setDrinkInterval(newInterval);
      drinkIntervalRef.current = newInterval;
      setDrinkSuggestion(null);
    }
    try {
      await adapter.saveHydration({
        drinkCount: drinkCountRef.current,
        lastDrank: lastDrankRef.current,
        drinkInterval: newInterval,
        intervals: updated,
      });
    } catch {
      // ignore
    }
  };

  const drank = async () => {
    const now = Date.now();
    const nc = drinkCountRef.current + 1;
    setLastDrank(now);
    lastDrankRef.current = now;
    setDrinkCount(nc);
    drinkCountRef.current = nc;
    setDrinkAlert(false);
    prevAlertRef.current = false;
    try {
      await adapter.saveHydration({
        drinkCount: nc,
        lastDrank: now,
        drinkInterval: drinkIntervalRef.current,
        intervals: intervalsRef.current,
      });
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

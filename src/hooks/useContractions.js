import { useState, useEffect, useRef } from "react";
import { storage } from "../utils/storage.js";
import { computePhase, computeStats } from "../utils/phaseAnalysis.js";
import { PHASES } from "../constants/index.js";

const STORAGE_KEY = "lc_c4";

/**
 * Manages contraction tracking state, timers, phase detection, and persistence.
 *
 * @param {function} onPhaseChange - Called with (newPhase, suggestedDrinkMin) when phase changes.
 */
export function useContractions({ onPhaseChange } = {}) {
  const [contractions, setContractions] = useState([]);
  const [activeStart, setActiveStart] = useState(null);
  const [elapsed, setElapsed] = useState(0);
  const [clearConfirm, setClearConfirm] = useState(false);
  const [phase, setPhase] = useState("tracking");
  const [stats, setStats] = useState(null);
  const prevPhaseRef = useRef("tracking");

  // Load persisted contractions on mount
  useEffect(() => {
    (async () => {
      try {
        const c = await storage.get(STORAGE_KEY);
        if (c) setContractions(JSON.parse(c.value));
      } catch {
        // Storage unavailable — start fresh
      }
    })();
  }, []);

  // Live elapsed timer while a contraction is active
  useEffect(() => {
    if (!activeStart) return;
    const id = setInterval(
      () => setElapsed(Math.floor((Date.now() - activeStart) / 1000)),
      500
    );
    return () => clearInterval(id);
  }, [activeStart]);

  // Recompute phase and stats whenever the contraction list changes
  useEffect(() => {
    const newPhase = computePhase(contractions);
    const newStats = computeStats(contractions);
    setPhase(newPhase);
    setStats(newStats);

    // Only surface a drink suggestion when the phase actually changes
    if (newPhase !== "tracking" && newPhase !== prevPhaseRef.current) {
      prevPhaseRef.current = newPhase;
      onPhaseChange?.(newPhase, PHASES[newPhase].drinkMin);
    }
  }, [contractions]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleContraction = async () => {
    if (!activeStart) {
      setActiveStart(Date.now());
      setElapsed(0);
    } else {
      const duration = Math.floor((Date.now() - activeStart) / 1000);
      const entry = {
        start: activeStart,
        duration,
        time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };
      const updated = [entry, ...contractions].slice(0, 30);
      setContractions(updated);
      setActiveStart(null);
      setElapsed(0);
      try {
        await storage.set(STORAGE_KEY, JSON.stringify(updated));
      } catch {
        // ignore
      }
    }
  };

  const clearAll = async () => {
    setContractions([]);
    setActiveStart(null);
    setPhase("tracking");
    setStats(null);
    prevPhaseRef.current = "tracking";
    setClearConfirm(false);
    try {
      await storage.set(STORAGE_KEY, "[]");
    } catch {
      // ignore
    }
  };

  return {
    contractions,
    activeStart,
    elapsed,
    clearConfirm,
    setClearConfirm,
    phase,
    stats,
    handleContraction,
    clearAll,
  };
}

import { useState, useEffect, useRef } from "react";
import { useDatabaseContext } from "../context/DatabaseContext.jsx";
import { computePhase, computeStats } from "../utils/phaseAnalysis.js";
import { PHASES } from "../constants/index.js";

/**
 * Manages contraction tracking state, timers, phase detection, and persistence.
 *
 * @param {function} onPhaseChange - Called with (newPhase, suggestedDrinkMin) when phase changes.
 * @param {string} rule - Contraction rule id ("5-1-1" | "4-1-1" | "3-1-1") used for stats.ruleMet.
 */
export function useContractions({ onPhaseChange, rule } = {}) {
  const { adapter, resetKey } = useDatabaseContext();
  const [contractions, setContractions] = useState([]);
  const [activeStart, setActiveStart] = useState(null);
  const [elapsed, setElapsed] = useState(0);
  const [clearConfirm, setClearConfirm] = useState(false);
  const [phase, setPhase] = useState("tracking");
  const [stats, setStats] = useState(null);
  const prevPhaseRef = useRef("tracking");

  // Load persisted contractions and subscribe to real-time updates.
  // Re-runs when adapter changes (e.g. partner joins and adapter swaps to Supabase).
  useEffect(() => {
    let cancelled = false;
    adapter.getContractions().then((data) => {
      if (!cancelled) setContractions(data ?? []);
    });
    // Restore a contraction that was being timed before a reload
    adapter.getActiveContraction().then((start) => {
      if (cancelled) return;
      setActiveStart(start ?? null);
      setElapsed(start ? Math.floor((Date.now() - start) / 1000) : 0);
    }).catch(() => {});
    const unsub = adapter.subscribeContractions((data) => {
      setContractions(data);
    });
    return () => {
      cancelled = true;
      unsub();
    };
  }, [adapter, resetKey]);

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
    const newStats = computeStats(contractions, rule);
    setPhase(newPhase);
    setStats(newStats);

    // Only surface a drink suggestion when the phase actually changes
    if (newPhase !== "tracking" && newPhase !== prevPhaseRef.current) {
      prevPhaseRef.current = newPhase;
      onPhaseChange?.(newPhase, PHASES[newPhase].drinkMin);
    }
  }, [contractions, rule]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleContraction = async () => {
    if (!activeStart) {
      const start = Date.now();
      setActiveStart(start);
      setElapsed(0);
      adapter.saveActiveContraction(start).catch(() => {});
    } else {
      const duration = Math.floor((Date.now() - activeStart) / 1000);
      const entry = {
        start: activeStart,
        duration,
        time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };
      const updated = [entry, ...contractions];
      setContractions(updated);
      setActiveStart(null);
      setElapsed(0);
      adapter.saveActiveContraction(null).catch(() => {});
      try {
        await adapter.saveContractions(updated);
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
    adapter.saveActiveContraction(null).catch(() => {});
    try {
      await adapter.saveContractions([]);
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

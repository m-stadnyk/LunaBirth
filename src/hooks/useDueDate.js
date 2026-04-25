import { useState, useEffect, useMemo } from "react";
import { useDatabaseContext } from "../context/DatabaseContext.jsx";
import { computeCountdown } from "../utils/countdown.js";

const VALID_UNITS = ["wks_days", "days", "hours"];

export function useDueDate() {
  const { adapter, resetKey } = useDatabaseContext();
  const [dueDate, setDueDateState] = useState(null);
  const [countdownUnit, setCountdownUnitState] = useState("wks_days");

  useEffect(() => {
    adapter.getSettings().then((settings) => {
      setDueDateState(settings?.dueDate || null);
      setCountdownUnitState(
        VALID_UNITS.includes(settings?.countdownUnit) ? settings.countdownUnit : "wks_days"
      );
    });
  }, [adapter, resetKey]);

  const setDueDate = (iso) => {
    setDueDateState(iso);
    adapter.saveSettings({ dueDate: iso || null }).catch(() => {});
  };

  const clearDueDate = () => {
    setDueDateState(null);
    adapter.saveSettings({ dueDate: null }).catch(() => {});
  };

  const setCountdownUnit = (unit) => {
    setCountdownUnitState(unit);
    adapter.saveSettings({ countdownUnit: unit }).catch(() => {});
  };

  const countdown = useMemo(
    () => (dueDate ? computeCountdown(dueDate, new Date(), countdownUnit) : null),
    [dueDate, countdownUnit]
  );

  return { dueDate, setDueDate, clearDueDate, countdownUnit, setCountdownUnit, countdown };
}

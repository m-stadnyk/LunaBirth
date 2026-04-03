import { useState, useEffect, useMemo } from "react";
import { storage } from "../utils/storage.js";
import { computeCountdown } from "../utils/countdown.js";

const KEY_DATE = "luna_due_date";
const KEY_UNIT = "luna_countdown_unit";

export function useDueDate() {
  const [dueDate, setDueDateState] = useState(null);
  const [countdownUnit, setCountdownUnitState] = useState("wks_days");

  useEffect(() => {
    Promise.all([storage.get(KEY_DATE), storage.get(KEY_UNIT)]).then(
      ([storedDate, storedUnit]) => {
        if (storedDate?.value) setDueDateState(storedDate.value);
        if (["wks_days", "days", "hours"].includes(storedUnit?.value)) {
          setCountdownUnitState(storedUnit.value);
        }
      }
    );
  }, []);

  const setDueDate = (iso) => {
    setDueDateState(iso);
    storage.set(KEY_DATE, iso);
  };

  const clearDueDate = () => {
    setDueDateState(null);
    storage.set(KEY_DATE, "");
  };

  const setCountdownUnit = (unit) => {
    setCountdownUnitState(unit);
    storage.set(KEY_UNIT, unit);
  };

  const countdown = useMemo(
    () => (dueDate ? computeCountdown(dueDate, new Date(), countdownUnit) : null),
    [dueDate, countdownUnit]
  );

  return { dueDate, setDueDate, clearDueDate, countdownUnit, setCountdownUnit, countdown };
}

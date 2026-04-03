/**
 * computeCountdown
 * @param {Date|string|null} dueDate
 * @param {Date} now
 * @param {'days'|'hours'|'wks_days'} unit
 * @returns {{ overdue: boolean, primary: number, primaryLabel: string,
 *             secondary: number|null, secondaryLabel: string|null } | null}
 */
export function computeCountdown(dueDate, now, unit) {
  if (dueDate == null) return null;

  const due = dueDate instanceof Date ? dueDate : new Date(dueDate);
  const diffMs = due.getTime() - now.getTime();
  const overdue = diffMs < 0;
  const absMs = Math.abs(diffMs);

  const totalHours = Math.floor(absMs / (1000 * 60 * 60));
  const totalDays = Math.floor(absMs / (1000 * 60 * 60 * 24));

  if (unit === "hours") {
    return { overdue, primary: totalHours, primaryLabel: "hours", secondary: null, secondaryLabel: null };
  }

  if (unit === "days") {
    return { overdue, primary: totalDays, primaryLabel: "days", secondary: null, secondaryLabel: null };
  }

  // wks_days
  const weeks = Math.floor(totalDays / 7);
  const remDays = totalDays % 7;
  return { overdue, primary: weeks, primaryLabel: "weeks", secondary: remDays, secondaryLabel: "days" };
}

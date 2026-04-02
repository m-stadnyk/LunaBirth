/**
 * Formats the time remaining until a due date.
 *
 * @param {number} dueDateMs - Due date as a ms timestamp
 * @param {"weeks"|"days"|"hours"} [format="weeks"]
 * @returns {{ primary: string, secondary: string, label: string, overdue: boolean }}
 */
export function formatCountdown(dueDateMs, format = "weeks") {
  const msLeft = dueDateMs - Date.now();

  if (msLeft <= 0) {
    return {
      primary: "0",
      secondary: format === "weeks" ? "days" : format,
      label: "Baby's due date has passed 🎉",
      overdue: true,
    };
  }

  const totalHours = Math.floor(msLeft / (1000 * 60 * 60));
  const totalDays = Math.floor(msLeft / (1000 * 60 * 60 * 24));
  const weeks = Math.floor(totalDays / 7);
  const days = totalDays % 7;

  switch (format) {
    case "weeks":
      return {
        primary: `${weeks} weeks`,
        secondary: `${days} days`,
        label: `${weeks}w ${days}d remaining`,
        overdue: false,
      };
    case "days":
      return {
        primary: `${totalDays}`,
        secondary: "days",
        label: `${totalDays} days remaining`,
        overdue: false,
      };
    case "hours":
      return {
        primary: `${totalHours}`,
        secondary: "hours",
        label: `${totalHours} hours remaining`,
        overdue: false,
      };
    default:
      return formatCountdown(dueDateMs, "weeks");
  }
}

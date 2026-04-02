/**
 * Generates a pre-filled Google Calendar "add event" URL for an all-day event.
 * No OAuth required — opens Google Calendar in the browser with fields pre-filled.
 *
 * @param {{ title: string, date: Date | number }} options
 * @returns {string}
 */
export function generateCalendarUrl({ title, date }) {
  const d = date instanceof Date ? date : new Date(date);
  const pad = (n) => String(n).padStart(2, "0");
  const dateStr =
    `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}`;

  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: title,
    dates: `${dateStr}/${dateStr}`,
  });

  return `https://www.google.com/calendar/render?${params.toString()}`;
}

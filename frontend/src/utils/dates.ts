const pad = (n: number) => String(n).padStart(2, '0');

/** yyyy-MM-dd in the browser's local time zone. */
export const toDateInput = (d: Date): string =>
  `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

/** yyyy-MM-ddTHH:mm in the browser's local time zone (for datetime-local inputs). */
export const toDateTimeInput = (d: Date): string =>
  `${toDateInput(d)}T${pad(d.getHours())}:${pad(d.getMinutes())}`;

/**
 * Default working day for scheduling: today if it is Mon-Fri,
 * otherwise the following Monday (operating rooms run Mon-Fri).
 */
export const defaultScheduleDate = (): string => {
  const d = new Date();
  while (d.getDay() === 0 || d.getDay() === 6) {
    d.setDate(d.getDate() + 1);
  }
  return toDateInput(d);
};

/** Builds a local datetime-local value for a given yyyy-MM-dd and hh:mm. */
export const atTime = (date: string, time: string): string => `${date}T${time}`;

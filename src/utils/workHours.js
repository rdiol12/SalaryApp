/**
 * Hour counts used by the global (monthly salary) settings:
 *  - night hours (שעות לילה): hours worked between 22:00 and 06:00, as in
 *    Israeli labor law. A shift with at least 2 hours in that window is a
 *    night shift (משמרת לילה).
 *  - contract minimums: minimum weekly and monthly hours set on the job,
 *    and how the hours worked compare to them.
 */
import { parseDateLocal, formatDateLocal } from "./shiftFilters.js";

export const NIGHT_START_MIN = 22 * 60; // 22:00
export const NIGHT_END_MIN = 6 * 60; // 06:00
export const NIGHT_SHIFT_MIN_HOURS = 2;

const WORK_TYPES = ["עבודה", "שבת"];
const DAY = 24 * 60;

export const isWorkShift = (shift) => WORK_TYPES.includes(shift?.type);

const toMinutes = (str) => {
  if (!str || typeof str !== "string") return null;
  const [h, m] = str.split(":").map(Number);
  if (!Number.isFinite(h) || !Number.isFinite(m)) return null;
  return h * 60 + m;
};

const overlap = (a1, a2, b1, b2) => Math.max(0, Math.min(a2, b2) - Math.max(a1, b1));

/** Hours between 22:00 and 06:00 in a shift from startTime to endTime ("HH:MM"). */
export const computeNightHours = (startTime, endTime) => {
  const start = toMinutes(startTime);
  let end = toMinutes(endTime);
  if (start === null || end === null) return 0;
  if (end <= start) end += DAY; // crosses midnight
  // Night windows touching a shift that starts on day 0 and may end on day 1:
  // previous night (-2h..06:00), this night (22:00..30:00), next night.
  let minutes = 0;
  for (let d = -1; d <= 1; d++) {
    const nStart = NIGHT_START_MIN + d * DAY;
    const nEnd = NIGHT_END_MIN + (d + 1) * DAY;
    minutes += overlap(start, end, nStart, nEnd);
  }
  return minutes / 60;
};

export const shiftNightHours = (shift) =>
  isWorkShift(shift) ? computeNightHours(shift.startTime, shift.endTime) : 0;

export const isNightShift = (shift) =>
  shiftNightHours(shift) >= NIGHT_SHIFT_MIN_HOURS;

/** Whether night hours are counted for this job (default: yes). */
export const isNightHoursCounted = (config) => config?.countNightHours !== false;

/** @param shifts array of shift objects */
export const summarizeNightHours = (shifts) => {
  let nightHours = 0;
  let nightShiftCount = 0;
  (shifts || []).forEach((s) => {
    const h = shiftNightHours(s);
    nightHours += h;
    if (h >= NIGHT_SHIFT_MIN_HOURS) nightShiftCount += 1;
  });
  return { nightHours, nightShiftCount };
};

const positiveOrNull = (v) => {
  const n = Number(v);
  return v !== "" && v !== null && v !== undefined && Number.isFinite(n) && n > 0 ? n : null;
};

/** Minimum weekly / monthly hours from the job's contract (null = not set). */
export const getContractMinimums = (config) => ({
  weekly: positiveOrNull(config?.minWeeklyHours),
  monthly: positiveOrNull(config?.minMonthlyHours),
});

export const sumWorkHours = (shifts) =>
  (shifts || [])
    .filter(isWorkShift)
    .reduce((sum, s) => sum + Number(s.totalHours || 0), 0);

/** Compare hours to a minimum. Returns null when no minimum is set. */
export const compareToMinimum = (hours, minimum) => {
  if (!minimum) return null;
  const diff = hours - minimum;
  return { hours, minimum, diff, met: diff >= -1e-9, missing: Math.max(0, -diff) };
};

/**
 * Group shifts by week (Sunday to Saturday) and compare each week's hours
 * to the weekly minimum.
 * @param shifts array of shifts with a `date` ("YYYY-MM-DD")
 */
export const weeklyHours = (shifts, weeklyMinimum = null) => {
  const weeks = {};
  (shifts || []).forEach((s) => {
    if (!s?.date || !isWorkShift(s)) return;
    const d = parseDateLocal(s.date);
    const start = new Date(d.getFullYear(), d.getMonth(), d.getDate() - d.getDay());
    const key = formatDateLocal(start);
    weeks[key] = (weeks[key] || 0) + Number(s.totalHours || 0);
  });
  return Object.keys(weeks)
    .sort()
    .map((weekStart) => ({
      weekStart,
      hours: weeks[weekStart],
      comparison: compareToMinimum(weeks[weekStart], weeklyMinimum),
    }));
};

export const formatHours = (h) => {
  const n = Number(h) || 0;
  return Number.isInteger(n) ? String(n) : n.toFixed(1);
};

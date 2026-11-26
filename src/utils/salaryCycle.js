/**
 * Salary cycle (מחזור שכר): which days belong to a salary month.
 *
 * Two kinds of cycle:
 *  - End of month (סוף חודש): the salary month is the calendar month, from the
 *    1st to its last day (28, 29, 30 or 31, leap years included). Chosen with
 *    `salaryCycleEndOfMonth: true`, or a start day of 1 (how older configs
 *    asked for a calendar month).
 *  - Custom start day: e.g. start 25 → the November salary month runs from
 *    25 October to 24 November. A start day a month doesn't have (29–31) is
 *    moved to that month's last day, so cycles never skip or repeat a day.
 *
 * Months are 0-based (JavaScript Date), dates are "YYYY-MM-DD" local dates.
 */

const parseDateLocal = (dateStr) => {
  const [y, m, d] = dateStr.split("-").map(Number);
  return new Date(y, m - 1, d);
};

export const daysInMonth = (year, month) => new Date(year, month + 1, 0).getDate();

/** Whether the job's salary month ends on the last day of the calendar month. */
export const isEndOfMonthCycle = (config) => {
  if (config?.salaryCycleEndOfMonth === true) return true;
  // "Set dates" was chosen; a start day of 1 still gives a calendar month.
  if (config?.salaryCycleEndOfMonth === false) return false;
  return getRawStartDay(config) === 1;
};

const getRawStartDay = (config) => {
  const n = parseInt(config?.salaryStartDay, 10);
  return Number.isInteger(n) && n >= 1 && n <= 31 ? n : 1;
};

/** Day of the month a cycle starts on (1 for an end-of-month cycle). */
export const getCycleStartDay = (config) =>
  isEndOfMonthCycle(config) ? 1 : getRawStartDay(config);

// The day a cycle starting on `startDay` actually starts in a given month.
const startInMonth = (startDay, year, month) =>
  Math.min(startDay, daysInMonth(year, month));

/**
 * First and last day of the salary month `month`/`year`.
 * @returns {{ start: Date, end: Date, days: number }}
 */
export const getSalaryCycleRange = (config, month, year) => {
  const startDay = getCycleStartDay(config);
  let start;
  let end;
  if (startDay === 1) {
    start = new Date(year, month, 1);
    end = new Date(year, month, daysInMonth(year, month));
  } else {
    const prev = new Date(year, month - 1, 1);
    start = new Date(
      prev.getFullYear(),
      prev.getMonth(),
      startInMonth(startDay, prev.getFullYear(), prev.getMonth()),
    );
    end = new Date(year, month, startInMonth(startDay, year, month) - 1);
  }
  const days = Math.round((end - start) / 86400000) + 1;
  return { start, end, days };
};

/** The salary month a date belongs to: { month, year }. */
export const getSalaryMonthOf = (config, dateStr) => {
  const d = typeof dateStr === "string" ? parseDateLocal(dateStr) : dateStr;
  const month = d.getMonth();
  const year = d.getFullYear();
  const startDay = getCycleStartDay(config);
  if (startDay === 1 || d.getDate() < startInMonth(startDay, year, month)) {
    return { month, year };
  }
  const next = new Date(year, month + 1, 1);
  return { month: next.getMonth(), year: next.getFullYear() };
};

/** Whether a date falls in the salary month `month`/`year`. */
export const isDateInSalaryMonth = (config, dateStr, month, year) => {
  const m = getSalaryMonthOf(config, dateStr);
  return m.month === month && m.year === year;
};

const fmtDay = (d) => `${d.getDate()}.${d.getMonth() + 1}`;

/** "25.10 – 24.11" or "1.2 – 29.2" for the payslip. */
export const formatSalaryCycleRange = (config, month, year) => {
  const { start, end } = getSalaryCycleRange(config, month, year);
  return `${fmtDay(start)} – ${fmtDay(end)}`;
};

/** Short description of the cycle for settings: "1 עד סוף החודש" / "25 עד 24". */
export const describeSalaryCycle = (config) => {
  const startDay = getCycleStartDay(config);
  if (startDay === 1) return "מה-1 ועד סוף החודש (28–31 ימים לפי החודש)";
  return `מה-${startDay} ועד ה-${startDay - 1} בחודש הבא`;
};

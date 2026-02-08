export const parseDateLocal = (dateStr) => {
  const [y, m, d] = dateStr.split("-").map(Number);
  return new Date(y, m - 1, d);
};

export const formatDateLocal = (dateObj) => {
  return `${dateObj.getFullYear()}-${String(dateObj.getMonth() + 1).padStart(2, "0")}-${String(dateObj.getDate()).padStart(2, "0")}`;
};

/**
 * Get shifts filtered to a specific month's salary cycle.
 * @param {Object} shifts - all shifts keyed by date string
 * @param {Object} config - app config with salaryStartDay/salaryEndDay
 * @param {number} targetMonth - 0-based month index
 * @param {number} targetYear - full year
 * @param {Function} calculateEarned - function(dateStr, data) => earned amount
 * @returns {Array} sorted array of shift objects with .earned
 */
export const getFilteredShiftsForMonth = (
  shifts,
  config,
  targetMonth,
  targetYear,
  calculateEarned,
) => {
  const start = parseInt(config.salaryStartDay) || 1;
  // Derive end day to be one day before the start, ensuring no gaps.
  // If start is 25, end is 24. If start is 1, end is last day of month (handled by calendar).
  const end = start === 1 ? 31 : start - 1;

  return Object.keys(shifts)
    .filter((dStr) => {
      const d = parseDateLocal(dStr);
      const day = d.getDate();
      const m = d.getMonth();
      const y = d.getFullYear();

      // Standard calendar month
      if (start === 1) return m === targetMonth && y === targetYear;

      // Custom cycle: e.g., 25th of prev month to 24th of target month
      const prevMonth = targetMonth === 0 ? 11 : targetMonth - 1;
      const prevYear = targetMonth === 0 ? targetYear - 1 : targetYear;

      const isPrevMonthMatch =
        m === prevMonth && y === prevYear && day >= start;
      const isCurrMonthMatch =
        m === targetMonth && y === targetYear && day <= end;

      return isPrevMonthMatch || isCurrMonthMatch;
    })
    .map((date) => ({
      date,
      ...shifts[date],
      earned: calculateEarned(date, shifts[date]),
    }))
    .sort((a, b) => parseDateLocal(b.date) - parseDateLocal(a.date));
};

/**
 * Hebrew month names
 */
export const HEBREW_MONTHS = [
  "ינואר",
  "פברואר",
  "מרץ",
  "אפריל",
  "מאי",
  "יוני",
  "יולי",
  "אוגוסט",
  "ספטמבר",
  "אוקטובר",
  "נובמבר",
  "דצמבר",
];

/**
 * Format a month/year label in Hebrew
 */
export const formatMonthLabel = (month, year) => {
  return `${HEBREW_MONTHS[month]} ${year}`;
};

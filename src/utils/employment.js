/**
 * Employment type helpers.
 *
 * The app supports two kinds of workers:
 *  - "hourly": paid per hour worked (the original behaviour)
 *  - "global": fixed monthly salary (שכר גלובלי). Hours are still tracked,
 *    and an implied hourly value (salary / standard monthly hours) is used
 *    for per-shift displays, sick-day deductions and optional overtime.
 */

export const EMPLOYMENT_HOURLY = "hourly";
export const EMPLOYMENT_GLOBAL = "global";

// Israeli standard divisor for a full-time monthly position (42h week).
export const DEFAULT_STANDARD_MONTHLY_HOURS = 182;

export const isGlobalWorker = (config) =>
  config?.employmentType === EMPLOYMENT_GLOBAL;

export const getMonthlySalary = (config) => Number(config?.monthlySalary || 0);

export const getStandardMonthlyHours = (config) => {
  const h = Number(config?.standardMonthlyHours);
  return Number.isFinite(h) && h > 0 ? h : DEFAULT_STANDARD_MONTHLY_HOURS;
};

/**
 * Hourly rate used for all per-hour calculations.
 * For a global worker this is the implied value of one hour.
 */
export const getHourlyRate = (config) => {
  if (isGlobalWorker(config)) {
    return getMonthlySalary(config) / getStandardMonthlyHours(config);
  }
  return Number(config?.hourlyRate || 0);
};

/** Whether overtime is already included in the global salary (default: yes). */
export const isGlobalOvertimeIncluded = (config) =>
  config?.globalOvertimeIncluded !== false;

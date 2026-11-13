/**
 * Named bonuses of a job (e.g. "מענק חג", "בונוס מכירות").
 * Stored in the job settings as config.bonuses:
 *   { id, name, amount, month }
 * month is "YYYY-MM" for a bonus paid in one salary month only, or null for a
 * bonus paid every month. Bonuses are taxable and subject to national
 * insurance, but not pensionable.
 */
import { HEBREW_MONTHS } from "./shiftFilters.js";

/** Salary-month key of a date, e.g. "2026-11". */
export const monthKeyOf = (date) =>
  date
    ? `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`
    : null;

export const monthKeyLabel = (key) => {
  if (!key) return "";
  const [y, m] = key.split("-").map(Number);
  return `${HEBREW_MONTHS[m - 1]} ${y}`;
};

export const newBonus = ({ name = "", amount = "", month = null } = {}) => ({
  id: `bonus_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
  name,
  amount,
  month,
});

/**
 * Bonuses paid in the given salary month: every-month bonuses, plus those
 * set for that month. Without a month, only the every-month ones.
 */
export const getMonthBonuses = (config, monthKey) =>
  (Array.isArray(config?.bonuses) ? config.bonuses : [])
    .filter((b) => !b.month || b.month === monthKey)
    .map((b) => ({
      id: b.id,
      name: (b.name || "").trim() || "בונוס",
      amount: Math.max(0, Number(b.amount) || 0),
      everyMonth: !b.month,
    }))
    .filter((b) => b.amount > 0);

/**
 * Shared overtime calculation utilities.
 * Used by CalendarView, ShiftDetailsModal, AdvancedStats, and useShifts hook.
 */

/**
 * Get overtime tiers from config, with fallback to default tiers.
 * @param {Object} config - App configuration
 * @returns {Array} Array of tier objects with from, to, multiplier
 */
export function getOvertimeTiers(config) {
  const tiers = Array.isArray(config?.overtimeTiers)
    ? config.overtimeTiers
    : [];
  if (tiers.length > 0) return tiers;

  const threshold = Number(config?.overtimeStartThreshold || 0);
  const mult = Number(config?.overtimeMultiplier || 1.25);

  if (!threshold) return [{ from: 0, to: null, multiplier: 1 }];

  return [
    { from: 0, to: threshold, multiplier: 1 },
    { from: threshold, to: null, multiplier: mult },
  ];
}

/**
 * Compute tiered pay breakdown for given hours.
 * @param {number} hours - Total hours worked
 * @param {number} rate - Hourly rate
 * @param {number} percent - Percentage of hourly rate (0-1)
 * @param {Object} config - App configuration
 * @returns {Array} Array of breakdown objects with from, to, hours, amount, multiplier
 */
export function computeTieredBreakdown(hours, rate, percent, config) {
  const tiers = getOvertimeTiers(config)
    .map((t) => ({
      from: Number(t.from || 0),
      to: t.to === null || t.to === "" ? null : Number(t.to),
      multiplier: Number(t.multiplier || 1),
    }))
    .filter((t) => Number.isFinite(t.from) && Number.isFinite(t.multiplier))
    .sort((a, b) => a.from - b.from);

  const breakdown = [];
  tiers.forEach((tier) => {
    const end = tier.to === null ? Infinity : tier.to;
    const tierHours = Math.max(0, Math.min(hours, end) - tier.from);
    if (tierHours <= 0) return;
    const amount = tierHours * rate * percent * tier.multiplier;
    breakdown.push({ ...tier, hours: tierHours, amount });
  });

  return breakdown;
}

/**
 * Compute total tiered pay (sum of all tier amounts).
 * @param {number} hours - Total hours worked
 * @param {number} rate - Hourly rate
 * @param {number} percent - Percentage of hourly rate (0-1)
 * @param {Object} config - App configuration
 * @returns {number} Total pay amount
 */
export function computeTieredTotal(hours, rate, percent, config) {
  const breakdown = computeTieredBreakdown(hours, rate, percent, config);
  return breakdown.reduce((sum, b) => sum + b.amount, 0);
}

/**
 * Get color for shift type.
 * @param {string} type - Shift type (עבודה, שבת, מחלה, חופש)
 * @param {Object} theme - Theme object with color values
 * @returns {string} Color value
 */
export function getTypeColor(type, theme) {
  if (type === "חופש") return theme.green;
  if (type === "מחלה") return theme.red;
  if (type === "שבת") return theme.purple;
  return theme.accent;
}

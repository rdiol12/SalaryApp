/**
 * Configuration validation utilities
 */
import { PRESETS } from "./shiftUtils.js";

export const isEmpty = (v) =>
  v === undefined || v === null || String(v).trim() === "";

export const toNumber = (v) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : NaN;
};

export const defaultTiers = [
  { from: 0, to: 8, multiplier: 1 },
  { from: 8, to: 10, multiplier: 1.25 },
  { from: 10, to: 12, multiplier: 1.4 },
  { from: 12, to: null, multiplier: 1.4 },
];

export const normalizeConfig = (cfg) => ({
  shiftTemplates: [],
  overtimeTiers: defaultTiers,
  presets: PRESETS,
  ...cfg,
});

export const validateConfig = (cfg) => {
  const errors = {};
  const start = parseInt(cfg.salaryStartDay, 10);
  const end = parseInt(cfg.salaryEndDay, 10);

  if (!Number.isInteger(start) || start < 1 || start > 31)
    errors.salaryStartDay = "טווח 1-31";
  if (!Number.isInteger(end) || end < 1 || end > 31)
    errors.salaryEndDay = "טווח 1-31";

  const hourlyRate = toNumber(cfg.hourlyRate);
  if (!Number.isFinite(hourlyRate) || hourlyRate < 0)
    errors.hourlyRate = "מספר חיובי";

  const travel = toNumber(cfg.travelDaily);
  if (!Number.isFinite(travel) || travel < 0) errors.travelDaily = "מספר חיובי";

  const goal = toNumber(cfg.monthlyGoal);
  if (!Number.isFinite(goal) || goal < 0) errors.monthlyGoal = "מספר חיובי";

  const monthlyBonus = toNumber(cfg.monthlyBonus);
  if (!Number.isFinite(monthlyBonus) || monthlyBonus < 0)
    errors.monthlyBonus = "מספר חיובי";

  const credit = toNumber(cfg.creditPoints);
  if (!Number.isFinite(credit) || credit < 0 || credit > 10)
    errors.creditPoints = "0-10";

  const pension = toNumber(cfg.pensionRate);
  if (!Number.isFinite(pension) || pension < 0 || pension > 1)
    errors.pensionRate = "0-1";

  if (cfg.isBreakDeducted) {
    const breakMin = toNumber(cfg.breakDeduction);
    if (!Number.isFinite(breakMin) || breakMin < 0 || breakMin > 180)
      errors.breakDeduction = "0-180";
  }

  if (isEmpty(cfg.userName)) errors.userName = "חובה";

  const tiers = Array.isArray(cfg.overtimeTiers) ? cfg.overtimeTiers : [];
  if (tiers.length === 0) errors.overtimeTiers = "חובה";
  tiers.forEach((t, i) => {
    const from = toNumber(t.from);
    const to = t.to === null || t.to === "" ? null : toNumber(t.to);
    const mult = toNumber(t.multiplier);
    if (!Number.isFinite(from) || from < 0) errors[`tier_from_${i}`] = "מספר";
    if (to !== null && (!Number.isFinite(to) || to <= from))
      errors[`tier_to_${i}`] = "גדול מ-מ";
    if (!Number.isFinite(mult) || mult < 0.5 || mult > 3)
      errors[`tier_mult_${i}`] = "0.5-3";
  });
  const sorted = tiers
    .map((t, idx) => ({
      idx,
      from: toNumber(t.from),
      to: t.to === null || t.to === "" ? null : toNumber(t.to),
    }))
    .filter((t) => Number.isFinite(t.from))
    .sort((a, b) => a.from - b.from);
  sorted.forEach((t, i) => {
    if (t.to === null && i !== sorted.length - 1)
      errors[`tier_to_${t.idx}`] = "חייב להיות אחרון";
    if (i > 0) {
      const prev = sorted[i - 1];
      const prevTo = prev.to === null ? prev.from : prev.to;
      if (Number.isFinite(prevTo) && t.from < prevTo)
        errors[`tier_from_${t.idx}`] = "טווח חופף";
    }
  });

  return errors;
};

export const emptyTemplate = () => ({
  id: Date.now().toString(),
  name: "",
  type: "עבודה",
  startTime: "08:00",
  endTime: "17:00",
  hourlyPercent: "100",
  bonus: "0",
});

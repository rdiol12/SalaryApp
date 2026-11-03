/**
 * Extra funds the worker adds in settings (קרן השתלמות, קופת גמל, ...).
 * Stored in config.extraFunds as
 *   { id, name, kind: "studyFund" | "other", employeePct, employerPct }
 * with percentages as entered ("2.5" = 2.5%). getExtraFunds() returns
 * employeeRate / employerRate as fractions.
 */

export const FUND_PRESETS = [
  { name: "קרן השתלמות", kind: "studyFund", employeePct: "2.5", employerPct: "7.5" },
  { name: "קופת גמל", kind: "other", employeePct: "5", employerPct: "5" },
];

const pctToRate = (v) => {
  const n = Number(v);
  return Number.isFinite(n) && n >= 0 && n <= 100 ? n / 100 : 0;
};

export const newFund = (preset = {}) => ({
  id: `fund_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
  name: preset.name || "",
  kind: preset.kind || "other",
  employeePct: preset.employeePct ?? "0",
  employerPct: preset.employerPct ?? "0",
});

export const getExtraFunds = (config) =>
  (Array.isArray(config?.extraFunds) ? config.extraFunds : []).map((f) => ({
    id: f.id,
    name: f.name || "הפרשה",
    kind: f.kind === "studyFund" ? "studyFund" : "other",
    employeeRate: pctToRate(f.employeePct),
    employerRate: pctToRate(f.employerPct),
  }));

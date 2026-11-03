/**
 * Multiple jobs per worker.
 *
 * Stored config shape:
 *   {
 *     userName, creditPoints, monthlyGoal, enabledModules, defaultView, ...
 *     jobs: [
 *       { id, name, isPrimary, taxCoordination, coordinatedTaxRate,
 *         settings: { employmentType, hourlyRate, travelDaily, ... } },
 *     ],
 *     activeJobId,
 *   }
 *
 * Settings that belong to a person (name, credit points, goal, display)
 * stay at the top level. Everything about pay (rate, travel, pension, funds,
 * overtime, salary cycle, ...) lives on each job.
 *
 * Most of the app works on a "job config": the person fields merged with the
 * active job's settings, so existing code that reads config.hourlyRate etc.
 * keeps working unchanged.
 *
 * Shifts are stored per job. The first job keeps the original "shifts" key,
 * so data saved before this feature belongs to it.
 */
import { parseDateLocal, formatDateLocal, getFilteredShiftsForMonth } from "./shiftFilters.js";
import { getHourlyRate } from "./employment.js";
import { computeTieredTotal } from "./overtimeUtils.js";
import { calculateNetSalary } from "./calculations.js";
import { PRESETS } from "./shiftUtils.js";

export const MAIN_JOB_ID = "main";

// Settings that are kept separately for each job.
export const JOB_FIELDS = [
  "employmentType",
  "hourlyRate",
  "monthlySalary",
  "standardMonthlyHours",
  "globalOvertimeIncluded",
  "salaryStartDay",
  "salaryEndDay",
  "isBreakDeducted",
  "breakDeduction",
  "travelDaily",
  "travelMonthlyFixed",
  "monthlyBonus",
  "pensionRate",
  "extraFunds",
  "overtimeStartThreshold",
  "overtimeMultiplier",
  "overtimeTiers",
  "shiftTemplates",
  "presets",
];

export const DEFAULT_JOB_SETTINGS = {
  employmentType: "hourly",
  hourlyRate: "40",
  monthlySalary: "",
  standardMonthlyHours: "182",
  globalOvertimeIncluded: true,
  salaryStartDay: "25",
  salaryEndDay: "24",
  isBreakDeducted: true,
  breakDeduction: "30",
  travelDaily: "22.60",
  travelMonthlyFixed: "",
  monthlyBonus: "0",
  pensionRate: "0.06",
  extraFunds: [],
  overtimeStartThreshold: "9",
  overtimeMultiplier: "1.25",
  overtimeTiers: [
    { from: 0, to: 8, multiplier: 1 },
    { from: 8, to: 10, multiplier: 1.25 },
    { from: 10, to: 12, multiplier: 1.4 },
    { from: 12, to: null, multiplier: 1.4 },
  ],
  shiftTemplates: [],
  presets: PRESETS,
};

const pickJobFields = (source = {}) => {
  const out = {};
  JOB_FIELDS.forEach((k) => {
    if (source[k] !== undefined) out[k] = source[k];
  });
  return out;
};

const omitJobFields = (source = {}) => {
  const out = { ...source };
  JOB_FIELDS.forEach((k) => delete out[k]);
  return out;
};

export const newJobId = () =>
  `job_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;

export const createJob = ({ name, isPrimary = false, settings = {} } = {}) => ({
  id: newJobId(),
  name: name || "עבודה נוספת",
  isPrimary,
  taxCoordination: false,
  coordinatedTaxRate: "",
  settings: { ...DEFAULT_JOB_SETTINGS, ...settings },
});

/**
 * Converts any stored config (old single-job or new) into the multi-job
 * shape. The old top-level pay settings become the first job.
 */
export const migrateConfig = (config = {}) => {
  let jobs = Array.isArray(config.jobs) ? config.jobs : [];
  const person = omitJobFields(config);

  if (jobs.length === 0) {
    jobs = [
      {
        id: MAIN_JOB_ID,
        name: "עבודה 1",
        isPrimary: true,
        taxCoordination: false,
        coordinatedTaxRate: "",
        settings: { ...DEFAULT_JOB_SETTINGS, ...pickJobFields(config) },
      },
    ];
  }

  // Exactly one main job (the one that gets credit points).
  const primaryIdx = Math.max(0, jobs.findIndex((j) => j.isPrimary));
  jobs = jobs.map((j, i) => ({
    taxCoordination: false,
    coordinatedTaxRate: "",
    ...j,
    name: j.name || `עבודה ${i + 1}`,
    isPrimary: i === primaryIdx,
    settings: { ...DEFAULT_JOB_SETTINGS, ...(j.settings || {}) },
  }));

  const activeJobId = jobs.some((j) => j.id === config.activeJobId)
    ? config.activeJobId
    : jobs[primaryIdx].id;

  return { ...person, jobs, activeJobId };
};

export const getJobs = (config) =>
  Array.isArray(config?.jobs) ? config.jobs : [];

export const getJob = (config, jobId) =>
  getJobs(config).find((j) => j.id === jobId) || getJobs(config)[0] || null;

/**
 * The config one job is calculated with: person settings + that job's
 * settings + tax info about the job.
 */
export const getJobConfig = (config, jobId = config?.activeJobId) => {
  const job = getJob(config, jobId);
  if (!job) return config;
  return {
    ...config,
    ...job.settings,
    jobId: job.id,
    jobName: job.name,
    isPrimaryJob: !!job.isPrimary,
    taxCoordination: !!job.taxCoordination,
    coordinatedTaxRate: job.coordinatedTaxRate,
    hasMultipleJobs: getJobs(config).length > 1,
  };
};

const DERIVED_KEYS = [
  "jobId",
  "jobName",
  "isPrimaryJob",
  "taxCoordination",
  "coordinatedTaxRate",
  "hasMultipleJobs",
];

/**
 * Writes a job config (as edited by the settings screen) back into the full
 * config: pay fields go to that job, the rest to the person.
 */
export const applyJobConfig = (fullConfig, jobConfig, jobId = jobConfig?.jobId || fullConfig.activeJobId) => {
  const person = omitJobFields(jobConfig);
  DERIVED_KEYS.forEach((k) => delete person[k]);
  const jobs = (person.jobs || fullConfig.jobs || []).map((j) =>
    j.id === jobId
      ? { ...j, settings: { ...j.settings, ...pickJobFields(jobConfig) } }
      : j,
  );
  return { ...fullConfig, ...person, jobs };
};

/** AsyncStorage key that holds a job's shifts. */
export const shiftsStorageKey = (jobId) =>
  !jobId || jobId === MAIN_JOB_ID ? "shifts" : `shifts_${jobId}`;

const sickSequence = (shiftsMap, dateStr) => {
  let count = 1;
  const curr = parseDateLocal(dateStr);
  while (true) {
    curr.setDate(curr.getDate() - 1);
    const prev = formatDateLocal(curr);
    if (shiftsMap?.[prev] && shiftsMap[prev].type === "מחלה") count++;
    else break;
  }
  return count;
};

/**
 * Earnings of one shift (pay + shift bonus + daily travel), the same rules
 * the app uses for the active job.
 */
export const calculateShiftEarned = (dateStr, data, config, shiftsMap) => {
  let hours = Number(data.totalHours || 0);
  const rate = getHourlyRate(config);
  const percent = Number(data.hourlyPercent || 100) / 100;

  if (config.isBreakDeducted && hours > 6) {
    hours -= Number(config.breakDeduction || 0) / 60;
  }

  if (data.type === "מחלה") {
    const daySeq = sickSequence(shiftsMap, dateStr);
    if (daySeq === 1) return 0;
    if (daySeq === 2) return hours * rate * 0.5;
    return hours * rate;
  }

  const tiered = computeTieredTotal(hours, rate, percent, config);
  const travel = data.type === "עבודה" ? Number(config.travelDaily || 0) : 0;
  return tiered + Number(data.bonus || 0) + travel;
};

/**
 * Month summary across all jobs.
 * @param {Object} config full (multi-job) config
 * @param {Object} shiftsByJob { [jobId]: { [date]: shift } }
 * @param {Date} displayDate month being viewed
 */
export const calculateAllJobsSummary = (config, shiftsByJob, displayDate) => {
  const month = displayDate.getMonth();
  const year = displayDate.getFullYear();

  const jobs = getJobs(config).map((job) => {
    const jobConfig = getJobConfig(config, job.id);
    const shiftsMap = shiftsByJob?.[job.id] || {};
    const monthly = getFilteredShiftsForMonth(
      shiftsMap,
      jobConfig,
      month,
      year,
      (d, s) => calculateShiftEarned(d, s, jobConfig, shiftsMap),
    );
    const stats = calculateNetSalary(monthly, jobConfig);
    const shiftBonuses = monthly.reduce((sum, s) => sum + Number(s.bonus || 0), 0);
    return {
      id: job.id,
      name: job.name,
      isPrimary: !!job.isPrimary,
      stats,
      bonuses: Math.round(shiftBonuses + Number(jobConfig.monthlyBonus || 0)),
    };
  });

  const sum = (pick) => jobs.reduce((total, j) => total + (pick(j) || 0), 0);
  return {
    jobs,
    total: {
      gross: sum((j) => j.stats.gross),
      travel: sum((j) => j.stats.travel),
      bonuses: sum((j) => j.bonuses),
      tax: sum((j) => j.stats.tax),
      social: sum((j) => j.stats.social),
      pension: sum((j) => j.stats.pensionEmployee + j.stats.extraEmployeeTotal),
      net: sum((j) => j.stats.net),
      totalHours: sum((j) => Number(j.stats.totalHours)),
      shiftCount: sum((j) => j.stats.shiftCount),
    },
  };
};

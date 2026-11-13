import {
  migrateConfig,
  getJobConfig,
  applyJobConfig,
  createJob,
  shiftsStorageKey,
  calculateAllJobsSummary,
  MAIN_JOB_ID,
} from "../jobs.js";
import { calculateNetSalary } from "../calculations.js";

const oldConfig = {
  userName: "רון",
  creditPoints: "2.25",
  employmentType: "hourly",
  hourlyRate: "50",
  travelDaily: "20",
  salaryStartDay: "1",
  salaryEndDay: "31",
  isBreakDeducted: false,
  pensionRate: "0.06",
  monthlyBonus: "0",
};

describe("migrateConfig", () => {
  test("moves old pay settings into a main job", () => {
    const c = migrateConfig(oldConfig);
    expect(c.jobs).toHaveLength(1);
    expect(c.jobs[0].id).toBe(MAIN_JOB_ID);
    expect(c.jobs[0].isPrimary).toBe(true);
    expect(c.jobs[0].settings.hourlyRate).toBe("50");
    expect(c.hourlyRate).toBeUndefined();
    expect(c.userName).toBe("רון");
    expect(c.activeJobId).toBe(MAIN_JOB_ID);
  });

  test("keeps exactly one main job and a valid active job", () => {
    const c = migrateConfig({
      jobs: [
        { id: "a", name: "A", settings: {} },
        { id: "b", name: "B", isPrimary: true, settings: {} },
      ],
      activeJobId: "gone",
    });
    expect(c.jobs.map((j) => j.isPrimary)).toEqual([false, true]);
    expect(c.activeJobId).toBe("b");
  });
});

describe("job config", () => {
  test("merges person and job settings, and writes back to the job", () => {
    const full = migrateConfig(oldConfig);
    const jc = getJobConfig(full);
    expect(jc.hourlyRate).toBe("50");
    expect(jc.userName).toBe("רון");
    const next = applyJobConfig(full, { ...jc, hourlyRate: "60", userName: "דנה" });
    expect(next.jobs[0].settings.hourlyRate).toBe("60");
    expect(next.userName).toBe("דנה");
    expect(next.hourlyRate).toBeUndefined();
  });

  test("first job keeps the old shifts key", () => {
    expect(shiftsStorageKey(MAIN_JOB_ID)).toBe("shifts");
    expect(shiftsStorageKey("job_x")).toBe("shifts_job_x");
  });
});

const workShift = (date, hours = 8, extra = {}) => ({
  date,
  type: "עבודה",
  totalHours: String(hours),
  hourlyPercent: "100",
  bonus: "0",
  ...extra,
});

describe("calculateNetSalary", () => {
  test("daily travel is counted once", () => {
    const cfg = getJobConfig(migrateConfig(oldConfig));
    // 8h * 50 = 400 pay + 20 travel, as calculateEarned returns it
    const shifts = [workShift("2026-03-01"), workShift("2026-03-02")].map((s) => ({
      ...s,
      earned: 420,
    }));
    const r = calculateNetSalary(shifts, cfg);
    expect(r.travel).toBe(40);
    expect(r.gross).toBe(840);
  });

  test("secondary job without coordination: 47% and no credit points", () => {
    const cfg = { ...getJobConfig(migrateConfig(oldConfig)), travelDaily: "0", isPrimaryJob: false };
    const r = calculateNetSalary([{ ...workShift("2026-03-01"), earned: 1000 }], cfg);
    const pensionCredit = r.pensionCredit;
    expect(r.taxMode).toBe("secondary");
    expect(r.creditPointsUsed).toBe(0);
    expect(r.tax).toBe(Math.round(1000 * 0.47 - pensionCredit));
  });

  test("secondary job with tax coordination uses the certificate rate", () => {
    const cfg = {
      ...getJobConfig(migrateConfig(oldConfig)),
      travelDaily: "0",
      isPrimaryJob: false,
      taxCoordination: true,
      coordinatedTaxRate: "10",
    };
    const r = calculateNetSalary([{ ...workShift("2026-03-01"), earned: 1000 }], cfg);
    expect(r.taxMode).toBe("coordinated");
    expect(r.tax).toBe(Math.max(0, Math.round(100 - r.pensionCredit)));
  });

  test("monthly bonus is taxed and added to net", () => {
    const cfg = { ...getJobConfig(migrateConfig(oldConfig)), travelDaily: "0", creditPoints: "0", pensionRate: "0" };
    const base = calculateNetSalary([{ ...workShift("2026-03-01"), earned: 5000 }], cfg);
    const withBonus = calculateNetSalary(
      [{ ...workShift("2026-03-01"), earned: 5000 }],
      { ...cfg, monthlyBonus: "1000" },
    );
    expect(withBonus.tax).toBeGreaterThan(base.tax);
    expect(withBonus.net - base.net).toBeLessThan(1000);
    expect(withBonus.net - base.net).toBeGreaterThan(800);
  });
});

describe("calculateAllJobsSummary", () => {
  test("adds up every job, each with its own settings", () => {
    const full = migrateConfig(oldConfig);
    const second = createJob({
      name: "ערב",
      settings: { hourlyRate: "40", travelDaily: "10", salaryStartDay: "1", salaryEndDay: "31", isBreakDeducted: false },
    });
    full.jobs.push(second);
    const shiftsByJob = {
      [MAIN_JOB_ID]: { "2026-03-02": workShift("2026-03-02", 8, { bonus: "100" }) },
      [second.id]: { "2026-03-02": workShift("2026-03-02", 4) },
    };
    const s = calculateAllJobsSummary(full, shiftsByJob, new Date(2026, 2, 15));
    expect(s.jobs).toHaveLength(2);
    expect(s.jobs[0].stats.gross).toBe(400 + 100 + 20);
    expect(s.jobs[1].stats.gross).toBe(160 + 10);
    expect(s.jobs[1].stats.taxMode).toBe("secondary");
    expect(s.total.travel).toBe(30);
    expect(s.total.bonuses).toBe(100);
    expect(s.total.net).toBe(s.jobs[0].stats.net + s.jobs[1].stats.net);
    expect(s.total.totalHours).toBe(12);
  });
});

describe("pay basis and validation", () => {
  test("summary reports each job's rate or salary", () => {
    const full = migrateConfig({ ...oldConfig, hourlyRate: "" });
    const s = calculateAllJobsSummary(full, {}, new Date(2026, 2, 15));
    expect(s.jobs[0].payBasis).toEqual({ type: "hourly", amount: 0 });
  });

  test("an hourly job needs a rate above zero", () => {
    const { validateConfig } = require("../validation.js");
    const cfg = { ...getJobConfig(migrateConfig(oldConfig)), userName: "x" };
    expect(validateConfig({ ...cfg, hourlyRate: "" }).hourlyRate).toBeTruthy();
    expect(validateConfig({ ...cfg, hourlyRate: "45" }).hourlyRate).toBeUndefined();
    expect(
      validateConfig({ ...cfg, employmentType: "global", monthlySalary: "9000", hourlyRate: "" }).hourlyRate,
    ).toBeUndefined();
  });
});

describe("overtime tiers with a missing first tier", () => {
  const { computeTieredTotal } = require("../overtimeUtils.js");
  const tiers = [
    { from: 8, to: 10, multiplier: 1.25 },
    { from: 10, to: null, multiplier: 1.5 },
  ];

  test("hours below the first tier are paid at the regular rate", () => {
    expect(computeTieredTotal(6, 42, 1, { overtimeTiers: tiers })).toBeCloseTo(252);
    expect(computeTieredTotal(9, 42, 1, { overtimeTiers: tiers })).toBeCloseTo(8 * 42 + 42 * 1.25);
  });

  test("an hourly job with such tiers is paid for its shifts", () => {
    const full = migrateConfig({ ...oldConfig, hourlyRate: "42", travelDaily: "0", overtimeTiers: tiers });
    const shifts = {};
    for (let d = 1; d <= 7; d++) shifts[`2026-03-0${d}`] = workShift(`2026-03-0${d}`, 6);
    const s = calculateAllJobsSummary(full, { [MAIN_JOB_ID]: shifts }, new Date(2026, 2, 15));
    expect(s.jobs[0].stats.gross).toBe(7 * 6 * 42);
  });
});

describe("named bonuses", () => {
  const cfg = () => ({ ...getJobConfig(migrateConfig(oldConfig)), travelDaily: "0", creditPoints: "0" });
  const shifts = [{ ...workShift("2026-03-01"), earned: 5000 }];

  test("every-month and one-month bonuses are listed by name and taxed", () => {
    const c = {
      ...cfg(),
      bonuses: [
        { id: "a", name: "מענק חג", amount: "500", month: "2026-03" },
        { id: "b", name: "אחזקת רכב", amount: "200", month: null },
        { id: "c", name: "בונוס אפריל", amount: "900", month: "2026-04" },
      ],
    };
    const r = calculateNetSalary(shifts, c, "2026-03");
    expect(r.monthBonuses.map((b) => [b.name, b.amount])).toEqual([
      ["מענק חג", 500],
      ["אחזקת רכב", 200],
    ]);
    expect(r.monthlyBonus).toBe(700);
    const base = calculateNetSalary(shifts, cfg(), "2026-03");
    expect(r.tax).toBeGreaterThan(base.tax);
    expect(calculateNetSalary(shifts, c, "2026-04").monthlyBonus).toBe(1100);
  });

  test("the old fixed monthly bonus becomes a named every-month bonus", () => {
    const full = migrateConfig({ ...oldConfig, monthlyBonus: "300" });
    const s = full.jobs[0].settings;
    expect(s.monthlyBonus).toBe("0");
    expect(s.bonuses).toHaveLength(1);
    expect(s.bonuses[0]).toMatchObject({ name: "בונוס חודשי", amount: "300", month: null });
  });
});

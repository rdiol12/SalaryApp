import {
  computeNightHours,
  isNightShift,
  summarizeNightHours,
  getContractMinimums,
  compareToMinimum,
  weeklyHours,
} from "../workHours.js";
import { calculateNetSalary } from "../calculations.js";
import { validateConfig } from "../validation.js";

describe("night hours (22:00-06:00)", () => {
  test("day shift has no night hours", () => {
    expect(computeNightHours("08:00", "17:00")).toBe(0);
  });
  test("overnight shift", () => {
    expect(computeNightHours("23:00", "07:00")).toBe(7);
    expect(computeNightHours("20:00", "02:00")).toBe(4);
  });
  test("evening and early morning shifts", () => {
    expect(computeNightHours("15:00", "23:00")).toBe(1);
    expect(computeNightHours("04:00", "12:00")).toBe(2);
    expect(computeNightHours("05:30", "14:00")).toBe(0.5);
  });
  test("night shift needs at least 2 hours in the window", () => {
    expect(isNightShift({ type: "עבודה", startTime: "15:00", endTime: "23:00" })).toBe(false);
    expect(isNightShift({ type: "עבודה", startTime: "16:00", endTime: "00:00" })).toBe(true);
  });
  test("sick and vacation days are not counted", () => {
    const r = summarizeNightHours([
      { type: "עבודה", startTime: "23:00", endTime: "07:00" },
      { type: "מחלה", startTime: "23:00", endTime: "07:00" },
      { type: "שבת", startTime: "21:00", endTime: "23:00" },
    ]);
    expect(r).toEqual({ nightHours: 8, nightShiftCount: 1 });
  });
});

describe("contract minimums", () => {
  test("empty means no minimum", () => {
    expect(getContractMinimums({ minWeeklyHours: "", minMonthlyHours: "0" })).toEqual({
      weekly: null,
      monthly: null,
    });
    expect(compareToMinimum(10, null)).toBeNull();
  });
  test("comparison", () => {
    expect(compareToMinimum(30, 40)).toMatchObject({ met: false, missing: 10 });
    expect(compareToMinimum(42, 40)).toMatchObject({ met: true, missing: 0, diff: 2 });
  });
  test("weekly grouping starts on Sunday", () => {
    const weeks = weeklyHours(
      [
        { date: "2026-11-14", type: "עבודה", totalHours: "8" }, // Sat
        { date: "2026-11-15", type: "עבודה", totalHours: "9" }, // Sun
        { date: "2026-11-16", type: "שבת", totalHours: "6" },
        { date: "2026-11-17", type: "חופש", totalHours: "8" },
      ],
      12,
    );
    expect(weeks.map((w) => [w.weekStart, w.hours, w.comparison.met])).toEqual([
      ["2026-11-08", 8, false],
      ["2026-11-15", 15, true],
    ]);
  });
  test("validation", () => {
    const base = { employmentType: "global", monthlySalary: "10000", hourlyRate: "0", salaryStartDay: "1", salaryEndDay: "31", travelDaily: "0", monthlyGoal: "0" };
    expect(validateConfig({ ...base, minWeeklyHours: "200" }).minWeeklyHours).toBeDefined();
    expect(validateConfig({ ...base, minMonthlyHours: "160", minWeeklyHours: "40" }).minMonthlyHours).toBeUndefined();
  });
});

test("salary stats include night hours and monthly minimum", () => {
  const stats = calculateNetSalary(
    [
      { date: "2026-11-01", type: "עבודה", startTime: "22:00", endTime: "06:00", totalHours: "8" },
      { date: "2026-11-02", type: "עבודה", startTime: "08:00", endTime: "17:00", totalHours: "9" },
    ],
    { employmentType: "global", monthlySalary: "10000", minMonthlyHours: "20" },
  );
  expect(stats.nightHours).toBe(8);
  expect(stats.nightShiftCount).toBe(1);
  expect(stats.monthlyMinimum).toMatchObject({ hours: 17, minimum: 20, met: false, missing: 3 });
});

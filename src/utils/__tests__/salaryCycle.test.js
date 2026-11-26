import {
  daysInMonth,
  isEndOfMonthCycle,
  getSalaryCycleRange,
  getSalaryMonthOf,
  isDateInSalaryMonth,
  formatSalaryCycleRange,
} from "../salaryCycle.js";
import { getFilteredShiftsForMonth, formatDateLocal } from "../shiftFilters.js";
import { predictEOM } from "../calculations.js";
import { validateConfig } from "../validation.js";

const EOM = { salaryCycleEndOfMonth: true, salaryStartDay: "1" };
const day = (d) => formatDateLocal(d);

describe("end-of-month salary cycle", () => {
  test("ends on the real last day of every month, leap years included", () => {
    const cases = [
      [2026, 0, 31], [2026, 1, 28], [2026, 3, 30], [2026, 10, 30], [2026, 11, 31],
      [2028, 1, 29], [2100, 1, 28], [2000, 1, 29],
    ];
    cases.forEach(([y, m, last]) => {
      const r = getSalaryCycleRange(EOM, m, y);
      expect(day(r.start)).toBe(day(new Date(y, m, 1)));
      expect(r.end.getDate()).toBe(last);
      expect(r.end.getMonth()).toBe(m);
      expect(r.days).toBe(last);
    });
  });

  test("every day of a month is in that month's cycle and no other", () => {
    for (let d = 1; d <= 29; d++) {
      const dateStr = `2028-02-${String(d).padStart(2, "0")}`;
      expect(getSalaryMonthOf(EOM, dateStr)).toEqual({ month: 1, year: 2028 });
    }
    expect(getSalaryMonthOf(EOM, "2026-01-31")).toEqual({ month: 0, year: 2026 });
    expect(getSalaryMonthOf(EOM, "2026-12-31")).toEqual({ month: 11, year: 2026 });
  });

  test("a start day of 1 (older configs) is also a calendar month", () => {
    expect(isEndOfMonthCycle({ salaryStartDay: "1", salaryEndDay: "31" })).toBe(true);
    expect(isEndOfMonthCycle({ salaryStartDay: "25" })).toBe(false);
    expect(isEndOfMonthCycle({ salaryStartDay: "25", salaryCycleEndOfMonth: true })).toBe(true);
  });

  test("filters shifts to the calendar month", () => {
    const shifts = {
      "2026-01-31": { totalHours: 8 },
      "2026-02-01": { totalHours: 8 },
      "2026-02-28": { totalHours: 8 },
      "2026-03-01": { totalHours: 8 },
    };
    const feb = getFilteredShiftsForMonth(shifts, EOM, 1, 2026, () => 0).map((s) => s.date);
    expect(feb).toEqual(["2026-02-01", "2026-02-28"]);
  });

  test("payslip period shows the real end day", () => {
    expect(formatSalaryCycleRange(EOM, 1, 2028)).toBe("1.2 – 29.2");
    expect(formatSalaryCycleRange(EOM, 10, 2026)).toBe("1.11 – 30.11");
  });

  test("validation does not need an end day", () => {
    const errors = validateConfig({ ...EOM, salaryEndDay: "" });
    expect(errors.salaryStartDay).toBeUndefined();
    expect(errors.salaryEndDay).toBeUndefined();
  });
});

describe("custom start day", () => {
  const C25 = { salaryStartDay: "25" };

  test("25 → 24 across the year boundary", () => {
    const r = getSalaryCycleRange(C25, 0, 2027);
    expect(day(r.start)).toBe("2026-12-25");
    expect(day(r.end)).toBe("2027-01-24");
    expect(getSalaryMonthOf(C25, "2026-12-25")).toEqual({ month: 0, year: 2027 });
    expect(getSalaryMonthOf(C25, "2026-12-24")).toEqual({ month: 11, year: 2026 });
  });

  test("a start day the month lacks moves to its last day, with no gaps", () => {
    const C31 = { salaryStartDay: "31" };
    // Every day of 2027–2028 belongs to exactly one cycle, and cycles touch.
    let prevEnd = null;
    for (let i = 0; i < 24; i++) {
      const m = i % 12;
      const y = 2027 + Math.floor(i / 12);
      const r = getSalaryCycleRange(C31, m, y);
      if (prevEnd) expect(day(r.start)).toBe(day(new Date(prevEnd.getFullYear(), prevEnd.getMonth(), prevEnd.getDate() + 1)));
      for (let d = new Date(r.start); d <= r.end; d.setDate(d.getDate() + 1)) {
        expect(isDateInSalaryMonth(C31, day(d), m, y)).toBe(true);
      }
      prevEnd = r.end;
    }
    // March 2028 salary month: from 29 Feb (leap) to 30 March.
    const mar = getSalaryCycleRange(C31, 2, 2028);
    expect(day(mar.start)).toBe("2028-02-29");
    expect(day(mar.end)).toBe("2028-03-30");
  });
});

describe("forecast (predictEOM) uses the cycle's real length", () => {
  const stats = { net: 1000, shiftCount: 5, isGlobal: false };

  test("end-of-month: Feb 14 of 28 days doubles the pace", () => {
    const now = new Date(2026, 1, 14, 12);
    expect(predictEOM(stats, new Date(2026, 1, 1), null, EOM, now)).toBe(2000);
  });

  test("end-of-month: Jan 15 of 31 days", () => {
    const now = new Date(2026, 0, 15, 12);
    expect(predictEOM(stats, new Date(2026, 0, 1), null, EOM, now)).toBe(Math.round(1000 * 31 / 15));
  });

  test("past months are not forecast", () => {
    const now = new Date(2026, 1, 14, 12);
    expect(predictEOM(stats, new Date(2026, 0, 1), null, EOM, now)).toBe(1000);
  });

  test("custom start day 25: Dec 25 opens the January cycle", () => {
    const now = new Date(2026, 11, 25, 9);
    expect(predictEOM(stats, new Date(2027, 0, 1), null, { salaryStartDay: "25" }, now)).toBe(31000);
  });

  test("global salary is never extrapolated", () => {
    expect(predictEOM({ ...stats, isGlobal: true }, new Date(), null, EOM)).toBe(1000);
  });
});

test("daysInMonth", () => {
  expect(daysInMonth(2028, 1)).toBe(29);
  expect(daysInMonth(2027, 1)).toBe(28);
});

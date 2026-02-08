import { calculateNetSalary, predictEOM } from "../calculations.js";

describe("calculateNetSalary", () => {
  const baseConfig = {
    hourlyRate: 50,
    creditPoints: 2.25,
    pensionRate: 0.06,
    travelDaily: 20,
    monthlyBonus: 0,
  };

  const makeShift = (date, type, totalHours, earned) => ({
    date,
    type,
    totalHours,
    earned,
  });

  test("basic single work shift", () => {
    const shifts = [makeShift("2025-01-15", "עבודה", 8, 400)];
    const result = calculateNetSalary(shifts, baseConfig);

    expect(result.shiftCount).toBe(1);
    expect(result.totalHours).toBe("8.0");
    expect(result.travel).toBe(20);
    expect(result.sicknessPay).toBe(0);
    expect(result.net).toBeGreaterThan(0);
    // Gross for tax should be the shift earned (400) + sickness (0)
    // Gross returned includes travel: 400 + 20 = 420
    expect(result.gross).toBe(420);
  });

  test("multiple work shifts accumulate correctly", () => {
    const shifts = [
      makeShift("2025-01-01", "עבודה", 8, 400),
      makeShift("2025-01-02", "עבודה", 9, 500),
      makeShift("2025-01-03", "עבודה", 7, 350),
    ];
    const result = calculateNetSalary(shifts, baseConfig);

    expect(result.shiftCount).toBe(3);
    expect(result.totalHours).toBe("24.0");
    expect(result.travel).toBe(60); // 3 work days * 20
    // grossForTax = 400 + 500 + 350 = 1250
    expect(result.gross).toBe(1250 + 60); // 1310
  });

  test("sick days - first day pays nothing", () => {
    const shifts = [makeShift("2025-01-10", "מחלה", 8, 0)];
    const result = calculateNetSalary(shifts, baseConfig);

    expect(result.sicknessPay).toBe(0);
  });

  test("sick days - day 2 and 3 pay 50%", () => {
    const shifts = [
      makeShift("2025-01-10", "מחלה", 8, 0),
      makeShift("2025-01-11", "מחלה", 8, 0),
      makeShift("2025-01-12", "מחלה", 8, 0),
    ];
    const result = calculateNetSalary(shifts, baseConfig);

    // Day 1: 0
    // Day 2: 8 * 50 * 0.5 = 200
    // Day 3: 8 * 50 * 0.5 = 200
    expect(result.sicknessPay).toBe(400);
  });

  test("sick days - day 4+ pay 100%", () => {
    const shifts = [
      makeShift("2025-01-10", "מחלה", 8, 0),
      makeShift("2025-01-11", "מחלה", 8, 0),
      makeShift("2025-01-12", "מחלה", 8, 0),
      makeShift("2025-01-13", "מחלה", 8, 0),
    ];
    const result = calculateNetSalary(shifts, baseConfig);

    // Day 1: 0
    // Day 2: 200
    // Day 3: 200
    // Day 4: 8 * 50 = 400
    expect(result.sicknessPay).toBe(800);
  });

  test("sick day sequence resets after work shift", () => {
    const shifts = [
      makeShift("2025-01-10", "מחלה", 8, 0),
      makeShift("2025-01-11", "מחלה", 8, 0),
      makeShift("2025-01-12", "עבודה", 8, 400),
      makeShift("2025-01-13", "מחלה", 8, 0), // resets: this is day 1 again
    ];
    const result = calculateNetSalary(shifts, baseConfig);

    // First sequence: day1=0, day2=200
    // After work, second sequence: day1=0
    expect(result.sicknessPay).toBe(200);
  });

  test("pension calculations", () => {
    const shifts = [makeShift("2025-01-15", "עבודה", 8, 10000)];
    const result = calculateNetSalary(shifts, baseConfig);

    // grossForTax = 10000
    // pensionEmployee = 10000 * 0.06 = 600
    // pensionEmployer = 10000 * 0.065 = 650
    // severanceEmployer = 10000 * 0.06 = 600
    expect(result.pensionEmployee).toBe(600);
    expect(result.pensionEmployer).toBe(650);
    expect(result.severanceEmployer).toBe(600);
  });

  test("tax bracket calculation — low income (below first bracket)", () => {
    const shifts = [makeShift("2025-01-15", "עבודה", 8, 5000)];
    const result = calculateNetSalary(shifts, baseConfig);

    // grossForTax = 5000
    // pensionEmployee = 5000 * 0.06 = 300
    // taxable = 5000 - 300 = 4700
    // tax = 4700 * 0.10 = 470
    // creditPoints = 2.25 * 242 = 544.5
    // taxAfterCredits = max(0, 470 - 544.5) = 0
    expect(result.tax).toBe(0);
  });

  test("tax bracket calculation — mid income spans multiple brackets", () => {
    // grossForTax = 15000
    // pensionEmployee = 15000 * 0.06 = 900
    // taxable = 14100
    // bracket1: 7010 * 0.10 = 701
    // bracket2: (10060-7010) * 0.14 = 3050 * 0.14 = 427
    // bracket3: (14100-10060) * 0.20 = 4040 * 0.20 = 808
    // totalTax = 701 + 427 + 808 = 1936
    // credits = 2.25 * 242 = 544.5
    // taxAfterCredits = 1936 - 544.5 = 1391.5 => rounded 1392
    const shifts = [makeShift("2025-01-15", "עבודה", 160, 15000)];
    const result = calculateNetSalary(shifts, baseConfig);

    expect(result.tax).toBe(1392);
  });

  test("social security — below bracket", () => {
    const shifts = [makeShift("2025-01-15", "עבודה", 8, 5000)];
    const result = calculateNetSalary(shifts, baseConfig);

    // grossForTax = 5000, which is < 7522
    // social = 5000 * 0.035 = 175
    expect(result.social).toBe(175);
  });

  test("social security — above bracket", () => {
    const shifts = [makeShift("2025-01-15", "עבודה", 160, 15000)];
    const result = calculateNetSalary(shifts, baseConfig);

    // social = 7522 * 0.035 + (15000 - 7522) * 0.12
    // = 263.27 + 897.36 = 1160.63 => rounded 1161
    expect(result.social).toBe(1161);
  });

  test("monthly bonus is added to net", () => {
    const config = { ...baseConfig, monthlyBonus: 500 };
    const shifts = [makeShift("2025-01-15", "עבודה", 8, 10000)];
    const resultWithBonus = calculateNetSalary(shifts, config);
    const resultWithout = calculateNetSalary(shifts, baseConfig);

    expect(resultWithBonus.net - resultWithout.net).toBe(500);
  });

  test("travel only counted for work shifts, not sick or vacation", () => {
    const shifts = [
      makeShift("2025-01-10", "עבודה", 8, 400),
      makeShift("2025-01-11", "מחלה", 8, 0),
      makeShift("2025-01-12", "חופש", 8, 0),
      makeShift("2025-01-13", "שבת", 8, 600),
    ];
    const result = calculateNetSalary(shifts, baseConfig);

    // Only the "עבודה" shift gets travel
    expect(result.travel).toBe(20);
  });

  test("empty shifts returns zero values", () => {
    const result = calculateNetSalary([], baseConfig);

    expect(result.net).toBe(0);
    expect(result.gross).toBe(0);
    expect(result.tax).toBe(0);
    expect(result.shiftCount).toBe(0);
    expect(result.totalHours).toBe("0.0");
  });

  test("taxInfo contains bracket metadata", () => {
    const shifts = [makeShift("2025-01-15", "עבודה", 160, 15000)];
    const result = calculateNetSalary(shifts, baseConfig);

    expect(result.taxInfo).toBeDefined();
    expect(result.taxInfo.brackets).toHaveLength(7);
    expect(result.taxInfo.taxable).toBeGreaterThan(0);
    expect(result.taxInfo.currentBracketIndex).toBeGreaterThanOrEqual(0);
  });

  test("tax bracket calculation — high income spans brackets 5-6", () => {
    // grossForTax = 50000
    // pensionEmployee = 50000 * 0.06 = 3000
    // taxable = 47000
    // bracket1: 7010 * 0.10 = 701
    // bracket2: (10060-7010) * 0.14 = 3050 * 0.14 = 427
    // bracket3: (16150-10060) * 0.20 = 6090 * 0.20 = 1218
    // bracket4: (22440-16150) * 0.31 = 6290 * 0.31 = 1949.9
    // bracket5: (46690-22440) * 0.35 = 24250 * 0.35 = 8487.5
    // bracket6: (47000-46690) * 0.47 = 310 * 0.47 = 145.7
    // totalTax = 701+427+1218+1949.9+8487.5+145.7 = 12929.1
    // credits = 2.25 * 242 = 544.5
    // taxAfterCredits = 12929.1 - 544.5 = 12384.6 => rounded 12385
    const shifts = [makeShift("2025-01-15", "עבודה", 200, 50000)];
    const result = calculateNetSalary(shifts, baseConfig);

    expect(result.tax).toBe(12385);
  });

  test("net salary formula is consistent", () => {
    const shifts = [makeShift("2025-01-15", "עבודה", 160, 10000)];
    const r = calculateNetSalary(shifts, baseConfig);

    // net = grossForTax - tax - social - pensionEmployee + travel + bonus
    const grossForTax = r.gross - r.travel; // undo the travel addition for gross
    const expectedNet = Math.round(
      grossForTax - r.tax - r.social - r.pensionEmployee + r.travel + 0,
    );
    expect(r.net).toBe(expectedNet);
  });
});

describe("predictEOM", () => {
  test("returns 0 for zero shifts", () => {
    expect(predictEOM({ shiftCount: 0, net: 0 })).toBe(0);
  });

  test("mid-month linear extrapolation", () => {
    // Day 15 of a 30-day month, net so far = 5000
    // pace = 30/15 = 2
    // predicted = 5000 * 2 = 10000
    const target = new Date(2025, 3, 15); // April 15 (30-day month)
    expect(predictEOM({ shiftCount: 10, net: 5000 }, target)).toBe(10000);
  });

  test("last day of month returns net as-is", () => {
    // Day 31 of a 31-day month
    const target = new Date(2025, 0, 31); // Jan 31
    // pace = 31/31 = 1
    expect(predictEOM({ shiftCount: 20, net: 8000 }, target)).toBe(8000);
  });

  test("first day of month gives large extrapolation", () => {
    const target = new Date(2025, 0, 1); // Jan 1 (31-day month)
    // pace = 31/1 = 31
    expect(predictEOM({ shiftCount: 1, net: 400 }, target)).toBe(12400);
  });
});

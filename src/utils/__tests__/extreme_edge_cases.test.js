const { calculateNetSalary, predictEOM } = require("../calculations.js");

describe("Extreme Edge Cases", () => {
  const baseConfig = {
    hourlyRate: 50,
    creditPoints: 2.25,
    pensionRate: 0.06,
    travelDaily: 25,
    monthlyBonus: 0,
  };

  const makeShift = (date, type, totalHours, earned) => ({
    date,
    type,
    totalHours,
    earned,
  });

  it("should handle Extreme High Income (100k+)", () => {
    const shifts = [makeShift("2025-01-01", "עבודה", 160, 100000)];
    const result = calculateNetSalary(shifts, baseConfig);

    expect(result.taxInfo.currentBracketIndex).toBe(6);
    expect(result.net).toBeLessThan(100000);
    expect(result.tax).toBeGreaterThan(30000);
  });

  it("should handle Zero Hourly Rate", () => {
    const config = { ...baseConfig, hourlyRate: 0 };
    const shifts = [makeShift("2025-01-01", "עבודה", 8, 400)];
    const result = calculateNetSalary(shifts, config);

    expect(result.gross).toBe(425);
  });

  it("should handle Fractional Hours and Rates", () => {
    const config = { ...baseConfig, hourlyRate: 50.33333333 };
    const shifts = [makeShift("2025-01-01", "עבודה", 8.7654, 441.18)];
    const result = calculateNetSalary(shifts, config);

    expect(result.net).toBeDefined();
    expect(Number.isFinite(result.net)).toBe(true);
  });

  it("should handle Pension Rate at 100%", () => {
    const config = { ...baseConfig, pensionRate: 1.0 };
    const shifts = [makeShift("2025-01-01", "עבודה", 8, 10000)];
    const result = calculateNetSalary(shifts, config);

    expect(result.taxInfo.taxable).toBe(0);
    expect(result.tax).toBe(0);
  });

  it("should handle Social Security for high earners", () => {
    const shifts = [makeShift("2025-01-01", "עבודה", 160, 60000)];
    const result = calculateNetSalary(shifts, baseConfig);

    const expectedSocial = Math.round(7522 * 0.035 + (60000 - 7522) * 0.12);
    expect(result.social).toBe(expectedSocial);
  });

  it("should handle Malformed/Missing Shift Data", () => {
    const shifts = [{ type: "עבודה" }];
    const result = calculateNetSalary(shifts, baseConfig);

    expect(result.net).toBeDefined();
  });
});

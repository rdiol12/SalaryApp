/**
 * Tests for the calculation logic in ComparisonInsight.
 * We extract and test the pure calculation functions independently from React rendering.
 */

// -- Extracted calculation logic from ComparisonInsight --

function computeNetDiff(currentNet, previousNet) {
  return ((currentNet - previousNet) / previousNet) * 100;
}

function computeHoursDiff(currentHours, previousHours) {
  const curr = Number(currentHours);
  const prev = Number(previousHours);
  return prev === 0 ? 0 : ((curr - prev) / prev) * 100;
}

function safeLocale(n) {
  return n && isFinite(n) ? Math.round(n).toLocaleString() : "0";
}

// -- Tests --

describe("ComparisonInsight calculations", () => {
  describe("computeNetDiff (net income % change)", () => {
    test("positive increase", () => {
      // 10000 -> 12000 = +20%
      expect(computeNetDiff(12000, 10000)).toBeCloseTo(20.0);
    });

    test("negative decrease", () => {
      // 10000 -> 8000 = -20%
      expect(computeNetDiff(8000, 10000)).toBeCloseTo(-20.0);
    });

    test("no change", () => {
      expect(computeNetDiff(10000, 10000)).toBeCloseTo(0);
    });

    test("large increase", () => {
      // 5000 -> 15000 = +200%
      expect(computeNetDiff(15000, 5000)).toBeCloseTo(200.0);
    });

    test("small fractional change", () => {
      // 10000 -> 10050 = +0.5%
      expect(computeNetDiff(10050, 10000)).toBeCloseTo(0.5);
    });

    test("division by zero when previous is 0 produces Infinity", () => {
      // This is a known edge case: the component guards previous.net === 0
      const result = computeNetDiff(5000, 0);
      expect(result).toBe(Infinity);
    });
  });

  describe("computeHoursDiff (hours % change)", () => {
    test("positive increase in hours", () => {
      // 150 -> 180 = +20%
      expect(computeHoursDiff(180, 150)).toBeCloseTo(20.0);
    });

    test("decrease in hours", () => {
      // 160 -> 120 = -25%
      expect(computeHoursDiff(120, 160)).toBeCloseTo(-25.0);
    });

    test("handles string inputs (as from totalHours)", () => {
      // totalHours is often a string like "160.5"
      expect(computeHoursDiff("180.0", "150.0")).toBeCloseTo(20.0);
    });

    test("previous hours = 0 returns 0 (guarded)", () => {
      const result = computeHoursDiff(100, 0);
      expect(result).toBe(0);
    });

    test("previous hours = 0 displays +0.0% (not Infinity)", () => {
      const hoursDiff = computeHoursDiff(100, 0);
      const displayed = `${hoursDiff >= 0 ? "+" : ""}${hoursDiff.toFixed(1)}%`;
      expect(displayed).toBe("+0.0%");
    });
  });

  describe("safeLocale (number formatting)", () => {
    test("formats positive integer", () => {
      expect(safeLocale(1234)).toBe("1,234");
    });

    test("rounds decimals", () => {
      expect(safeLocale(1234.7)).toBe("1,235");
    });

    test("returns '0' for NaN", () => {
      expect(safeLocale(NaN)).toBe("0");
    });

    test("returns '0' for Infinity", () => {
      expect(safeLocale(Infinity)).toBe("0");
    });

    test("returns '0' for 0", () => {
      // Note: 0 is falsy, so `n && isFinite(n)` => false
      expect(safeLocale(0)).toBe("0");
    });

    test("returns '0' for null", () => {
      expect(safeLocale(null)).toBe("0");
    });

    test("returns '0' for undefined", () => {
      expect(safeLocale(undefined)).toBe("0");
    });

    test("handles negative numbers", () => {
      const result = safeLocale(-1500);
      // toLocaleString may insert Unicode LTR marks on some platforms
      expect(result.replace(/\u200E/g, "")).toBe("-1,500");
    });
  });

  describe("summary text logic", () => {
    test("improvement message when current > previous", () => {
      const current = { net: 12000 };
      const previous = { net: 10000 };
      const isBetter = current.net - previous.net >= 0;
      const diff = current.net - previous.net;
      expect(isBetter).toBe(true);
      expect(safeLocale(diff)).toBe("2,000");
    });

    test("decline message when current < previous", () => {
      const current = { net: 8000 };
      const previous = { net: 10000 };
      const isBetter = current.net - previous.net >= 0;
      const diff = previous.net - current.net;
      expect(isBetter).toBe(false);
      expect(safeLocale(diff)).toBe("2,000");
    });
  });
});

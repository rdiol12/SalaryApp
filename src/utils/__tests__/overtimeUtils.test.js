import {
  getOvertimeTiers,
  computeTieredBreakdown,
  computeTieredTotal,
  getTypeColor,
} from "../overtimeUtils.js";

describe("getOvertimeTiers", () => {
  test("returns custom tiers when provided", () => {
    const config = {
      overtimeTiers: [
        { from: 0, to: 8, multiplier: 1 },
        { from: 8, to: null, multiplier: 1.5 },
      ],
    };
    const tiers = getOvertimeTiers(config);
    expect(tiers).toHaveLength(2);
    expect(tiers[0].multiplier).toBe(1);
    expect(tiers[1].multiplier).toBe(1.5);
  });

  test("builds tiers from threshold and multiplier when no overtimeTiers", () => {
    const config = {
      overtimeStartThreshold: 8,
      overtimeMultiplier: 1.25,
    };
    const tiers = getOvertimeTiers(config);
    expect(tiers).toHaveLength(2);
    expect(tiers[0]).toEqual({ from: 0, to: 8, multiplier: 1 });
    expect(tiers[1]).toEqual({ from: 8, to: null, multiplier: 1.25 });
  });

  test("no threshold returns flat tier", () => {
    const config = {};
    const tiers = getOvertimeTiers(config);
    expect(tiers).toHaveLength(1);
    expect(tiers[0]).toEqual({ from: 0, to: null, multiplier: 1 });
  });

  test("handles null config", () => {
    const tiers = getOvertimeTiers(null);
    expect(tiers).toHaveLength(1);
    expect(tiers[0].multiplier).toBe(1);
  });
});

describe("computeTieredBreakdown", () => {
  const configWith2Tiers = {
    overtimeTiers: [
      { from: 0, to: 8, multiplier: 1 },
      { from: 8, to: null, multiplier: 1.5 },
    ],
  };

  test("all hours in first tier", () => {
    const breakdown = computeTieredBreakdown(6, 50, 1, configWith2Tiers);
    expect(breakdown).toHaveLength(1);
    expect(breakdown[0].hours).toBe(6);
    expect(breakdown[0].amount).toBe(300); // 6 * 50 * 1 * 1
  });

  test("hours span two tiers", () => {
    const breakdown = computeTieredBreakdown(10, 50, 1, configWith2Tiers);
    expect(breakdown).toHaveLength(2);

    // Tier 1: 8 hours * 50 * 1 * 1 = 400
    expect(breakdown[0].hours).toBe(8);
    expect(breakdown[0].amount).toBe(400);

    // Tier 2: 2 hours * 50 * 1 * 1.5 = 150
    expect(breakdown[1].hours).toBe(2);
    expect(breakdown[1].amount).toBe(150);
  });

  test("zero hours returns empty breakdown", () => {
    const breakdown = computeTieredBreakdown(0, 50, 1, configWith2Tiers);
    expect(breakdown).toHaveLength(0);
  });

  test("percent parameter scales amounts", () => {
    const breakdown = computeTieredBreakdown(6, 100, 0.5, configWith2Tiers);
    // 6 * 100 * 0.5 * 1 = 300
    expect(breakdown[0].amount).toBe(300);
  });

  test("three-tier config", () => {
    const config = {
      overtimeTiers: [
        { from: 0, to: 8, multiplier: 1 },
        { from: 8, to: 10, multiplier: 1.25 },
        { from: 10, to: null, multiplier: 1.5 },
      ],
    };
    const breakdown = computeTieredBreakdown(12, 40, 1, config);
    expect(breakdown).toHaveLength(3);

    expect(breakdown[0].hours).toBe(8);
    expect(breakdown[0].amount).toBe(320); // 8*40*1*1

    expect(breakdown[1].hours).toBe(2);
    expect(breakdown[1].amount).toBe(100); // 2*40*1*1.25

    expect(breakdown[2].hours).toBe(2);
    expect(breakdown[2].amount).toBe(120); // 2*40*1*1.5
  });
});

describe("computeTieredTotal", () => {
  const config = {
    overtimeTiers: [
      { from: 0, to: 8, multiplier: 1 },
      { from: 8, to: null, multiplier: 1.5 },
    ],
  };

  test("sums all tier amounts", () => {
    // 8 * 50 * 1 + 2 * 50 * 1.5 = 400 + 150 = 550
    expect(computeTieredTotal(10, 50, 1, config)).toBe(550);
  });

  test("zero hours returns 0", () => {
    expect(computeTieredTotal(0, 50, 1, config)).toBe(0);
  });

  test("flat config (no overtime)", () => {
    const flatConfig = {};
    // 10 * 50 * 1 * 1 = 500
    expect(computeTieredTotal(10, 50, 1, flatConfig)).toBe(500);
  });
});

describe("getTypeColor", () => {
  const theme = {
    green: "#00ff00",
    red: "#ff0000",
    purple: "#800080",
    accent: "#0088ff",
  };

  test("vacation returns green", () => {
    expect(getTypeColor("חופש", theme)).toBe("#00ff00");
  });

  test("sick returns red", () => {
    expect(getTypeColor("מחלה", theme)).toBe("#ff0000");
  });

  test("sabbath returns purple", () => {
    expect(getTypeColor("שבת", theme)).toBe("#800080");
  });

  test("work returns accent (default)", () => {
    expect(getTypeColor("עבודה", theme)).toBe("#0088ff");
  });

  test("unknown type returns accent", () => {
    expect(getTypeColor("other", theme)).toBe("#0088ff");
  });
});

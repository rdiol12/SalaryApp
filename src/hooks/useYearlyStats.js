import { useMemo } from "react";
import { parseDateLocal, HEBREW_MONTHS } from "../utils/shiftFilters.js";
import { calculateNetSalary } from "../utils/calculations.js";

/**
 * Hook to aggregate shifts into yearly and monthly stats efficiently.
 * Uses a single-pass bucket approach O(N) instead of O(12*N).
 */
export default function useYearlyStats(
  shifts,
  config,
  selectedYear,
  calculateEarned,
) {
  return useMemo(() => {
    // 1. Initialize buckets for 12 months
    const buckets = Array.from({ length: 12 }, () => []);

    const startDay = parseInt(config.salaryStartDay) || 1;
    const endDay = startDay === 1 ? 31 : startDay - 1;

    // 2. Distribute shifts into buckets in one pass
    Object.keys(shifts).forEach((dStr) => {
      const d = parseDateLocal(dStr);
      const day = d.getDate();
      const m = d.getMonth();
      const y = d.getFullYear();

      const shiftData = {
        date: dStr,
        ...shifts[dStr],
        earned: calculateEarned(dStr, shifts[dStr]),
      };

      if (startDay === 1) {
        // Simple case: month matches
        if (y === selectedYear) {
          buckets[m].push(shiftData);
        }
      } else {
        // Custom cycle case
        // If day >= startDay, it belongs to NEXT month's cycle
        // If day <= endDay, it belongs to CURRENT month's cycle

        // Let's determine the "Salary Month" for this shift
        let salaryMonth = m;
        let salaryYear = y;

        if (day >= startDay) {
          salaryMonth = (m + 1) % 12;
          salaryYear = m === 11 ? y + 1 : y;
        }

        if (salaryYear === selectedYear) {
          buckets[salaryMonth].push(shiftData);
        }
      }
    });

    // 3. Calculate summaries for each bucket
    let yearlyNet = 0;
    let yearlyGross = 0;
    let yearlyHours = 0;
    let yearlyCount = 0;
    let best = null;

    const monthlySummaries = buckets.map((monthShifts, idx) => {
      if (monthShifts.length === 0) {
        return {
          month: idx,
          year: selectedYear,
          label: HEBREW_MONTHS[idx],
          net: 0,
          gross: 0,
          hours: 0,
          shiftCount: 0,
          tax: 0,
        };
      }

      // Sort shifts by date descending
      monthShifts.sort(
        (a, b) => parseDateLocal(b.date) - parseDateLocal(a.date),
      );

      const stats = calculateNetSalary(monthShifts, config);
      const summary = {
        month: idx,
        year: selectedYear,
        label: HEBREW_MONTHS[idx],
        net: stats.net,
        gross: stats.gross,
        hours: parseFloat(stats.totalHours),
        shiftCount: stats.shiftCount,
        tax: stats.tax,
      };

      yearlyNet += stats.net;
      yearlyGross += stats.gross;
      yearlyHours += parseFloat(stats.totalHours);
      yearlyCount += stats.shiftCount;

      if (!best || stats.net > best.net) {
        best = summary;
      }

      return summary;
    });

    return {
      monthlySummaries,
      yearlyTotals: {
        net: yearlyNet,
        gross: yearlyGross,
        hours: yearlyHours,
        count: yearlyCount,
      },
      bestMonth: best,
    };
  }, [shifts, config, selectedYear, calculateEarned]);
}

import { parseDateLocal } from "./shiftFilters.js";
import {
  isGlobalWorker,
  getHourlyRate,
  getMonthlySalary,
  isGlobalOvertimeIncluded,
} from "./employment.js";
import { computeTieredBreakdown } from "./overtimeUtils.js";

const sickPayFraction = (sequence) => {
  if (sequence === 1) return 0; // יום ראשון: 0%
  if (sequence <= 3) return 0.5; // ימים 2-3: 50%
  return 1; // יום רביעי והלאה: 100%
};

/**
 * Gross for a global (monthly salary) worker:
 * fixed salary, minus the unpaid part of sick days, plus per-shift bonuses,
 * plus overtime only when it is NOT included in the global salary.
 */
const computeGlobalGross = (sortedShifts, config) => {
  const rate = getHourlyRate(config);
  const includeOvertime = !isGlobalOvertimeIncluded(config);
  let sequence = 0;
  let sickDeduction = 0;
  let sicknessPay = 0;
  let overtimePay = 0;
  let bonuses = 0;

  sortedShifts.forEach((shift) => {
    const hours = Number(shift.totalHours || 0);
    if (shift.type === "מחלה") {
      sequence++;
      const dayValue = hours * rate;
      const paid = dayValue * sickPayFraction(sequence);
      sicknessPay += paid;
      sickDeduction += dayValue - paid;
      return;
    }
    sequence = 0;
    bonuses += Number(shift.bonus || 0);
    if (includeOvertime && (shift.type === "עבודה" || shift.type === "שבת")) {
      let workHours = hours;
      if (config.isBreakDeducted && workHours > 6) {
        workHours -= Number(config.breakDeduction || 0) / 60;
      }
      const percent = Number(shift.hourlyPercent || 100) / 100;
      computeTieredBreakdown(workHours, rate, percent, config).forEach((b) => {
        if (b.multiplier > 1) overtimePay += b.amount;
      });
    }
  });

  const baseSalary = getMonthlySalary(config);
  const workGross = Math.max(0, baseSalary - sickDeduction) + overtimePay + bonuses;
  // sicknessPay is reported for the payslip, but it is already part of the
  // fixed salary, so it is not added on top of workGross.
  return { workGross, sicknessPay, sickDeduction, overtimePay, baseSalary };
};

export const calculateNetSalary = (monthlyShifts, config) => {
  const hourlyRate = getHourlyRate(config);
  const isGlobal = isGlobalWorker(config);
  const creditPoints = Number(config.creditPoints || 2.25);
  const pensionRate = Number(config.pensionRate || 0.06);
  const travelDaily = Number(config.travelDaily || 0);
  const workType = "עבודה";

  // מיון משמרות לפי תאריך כדי שהרצף (sequence) יחושב נכון
  const sortedShifts = [...monthlyShifts].sort(
    (a, b) => parseDateLocal(a.date) - parseDateLocal(b.date),
  );

  let sicknessPay = 0;
  let sequence = 0;
  let workGross = 0;
  let travelMonthly = 0;

  sortedShifts.forEach((shift) => {
    if (shift.type === "מחלה") {
      sequence++;
      const hours = Number(shift.totalHours || 0);
      const dayValue = hours * hourlyRate;

      // תיקון לוגיקת ימי מחלה:
      if (sequence === 2) {
        sicknessPay += dayValue * 0.5; // יום שני: 50%
      } else if (sequence === 3) {
        sicknessPay += dayValue * 0.5; // יום שלישי: 50% (לפי החוק)
      } else if (sequence >= 4) {
        sicknessPay += dayValue; // יום רביעי והלאה: 100%
      }
      // יום ראשון נשאר 0 (לא נכנס לאף תנאי)
    } else {
      sequence = 0;
      workGross += Number(shift.earned || 0);
      if (shift.type === workType) {
        travelMonthly += travelDaily;
      }
    }
  });

  let globalInfo = null;
  if (isGlobal) {
    globalInfo = computeGlobalGross(sortedShifts, config);
    workGross = globalInfo.workGross;
    sicknessPay = 0; // already inside the global salary
  }

  const grossForTax = workGross + sicknessPay; // הורדתי את ה-travelMonthly מהסוגריים כי נסיעות הן ברוטו אבל ללא מס לרוב עד תקרה

  // חישובי פנסיה ומיסים (השארתי את הלוגיקה שלך)
  const pensionEmployee = grossForTax * pensionRate;
  const pensionEmployer = grossForTax * 0.065;
  const severanceEmployer = grossForTax * 0.06;

  const taxable = Math.max(0, grossForTax - pensionEmployee);

  // Detailed tax calculation based on brackets (approx 2024/25)
  const brackets = [
    { limit: 7010, rate: 0.1 },
    { limit: 10060, rate: 0.14 },
    { limit: 16150, rate: 0.2 },
    { limit: 22440, rate: 0.31 },
    { limit: 46690, rate: 0.35 },
    { limit: 60130, rate: 0.47 },
    { limit: Infinity, rate: 0.5 },
  ];

  let totalTax = 0;
  let prevLimit = 0;
  let currentBracketIndex = 0;

  for (let i = 0; i < brackets.length; i++) {
    const b = brackets[i];
    if (taxable > prevLimit) {
      const amountInBracket = Math.min(taxable, b.limit) - prevLimit;
      totalTax += amountInBracket * b.rate;
      prevLimit = b.limit;
      if (taxable >= b.limit) currentBracketIndex = i + 1;
    } else {
      break;
    }
  }

  // Credit points deduction
  const taxAfterCredits = Math.max(0, totalTax - creditPoints * 242);

  const socialBracket = 7522;
  const social =
    grossForTax > socialBracket
      ? socialBracket * 0.035 + (grossForTax - socialBracket) * 0.12
      : grossForTax * 0.035;

  const monthlyBonus = Number(config.monthlyBonus || 0);

  const net = Math.round(
    grossForTax -
      taxAfterCredits -
      social -
      pensionEmployee +
      travelMonthly +
      monthlyBonus,
  );

  return {
    net,
    gross: Math.round(grossForTax + travelMonthly),
    tax: Math.round(taxAfterCredits),
    social: Math.round(social),
    pensionEmployee: Math.round(pensionEmployee),
    pensionEmployer: Math.round(pensionEmployer),
    severanceEmployer: Math.round(severanceEmployer),
    sicknessPay: Math.round(isGlobal ? globalInfo.sicknessPay : sicknessPay),
    isGlobal,
    baseSalary: isGlobal ? Math.round(globalInfo.baseSalary) : null,
    sickDeduction: isGlobal ? Math.round(globalInfo.sickDeduction) : 0,
    globalOvertimePay: isGlobal ? Math.round(globalInfo.overtimePay) : 0,
    travel: Math.round(travelMonthly),
    totalHours: sortedShifts
      .filter((s) => s.type === "עבודה" || s.type === "שבת")
      .reduce((sum, s) => sum + Number(s.totalHours || 0), 0)
      .toFixed(1),
    shiftCount: sortedShifts.filter((s) => s.type === "עבודה" || s.type === "שבת").length,
    taxInfo: {
      taxable,
      currentBracketIndex,
      nextBracketLimit: brackets[currentBracketIndex]?.limit || null,
      brackets,
    },
  };
};

/**
 * Predicts EOM net salary based on current pacing.
 * targetDate is the salary period being viewed (used to check if it's the current month).
 * For past periods, returns the actual net (no forecasting needed).
 * For the current period, uses today's real date for pacing.
 */
export const predictEOM = (currentStats, targetDate = new Date(), allShifts = null, salaryStartDay = 25) => {
  // A global salary is fixed, so there is nothing to extrapolate.
  if (currentStats.isGlobal) return currentStats.net;
  if (currentStats.shiftCount === 0) return 0;

  const now = new Date();
  const today = now.getDate();

  // Determine current salary cycle boundaries (25th → 24th)
  // If today >= salaryStartDay, cycle started this month; otherwise last month
  let cycleStartMonth, cycleStartYear;
  if (today >= salaryStartDay) {
    cycleStartMonth = now.getMonth();
    cycleStartYear = now.getFullYear();
  } else {
    const prev = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    cycleStartMonth = prev.getMonth();
    cycleStartYear = prev.getFullYear();
  }

  const cycleStart = new Date(cycleStartYear, cycleStartMonth, salaryStartDay);
  const cycleEnd = new Date(cycleStartYear, cycleStartMonth + 1, salaryStartDay - 1);

  // Is targetDate in the current cycle's display month?
  const isCurrentPeriod =
    targetDate.getFullYear() === cycleEnd.getFullYear() &&
    targetDate.getMonth() === cycleEnd.getMonth();

  if (!isCurrentPeriod) return currentStats.net;

  const MS_PER_DAY = 1000 * 60 * 60 * 24;
  const daysElapsed = Math.round((now - cycleStart) / MS_PER_DAY) + 1;
  const cycleDays = Math.round((cycleEnd - cycleStart) / MS_PER_DAY) + 1;

  if (daysElapsed <= 0) return currentStats.net;

  // If actual shifts are provided, check if future days already have entries
  if (allShifts && allShifts.length > 0) {
    const todayMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const futureShifts = allShifts.filter((s) => {
      if (!s.date) return false;
      const d = new Date(s.date);
      return d > todayMidnight && d <= cycleEnd;
    });
    const remainingDays = Math.max(cycleDays - daysElapsed, 0);
    // If user has already entered shifts for most remaining days, no extrapolation needed
    if (remainingDays === 0 || futureShifts.length >= Math.max(remainingDays * 0.5, 1)) {
      return currentStats.net;
    }
  }

  const pace = cycleDays / daysElapsed;
  return Math.round(currentStats.net * pace);
};

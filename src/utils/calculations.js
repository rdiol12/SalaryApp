import { parseDateLocal } from "./shiftFilters.js";
import {
  isGlobalWorker,
  getHourlyRate,
  getMonthlySalary,
  isGlobalOvertimeIncluded,
} from "./employment.js";
import { computeTieredBreakdown } from "./overtimeUtils.js";
import { getExtraFunds } from "./funds.js";
import { getMonthBonuses } from "./bonuses.js";
import {
  INCOME_TAX_BRACKETS,
  CREDIT_POINT_VALUE,
  PENSION_CREDIT_RATE,
  PENSION_CREDIT_MAX_RATE,
  PENSION_CREDIT_SALARY_CAP,
  NI_REDUCED_THRESHOLD,
  NI_MAX_INCOME,
  NI_RATES,
  STUDY_FUND_SALARY_CEILING,
  SECONDARY_JOB_TAX_RATE,
} from "../constants/israeliTax.js";

/**
 * Income tax mode of a job.
 *  - "regular": main job (or the only job): brackets + credit points.
 *  - "secondary": additional job without a tax coordination: flat top rate,
 *    no credit points.
 *  - "coordinated": additional job with a tax coordination (תיאום מס):
 *    flat rate taken from the coordination certificate.
 */
export const getTaxMode = (config) => {
  if (config?.isPrimaryJob !== false) return { mode: "regular", rate: null };
  const coordinated = Number(config.coordinatedTaxRate);
  if (config.taxCoordination && Number.isFinite(coordinated) && coordinated >= 0 && coordinated <= 50) {
    return { mode: "coordinated", rate: coordinated / 100 };
  }
  return { mode: "secondary", rate: SECONDARY_JOB_TAX_RATE };
};

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

/**
 * @param monthKey salary month ("YYYY-MM") the shifts belong to; selects the
 *   one-month bonuses. Without it only every-month bonuses are counted.
 */
export const calculateNetSalary = (monthlyShifts, config, monthKey = null) => {
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
      // shift.earned already contains the daily travel; travel is counted
      // separately below, so take it out of the work pay.
      const shiftTravel = shift.type === workType ? travelDaily : 0;
      workGross += Number(shift.earned || 0) - shiftTravel;
      travelMonthly += shiftTravel;
    }
  });

  // A fixed monthly travel allowance (e.g. bus pass) replaces the daily one.
  const travelFixed = Number(config.travelMonthlyFixed || 0);
  if (travelFixed > 0) travelMonthly = travelFixed;

  let globalInfo = null;
  if (isGlobal) {
    globalInfo = computeGlobalGross(sortedShifts, config);
    workGross = globalInfo.workGross;
    sicknessPay = 0; // already inside the global salary
  }

  // Salary for pension/social contributions (travel is not pensionable).
  const grossForTax = workGross + sicknessPay;
  // Named bonuses paid with this month's salary (legacy fixed bonus too).
  const monthBonuses = getMonthBonuses(config, monthKey);
  const legacyBonus = Math.max(0, Number(config.monthlyBonus || 0));
  if (legacyBonus > 0) {
    monthBonuses.push({ id: "legacy", name: "בונוס חודשי", amount: legacyBonus, everyMonth: true });
  }
  const monthlyBonus = monthBonuses.reduce((sum, b) => sum + b.amount, 0);
  // Travel allowance and bonus are taxable income and subject to national
  // insurance (but not to pension contributions).
  const taxableGross = grossForTax + travelMonthly + monthlyBonus;

  const pensionEmployee = grossForTax * pensionRate;
  const pensionEmployer = grossForTax * 0.065;
  const severanceEmployer = grossForTax * 0.06;
  // Extra funds the worker defines (קרן השתלמות, קופת גמל, ...).
  // Employee share is deducted from net. For a study fund, the employer
  // share on salary above the ceiling is taxable income.
  const extraFunds = getExtraFunds(config).map((f) => {
    const employee = grossForTax * f.employeeRate;
    const employer = grossForTax * f.employerRate;
    const taxableBenefit =
      f.kind === "studyFund"
        ? Math.max(0, grossForTax - STUDY_FUND_SALARY_CEILING) * f.employerRate
        : 0;
    return { ...f, employee, employer, taxableBenefit };
  });
  const extraEmployeeTotal = extraFunds.reduce((sum, f) => sum + f.employee, 0);
  const extraEmployerTotal = extraFunds.reduce((sum, f) => sum + f.employer, 0);
  const extraTaxableBenefit = extraFunds.reduce((sum, f) => sum + f.taxableBenefit, 0);

  const taxable = Math.max(0, taxableGross + extraTaxableBenefit);
  const brackets = INCOME_TAX_BRACKETS;

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

  // Credits: נקודות זיכוי + 35% credit on the employee pension contribution
  const pensionCreditBase = Math.min(
    pensionEmployee,
    Math.min(grossForTax, PENSION_CREDIT_SALARY_CAP) * PENSION_CREDIT_MAX_RATE,
  );
  const pensionCredit = pensionCreditBase * PENSION_CREDIT_RATE;

  // An additional job is taxed at a flat rate and gets no credit points;
  // those are used at the main job.
  const taxMode = getTaxMode(config);
  if (taxMode.mode !== "regular") totalTax = taxable * taxMode.rate;
  const creditPointsUsed = taxMode.mode === "regular" ? creditPoints : 0;
  const taxAfterCredits = Math.max(
    0,
    totalTax - creditPointsUsed * CREDIT_POINT_VALUE - pensionCredit,
  );

  // ביטוח לאומי ומס בריאות
  const niBase = Math.min(taxableGross, NI_MAX_INCOME);
  const reducedPart = Math.min(niBase, NI_REDUCED_THRESHOLD);
  const fullPart = Math.max(0, niBase - NI_REDUCED_THRESHOLD);
  const nationalInsurance =
    reducedPart * NI_RATES.reduced.nationalInsurance +
    fullPart * NI_RATES.full.nationalInsurance;
  const healthTax =
    reducedPart * NI_RATES.reduced.health + fullPart * NI_RATES.full.health;
  const social = nationalInsurance + healthTax;

  const net = Math.round(
    grossForTax -
      taxAfterCredits -
      social -
      pensionEmployee -
      extraEmployeeTotal +
      travelMonthly +
      monthlyBonus,
  );

  return {
    net,
    gross: Math.round(grossForTax + travelMonthly),
    tax: Math.round(taxAfterCredits),
    social: Math.round(social),
    nationalInsurance: Math.round(nationalInsurance),
    healthTax: Math.round(healthTax),
    pensionCredit: Math.round(pensionCredit),
    pensionEmployee: Math.round(pensionEmployee),
    pensionEmployer: Math.round(pensionEmployer),
    extraFunds: extraFunds.map((f) => ({
      id: f.id,
      name: f.name,
      employeeRate: f.employeeRate,
      employerRate: f.employerRate,
      employee: Math.round(f.employee),
      employer: Math.round(f.employer),
    })),
    extraEmployeeTotal: Math.round(extraEmployeeTotal),
    extraEmployerTotal: Math.round(extraEmployerTotal),
    severanceEmployer: Math.round(severanceEmployer),
    sicknessPay: Math.round(isGlobal ? globalInfo.sicknessPay : sicknessPay),
    monthlyBonus: Math.round(monthlyBonus),
    monthBonuses: monthBonuses.map((b) => ({ ...b, amount: Math.round(b.amount) })),
    taxMode: taxMode.mode,
    flatTaxRate: taxMode.rate,
    creditPointsUsed,
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

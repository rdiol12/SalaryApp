import { parseDateLocal } from "./shiftFilters.js";

export const calculateNetSalary = (monthlyShifts, config) => {
  const hourlyRate = Number(config.hourlyRate || 0);
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
    sicknessPay: Math.round(sicknessPay),
    travel: Math.round(travelMonthly),
    totalHours: sortedShifts
      .reduce((sum, s) => sum + Number(s.totalHours || 0), 0)
      .toFixed(1),
    shiftCount: sortedShifts.length,
    taxInfo: {
      taxable,
      currentBracketIndex,
      nextBracketLimit: brackets[currentBracketIndex]?.limit || null,
      brackets,
    },
  };
};

/**
 * Predicts EOM net salary based on current pacing
 */
export const predictEOM = (currentStats, targetDate = new Date()) => {
  if (currentStats.shiftCount === 0) return 0;

  const dayOfMonth = targetDate.getDate();
  const year = targetDate.getFullYear();
  const month = targetDate.getMonth() + 1;
  const daysInMonth = new Date(year, month, 0).getDate();

  // Simple linear extrapolation based on days passed
  const pace = daysInMonth / dayOfMonth;
  return Math.round(currentStats.net * pace);
};

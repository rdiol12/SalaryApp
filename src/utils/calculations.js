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

  const taxable = grossForTax - pensionEmployee;
  let tax = Math.max(0, taxable * 0.1 - creditPoints * 242);

  const bracket = 7522;
  const social =
    grossForTax > bracket
      ? bracket * 0.035 + (grossForTax - bracket) * 0.12
      : grossForTax * 0.035;

  const monthlyBonus = Number(config.monthlyBonus || 0);

  return {
    net: Math.round(
      grossForTax -
        tax -
        social -
        pensionEmployee +
        travelMonthly +
        monthlyBonus,
    ),
    gross: Math.round(grossForTax + travelMonthly),
    tax: Math.round(tax),
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
  };
};

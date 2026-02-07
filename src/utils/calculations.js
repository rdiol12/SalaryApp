export const calculateNetSalary = (monthlyShifts, config) => {
  const hourlyRate = Number(config.hourlyRate || 0);
  const creditPoints = Number(config.creditPoints || 2.25);
  const pensionRate = Number(config.pensionRate || 0.06);
  
  // כאן הנסיעות נלקחות כסכום חודשי קבוע (בונוס חודשי) מההגדרות
  const monthlyTravelBonus = Number(config.travelDaily || 0);

  // 1. מיון תאריכים לטובת חישוב רצף ימי מחלה
  const sortedShifts = [...monthlyShifts].sort((a, b) => new Date(a.date) - new Date(b.date));

  let sicknessPay = 0;
  let sequence = 0;
  let workGross = 0;

  sortedShifts.forEach((shift) => {
    if (shift.type === 'מחלה') {
      sequence++;
      const hours = Number(shift.totalHours || 0);
      const dayValue = hours * hourlyRate;

      // חוק דמי מחלה: יום 1: 0%, יום 2-3: 50%, יום 4+: 100%
      if (sequence === 2 || sequence === 3) {
        sicknessPay += dayValue * 0.5;
      } else if (sequence >= 4) {
        sicknessPay += dayValue;
      }
    } else {
      sequence = 0;
      // שכר עבודה רגיל (כולל אחוזים ובונוסים של המשמרת)
      workGross += Number(shift.earned || 0);
    }
  });

  // הברוטו לצורך חישוב הפרשות ומס (עבודה + מחלה)
  const grossForTax = workGross + sicknessPay;

  // 2. ניכויים והפרשות
  const pensionEmployee = grossForTax * pensionRate;
  const pensionEmployer = grossForTax * 0.065; 
  const severanceEmployer = grossForTax * 0.06;
  
  const taxable = grossForTax - pensionEmployee;
  
  // מס הכנסה
  let tax = Math.max(0, (taxable * 0.10) - (creditPoints * 242));
  
  // ביטוח לאומי
  const bracket = 7522;
  let social = grossForTax > bracket 
    ? (bracket * 0.035) + (grossForTax - bracket) * 0.12 
    : grossForTax * 0.035;

  // חישוב הנטו הסופי: מוסיפים את הנסיעות החודשיות לאחר הניכויים
  return {
    net: Math.round(grossForTax - tax - social - pensionEmployee + monthlyTravelBonus),
    gross: Math.round(grossForTax),
    tax: Math.round(tax),
    social: Math.round(social),
    pensionEmployee: Math.round(pensionEmployee),
    pensionEmployer: Math.round(pensionEmployer),
    severanceEmployer: Math.round(severanceEmployer),
    sicknessPay: Math.round(sicknessPay),
    travel: Math.round(monthlyTravelBonus), // מוצג כסכום החודשי הקבוע
    totalHours: sortedShifts.reduce((sum, s) => sum + Number(s.totalHours || 0), 0).toFixed(1),
    shiftCount: sortedShifts.length
  };
};

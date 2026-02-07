export const calculateNetSalary = (monthlyShifts, config) => {
  const hourlyRate = Number(config.hourlyRate || 0);
  const creditPoints = Number(config.creditPoints || 2.25);
  const pensionRate = Number(config.pensionRate || 0.06);
  const travelPerShift = Number(config.travelDaily || 0);

  // 1. מיון תאריכים לטובת חישוב רצף ימי מחלה
  // אנחנו צריכים למיין כדי לדעת מהו יום המחלה ה-1, ה-2 וכו'
  const sortedShifts = [...monthlyShifts].sort((a, b) => new Date(a.date) - new Date(b.date));

  let sicknessPay = 0;
  let sequence = 0;
  let workGross = 0;
  let totalTravel = 0;

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
      // יום ראשון נשאר 0 (לא מתווסף ל-sicknessPay)
    } else {
      sequence = 0;
      // הוספת שכר עבודה רגיל (שכבר כולל אחוזים ובונוסים שחושבו ב-App.js)
      workGross += Number(shift.earned || 0);
      // נסיעות משולמות רק על ימי הגעה בפועל
      totalTravel += travelPerShift;
    }
  });

  const gross = workGross + sicknessPay;

  // 2. ניכויים והפרשות (הלוגיקה שלך)
  const pensionEmployee = gross * pensionRate;
  const pensionEmployer = gross * 0.065; 
  const severanceEmployer = gross * 0.06;
  
  const taxable = gross - pensionEmployee;
  
  // מס הכנסה (10% מדרגה ראשונה פחות נקודות זיכוי)
  let tax = Math.max(0, (taxable * 0.10) - (creditPoints * 242));
  
  // ביטוח לאומי (3.5% עד 7,522 ש"ח, 12% על היתרה)
  const bracket = 7522;
  let social = gross > bracket 
    ? (bracket * 0.035) + (gross - bracket) * 0.12 
    : gross * 0.035;

  return {
    net: Math.round(gross - tax - social - pensionEmployee + totalTravel),
    gross: Math.round(gross),
    tax: Math.round(tax),
    social: Math.round(social),
    pensionEmployee: Math.round(pensionEmployee),
    pensionEmployer: Math.round(pensionEmployer),
    severanceEmployer: Math.round(severanceEmployer),
    sicknessPay: Math.round(sicknessPay),
    travel: Math.round(totalTravel),
    totalHours: sortedShifts.reduce((sum, s) => sum + Number(s.totalHours || 0), 0).toFixed(1),
    shiftCount: sortedShifts.length
  };
};

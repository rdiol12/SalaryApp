export const calculateNetSalary = (shifts, config) => {
  const hourlyRate = Number(config.hourlyRate || 0);
  const creditPoints = Number(config.creditPoints || 2.25);
  const pensionRate = Number(config.pensionRate || 0.06);
  const travel = Number(config.travelAllowance || 0);

  // 1. חישוב ברוטו רגיל (עבודה, שבת, חופש ובונוסים)
  let gross = Object.values(shifts).reduce((sum, s) => {
    if (s.type === 'מחלה') return sum; // מחלה מחושבת בנפרד למטה
    return sum + (s.earned || 0);
  }, 0);

  // 2. לוגיקת ימי מחלה לפי החוק בישראל (רצף תאריכים)
  const sortedDates = Object.keys(shifts).sort();
  let sicknessPay = 0;
  let sequence = 0;

  sortedDates.forEach((date) => {
    if (shifts[date].type === 'מחלה') {
      sequence++;
      const dayValue = hourlyRate * 8; // יום מחלה מחושב לפי 8 שעות בסיס
      if (sequence === 2 || sequence === 3) sicknessPay += dayValue * 0.5;
      else if (sequence >= 4) sicknessPay += dayValue;
    } else {
      sequence = 0; // רצף נקטע
    }
  });

  gross += sicknessPay;

  // 3. חישובי ניכויים (מס, ביטוח לאומי, פנסיה)
  const pension = gross * pensionRate;
  const taxable = gross - pension;
  let tax = Math.max(0, (taxable * 0.10) - (creditPoints * 242));
  let social = gross > 7522 ? (7522 * 0.035) + (gross - 7522) * 0.12 : gross * 0.035;

  return {
    net: Math.round(gross - tax - social - pension + travel),
    gross: Math.round(gross),
    tax: Math.round(tax),
    social: Math.round(social),
    pension: Math.round(pension),
    sicknessPay: Math.round(sicknessPay)
  };
};

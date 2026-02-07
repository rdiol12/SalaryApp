export const calculateNetSalary = (shifts, config) => {
  const hourlyRate = Number(config.hourlyRate || 0);
  const creditPoints = Number(config.creditPoints || 2.25);
  const pensionRate = Number(config.pensionRate || 0.06);
  const travel = Number(config.travelAllowance || 0);

  // 1. חישוב ברוטו (עבודה, שבת, חופש ובונוסים)
  let gross = Object.values(shifts).reduce((sum, s) => {
    if (s.type === 'מחלה') return sum;
    return sum + (s.earned || 0);
  }, 0);

  // 2. לוגיקת ימי מחלה (חוק דמי מחלה)
  const sortedDates = Object.keys(shifts).sort();
  let sicknessPay = 0;
  let sequence = 0;

  sortedDates.forEach((date) => {
    if (shifts[date].type === 'מחלה') {
      sequence++;
      const dayValue = hourlyRate * 8; 
      if (sequence === 2 || sequence === 3) sicknessPay += dayValue * 0.5;
      else if (sequence >= 4) sicknessPay += dayValue;
    } else {
      sequence = 0;
    }
  });

  gross += sicknessPay;

  // 3. ניכויים והפרשות
  const pensionEmployee = gross * pensionRate;
  const pensionEmployer = gross * 0.065; // הפרשת מעסיק לתגמולים
  const severanceEmployer = gross * 0.06; // הפרשת מעסיק לפיצויים (מינימום)
  
  const taxable = gross - pensionEmployee;
  let tax = Math.max(0, (taxable * 0.10) - (creditPoints * 242));
  let social = gross > 7522 ? (7522 * 0.035) + (gross - 7522) * 0.12 : gross * 0.035;

  return {
    net: Math.round(gross - tax - social - pensionEmployee + travel),
    gross: Math.round(gross),
    tax: Math.round(tax),
    social: Math.round(social),
    pensionEmployee: Math.round(pensionEmployee),
    pensionEmployer: Math.round(pensionEmployer),
    severanceEmployer: Math.round(severanceEmployer),
    sicknessPay: Math.round(sicknessPay),
    travel: Math.round(travel)
  };
};

export const calculateNetSalary = (gross, creditPoints = 2.25, pensionRate = 0.06, travelAllowance = 0) => {
  const pension = gross * pensionRate;
  const taxable = gross - pension;
  
  // מס הכנסה (מדרגה ראשונה 10%) בניכוי נקודות זכות
  let tax = Math.max(0, (taxable * 0.10) - (creditPoints * 242));
  
  // ביטוח לאומי ומס בריאות (מדרגות 3.5% ו-12%)
  let social = gross > 7522 
    ? (7522 * 0.035) + (gross - 7522) * 0.12 
    : gross * 0.035;
  
  return { 
    net: Math.round(gross - tax - social - pension + Number(travelAllowance)), 
    tax: Math.round(tax), 
    social: Math.round(social), 
    pension: Math.round(pension),
    gross: Math.round(gross)
  };
};

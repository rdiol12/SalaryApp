export const calculateNetSalary = (gross, creditPoints = 2.25, pensionRate = 0.06) => {
  const pension = gross * pensionRate;
  const taxable = gross - pension;
  let tax = Math.max(0, (taxable * 0.10) - (creditPoints * 242));
  let social = gross > 7522 ? (7522 * 0.035) + (gross - 7522) * 0.12 : gross * 0.035;
  return { 
    net: Math.round(gross - tax - social - pension), 
    tax: Math.round(tax), 
    social: Math.round(social), 
    pension: Math.round(pension) 
  };
};

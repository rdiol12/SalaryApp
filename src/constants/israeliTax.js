/**
 * Israeli payroll deduction rates for an employee (שכיר), 2026.
 * Update this file once a year.
 *
 * Sources:
 *  - Income tax brackets: Amendment 288 to the Income Tax Ordinance (2026
 *    budget), retroactive from January 2026 (20% bracket to 19,000, 31% to 25,100).
 *  - Surtax (מס יסף): extra 3% above 60,130 ₪/month (721,560 ₪/year).
 *  - Credit point: 242 ₪/month.
 *  - National insurance & health tax: btl.gov.il, from 01.01.2026.
 */

export const TAX_YEAR = 2026;

// Monthly income tax brackets. The last bracket includes the 3% surtax.
export const INCOME_TAX_BRACKETS = [
  { limit: 7010, rate: 0.1 },
  { limit: 10060, rate: 0.14 },
  { limit: 19000, rate: 0.2 },
  { limit: 25100, rate: 0.31 },
  { limit: 46690, rate: 0.35 },
  { limit: 60130, rate: 0.47 },
  { limit: Infinity, rate: 0.5 },
];

export const CREDIT_POINT_VALUE = 242;

// Employee pension contribution gives a 35% tax credit, on contributions of
// up to 7% of salary, salary capped at the insured-salary ceiling.
export const PENSION_CREDIT_RATE = 0.35;
export const PENSION_CREDIT_MAX_RATE = 0.07;
export const PENSION_CREDIT_SALARY_CAP = 9700;

// קרן השתלמות: the employer contribution (up to 7.5%) is tax-exempt only on
// salary up to this monthly ceiling; above it, it is a taxable benefit.
export const STUDY_FUND_SALARY_CEILING = 15712;

// ביטוח לאומי + מס בריאות, employee share.
export const NI_REDUCED_THRESHOLD = 7703; // 60% of the average wage
export const NI_MAX_INCOME = 51910; // maximum insurable income
export const NI_RATES = {
  reduced: { nationalInsurance: 0.0104, health: 0.0323 },
  full: { nationalInsurance: 0.07, health: 0.0517 },
};

// משכורת נוספת: an additional job without a tax coordination (תיאום מס) is
// taxed at the top regular rate, with no credit points.
export const SECONDARY_JOB_TAX_RATE = 0.47;

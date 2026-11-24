/**
 * The month's shifts and salary summary as spreadsheet sheets (see xlsxWriter.js).
 */
import { parseDateLocal } from "./shiftFilters.js";
import { isTimedShift } from "./shiftUtils.js";

const HEBREW_DAYS = ["ראשון", "שני", "שלישי", "רביעי", "חמישי", "שישי", "שבת"];
const bold = (v) => ({ v, bold: true });
const number = (v) => {
  const n = Number(v);
  return isFinite(n) ? n : 0;
};
const displayDate = (iso) => {
  const d = parseDateLocal(iso);
  if (!d || isNaN(d.getTime())) return String(iso || "");
  return `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}/${d.getFullYear()}`;
};

/**
 * @param shifts   the month's shifts
 * @param stats    result of calculateNetSalary for the same shifts
 * @param title    e.g. "נובמבר 2026"
 * @param jobName  shown on the summary sheet when given
 */
export const buildMonthSheets = ({ shifts, stats, title, jobName }) => {
  const sorted = [...(shifts || [])].sort((a, b) =>
    String(a.date).localeCompare(String(b.date)) || String(a.startTime || "").localeCompare(String(b.startTime || ""))
  );
  const header = ["תאריך", "יום", "סוג", "התחלה", "סיום", "שעות", "אחוז שכר", "תוספת (₪)", "הערות"].map(bold);
  let totalHours = 0;
  let totalBonus = 0;
  const rows = sorted.map((s) => {
    const timed = isTimedShift(s.type);
    const hours = timed ? number(s.totalHours) : 0;
    const bonus = number(s.bonus);
    totalHours += hours;
    totalBonus += bonus;
    const d = parseDateLocal(s.date);
    return [
      displayDate(s.date),
      d && !isNaN(d.getTime()) ? HEBREW_DAYS[d.getDay()] : "",
      s.type || "",
      timed ? s.startTime || "" : "",
      timed ? s.endTime || "" : "",
      timed ? hours : null,
      timed ? number(s.hourlyPercent || 100) : null,
      bonus || null,
      s.notes || "",
    ];
  });
  const shiftSheet = {
    name: "משמרות",
    rtl: true,
    widths: [12, 9, 9, 9, 9, 9, 10, 11, 32],
    rows: [header, ...rows, [bold("סה״כ"), null, bold(`${rows.length} רשומות`), null, null, bold(totalHours), null, totalBonus ? bold(totalBonus) : null, null]],
  };

  const st = stats || {};
  const line = (label, value) => [label, number(value)];
  const summary = [
    [bold("סיכום שכר"), bold(title || "")],
    ...(jobName ? [["עבודה", jobName]] : []),
    [],
    line("שעות עבודה", st.totalHours),
    line("מספר משמרות", st.shiftCount),
    line("ברוטו", st.gross),
    line("נסיעות", st.travel),
    line("דמי מחלה", st.sicknessPay),
    line("בונוסים", st.monthlyBonus),
    [],
    line("מס הכנסה", st.tax),
    line("ביטוח לאומי", st.nationalInsurance),
    line("מס בריאות", st.healthTax),
    line("פנסיה (עובד)", st.pensionEmployee),
    line("הפרשות נוספות (עובד)", st.extraEmployeeTotal),
    [],
    [bold("נטו לתשלום"), bold(number(st.net))],
    [],
    ["סימולציה בלבד — אינו תלוש שכר רשמי"],
  ];
  return [shiftSheet, { name: "סיכום", rtl: true, widths: [26, 16], rows: summary }];
};

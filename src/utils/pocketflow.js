/**
 * Hands a month's salary to the PocketFlow app (iOS) as an income entry, through a
 * pocketflow://income link. PocketFlow opens with the entry filled in and saves it
 * only after the user confirms. While the month is still open it is sent as an
 * expected income; sending again later updates the same entry (matched by source + month).
 * The hourly pay goes along so PocketFlow can show expenses as hours of work.
 */
import { Linking } from "react-native";

const plainAmount = (value) => {
  const cents = Math.max(0, Math.round(Number(value) * 100));
  return `${Math.floor(cents / 100)}.${String(cents % 100).padStart(2, "0")}`;
};

/** "1,234.5" / "1234,50" / "₪ 8,450" -> 1234.5 / 1234.5 / 8450; null when it is not a positive amount. */
export const parseAmount = (text) => {
  const kept = String(text ?? "").replace(/[^\d.,]/g, "");
  if (!/\d/.test(kept)) return null;
  const last = Math.max(kept.lastIndexOf("."), kept.lastIndexOf(","));
  const decimals = last >= 0 ? kept.length - last - 1 : 0;
  const normalized =
    last >= 0 && decimals >= 1 && decimals <= 2
      ? `${kept.slice(0, last).replace(/[.,]/g, "")}.${kept.slice(last + 1)}`
      : kept.replace(/[.,]/g, "");
  const value = Number(normalized);
  return isFinite(value) && value > 0 ? value : null;
};

const isoDate = (d) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

/**
 * @param amount    net pay to send
 * @param monthKey  salary month, "YYYY-MM"
 * @param hours     hours worked in the month (for the hourly pay); optional
 * @param jobName   set when the user has several jobs, so each gets its own entry
 * @param today     injectable for tests
 */
export const buildPocketFlowSalaryLink = ({ amount, monthKey, hours = 0, jobName = null, today = new Date() }) => {
  const [year, month] = String(monthKey).split("-").map(Number);
  const currentKey = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}`;
  const final = String(monthKey) < currentKey;
  // A finished month is dated today (when it is being recorded); an open one, the first day after it.
  const date = final ? isoDate(today) : isoDate(new Date(year, month, 1));
  const workedHours = Number(hours);
  const wage = workedHours > 0 ? Math.round((Number(amount) / workedHours) * 100) : 0;
  const source = jobName ? `SalaryPro ${jobName}` : "SalaryPro";
  const params = [
    `amount=${plainAmount(amount)}`,
    `month=${monthKey}`,
    `date=${date}`,
    `done=${final ? 1 : 0}`,
    ...(wage > 0 ? [`wage=${wage}`] : []),
    `source=${encodeURIComponent(source)}`,
    `merchant=${encodeURIComponent(jobName ? `משכורת · ${jobName}` : "משכורת")}`,
  ];
  return { url: `pocketflow://income?${params.join("&")}`, final };
};

/** Opens PocketFlow with the salary; resolves false when PocketFlow is not installed. */
export const sendSalaryToPocketFlow = async (options) => {
  const { url } = buildPocketFlowSalaryLink(options);
  try {
    await Linking.openURL(url);
    return true;
  } catch (e) {
    return false;
  }
};

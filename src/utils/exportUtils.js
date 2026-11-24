import * as FileSystem from "expo-file-system";
import * as Sharing from "expo-sharing";
import { Share, Platform } from "react-native";
import { buildXlsx, toBase64 } from "./xlsxWriter.js";
import { buildMonthSheets } from "./shiftWorkbook.js";

/**
 * Generates a text report for the given monthly summary.
 */
export const generateMonthlyReport = (summary) => {
  const { label, year, net, gross, hours, shiftCount } = summary;

  return `דוח שכר - ${label} ${year}
----------------
נטו: ₪${net.toLocaleString()}
ברוטו: ₪${gross.toLocaleString()}
שעות: ${hours.toFixed(2)}
משמרות: ${shiftCount}
----------------
נוצר ע"י SalaryApp`;
};

/**
 * Shares a text message (e.g., via WhatsApp).
 */
export const shareText = async (text) => {
  try {
    const result = await Share.share({
      message: text,
      title: "דוח שכר",
    });
    return result;
  } catch (error) {
    console.error("Error sharing:", error);
    throw error;
  }
};

/**
 * Exports all app data to a JSON file and shares it.
 */
export const backupData = async (data) => {
  if (Platform.OS === "web") {
    alert("Backup not supported on web yet.");
    return;
  }

  const json = JSON.stringify(data, null, 2);
  const path = `${FileSystem.documentDirectory}salary_backup_${Date.now()}.json`;

  try {
    await FileSystem.writeAsStringAsync(path, json);
    if (await Sharing.isAvailableAsync()) {
      await Sharing.shareAsync(path, {
        mimeType: "application/json",
        dialogTitle: "שמור גיבוי",
      });
    } else {
      alert("Sharing is not available on this device");
    }
  } catch (error) {
    console.error("Backup failed:", error);
    throw error;
  }
};

/**
 * Writes the month's shifts and salary summary to an Excel file and opens the share sheet.
 * monthKey is "YYYY-MM"; title is the month's display name.
 */
export const exportMonthToExcel = async ({ shifts, stats, monthKey, title, jobName }) => {
  const bytes = buildXlsx(buildMonthSheets({ shifts, stats, title, jobName }));
  const path = `${FileSystem.cacheDirectory}SalaryPro-${monthKey}.xlsx`;
  await FileSystem.writeAsStringAsync(path, toBase64(bytes), {
    encoding: FileSystem.EncodingType.Base64,
  });
  if (!(await Sharing.isAvailableAsync())) throw new Error("Sharing is not available on this device");
  await Sharing.shareAsync(path, {
    mimeType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    UTI: "org.openxmlformats.spreadsheetml.sheet",
    dialogTitle: "ייצוא לאקסל",
  });
  return path;
};

import React, { useMemo } from "react";
import { View, Text, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { darkTheme as T } from "../../constants/theme.js";
import { calculateAllJobsSummary, getJobs } from "../../utils/jobs.js";

const fmt = (n) => (n && isFinite(n) ? Math.round(n).toLocaleString() : "0");

const TAX_LABEL = {
  regular: "מס רגיל + נקודות זיכוי",
  secondary: "עבודה נוספת: 47% ללא זיכוי",
  coordinated: "תיאום מס",
};

/**
 * Month summary of every job (pay, travel, bonuses, deductions, net) and the
 * total across jobs. Shown only when the worker has more than one job.
 */
export default function AllJobsSummary({ fullConfig, shiftsByJob, displayDate }) {
  const summary = useMemo(
    () =>
      getJobs(fullConfig).length > 1 && displayDate
        ? calculateAllJobsSummary(fullConfig, shiftsByJob, displayDate)
        : null,
    [fullConfig, shiftsByJob, displayDate],
  );
  if (!summary) return null;

  const { jobs, total } = summary;

  return (
    <View style={[styles.section, T.shadows.sm]}>
      <View style={styles.sectionHeader}>
        <Ionicons name="layers-outline" size={16} color={T.textSecondary} />
        <Text style={styles.sectionTitle}>כל העבודות</Text>
      </View>

      {jobs.map((j) => {
        const deductions =
          j.stats.tax + j.stats.social + j.stats.pensionEmployee + j.stats.extraEmployeeTotal;
        const taxLabel =
          j.stats.taxMode === "coordinated"
            ? `תיאום מס: ${Math.round((j.stats.flatTaxRate || 0) * 100)}%`
            : TAX_LABEL[j.stats.taxMode];
        return (
          <View key={j.id} style={styles.jobBlock}>
            <View style={styles.jobHeader}>
              <Text style={styles.jobName}>
                {j.name}
                {j.isPrimary ? " · ראשית" : ""}
              </Text>
              <Text style={styles.jobNet}>₪{fmt(j.stats.net)}</Text>
            </View>
            <Text style={styles.jobMeta}>
              {j.stats.shiftCount} משמרות · {j.stats.totalHours} שעות · {taxLabel}
            </Text>
            <Row label="ברוטו (כולל נסיעות)" value={`₪${fmt(j.stats.gross + j.stats.monthlyBonus)}`} />
            <Row label="מתוכם נסיעות" value={`₪${fmt(j.stats.travel)}`} />
            <Row label="מתוכם בונוסים" value={`₪${fmt(j.bonuses)}`} />
            <Row label="ניכויים" value={`- ₪${fmt(deductions)}`} negative />
          </View>
        );
      })}

      <View style={styles.totalBlock}>
        <View style={styles.jobHeader}>
          <Text style={styles.totalLabel}>סה״כ נטו מכל העבודות</Text>
          <Text style={styles.totalNet}>₪{fmt(total.net)}</Text>
        </View>
        <Row label="ברוטו כולל" value={`₪${fmt(total.gross + jobs.reduce((s, j) => s + j.stats.monthlyBonus, 0))}`} />
        <Row label="נסיעות" value={`₪${fmt(total.travel)}`} />
        <Row label="בונוסים" value={`₪${fmt(total.bonuses)}`} />
        <Row label="מס הכנסה" value={`- ₪${fmt(total.tax)}`} negative />
        <Row label="ביטוח לאומי ובריאות" value={`- ₪${fmt(total.social)}`} negative />
        <Row label="פנסיה וקרנות" value={`- ₪${fmt(total.pension)}`} negative />
        <Row label="שעות / משמרות" value={`${total.totalHours.toFixed(1)} / ${total.shiftCount}`} />
      </View>

      <Text style={styles.note}>
        כל מעסיק מנכה מס וביטוח לאומי לפי השכר אצלו. בסוף השנה ייתכן הפרש מול
        מס הכנסה וביטוח לאומי.
      </Text>
    </View>
  );
}

const Row = ({ label, value, negative }) => (
  <View style={styles.row}>
    <Text style={styles.rowLabel}>{label}</Text>
    <Text style={[styles.rowValue, negative && { color: T.red }]}>{value}</Text>
  </View>
);

const styles = StyleSheet.create({
  section: {
    backgroundColor: T.cardBg,
    borderRadius: T.radiusLg,
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: T.border,
  },
  sectionHeader: {
    flexDirection: "row-reverse",
    alignItems: "center",
    gap: 6,
    marginBottom: 10,
  },
  sectionTitle: { color: T.text, fontSize: 14, fontWeight: "700" },
  jobBlock: {
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: T.divider,
  },
  jobHeader: {
    flexDirection: "row-reverse",
    justifyContent: "space-between",
    alignItems: "center",
  },
  jobName: { color: T.text, fontSize: 14, fontWeight: "800" },
  jobNet: { color: T.accent, fontSize: 16, fontWeight: "800" },
  jobMeta: {
    color: T.textMuted,
    fontSize: 11,
    textAlign: "right",
    marginTop: 2,
    marginBottom: 4,
  },
  row: {
    flexDirection: "row-reverse",
    justifyContent: "space-between",
    paddingVertical: 2,
  },
  rowLabel: { color: T.textSecondary, fontSize: 12 },
  rowValue: { color: T.text, fontSize: 12, fontWeight: "600" },
  totalBlock: { paddingTop: 12 },
  totalLabel: { color: T.text, fontSize: 14, fontWeight: "800" },
  totalNet: { color: T.green, fontSize: 20, fontWeight: "900" },
  note: {
    color: T.textMuted,
    fontSize: 10,
    textAlign: "right",
    marginTop: 10,
  },
});

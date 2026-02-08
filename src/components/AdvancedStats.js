import React from "react";
import { View, Text, StyleSheet, ScrollView, Dimensions } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { calculateNetSalary } from "../utils/calculations.js";
import GoalProgressBar from "./GoalProgressBar.js";
import { darkTheme as T } from "../constants/theme.js";
import StatCharts from "./stats/StatCharts.js";

export default function AdvancedStats({
  monthlyShifts,
  config,
  displayDate,
  onOpenPayslip,
}) {
  const stats = calculateNetSalary(monthlyShifts, config);
  const goal = Number(config.monthlyGoal || 0);
  const remaining = Math.max(goal - stats.net, 0);
  const getDaysInMonth = (year, month) =>
    new Date(year, month + 1, 0).getDate();
  const month = displayDate ? displayDate.getMonth() : new Date().getMonth();
  const year = displayDate
    ? displayDate.getFullYear()
    : new Date().getFullYear();
  const daysInMonth = getDaysInMonth(year, month);
  const today = new Date();
  const monthStart = new Date(year, month, 1);
  const currentMonthStart = new Date(today.getFullYear(), today.getMonth(), 1);
  const isCurrentMonth = monthStart.getTime() === currentMonthStart.getTime();
  const isPastMonth = monthStart.getTime() < currentMonthStart.getTime();
  const daysLeft = isPastMonth
    ? 0
    : isCurrentMonth
      ? daysInMonth - today.getDate() + 1
      : daysInMonth;
  const dailyTarget = daysLeft > 0 ? Math.ceil(remaining / daysLeft) : 0;
  const chartWidth = Math.max(Dimensions.get("window").width - 32, 280);

  if (monthlyShifts.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Ionicons
          name="analytics-outline"
          size={48}
          color={T.textPlaceholder}
        />
        <Text style={styles.emptyTitle}>אין נתונים למחזור זה</Text>
        <Text style={styles.emptySubtext}>
          הוסף משמרות כדי לראות סטטיסטיקות
        </Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <Text style={styles.headerTitle}>סיכום שכר חודשי</Text>

      <View style={styles.netCard}>
        <Text style={styles.netLabel}>נטו משוער לבנק</Text>
        <Text style={styles.netValue}>₪{stats.net.toLocaleString()}</Text>

        <View style={styles.quickStats}>
          <View style={styles.quickItem}>
            <Text style={styles.quickVal}>{stats.totalHours}</Text>
            <Text style={styles.quickLab}>שעות</Text>
          </View>
          <View style={styles.quickDivider} />
          <View style={styles.quickItem}>
            <Text style={styles.quickVal}>{stats.shiftCount}</Text>
            <Text style={styles.quickLab}>משמרות</Text>
          </View>
        </View>
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Ionicons name="flag-outline" size={16} color={T.textSecondary} />
          <Text style={styles.sectionTitle}>יעד חודשי</Text>
        </View>
        <GoalProgressBar current={stats.net} goal={config.monthlyGoal} />
        <View style={styles.goalRow}>
          <Text style={styles.goalText}>נותרו</Text>
          <Text style={styles.goalValue}>₪{remaining.toLocaleString()}</Text>
        </View>
        <View style={styles.goalRowSecondary}>
          <Text style={styles.goalMeta}>ימים נותרו: {daysLeft}</Text>
          <Text style={styles.goalMeta}>
            נדרש ליום: ₪{dailyTarget.toLocaleString()}
          </Text>
        </View>
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Ionicons name="pulse-outline" size={16} color={T.textSecondary} />
          <Text style={styles.sectionTitle}>גרפים חודשיים</Text>
        </View>
        <StatCharts
          monthlyShifts={monthlyShifts}
          config={config}
          chartWidth={chartWidth}
        />
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Ionicons
            name="document-text-outline"
            size={16}
            color={T.textSecondary}
          />
          <Text style={styles.sectionTitle}>פירוט תלוש (משוער)</Text>
        </View>

        <DetailRow label="שכר ברוטו" value={`₪${stats.gross}`} />
        <DetailRow
          label="דמי נסיעות (חודשי)"
          value={`+ ₪${stats.travel}`}
          isPositive
        />
        {stats.sicknessPay > 0 && (
          <DetailRow
            label="דמי מחלה ששולמו"
            value={`+ ₪${stats.sicknessPay}`}
            isPositive
          />
        )}
        <View style={styles.divider} />
        <DetailRow label="מס הכנסה" value={`- ₪${stats.tax}`} isNegative />
        <DetailRow
          label="ביטוח לאומי ובריאות"
          value={`- ₪${stats.social}`}
          isNegative
        />
        <DetailRow
          label="פנסיה (חלק העובד)"
          value={`- ₪${stats.pensionEmployee}`}
          isNegative
        />

        <TouchableOpacity
          style={styles.fullPayslipBtn}
          onPress={onOpenPayslip}
          activeOpacity={0.7}
        >
          <Ionicons name="receipt-outline" size={16} color={T.accent} />
          <Text style={styles.fullPayslipText}>צפה בסימולציית תלוש מלאה</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Ionicons
            name="shield-checkmark-outline"
            size={16}
            color={T.accent}
          />
          <Text style={[styles.sectionTitle, { color: T.accent }]}>
            הפרשות מעסיק
          </Text>
        </View>
        <DetailRow
          label="תגמולי מעסיק (6.5%)"
          value={`₪${stats.pensionEmployer}`}
          color={T.accent}
        />
        <DetailRow
          label="פיצויים (6%)"
          value={`₪${stats.severanceEmployer}`}
          color={T.accent}
        />
        <View style={[styles.divider, { backgroundColor: T.accentLight }]} />
        <DetailRow
          label="סה״כ הפרשות סוציאליות"
          value={`₪${stats.pensionEmployer + stats.severanceEmployer}`}
          color={T.accent}
          isBold
        />
      </View>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const DetailRow = ({ label, value, isNegative, isPositive, isBold, color }) => (
  <View style={styles.detailRow}>
    <Text
      style={[
        styles.detailValue,
        isNegative && { color: T.red },
        isPositive && { color: T.green },
        color && { color },
        isBold && { fontWeight: "700", fontSize: 16 },
      ]}
    >
      {value}
    </Text>
    <Text
      style={[
        styles.detailLabel,
        isBold && { fontWeight: "700", color: T.text },
      ]}
    >
      {label}
    </Text>
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: T.bg,
    padding: 16,
  },
  headerTitle: {
    color: T.text,
    fontSize: 20,
    fontWeight: "700",
    textAlign: "right",
    marginBottom: 16,
  },
  netCard: {
    backgroundColor: T.cardBg,
    borderRadius: T.radiusLg,
    padding: 20,
    alignItems: "center",
    marginBottom: 16,
    borderWidth: 1,
    borderColor: T.border,
  },
  netLabel: {
    color: T.textSecondary,
    fontSize: 13,
    marginBottom: 6,
  },
  netValue: {
    color: T.accent,
    fontSize: 36,
    fontWeight: "800",
    letterSpacing: -0.5,
  },
  quickStats: {
    flexDirection: "row",
    marginTop: 16,
    width: "100%",
    borderTopWidth: 1,
    borderTopColor: T.divider,
    paddingTop: 12,
    alignItems: "center",
  },
  quickItem: {
    flex: 1,
    alignItems: "center",
  },
  quickDivider: {
    width: 1,
    height: 28,
    backgroundColor: T.divider,
  },
  quickVal: {
    color: T.text,
    fontSize: 18,
    fontWeight: "700",
  },
  quickLab: {
    color: T.textSecondary,
    fontSize: 11,
    marginTop: 2,
  },
  section: {
    backgroundColor: T.cardBg,
    borderRadius: T.radiusLg,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: T.border,
  },
  sectionHeader: {
    flexDirection: "row-reverse",
    alignItems: "center",
    gap: 6,
    marginBottom: 12,
  },
  sectionTitle: {
    color: T.textSecondary,
    fontSize: 12,
    fontWeight: "600",
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 8,
  },
  goalRow: {
    flexDirection: "row-reverse",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 6,
  },
  goalRowSecondary: {
    flexDirection: "row-reverse",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 6,
  },
  goalText: {
    color: T.textSecondary,
    fontSize: 12,
  },
  goalValue: {
    color: T.accent,
    fontSize: 14,
    fontWeight: "700",
  },
  goalMeta: {
    color: T.textMuted,
    fontSize: 11,
  },
  detailLabel: {
    color: T.textSecondary,
    fontSize: 14,
  },
  detailValue: {
    color: T.text,
    fontSize: 14,
    fontWeight: "600",
  },
  divider: {
    height: 1,
    backgroundColor: T.divider,
    marginVertical: 4,
  },
  fullPayslipBtn: {
    flexDirection: "row-reverse",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 12,
    paddingVertical: 10,
    borderRadius: T.radiusMd,
    borderWidth: 1,
    borderColor: T.accent,
    backgroundColor: T.accentLight,
    gap: 8,
  },
  fullPayslipText: {
    color: T.accent,
    fontSize: 13,
    fontWeight: "700",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
  },
  emptyTitle: {
    color: T.textSecondary,
    fontSize: 16,
    fontWeight: "600",
  },
  emptySubtext: {
    color: T.textMuted,
    fontSize: 13,
  },
});

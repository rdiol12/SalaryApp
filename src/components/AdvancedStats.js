import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Dimensions,
  TouchableOpacity,
  Platform,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { BlurView } from "expo-blur";
import Animated, { FadeInUp, Layout, ZoomIn } from "react-native-reanimated";
import {
  calculateNetSalary,
  predictEOM,
  safeLocale,
} from "../utils/calculations.js";
import GoalProgressBar from "./GoalProgressBar.js";
import { darkTheme as T } from "../constants/theme.js";
import StatCharts from "./stats/StatCharts.js";
import { getFilteredShiftsForMonth } from "../utils/shiftFilters.js";

// New Insight Components
import SalaryPredictor from "./insights/SalaryPredictor.js";
import TaxBracketVisualizer from "./insights/TaxBracketVisualizer.js";
import ComparisonInsight from "./insights/ComparisonInsight.js";

export default function AdvancedStats({
  monthlyShifts,
  shifts,
  config,
  displayDate,
  calculateEarned,
  onOpenPayslip,
}) {
  const stats = React.useMemo(
    () => calculateNetSalary(monthlyShifts, config),
    [monthlyShifts, config],
  );

  const prevMonthStats = React.useMemo(() => {
    if (!shifts || !displayDate) return null;
    const d = new Date(displayDate);
    d.setMonth(d.getMonth() - 1);
    const prevShifts = getFilteredShiftsForMonth(
      shifts,
      config,
      d.getMonth(),
      d.getFullYear(),
      calculateEarned,
    );
    return prevShifts.length > 0
      ? calculateNetSalary(prevShifts, config)
      : null;
  }, [shifts, displayDate, config, calculateEarned]);

  const predictedNet = React.useMemo(() => {
    return predictEOM(stats, displayDate || new Date());
  }, [stats, displayDate]);

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

  const safeLocale = (n) =>
    n && isFinite(n) ? Math.round(n).toLocaleString() : "0";

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

  const insets = useSafeAreaInsets();
  const bottomPad = (Platform.OS === "ios" ? insets.bottom || 20 : 20) + 68;

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: bottomPad }}>
      <Text style={styles.headerTitle}>סיכום שכר חודשי</Text>

      <Animated.View
        entering={FadeInUp.delay(100).duration(600)}
        style={[styles.premiumHeader]}
      >
        <BlurView
          intensity={T.glassIntensity}
          tint="light"
          style={styles.glassHeader}
        >
          <LinearGradient
            colors={["rgba(62, 142, 208, 0.9)", "rgba(37, 117, 176, 0.9)"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.netCard}
          >
            <Text style={styles.netLabelPremium}>נטו משוער לבנק</Text>
            <Text style={styles.netValuePremium}>₪{safeLocale(stats.net)}</Text>

            <View style={styles.quickStatsPremium}>
              <View style={styles.quickItem}>
                <Text style={styles.quickValPremium}>{stats.totalHours}</Text>
                <Text style={styles.quickLabPremium}>שעות</Text>
              </View>
              <View style={styles.quickDividerPremium} />
              <View style={styles.quickItem}>
                <Text style={styles.quickValPremium}>{stats.shiftCount}</Text>
                <Text style={styles.quickLabPremium}>משמרות</Text>
              </View>
            </View>
          </LinearGradient>
        </BlurView>
      </Animated.View>

      {isCurrentMonth && stats.shiftCount > 3 && (
        <Animated.View entering={FadeInUp.delay(200).duration(600)}>
          <SalaryPredictor predictedNet={predictedNet} currentNet={stats.net} />
        </Animated.View>
      )}

      {prevMonthStats && (
        <Animated.View
          entering={FadeInUp.delay(300).duration(600)}
          style={styles.section}
        >
          <ComparisonInsight current={stats} previous={prevMonthStats} />
        </Animated.View>
      )}

      <Animated.View
        entering={FadeInUp.delay(400).duration(600)}
        style={[styles.section, T.shadows.sm]}
      >
        <View style={styles.sectionHeader}>
          <Ionicons name="flag-outline" size={16} color={T.textSecondary} />
          <Text style={styles.sectionTitle}>יעד חודשי</Text>
        </View>
        <GoalProgressBar current={stats.net} goal={config.monthlyGoal} />
        <View style={styles.goalRow}>
          <Text style={styles.goalText}>נותרו</Text>
          <Text style={styles.goalValue}>₪{safeLocale(remaining)}</Text>
        </View>
        <View style={styles.goalRowSecondary}>
          <Text style={styles.goalMeta}>ימים נותרו: {daysLeft}</Text>
          <Text style={styles.goalMeta}>
            נדרש ליום: ₪{safeLocale(dailyTarget)}
          </Text>
        </View>
      </Animated.View>

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

        <DetailRow label="שכר ברוטו" value={`₪${safeLocale(stats.gross)}`} />
        <DetailRow
          label="דמי נסיעות (חודשי)"
          value={`+ ₪${safeLocale(stats.travel)}`}
          isPositive
        />
        {stats.sicknessPay > 0 && (
          <DetailRow
            label="דמי מחלה ששולמו"
            value={`+ ₪${safeLocale(stats.sicknessPay)}`}
            isPositive
          />
        )}
        <View style={styles.divider} />
        <DetailRow
          label="מס הכנסה"
          value={`- ₪${safeLocale(stats.tax)}`}
          isNegative
        />
        <DetailRow
          label="ביטוח לאומי ובריאות"
          value={`- ₪${safeLocale(stats.social)}`}
          isNegative
        />
        <DetailRow
          label="פנסיה (חלק העובד)"
          value={`- ₪${safeLocale(stats.pensionEmployee)}`}
          isNegative
        />

        <TaxBracketVisualizer taxInfo={stats.taxInfo} />

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
          value={`₪${safeLocale(stats.pensionEmployer)}`}
          color={T.accent}
        />
        <DetailRow
          label="פיצויים (6%)"
          value={`₪${safeLocale(stats.severanceEmployer)}`}
          color={T.accent}
        />
        <View style={[styles.divider, { backgroundColor: T.accentLight }]} />
        <DetailRow
          label="סה״כ הפרשות סוציאליות"
          value={`₪${safeLocale(stats.pensionEmployer + stats.severanceEmployer)}`}
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
  premiumHeader: {
    marginHorizontal: 0,
    marginTop: 8,
    borderRadius: T.radiusLg,
    overflow: "hidden",
    ...T.shadows.lg,
  },
  glassHeader: {
    backgroundColor: "rgba(255,255,255,0.3)",
  },
  netCard: {
    padding: 24,
    alignItems: "center",
  },
  netLabelPremium: {
    color: "rgba(255,255,255,0.8)",
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 4,
  },
  netValuePremium: {
    color: "#fff",
    fontSize: 40,
    fontWeight: "800",
    letterSpacing: -1,
  },
  quickStatsPremium: {
    flexDirection: "row",
    marginTop: 20,
    width: "100%",
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.2)",
    paddingTop: 16,
    alignItems: "center",
  },
  quickValPremium: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "700",
  },
  quickLabPremium: {
    color: "rgba(255,255,255,0.7)",
    fontSize: 11,
    marginTop: 2,
    fontWeight: "600",
  },
  quickDividerPremium: {
    width: 1,
    height: 30,
    backgroundColor: "rgba(255,255,255,0.2)",
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

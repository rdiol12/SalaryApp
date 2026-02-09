import React from "react";
import { View, Text, StyleSheet } from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { darkTheme as T } from "../../constants/theme.js";
import { formatDateLocal, parseDateLocal } from "../../utils/shiftFilters.js";
import { computeTieredBreakdown } from "../../utils/overtimeUtils.js";
import { getTypeColor } from "../../utils/overtimeUtils.js";

/**
 * Weekly summary card showing hours, earnings, and overtime stats.
 * Premium Redesign with Gradients.
 */
export default function WeekSummaryCard({
  selectedDate,
  shifts,
  config,
  calculateEarned,
}) {
  const week = getWeekSummary(selectedDate, shifts, config, calculateEarned);

  return (
    <Animated.View entering={FadeInDown.duration(200)} style={styles.container}>
      <LinearGradient colors={["#ffffff", "#f8f9fa"]} style={styles.card}>
        <View style={styles.header}>
          <Text style={styles.title}>סיכום שבועי</Text>
          <Text style={styles.range}>{week.range}</Text>
        </View>

        <View style={styles.mainStats}>
          <SummaryItem label="שכר" value={`\u20AA${week.totalEarned}`} isMain />
          <View style={styles.divider} />
          <SummaryItem
            label="משמרות"
            value={week.shiftCount.toString()}
            isMain
          />
          <View style={styles.divider} />
          <SummaryItem label="שעות" value={week.totalHours} isMain />
        </View>

        <View style={styles.secondaryGrid}>
          <View style={styles.secondaryItem}>
            <Text style={styles.secValue}>{week.overtimeHours}</Text>
            <Text style={styles.secLabel}>שעות נוספות</Text>
          </View>
          <View style={styles.secondaryItem}>
            <Text style={styles.secValue}>{`\u20AA${week.overtimeExtra}`}</Text>
            <Text style={styles.secLabel}>תוספת</Text>
          </View>
          <View style={styles.secondaryItem}>
            <Text style={styles.secValue}>{week.dailyAvg}</Text>
            <Text style={styles.secLabel}>ממוצע יומי</Text>
          </View>
        </View>

        {week.typeBreakdown.length > 0 && (
          <View style={styles.typeSection}>
            <Text style={styles.typeSectionTitle}>פילוח לפי סוג</Text>
            <View style={styles.typeRow}>
              {week.typeBreakdown.map((tb) => (
                <View key={tb.type} style={styles.typeChip}>
                  <View style={[styles.typeDot, { backgroundColor: tb.color }]} />
                  <Text style={styles.typeText}>
                    {tb.count} {tb.type}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {week.days.length > 0 && (
          <View style={styles.daysSection}>
            <Text style={styles.typeSectionTitle}>ימי המשמרות</Text>
            {week.days.map((day) => (
              <View key={day.date} style={styles.dayRow}>
                <Text style={styles.dayDate}>{day.shortDate}</Text>
                <View style={[styles.dayTypeDot, { backgroundColor: day.color }]} />
                <Text style={styles.dayType}>{day.type}</Text>
                <Text style={styles.dayHours}>{day.hours} שע׳</Text>
              </View>
            ))}
          </View>
        )}

        {week.breakDeducted > 0 && (
          <View style={styles.breakRow}>
            <Ionicons name="pause-circle-outline" size={14} color={T.textMuted} />
            <Text style={styles.breakText}>
              {week.breakDeducted} דק׳ הפסקה נוכו השבוע
            </Text>
          </View>
        )}
      </LinearGradient>
    </Animated.View>
  );
}

function getWeekSummary(selectedDate, shifts, config, calculateEarned) {
  const base = selectedDate ? parseDateLocal(selectedDate) : new Date();
  const start = new Date(base);
  start.setDate(base.getDate() - base.getDay());
  const end = new Date(start);
  end.setDate(start.getDate() + 6);

  let totalHours = 0;
  let totalEarned = 0;
  let shiftCount = 0;
  let overtimeHours = 0;
  let overtimeExtra = 0;
  let breakDeducted = 0;
  const typeCounts = {};
  const days = [];

  const DAY_NAMES = ["א׳", "ב׳", "ג׳", "ד׳", "ה׳", "ו׳", "ש׳"];

  for (let i = 0; i < 7; i++) {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    const key = formatDateLocal(d);
    if (shifts[key]) {
      shiftCount += 1;
      const shift = shifts[key];
      const shiftHours = Number(shift.totalHours || 0);
      totalHours += shiftHours;
      totalEarned += calculateEarned(key, shift);

      typeCounts[shift.type] = (typeCounts[shift.type] || 0) + 1;

      days.push({
        date: key,
        shortDate: `${DAY_NAMES[d.getDay()]} ${String(d.getDate()).padStart(2, "0")}.${String(d.getMonth() + 1).padStart(2, "0")}`,
        type: shift.type,
        hours: shiftHours.toFixed(1),
        color: getTypeColor(shift.type, T),
      });

      if (shift.type === "\u05E2\u05D1\u05D5\u05D3\u05D4") {
        let hours = shiftHours;
        if (config.isBreakDeducted && hours > 6) {
          const deduction = Number(config.breakDeduction || 0);
          hours -= deduction / 60;
          breakDeducted += deduction;
        }
        const rate = Number(config.hourlyRate || 0);
        const percent = Number(shift.hourlyPercent || 100) / 100;
        const breakdown = computeTieredBreakdown(hours, rate, percent, config);
        breakdown.forEach((b) => {
          if (b.multiplier > 1) {
            overtimeHours += b.hours;
            overtimeExtra += b.hours * rate * percent * (b.multiplier - 1);
          }
        });
      }
    }
  }

  const typeBreakdown = Object.entries(typeCounts).map(([type, count]) => ({
    type,
    count,
    color: getTypeColor(type, T),
  }));

  const dailyAvg = shiftCount > 0
    ? `\u20AA${Math.round(totalEarned / shiftCount)}`
    : "\u20AA0";

  return {
    range: `${String(start.getDate()).padStart(2, "0")}.${String(start.getMonth() + 1).padStart(2, "0")} - ${String(end.getDate()).padStart(2, "0")}.${String(end.getMonth() + 1).padStart(2, "0")}`,
    totalHours: totalHours.toFixed(1),
    totalEarned: Math.round(totalEarned),
    shiftCount,
    overtimeHours: overtimeHours.toFixed(1),
    overtimeExtra: Math.round(overtimeExtra),
    dailyAvg,
    typeBreakdown,
    days,
    breakDeducted,
  };
}

const SummaryItem = ({ label, value, isMain }) => (
  <View style={styles.item}>
    <Text style={[styles.value, isMain && styles.mainValueText]}>{value}</Text>
    <Text style={styles.label}>{label}</Text>
  </View>
);

const styles = StyleSheet.create({
  container: {
    marginTop: 16,
    ...T.shadows.md,
  },
  card: {
    borderRadius: T.radiusLg,
    borderWidth: 1,
    borderColor: T.border,
    padding: 16,
    overflow: "hidden",
  },
  header: {
    flexDirection: "row-reverse",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  title: {
    color: T.text,
    fontSize: 15,
    fontWeight: "800",
  },
  range: {
    color: T.textMuted,
    fontSize: 12,
    fontWeight: "600",
  },
  mainStats: {
    flexDirection: "row-reverse",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.02)",
    padding: 12,
    borderRadius: T.radiusMd,
    marginBottom: 16,
  },
  divider: {
    width: 1,
    height: 24,
    backgroundColor: "rgba(0,0,0,0.05)",
  },
  item: {
    flex: 1,
    alignItems: "center",
  },
  value: {
    color: T.accent,
    fontSize: 18,
    fontWeight: "800",
    letterSpacing: -0.5,
  },
  mainValueText: {
    fontSize: 20,
  },
  label: {
    color: T.textSecondary,
    fontSize: 11,
    marginTop: 2,
    fontWeight: "600",
  },
  secondaryGrid: {
    flexDirection: "row-reverse",
    justifyContent: "space-around",
    paddingTop: 8,
  },
  secondaryItem: {
    alignItems: "center",
  },
  secValue: {
    color: T.text,
    fontSize: 14,
    fontWeight: "700",
  },
  secLabel: {
    color: T.textMuted,
    fontSize: 10,
    marginTop: 1,
  },
  typeSection: {
    marginTop: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "rgba(0,0,0,0.04)",
  },
  typeSectionTitle: {
    color: T.textMuted,
    fontSize: 11,
    fontWeight: "700",
    textAlign: "right",
    marginBottom: 8,
  },
  typeRow: {
    flexDirection: "row-reverse",
    flexWrap: "wrap",
    gap: 8,
  },
  typeChip: {
    flexDirection: "row-reverse",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.03)",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    gap: 6,
  },
  typeDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  typeText: {
    color: T.text,
    fontSize: 12,
    fontWeight: "600",
  },
  daysSection: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "rgba(0,0,0,0.04)",
  },
  dayRow: {
    flexDirection: "row-reverse",
    alignItems: "center",
    paddingVertical: 5,
    gap: 8,
  },
  dayDate: {
    color: T.textSecondary,
    fontSize: 11,
    fontWeight: "600",
    width: 50,
    textAlign: "right",
  },
  dayTypeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  dayType: {
    color: T.text,
    fontSize: 12,
    fontWeight: "600",
    flex: 1,
    textAlign: "right",
  },
  dayHours: {
    color: T.accent,
    fontSize: 12,
    fontWeight: "700",
  },
  breakRow: {
    flexDirection: "row-reverse",
    alignItems: "center",
    gap: 6,
    marginTop: 12,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: "rgba(0,0,0,0.04)",
  },
  breakText: {
    color: T.textMuted,
    fontSize: 11,
    fontWeight: "500",
  },
});

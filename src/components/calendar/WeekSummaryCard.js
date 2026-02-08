import React from "react";
import { View, Text, StyleSheet } from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import { LinearGradient } from "expo-linear-gradient";
import { darkTheme as T } from "../../constants/theme.js";
import { formatDateLocal, parseDateLocal } from "../../utils/shiftFilters.js";
import { computeTieredBreakdown } from "../../utils/overtimeUtils.js";

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
          <SummaryItem label="שכר" value={`₪${week.totalEarned}`} isMain />
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
            <Text style={styles.secValue}>₪{week.overtimeExtra}</Text>
            <Text style={styles.secLabel}>תוספת</Text>
          </View>
          <View style={styles.secondaryItem}>
            <Text style={styles.secValue}>{week.maxMultiplier}%</Text>
            <Text style={styles.secLabel}>מקס %</Text>
          </View>
        </View>
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
  let maxMultiplier = 1;

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

      if (shift.type === "עבודה") {
        let hours = shiftHours;
        if (config.isBreakDeducted && hours > 6) {
          hours -= Number(config.breakDeduction || 0) / 60;
        }
        const rate = Number(config.hourlyRate || 0);
        const percent = Number(shift.hourlyPercent || 100) / 100;
        const breakdown = computeTieredBreakdown(hours, rate, percent, config);
        breakdown.forEach((b) => {
          if (b.multiplier > 1) {
            overtimeHours += b.hours;
            overtimeExtra += b.hours * rate * percent * (b.multiplier - 1);
            if (b.multiplier > maxMultiplier) maxMultiplier = b.multiplier;
          }
        });
      }
    }
  }

  return {
    range: `${String(start.getDate()).padStart(2, "0")}.${String(start.getMonth() + 1).padStart(2, "0")} - ${String(end.getDate()).padStart(2, "0")}.${String(end.getMonth() + 1).padStart(2, "0")}`,
    totalHours: totalHours.toFixed(1),
    totalEarned: Math.round(totalEarned),
    shiftCount,
    overtimeHours: overtimeHours.toFixed(1),
    overtimeExtra: Math.round(overtimeExtra),
    maxMultiplier: Math.round(maxMultiplier * 100),
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
});

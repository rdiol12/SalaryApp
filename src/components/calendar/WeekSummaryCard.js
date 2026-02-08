import React from "react";
import { View, Text, StyleSheet } from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import { darkTheme as T } from "../../constants/theme.js";
import { formatDateLocal, parseDateLocal } from "../../utils/shiftFilters.js";
import { computeTieredBreakdown } from "../../utils/overtimeUtils.js";

/**
 * Weekly summary card showing hours, earnings, and overtime stats.
 */
export default function WeekSummaryCard({
  selectedDate,
  shifts,
  config,
  calculateEarned,
}) {
  const week = getWeekSummary(selectedDate, shifts, config, calculateEarned);

  return (
    <Animated.View entering={FadeInDown.duration(160)} style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.title}>סיכום שבועי</Text>
        <Text style={styles.range}>{week.range}</Text>
      </View>
      <View style={styles.grid}>
        <SummaryItem label="שעות" value={week.totalHours} />
        <SummaryItem label="משמרות" value={week.shiftCount.toString()} />
        <SummaryItem label="שכר" value={`₪${week.totalEarned}`} />
      </View>
      <View style={[styles.grid, styles.gridSecondary]}>
        <SummaryItem label="שעות נוספות" value={week.overtimeHours} />
        <SummaryItem label="תוספת" value={`₪${week.overtimeExtra}`} />
        <SummaryItem label="מקס %'" value={`${week.maxMultiplier}%`} />
      </View>
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

const SummaryItem = ({ label, value }) => (
  <View style={styles.item}>
    <Text style={styles.value}>{value}</Text>
    <Text style={styles.label}>{label}</Text>
  </View>
);

const styles = StyleSheet.create({
  card: {
    marginTop: 12,
    backgroundColor: T.cardBg,
    borderRadius: T.radiusMd,
    borderWidth: 1,
    borderColor: T.border,
    padding: 12,
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 3,
  },
  header: {
    flexDirection: "row-reverse",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  title: {
    color: T.text,
    fontSize: 14,
    fontWeight: "700",
  },
  range: {
    color: T.textSecondary,
    fontSize: 12,
  },
  grid: {
    flexDirection: "row-reverse",
    justifyContent: "space-around",
  },
  gridSecondary: {
    marginTop: 8,
  },
  item: {
    alignItems: "center",
  },
  value: {
    color: T.accent,
    fontSize: 16,
    fontWeight: "800",
  },
  label: {
    color: T.textSecondary,
    fontSize: 11,
    marginTop: 2,
  },
});

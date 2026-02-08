import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { darkTheme as T } from "../constants/theme.js";

export default function GoalProgressBar({ current, goal }) {
  const goalNum = parseFloat(goal) || 1;
  const progress = Math.min(current / goalNum, 1);
  const isGoalReached = progress >= 1;
  const barColor = isGoalReached ? T.green : T.accent;

  const safeLocale = (n) =>
    n && isFinite(n) ? Math.round(n).toLocaleString() : "0";

  return (
    <View style={styles.container}>
      <View style={styles.labelRow}>
        <Text style={styles.label}>התקדמות ליעד</Text>
        <Text style={[styles.percent, { color: barColor }]}>
          {Math.round(progress * 100)}%
        </Text>
      </View>
      <View style={styles.track}>
        <View
          style={[
            styles.bar,
            { width: `${progress * 100}%`, backgroundColor: barColor },
          ]}
        />
      </View>
      <View style={styles.amountRow}>
        <Text style={styles.amountText}>₪{safeLocale(current)}</Text>
        <Text style={styles.goalText}>מתוך ₪{safeLocale(goalNum)}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 16,
  },
  labelRow: {
    flexDirection: "row-reverse",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  label: {
    color: T.text,
    fontWeight: "600",
    fontSize: 14,
  },
  percent: {
    fontWeight: "700",
    fontSize: 14,
  },
  track: {
    height: 10,
    backgroundColor: T.cardBgElevated,
    borderRadius: 5,
    overflow: "hidden",
  },
  bar: {
    height: "100%",
    borderRadius: 5,
  },
  amountRow: {
    flexDirection: "row-reverse",
    justifyContent: "space-between",
    marginTop: 6,
  },
  amountText: {
    color: T.textSecondary,
    fontSize: 12,
  },
  goalText: {
    color: T.textMuted,
    fontSize: 12,
  },
});

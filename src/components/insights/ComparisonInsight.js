import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { darkTheme as T } from "../../constants/theme.js";

export default function ComparisonInsight({ current, previous }) {
  if (!previous || previous.net === 0) return null;

  const netDiff = ((current.net - previous.net) / previous.net) * 100;
  const hoursDiff =
    ((Number(current.totalHours) - Number(previous.totalHours)) /
      Number(previous.totalHours)) *
    100;

  const isBetter = netDiff >= 0;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Ionicons name="stats-chart" size={16} color={T.textSecondary} />
        <Text style={styles.title}>השוואה לחודש קודם</Text>
      </View>

      <View style={styles.row}>
        <InsightItem
          label="הכנסה נטו"
          value={`${isBetter ? "+" : ""}${netDiff.toFixed(1)}%`}
          isPositive={isBetter}
        />
        <View style={styles.divider} />
        <InsightItem
          label="שעות עבודה"
          value={`${hoursDiff >= 0 ? "+" : ""}${hoursDiff.toFixed(1)}%`}
          isNeutral
        />
      </View>

      <Text style={styles.summary}>
        {isBetter
          ? `שיפור של ₪${Math.round(current.net - previous.net).toLocaleString()} בהכנסה`
          : `ירידה של ₪${Math.round(previous.net - current.net).toLocaleString()} בהכנסה`}
      </Text>
    </View>
  );
}

const InsightItem = ({ label, value, isPositive, isNeutral }) => (
  <View style={styles.item}>
    <Text style={styles.itemLabel}>{label}</Text>
    <Text
      style={[
        styles.itemValue,
        isPositive
          ? { color: T.green }
          : !isNeutral
            ? { color: T.red }
            : { color: T.accent },
      ]}
    >
      {value}
    </Text>
  </View>
);

const styles = StyleSheet.create({
  container: {
    backgroundColor: T.cardBgElevated,
    borderRadius: T.radiusMd,
    padding: 12,
    marginTop: 8,
    borderWidth: 1,
    borderColor: T.border,
  },
  header: {
    flexDirection: "row-reverse",
    alignItems: "center",
    gap: 6,
    marginBottom: 12,
  },
  title: {
    color: T.text,
    fontSize: 13,
    fontWeight: "600",
  },
  row: {
    flexDirection: "row-reverse",
    justifyContent: "space-around",
    alignItems: "center",
  },
  item: {
    alignItems: "center",
  },
  itemLabel: {
    color: T.textSecondary,
    fontSize: 11,
    marginBottom: 2,
  },
  itemValue: {
    fontSize: 18,
    fontWeight: "700",
  },
  divider: {
    width: 1,
    height: 24,
    backgroundColor: T.border,
  },
  summary: {
    marginTop: 10,
    color: T.textMuted,
    fontSize: 11,
    textAlign: "center",
  },
});

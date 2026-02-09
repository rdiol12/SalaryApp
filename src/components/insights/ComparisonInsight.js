import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { darkTheme as T } from "../../constants/theme.js";

export default function ComparisonInsight({ current, previous }) {
  if (!previous || previous.net === 0) return null;

  const netDiff = ((current.net - previous.net) / previous.net) * 100;
  const prevHours = Number(previous.totalHours);
  const hoursDiff =
    prevHours === 0
      ? 0
      : ((Number(current.totalHours) - prevHours) / prevHours) * 100;

  const isBetter = netDiff >= 0;

  const safeLocale = (n) =>
    n && isFinite(n) ? Math.round(n).toLocaleString() : "0";

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
          ? `שיפור של ₪${safeLocale(current.net - previous.net)} בהכנסה`
          : `ירידה של ₪${safeLocale(previous.net - current.net)} בהכנסה`}
      </Text>
    </View>
  );
}

const InsightItem = ({ label, value, isPositive, isNeutral }) => {
  const color = isPositive
    ? T.green
    : !isNeutral
      ? T.red
      : T.accent;
  const arrowIcon = isNeutral
    ? null
    : isPositive
      ? "trending-up"
      : "trending-down";

  return (
    <View style={styles.item}>
      <Text style={styles.itemLabel}>{label}</Text>
      <View style={styles.valueRow}>
        {arrowIcon && (
          <Ionicons name={arrowIcon} size={16} color={color} />
        )}
        <Text style={[styles.itemValue, { color }]}>{value}</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: T.cardBgElevated,
    borderRadius: T.radiusMd,
    padding: 12,
    marginTop: 4,
    borderWidth: 1,
    borderColor: T.border,
    ...T.shadows.sm,
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
  valueRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
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

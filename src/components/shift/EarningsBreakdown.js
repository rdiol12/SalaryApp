import React, { useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { darkTheme as T } from "../../constants/theme.js";
import { computeTieredBreakdown } from "../../utils/overtimeUtils.js";

/**
 * Earnings breakdown section showing overtime and total tiers.
 */
export default function EarningsBreakdown({ shift, config }) {
  const [expanded, setExpanded] = useState(true);

  const rate = Number(config?.hourlyRate || 0);
  const percent = Number(shift.hourlyPercent || 100) / 100;
  const hours = Number(shift.totalHours || 0);
  const breakdown = computeTieredBreakdown(hours, rate, percent, config);

  return (
    <>
      <View style={styles.header}>
        <Text style={styles.label}>שעות נוספות</Text>
        <TouchableOpacity
          onPress={() => setExpanded(!expanded)}
          activeOpacity={0.7}
        >
          <Ionicons
            name={expanded ? "chevron-up" : "chevron-down"}
            size={16}
            color={T.textSecondary}
          />
        </TouchableOpacity>
      </View>

      {expanded && (
        <View style={styles.card}>
          {breakdown.length === 0 ? (
            <Text style={styles.emptyText}>אין שעות נוספות</Text>
          ) : (
            breakdown.map((b, idx) => (
              <View key={`${b.from}-${b.to}-${idx}`} style={styles.row}>
                <Text style={styles.amount}>₪{Math.round(b.amount)}</Text>
                <Text style={styles.details}>
                  {b.to === null ? `מעל ${b.from}` : `${b.from}–${b.to}`} שעות ·{" "}
                  {Math.round(b.multiplier * 100)}%
                </Text>
                <Text style={styles.hours}>{b.hours.toFixed(2)} שעות</Text>
              </View>
            ))
          )}
        </View>
      )}
    </>
  );
}

const styles = StyleSheet.create({
  header: {
    marginTop: 16,
    marginBottom: 6,
    flexDirection: "row-reverse",
    alignItems: "center",
    justifyContent: "space-between",
  },
  label: {
    color: T.textSecondary,
    fontSize: 12,
    fontWeight: "600",
  },
  card: {
    backgroundColor: T.cardBg,
    borderRadius: T.radiusMd,
    borderWidth: 1,
    borderColor: T.border,
    overflow: "hidden",
  },
  emptyText: {
    color: T.textMuted,
    fontSize: 12,
    textAlign: "right",
    padding: 12,
  },
  row: {
    flexDirection: "row-reverse",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: T.divider,
  },
  details: {
    color: T.textSecondary,
    fontSize: 11,
  },
  amount: {
    color: T.text,
    fontSize: 12,
    fontWeight: "700",
  },
  hours: {
    color: T.textMuted,
    fontSize: 11,
  },
});

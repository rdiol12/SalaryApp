import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { darkTheme as T } from "../../constants/theme.js";

export default function TaxBracketVisualizer({ taxInfo }) {
  if (!taxInfo || !taxInfo.taxable) return null;

  const { taxable, currentBracketIndex, nextBracketLimit, brackets } = taxInfo;
  const currentBracket =
    brackets[currentBracketIndex] || brackets[brackets.length - 1];

  const currentLimit = brackets[currentBracketIndex - 1]?.limit || 0;
  const hasNext = nextBracketLimit && isFinite(nextBracketLimit);
  const range = hasNext ? nextBracketLimit - currentLimit : 1;
  const progressInBracket = hasNext
    ? Math.min((taxable - currentLimit) / (range || 1), 1)
    : 1;

  const safeLocale = (n) =>
    n && isFinite(n) ? Math.round(n).toLocaleString() : "0";

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Ionicons name="receipt-outline" size={16} color={T.textSecondary} />
        <Text style={styles.title}>
          מדרגת מס נוכחית: {currentBracket.rate * 100}%
        </Text>
      </View>

      <View style={styles.progressTrack}>
        <View
          style={[styles.progressBar, { width: `${progressInBracket * 100}%` }]}
        />
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>
          {hasNext
            ? `עוד ₪${safeLocale(nextBracketLimit - taxable)} למדרגה הבאה (${Math.round((brackets[currentBracketIndex + 1]?.rate || 0) * 100)}%)`
            : "הגעת למדרגת המס הגבוהה ביותר המחושבת"}
        </Text>
      </View>
    </View>
  );
}

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
    marginBottom: 8,
  },
  title: {
    color: T.text,
    fontSize: 13,
    fontWeight: "600",
  },
  progressTrack: {
    height: 8,
    backgroundColor: T.border,
    borderRadius: 4,
    overflow: "hidden",
  },
  progressBar: {
    height: "100%",
    backgroundColor: T.accent,
    borderRadius: 4,
  },
  footer: {
    marginTop: 6,
  },
  footerText: {
    color: T.textMuted,
    fontSize: 11,
    textAlign: "right",
  },
});

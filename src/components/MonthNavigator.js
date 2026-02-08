import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import * as Haptics from "expo-haptics";
import { Ionicons } from "@expo/vector-icons";
import { darkTheme as T } from "../constants/theme.js";
import { formatMonthLabel } from "../utils/shiftFilters.js";

export default function MonthNavigator({ displayDate, onChangeMonth }) {
  const month = displayDate.getMonth();
  const year = displayDate.getFullYear();

  const goBack = () => {
    try {
      Haptics.selectionAsync();
    } catch (e) {}
    const d = new Date(displayDate);
    d.setMonth(d.getMonth() - 1);
    onChangeMonth(d);
  };

  const goForward = () => {
    try {
      Haptics.selectionAsync();
    } catch (e) {}
    const d = new Date(displayDate);
    d.setMonth(d.getMonth() + 1);
    onChangeMonth(d);
  };

  const goToday = () => {
    try {
      Haptics.selectionAsync();
    } catch (e) {}
    onChangeMonth(new Date());
  };

  const now = new Date();
  const isCurrentMonth = month === now.getMonth() && year === now.getFullYear();

  return (
    <View style={styles.container}>
      <TouchableOpacity
        onPress={goForward}
        style={styles.arrowBtn}
        activeOpacity={0.6}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      >
        <Ionicons name="chevron-forward" size={20} color="#fff" />
      </TouchableOpacity>

      <TouchableOpacity
        onPress={goToday}
        activeOpacity={0.7}
        style={styles.labelBtn}
      >
        <Text style={styles.monthLabel}>{formatMonthLabel(month, year)}</Text>
        {!isCurrentMonth && (
          <Text style={styles.todayHint}>לחץ לחזור להיום</Text>
        )}
      </TouchableOpacity>

      <TouchableOpacity
        onPress={goBack}
        style={styles.arrowBtn}
        activeOpacity={0.6}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      >
        <Ionicons name="chevron-back" size={20} color="#fff" />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row-reverse",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginHorizontal: 12,
    marginTop: 8,
    marginBottom: 8,
    backgroundColor: T.cardBg,
    borderRadius: T.radiusLg,
    borderWidth: 1,
    borderColor: T.border,
    ...T.shadows.sm,
  },
  arrowBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: T.accent,
    justifyContent: "center",
    alignItems: "center",
    ...T.shadows.sm,
  },
  labelBtn: {
    alignItems: "center",
    flex: 1,
  },
  monthLabel: {
    color: T.text,
    fontSize: 16,
    fontWeight: "700",
  },
  todayHint: {
    color: T.textMuted,
    fontSize: 10,
  },
});

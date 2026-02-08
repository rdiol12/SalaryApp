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
        <Ionicons name="chevron-forward" size={20} color={T.accent} />
      </TouchableOpacity>

      <TouchableOpacity
        onPress={goToday}
        activeOpacity={0.7}
        style={styles.labelBtn}
      >
        <Text style={styles.monthLabel}>{formatMonthLabel(month, year)}</Text>
        {!isCurrentMonth && <Text style={styles.todayHint}>חזור להיום</Text>}
      </TouchableOpacity>

      <TouchableOpacity
        onPress={goBack}
        style={styles.arrowBtn}
        activeOpacity={0.6}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      >
        <Ionicons name="chevron-back" size={20} color={T.accent} />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row-reverse",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginHorizontal: 16,
    marginTop: 12,
    marginBottom: 8,
    backgroundColor: "#fff",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.03)",
    ...T.shadows.sm,
  },
  arrowBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: T.accentLight,
    justifyContent: "center",
    alignItems: "center",
  },
  labelBtn: {
    alignItems: "center",
    flex: 1,
  },
  monthLabel: {
    color: T.text,
    fontSize: 16,
    fontWeight: "800",
    letterSpacing: -0.5,
  },
  todayHint: {
    color: T.accent,
    fontSize: 10,
    fontWeight: "600",
    marginTop: 2,
  },
});

import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { Calendar } from "react-native-calendars";
import { PanGestureHandler, State } from "react-native-gesture-handler";
import Animated, { FadeInDown } from "react-native-reanimated";
import * as Haptics from "expo-haptics";
import { darkTheme as T } from "../constants/theme";
import { formatDateLocal, parseDateLocal } from "../utils/shiftFilters";
import { getOvertimeTiers, getTypeColor } from "../utils/overtimeUtils";
import WeekSummaryCard from "./calendar/WeekSummaryCard";
import ShiftDetailCard from "./calendar/ShiftDetailCard";

export default function CalendarView({
  shifts,
  config,
  selectedDate,
  displayDate,
  onMonthChange,
  onDayPress,
  calculateEarned,
  onDeleteShift,
}) {
  const isDateInSalaryCycle = (dateStr) => {
    const start = Number(config.salaryStartDay || 1);
    if (!Number.isFinite(start)) return false;
    const day = parseDateLocal(dateStr).getDate();
    const end = start === 1 ? 31 : start - 1;
    if (start <= end) return day >= start && day <= end;
    return day >= start || day <= end;
  };

  const handlePan = ({ nativeEvent }) => {
    if (!onMonthChange || nativeEvent.state !== State.END) return;
    if (Math.abs(nativeEvent.translationX) < 60) return;
    const base = displayDate ? new Date(displayDate) : new Date();
    const next = new Date(base);
    next.setMonth(base.getMonth() + (nativeEvent.translationX < 0 ? 1 : -1));
    try {
      Haptics.selectionAsync();
    } catch (e) {}
    onMonthChange(next);
  };

  const renderDay = ({ date, state }) => {
    const dateStr = date.dateString;
    const shift = shifts[dateStr];
    const isSelected = selectedDate === dateStr;
    const isToday = dateStr === formatDateLocal(new Date());
    const isDisabled = state === "disabled";
    const inCycle = isDateInSalaryCycle(dateStr);
    const dayColor = isDisabled
      ? T.textPlaceholder
      : isSelected
        ? "#fff"
        : T.text;
    const hasOvertime =
      shift && shift.type === "עבודה"
        ? getOvertimeTiers(config).some(
            (t) =>
              Number(t.multiplier || 1) > 1 &&
              Number(shift.totalHours || 0) > Number(t.from || 0),
          )
        : false;
    const dotColor = shift
      ? hasOvertime
        ? T.orange
        : getTypeColor(shift.type, T)
      : "transparent";
    const hours = shift ? Number(shift.totalHours || 0).toFixed(1) : "";

    return (
      <TouchableOpacity
        style={styles.dayWrapper}
        onPress={() => {
          try {
            Haptics.selectionAsync();
          } catch (e) {}
          onDayPress(dateStr);
        }}
        disabled={isDisabled}
        activeOpacity={0.7}
      >
        <View
          style={[
            styles.dayCircle,
            inCycle && styles.dayCycle,
            isToday && styles.dayToday,
            isSelected && styles.daySelected,
            isDisabled && styles.dayDisabled,
          ]}
        >
          <Text style={[styles.dayText, { color: dayColor }]}>{date.day}</Text>
        </View>
        <View style={[styles.dayDot, { backgroundColor: dotColor }]} />
        {shift ? (
          <Text style={styles.dayHours}>{hours}</Text>
        ) : (
          <View style={styles.dayHoursSpace} />
        )}
      </TouchableOpacity>
    );
  };

  const shift = selectedDate ? shifts[selectedDate] : null;
  const earned = shift ? Math.round(calculateEarned(selectedDate, shift)) : 0;

  return (
    <View style={styles.container}>
      <PanGestureHandler onHandlerStateChange={handlePan}>
        <Animated.View entering={FadeInDown.duration(180)} style={styles.card}>
          <Calendar
            current={displayDate ? formatDateLocal(displayDate) : undefined}
            enableSwipeMonths={false}
            dayComponent={renderDay}
            theme={{
              calendarBackground: T.cardBg,
              dayTextColor: T.text,
              monthTextColor: T.text,
              todayTextColor: T.accent,
              textDisabledColor: T.textPlaceholder,
              arrowColor: T.accent,
              textDayFontSize: 15,
              textMonthFontSize: 16,
              textMonthFontWeight: "700",
              textDayHeaderFontSize: 12,
              textDayHeaderFontColor: T.textSecondary,
              selectedDayBackgroundColor: T.accent,
              selectedDayTextColor: "#fff",
            }}
            onMonthChange={(month) => {
              if (!onMonthChange) return;
              const next = new Date(month.year, month.month - 1, 1);
              onMonthChange(next);
            }}
          />
        </Animated.View>
      </PanGestureHandler>

      <View style={styles.legend}>
        <LegendItem color={T.orange} label="נוספות" />
        <LegendItem color={T.purple} label="שבת" />
        <LegendItem color={T.green} label="חופש" />
        <LegendItem color={T.red} label="מחלה" />
      </View>

      <WeekSummaryCard
        selectedDate={selectedDate}
        shifts={shifts}
        config={config}
        calculateEarned={calculateEarned}
      />

      <ShiftDetailCard
        shift={shift}
        selectedDate={selectedDate}
        config={config}
        earned={earned}
        onDayPress={onDayPress}
        onDeleteShift={onDeleteShift}
      />
    </View>
  );
}

const LegendItem = ({ color, label }) => (
  <View style={styles.legendItem}>
    <View style={[styles.dot, { backgroundColor: color }]} />
    <Text style={styles.legendText}>{label}</Text>
  </View>
);

const styles = StyleSheet.create({
  container: {
    marginTop: 8,
    paddingHorizontal: 12,
    paddingBottom: 24,
  },
  card: {
    backgroundColor: T.cardBg,
    borderRadius: T.radiusMd,
    borderWidth: 1,
    borderColor: T.border,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 3,
  },
  legend: {
    flexDirection: "row-reverse",
    justifyContent: "center",
    marginTop: 12,
    gap: 16,
  },
  legendItem: {
    flexDirection: "row-reverse",
    alignItems: "center",
    gap: 6,
    backgroundColor: T.cardBg,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: T.border,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendText: {
    color: T.textSecondary,
    fontSize: 12,
    fontWeight: "500",
  },
  dayWrapper: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 4,
  },
  dayCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  dayCycle: {
    borderWidth: 1,
    borderColor: T.accentLight,
  },
  dayToday: {
    borderWidth: 1,
    borderColor: T.accent,
  },
  daySelected: {
    backgroundColor: T.accent,
  },
  dayDisabled: {
    opacity: 0.5,
  },
  dayText: {
    fontSize: 13,
    fontWeight: "600",
  },
  dayDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginTop: 2,
  },
  dayHours: {
    fontSize: 9,
    color: T.textMuted,
    marginTop: 1,
  },
  dayHoursSpace: {
    height: 12,
  },
});

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Calendar } from 'react-native-calendars';
import { darkTheme as T } from '../constants/theme';

export default function CalendarView({ shifts, config, selectedDate, onDayPress }) {
  const getMarkedDates = () => {
    const marked = {};

    if (selectedDate) {
      marked[selectedDate] = { selected: true, selectedColor: T.accent };
    }

    Object.keys(shifts).forEach(date => {
      const dayData = shifts[date];
      const threshold = Number((config && config.overtimeStartThreshold) || 9);
      let dotColor = T.accent;

      if (dayData.type === 'חופש') dotColor = T.green;
      else if (dayData.type === 'מחלה') dotColor = T.red;
      else if (dayData.type === 'שבת') dotColor = T.purple;
      else if (dayData.type === 'עבודה' && Number(dayData.totalHours) > threshold) dotColor = T.orange;

      marked[date] = { ...marked[date], marked: true, dotColor };
    });

    return marked;
  };

  return (
    <View style={styles.container}>
      <Calendar
        theme={{
          calendarBackground: 'transparent',
          dayTextColor: T.text,
          monthTextColor: T.accent,
          todayTextColor: T.accent,
          textDisabledColor: T.textPlaceholder,
          arrowColor: T.accent,
          textDayFontSize: 15,
          textMonthFontSize: 17,
          textMonthFontWeight: 'bold',
          textDayHeaderFontSize: 12,
          textDayHeaderFontColor: T.textSecondary,
          selectedDayBackgroundColor: T.accent,
          selectedDayTextColor: T.text,
        }}
        onDayPress={(day) => onDayPress(day.dateString)}
        markedDates={getMarkedDates()}
      />

      <View style={styles.legend}>
        <LegendItem color={T.orange} label="נוספות" />
        <LegendItem color={T.purple} label="שבת" />
        <LegendItem color={T.green} label="חופש" />
        <LegendItem color={T.red} label="מחלה" />
      </View>
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
    paddingHorizontal: 8,
  },
  legend: {
    flexDirection: 'row-reverse',
    justifyContent: 'center',
    marginTop: 16,
    gap: 20,
  },
  legendItem: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 6,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendText: {
    color: T.textSecondary,
    fontSize: 12,
    fontWeight: '500',
  },
});

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Calendar } from 'react-native-calendars';
import { darkTheme as T } from '../constants/theme';

export default function CalendarView({ shifts, config, selectedDate, onDayPress, calculateEarned }) {
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
      <View style={styles.card}>
        <Calendar
          theme={{
            calendarBackground: T.cardBg,
            dayTextColor: T.text,
            monthTextColor: T.text,
            todayTextColor: T.accent,
            textDisabledColor: T.textPlaceholder,
            arrowColor: T.accent,
            textDayFontSize: 15,
            textMonthFontSize: 16,
            textMonthFontWeight: '700',
            textDayHeaderFontSize: 12,
            textDayHeaderFontColor: T.textSecondary,
            selectedDayBackgroundColor: T.accent,
            selectedDayTextColor: '#fff',
          }}
          onDayPress={(day) => onDayPress(day.dateString)}
          markedDates={getMarkedDates()}
        />
      </View>

      <View style={styles.legend}>
        <LegendItem color={T.orange} label="נוספות" />
        <LegendItem color={T.purple} label="שבת" />
        <LegendItem color={T.green} label="חופש" />
        <LegendItem color={T.red} label="מחלה" />
      </View>

      {selectedDate && shifts[selectedDate] && (
        <View style={styles.summaryCard}>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>שעות</Text>
            <Text style={styles.summaryValue}>{shifts[selectedDate].totalHours || '0.00'}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>זמן</Text>
            <Text style={styles.summaryValue}>
              {(shifts[selectedDate].startTime || '--:--')} - {(shifts[selectedDate].endTime || '--:--')}
            </Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>שכר</Text>
            <Text style={styles.summaryValue}>
              ₪{Math.round(calculateEarned(selectedDate, shifts[selectedDate]))}
            </Text>
          </View>
        </View>
      )}
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
  },
  card: {
    backgroundColor: T.cardBg,
    borderRadius: T.radiusMd,
    borderWidth: 1,
    borderColor: T.border,
    overflow: 'hidden',
  },
  legend: {
    flexDirection: 'row-reverse',
    justifyContent: 'center',
    marginTop: 12,
    gap: 16,
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
  summaryCard: {
    marginTop: 12,
    backgroundColor: T.cardBg,
    borderRadius: T.radiusMd,
    borderWidth: 1,
    borderColor: T.border,
    padding: 12,
  },
  summaryRow: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  summaryLabel: {
    color: T.textSecondary,
    fontSize: 12,
    fontWeight: '600',
  },
  summaryValue: {
    color: T.text,
    fontSize: 14,
    fontWeight: '700',
  },
});

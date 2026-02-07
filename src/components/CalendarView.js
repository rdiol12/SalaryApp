import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Calendar } from 'react-native-calendars';

export default function CalendarView({ shifts, config, selectedDate, onDayPress }) {
  const getMarkedDates = () => {
    const marked = { [selectedDate]: { selected: true, selectedColor: '#00adf5' } };

    Object.keys(shifts).forEach(date => {
      const dayData = shifts[date];
      const threshold = Number(config.overtimeStartThreshold || 9);
      let dotColor = '#00adf5'; // כחול עבודה

      if (dayData.type === 'חופש') dotColor = '#34C759';
      else if (dayData.type === 'מחלה') dotColor = '#FF3B30';
      else if (dayData.type === 'שבת') dotColor = '#5856D6';
      else if (dayData.type === 'עבודה' && dayData.totalHours > threshold) dotColor = '#FF9500';

      marked[date] = { ...marked[date], marked: true, dotColor };
    });
    return marked;
  };

  return (
    <View style={styles.container}>
      <Calendar
        theme={{ calendarBackground: 'transparent', dayTextColor: '#fff', monthTextColor: '#00adf5', todayTextColor: '#00adf5', textDisabledColor: '#444' }}
        onDayPress={(day) => onDayPress(day.dateString)}
        markedDates={getMarkedDates()}
      />
      <View style={styles.legend}>
        <LegendItem color="#FF9500" label="נוספות" />
        <LegendItem color="#5856D6" label="שבת" />
        <LegendItem color="#34C759" label="חופש" />
        <LegendItem color="#FF3B30" label="מחלה" />
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
  container: { marginTop: 10 },
  legend: { flexDirection: 'row-reverse', justifyContent: 'center', marginTop: 20, flexWrap: 'wrap' },
  legendItem: { flexDirection: 'row-reverse', alignItems: 'center', marginLeft: 15, marginBottom: 5 },
  dot: { width: 10, height: 10, borderRadius: 5, marginLeft: 5 },
  legendText: { color: '#aaa', fontSize: 12 }
});

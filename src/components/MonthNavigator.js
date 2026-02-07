import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { darkTheme as T } from '../constants/theme';
import { formatMonthLabel } from '../utils/shiftFilters';

export default function MonthNavigator({ displayDate, onChangeMonth }) {
  const month = displayDate.getMonth();
  const year = displayDate.getFullYear();

  const goBack = () => {
    const d = new Date(displayDate);
    d.setMonth(d.getMonth() - 1);
    onChangeMonth(d);
  };

  const goForward = () => {
    const d = new Date(displayDate);
    d.setMonth(d.getMonth() + 1);
    onChangeMonth(d);
  };

  const goToday = () => {
    onChangeMonth(new Date());
  };

  const now = new Date();
  const isCurrentMonth = month === now.getMonth() && year === now.getFullYear();

  return (
    <View style={styles.container}>
      <TouchableOpacity onPress={goForward} style={styles.arrowBtn} activeOpacity={0.6}>
        <Ionicons name="chevron-forward" size={22} color={T.accent} />
      </TouchableOpacity>

      <TouchableOpacity onPress={goToday} activeOpacity={0.7} style={styles.labelBtn}>
        <Text style={styles.monthLabel}>{formatMonthLabel(month, year)}</Text>
        {!isCurrentMonth && (
          <Text style={styles.todayHint}>לחץ לחזור להיום</Text>
        )}
      </TouchableOpacity>

      <TouchableOpacity onPress={goBack} style={styles.arrowBtn} activeOpacity={0.6}>
        <Ionicons name="chevron-back" size={22} color={T.accent} />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: T.bg,
  },
  arrowBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: T.accentLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  labelBtn: {
    alignItems: 'center',
  },
  monthLabel: {
    color: T.text,
    fontSize: 17,
    fontWeight: 'bold',
  },
  todayHint: {
    color: T.accent,
    fontSize: 11,
    marginTop: 2,
  },
});

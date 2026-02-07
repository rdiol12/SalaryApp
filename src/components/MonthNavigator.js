import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import { formatMonthLabel } from '../utils/shiftFilters';

export default function MonthNavigator({ displayDate, onChangeMonth }) {
  const month = displayDate.getMonth();
  const year = displayDate.getFullYear();

  const goBack = () => {
    try { Haptics.selectionAsync(); } catch (e) {}
    const d = new Date(displayDate);
    d.setMonth(d.getMonth() - 1);
    onChangeMonth(d);
  };

  const goForward = () => {
    try { Haptics.selectionAsync(); } catch (e) {}
    const d = new Date(displayDate);
    d.setMonth(d.getMonth() + 1);
    onChangeMonth(d);
  };

  const goToday = () => {
    try { Haptics.selectionAsync(); } catch (e) {}
    onChangeMonth(new Date());
  };

  const now = new Date();
  const isCurrentMonth = month === now.getMonth() && year === now.getFullYear();

  return (
    <View style={styles.container}>
      <TouchableOpacity onPress={goForward} style={styles.arrowBtn} activeOpacity={0.6}>
        <Ionicons name="chevron-forward" size={20} color="#fff" />
      </TouchableOpacity>

      <TouchableOpacity onPress={goToday} activeOpacity={0.7} style={styles.labelBtn}>
        <Text style={styles.monthLabel}>{formatMonthLabel(month, year)}</Text>
        {!isCurrentMonth && (
          <Text style={styles.todayHint}>לחץ לחזור להיום</Text>
        )}
      </TouchableOpacity>

      <TouchableOpacity onPress={goBack} style={styles.arrowBtn} activeOpacity={0.6}>
        <Ionicons name="chevron-back" size={20} color="#fff" />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginHorizontal: 12,
    marginTop: 6,
    marginBottom: 8,
    backgroundColor: '#fff',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.06)',
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 3,
  },
  arrowBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#3E8ED0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  labelBtn: {
    alignItems: 'center',
  },
  monthLabel: {
    color: '#2B2F33',
    fontSize: 15,
    fontWeight: '700',
  },
  todayHint: {
    color: '#8B95A1',
    fontSize: 10,
    marginTop: 2,
  },
});

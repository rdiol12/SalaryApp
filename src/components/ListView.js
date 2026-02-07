import React from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';

export default function ListView({ shifts, config, onShiftPress, selectedMonth, selectedYear }) {
  
  // סינון ומיון המשמרות של החודש הנבחר
  const getMonthlyShifts = () => {
    return Object.keys(shifts)
      .filter(date => {
        const d = new Date(date);
        return d.getMonth() === selectedMonth && d.getFullYear() === selectedYear;
      })
      .sort((a, b) => new Date(b) - new Date(a)) // מהחדש לישן
      .map(date => ({ date, ...shifts[date] }));
  };

  const monthlyShifts = getMonthlyShifts();

  const renderItem = ({ item }) => (
    <TouchableOpacity style={styles.card} onPress={() => onShiftPress(item.date)}>
      <View style={styles.leftSide}>
        <Text style={styles.earned}>₪{Math.round(item.earned || 0)}</Text>
        <Text style={styles.hours}>{item.totalHours} שעות</Text>
      </View>
      
      <View style={styles.rightSide}>
        <Text style={styles.dateText}>{item.date.split('-').reverse().join('/')}</Text>
        <View style={[styles.typeBadge, { backgroundColor: getTypeColor(item.type) }]}>
          <Text style={styles.typeText}>{item.type}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {monthlyShifts.length > 0 ? (
        <FlatList
          data={monthlyShifts}
          renderItem={renderItem}
          keyExtractor={item => item.date}
          contentContainerStyle={styles.listContent}
        />
      ) : (
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>אין משמרות רשומות לחודש זה</Text>
        </View>
      )}
    </View>
  );
}

const getTypeColor = (type) => {
  switch (type) {
    case 'שבת': return '#ff9500';
    case 'מחלה': return '#ff3b30';
    case 'חופש': return '#4cd964';
    default: return '#00adf5';
  }
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  listContent: { padding: 16 },
  card: {
    backgroundColor: '#1c1c1e',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  leftSide: { alignItems: 'flex-start' },
  rightSide: { alignItems: 'flex-end' },
  earned: { color: '#4cd964', fontSize: 18, fontWeight: 'bold' },
  hours: { color: '#aaa', fontSize: 13 },
  dateText: { color: '#fff', fontSize: 16, fontWeight: '600', marginBottom: 4 },
  typeBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 4 },
  typeText: { color: '#fff', fontSize: 11, fontWeight: 'bold' },
  emptyState: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyText: { color: '#444', fontSize: 16 }
});

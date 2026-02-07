import React from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert } from 'react-native';

export default function ListView({ monthlyShifts, onDelete, onShiftPress }) {
  const handleLongDelete = (date) => {
    Alert.alert("מחיקת משמרת", "האם למחוק משמרת זו?", [
      { text: "ביטול", style: "cancel" },
      { text: "מחק", style: "destructive", onPress: () => onDelete(date) }
    ]);
  };

  return (
    <View style={styles.container}>
      <FlatList
        data={monthlyShifts}
        keyExtractor={(item) => item.date}
        renderItem={({ item }) => (
          <TouchableOpacity 
            style={styles.card} 
            onPress={() => onShiftPress(item.date, item)}
            onLongPress={() => handleLongDelete(item.date)}
          >
            <View style={styles.left}>
              <Text style={styles.earned}>₪{Math.round(item.earned)}</Text>
              <Text style={styles.hours}>{item.totalHours} שעות</Text>
            </View>
            <View style={styles.right}>
              <Text style={styles.date}>{item.date.split('-').reverse().join('.')}</Text>
              <Text style={styles.type}>{item.type} ({item.hourlyPercent}%)</Text>
            </View>
          </TouchableOpacity>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 10 },
  card: { backgroundColor: '#1c1c1e', padding: 15, borderRadius: 12, marginBottom: 10, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  earned: { color: '#4cd964', fontSize: 18, fontWeight: 'bold' },
  hours: { color: '#8e8e93', fontSize: 12 },
  date: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  type: { color: '#00adf5', fontSize: 12, textAlign: 'right' },
  right: { alignItems: 'flex-end' }
});

import React from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Animated } from 'react-native';
import { Swipeable, GestureHandlerRootView } from 'react-native-gesture-handler';

export default function ListView({ monthlyShifts, onDelete, onShiftPress }) {
  
  // פונקציה לרינדור כפתור המחיקה שמופיע בגרירה
  const renderRightActions = (progress, dragX, date) => {
    const scale = dragX.interpolate({
      inputRange: [-100, 0],
      outputRange: [1, 0],
      extrapolate: 'clamp',
    });

    return (
      <TouchableOpacity 
        style={styles.deleteAction} 
        onPress={() => onDelete(date)}
        activeOpacity={0.8}
      >
        <Animated.Text style={[styles.deleteText, { transform: [{ scale }] }]}>
          מחיקה
        </Animated.Text>
      </TouchableOpacity>
    );
  };

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <View style={styles.container}>
        <FlatList
          data={monthlyShifts}
          keyExtractor={(item) => item.date}
          renderItem={({ item }) => (
            <Swipeable 
              renderRightActions={(p, d) => renderRightActions(p, d, item.date)}
              friction={2}
            >
              <TouchableOpacity 
                style={styles.card} 
                onPress={() => onShiftPress(item.date, item)}
                activeOpacity={1}
              >
                <View style={styles.leftSide}>
                  <Text style={styles.earned}>₪{Math.round(item.earned)}</Text>
                  <Text style={styles.hours}>{item.totalHours} שעות</Text>
                </View>
                <View style={styles.rightSide}>
                  <Text style={styles.dateText}>{item.date.split('-').reverse().join('.')}</Text>
                  <Text style={styles.typeText}>
                    {item.type} {item.hourlyPercent !== '100' ? `(${item.hourlyPercent}%)` : ''}
                  </Text>
                </View>
              </TouchableOpacity>
            </Swipeable>
          )}
        />
      </View>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  card: { 
    backgroundColor: '#1c1c1e', 
    padding: 18, 
    flexDirection: 'row', 
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 0.5,
    borderBottomColor: '#333'
  },
  rightSide: { alignItems: 'flex-end' },
  leftSide: { alignItems: 'flex-start' },
  dateText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  typeText: { color: '#00adf5', fontSize: 12, marginTop: 4 },
  earned: { color: '#4cd964', fontSize: 18, fontWeight: 'bold' },
  hours: { color: '#8e8e93', fontSize: 12 },
  deleteAction: {
    backgroundColor: '#ff3b30',
    justifyContent: 'center',
    alignItems: 'center',
    width: 100,
    height: '100%',
  },
  deleteText: { color: '#fff', fontWeight: 'bold', fontSize: 16 }
});

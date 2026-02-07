import React from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Animated, Alert } from 'react-native';
import { Swipeable, GestureHandlerRootView } from 'react-native-gesture-handler';

export default function ListView({ monthlyShifts, onDelete, onShiftPress }) {

  // הפונקציה שיוצרת את כפתור המחיקה האדום שמופיע בגרירה
  const renderRightActions = (progress, dragX, date) => {
    // אנימציה קטנה כדי שהכפתור יחליק יפה
    const trans = dragX.interpolate({
      inputRange: [-100, 0],
      outputRange: [0, 100],
      extrapolate: 'clamp',
    });

    return (
      <TouchableOpacity 
        style={styles.deleteButton} 
        onPress={() => {
          Alert.alert("מחיקה", "האם למחוק משמרת זו?", [
            { text: "ביטול", style: "cancel" },
            { text: "מחק", style: "destructive", onPress: () => onDelete(date) }
          ]);
        }}
      >
        <Animated.View style={{ transform: [{ translateX: trans }] }}>
          <Text style={styles.deleteText}>מחיקה</Text>
        </Animated.View>
      </TouchableOpacity>
    );
  };

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <View style={styles.container}>
        {monthlyShifts.length > 0 ? (
          <FlatList
            data={monthlyShifts}
            keyExtractor={(item) => item.date}
            renderItem={({ item }) => (
              <Swipeable
                renderRightActions={(p, d) => renderRightActions(p, d, item.date)}
                rightThreshold={40} // מתי המשיכה נחשבת כפתיחה
              >
                <TouchableOpacity 
                  style={styles.card} 
                  onPress={() => onShiftPress(item.date, item)} // לחיצה לעריכה
                  activeOpacity={1}
                >
                  <View style={styles.leftSide}>
                    <Text style={styles.earned}>₪{Math.round(item.earned)}</Text>
                    <Text style={styles.hours}>{item.totalHours} שעות</Text>
                  </View>

                  <View style={styles.rightSide}>
                    <Text style={styles.dateText}>{item.date.split('-').reverse().join('.')}</Text>
                    <Text style={[styles.typeText, { color: item.type === 'שבת' ? '#ff9500' : '#00adf5' }]}>
                      {item.type} {item.hourlyPercent !== '100' ? `(${item.hourlyPercent}%)` : ''}
                    </Text>
                    {item.notes ? <Text style={styles.notesPreview} numberOfLines={1}>{item.notes}</Text> : null}
                  </View>
                </TouchableOpacity>
              </Swipeable>
            )}
          />
        ) : (
          <View style={styles.empty}><Text style={styles.emptyText}>אין משמרות להצגה</Text></View>
        )}
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
  rightSide: { alignItems: 'flex-end', flex: 1 },
  leftSide: { alignItems: 'flex-start', marginRight: 20 },
  dateText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  typeText: { fontSize: 12, marginTop: 4 },
  notesPreview: { color: '#8e8e93', fontSize: 11, marginTop: 4, fontStyle: 'italic' },
  earned: { color: '#4cd964', fontSize: 18, fontWeight: 'bold' },
  hours: { color: '#8e8e93', fontSize: 12 },
  deleteButton: { 
    backgroundColor: '#ff3b30', 
    justifyContent: 'center', 
    alignItems: 'center', 
    width: 100 
  },
  deleteText: { color: '#fff', fontWeight: 'bold' },
  empty: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyText: { color: '#444' }
});

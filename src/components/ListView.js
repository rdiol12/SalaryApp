import React from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Animated, Alert } from 'react-native';
import { Swipeable, GestureHandlerRootView } from 'react-native-gesture-handler';
import { Ionicons } from '@expo/vector-icons';
import { darkTheme as T } from '../constants/theme';

const TYPE_STYLES = {
  'עבודה': { color: T.accent, bg: T.accentLight, icon: 'briefcase-outline' },
  'שבת': { color: T.orange, bg: T.orangeLight, icon: 'sunny-outline' },
  'מחלה': { color: T.red, bg: T.redLight, icon: 'medkit-outline' },
  'חופש': { color: T.green, bg: T.greenLight, icon: 'leaf-outline' },
};

export default function ListView({ monthlyShifts, onDelete, onShiftPress }) {

  const renderRightActions = (progress, dragX, date) => {
    const trans = dragX.interpolate({
      inputRange: [-100, 0],
      outputRange: [0, 100],
      extrapolate: 'clamp',
    });

    return (
      <TouchableOpacity
        style={styles.deleteButton}
        onPress={() => {
          Alert.alert('מחיקה', 'האם למחוק משמרת זו?', [
            { text: 'ביטול', style: 'cancel' },
            { text: 'מחק', style: 'destructive', onPress: () => onDelete(date) },
          ]);
        }}
      >
        <Animated.View style={[styles.deleteInner, { transform: [{ translateX: trans }] }]}>
          <Ionicons name="trash-outline" size={22} color="#fff" />
          <Text style={styles.deleteText}>מחיקה</Text>
        </Animated.View>
      </TouchableOpacity>
    );
  };

  const formatDate = (dateStr) => {
    const parts = dateStr.split('-');
    return `${parts[2]}.${parts[1]}`;
  };

  const getDayName = (dateStr) => {
    const days = ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי', 'שבת'];
    return days[new Date(dateStr).getDay()];
  };

  const renderItem = ({ item }) => {
    const typeStyle = TYPE_STYLES[item.type] || TYPE_STYLES['עבודה'];

    return (
      <Swipeable
        renderRightActions={(p, d) => renderRightActions(p, d, item.date)}
        rightThreshold={40}
      >
        <TouchableOpacity
          style={styles.card}
          onPress={() => onShiftPress(item.date, item)}
          activeOpacity={0.7}
        >
          <View style={styles.leftSide}>
            <Text style={styles.earned}>₪{Math.round(item.earned)}</Text>
            <Text style={styles.hours}>{item.totalHours} שעות</Text>
          </View>

          <View style={styles.rightSide}>
            <View style={styles.dateRow}>
              <Text style={styles.dateText}>{formatDate(item.date)}</Text>
              <Text style={styles.dayName}>יום {getDayName(item.date)}</Text>
            </View>

            <View style={[styles.typeBadge, { backgroundColor: typeStyle.bg }]}>
              <Ionicons name={typeStyle.icon} size={12} color={typeStyle.color} />
              <Text style={[styles.typeText, { color: typeStyle.color }]}>
                {item.type}
                {item.hourlyPercent && item.hourlyPercent !== '100' ? ` ${item.hourlyPercent}%` : ''}
              </Text>
            </View>

            {item.notes ? (
              <Text style={styles.notesPreview} numberOfLines={1}>{item.notes}</Text>
            ) : null}
          </View>
        </TouchableOpacity>
      </Swipeable>
    );
  };

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <View style={styles.container}>
        {monthlyShifts.length > 0 ? (
          <FlatList
            data={monthlyShifts}
            keyExtractor={(item) => item.date}
            renderItem={renderItem}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
          />
        ) : (
          <View style={styles.empty}>
            <Ionicons name="calendar-outline" size={48} color={T.textPlaceholder} />
            <Text style={styles.emptyTitle}>אין משמרות להצגה</Text>
            <Text style={styles.emptySubtext}>הוסף משמרת מלוח השנה</Text>
          </View>
        )}
      </View>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: T.bg,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 20,
  },
  card: {
    backgroundColor: T.cardBg,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderRadius: T.radiusMd,
    marginBottom: 8,
  },
  rightSide: {
    alignItems: 'flex-end',
    flex: 1,
    gap: 6,
  },
  leftSide: {
    alignItems: 'flex-start',
    marginRight: 16,
  },
  dateRow: {
    alignItems: 'flex-end',
  },
  dateText: {
    color: T.text,
    fontSize: 17,
    fontWeight: 'bold',
  },
  dayName: {
    color: T.textSecondary,
    fontSize: 12,
    marginTop: 1,
  },
  typeBadge: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    gap: 4,
  },
  typeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  notesPreview: {
    color: T.textMuted,
    fontSize: 11,
    fontStyle: 'italic',
  },
  earned: {
    color: T.green,
    fontSize: 20,
    fontWeight: 'bold',
  },
  hours: {
    color: T.textSecondary,
    fontSize: 12,
    marginTop: 2,
  },
  deleteButton: {
    backgroundColor: T.red,
    justifyContent: 'center',
    alignItems: 'center',
    width: 90,
    borderRadius: T.radiusMd,
    marginBottom: 8,
    marginLeft: 8,
  },
  deleteInner: {
    alignItems: 'center',
    gap: 4,
  },
  deleteText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 12,
  },
  empty: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  emptyTitle: {
    color: T.textSecondary,
    fontSize: 16,
    fontWeight: '600',
  },
  emptySubtext: {
    color: T.textMuted,
    fontSize: 13,
  },
});

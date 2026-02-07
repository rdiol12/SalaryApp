import React from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert, Animated as RNAnimated } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Swipeable } from 'react-native-gesture-handler';
import { Ionicons } from '@expo/vector-icons';
import { darkTheme as T } from '../constants/theme';
import { parseDateLocal } from '../utils/shiftFilters';

const TYPE_STYLES = {
  עבודה: { color: T.accent, strip: T.accent },
  שבת: { color: T.orange, strip: T.orange },
  מחלה: { color: T.red, strip: T.red },
  חופש: { color: T.green, strip: T.green },
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
        <RNAnimated.View style={[styles.deleteInner, { transform: [{ translateX: trans }] }]}>
          <Ionicons name="trash-outline" size={20} color="#fff" />
          <Text style={styles.deleteText}>מחיקה</Text>
        </RNAnimated.View>
      </TouchableOpacity>
    );
  };

  const formatDate = (dateStr) => {
    const parts = dateStr.split('-');
    return `${parts[2]}.${parts[1]}`;
  };

  const getDayName = (dateStr) => {
    const days = ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי', 'שבת'];
    return days[parseDateLocal(dateStr).getDay()];
  };

  const renderItem = ({ item }) => {
    const typeStyle = TYPE_STYLES[item.type] || TYPE_STYLES['עבודה'];
    const start = item.startTime || '--:--';
    const end = item.endTime || '--:--';
    const hours = item.totalHours || '0.00';

    return (
      <Swipeable
        renderRightActions={(p, d) => renderRightActions(p, d, item.date)}
        rightThreshold={40}
      >
        <Animated.View entering={FadeInDown.duration(180)}>
          <TouchableOpacity
            style={styles.rowCard}
            onPress={() => onShiftPress(item.date, item)}
            activeOpacity={0.7}
          >
            <View style={[styles.typeStrip, { backgroundColor: typeStyle.strip }]} />

            <View style={styles.cellDate}>
              <Text style={styles.dateText}>{formatDate(item.date)}</Text>
              <Text style={styles.dayName}>{getDayName(item.date)}</Text>
            </View>

            <View style={styles.cell}>
              <Text style={styles.cellValue}>{start}</Text>
              <Text style={styles.cellLabel}>התחלה</Text>
            </View>

            <View style={styles.cell}>
              <Text style={styles.cellValue}>{end}</Text>
              <Text style={styles.cellLabel}>סיום</Text>
            </View>

            <View style={styles.cell}>
              <Text style={styles.cellValue}>{hours}</Text>
              <Text style={styles.cellLabel}>שעות</Text>
            </View>
          </TouchableOpacity>
        </Animated.View>
      </Swipeable>
    );
  };

  return (
    <View style={styles.container}>
      {monthlyShifts.length > 0 ? (
        <FlatList
          data={monthlyShifts}
          keyExtractor={(item) => item.date}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={() => (
            <View style={styles.headerRow}>
              <Text style={[styles.headerCell, styles.headerDate]}>יום</Text>
              <Text style={styles.headerCell}>התחלה</Text>
              <Text style={styles.headerCell}>סיום</Text>
              <Text style={styles.headerCell}>שעות</Text>
            </View>
          )}
        />
      ) : (
        <View style={styles.empty}>
          <Ionicons name="calendar-outline" size={48} color={T.textPlaceholder} />
          <Text style={styles.emptyTitle}>אין משמרות להצגה</Text>
          <Text style={styles.emptySubtext}>הוסף משמרת מלוח השנה או מכפתור הפלוס</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: T.bg,
  },
  listContent: {
    paddingHorizontal: 12,
    paddingTop: 8,
    paddingBottom: 20,
  },
  headerRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    backgroundColor: T.cardBg,
    borderRadius: T.radiusMd,
    borderWidth: 1,
    borderColor: T.border,
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 3,
  },
  headerCell: {
    flex: 1,
    textAlign: 'center',
    color: T.textSecondary,
    fontSize: 12,
    fontWeight: '600',
  },
  headerDate: {
    textAlign: 'right',
  },
  rowCard: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    backgroundColor: T.cardBg,
    borderRadius: T.radiusMd,
    borderWidth: 1,
    borderColor: T.border,
    marginBottom: 8,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  typeStrip: {
    width: 6,
    height: '100%',
  },
  cellDate: {
    flex: 1.2,
    alignItems: 'flex-end',
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  cell: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 10,
  },
  dateText: {
    color: T.text,
    fontSize: 15,
    fontWeight: '700',
  },
  dayName: {
    color: T.textSecondary,
    fontSize: 11,
    marginTop: 2,
  },
  cellValue: {
    color: T.text,
    fontSize: 14,
    fontWeight: '600',
  },
  cellLabel: {
    color: T.textSecondary,
    fontSize: 10,
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
    textAlign: 'center',
    paddingHorizontal: 16,
  },
});

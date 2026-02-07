import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { Calendar } from 'react-native-calendars';
import { PanGestureHandler, State, Swipeable } from 'react-native-gesture-handler';
import Animated, { FadeInDown } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import { darkTheme as T } from '../constants/theme';
import { formatDateLocal, parseDateLocal } from '../utils/shiftFilters';

export default function CalendarView({ shifts, config, selectedDate, displayDate, onMonthChange, onDayPress, calculateEarned, onDeleteShift }) {
  const getOvertimeTiers = () => {
    const tiers = Array.isArray(config.overtimeTiers) ? config.overtimeTiers : [];
    if (tiers.length > 0) return tiers;
    const threshold = Number(config.overtimeStartThreshold || 0);
    const mult = Number(config.overtimeMultiplier || 1.25);
    if (!threshold) return [{ from: 0, to: null, multiplier: 1 }];
    return [
      { from: 0, to: threshold, multiplier: 1 },
      { from: threshold, to: null, multiplier: mult },
    ];
  };

  const computeTieredBreakdown = (hours, rate, percent) => {
    const tiers = getOvertimeTiers()
      .map(t => ({
        from: Number(t.from || 0),
        to: t.to === null || t.to === '' ? null : Number(t.to),
        multiplier: Number(t.multiplier || 1),
      }))
      .filter(t => Number.isFinite(t.from) && Number.isFinite(t.multiplier))
      .sort((a, b) => a.from - b.from);

    const breakdown = [];
    tiers.forEach((tier) => {
      const end = tier.to === null ? Infinity : tier.to;
      const tierHours = Math.max(0, Math.min(hours, end) - tier.from);
      if (tierHours <= 0) return;
      const amount = tierHours * rate * percent * tier.multiplier;
      breakdown.push({ ...tier, hours: tierHours, amount });
    });
    return breakdown;
  };

  const getTypeColor = (type) => {
    if (type === 'חופש') return T.green;
    if (type === 'מחלה') return T.red;
    if (type === 'שבת') return T.purple;
    return T.accent;
  };

  const isDateInSalaryCycle = (dateStr) => {
    const start = Number(config.salaryStartDay || 1);
    const end = Number(config.salaryEndDay || 31);
    if (!Number.isFinite(start) || !Number.isFinite(end)) return false;
    const day = parseDateLocal(dateStr).getDate();
    if (start <= end) return day >= start && day <= end;
    return day >= start || day <= end;
  };

  const handlePan = ({ nativeEvent }) => {
    if (!onMonthChange || nativeEvent.state !== State.END) return;
    if (Math.abs(nativeEvent.translationX) < 60) return;
    const base = displayDate ? new Date(displayDate) : new Date();
    const next = new Date(base);
    next.setMonth(base.getMonth() + (nativeEvent.translationX < 0 ? 1 : -1));
    try { Haptics.selectionAsync(); } catch (e) {}
    onMonthChange(next);
  };

  const renderDay = ({ date, state }) => {
    const dateStr = date.dateString;
    const shift = shifts[dateStr];
    const isSelected = selectedDate === dateStr;
    const isToday = dateStr === formatDateLocal(new Date());
    const isDisabled = state === 'disabled';
    const inCycle = isDateInSalaryCycle(dateStr);
    const dayColor = isDisabled ? T.textPlaceholder : (isSelected ? '#fff' : T.text);
    const hasOvertime = shift && shift.type === 'עבודה'
      ? getOvertimeTiers().some(t => Number(t.multiplier || 1) > 1 && Number(shift.totalHours || 0) > Number(t.from || 0))
      : false;
    const dotColor = shift ? (hasOvertime ? T.orange : getTypeColor(shift.type)) : 'transparent';
    const hours = shift ? Number(shift.totalHours || 0).toFixed(1) : '';

    return (
      <TouchableOpacity
        style={styles.dayWrapper}
        onPress={() => {
          try { Haptics.selectionAsync(); } catch (e) {}
          onDayPress(dateStr);
        }}
        disabled={isDisabled}
        activeOpacity={0.7}
      >
        <View style={[
          styles.dayCircle,
          inCycle && styles.dayCycle,
          isToday && styles.dayToday,
          isSelected && styles.daySelected,
          isDisabled && styles.dayDisabled,
        ]}>
          <Text style={[styles.dayText, { color: dayColor }]}>{date.day}</Text>
        </View>
        <View style={[styles.dayDot, { backgroundColor: dotColor }]} />
        {shift ? <Text style={styles.dayHours}>{hours}</Text> : <View style={styles.dayHoursSpace} />}
      </TouchableOpacity>
    );
  };

  const getWeekSummary = () => {
    const base = selectedDate ? parseDateLocal(selectedDate) : new Date();
    const start = new Date(base);
    start.setDate(base.getDate() - base.getDay());
    const end = new Date(start);
    end.setDate(start.getDate() + 6);

    let totalHours = 0;
    let totalEarned = 0;
    let shiftCount = 0;
    let overtimeHours = 0;
    let overtimeExtra = 0;
    let maxMultiplier = 1;

    for (let i = 0; i < 7; i++) {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      const key = formatDateLocal(d);
      if (shifts[key]) {
        shiftCount += 1;
        const shift = shifts[key];
        const shiftHours = Number(shift.totalHours || 0);
        totalHours += shiftHours;
        totalEarned += calculateEarned(key, shift);

        if (shift.type === 'עבודה') {
          let hours = shiftHours;
          if (config.isBreakDeducted && hours > 6) {
            hours -= Number(config.breakDeduction || 0) / 60;
          }
          const rate = Number(config.hourlyRate || 0);
          const percent = Number(shift.hourlyPercent || 100) / 100;
          const breakdown = computeTieredBreakdown(hours, rate, percent);
          breakdown.forEach((b) => {
            if (b.multiplier > 1) {
              overtimeHours += b.hours;
              overtimeExtra += b.hours * rate * percent * (b.multiplier - 1);
              if (b.multiplier > maxMultiplier) maxMultiplier = b.multiplier;
            }
          });
        }
      }
    }

    return {
      range: `${String(start.getDate()).padStart(2, '0')}.${String(start.getMonth() + 1).padStart(2, '0')} - ${String(end.getDate()).padStart(2, '0')}.${String(end.getMonth() + 1).padStart(2, '0')}`,
      totalHours: totalHours.toFixed(1),
      totalEarned: Math.round(totalEarned),
      shiftCount,
      overtimeHours: overtimeHours.toFixed(1),
      overtimeExtra: Math.round(overtimeExtra),
      maxMultiplier: Math.round(maxMultiplier * 100),
    };
  };

  const week = getWeekSummary();
  const shift = selectedDate ? shifts[selectedDate] : null;
  const earned = shift ? Math.round(calculateEarned(selectedDate, shift)) : 0;
  const rate = Number(config.hourlyRate || 0);
  const percent = Number(shift?.hourlyPercent || 100) / 100;
  const hours = Number(shift?.totalHours || 0);
  const overtimeBreakdown = shift && shift.type === 'עבודה'
    ? computeTieredBreakdown(hours, rate, percent)
    : [];

  const renderSwipeRight = () => (
    <TouchableOpacity
      style={styles.swipeDelete}
      onPress={() => {
        Alert.alert('מחיקה', 'למחוק משמרת זו?', [
          { text: 'ביטול', style: 'cancel' },
          { text: 'מחק', style: 'destructive', onPress: () => onDeleteShift?.(selectedDate) },
        ]);
      }}
      activeOpacity={0.7}
    >
      <Ionicons name="trash-outline" size={18} color="#fff" />
      <Text style={styles.swipeText}>מחיקה</Text>
    </TouchableOpacity>
  );

  const renderSwipeLeft = () => (
    <TouchableOpacity
      style={styles.swipeEdit}
      onPress={() => onDayPress(selectedDate)}
      activeOpacity={0.7}
    >
      <Ionicons name="create-outline" size={18} color="#fff" />
      <Text style={styles.swipeText}>עדכון</Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <PanGestureHandler onHandlerStateChange={handlePan}>
        <Animated.View entering={FadeInDown.duration(180)} style={styles.card}>
          <Calendar
            current={displayDate ? formatDateLocal(displayDate) : undefined}
            enableSwipeMonths={false}
            dayComponent={renderDay}
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
            onMonthChange={(month) => {
              if (!onMonthChange) return;
              const next = new Date(month.year, month.month - 1, 1);
              onMonthChange(next);
            }}
          />
        </Animated.View>
      </PanGestureHandler>

      <View style={styles.legend}>
        <LegendItem color={T.orange} label="נוספות" />
        <LegendItem color={T.purple} label="שבת" />
        <LegendItem color={T.green} label="חופש" />
        <LegendItem color={T.red} label="מחלה" />
      </View>

      <Animated.View entering={FadeInDown.duration(160)} style={styles.summaryCard}>
        <View style={styles.summaryHeader}>
          <Text style={styles.summaryTitle}>סיכום שבועי</Text>
          <Text style={styles.summaryRange}>{week.range}</Text>
        </View>
        <View style={styles.summaryGrid}>
          <SummaryItem label="שעות" value={week.totalHours} />
          <SummaryItem label="משמרות" value={week.shiftCount.toString()} />
          <SummaryItem label="שכר" value={`₪${week.totalEarned}`} />
        </View>
        <View style={[styles.summaryGrid, styles.summaryGridSecondary]}>
          <SummaryItem label="שעות נוספות" value={week.overtimeHours} />
          <SummaryItem label="תוספת" value={`₪${week.overtimeExtra}`} />
          <SummaryItem label="מקס %'" value={`${week.maxMultiplier}%`} />
        </View>
      </Animated.View>

      {shift && (
        <Swipeable renderRightActions={renderSwipeRight} renderLeftActions={renderSwipeLeft}>
          <Animated.View entering={FadeInDown.duration(180)} style={styles.shiftCard}>
            <View style={styles.shiftHeader}>
              <View style={styles.shiftHeaderRight}>
                <Ionicons name="time-outline" size={16} color={T.textSecondary} />
                <Text style={styles.shiftHeaderTitle}>פרטי משמרת</Text>
              </View>
              <View style={styles.shiftHeaderActions}>
                <TouchableOpacity
                  style={styles.shiftEditBtn}
                  onPress={() => onDayPress(selectedDate)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.shiftEditText}>עדכון</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.shiftDeleteBtn}
                  onPress={() => {
                    Alert.alert('מחיקה', 'למחוק משמרת זו?', [
                      { text: 'ביטול', style: 'cancel' },
                      { text: 'מחק', style: 'destructive', onPress: () => onDeleteShift?.(selectedDate) },
                    ]);
                  }}
                  activeOpacity={0.7}
                >
                  <Ionicons name="trash-outline" size={16} color="#fff" />
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.shiftTimeRow}>
              <View style={styles.totalHoursBox}>
                <Text style={styles.totalHoursValue}>{shift.totalHours || '0.00'}</Text>
                <Text style={styles.totalHoursLabel}>סך שעות</Text>
              </View>

              <View style={styles.timeRange}>
                <View style={styles.timeCol}>
                  <Text style={styles.timeValue}>{shift.startTime || '--:--'}</Text>
                  <Text style={styles.timeLabel}>זמן התחלה</Text>
                </View>
                <Text style={styles.timeDash}>-</Text>
                <View style={styles.timeCol}>
                  <Text style={styles.timeValue}>{shift.endTime || '--:--'}</Text>
                  <Text style={styles.timeLabel}>זמן סיום</Text>
                </View>
              </View>
            </View>

            <View style={styles.shiftSection}>
              <View style={styles.sectionHeaderRow}>
                <Ionicons name="options-outline" size={14} color={T.textSecondary} />
                <Text style={styles.sectionHeaderText}>תעריף</Text>
              </View>
              <View style={styles.rateGrid}>
                <InfoCell label="סוג" value={shift.type || 'עבודה'} />
                <InfoCell label="תעריף" value={`${shift.hourlyPercent || '100'}%`} />
                <InfoCell label="שעות" value={shift.totalHours || '0.00'} />
              </View>
            </View>

            <View style={styles.shiftSection}>
              <View style={styles.sectionHeaderRow}>
                <Ionicons name="trending-up-outline" size={14} color={T.textSecondary} />
                <Text style={styles.sectionHeaderText}>שעות נוספות</Text>
              </View>
              {overtimeBreakdown.length === 0 ? (
                <Text style={styles.noOvertimeText}>אין שעות נוספות</Text>
              ) : (
                overtimeBreakdown.map((b, idx) => (
                  <View key={`${b.from}-${b.to}-${idx}`} style={styles.overtimeRow}>
                    <Text style={styles.overtimeValue}>₪{Math.round(b.amount)}</Text>
                    <Text style={styles.overtimeLabel}>
                      {b.to === null ? `מעל ${b.from}` : `${b.from}–${b.to}`} שעות · {Math.round(b.multiplier * 100)}%
                    </Text>
                    <Text style={styles.overtimeHours}>{b.hours.toFixed(2)} שעות</Text>
                  </View>
                ))
              )}
            </View>

            <View style={styles.shiftSection}>
              <View style={styles.sectionHeaderRow}>
                <Ionicons name="cash-outline" size={14} color={T.textSecondary} />
                <Text style={styles.sectionHeaderText}>שכר</Text>
              </View>
              <Text style={styles.payValue}>₪{earned}</Text>
              <Text style={styles.paySub}>מחושב לפי שכר שעתי</Text>
            </View>
          </Animated.View>
        </Swipeable>
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

const SummaryItem = ({ label, value }) => (
  <View style={styles.summaryItem}>
    <Text style={styles.summaryValue}>{value}</Text>
    <Text style={styles.summaryLabel}>{label}</Text>
  </View>
);

const InfoCell = ({ label, value }) => (
  <View style={styles.infoCell}>
    <Text style={styles.infoValue}>{value}</Text>
    <Text style={styles.infoLabel}>{label}</Text>
  </View>
);

const styles = StyleSheet.create({
  container: {
    marginTop: 8,
    paddingHorizontal: 12,
    paddingBottom: 24,
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
  summaryHeader: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  summaryTitle: {
    color: T.text,
    fontSize: 14,
    fontWeight: '700',
  },
  summaryRange: {
    color: T.textSecondary,
    fontSize: 12,
  },
  summaryGrid: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-around',
  },
  summaryGridSecondary: {
    marginTop: 8,
  },
  summaryItem: {
    alignItems: 'center',
  },
  summaryValue: {
    color: T.accent,
    fontSize: 16,
    fontWeight: '800',
  },
  summaryLabel: {
    color: T.textSecondary,
    fontSize: 11,
    marginTop: 2,
  },
  summaryCard: {
    marginTop: 12,
    backgroundColor: T.cardBg,
    borderRadius: T.radiusMd,
    borderWidth: 1,
    borderColor: T.border,
    padding: 12,
  },
  shiftCard: {
    marginTop: 12,
    backgroundColor: T.cardBg,
    borderRadius: T.radiusMd,
    borderWidth: 1,
    borderColor: T.border,
    padding: 12,
  },
  shiftHeader: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  shiftHeaderRight: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 6,
  },
  shiftHeaderTitle: {
    color: T.text,
    fontSize: 13,
    fontWeight: '700',
  },
  shiftHeaderActions: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 8,
  },
  shiftEditBtn: {
    backgroundColor: T.accentLight,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
  },
  shiftEditText: {
    color: T.accent,
    fontSize: 12,
    fontWeight: '700',
  },
  shiftDeleteBtn: {
    backgroundColor: T.red,
    width: 32,
    height: 28,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  shiftTimeRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 8,
  },
  totalHoursBox: {
    width: 80,
    backgroundColor: T.cardBgElevated,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: T.border,
    paddingVertical: 8,
    alignItems: 'center',
  },
  totalHoursValue: {
    color: T.text,
    fontSize: 16,
    fontWeight: '700',
  },
  totalHoursLabel: {
    color: T.textSecondary,
    fontSize: 10,
    marginTop: 2,
  },
  timeRange: {
    flex: 1,
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  timeCol: {
    alignItems: 'center',
  },
  timeValue: {
    color: T.text,
    fontSize: 18,
    fontWeight: '700',
  },
  timeLabel: {
    color: T.textSecondary,
    fontSize: 10,
    marginTop: 2,
  },
  timeDash: {
    color: T.textMuted,
    fontSize: 16,
    fontWeight: '700',
  },
  shiftSection: {
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: T.divider,
  },
  sectionHeaderRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  sectionHeaderText: {
    color: T.textSecondary,
    fontSize: 12,
    fontWeight: '600',
  },
  rateGrid: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-around',
  },
  infoCell: {
    alignItems: 'center',
  },
  infoValue: {
    color: T.text,
    fontSize: 13,
    fontWeight: '700',
  },
  infoLabel: {
    color: T.textSecondary,
    fontSize: 10,
    marginTop: 2,
  },
  noOvertimeText: {
    color: T.textMuted,
    fontSize: 12,
    textAlign: 'right',
  },
  overtimeRow: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  overtimeLabel: {
    color: T.textSecondary,
    fontSize: 11,
  },
  overtimeValue: {
    color: T.text,
    fontSize: 12,
    fontWeight: '700',
  },
  overtimeHours: {
    color: T.textMuted,
    fontSize: 11,
  },
  payValue: {
    color: T.accent,
    fontSize: 22,
    fontWeight: '800',
    textAlign: 'center',
  },
  paySub: {
    color: T.textSecondary,
    fontSize: 11,
    marginTop: 4,
    textAlign: 'center',
  },
  dayWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
  },
  dayCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayCycle: {
    borderWidth: 1,
    borderColor: T.accentLight,
  },
  dayToday: {
    borderWidth: 1,
    borderColor: T.accent,
  },
  daySelected: {
    backgroundColor: T.accent,
  },
  dayDisabled: {
    opacity: 0.5,
  },
  dayText: {
    fontSize: 13,
    fontWeight: '600',
  },
  dayDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginTop: 2,
  },
  dayHours: {
    fontSize: 9,
    color: T.textMuted,
    marginTop: 1,
  },
  dayHoursSpace: {
    height: 12,
  },
  swipeDelete: {
    backgroundColor: T.red,
    width: 80,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: T.radiusMd,
    marginTop: 12,
  },
  swipeEdit: {
    backgroundColor: T.accent,
    width: 80,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: T.radiusMd,
    marginTop: 12,
  },
  swipeText: {
    color: '#fff',
    fontSize: 11,
    marginTop: 4,
    fontWeight: '600',
  },
});

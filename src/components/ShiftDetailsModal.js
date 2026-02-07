import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Modal, TextInput, TouchableOpacity, ScrollView, SafeAreaView } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Ionicons } from '@expo/vector-icons';
import { darkTheme as T } from '../constants/theme';
import { parseDateLocal } from '../utils/shiftFilters';

const SHIFT_TYPES = [
  { value: 'עבודה', icon: 'briefcase-outline', color: T.accent },
  { value: 'שבת', icon: 'sunny-outline', color: T.orange },
  { value: 'מחלה', icon: 'medkit-outline', color: T.red },
  { value: 'חופש', icon: 'leaf-outline', color: T.green },
];

export default function ShiftDetailsModal({ visible, date, existingData, onSave, onClose }) {
  const [shift, setShift] = useState({
    startTime: '08:00',
    endTime: '17:00',
    totalHours: '9.00',
    type: 'עבודה',
    bonus: '0',
    notes: '',
    hourlyPercent: '100',
  });
  const [showPicker, setShowPicker] = useState({ field: null, visible: false });

  const formatTime = (d) => {
    const hh = String(d.getHours()).padStart(2, '0');
    const mm = String(d.getMinutes()).padStart(2, '0');
    return `${hh}:${mm}`;
  };

  const parseTimeToDate = (dateStr, timeStr) => {
    const base = dateStr ? parseDateLocal(dateStr) : new Date();
    const [hh, mm] = (timeStr || '00:00').split(':').map(Number);
    const next = new Date(base);
    next.setHours(hh || 0, mm || 0, 0, 0);
    return next;
  };

  const computeTotalHours = (startStr, endStr) => {
    const [sh, sm] = (startStr || '').split(':').map(Number);
    const [eh, em] = (endStr || '').split(':').map(Number);
    if ([sh, sm, eh, em].some(n => Number.isNaN(n))) return '';
    let diff = (eh * 60 + em) - (sh * 60 + sm);
    if (diff < 0) diff += 24 * 60;
    return (diff / 60).toFixed(2);
  };

  useEffect(() => {
    if (existingData) {
      const startTime = existingData.startTime || '08:00';
      const endTime = existingData.endTime || '17:00';
      const totalHours = computeTotalHours(startTime, endTime) || existingData.totalHours || '0.00';
      setShift({ ...existingData, startTime, endTime, totalHours });
    } else {
      const totalHours = computeTotalHours('08:00', '17:00');
      setShift({ startTime: '08:00', endTime: '17:00', totalHours, type: 'עבודה', bonus: '0', notes: '', hourlyPercent: '100' });
    }
  }, [visible, existingData]);

  const formatDisplayDate = (dateStr) => {
    if (!dateStr) return '';
    const parts = dateStr.split('-');
    if (parts.length !== 3) return dateStr;
    return `${parts[2]}.${parts[1]}.${parts[0]}`;
  };

  const handleSave = () => {
    const totalHours = computeTotalHours(shift.startTime, shift.endTime) || shift.totalHours || '0.00';
    onSave(date, { ...shift, totalHours });
  };

  return (
    <Modal visible={visible} animationType="slide">
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.headerBtn} activeOpacity={0.6}>
            <Text style={styles.cancelText}>ביטול</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>פרטי משמרת</Text>
          <TouchableOpacity onPress={handleSave} style={styles.headerBtn} activeOpacity={0.6}>
            <Text style={styles.saveText}>שמור</Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.dateCard}>
            <Ionicons name="calendar-outline" size={16} color={T.accent} />
            <Text style={styles.dateText}>{formatDisplayDate(date)}</Text>
          </View>

          <Text style={styles.sectionLabel}>סוג משמרת</Text>
          <View style={styles.typeRow}>
            {SHIFT_TYPES.map((t) => {
              const active = shift.type === t.value;
              return (
                <TouchableOpacity
                  key={t.value}
                  style={[styles.typeBtn, active && { backgroundColor: t.color + '22', borderColor: t.color }]}
                  onPress={() => setShift({ ...shift, type: t.value })}
                  activeOpacity={0.7}
                >
                  <Ionicons name={t.icon} size={18} color={active ? t.color : T.textSecondary} />
                  <Text style={[styles.typeBtnText, active && { color: t.color }]}>{t.value}</Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <Text style={styles.sectionLabel}>זמני עבודה</Text>
          <View style={styles.card}>
            <View style={styles.timeRow}>
              <View style={styles.timeInput}>
                <Text style={styles.timeLabel}>זמן התחלה</Text>
                <TouchableOpacity
                  style={styles.timeSelect}
                  onPress={() => setShowPicker({ field: 'startTime', visible: true })}
                  activeOpacity={0.7}
                >
                  <Text style={styles.timeValue}>{shift.startTime}</Text>
                </TouchableOpacity>
              </View>
              <View style={styles.timeInput}>
                <Text style={styles.timeLabel}>זמן סיום</Text>
                <TouchableOpacity
                  style={styles.timeSelect}
                  onPress={() => setShowPicker({ field: 'endTime', visible: true })}
                  activeOpacity={0.7}
                >
                  <Text style={styles.timeValue}>{shift.endTime}</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>

          <Text style={styles.sectionLabel}>סה"כ שעות</Text>
          <View style={styles.card}>
            <Text style={styles.totalHoursText}>{shift.totalHours}</Text>
          </View>

          <Text style={styles.sectionLabel}>תעריף (אחוז שכר)</Text>
          <View style={styles.card}>
            <TextInput
              style={styles.inputFull}
              value={shift.hourlyPercent}
              onChangeText={(v) => setShift({ ...shift, hourlyPercent: v })}
              keyboardType="numeric"
              placeholder="100"
              placeholderTextColor={T.textPlaceholder}
            />
          </View>

          <Text style={styles.sectionLabel}>תוספות ובונוסים</Text>
          <View style={styles.card}>
            <TextInput
              style={styles.inputFull}
              value={shift.bonus}
              onChangeText={(v) => setShift({ ...shift, bonus: v })}
              keyboardType="numeric"
              placeholder="0"
              placeholderTextColor={T.textPlaceholder}
            />
          </View>

          <Text style={styles.sectionLabel}>הערות</Text>
          <View style={styles.card}>
            <TextInput
              style={styles.notesInput}
              value={shift.notes}
              onChangeText={(v) => setShift({ ...shift, notes: v })}
              multiline
              placeholder="הערות למשמרת..."
              placeholderTextColor={T.textPlaceholder}
              textAlignVertical="top"
            />
          </View>

          <View style={{ height: 40 }} />
        </ScrollView>

        {showPicker.visible && (
          <DateTimePicker
            value={parseTimeToDate(date, showPicker.field === 'startTime' ? shift.startTime : shift.endTime)}
            mode="time"
            is24Hour={true}
            display="spinner"
            onChange={(e, d) => {
              setShowPicker({ field: null, visible: false });
              if (!d) return;
              const timeStr = formatTime(d);
              const next = showPicker.field === 'startTime'
                ? { ...shift, startTime: timeStr }
                : { ...shift, endTime: timeStr };
              next.totalHours = computeTotalHours(next.startTime, next.endTime) || next.totalHours;
              setShift(next);
            }}
          />
        )}
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: T.bg,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: T.accent,
  },
  headerBtn: {
    paddingVertical: 4,
    paddingHorizontal: 4,
    minWidth: 60,
  },
  headerTitle: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 16,
  },
  cancelText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
  },
  saveText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
    textAlign: 'right',
  },
  content: {
    padding: 16,
  },
  dateCard: {
    backgroundColor: T.cardBg,
    borderRadius: T.radiusMd,
    borderWidth: 1,
    borderColor: T.border,
    padding: 12,
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 8,
  },
  dateText: {
    color: T.text,
    fontSize: 15,
    fontWeight: '600',
  },
  sectionLabel: {
    color: T.textSecondary,
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 6,
    marginTop: 16,
    textAlign: 'right',
  },
  typeRow: {
    flexDirection: 'row-reverse',
    gap: 8,
  },
  typeBtn: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
    paddingVertical: 10,
    borderRadius: T.radiusMd,
    borderWidth: 1,
    borderColor: T.border,
    backgroundColor: T.cardBg,
  },
  typeBtnText: {
    color: T.textSecondary,
    fontSize: 12,
    fontWeight: '600',
  },
  card: {
    backgroundColor: T.cardBg,
    borderRadius: T.radiusMd,
    borderWidth: 1,
    borderColor: T.border,
    overflow: 'hidden',
  },
  timeRow: {
    flexDirection: 'row-reverse',
    gap: 10,
    padding: 12,
  },
  timeInput: {
    flex: 1,
    backgroundColor: T.cardBgElevated,
    borderRadius: T.radiusSm,
    padding: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: T.border,
  },
  timeLabel: {
    color: T.textSecondary,
    fontSize: 11,
    marginBottom: 6,
  },
  timeSelect: {
    width: '100%',
    alignItems: 'center',
  },
  timeValue: {
    color: T.accent,
    fontSize: 20,
    fontWeight: '700',
    textAlign: 'center',
  },
  inputFull: {
    color: T.text,
    padding: 12,
    fontSize: 15,
    textAlign: 'right',
  },
  totalHoursText: {
    color: T.text,
    padding: 12,
    fontSize: 20,
    fontWeight: '700',
    textAlign: 'center',
  },
  notesInput: {
    color: T.text,
    padding: 12,
    fontSize: 14,
    height: 100,
    textAlign: 'right',
  },
});

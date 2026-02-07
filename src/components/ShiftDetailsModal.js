import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Modal, TextInput, TouchableOpacity, ScrollView, SafeAreaView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { darkTheme as T } from '../constants/theme';

const SHIFT_TYPES = [
  { value: 'עבודה', icon: 'briefcase-outline', color: T.accent },
  { value: 'שבת', icon: 'sunny-outline', color: T.orange },
  { value: 'מחלה', icon: 'medkit-outline', color: T.red },
  { value: 'חופש', icon: 'leaf-outline', color: T.green },
];

export default function ShiftDetailsModal({ visible, date, existingData, onSave, onClose }) {
  const [shift, setShift] = useState({
    startTime: '08:00', endTime: '17:00', totalHours: '9',
    type: 'עבודה', bonus: '0', notes: '', hourlyPercent: '100',
  });

  useEffect(() => {
    if (existingData) setShift(existingData);
    else setShift({ startTime: '08:00', endTime: '17:00', totalHours: '9', type: 'עבודה', bonus: '0', notes: '', hourlyPercent: '100' });
  }, [visible, existingData]);

  const formatDisplayDate = (dateStr) => {
    if (!dateStr) return '';
    const parts = dateStr.split('-');
    if (parts.length !== 3) return dateStr;
    return `${parts[2]}.${parts[1]}.${parts[0]}`;
  };

  return (
    <Modal visible={visible} animationType="slide">
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.headerBtn} activeOpacity={0.6}>
            <Text style={styles.cancelText}>ביטול</Text>
          </TouchableOpacity>
          <Text style={styles.headerDate}>{formatDisplayDate(date)}</Text>
          <TouchableOpacity onPress={() => onSave(date, shift)} style={styles.headerBtn} activeOpacity={0.6}>
            <Text style={styles.saveText}>שמור</Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
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

          <Text style={styles.sectionLabel}>שעות (כניסה - יציאה)</Text>
          <View style={styles.timeRow}>
            <View style={styles.timeInput}>
              <Text style={styles.timeLabel}>יציאה</Text>
              <TextInput
                style={styles.inputCenter}
                value={shift.endTime}
                onChangeText={(v) => setShift({ ...shift, endTime: v })}
                placeholder="17:00"
                placeholderTextColor={T.textPlaceholder}
              />
            </View>
            <View style={styles.timeSeparator}>
              <Ionicons name="arrow-back-outline" size={20} color={T.textMuted} />
            </View>
            <View style={styles.timeInput}>
              <Text style={styles.timeLabel}>כניסה</Text>
              <TextInput
                style={styles.inputCenter}
                value={shift.startTime}
                onChangeText={(v) => setShift({ ...shift, startTime: v })}
                placeholder="08:00"
                placeholderTextColor={T.textPlaceholder}
              />
            </View>
          </View>

          <Text style={styles.sectionLabel}>סה"כ שעות עבודה</Text>
          <View style={styles.card}>
            <TextInput
              style={styles.inputFull}
              value={shift.totalHours}
              onChangeText={(v) => setShift({ ...shift, totalHours: v })}
              keyboardType="numeric"
              placeholder="9"
              placeholderTextColor={T.textPlaceholder}
            />
          </View>

          <Text style={styles.sectionLabel}>אחוז שכר (100, 150...)</Text>
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
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 0.5,
    borderBottomColor: T.divider,
  },
  headerBtn: {
    paddingVertical: 4,
    paddingHorizontal: 4,
  },
  headerDate: {
    color: T.text,
    fontWeight: 'bold',
    fontSize: 17,
  },
  cancelText: {
    color: T.red,
    fontSize: 16,
    fontWeight: '500',
  },
  saveText: {
    color: T.accent,
    fontSize: 16,
    fontWeight: '600',
  },
  content: {
    padding: 20,
  },
  sectionLabel: {
    color: T.textSecondary,
    fontSize: 13,
    fontWeight: '500',
    marginBottom: 8,
    marginTop: 20,
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
    paddingVertical: 12,
    borderRadius: T.radiusMd,
    borderWidth: 1.5,
    borderColor: T.border,
    backgroundColor: T.cardBg,
  },
  typeBtnText: {
    color: T.textSecondary,
    fontSize: 12,
    fontWeight: '600',
  },
  timeRow: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'center',
  },
  timeInput: {
    flex: 1,
    backgroundColor: T.cardBg,
    borderRadius: T.radiusMd,
    padding: 12,
    alignItems: 'center',
  },
  timeLabel: {
    color: T.textSecondary,
    fontSize: 11,
    marginBottom: 6,
  },
  timeSeparator: {
    paddingTop: 16,
  },
  inputCenter: {
    color: T.accent,
    fontSize: 22,
    fontWeight: 'bold',
    textAlign: 'center',
    width: '100%',
  },
  card: {
    backgroundColor: T.cardBg,
    borderRadius: T.radiusMd,
    overflow: 'hidden',
  },
  inputFull: {
    color: T.text,
    padding: 14,
    fontSize: 16,
    textAlign: 'right',
  },
  notesInput: {
    color: T.text,
    padding: 14,
    fontSize: 15,
    height: 100,
    textAlign: 'right',
  },
});

import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Modal, TextInput, TouchableOpacity, ScrollView, SafeAreaView, Platform } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Ionicons } from '@expo/vector-icons';
import { darkTheme as T } from '../constants/theme';
import { parseDateLocal, formatDateLocal } from '../utils/shiftFilters';

const SHIFT_TYPES = [
  { value: 'עבודה', icon: 'briefcase-outline', color: T.accent },
  { value: 'שבת', icon: 'sunny-outline', color: T.orange },
  { value: 'מחלה', icon: 'medkit-outline', color: T.red },
  { value: 'חופש', icon: 'leaf-outline', color: T.green },
];

const PRESETS = [
  { label: 'בוקר', start: '08:00', end: '16:00' },
  { label: 'רגיל', start: '08:00', end: '17:00' },
  { label: 'ערב', start: '16:00', end: '00:00' },
];

export default function ShiftDetailsModal({ visible, date, existingData, onSave, onClose, onDuplicate, templates = [], config }) {
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
  const [dupPickerVisible, setDupPickerVisible] = useState(false);
  const [dupDateDraft, setDupDateDraft] = useState(null);
  const [showOvertime, setShowOvertime] = useState(true);
  const isIOS = Platform.OS === 'ios';

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

  const getOvertimeTiers = () => {
    const tiers = Array.isArray(config?.overtimeTiers) ? config.overtimeTiers : [];
    if (tiers.length > 0) return tiers;
    const threshold = Number(config?.overtimeStartThreshold || 0);
    const mult = Number(config?.overtimeMultiplier || 1.25);
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

    return tiers
      .map((tier) => {
        const end = tier.to === null ? Infinity : tier.to;
        const tierHours = Math.max(0, Math.min(hours, end) - tier.from);
        if (tierHours <= 0) return null;
        return {
          ...tier,
          hours: tierHours,
          amount: tierHours * rate * percent * tier.multiplier,
        };
      })
      .filter(Boolean);
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

  useEffect(() => {
    if (!dupPickerVisible) setDupDateDraft(null);
  }, [dupPickerVisible]);

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

  const rate = Number(config?.hourlyRate || 0);
  const percent = Number(shift.hourlyPercent || 100) / 100;
  const hours = Number(shift.totalHours || 0);
  const overtimeBreakdown = shift.type === 'עבודה' ? computeTieredBreakdown(hours, rate, percent) : [];

  const applyPreset = (preset) => {
    const next = { ...shift, startTime: preset.start, endTime: preset.end };
    next.totalHours = computeTotalHours(next.startTime, next.endTime) || next.totalHours;
    setShift(next);
  };

  const applyTemplate = (tpl) => {
    const next = {
      ...shift,
      startTime: tpl.startTime || shift.startTime,
      endTime: tpl.endTime || shift.endTime,
      type: tpl.type || shift.type,
      hourlyPercent: tpl.hourlyPercent || shift.hourlyPercent,
      bonus: tpl.bonus || shift.bonus,
    };
    next.totalHours = computeTotalHours(next.startTime, next.endTime) || next.totalHours;
    setShift(next);
  };

  const handleDuplicateDate = (d) => {
    if (!d) return;
    const target = formatDateLocal(d);
    onDuplicate?.(target, shift);
    setDupPickerVisible(false);
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
          <View style={styles.presetRow}>
            {PRESETS.map((p) => (
              <TouchableOpacity
                key={p.label}
                style={styles.presetBtn}
                onPress={() => applyPreset(p)}
                activeOpacity={0.7}
              >
                <Text style={styles.presetText}>{p.label}</Text>
                <Text style={styles.presetSub}>{p.start} - {p.end}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {templates.length > 0 && (
            <View style={styles.templatesRow}>
              {templates.map((t) => (
                <TouchableOpacity
                  key={t.id}
                  style={styles.templateBtn}
                  onPress={() => applyTemplate(t)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.templateText}>{t.name}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}

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

          <Text style={styles.sectionLabel}>סה״כ שעות</Text>
          <View style={styles.card}>
            <Text style={styles.totalHoursText}>{shift.totalHours}</Text>
          </View>

          <View style={styles.expandHeader}>
            <Text style={styles.sectionLabel}>שעות נוספות</Text>
            <TouchableOpacity onPress={() => setShowOvertime(!showOvertime)} activeOpacity={0.7}>
              <Ionicons name={showOvertime ? 'chevron-up' : 'chevron-down'} size={16} color={T.textSecondary} />
            </TouchableOpacity>
          </View>
          {showOvertime && (
            <View style={styles.card}>
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
          )}

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

          <View style={styles.dupRow}>
            <TouchableOpacity style={styles.dupBtn} onPress={() => setDupPickerVisible(true)} activeOpacity={0.7}>
              <Ionicons name="copy-outline" size={16} color={T.accent} />
              <Text style={styles.dupText}>שכפל משמרת</Text>
            </TouchableOpacity>
          </View>

          <View style={{ height: 40 }} />
        </ScrollView>

        {showPicker.visible && (
          <View style={styles.pickerSheet}>
            <DateTimePicker
              value={parseTimeToDate(date, showPicker.field === 'startTime' ? shift.startTime : shift.endTime)}
              mode="time"
              is24Hour={true}
              display="spinner"
              textColor={T.text}
              onChange={(e, d) => {
                if (Platform.OS === 'android') {
                  setShowPicker({ field: null, visible: false });
                  if (e.type === 'set' && d) {
                    const timeStr = formatTime(d);
                    const next = showPicker.field === 'startTime'
                      ? { ...shift, startTime: timeStr }
                      : { ...shift, endTime: timeStr };
                    next.totalHours = computeTotalHours(next.startTime, next.endTime) || next.totalHours;
                    setShift(next);
                  }
                  return;
                }
                if (!d) return;
                const timeStr = formatTime(d);
                const next = showPicker.field === 'startTime'
                  ? { ...shift, startTime: timeStr }
                  : { ...shift, endTime: timeStr };
                next.totalHours = computeTotalHours(next.startTime, next.endTime) || next.totalHours;
                setShift(next);
              }}
            />
            {isIOS && (
              <TouchableOpacity
                style={styles.pickerDone}
                onPress={() => setShowPicker({ field: null, visible: false })}
                activeOpacity={0.7}
              >
                <Text style={styles.pickerDoneText}>סיום</Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        {dupPickerVisible && (
          <View style={styles.pickerSheet}>
            <DateTimePicker
              value={dupDateDraft || parseDateLocal(date)}
              mode="date"
              display="spinner"
              textColor={T.text}
              onChange={(e, d) => {
                if (Platform.OS === 'android') {
                  setDupPickerVisible(false);
                  if (e.type === 'set' && d) handleDuplicateDate(d);
                  return;
                }
                if (d) setDupDateDraft(d);
              }}
            />
            {isIOS && (
              <TouchableOpacity
                style={styles.pickerDone}
                onPress={() => {
                  if (dupDateDraft) handleDuplicateDate(dupDateDraft);
                  else setDupPickerVisible(false);
                }}
                activeOpacity={0.7}
              >
                <Text style={styles.pickerDoneText}>סיום</Text>
              </TouchableOpacity>
            )}
          </View>
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
  expandHeader: {
    marginTop: 16,
    marginBottom: 6,
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
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
  presetRow: {
    flexDirection: 'row-reverse',
    gap: 8,
    marginBottom: 8,
  },
  presetBtn: {
    flex: 1,
    backgroundColor: T.cardBg,
    borderRadius: T.radiusSm,
    borderWidth: 1,
    borderColor: T.border,
    paddingVertical: 8,
    alignItems: 'center',
  },
  presetText: {
    color: T.accent,
    fontSize: 13,
    fontWeight: '700',
  },
  presetSub: {
    color: T.textSecondary,
    fontSize: 10,
    marginTop: 2,
  },
  templatesRow: {
    flexDirection: 'row-reverse',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 8,
  },
  templateBtn: {
    backgroundColor: T.cardBg,
    borderRadius: T.radiusSm,
    borderWidth: 1,
    borderColor: T.border,
    paddingVertical: 6,
    paddingHorizontal: 10,
  },
  templateText: {
    color: T.text,
    fontSize: 12,
    fontWeight: '600',
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
  noOvertimeText: {
    color: T.textMuted,
    fontSize: 12,
    textAlign: 'right',
    padding: 12,
  },
  overtimeRow: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: T.divider,
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
  notesInput: {
    color: T.text,
    padding: 12,
    fontSize: 14,
    height: 100,
    textAlign: 'right',
  },
  dupRow: {
    marginTop: 12,
    alignItems: 'center',
  },
  dupBtn: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: T.border,
    backgroundColor: T.cardBg,
  },
  dupText: {
    color: T.accent,
    fontSize: 13,
    fontWeight: '700',
  },
  pickerSheet: {
    marginTop: 8,
    backgroundColor: T.cardBg,
    borderRadius: T.radiusMd,
    borderWidth: 1,
    borderColor: T.border,
    overflow: 'hidden',
  },
  pickerDone: {
    paddingVertical: 10,
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: T.divider,
    backgroundColor: T.cardBg,
  },
  pickerDoneText: {
    color: T.accent,
    fontSize: 14,
    fontWeight: '700',
  },
});

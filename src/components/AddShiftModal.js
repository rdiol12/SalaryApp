import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, TextInput, SafeAreaView, Platform } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Picker } from '@react-native-picker/picker';
import { darkTheme as T } from '../constants/theme';
import { parseDateLocal } from '../utils/shiftFilters';

const PRESETS = [
  { label: 'בוקר', start: '08:00', end: '16:00' },
  { label: 'רגיל', start: '08:00', end: '17:00' },
  { label: 'ערב', start: '16:00', end: '00:00' },
];

export default function AddShiftModal({ visible, date, onSave, onClose, templates = [] }) {
  const [startTime, setStartTime] = useState(new Date());
  const [endTime, setEndTime] = useState(new Date());
  const [shiftType, setShiftType] = useState('עבודה');
  const [bonus, setBonus] = useState('0');
  const [hourlyPercent, setHourlyPercent] = useState('100');
  const [showPicker, setShowPicker] = useState({ field: null, visible: false });
  const isIOS = Platform.OS === 'ios';

  useEffect(() => {
    if (!visible) return;
    const base = date ? parseDateLocal(date) : new Date();
    const start = new Date(base);
    start.setHours(8, 0, 0, 0);
    const end = new Date(base);
    end.setHours(17, 0, 0, 0);
    setStartTime(start);
    setEndTime(end);
    setShiftType('עבודה');
    setBonus('0');
    setHourlyPercent('100');
  }, [visible, date]);

  const applyTimeRange = (startStr, endStr) => {
    const base = date ? parseDateLocal(date) : new Date();
    const [sh, sm] = startStr.split(':').map(Number);
    const [eh, em] = endStr.split(':').map(Number);
    const start = new Date(base);
    start.setHours(sh, sm, 0, 0);
    const end = new Date(base);
    end.setHours(eh, em, 0, 0);
    if (end <= start) end.setDate(end.getDate() + 1);
    setStartTime(start);
    setEndTime(end);
  };

  const applyPreset = (preset) => {
    applyTimeRange(preset.start, preset.end);
  };

  const applyTemplate = (tpl) => {
    applyTimeRange(tpl.startTime, tpl.endTime);
    setShiftType(tpl.type || 'עבודה');
    setBonus(tpl.bonus || '0');
    setHourlyPercent(tpl.hourlyPercent || '100');
  };

  const calculateAndSave = () => {
    let diff = (endTime - startTime) / (1000 * 60 * 60);
    if (diff < 0) diff += 24;
    onSave(date, {
      type: shiftType,
      startTime: startTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      endTime: endTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      totalHours: diff.toFixed(2),
      bonus: bonus || '0',
      notes: '',
      hourlyPercent: hourlyPercent || '100',
    });
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} activeOpacity={0.6}>
            <Text style={styles.cancelText}>ביטול</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>הוספת משמרת</Text>
          <TouchableOpacity onPress={calculateAndSave} activeOpacity={0.6}>
            <Text style={styles.saveTextTop}>הוסף</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.content}>
          <Text style={styles.sectionLabel}>פרטי יום העבודה - {date}</Text>

          <View style={styles.card}>
            <View style={styles.pickerRow}>
              <Text style={styles.label}>סוג משמרת</Text>
              <View style={styles.pickerContainer}>
                <Picker selectedValue={shiftType} onValueChange={setShiftType} style={styles.picker}>
                  <Picker.Item label="עבודה" value="עבודה" />
                  <Picker.Item label="שבת" value="שבת" />
                  <Picker.Item label="מחלה" value="מחלה" />
                  <Picker.Item label="חופש" value="חופש" />
                </Picker>
              </View>
            </View>

            <View style={styles.divider} />

            <View style={styles.inputRow}>
              <TextInput
                style={styles.input}
                keyboardType="numeric"
                value={bonus}
                onChangeText={setBonus}
                placeholder="0"
                placeholderTextColor={T.textPlaceholder}
              />
              <Text style={styles.label}>בונוס / טיפים (₪)</Text>
            </View>
          </View>

          <Text style={styles.sectionLabel}>זמנים</Text>
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
            <TouchableOpacity style={styles.timeRow} onPress={() => setShowPicker({ field: 'start', visible: true })}>
              <Text style={styles.timeValue}>{startTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</Text>
              <Text style={styles.label}>שעת כניסה</Text>
            </TouchableOpacity>
            <View style={styles.divider} />
            <TouchableOpacity style={styles.timeRow} onPress={() => setShowPicker({ field: 'end', visible: true })}>
              <Text style={styles.timeValue}>{endTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</Text>
              <Text style={styles.label}>שעת יציאה</Text>
            </TouchableOpacity>
          </View>

          {showPicker.visible && (
            <View style={styles.pickerSheet}>
              <DateTimePicker
                value={showPicker.field === 'start' ? startTime : endTime}
                mode="time"
                is24Hour={true}
                display="spinner"
                textColor={T.text}
                onChange={(e, d) => {
                  if (Platform.OS === 'android') {
                    setShowPicker({ field: null, visible: false });
                    if (e.type === 'set' && d) {
                      showPicker.field === 'start' ? setStartTime(d) : setEndTime(d);
                    }
                    return;
                  }
                  if (d) showPicker.field === 'start' ? setStartTime(d) : setEndTime(d);
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
        </View>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: T.bg },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: T.accent,
  },
  headerTitle: { color: '#fff', fontSize: 16, fontWeight: '700' },
  cancelText: { color: '#fff', fontSize: 15, fontWeight: '600' },
  saveTextTop: { color: '#fff', fontSize: 15, fontWeight: '700' },
  content: { padding: 16 },
  sectionLabel: { color: T.textSecondary, fontSize: 12, fontWeight: '600', marginBottom: 6, marginTop: 16, textAlign: 'right' },
  card: { backgroundColor: T.cardBg, borderRadius: T.radiusMd, overflow: 'hidden', borderWidth: 1, borderColor: T.border },
  inputRow: { flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'center', padding: 12 },
  timeRow: { flexDirection: 'row-reverse', justifyContent: 'space-between', padding: 12 },
  label: { color: T.text, fontSize: 14 },
  input: { color: T.accent, fontSize: 15, flex: 1, textAlign: 'left' },
  timeValue: { color: T.accent, fontSize: 16, fontWeight: '700' },
  divider: { height: 1, backgroundColor: T.divider, marginLeft: 12 },
  pickerRow: { flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 12, height: 46 },
  pickerContainer: { width: 130 },
  picker: { color: T.accent },
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

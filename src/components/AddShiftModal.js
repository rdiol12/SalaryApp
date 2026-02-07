import React, { useState } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, Platform } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';

export default function AddShiftModal({ visible, date, onSave, onClose, config }) {
  const [startTime, setStartTime] = useState(new Date());
  const [endTime, setEndTime] = useState(new Date());
  const [showPicker, setShowPicker] = useState({ field: null, visible: false });
  const [shiftType, setShiftType] = useState('עבודה');

  const handleTimeChange = (event, selectedDate) => {
    if (Platform.OS === 'android') {
      // באנדרואיד סוגרים את הפיקר רק אם המשתמש לחץ על כפתור
      setShowPicker({ field: null, visible: false });
      if (event.type === 'set' && selectedDate) {
        if (showPicker.field === 'start') setStartTime(selectedDate);
        else setEndTime(selectedDate);
      }
    } else {
      // ב-iOS הגלגלת נשארת פתוחה ומעדכנת את הסטייט
      if (selectedDate) {
        if (showPicker.field === 'start') setStartTime(selectedDate);
        else setEndTime(selectedDate);
      }
    }
  };

  const calculateAndSave = () => {
    const diff = (endTime - startTime) / (1000 * 60 * 60);
    const totalHours = diff > 0 ? diff : diff + 24;

    const baseRate = Number(config.hourlyRate);
    const overtimeThreshold = Number(config.overtimeStartThreshold);
    let earned = 0;

    if (shiftType === 'עבודה') {
      if (totalHours > overtimeThreshold) {
        earned = (overtimeThreshold * baseRate) + (totalHours - overtimeThreshold) * baseRate * 1.25;
      } else {
        earned = totalHours * baseRate;
      }
    } else if (shiftType === 'שבת') {
      earned = totalHours * baseRate * 1.5;
    } else {
        earned = 0; // חופש/מחלה בחישוב הבסיסי
    }

    onSave(date, {
      type: shiftType,
      start: startTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      end: endTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      totalHours: totalHours.toFixed(2),
      earned: Math.round(earned)
    });
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.overlay}>
        <View style={styles.modal}>
          <Text style={styles.title}>הוספת משמרת ב-{date}</Text>

          <View style={styles.typeRow}>
            {['עבודה', 'שבת', 'מחלה', 'חופש'].map(t => (
              <TouchableOpacity 
                key={t} 
                style={[styles.typeBtn, shiftType === t && styles.activeType]}
                onPress={() => setShiftType(t)}
              >
                <Text style={[styles.typeText, shiftType === t && styles.activeTypeText]}>{t}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <View style={styles.timeSection}>
            <TouchableOpacity 
              style={styles.timeBtn} 
              onPress={() => setShowPicker({ field: 'start', visible: true })}
            >
              <Text style={styles.timeLabel}>כניסה</Text>
              <Text style={styles.timeValue}>{startTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.timeBtn} 
              onPress={() => setShowPicker({ field: 'end', visible: true })}
            >
              <Text style={styles.timeLabel}>יציאה</Text>
              <Text style={styles.timeValue}>{endTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</Text>
            </TouchableOpacity>
          </View>

          {showPicker.visible && (
            <DateTimePicker
              value={showPicker.field === 'start' ? startTime : endTime}
              mode="time"
              is24Hour={true}
              display={Platform.OS === 'ios' ? 'spinner' : 'clock'} 
              onChange={handleTimeChange}
            />
          )}

          <TouchableOpacity style={styles.saveBtn} onPress={calculateAndSave}>
            <Text style={styles.saveText}>שמור משמרת</Text>
          </TouchableOpacity>
          
          <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
            <Text style={styles.closeText}>ביטול</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'center', padding: 20 },
  modal: { backgroundColor: '#1c1c1e', borderRadius: 20, padding: 20 },
  title: { color: '#fff', fontSize: 18, fontWeight: 'bold', textAlign: 'center', marginBottom: 20 },
  typeRow: { flexDirection: 'row-reverse', justifyContent: 'space-around', marginBottom: 25 },
  typeBtn: { padding: 10, borderRadius: 10, borderWidth: 1, borderColor: '#333' },
  activeType: { backgroundColor: '#00adf5', borderColor: '#00adf5' },
  typeText: { color: '#aaa' },
  activeTypeText: { color: '#fff', fontWeight: 'bold' },
  timeSection: { flexDirection: 'row-reverse', justifyContent: 'space-between', marginBottom: 30 },
  timeBtn: { alignItems: 'center', backgroundColor: '#2c2c2e', padding: 15, borderRadius: 12, width: '45%' },
  timeLabel: { color: '#aaa', fontSize: 12, marginBottom: 5 },
  timeValue: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  saveBtn: { backgroundColor: '#00adf5', padding: 15, borderRadius: 12, alignItems: 'center' },
  saveText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  closeBtn: { padding: 15, alignItems: 'center' },
  closeText: { color: '#aaa' }
});

import React, { useState } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, Platform } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Picker } from '@react-native-picker/picker';

export default function AddShiftModal({ visible, date, onSave, onClose, config }) {
  const [startTime, setStartTime] = useState(new Date());
  const [endTime, setEndTime] = useState(new Date());
  const [shiftType, setShiftType] = useState('עבודה');
  const [showPicker, setShowPicker] = useState({ field: null, visible: false });

  // ... לוגיקת handleTimeChange ו-calculateAndSave נשארת זהה ...

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.overlay}>
        <View style={styles.modal}>
          <Text style={styles.title}>הוספת משמרת ב-{date}</Text>

          {/* גלגל בחירה לסוג משמרת */}
          <Text style={styles.label}>סוג היום:</Text>
          <View style={styles.pickerWrapper}>
            <Picker
              selectedValue={shiftType}
              onValueChange={(v) => setShiftType(v)}
              style={{ color: '#fff' }}
            >
              <Picker.Item label="יום עבודה רגיל" value="עבודה" color="#fff" />
              <Picker.Item label="עבודה בשבת" value="שבת" color="#fff" />
              <Picker.Item label="יום מחלה" value="מחלה" color="#fff" />
              <Picker.Item label="יום חופש" value="חופש" color="#fff" />
            </Picker>
          </View>

          <View style={styles.timeSection}>
            <TouchableOpacity style={styles.timeBtn} onPress={() => setShowPicker({ field: 'start', visible: true })}>
              <Text style={styles.timeLabel}>כניסה</Text>
              <Text style={styles.timeValue}>{startTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.timeBtn} onPress={() => setShowPicker({ field: 'end', visible: true })}>
              <Text style={styles.timeLabel}>יציאה</Text>
              <Text style={styles.timeValue}>{endTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</Text>
            </TouchableOpacity>
          </View>

          {showPicker.visible && (
            <DateTimePicker
              value={showPicker.field === 'start' ? startTime : endTime}
              mode="time"
              is24Hour={true}
              display="spinner"
              onChange={handleTimeChange}
            />
          )}

          <TouchableOpacity style={styles.saveBtn} onPress={calculateAndSave}>
            <Text style={styles.saveText}>שמור משמרת</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={onClose} style={styles.closeBtn}><Text style={styles.closeText}>ביטול</Text></TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'center', padding: 20 },
  modal: { backgroundColor: '#1c1c1e', borderRadius: 20, padding: 20 },
  title: { color: '#fff', fontSize: 18, fontWeight: 'bold', textAlign: 'center', marginBottom: 15 },
  label: { color: '#aaa', textAlign: 'right', marginBottom: 5 },
  pickerWrapper: { backgroundColor: '#2c2c2e', borderRadius: 10, marginBottom: 20, overflow: 'hidden' },
  timeSection: { flexDirection: 'row-reverse', justifyContent: 'space-between', marginBottom: 25 },
  timeBtn: { alignItems: 'center', backgroundColor: '#2c2c2e', padding: 15, borderRadius: 12, width: '45%' },
  timeLabel: { color: '#aaa', fontSize: 12 },
  timeValue: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  saveBtn: { backgroundColor: '#00adf5', padding: 15, borderRadius: 12, alignItems: 'center' },
  saveText: { color: '#fff', fontWeight: 'bold' },
  closeBtn: { padding: 15, alignItems: 'center' },
  closeText: { color: '#aaa' }
});

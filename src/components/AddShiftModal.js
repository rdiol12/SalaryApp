import React, { useState } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, TextInput, Platform } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Picker } from '@react-native-picker/picker';

export default function AddShiftModal({ visible, date, onSave, onClose, config }) {
  const [startTime, setStartTime] = useState(new Date());
  const [endTime, setEndTime] = useState(new Date());
  const [shiftType, setShiftType] = useState('עבודה');
  const [bonus, setBonus] = useState('0');
  const [showPicker, setShowPicker] = useState({ field: null, visible: false });

  const calculateAndSave = () => {
    let diff = (endTime - startTime) / (1000 * 60 * 60);
    if (diff < 0) diff += 24; // טיפול במשמרות לילה

    onSave(date, {
      type: shiftType,
      start: startTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      end: endTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      totalHours: diff.toFixed(2),
      bonus: bonus || '0'
    });
    setBonus('0');
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.overlay}>
        <View style={styles.modal}>
          <Text style={styles.title}>משמרת ל-{date}</Text>
          
          <Text style={styles.label}>סוג היום</Text>
          <View style={styles.pickerWrapper}>
            <Picker selectedValue={shiftType} onValueChange={setShiftType} style={{color: '#fff'}}>
              <Picker.Item label="עבודה רגילה" value="עבודה" />
              <Picker.Item label="שבת / חג" value="שבת" />
              <Picker.Item label="יום מחלה" value="מחלה" />
              <Picker.Item label="יום חופש" value="חופש" />
            </Picker>
          </View>

          <View style={styles.row}>
            <TouchableOpacity style={styles.timeBtn} onPress={() => setShowPicker({ field: 'end', visible: true })}>
              <Text style={styles.tLabel}>יציאה</Text>
              <Text style={styles.tVal}>{endTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.timeBtn} onPress={() => setShowPicker({ field: 'start', visible: true })}>
              <Text style={styles.tLabel}>כניסה</Text>
              <Text style={styles.tVal}>{startTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.label}>בונוס / טיפים (₪)</Text>
          <TextInput style={styles.input} keyboardType="numeric" value={bonus} onChangeText={setBonus} />

          {showPicker.visible && (
            <DateTimePicker value={showPicker.field === 'start' ? startTime : endTime} mode="time" is24Hour={true} display="spinner" onChange={(e, d) => {
              setShowPicker({ field: null, visible: false });
              if (d) showPicker.field === 'start' ? setStartTime(d) : setEndTime(d);
            }} />
          )}

          <TouchableOpacity style={styles.saveBtn} onPress={calculateAndSave}><Text style={styles.saveText}>שמור משמרת</Text></TouchableOpacity>
          <TouchableOpacity onPress={onClose}><Text style={styles.closeText}>ביטול</Text></TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'center', padding: 20 },
  modal: { backgroundColor: '#1c1c1e', borderRadius: 20, padding: 20 },
  title: { color: '#fff', fontSize: 18, textAlign: 'center', marginBottom: 20 },
  label: { color: '#aaa', textAlign: 'right', marginBottom: 5 },
  pickerWrapper: { backgroundColor: '#2c2c2e', borderRadius: 10, marginBottom: 15 },
  row: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 },
  timeBtn: { width: '48%', backgroundColor: '#2c2c2e', padding: 15, borderRadius: 12, alignItems: 'center' },
  tLabel: { color: '#888', fontSize: 12 },
  tVal: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  input: { backgroundColor: '#2c2c2e', color: '#fff', padding: 15, borderRadius: 10, textAlign: 'center', marginBottom: 20 },
  saveBtn: { backgroundColor: '#00adf5', padding: 15, borderRadius: 12, alignItems: 'center' },
  saveText: { color: '#fff', fontWeight: 'bold' },
  closeText: { color: '#aaa', textAlign: 'center', marginTop: 15 }
});

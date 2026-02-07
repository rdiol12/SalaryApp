import React, { useState } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, TextInput, SafeAreaView, KeyboardAvoidingView, Platform } from 'react-native';
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
    if (diff < 0) diff += 24;
    onSave(date, {
      type: shiftType,
      start: startTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      end: endTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      totalHours: diff.toFixed(2),
      bonus: bonus || '0'
    });
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose}><Text style={styles.cancelText}>ביטול</Text></TouchableOpacity>
          <Text style={styles.headerTitle}>הוספת משמרת</Text>
          <TouchableOpacity onPress={calculateAndSave}><Text style={styles.saveTextTop}>הוסף</Text></TouchableOpacity>
        </View>

        <View style={styles.content}>
          <Text style={styles.sectionLabel}>פרטי יום העבודה - {date}</Text>
          
          <View style={styles.card}>
            <View style={styles.pickerRow}>
              <Text style={styles.label}>סוג משמרת</Text>
              <View style={styles.pickerContainer}>
                <Picker selectedValue={shiftType} onValueChange={setShiftType} style={styles.picker}>
                  <Picker.Item label="עבודה" value="עבודה" color="#fff" />
                  <Picker.Item label="שבת" value="שבת" color="#fff" />
                  <Picker.Item label="מחלה" value="מחלה" color="#fff" />
                  <Picker.Item label="חופש" value="חופש" color="#fff" />
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
                placeholderTextColor="#444"
              />
              <Text style={styles.label}>בונוס / טיפים (₪)</Text>
            </View>
          </View>

          <Text style={styles.sectionLabel}>זמנים</Text>
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
            <DateTimePicker 
              value={showPicker.field === 'start' ? startTime : endTime} 
              mode="time" 
              is24Hour={true} 
              display="spinner" 
              onChange={(e, d) => {
                setShowPicker({ field: null, visible: false });
                if (d) showPicker.field === 'start' ? setStartTime(d) : setEndTime(d);
              }} 
            />
          )}
        </View>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  header: { flexDirection: 'row', justifyContent: 'space-between', padding: 20, borderBottomWidth: 0.5, borderBottomColor: '#222' },
  headerTitle: { color: '#fff', fontSize: 17, fontWeight: '600' },
  cancelText: { color: '#ff3b30', fontSize: 17 },
  saveTextTop: { color: '#00adf5', fontSize: 17, fontWeight: '600' },
  content: { padding: 16 },
  sectionLabel: { color: '#8e8e93', fontSize: 13, textTransform: 'uppercase', marginBottom: 8, marginTop: 24, textAlign: 'right' },
  card: { backgroundColor: '#1c1c1e', borderRadius: 12, overflow: 'hidden' },
  inputRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16 },
  timeRow: { flexDirection: 'row', justifyContent: 'space-between', padding: 16 },
  label: { color: '#fff', fontSize: 16 },
  input: { color: '#00adf5', fontSize: 16, flex: 1, textAlign: 'left' },
  timeValue: { color: '#00adf5', fontSize: 16, fontWeight: 'bold' },
  divider: { height: 0.5, backgroundColor: '#38383a', marginLeft: 16 },
  pickerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, height: 50 },
  pickerContainer: { width: 120 },
  picker: { color: '#00adf5' }
});

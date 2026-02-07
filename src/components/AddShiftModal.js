import React, { useState } from 'react';
import { Modal, View, Text, TouchableOpacity, StyleSheet, TextInput, ScrollView } from 'react-native';

export default function AddShiftModal({ visible, date, config, onSave, onClose }) {
  const [step, setStep] = useState('type'); // 'type' or 'details'
  const [shiftType, setShiftType] = useState('עבודה'); // 'עבודה' or 'שבת'
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [bonus, setBonus] = useState('');

  const resetAndClose = () => {
    setStep('type');
    setStartTime('');
    setEndTime('');
    setBonus('');
    onClose();
  };

  const calculateHours = (start, end) => {
    if (!start || !end) return 0;
    const [sH, sM] = start.split(':').map(Number);
    const [eH, eM] = end.split(':').map(Number);
    let diff = (eH + eM / 60) - (sH + sM / 60);
    if (diff < 0) diff += 24; // עבודה אל תוך הלילה
    return diff;
  };

  const handleSaveShift = () => {
    const totalHours = calculateHours(startTime, endTime);
    const hourly = Number(config.hourlyRate);
    const bonusVal = Number(bonus || 0);
    let earned = 0;

    if (shiftType === 'שבת') {
      earned = (totalHours * hourly * Number(config.shabbatRate)) + bonusVal;
    } else {
      const threshold = Number(config.overtimeStartThreshold);
      const ot1 = Math.min(Math.max(0, totalHours - threshold), 2);
      const ot2 = Math.max(0, totalHours - threshold - 2);
      const reg = totalHours - ot1 - ot2;

      earned = (reg * hourly) + 
               (ot1 * hourly * Number(config.overtimeRate1)) + 
               (ot2 * hourly * Number(config.overtimeRate2)) + bonusVal;
    }

    onSave(date, { type: shiftType, totalHours, earned, bonus: bonusVal });
    resetAndClose();
  };

  const saveSpecial = (type) => {
    // יום חופש משלם 8 שעות בסיס, יום מחלה 0 (ניתן לעדכן לוגיקה בהמשך)
    const earned = type === 'חופש' ? Number(config.hourlyRate) * 8 : 0;
    onSave(date, { type, totalHours: 8, earned, bonus: 0 });
    resetAndClose();
  };

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.overlay}>
        <View style={styles.modalBox}>
          <Text style={styles.dateTitle}>{date}</Text>

          {step === 'type' ? (
            <View>
              <Text style={styles.question}>מה תרצה להוסיף?</Text>
              <TypeBtn label="💼 משמרת רגילה" color="#00adf5" onPress={() => { setShiftType('עבודה'); setStep('details'); }} />
              <TypeBtn label="✡️ משמרת שבת/חג" color="#5856D6" onPress={() => { setShiftType('שבת'); setStep('details'); }} />
              <TypeBtn label="🏖️ יום חופש" color="#34C759" onPress={() => saveSpecial('חופש')} />
              <TypeBtn label="🤒 יום מחלה" color="#FF3B30" onPress={() => saveSpecial('מחלה')} />
              <TouchableOpacity onPress={resetAndClose} style={styles.cancelLink}><Text style={{color: '#999'}}>ביטול</Text></TouchableOpacity>
            </View>
          ) : (
            <View>
              <Text style={styles.question}>פרטי משמרת {shiftType}</Text>
              <TextInput style={styles.input} placeholder="שעת כניסה (HH:MM)" placeholderTextColor="#666" value={startTime} onChangeText={setStartTime} />
              <TextInput style={styles.input} placeholder="שעת יציאה (HH:MM)" placeholderTextColor="#666" value={endTime} onChangeText={setEndTime} />
              <TextInput style={styles.input} placeholder="בונוס / טיפים (₪)" placeholderTextColor="#666" keyboardType="numeric" value={bonus} onChangeText={setBonus} />
              <TouchableOpacity style={styles.saveBtn} onPress={handleSaveShift}><Text style={styles.saveBtnText}>שמור</Text></TouchableOpacity>
              <TouchableOpacity onPress={() => setStep('type')} style={styles.cancelLink}><Text style={{color: '#00adf5'}}>חזור</Text></TouchableOpacity>
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
}

const TypeBtn = ({ label, color, onPress }) => (
  <TouchableOpacity style={[styles.typeBtn, {backgroundColor: color}]} onPress={onPress}>
    <Text style={styles.typeBtnText}>{label}</Text>
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'flex-end' },
  modalBox: { backgroundColor: '#1c1c1e', borderTopLeftRadius: 25, borderTopRightRadius: 25, padding: 25, paddingBottom: 40 },
  dateTitle: { color: '#00adf5', textAlign: 'center', marginBottom: 10 },
  question: { color: '#fff', fontSize: 18, fontWeight: 'bold', textAlign: 'center', marginBottom: 20 },
  typeBtn: { padding: 16, borderRadius: 12, marginBottom: 12, alignItems: 'center' },
  typeBtnText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  input: { backgroundColor: '#2c2c2e', color: '#fff', padding: 15, borderRadius: 10, marginBottom: 15, textAlign: 'center' },
  saveBtn: { backgroundColor: '#00adf5', padding: 16, borderRadius: 12, alignItems: 'center' },
  saveBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  cancelLink: { marginTop: 15, alignItems: 'center' }
});

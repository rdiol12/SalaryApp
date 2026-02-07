import React from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, ScrollView } from 'react-native';

export default function ShiftDetailsModal({ visible, date, shift, config, onClose, onDelete }) {
  if (!shift) return null;

  const hourlyRate = Number(config.hourlyRate);
  let totalHours = Number(shift.totalHours);
  
  // ניכוי הפסקה אוטומטי
  if (totalHours > 6) totalHours -= (Number(config.breakDeduction) / 60);

  const threshold = Number(config.overtimeStartThreshold);
  const regHours = Math.min(totalHours, threshold);
  const ot125 = Math.max(0, Math.min(totalHours - threshold, 2));
  const ot150 = Math.max(0, totalHours - threshold - 2);

  const baseEarned = (regHours * hourlyRate) + (ot125 * hourlyRate * 1.25) + (ot150 * hourlyRate * 1.5);
  const finalGross = baseEarned + Number(shift.bonus) + Number(config.travelDaily);

  return (
    <Modal visible={visible} animationType="fade" transparent>
      <View style={styles.overlay}>
        <View style={styles.modal}>
          <Text style={styles.title}>סיכום משמרת {date}</Text>
          <ScrollView>
            <Row label="שעות רגילות" value={regHours.toFixed(2)} />
            {ot125 > 0 && <Row label="שעות 125%" value={ot125.toFixed(2)} color="#00adf5" />}
            {ot150 > 0 && <Row label="שעות 150%" value={ot150.toFixed(2)} color="#00adf5" />}
            <View style={styles.divider} />
            <Row label="בונוס / טיפים" value={`₪${shift.bonus}`} />
            <Row label="נסיעות" value={`₪${config.travelDaily}`} />
            <Row label="ברוטו למשמרת" value={`₪${Math.round(finalGross)}`} isBold color="#4cd964" />
            <View style={styles.divider} />
            <Text style={styles.taxNote}>* הנטו מושפע מנקודות הזיכוי שלך בתלוש החודשי</Text>
          </ScrollView>
          <TouchableOpacity style={styles.delBtn} onPress={onDelete}><Text style={styles.delText}>מחק משמרת</Text></TouchableOpacity>
          <TouchableOpacity style={styles.closeBtn} onPress={onClose}><Text style={styles.closeText}>סגור</Text></TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const Row = ({ label, value, isBold, color = "#fff" }) => (
  <View style={styles.row}>
    <Text style={[styles.val, { color, fontWeight: isBold ? 'bold' : 'normal' }]}>{value}</Text>
    <Text style={[styles.lab, { fontWeight: isBold ? 'bold' : 'normal' }]}>{label}</Text>
  </View>
);

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.9)', justifyContent: 'center', padding: 25 },
  modal: { backgroundColor: '#1c1c1e', borderRadius: 20, padding: 20 },
  title: { color: '#fff', fontSize: 20, fontWeight: 'bold', textAlign: 'center', marginBottom: 20 },
  row: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 10 },
  lab: { color: '#aaa' },
  val: { color: '#fff' },
  divider: { height: 1, backgroundColor: '#333', marginVertical: 10 },
  taxNote: { color: '#666', fontSize: 11, textAlign: 'center', marginTop: 10 },
  delBtn: { marginTop: 20, padding: 12, borderRadius: 10, borderWith: 1, borderColor: '#ff4444', alignItems: 'center' },
  delText: { color: '#ff4444' },
  closeBtn: { marginTop: 10, padding: 10, alignItems: 'center' },
  closeText: { color: '#00adf5' }
});

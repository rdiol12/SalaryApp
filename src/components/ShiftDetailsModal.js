import React from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, SafeAreaView } from 'react-native';

export default function ShiftDetailsModal({ visible, date, shift, config, onClose, onDelete }) {
  if (!shift) return null;

  // חישובים מפורטים למסך הסיכום
  const hourlyRate = Number(config.hourlyRate);
  const totalHours = Number(shift.totalHours);
  const threshold = Number(config.overtimeStartThreshold);

  let regHours = Math.min(totalHours, threshold);
  let ot125 = Math.max(0, Math.min(totalHours - threshold, 2)); // שעתיים ראשונות נוספות
  let ot150 = Math.max(0, totalHours - threshold - 2); // מעל שעתיים נוספות

  // הערכת מיסים והפרשות למשמרת בודדת (משוער)
  const gross = Number(shift.earned);
  const pension = gross * Number(config.pensionRate);
  const taxEst = gross * 0.10; // הערכה גסה של 10% מס/ביטוח לאומי

  return (
    <Modal visible={visible} animationType="fade" transparent>
      <View style={styles.overlay}>
        <SafeAreaView style={styles.modal}>
          <Text style={styles.dateTitle}>סיכום משמרת - {date}</Text>
          
          <View style={styles.statsContainer}>
            <DetailRow label="סה''כ שעות" value={`${totalHours} ש'`} isBold />
            <DetailRow label="שכר ברוטו" value={`₪${gross}`} color="#4cd964" isBold />
            
            <View style={styles.divider} />
            
            <Text style={styles.subTitle}>פירוט שעות:</Text>
            <DetailRow label="שעות רגילות (100%)" value={`${regHours.toFixed(2)} ש'`} />
            {ot125 > 0 && <DetailRow label="שעות נוספות (125%)" value={`${ot125.toFixed(2)} ש'`} />}
            {ot150 > 0 && <DetailRow label="שעות נוספות (150%)" value={`${ot150.toFixed(2)} ש'`} />}
            
            <View style={styles.divider} />
            
            <Text style={styles.subTitle}>ניכויים משוערים:</Text>
            <DetailRow label="הפרשה לפנסיה" value={`-₪${pension.toFixed(0)}`} color="#ff3b30" />
            <DetailRow label="מס וביטוח לאומי" value={`-₪${taxEst.toFixed(0)}`} color="#ff3b30" />
            
            <View style={[styles.divider, { backgroundColor: '#00adf5' }]} />
            <DetailRow label="נטו משוער למשמרת" value={`₪${(gross - pension - taxEst).toFixed(0)}`} isBold />
          </View>

          <TouchableOpacity style={styles.deleteBtn} onPress={onDelete}>
            <Text style={styles.deleteText}>מחק משמרת</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
            <Text style={styles.closeText}>סגור</Text>
          </TouchableOpacity>
        </SafeAreaView>
      </View>
    </Modal>
  );
}

const DetailRow = ({ label, value, color = '#fff', isBold = false }) => (
  <View style={styles.row}>
    <Text style={[styles.rowValue, { color, fontWeight: isBold ? 'bold' : 'normal' }]}>{value}</Text>
    <Text style={[styles.rowLabel, { fontWeight: isBold ? 'bold' : 'normal' }]}>{label}</Text>
  </View>
);

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.9)', justifyContent: 'center', alignItems: 'center' },
  modal: { width: '85%', backgroundColor: '#1c1c1e', borderRadius: 20, padding: 20 },
  dateTitle: { color: '#fff', fontSize: 20, fontWeight: 'bold', textAlign: 'center', marginBottom: 20 },
  statsContainer: { marginBottom: 20 },
  subTitle: { color: '#00adf5', textAlign: 'right', marginBottom: 10, fontWeight: 'bold' },
  row: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8 },
  rowLabel: { color: '#aaa', fontSize: 16 },
  rowValue: { color: '#fff', fontSize: 16 },
  divider: { height: 1, backgroundColor: '#333', marginVertical: 12 },
  deleteBtn: { marginTop: 20, padding: 15, borderRadius: 12, borderWidth: 1, borderColor: '#ff3b30', alignItems: 'center' },
  deleteText: { color: '#ff3b30', fontWeight: 'bold' },
  closeBtn: { marginTop: 10, padding: 15, alignItems: 'center' },
  closeText: { color: '#aaa', fontSize: 16 }
});

import React from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, SafeAreaView, ScrollView } from 'react-native';

export default function ShiftDetailsModal({ visible, date, shift, config, onClose, onDelete }) {
  if (!shift) return null;

  const hourlyRate = Number(config.hourlyRate);
  let totalHours = Number(shift.totalHours);
  if (totalHours > 6) totalHours -= (Number(config.breakDeduction) / 60);

  const threshold = Number(config.overtimeStartThreshold);
  const regHours = Math.min(totalHours, threshold);
  const ot125 = Math.max(0, Math.min(totalHours - threshold, 2));
  const ot150 = Math.max(0, totalHours - threshold - 2);
  const gross = (regHours * hourlyRate) + (ot125 * hourlyRate * 1.25) + (ot150 * hourlyRate * 1.5) + Number(shift.bonus) + Number(config.travelDaily);

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose}><Text style={styles.closeText}>סגור</Text></TouchableOpacity>
          <Text style={styles.headerTitle}>סיכום משמרת</Text>
          <TouchableOpacity onPress={onDelete}><Text style={styles.deleteText}>מחק</Text></TouchableOpacity>
        </View>

        <ScrollView style={styles.content}>
          <Text style={styles.dateHeader}>{date}</Text>
          
          <Text style={styles.sectionLabel}>פירוט שכר ושעות</Text>
          <View style={styles.card}>
            <DetailRow label="שעות רגילות" value={`${regHours.toFixed(2)} ש'`} />
            {ot125 > 0 && <DetailRow label="שעות נוספות 125%" value={`${ot125.toFixed(2)} ש'`} color="#00adf5" />}
            {ot150 > 0 && <DetailRow label="שעות נוספות 150%" value={`${ot150.toFixed(2)} ש'`} color="#00adf5" />}
            <View style={styles.divider} />
            <DetailRow label="בונוס / טיפים" value={`₪${shift.bonus}`} />
            <DetailRow label="החזר נסיעות" value={`₪${config.travelDaily}`} />
          </View>

          <View style={styles.totalCard}>
            <Text style={styles.totalLabel}>סך הכל ברוטו</Text>
            <Text style={styles.totalValue}>₪{Math.round(gross).toLocaleString()}</Text>
          </View>

          <Text style={styles.footerNote}>* השכר מוצג לפני ניכויי פנסיה ומס הכנסה חודשיים.</Text>
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}

const DetailRow = ({ label, value, color = "#fff" }) => (
  <View style={styles.row}>
    <Text style={[styles.val, { color }]}>{value}</Text>
    <Text style={styles.lab}>{label}</Text>
  </View>
);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  header: { flexDirection: 'row', justifyContent: 'space-between', padding: 20, borderBottomWidth: 0.5, borderBottomColor: '#222' },
  headerTitle: { color: '#fff', fontSize: 17, fontWeight: '600' },
  closeText: { color: '#00adf5', fontSize: 17 },
  deleteText: { color: '#ff3b30', fontSize: 17 },
  content: { padding: 16 },
  dateHeader: { color: '#fff', fontSize: 28, fontWeight: 'bold', textAlign: 'right', marginTop: 10, marginBottom: 20 },
  sectionLabel: { color: '#8e8e93', fontSize: 13, marginBottom: 8, textAlign: 'right' },
  card: { backgroundColor: '#1c1c1e', borderRadius: 12, paddingVertical: 8, marginBottom: 20 },
  row: { flexDirection: 'row', justifyContent: 'space-between', padding: 16 },
  lab: { color: '#fff', fontSize: 16 },
  val: { color: '#fff', fontSize: 16, fontWeight: '500' },
  divider: { height: 0.5, backgroundColor: '#38383a', marginLeft: 16 },
  totalCard: { backgroundColor: '#1c1c1e', borderRadius: 12, padding: 20, alignItems: 'center', borderWith: 1, borderColor: '#333' },
  totalLabel: { color: '#aaa', fontSize: 14, marginBottom: 5 },
  totalValue: { color: '#4cd964', fontSize: 36, fontWeight: 'bold' },
  footerNote: { color: '#444', fontSize: 12, textAlign: 'center', marginTop: 20 }
});

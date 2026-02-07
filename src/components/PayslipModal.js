import React from 'react';
import { Modal, View, Text, StyleSheet, ScrollView, TouchableOpacity, SafeAreaView } from 'react-native';
import { calculateNetSalary } from '../utils/calculations';

export default function PayslipModal({ visible, onClose, shifts, config }) {
  const stats = calculateNetSalary(shifts, config);

  return (
    <Modal visible={visible} animationType="slide">
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>תלוש שכר צפוי - סימולציה</Text>
          <TouchableOpacity onPress={onClose}><Text style={styles.closeX}>✕</Text></TouchableOpacity>
        </View>

        <ScrollView style={styles.payslipCard}>
          <Text style={styles.sectionTitle}>תשלומים</Text>
          <Row label="שכר יסוד (ברוטו)" value={stats.gross - stats.sicknessPay - stats.travel} />
          {stats.sicknessPay > 0 && <Row label="דמי מחלה" value={stats.sicknessPay} />}
          {stats.travel > 0 && <Row label="החזר נסיעות" value={stats.travel} />}
          <Row label="סה''כ ברוטו" value={stats.gross} isBold />

          <View style={styles.divider} />

          <Text style={styles.sectionTitle}>ניכויי חובה</Text>
          <Row label="מס הכנסה" value={-stats.tax} color="#ff4444" />
          <Row label="ביטוח לאומי ומס בריאות" value={-stats.social} color="#ff4444" />
          <Row label="פנסיה (עובד)" value={-stats.pensionEmployee} color="#ff4444" />
          <Row label="סה''כ ניכויים" value={-(stats.tax + stats.social + stats.pensionEmployee)} isBold color="#ff4444" />

          <View style={styles.totalBox}>
            <Text style={styles.totalLabel}>סה''כ לתשלום (נטו)</Text>
            <Text style={styles.totalValue}>₪{stats.net}</Text>
          </View>

          <View style={styles.employerSection}>
            <Text style={styles.sectionTitle}>הפרשות מעסיק (לבדיקה בתלוש)</Text>
            <Row label="תגמולים מעסיק (6.5%)" value={stats.pensionEmployer} />
            <Row label="פיצויים מעסיק (6%)" value={stats.severanceEmployer} />
          </View>
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}

const Row = ({ label, value, isBold, color = '#333' }) => (
  <View style={styles.row}>
    <Text style={[styles.rowValue, { color, fontWeight: isBold ? 'bold' : 'normal' }]}>₪{Math.abs(value)}</Text>
    <Text style={[styles.rowLabel, { fontWeight: isBold ? 'bold' : 'normal' }]}>{label}</Text>
  </View>
);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f4f4f4' },
  header: { flexDirection: 'row-reverse', justifyContent: 'space-between', padding: 20, backgroundColor: '#fff' },
  title: { fontSize: 18, fontWeight: 'bold' },
  closeX: { fontSize: 22, color: '#666' },
  payslipCard: { margin: 15, backgroundColor: '#fff', borderRadius: 10, padding: 20, elevation: 3 },
  sectionTitle: { fontSize: 14, color: '#00adf5', fontWeight: 'bold', marginBottom: 10, textAlign: 'right' },
  row: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  divider: { height: 1, backgroundColor: '#eee', marginVertical: 15 },
  totalBox: { backgroundColor: '#e1f5fe', padding: 15, borderRadius: 8, marginTop: 20, alignItems: 'center' },
  totalLabel: { fontSize: 16, fontWeight: 'bold', color: '#01579b' },
  totalValue: { fontSize: 24, fontWeight: 'bold', color: '#01579b' },
  employerSection: { marginTop: 30, padding: 10, backgroundColor: '#f9f9f9', borderRadius: 8 }
});

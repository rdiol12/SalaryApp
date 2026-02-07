import React from 'react';
import { Modal, View, Text, StyleSheet, ScrollView, TouchableOpacity, SafeAreaView } from 'react-native';
import { calculateNetSalary } from '../utils/calculations';

export default function PayslipModal({ visible, onClose, shifts, config }) {
  const stats = calculateNetSalary(shifts, config);

  return (
    <Modal visible={visible} animationType="slide">
      <SafeAreaView style={styles.container}>
        {/* כותרת עליונה */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
            <Text style={styles.closeText}>סגור</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>סימולציית תלוש שכר</Text>
          <View style={{ width: 50 }} /> 
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.payslipPaper}>
            
            {/* פרטי עובד כלליים */}
            <View style={styles.topInfo}>
              <Text style={styles.infoText}>שם העובד: {config.userName}</Text>
              <Text style={styles.infoText}>חודש: {new Date().getMonth() + 1}/{new Date().getFullYear()}</Text>
            </View>

            <View style={styles.dividerBold} />

            {/* חלק א' - תשלומי ברוטו */}
            <Text style={styles.sectionTitle}>תשלומי שכר (זכות)</Text>
            <PayslipRow label="שכר יסוד / עבודה" value={stats.gross - stats.sicknessPay - stats.travel} />
            {stats.sicknessPay > 0 && <PayslipRow label="דמי מחלה (מדורג)" value={stats.sicknessPay} />}
            {stats.travel > 0 && <PayslipRow label="החזר נסיעות" value={stats.travel} />}
            <View style={styles.subTotalRow}>
              <Text style={styles.subTotalValue}>₪{stats.gross}</Text>
              <Text style={styles.subTotalLabel}>סה"כ ברוטו:</Text>
            </View>

            <View style={styles.divider} />

            {/* חלק ב' - ניכויי חובה */}
            <Text style={styles.sectionTitle}>ניכויי חובה (חובה)</Text>
            <PayslipRow label="מס הכנסה" value={-stats.tax} color="#d32f2f" />
            <PayslipRow label="ביטוח לאומי ומס בריאות" value={-stats.social} color="#d32f2f" />
            <PayslipRow label="דמי גמולים עובד (פנסיה)" value={-stats.pensionEmployee} color="#d32f2f" />
            <View style={styles.subTotalRow}>
              <Text style={[styles.subTotalValue, {color: '#d32f2f'}]}>₪{stats.tax + stats.social + stats.pensionEmployee}</Text>
              <Text style={styles.subTotalLabel}>סה"כ ניכויים:</Text>
            </View>

            {/* חלק ג' - נטו סופי */}
            <View style={styles.netBox}>
              <Text style={styles.netLabel}>סה"כ לתשלום (נטו בבנק)</Text>
              <Text style={styles.netValue}>₪{stats.net}</Text>
            </View>

            <View style={styles.dividerBold} />

            {/* חלק ד' - מידע למעקב מעסיק */}
            <Text style={[styles.sectionTitle, {color: '#666'}]}>הפרשות מעסיק (למעקב בלבד)</Text>
            <PayslipRow label="גמולים מעסיק (6.5%)" value={stats.pensionEmployer} isSmall />
            <PayslipRow label="פיצויים מעסיק (6%)" value={stats.severanceEmployer} isSmall />
            <Text style={styles.note}>* וודא שסכומים אלו מופיעים בקרן הפנסיה שלך</Text>

          </View>
          
          <Text style={styles.disclaimer}>החישוב הינו סימולציה ואינו מהווה תלוש שכר רשמי.</Text>
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}

const PayslipRow = ({ label, value, color = '#333', isSmall = false }) => (
  <View style={styles.row}>
    <Text style={[styles.rowValue, { color, fontSize: isSmall ? 13 : 15 }]}>
      {value < 0 ? '-' : ''}₪{Math.abs(value).toLocaleString()}
    </Text>
    <Text style={[styles.rowLabel, { fontSize: isSmall ? 13 : 15 }]}>{label}</Text>
  </View>
);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#E0E0E0' },
  header: { flexDirection: 'row-reverse', justifyContent: 'space-between', padding: 15, backgroundColor: '#1c1c1e', alignItems: 'center' },
  headerTitle: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  closeText: { color: '#00adf5', fontSize: 16 },
  scrollContent: { paddingBottom: 40 },
  payslipPaper: { 
    margin: 15, 
    backgroundColor: '#FFF', 
    padding: 20, 
    borderRadius: 5,
    // צל שנותן אפקט של דף מונח
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5
  },
  topInfo: { marginBottom: 15 },
  infoText: { fontSize: 14, color: '#333', textAlign: 'right', marginBottom: 3 },
  dividerBold: { height: 2, backgroundColor: '#333', marginVertical: 10 },
  divider: { height: 1, backgroundColor: '#EEE', marginVertical: 15 },
  sectionTitle: { fontSize: 14, color: '#00adf5', fontWeight: 'bold', marginBottom: 10, textAlign: 'right' },
  row: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  rowLabel: { color: '#333' },
  rowValue: { fontWeight: '500' },
  subTotalRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 5, paddingTop: 5, borderTopWidth: 1, borderTopColor: '#EEE' },
  subTotalLabel: { fontWeight: 'bold', fontSize: 14 },
  subTotalValue: { fontWeight: 'bold', fontSize: 14 },
  netBox: { backgroundColor: '#F8F9FA', padding: 15, borderRadius: 4, marginVertical: 20, alignItems: 'center', borderWidth: 1, borderColor: '#DDD' },
  netLabel: { fontSize: 16, fontWeight: 'bold', color: '#333' },
  netValue: { fontSize: 28, fontWeight: 'bold', color: '#2E7D32' },
  note: { fontSize: 11, color: '#999', textAlign: 'right', marginTop: 10 },
  disclaimer: { textAlign: 'center', color: '#777', fontSize: 12, marginTop: 10 },
});

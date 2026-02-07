import React from 'react';
import { Modal, View, Text, StyleSheet, ScrollView, TouchableOpacity, SafeAreaView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { calculateNetSalary } from '../utils/calculations';
import { darkTheme as T } from '../constants/theme';

export default function PayslipModal({ visible, onClose, shifts, config }) {
  const stats = calculateNetSalary(shifts, config);

  return (
    <Modal visible={visible} animationType="slide">
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} activeOpacity={0.6}>
            <Text style={styles.closeText}>סגור</Text>
          </TouchableOpacity>
          <View style={styles.headerCenter}>
            <Ionicons name="document-text" size={18} color={T.accent} />
            <Text style={styles.headerTitle}>סימולציית תלוש שכר</Text>
          </View>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <View style={styles.payslipPaper}>
            <View style={styles.topInfo}>
              <Text style={styles.infoText}>שם העובד: {config.userName}</Text>
              <Text style={styles.infoText}>חודש: {new Date().getMonth() + 1}/{new Date().getFullYear()}</Text>
            </View>

            <View style={styles.dividerBold} />

            <Text style={styles.sectionTitle}>תשלומי שכר (זכות)</Text>
            <PayslipRow label="שכר יסוד / עבודה" value={stats.gross - stats.sicknessPay - stats.travel} />
            {stats.sicknessPay > 0 && <PayslipRow label="דמי מחלה (מדורג)" value={stats.sicknessPay} />}
            {stats.travel > 0 && <PayslipRow label="החזר נסיעות" value={stats.travel} />}
            <View style={styles.subTotalRow}>
              <Text style={styles.subTotalValue}>₪{stats.gross}</Text>
              <Text style={styles.subTotalLabel}>סה"כ ברוטו:</Text>
            </View>

            <View style={styles.divider} />

            <Text style={styles.sectionTitle}>ניכויי חובה (חובה)</Text>
            <PayslipRow label="מס הכנסה" value={-stats.tax} color="#d32f2f" />
            <PayslipRow label="ביטוח לאומי ומס בריאות" value={-stats.social} color="#d32f2f" />
            <PayslipRow label="דמי גמולים עובד (פנסיה)" value={-stats.pensionEmployee} color="#d32f2f" />
            <View style={styles.subTotalRow}>
              <Text style={[styles.subTotalValue, { color: '#d32f2f' }]}>
                ₪{stats.tax + stats.social + stats.pensionEmployee}
              </Text>
              <Text style={styles.subTotalLabel}>סה"כ ניכויים:</Text>
            </View>

            <View style={styles.netBox}>
              <Text style={styles.netLabel}>סה"כ לתשלום (נטו בבנק)</Text>
              <Text style={styles.netValue}>₪{stats.net}</Text>
            </View>

            <View style={styles.dividerBold} />

            <Text style={[styles.sectionTitle, { color: '#888' }]}>הפרשות מעסיק (למעקב בלבד)</Text>
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
  container: {
    flex: 1,
    backgroundColor: '#E8E8ED',
  },
  header: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: T.cardBg,
  },
  headerCenter: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 6,
  },
  headerTitle: {
    color: T.text,
    fontSize: 17,
    fontWeight: 'bold',
  },
  closeText: {
    color: T.accent,
    fontSize: 16,
    fontWeight: '500',
  },
  scrollContent: {
    paddingBottom: 40,
  },
  payslipPaper: {
    margin: 16,
    backgroundColor: '#FFF',
    padding: 24,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
  },
  topInfo: {
    marginBottom: 16,
  },
  infoText: {
    fontSize: 14,
    color: '#444',
    textAlign: 'right',
    marginBottom: 4,
  },
  dividerBold: {
    height: 2,
    backgroundColor: '#333',
    marginVertical: 12,
  },
  divider: {
    height: 1,
    backgroundColor: '#EEE',
    marginVertical: 16,
  },
  sectionTitle: {
    fontSize: 14,
    color: '#0A84FF',
    fontWeight: 'bold',
    marginBottom: 12,
    textAlign: 'right',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  rowLabel: {
    color: '#444',
  },
  rowValue: {
    fontWeight: '500',
  },
  subTotalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 6,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#EEE',
  },
  subTotalLabel: {
    fontWeight: 'bold',
    fontSize: 14,
    color: '#333',
  },
  subTotalValue: {
    fontWeight: 'bold',
    fontSize: 14,
    color: '#333',
  },
  netBox: {
    backgroundColor: '#F0FAF0',
    padding: 20,
    borderRadius: 8,
    marginVertical: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#C8E6C9',
  },
  netLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: '#444',
    marginBottom: 4,
  },
  netValue: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#2E7D32',
  },
  note: {
    fontSize: 11,
    color: '#999',
    textAlign: 'right',
    marginTop: 12,
  },
  disclaimer: {
    textAlign: 'center',
    color: '#888',
    fontSize: 12,
    marginTop: 12,
  },
});

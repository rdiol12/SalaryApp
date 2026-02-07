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
            <Ionicons name="document-text" size={18} color="#fff" />
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
            {stats.sicknessPay > 0 && <PayslipRow label="דמי מחלה" value={stats.sicknessPay} />}
            {stats.travel > 0 && <PayslipRow label="החזר נסיעות" value={stats.travel} />}
            <View style={styles.subTotalRow}>
              <Text style={styles.subTotalValue}>₪{stats.gross}</Text>
              <Text style={styles.subTotalLabel}>סה״כ ברוטו:</Text>
            </View>

            <View style={styles.divider} />

            <Text style={styles.sectionTitle}>ניכויי חובה</Text>
            <PayslipRow label="מס הכנסה" value={-stats.tax} color={T.red} />
            <PayslipRow label="ביטוח לאומי ומס בריאות" value={-stats.social} color={T.red} />
            <PayslipRow label="תגמולים עובד (פנסיה)" value={-stats.pensionEmployee} color={T.red} />
            <View style={styles.subTotalRow}>
              <Text style={[styles.subTotalValue, { color: T.red }]}>
                ₪{stats.tax + stats.social + stats.pensionEmployee}
              </Text>
              <Text style={styles.subTotalLabel}>סה״כ ניכויים:</Text>
            </View>

            <View style={styles.netBox}>
              <Text style={styles.netLabel}>סה״כ לתשלום (נטו בבנק)</Text>
              <Text style={styles.netValue}>₪{stats.net}</Text>
            </View>

            <View style={styles.dividerBold} />

            <Text style={[styles.sectionTitle, { color: T.textMuted }]}>הפרשות מעסיק (למידע בלבד)</Text>
            <PayslipRow label="תגמולים מעסיק (6.5%)" value={stats.pensionEmployer} isSmall />
            <PayslipRow label="פיצויים מעסיק (6%)" value={stats.severanceEmployer} isSmall />
            <Text style={styles.note}>* ודא שסכומים אלו מופיעים בקרן הפנסיה שלך</Text>
          </View>

          <Text style={styles.disclaimer}>החישוב הינו סימולציה ואינו מהווה תלוש שכר רשמי.</Text>
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}

const PayslipRow = ({ label, value, color = T.text, isSmall = false }) => (
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
    backgroundColor: T.bg,
  },
  header: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: T.accent,
  },
  headerCenter: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 6,
  },
  headerTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  closeText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
  },
  scrollContent: {
    paddingBottom: 40,
  },
  payslipPaper: {
    margin: 16,
    backgroundColor: T.cardBg,
    padding: 20,
    borderRadius: T.radiusMd,
    borderWidth: 1,
    borderColor: T.border,
  },
  topInfo: {
    marginBottom: 12,
  },
  infoText: {
    fontSize: 13,
    color: T.textSecondary,
    textAlign: 'right',
    marginBottom: 4,
  },
  dividerBold: {
    height: 2,
    backgroundColor: T.text,
    marginVertical: 12,
  },
  divider: {
    height: 1,
    backgroundColor: T.divider,
    marginVertical: 12,
  },
  sectionTitle: {
    fontSize: 13,
    color: T.accent,
    fontWeight: '700',
    marginBottom: 8,
    textAlign: 'right',
  },
  row: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  rowLabel: {
    color: T.text,
  },
  rowValue: {
    fontWeight: '600',
  },
  subTotalRow: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    marginTop: 6,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: T.divider,
  },
  subTotalLabel: {
    fontWeight: '700',
    fontSize: 13,
    color: T.text,
  },
  subTotalValue: {
    fontWeight: '700',
    fontSize: 13,
    color: T.text,
  },
  netBox: {
    backgroundColor: T.accentLight,
    padding: 16,
    borderRadius: T.radiusMd,
    marginVertical: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: T.border,
  },
  netLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: T.text,
    marginBottom: 4,
  },
  netValue: {
    fontSize: 30,
    fontWeight: '800',
    color: T.accent,
  },
  note: {
    fontSize: 11,
    color: T.textMuted,
    textAlign: 'right',
    marginTop: 8,
  },
  disclaimer: {
    textAlign: 'center',
    color: T.textMuted,
    fontSize: 12,
    marginTop: 12,
  },
});

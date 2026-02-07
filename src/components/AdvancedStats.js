import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { calculateNetSalary } from '../utils/calculations';
import { darkTheme as T } from '../constants/theme';

export default function AdvancedStats({ monthlyShifts, config }) {
  const stats = calculateNetSalary(monthlyShifts, config);

  if (monthlyShifts.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Ionicons name="analytics-outline" size={48} color={T.textPlaceholder} />
        <Text style={styles.emptyTitle}>אין נתונים למחזור זה</Text>
        <Text style={styles.emptySubtext}>הוסף משמרות כדי לראות סטטיסטיקות</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <Text style={styles.headerTitle}>סיכום שכר חודשי</Text>

      <View style={styles.netCard}>
        <Text style={styles.netLabel}>נטו משוער לבנק</Text>
        <Text style={styles.netValue}>₪{stats.net.toLocaleString()}</Text>

        <View style={styles.quickStats}>
          <View style={styles.quickItem}>
            <Text style={styles.quickVal}>{stats.totalHours}</Text>
            <Text style={styles.quickLab}>שעות</Text>
          </View>
          <View style={styles.quickDivider} />
          <View style={styles.quickItem}>
            <Text style={styles.quickVal}>{stats.shiftCount}</Text>
            <Text style={styles.quickLab}>משמרות</Text>
          </View>
        </View>
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Ionicons name="document-text-outline" size={16} color={T.textSecondary} />
          <Text style={styles.sectionTitle}>פירוט תלוש (משוער)</Text>
        </View>
        <DetailRow label="שכר ברוטו" value={`₪${stats.gross}`} />
        <DetailRow label="דמי נסיעות (חודשי)" value={`+ ₪${stats.travel}`} isPositive />
        {stats.sicknessPay > 0 && (
          <DetailRow label="דמי מחלה ששולמו" value={`+ ₪${stats.sicknessPay}`} isPositive />
        )}
        <View style={styles.divider} />
        <DetailRow label="מס הכנסה" value={`- ₪${stats.tax}`} isNegative />
        <DetailRow label="ביטוח לאומי ובריאות" value={`- ₪${stats.social}`} isNegative />
        <DetailRow label="פנסיה (חלק העובד)" value={`- ₪${stats.pensionEmployee}`} isNegative />
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Ionicons name="shield-checkmark-outline" size={16} color={T.accent} />
          <Text style={[styles.sectionTitle, { color: T.accent }]}>הפרשות מעסיק</Text>
        </View>
        <DetailRow label="תגמולי מעסיק (6.5%)" value={`₪${stats.pensionEmployer}`} color={T.accent} />
        <DetailRow label="פיצויים (6%)" value={`₪${stats.severanceEmployer}`} color={T.accent} />
        <View style={[styles.divider, { backgroundColor: T.accentLight }]} />
        <DetailRow
          label="סה״כ הפרשות סוציאליות"
          value={`₪${stats.pensionEmployer + stats.severanceEmployer}`}
          color={T.accent}
          isBold
        />
      </View>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const DetailRow = ({ label, value, isNegative, isPositive, isBold, color }) => (
  <View style={styles.detailRow}>
    <Text style={[
      styles.detailValue,
      isNegative && { color: T.red },
      isPositive && { color: T.green },
      color && { color },
      isBold && { fontWeight: 'bold', fontSize: 16 },
    ]}>
      {value}
    </Text>
    <Text style={[styles.detailLabel, isBold && { fontWeight: 'bold', color: T.text }]}>
      {label}
    </Text>
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: T.bg,
    padding: 16,
  },
  headerTitle: {
    color: T.text,
    fontSize: 22,
    fontWeight: 'bold',
    textAlign: 'right',
    marginBottom: 20,
  },
  netCard: {
    backgroundColor: T.cardBg,
    borderRadius: T.radiusXl,
    padding: 24,
    alignItems: 'center',
    marginBottom: 20,
    borderWidth: 1,
    borderColor: T.border,
  },
  netLabel: {
    color: T.textSecondary,
    fontSize: 14,
    marginBottom: 8,
  },
  netValue: {
    color: T.green,
    fontSize: 44,
    fontWeight: 'bold',
    letterSpacing: -1,
  },
  quickStats: {
    flexDirection: 'row',
    marginTop: 20,
    width: '100%',
    borderTopWidth: 1,
    borderTopColor: T.border,
    paddingTop: 16,
    alignItems: 'center',
  },
  quickItem: {
    flex: 1,
    alignItems: 'center',
  },
  quickDivider: {
    width: 1,
    height: 30,
    backgroundColor: T.border,
  },
  quickVal: {
    color: T.text,
    fontSize: 20,
    fontWeight: 'bold',
  },
  quickLab: {
    color: T.textSecondary,
    fontSize: 12,
    marginTop: 2,
  },
  section: {
    backgroundColor: T.cardBg,
    borderRadius: T.radiusXl,
    padding: 20,
    marginBottom: 12,
  },
  sectionHeader: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 6,
    marginBottom: 16,
  },
  sectionTitle: {
    color: T.textSecondary,
    fontSize: 13,
    fontWeight: '600',
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
  },
  detailLabel: {
    color: T.textSecondary,
    fontSize: 15,
  },
  detailValue: {
    color: T.text,
    fontSize: 15,
    fontWeight: '500',
  },
  divider: {
    height: 1,
    backgroundColor: T.divider,
    marginVertical: 4,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  emptyTitle: {
    color: T.textSecondary,
    fontSize: 16,
    fontWeight: '600',
  },
  emptySubtext: {
    color: T.textMuted,
    fontSize: 13,
  },
});

import React from 'react';
import { View, Text, StyleSheet, ScrollView, Dimensions } from 'react-native';
import { calculateNetSalary } from '../utils/calculation';

const screenWidth = Dimensions.get('window').width;

export default function AdvancedStats({ monthlyShifts, config }) {
  const stats = calculateNetSalary(monthlyShifts, config);

  if (monthlyShifts.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>אין נתונים למחזור זה</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.headerTitle}>סיכום שכר חודשי</Text>

      {/* כרטיס הנטו הראשי */}
      <View style={styles.netCard}>
        <Text style={styles.netLabel}>נטו משוער לבנק</Text>
        <Text style={styles.netValue}>₪{stats.net.toLocaleString()}</Text>
        
        <View style={styles.quickStats}>
          <View style={styles.quickItem}>
            <Text style={styles.quickVal}>{stats.totalHours}</Text>
            <Text style={styles.quickLab}>שעות</Text>
          </View>
          <View style={styles.quickItem}>
            <Text style={styles.quickVal}>{stats.shiftCount}</Text>
            <Text style={styles.quickLab}>משמרות</Text>
          </View>
        </View>
      </View>

      {/* פירוט ברוטו וניכויים */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>פירוט תלוש (משוער)</Text>
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

      {/* הפרשות מעסיק - "הכסף השקוף" */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>הפרשות מעסיק (מעבר לנטו)</Text>
        <DetailRow label="תגמולי מעסיק (6.5%)" value={`₪${stats.pensionEmployer}`} color="#00adf5" />
        <DetailRow label="פיצויים (6%)" value={`₪${stats.severanceEmployer}`} color="#00adf5" />
        <View style={[styles.divider, { backgroundColor: '#00adf5', opacity: 0.3 }]} />
        <DetailRow 
          label="סה״כ הפרשות סוציאליות" 
          value={`₪${stats.pensionEmployer + stats.severanceEmployer}`} 
          color="#00adf5"
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
      isNegative && { color: '#ff3b30' },
      isPositive && { color: '#4cd964' },
      color && { color: color },
      isBold && { fontWeight: 'bold', fontSize: 16 }
    ]}>
      {value}
    </Text>
    <Text style={[styles.detailLabel, isBold && { fontWeight: 'bold', color: '#fff' }]}>
      {label}
    </Text>
  </View>
);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000', padding: 16 },
  headerTitle: { color: '#fff', fontSize: 22, fontWeight: 'bold', textAlign: 'right', marginBottom: 20 },
  netCard: { 
    backgroundColor: '#1c1c1e', 
    borderRadius: 24, 
    padding: 24, 
    alignItems: 'center',
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#333'
  },
  netLabel: { color: '#8e8e93', fontSize: 14, marginBottom: 8 },
  netValue: { color: '#4cd964', fontSize: 48, fontWeight: 'bold' },
  quickStats: { flexDirection: 'row', marginTop: 20, width: '100%', borderTopWidth: 1, borderTopColor: '#333', paddingTop: 15 },
  quickItem: { flex: 1, alignItems: 'center' },
  quickVal: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  quickLab: { color: '#8e8e93', fontSize: 12 },
  section: { backgroundColor: '#1c1c1e', borderRadius: 20, padding: 20, marginBottom: 15 },
  sectionTitle: { color: '#8e8e93', fontSize: 13, textAlign: 'right', marginBottom: 15, fontWeight: '600' },
  detailRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 10 },
  detailLabel: { color: '#aaa', fontSize: 15 },
  detailValue: { color: '#fff', fontSize: 15, fontWeight: '500' },
  divider: { height: 1, backgroundColor: '#333', marginVertical: 5 },
  isNegative: { color: '#ff3b30' },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyText: { color: '#444', fontSize: 16 }
});

import React from 'react';
import { View, Text, StyleSheet, ScrollView, Dimensions } from 'react-native';
import { calculateNetSalary } from '../utils/calculation'; // שימוש בתיקיית utils

export default function AdvancedStats({ monthlyShifts, config }) {
  
  // קריאה לפונקציית החישוב מה-Utils
  const stats = calculateNetSalary(monthlyShifts, config);

  if (monthlyShifts.length === 0) {
    return (
      <View style={styles.empty}>
        <Text style={styles.emptyText}>אין משמרות במחזור זה</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.header}>סטטיסטיקה חודשית</Text>

      {/* כרטיס הנטו (התלוש המשוער) */}
      <View style={styles.card}>
        <Text style={styles.label}>צפי נטו לבנק</Text>
        <Text style={styles.netValue}>₪{stats.net.toLocaleString()}</Text>
        
        <View style={styles.divider} />
        
        <StatLine label="ברוטו (כולל בונוסים)" value={`₪${stats.gross}`} />
        <StatLine label="דמי נסיעות" value={`₪${stats.travel}`} isBonus />
        <StatLine label="מס הכנסה" value={`-₪${stats.tax}`} isDeduction />
        <StatLine label="ביטוח לאומי" value={`-₪${stats.social}`} isDeduction />
        <StatLine label="פנסיה (עובד)" value={`-₪${stats.pensionEmployee}`} isDeduction />
      </View>

      <View style={styles.summaryRow}>
        <View style={styles.miniBox}>
          <Text style={styles.miniVal}>{stats.totalHours}</Text>
          <Text style={styles.miniLab}>שעות</Text>
        </View>
        <View style={styles.miniBox}>
          <Text style={styles.miniVal}>{stats.shiftCount}</Text>
          <Text style={styles.miniLab}>משמרות</Text>
        </View>
      </View>
    </ScrollView>
  );
}

const StatLine = ({ label, value, isDeduction, isBonus }) => (
  <View style={styles.statLine}>
    <Text style={[
      styles.statValue, 
      isDeduction && { color: '#ff3b30' },
      isBonus && { color: '#00adf5' }
    ]}>{value}</Text>
    <Text style={styles.statLabel}>{label}</Text>
  </View>
);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000', padding: 16 },
  header: { color: '#fff', fontSize: 24, fontWeight: 'bold', textAlign: 'right', marginBottom: 20 },
  card: { backgroundColor: '#1c1c1e', borderRadius: 20, padding: 20, marginBottom: 20 },
  label: { color: '#8e8e93', textAlign: 'center', fontSize: 14 },
  netValue: { color: '#4cd964', textAlign: 'center', fontSize: 44, fontWeight: 'bold', marginVertical: 10 },
  divider: { height: 1, backgroundColor: '#333', marginVertical: 15 },
  statLine: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  statLabel: { color: '#aaa', fontSize: 15 },
  statValue: { color: '#fff', fontSize: 15, fontWeight: 'bold' },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between' },
  miniBox: { backgroundColor: '#1c1c1e', borderRadius: 15, padding: 15, width: '48%', alignItems: 'center' },
  miniVal: { color: '#fff', fontSize: 20, fontWeight: 'bold' },
  miniLab: { color: '#8e8e93', fontSize: 12, marginTop: 4 },
  empty: { flex: 1, justifyContent: 'center', alignItems: 'center', marginTop: 100 },
  emptyText: { color: '#444', fontSize: 16 }
});

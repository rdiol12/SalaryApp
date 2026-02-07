import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { calculateNetSalary } from '../utils/calculations';

export default function Header({ shifts, config, onOpenMenu }) {
  const totalGross = Object.values(shifts).reduce((sum, s) => sum + (s.earned || 0), 0);
  const stats = calculateNetSalary(totalGross, Number(config.creditPoints), Number(config.pensionRate), Number(config.travelAllowance));

  return (
    <View style={styles.header}>
      <View style={styles.topBar}>
        <Text style={styles.userName}>שלום, {config.userName}</Text>
        <TouchableOpacity onPress={onOpenMenu}><Text style={styles.menuIcon}>☰</Text></TouchableOpacity>
      </View>
      <View style={styles.mainInfo}>
        <Text style={styles.netLabel}>נטו משוער</Text>
        <Text style={styles.netAmount}>₪{stats.net.toLocaleString()}</Text>
      </View>
      <View style={styles.detailsGrid}>
        <DetailItem label="ברוטו" value={stats.gross} />
        <DetailItem label="פנסיה" value={stats.pension} />
        <DetailItem label="ניכויים" value={stats.tax + stats.social} />
      </View>
    </View>
  );
}

const DetailItem = ({ label, value }) => (
  <View style={styles.detailBox}>
    <Text style={styles.detailLabel}>{label}</Text>
    <Text style={styles.detailValue}>₪{value}</Text>
  </View>
);

const styles = StyleSheet.create({
  header: { backgroundColor: '#1c1c1e', padding: 20, borderBottomLeftRadius: 25, borderBottomRightRadius: 25, paddingTop: 50 },
  topBar: { flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  userName: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  menuIcon: { color: '#00adf5', fontSize: 28 },
  mainInfo: { alignItems: 'center', marginBottom: 20 },
  netLabel: { color: '#aaa', fontSize: 14 },
  netAmount: { color: '#fff', fontSize: 42, fontWeight: 'bold' },
  detailsGrid: { flexDirection: 'row-reverse', justifyContent: 'space-around', borderTopWidth: 0.5, borderTopColor: '#333', paddingTop: 15 },
  detailBox: { alignItems: 'center' },
  detailLabel: { color: '#666', fontSize: 12 },
  detailValue: { color: '#fff', fontSize: 14, fontWeight: '600' }
});

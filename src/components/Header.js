import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { calculateNetSalary } from '../utils/calculations';

export default function Header({ shifts, config, onOpenMenu }) {
  const stats = calculateNetSalary(shifts, config);

  return (
    <View style={styles.container}>
      <View style={styles.top}>
        <Text style={styles.name}>שלום, {config.userName}</Text>
        <TouchableOpacity onPress={onOpenMenu}><Text style={styles.burger}>☰</Text></TouchableOpacity>
      </View>
      <View style={styles.main}>
        <Text style={styles.label}>נטו משוער</Text>
        <Text style={styles.amount}>₪{stats.net.toLocaleString()}</Text>
      </View>
      <View style={styles.footer}>
        <Text style={styles.sub}>ברוטו: ₪{stats.gross}</Text>
        {stats.sicknessPay > 0 && <Text style={styles.sub}>דמי מחלה: ₪{stats.sicknessPay}</Text>}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { backgroundColor: '#1c1c1e', padding: 20, paddingTop: 50, borderBottomLeftRadius: 20, borderBottomRightRadius: 20 },
  top: { flexDirection: 'row-reverse', justifyContent: 'space-between' },
  name: { color: '#fff', fontSize: 18 },
  burger: { color: '#00adf5', fontSize: 24 },
  main: { alignItems: 'center', marginVertical: 20 },
  label: { color: '#aaa' },
  amount: { color: '#fff', fontSize: 36, fontWeight: 'bold' },
  footer: { flexDirection: 'row-reverse', justifyContent: 'space-around' },
  sub: { color: '#666', fontSize: 12 }
});

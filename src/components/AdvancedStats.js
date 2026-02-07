import React from 'react';
import { View, Text, StyleSheet, Dimensions, ScrollView } from 'react-native';
import { LineChart, PieChart } from 'react-native-chart-kit';

const screenWidth = Dimensions.get('window').width;

export default function AdvancedStats({ monthlyShifts, config }) {
  if (monthlyShifts.length === 0) return <Text style={styles.noData}>אין נתונים למחזור זה</Text>;

  const totalEarned = monthlyShifts.reduce((s, a) => s + Number(a.earned), 0);
  const totalHours = monthlyShifts.reduce((s, a) => s + Number(a.totalHours), 0);

  // נתונים לגרף קווים - 5 משמרות אחרונות
  const lastShifts = monthlyShifts.slice(0, 5).reverse();
  const lineData = {
    labels: lastShifts.map(s => s.date.split('-')[2]),
    datasets: [{ data: lastShifts.map(s => Number(s.earned)) }]
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.headerTitle}>ניתוח שכר חודשי</Text>
      
      <LineChart
        data={lineData}
        width={screenWidth - 32}
        height={200}
        chartConfig={chartConfig}
        bezier
        style={styles.chart}
      />

      <View style={styles.statsTable}>
        <Text style={styles.tableHeader}>סיכום נתונים</Text>
        <StatRow label="סה״כ ברוטו" value={`₪${Math.round(totalEarned).toLocaleString()}`} isBold />
        <StatRow label="סה״כ שעות" value={totalHours.toFixed(1)} />
        <StatRow label="ממוצע למשמרת" value={`₪${Math.round(totalEarned / monthlyShifts.length)}`} />
        <StatRow label="יעד חודשי" value={`₪${config.monthlyGoal}`} />
      </View>
      
      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const StatRow = ({ label, value, isBold }) => (
  <View style={styles.row}>
    <Text style={[styles.rowValue, isBold && styles.boldBlue]}>{value}</Text>
    <Text style={styles.rowLabel}>{label}</Text>
  </View>
);

const chartConfig = {
  backgroundColor: '#1c1c1e',
  backgroundGradientFrom: '#1c1c1e',
  backgroundGradientTo: '#1c1c1e',
  decimalPlaces: 0,
  color: (opacity = 1) => `rgba(0, 173, 245, ${opacity})`,
  labelColor: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
  propsForDots: { r: "5", strokeWidth: "2", stroke: "#ffa726" }
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: '#000' },
  headerTitle: { color: '#fff', fontSize: 18, fontWeight: 'bold', textAlign: 'right', marginBottom: 15 },
  chart: { borderRadius: 16, marginVertical: 8 },
  statsTable: { backgroundColor: '#1c1c1e', borderRadius: 16, padding: 16, marginTop: 10 },
  tableHeader: { color: '#8e8e93', fontSize: 14, textAlign: 'right', marginBottom: 10 },
  row: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 12, borderBottomWidth: 0.5, borderBottomColor: '#333' },
  rowLabel: { color: '#fff', fontSize: 15 },
  rowValue: { color: '#4cd964', fontSize: 15, fontWeight: 'bold' },
  boldBlue: { color: '#00adf5' },
  noData: { color: '#444', textAlign: 'center', marginTop: 100 }
});

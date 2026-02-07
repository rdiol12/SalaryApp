import React from 'react';
import { View, Text, StyleSheet, Dimensions, ScrollView } from 'react-native';
import { LineChart, PieChart } from 'react-native-chart-kit';

const screenWidth = Dimensions.get('window').width;

export default function AdvancedStats({ monthlyShifts, config }) {
  if (monthlyShifts.length === 0) return <Text style={styles.noData}>אין נתונים להצגה</Text>;

  // נתונים לגרף קווים
  const lineData = {
    labels: monthlyShifts.slice(-5).map(s => s.date.split('-')[2]),
    datasets: [{ data: monthlyShifts.slice(-5).map(s => Number(s.earned) || 0) }]
  };

  // נתונים לגרף עוגה (התפלגות שכר)
  const pieData = [
    { name: 'שכר בסיס', amount: monthlyShifts.reduce((s, a) => s + (Number(a.earned) || 0), 0), color: '#00adf5', legendFontColor: '#fff' },
    { name: 'בונוסים', amount: monthlyShifts.reduce((s, a) => s + (Number(a.bonus) || 0), 0), color: '#4cd964', legendFontColor: '#fff' }
  ];

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>מגמת שכר אחרונה</Text>
      <LineChart
        data={lineData}
        width={screenWidth - 32}
        height={180}
        chartConfig={chartConfig}
        bezier
        style={styles.chart}
      />

      <View style={styles.tableCard}>
        <Text style={styles.tableTitle}>סיכום מחזור שכר</Text>
        <StatRow label="סה״כ שעות" value={monthlyShifts.reduce((s, a) => s + Number(a.totalHours), 0).toFixed(1)} />
        <StatRow label="סה״כ ברוטו" value={`₪${Math.round(monthlyShifts.reduce((s, a) => s + Number(a.earned), 0))}`} isTotal />
        <StatRow label="ממוצע למשמרת" value={`₪${Math.round(monthlyShifts.reduce((s, a) => s + Number(a.earned), 0) / monthlyShifts.length)}`} />
      </View>

      <Text style={styles.title}>התפלגות הכנסות</Text>
      <PieChart
        data={pieData}
        width={screenWidth - 32}
        height={150}
        chartConfig={chartConfig}
        accessor="amount"
        backgroundColor="transparent"
        paddingLeft="15"
      />
    </ScrollView>
  );
}

const StatRow = ({ label, value, isTotal }) => (
  <View style={styles.row}>
    <Text style={[styles.val, isTotal && styles.totalVal]}>{value}</Text>
    <Text style={styles.lab}>{label}</Text>
  </View>
);

const chartConfig = {
  backgroundGradientFrom: '#1c1c1e',
  backgroundGradientTo: '#1c1c1e',
  color: (opacity = 1) => `rgba(0, 173, 245, ${opacity})`,
  labelColor: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  title: { color: '#8e8e93', fontSize: 13, marginBottom: 10, textAlign: 'right', marginTop: 20 },
  chart: { borderRadius: 12, marginVertical: 8 },
  tableCard: { backgroundColor: '#1c1c1e', borderRadius: 12, padding: 16, marginTop: 10 },
  tableTitle: { color: '#fff', fontWeight: 'bold', marginBottom: 10, textAlign: 'right' },
  row: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: 0.5, borderBottomColor: '#333' },
  lab: { color: '#aaa' },
  val: { color: '#fff' },
  totalVal: { color: '#4cd964', fontWeight: 'bold', fontSize: 18 },
  noData: { color: '#444', textAlign: 'center', marginTop: 50 }
});

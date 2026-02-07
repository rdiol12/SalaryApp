import React from 'react';
import { View, Text, StyleSheet, Dimensions, ScrollView } from 'react-native';
import { LineChart, PieChart } from 'react-native-chart-kit';

const screenWidth = Dimensions.get('window').width;

export default function AdvancedStats({ monthlyShifts, config }) {
  if (monthlyShifts.length === 0) return <Text style={styles.empty}>אין נתונים להצגה במחזור זה</Text>;

  const totalEarned = monthlyShifts.reduce((s, a) => s + Number(a.earned), 0);
  const totalHours = monthlyShifts.reduce((s, a) => s + Number(a.totalHours), 0);

  const lineData = {
    labels: monthlyShifts.slice(-5).reverse().map(s => s.date.split('-')[2]),
    datasets: [{ data: monthlyShifts.slice(-5).reverse().map(s => Number(s.earned)) }]
  };

  const pieData = [
    { name: 'שכר', val: totalEarned, color: '#00adf5', legendFontColor: '#fff' },
    { name: 'יעד חסר', val: Math.max(0, Number(config.monthlyGoal) - totalEarned), color: '#333', legendFontColor: '#fff' }
  ];

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>מגמת שכר במחזור</Text>
      <LineChart
        data={lineData} width={screenWidth - 32} height={180}
        chartConfig={chartConfig} bezier style={styles.chart}
      />
      
      <View style={styles.summaryCard}>
        <StatItem label="ברוטו מחזור" value={`₪${Math.round(totalEarned)}`} color="#4cd964" />
        <StatItem label="סה״כ שעות" value={totalHours.toFixed(1)} color="#fff" />
        <StatItem label="ממוצע למשמרת" value={`₪${Math.round(totalEarned / monthlyShifts.length)}`} color="#ff9500" />
      </View>

      <Text style={styles.title}>עמידה ביעד חודשי</Text>
      <PieChart
        data={pieData} width={screenWidth - 32} height={180}
        chartConfig={chartConfig} accessor="val" backgroundColor="transparent" paddingLeft="15"
      />
    </ScrollView>
  );
}

const StatItem = ({ label, value, color }) => (
  <View style={styles.statRow}>
    <Text style={[styles.statVal, { color }]}>{value}</Text>
    <Text style={styles.statLab}>{label}</Text>
  </View>
);

const chartConfig = {
  backgroundGradientFrom: '#1c1c1e', backgroundGradientTo: '#1c1c1e',
  color: (opacity = 1) => `rgba(0, 173, 245, ${opacity})`,
  labelColor: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  title: { color: '#8e8e93', textAlign: 'right', marginBottom: 10, marginTop: 15 },
  chart: { borderRadius: 12 },
  summaryCard: { backgroundColor: '#1c1c1e', borderRadius: 12, padding: 16, marginTop: 15 },
  statRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 10, borderBottomWidth: 0.5, borderBottomColor: '#333' },
  statLab: { color: '#aaa' },
  statVal: { fontWeight: 'bold', fontSize: 16 },
  empty: { color: '#444', textAlign: 'center', marginTop: 100 }
});

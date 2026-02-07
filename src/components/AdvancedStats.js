import React from 'react';
import { View, Text, StyleSheet, ScrollView, Dimensions, Table } from 'react-native';
import { LineChart, PieChart } from 'react-native-chart-kit';

const screenWidth = Dimensions.get('window').width;

export default function AdvancedStats({ monthlyShifts, config }) {
  if (monthlyShifts.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>אין מספיק נתונים להצגת גרפים</Text>
      </View>
    );
  }

  // עיבוד נתונים לגרף קווים (שכר לאורך זמן)
  const lineData = {
    labels: monthlyShifts.slice(-6).map(s => s.date.split('-')[2]), // 6 משמרות אחרונות
    datasets: [{
      data: monthlyShifts.slice(-6).map(s => Number(s.earned) || 0),
      color: (opacity = 1) => `rgba(0, 173, 245, ${opacity})`, 
      strokeWidth: 3
    }]
  };

  // עיבוד נתונים לגרף עוגה (סוגי משמרות)
  const typesCount = monthlyShifts.reduce((acc, s) => {
    acc[s.type] = (acc[s.type] || 0) + 1;
    return acc;
  }, {});

  const pieData = [
    { name: 'רגיל', population: typesCount['עבודה'] || 0, color: '#00adf5', legendFontColor: '#fff' },
    { name: 'שבת', population: typesCount['שבת'] || 0, color: '#ff9500', legendFontColor: '#fff' },
    { name: 'מחלה', population: typesCount['מחלה'] || 0, color: '#ff3b30', legendFontColor: '#fff' },
    { name: 'חופש', population: typesCount['חופש'] || 0, color: '#4cd964', legendFontColor: '#fff' },
  ];

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <Text style={styles.sectionTitle}>מגמת הכנסות (משמרות אחרונות)</Text>
      <LineChart
        data={lineData}
        width={screenWidth - 32}
        height={220}
        chartConfig={chartConfig}
        bezier
        style={styles.chart}
      />

      <View style={styles.row}>
        <View style={styles.card}>
          <Text style={styles.cardTitle}>התפלגות משמרות</Text>
          <PieChart
            data={pieData}
            width={screenWidth - 32}
            height={200}
            chartConfig={chartConfig}
            accessor="population"
            backgroundColor="transparent"
            paddingLeft="15"
          />
        </View>
      </View>

      <Text style={styles.sectionTitle}>סיכום שכר מפורט</Text>
      <View style={styles.tableCard}>
        <TableRow label="סה״כ ברוטו" value={`₪${calculateTotal(monthlyShifts)}`} isBold />
        <TableRow label="שעות נוספות (125%)" value={calculateOT(monthlyShifts, '125')} />
        <TableRow label="שעות נוספות (150%)" value={calculateOT(monthlyShifts, '150')} />
        <TableRow label="החזר נסיעות" value={`₪${calculateTravel(monthlyShifts, config)}`} />
        <TableRow label="ממוצע שכר למשמרת" value={`₪${Math.round(calculateTotal(monthlyShifts) / monthlyShifts.length)}`} />
      </View>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

// רכיב עזר לשורת טבלה
const TableRow = ({ label, value, isBold = false }) => (
  <View style={styles.tableRow}>
    <Text style={[styles.tableValue, isBold && styles.boldText]}>{value}</Text>
    <Text style={[styles.tableLabel, isBold && styles.boldText]}>{label}</Text>
  </View>
);

// פונקציות עזר לחישובים
const calculateTotal = (shifts) => shifts.reduce((sum, s) => sum + (Number(s.earned) || 0), 0).toLocaleString();
const calculateTravel = (shifts, config) => (shifts.length * Number(config.travelDaily || 0)).toFixed(2);
const calculateOT = (shifts, type) => "8.5 ש׳"; // כאן תבוא לוגיקת צבירת שעות נוספות

const chartConfig = {
  backgroundGradientFrom: '#1c1c1e',
  backgroundGradientTo: '#1c1c1e',
  color: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
  labelColor: (opacity = 1) => `rgba(142, 142, 147, ${opacity})`,
  decimalPlaces: 0,
  propsForDots: { r: "6", strokeWidth: "2", stroke: "#00adf5" }
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: '#000' },
  sectionTitle: { color: '#8e8e93', fontSize: 13, textTransform: 'uppercase', marginBottom: 12, marginTop: 20, textAlign: 'right' },
  chart: { borderRadius: 16, marginVertical: 8 },
  card: { backgroundColor: '#1c1c1e', borderRadius: 16, padding: 16, width: '100%' },
  cardTitle: { color: '#fff', fontSize: 16, fontWeight: 'bold', textAlign: 'right', marginBottom: 10 },
  tableCard: { backgroundColor: '#1c1c1e', borderRadius: 16, padding: 16 },
  tableRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 12, borderBottomWidth: 0.5, borderBottomColor: '#333' },
  tableLabel: { color: '#aaa', fontSize: 14 },
  tableValue: { color: '#fff', fontSize: 14, fontWeight: '500' },
  boldText: { fontWeight: 'bold', color: '#4cd964', fontSize: 16 },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyText: { color: '#444' }
});

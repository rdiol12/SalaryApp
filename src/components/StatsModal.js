import React from 'react';
import { Modal, View, Text, StyleSheet, Dimensions, ScrollView, TouchableOpacity, SafeAreaView } from 'react-native';
import { BarChart } from 'react-native-chart-kit';

export default function StatsModal({ visible, onClose, shifts, config }) {
  const screenWidth = Dimensions.get('window').width;

  // נתונים לדוגמה עבור הגרף (בפרויקט מלא נשלוף את זה מההיסטוריה ב-AsyncStorage)
  const data = {
    labels: ["ספט'", "אוק'", "נוב'", "דצמ'", "ינו'", "פבר'"],
    datasets: [
      {
        data: [7200, 8100, 6900, 9400, 8800, 10200] // אלו נתוני הנטו החודשיים
      }
    ]
  };

  const chartConfig = {
    backgroundColor: "#1c1c1e",
    backgroundGradientFrom: "#1c1c1e",
    backgroundGradientTo: "#2c2c2e",
    decimalPlaces: 0,
    color: (opacity = 1) => `rgba(0, 173, 245, ${opacity})`,
    labelColor: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
    style: { borderRadius: 16 },
    propsForDots: { r: "6", strokeWidth: "2", stroke: "#00adf5" }
  };

  return (
    <Modal visible={visible} animationType="slide">
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose}><Text style={styles.closeText}>סגור</Text></TouchableOpacity>
          <Text style={styles.title}>סטטיסטיקת שכר</Text>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView contentContainerStyle={styles.content}>
          <Text style={styles.sectionTitle}>הכנסות נטו (חצי שנה אחרונה)</Text>
          
          <View style={styles.chartContainer}>
            <BarChart
              data={data}
              width={screenWidth - 40}
              height={220}
              yAxisLabel="₪"
              chartConfig={chartConfig}
              verticalLabelRotation={0}
              fromZero
              style={{ marginVertical: 8, borderRadius: 16 }}
            />
          </View>

          <View style={styles.insightBox}>
            <Text style={styles.insightTitle}>💡 תובנה חודשית</Text>
            <Text style={styles.insightText}>
              החודש הרווחת 12% יותר מהממוצע שלך בחצי השנה האחרונה. כל הכבוד!
            </Text>
          </View>

          <View style={styles.statsGrid}>
            <StatCard label="ממוצע משמרת" value="₪420" />
            <StatCard label="שעות החודש" value="164 ש'" />
          </View>
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}

const StatCard = ({ label, value }) => (
  <View style={styles.card}>
    <Text style={styles.cardLabel}>{label}</Text>
    <Text style={styles.cardValue}>{value}</Text>
  </View>
);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#121212' },
  header: { flexDirection: 'row-reverse', justifyContent: 'space-between', padding: 20, backgroundColor: '#1c1c1e' },
  title: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  closeText: { color: '#00adf5', fontSize: 16 },
  content: { padding: 20 },
  sectionTitle: { color: '#fff', fontSize: 16, marginBottom: 15, textAlign: 'right' },
  chartContainer: { alignItems: 'center', marginBottom: 30 },
  insightBox: { backgroundColor: '#1c1c1e', padding: 15, borderRadius: 12, marginBottom: 20 },
  insightTitle: { color: '#00adf5', fontWeight: 'bold', marginBottom: 5, textAlign: 'right' },
  insightText: { color: '#aaa', textAlign: 'right' },
  statsGrid: { flexDirection: 'row-reverse', justifyContent: 'space-between' },
  card: { backgroundColor: '#1c1c1e', width: '48%', padding: 20, borderRadius: 12, alignItems: 'center' },
  cardLabel: { color: '#aaa', fontSize: 12, marginBottom: 5 },
  cardValue: { color: '#fff', fontSize: 20, fontWeight: 'bold' }
});

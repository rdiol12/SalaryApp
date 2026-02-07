import React, { useState } from 'react';
import { SafeAreaView, ScrollView, View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Calendar } from 'react-native-calendars';
import { darkTheme } from './src/constants/theme';
import { calculateNetSalary } from './src/utils/taxCalculator';
import GoalProgressBar from './src/components/GoalProgressBar';

export default function App() {
  const [shifts, setShifts] = useState([]);
  const [goal, setGoal] = useState('8000');
  const theme = darkTheme;

  const grossTotal = shifts.reduce((sum, s) => sum + s.totalPay, 0);
  const netInfo = calculateNetSalary(grossTotal);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.bg }}>
      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 100 }}>
        <Text style={{ color: theme.secondary, fontSize: 16 }}>ברוטו מצטבר</Text>
        <Text style={{ color: theme.text, fontSize: 48, fontWeight: '900' }}>₪{grossTotal.toLocaleString()}</Text>
        
        <GoalProgressBar current={grossTotal} goal={goal} theme={theme} />
        
        <View style={[styles.glassCard, { borderColor: theme.border }]}>
          <Text style={{ color: theme.accent, fontWeight: 'bold', fontSize: 18 }}>נטו משוער: ₪{netInfo.net}</Text>
          <Text style={{ color: theme.secondary, fontSize: 12, marginTop: 5 }}>
            פנסיה: ₪{netInfo.pension} | מס: ₪{netInfo.tax}
          </Text>
        </View>

        <View style={{ borderRadius: 20, overflow: 'hidden', marginTop: 20 }}>
          <Calendar theme={{ calendarBackground: '#2C2C2E', dayTextColor: '#FFF', monthTextColor: '#0A84FF', todayTextColor: '#0A84FF' }} />
        </View>
      </ScrollView>

      <TouchableOpacity style={styles.fab} onPress={() => {}}>
        <Text style={{ color: '#FFF', fontSize: 35, fontWeight: '200' }}>+</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  glassCard: { padding: 20, borderRadius: 24, borderWidth: 1, backgroundColor: 'rgba(255,255,255,0.05)' },
  fab: { 
    position: 'absolute', bottom: 30, right: 30, width: 65, height: 65, borderRadius: 32.5, 
    backgroundColor: '#0A84FF', justifyContent: 'center', alignItems: 'center',
    shadowColor: '#0A84FF', shadowOpacity: 0.4, shadowRadius: 10, elevation: 5
  }
});

